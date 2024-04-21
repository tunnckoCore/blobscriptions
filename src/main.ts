// import 'dotenv/config';

import { Hono } from 'npm:hono';
import { bytesToString, stringify } from 'npm:viem';

import { blobscriptions } from './index.ts';

const webhooksList = ['https://webhook.site/fef05c0e-9770-45c4-9284-50875f416f25'];
const handlersList = [dbPayloadHandler];

/**
 * This file is the entry point for the indexing server, run on something like Fly.io servers.
 * It uses the `blobscriptions` function to handle incoming payloads from the blockchain,
 * and then sends them to the provided webhook URLs, or calls the provided functions.
 */

blobscriptions(webhooksList, { logging: true }).catch((e) => {
  console.error('Failure in blobscriptions handling...', e);
});

/**
 * Display server below
 */

const app = new Hono();

app.get('/', async (c) =>
  c.json({
    message:
      'Hello, blob world! For more info, visit https://github.com/tunnckocore/blobscriptions repository.',
  }),
);

async function dbPayloadHandler(payload: any) {
  const maxPerMintMap = {
    blobbed: 10000,
    blob: 1000,
    wgw: 100,
  };

  console.log('indexing server received payload:', payload);

  let data;

  try {
    const attachmentContentStr = bytesToString(payload.attachment.content);
    const attachment = JSON.parse(
      attachmentContentStr
        .replace(/^[\uFEFF\r\n\t]*|[\uFEFF\r\n\t]*|[\uFEFF\r\n\t]*$/gi, '')
        .toLowerCase(),
    );

    if (attachment.protocol === 'blob20' && attachment.token) {
      if (!attachment.token.ticker) {
        return;
      }

      attachment.token.ticker = attachment.token.ticker.toLowerCase();

      data = {
        block_number: Number(payload.block.number),
        block_hash: payload.block.hash,
        block_timestamp: Number(payload.block.timestamp),
        transaction_hash: payload.transaction.hash,
        transaction_index: Number(payload.transaction.transactionIndex),
        transaction_fee: 0, // todo
        transaction_burnt_fee: 0, // todo
        transaction_value: Number(payload.transaction.value),
        from_address: payload.transaction.from,
        to_address: payload.transaction.to,
        is_valid: true,
        operation: attachment.token.operation,
        ticker: attachment.token.ticker,
        amount: Number(attachment.token.amount || 0),
        attachment_sha: payload.attachment.sha,
        attachment_content_type: bytesToString(payload.attachment.contentType),
        gas_price: Number(payload.transaction.gas_price),
        gas_used: 0, // todo
        timestamp: new Date(Number(payload.block.timestamp) * 1000).toISOString(),
        blob20: stringify(attachment),
      };

      // @ts-ignore bruh
      const maxPerMint = maxPerMintMap[attachment.token.ticker];

      if (attachment.token.operation === 'mint' && attachment.token.amount > maxPerMint) {
        console.log('max per mint exceeded:', attachment.token.amount, maxPerMint);
        data.is_valid = false;
      } else if (attachment.token.operation === 'mint') {
        console.log(
          'mint success',
          payload.transaction.hash,
          attachment.token?.amount,
          attachment.token?.ticker,
        );
      }
    }
  } catch (e) {
    console.log('indexing failed to parse:', payload.transaction.hash, e);
  }

  if (!data) {
    console.log('failure to parse or handle tx:', payload.transaction.hash);
    return;
  }

  console.log('normalized data:', data);
  // await writeToXata(data);
}

// async function writeToXata(data: any) {
//   const record = await xata.db.blob20_transactions.create(data);

//   console.log('record written:', data.transaction_hash, record.id);
// }

// app.get('/tokens/wgw', async (c: Context) => {
//   const address = c.req.query('address')?.toLowerCase();
//   const wgwData = await import('./misc/wgw-final-mints.js').then((x) => x.default);

//   const { mints, ...data } = wgwData;
//   const result = { ...data };

//   if (address && address.length === 42 && address.startsWith('0x')) {
//     const addressMints = mints.filter((x: any) => x.to_address === address);

//     // @ts-ignore bruh
//     result.total_address_balance = addressMints.reduce(
//       (acc: number, x: any) => acc + x.token_amount,
//       0,
//     );

//     // @ts-ignore bruh
//     result.mints = addressMints;
//   } else {
//     // @ts-ignore bruh
//     result.mints = mints;
//   }

//   return c.json(result);
// });

// app.get('/tokens/blob', async (c) => {
//   return c.json({
//     last_mint_block: 19575159,
//     last_mint_txhash: '0x64d770a9b3491cf5913b6a1cfc2a1b179f170f08f0254f6045095c98c8bd3ac7',
//     last_mint_txindex: 134,
//     total_json_mint_ops: 62044,
//     total_text_mint_ops: 8269,
//     total_mint_op_count: 70313,
//     balances: blobBalanceRanked,
//   });
// });

Deno.serve({ port: 3000 }, app.fetch);
