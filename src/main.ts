import 'dotenv/config';

// import { drizzle } from 'drizzle-orm/xata-http';
// import { ge, iContains, le } from 'npm:@xata.io/client';
import { Context, Hono } from 'npm:hono';
import { bytesToString, formatEther, hexToString, stringify } from 'npm:viem';

// import blobBalances from '../blob-token-balances.ts';
import blobBalanceRanked from '../blob-token-ranked-by-balance.ts';
import { blobscriptions } from './index.ts';
import { xata } from './xata-client.ts';

// const db = drizzle(xata);

/**
 * This file is the entry point for the indexing server, run on something like Fly.io servers.
 * It uses the `blobscriptions` function to handle incoming payloads from the blockchain,
 * and then sends them to the provided webhook URLs, or calls the provided functions.
 */

const maxPerMintMap = {
  blobbed: 10000,
  blob: 1000,
  wgw: 100,
};

blobscriptions(
  [
    'https://webhook.site/fef05c0e-9770-45c4-9284-50875f416f25',
    async (payload: any) => {
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

      await writeToXata(data);
    },
  ],
  { logging: true },
).catch((e) => {
  console.error('Failure in blobscriptions handling...', e);
});

async function writeToXata(data: any) {
  const record = await xata.db.blob20_transactions.create(data);

  console.log('record written:', data.transaction_hash, record.id);
}

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

app.get('/tokens/wgw', async (c: Context) => {
  const address = c.req.query('address')?.toLowerCase();
  const wgwData = await import('./misc/wgw-final-mints.js').then((x) => x.default);

  const { mints, ...data } = wgwData;
  const result = { ...data };

  if (address && address.length === 42 && address.startsWith('0x')) {
    const addressMints = mints.filter((x: any) => x.to_address === address);

    // @ts-ignore bruh
    result.total_address_balance = addressMints.reduce(
      (acc: number, x: any) => acc + x.token_amount,
      0,
    );

    // @ts-ignore bruh
    result.mints = addressMints;
  } else {
    // @ts-ignore bruh
    result.mints = mints;
  }

  return c.json(result);
});

app.get('/tokens/blob', async (c) => {
  return c.json({
    last_mint_block: 19575159,
    last_mint_txhash: '0x64d770a9b3491cf5913b6a1cfc2a1b179f170f08f0254f6045095c98c8bd3ac7',
    last_mint_txindex: 134,
    total_json_mint_ops: 62044,
    total_text_mint_ops: 8269,
    total_mint_op_count: 70313,
    balances: blobBalanceRanked,
  });
});

// sort by balance value descending
// const sortedBalances = Object.entries(blobBalances).sort(
//   (a: any[], b: any[]) => b[1].balance - a[1].balance,
// );

// console.log(
//   Object.fromEntries(
//     sortedBalances.map(([k, v]) => [
//       k,
//       { balance: v.balance, total_fee: formatEther(BigInt(v.transaction_fee)) },
//     ]),
//   ),
// );

// console.log(Object.entries(blobBalances).sort((a, b) => ));

// app.get('/tokens/blob', async (c) => {
// let result = await xata.db.blob20_transactions
//   .filter('is_valid', true)
//   .filter('block_number', ge(19526198)) // gte
//   .filter('block_number', le(19576966)) // lte
//   .filter('ticker', 'blob')
//   .filter('amount', le(1000)) // lte
//   .filter('operation', 'mint')
//   .sort('block_number', 'asc')
//   .sort('transaction_index', 'asc')
//   .select([
//     'block_number',
//     'transaction_hash',
//     'transaction_index',
//     'transaction_fee',
//     'to_address',
//     'amount',
//     'is_valid',
//     'attachment_content_type',
//     'blob20',
//   ])

//   .getPaginated({
//     pagination: {
//       size: 1000,
//     },
//   });

// let supply = 0;
// let count = 0;
// let fees = 0;
// let items = Array.from(result.records);
// const minters = {} as any;

// for (const x of items) {
//   count += 1;
//   fees += x.transaction_fee || 0;
//   console.log('row:', x.block_number, x.transaction_hash, x.transaction_index);
//   console.log('supply:', supply, '+', x.amount);
//   console.log('count:', count);

//   const addr = x.to_address?.toLowerCase() || '_';
//   minters[addr] = minters[addr] || { balance: 0, transaction_fee: 0 };
//   minters[addr].balance = minters[addr].balance || 0;
//   minters[addr].balance += x.amount;
//   minters[addr].transaction_fee = minters[addr].transaction_fee || 0;
//   minters[addr].transaction_fee += x.transaction_fee;

//   supply += x.amount || 0;
// }

// while (result.hasNextPage()) {
//   result = await result.nextPage();

//   for (const x of Array.from(result.records)) {
//     count += 1;
//     fees += x.transaction_fee || 0;
//     console.log('block:', x.block_number, 'tx:', x.transaction_hash, x.transaction_index);
//     console.log('supply:', supply, '+', x.amount);
//     console.log('count:', count, 'fees:', fees);

//     const addr = x.to_address?.toLowerCase() || '_';
//     minters[addr] = minters[addr] || { balance: 0, transaction_fee: 0 };
//     minters[addr].balance = minters[addr].balance || 0;
//     minters[addr].balance += x.amount;
//     minters[addr].transaction_fee = minters[addr].transaction_fee || 0;
//     minters[addr].transaction_fee += x.transaction_fee;

//     supply += x.amount || 0;
//     if (supply > 69_000_000) {
//       minters.lastMinter = x.to_address;
//       minters[addr].balance - 31;

//       console.log(supply, x);
//       console.log('bruh 1');
//       break;
//     }
//   }
//   if (supply > 69_000_000) {
//     console.log('bruh 2 done');
//     break;
//   }
// }

// console.log(Object.keys(minters).length);

//   return c.json({ foo: 1 });
// });

Deno.serve({ port: 3000 }, app.fetch);
