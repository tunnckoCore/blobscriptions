import { decode as decodeCbor } from 'cborg';
import { gunzipSync } from 'fflate';
import pMapSeries from 'p-map-series';
import { fromBlobs, sha256, toBytes as viemToBytes } from 'viem';

import type { BlobscriptionCreationAttachment, TxPayload } from '@/types.ts';

export default async function pluginBlobCreation(payload: TxPayload) {
  const { attachment } = (await processBlobs({ ...payload })) as TxPayload & {
    attachment: BlobscriptionCreationAttachment;
  };

  return { ...payload, attachment };
}

async function processBlobs(payload: TxPayload) {
  await new Promise((resolve) => setTimeout(resolve, 15_000));

  const blobsRaw = await pMapSeries(payload.transaction.blobVersionedHashes, async (blobHash) => {
    const resp = await fetch(
      `https://eth.blockscout.com/api/v2/blobs/${blobHash}`,
      // `https://blobscan.com/api/trpc/blob.getByBlobId?input={%22json%22:{%22id%22:%22${blobHash}%22}}`,
    );

    if (!resp.ok) {
      console.log('failed to blob from upstream blockscout api:', resp.status, resp.statusText);
      return;
    }

    const result = await resp.json();

    return result;
  });

  const blobsData = blobsRaw.filter(Boolean);

  if (blobsData.length === 0) {
    return;
  }

  const blobs = blobsData.map((x) => x.blob_data);
  const blobsDecoded = fromBlobs({ blobs, to: 'bytes' });
  const attachment = decodeCbor(tryUngzip(blobsDecoded));

  let newAttachment: BlobscriptionCreationAttachment;

  if (attachment.content && attachment.contentType) {
    newAttachment = await processAttachment({ ...attachment });

    payload.attachment = newAttachment;
    console.log('attachment processed');
  }

  return { ...payload };
}

export async function processAttachment(attachment: BlobscriptionCreationAttachment) {
  const contentType = tryUngzip(toBytes(attachment.contentType));
  const content = tryUngzip(toBytes(attachment.content));

  const contentTypeHash = sha256(contentType);
  const contentHash = sha256(content);

  const combinedHash = contentTypeHash.replace(/^0x/, '') + contentHash.replace(/^0x/, '');
  const attachmentSha = sha256(combinedHash as `0x${string}`);

  return { sha: attachmentSha, contentType, content };
}

export function toBytes(x: any) {
  return x instanceof Uint8Array ? x : viemToBytes(x);
}

export function tryUngzip(data) {
  const u8data = toBytes(data);

  let decompressedContentU8: Uint8Array | null = null;

  if (u8data && u8data.length > 0 && u8data[0] === 31 && u8data[1] === 139 && u8data[2] === 8) {
    decompressedContentU8 = gunzipSync(u8data);
  }

  return decompressedContentU8 || u8data;
}
