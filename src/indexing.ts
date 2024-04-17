import 'dotenv/config';

import { gunzipSync } from 'fflate';
import pMapSeries from 'p-map-series';
import {
  bytesToString,
  createPublicClient,
  hexToBytes,
  http,
  stringToHex,
  type Transaction,
  type TransactionBase,
  type TransactionEIP4844,
} from 'viem';
import { mainnet } from 'viem/chains';

import type { HandlerFn, TrackBlobsOptions } from '@/types.ts';

export * from '@/types.ts';

export async function trackBlobscriptions(handler: HandlerFn, options?: TrackBlobsOptions) {
  const opts = {
    logging: false,
    trimCalldataInput: true,
    onlyBlobscriptions: true,
    chain: mainnet,
    transport: http('https://1rpc.io/eth'),
    ...(options || {}),
  };

  const client = createPublicClient({ chain: opts.chain, transport: opts.transport });

  client.watchBlocks({
    emitMissed: true,
    blockTag: 'latest',
    includeTransactions: true,
    onBlock: async (currentBlock) => {
      opts.logging && console.log('block:', currentBlock.number);

      const allBlockTransactions = [...currentBlock.transactions];
      const blobTxs = allBlockTransactions.filter((tx) => {
        if (tx.type !== 'eip4844') return false;
        const input = tx.input;

        if (opts.onlyBlobscriptions && input.startsWith(stringToHex('data:'))) {
          return true;
        }

        if (opts.onlyBlobscriptions && input.startsWith('0x1f8b')) {
          try {
            const unzipped = gunzipSync(hexToBytes(input));
            const text = bytesToString(unzipped);

            if (text?.startsWith('data:')) {
              return true;
            }
          } catch (e) {
            return false;
          }

          return false;
        }

        return !opts.onlyBlobscriptions;
      });

      if (blobTxs.length === 0) {
        return;
      }

      opts.logging && console.log('block txs:', allBlockTransactions.length);
      opts.logging && console.log('blob txs:', blobTxs.length);

      // @ts-ignore bruh
      delete currentBlock.transactions;

      await pMapSeries(
        blobTxs as any,
        async (blobTx: Transaction & TransactionBase & TransactionEIP4844) => {
          // @ts-ignore bruh
          blobTx.input = opts.trimCalldataInput ? blobTx.input.slice(0, 200) : blobTx.input;

          const txn = { ...blobTx };

          // @ts-ignore fvck off
          delete txn.accessList;
          txn.blobVersionedHashes = txn.blobVersionedHashes || [];

          opts.logging && console.log('txn:', txn.blobVersionedHashes.length, txn.hash);

          try {
            await handler({
              transaction: txn,
              block: {
                timestamp: currentBlock.timestamp,
                miner: currentBlock.miner,
                blobGasUsed: currentBlock.blobGasUsed,
                gasUsed: currentBlock.gasUsed,
                gasLimit: currentBlock.gasLimit,
                baseFeePerGas: currentBlock.baseFeePerGas,
                hash: currentBlock.hash,
                number: currentBlock.number,
              },
            });

            console.log('handler called for blob txn:', txn.hash, txn.blockNumber);
          } catch (e: any) {
            console.error('err in handler', txn.hash, e?.message?.slice(0, 100));
          }
        },
      );
    },
  });
}
