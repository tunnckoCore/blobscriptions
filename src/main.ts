// import 'dotenv/config';

import { Hono } from 'npm:hono';

import { blobscriptions, dbBlob20PayloadHandler } from './index.ts';

const webhooksList = ['https://webhook.site/fef05c0e-9770-45c4-9284-50875f416f25'];
const handlersList = [dbBlob20PayloadHandler];

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
