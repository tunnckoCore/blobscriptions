import { bytesToHex, bytesToString, stringify } from 'npm:viem';

import { trackBlobscriptions } from './indexing.ts';
import pluginBlob20 from './plugins/blob20.ts';
import pluginBlobCreation from './plugins/blobs-creation.ts';
import type { TrackBlobsOptions } from './types.ts';

export * from 'viem';
export * from './types.ts';

export { trackBlobscriptions, pluginBlob20, pluginBlobCreation };

/**
 * This function is a simple wrapper around the `trackBlobscriptions` function, which
 * takes an array of webhook URLs or functions to send the payload to.
 *
 * It can be used as a library by other indexing servers and such.
 *
 * @param handlers - an array of functions or WebHook URLs to send the payload to
 * @param options - optional options object, passed to trackBlobscriptions function
 */

export async function blobscriptions(
  handlers: any | any[],
  options?: TrackBlobsOptions & { blob20?: boolean },
) {
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

export async function dbBlob20PayloadHandler(payload: any) {
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
    return { error: 'failure to parse or handle tx', payload };
  }

  console.log('normalized data:', data);
  // await writeToXata(data);

  return { data, payload };
}
