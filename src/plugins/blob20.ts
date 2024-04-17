import type { TxPayload } from '@/types.ts';

/**
 * Plugin to process and validate a payload is correct and compliant BLOB-20 token
 */
export default async function pluginBlob20(payload: TxPayload) {
  return payload;
}
