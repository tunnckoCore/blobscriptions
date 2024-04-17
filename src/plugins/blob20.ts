import { bytesToString } from 'npm:viem';

import type { TxPayload } from '../types.ts';

/**
 * Plugin to process, normalize and validate a payload is correct and compliant BLOB-20 token
 */
export default async function pluginBlob20(payload: TxPayload) {
  if (!payload.attachment) {
    return payload;
  }

  let blob20;

  let contentType = bytesToString(payload.attachment.contentType as Uint8Array).toLowerCase();

  if (contentType === 'text/plain') {
    const str = bytesToString(payload.attachment.content as Uint8Array).toLowerCase();

    if (
      str.length > 10 &&
      str.includes('"protocol"') &&
      str.includes('"blob20"') &&
      str.includes('"token"') &&
      str.startsWith('{') &&
      str.endsWith('}')
    ) {
      contentType = 'application/json';
    }
  }

  if (payload.attachment.content && contentType) {
    if (contentType.includes('application') && contentType.includes('json')) {
      try {
        const attachmentContent = bytesToString(
          payload.attachment.content as Uint8Array,
        ).toLowerCase();

        const content = JSON.parse(attachmentContent);

        if (content && content.protocol && content.protocol === 'blob20') {
          if (content.token.ticker.length > 0) {
            content.token.ticker = content.token.ticker.toUpperCase();
            blob20 = content;
          }
        }
      } catch (e) {
        console.log(
          'Failed to parse/process JSON blobbed token (most likely wrong formatted json):',
          contentType,
          payload.transaction.hash,
          payload.block.number,
        );
      }
    }
  }

  return { ...payload, blob20 };
}
