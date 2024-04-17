import { bytesToHex, bytesToString, stringify } from 'viem';

import { trackBlobscriptions, type TrackBlobsOptions } from '@/indexing.ts';
import pluginBlob20 from '@/plugins/blob20';
import pluginBlobCreation from '@/plugins/blobs-creation';

export { trackBlobscriptions, pluginBlob20, pluginBlobCreation };
export type {
  TxPayload,
  HandlerFn,
  BlobscriptionCreationAttachment,
  TrackBlobsOptions,
} from '@/types.ts';

/**
 * This function is a simple wrapper around the `trackBlobscriptions` function, which
 * takes an array of webhook URLs or functions to send the payload to.
 *
 * It can be used as a library by other indexing servers and such.
 *
 * @param handlers - an array of functions or WebHook URLs to send the payload to
 * @param options - optional options object, passed to trackBlobscriptions function
 */

export async function blobscriptions(handlers, options?: TrackBlobsOptions & { blob20?: boolean }) {
  const opts = { blob20: true, ...options };

  await trackBlobscriptions(async (payload) => {
    payload = await pluginBlobCreation(payload);
    payload = opts.blob20 ? await pluginBlob20(payload) : payload;

    console.log('payload tx:', payload.transaction.hash, payload.block.number);

    const urls = Array.isArray(handlers) ? handlers : [handlers];
    const webhooks = urls.filter(Boolean);

    if (webhooks.length === 0) {
      throw new Error('No valid webhook URLs provided');
    }

    await Promise.all(
      webhooks.map(async (hook) => {
        if (typeof hook === 'function') {
          try {
            await hook(payload);
          } catch (e) {
            console.log('failure in payload handler:', e);
          }
        }

        if (typeof hook === 'string' && hook.startsWith('http')) {
          try {
            const att = payload.attachment
              ? {
                  content: bytesToHex(payload.attachment.content as Uint8Array),
                  contentType: bytesToString(payload.attachment.contentType as Uint8Array),
                  sha: payload.attachment.sha,
                }
              : null;

            fetch(hook, {
              method: 'POST',
              body: stringify({
                type: 'BLOBSCRIPTIONS',
                timestamp: Date.now(),
                payload: { ...payload, attachment: att },
              }),
              headers: { 'content-type': 'application/json' },
            });
          } catch (e) {
            console.log('failed to send webhook:', hook, e);
          }
        }
      }),
    );
  }, options);
}
