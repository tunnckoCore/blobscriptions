import { Context, Hono } from 'npm:hono';

import { blobscriptions } from './index.ts';

/**
 * This file is the entry point for the indexing server, run on something like Fly.io servers.
 * It uses the `blobscriptions` function to handle incoming payloads from the blockchain,
 * and then sends them to the provided webhook URLs, or calls the provided functions.
 */

blobscriptions(
  [
    'https://webhook.site/fef05c0e-9770-45c4-9284-50875f416f25',
    (payload: any) => {
      console.log('indexing server received payload:', payload);
    },
  ],
  { logging: true },
).catch((e) => {
  console.error('Failure in blobscriptions handling...', e);
});

const app = new Hono();

app.get('/', async (c) =>
  c.json({
    message:
      'Hello, blob world! For more info, visit https://github.com/tunnckocore/blobscriptions repository.',
  }),
);

app.get('/tokens/wgw', async (c: Context) => {
  const address = c.req.query('address')?.toLowerCase();
  const wgwData = await import('../wgw-final-mints.js').then((x) => x.default);

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
  }

  return c.json(result);
});

Deno.serve({ port: 3000 }, app.fetch);
