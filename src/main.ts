import { Hono } from 'npm:hono';

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

Deno.serve({ port: 3000 }, app.fetch);
