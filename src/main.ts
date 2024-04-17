import { blobscriptions } from '@/index.ts';

/**
 * This file is the entry point for the indexing server, run on something like Fly.io servers.
 * It uses the `blobscriptions` function to handle incoming payloads from the blockchain,
 * and then sends them to the provided webhook URLs, or calls the provided functions.
 */

blobscriptions([
  'https://some-webhook-url.com/foo',
  (payload) => {
    console.log('indexing server received payload:', payload);
  },
  'https://some-other-webhook-receiver.com',
]).catch((e) => {
  console.error('Failure in blobscriptions handling...', e);
});
