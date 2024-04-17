import type { Block, Chain, TransactionBase, TransactionEIP4844, Transport } from 'viem';

export type TrackBlobsOptions = {
  chain?: Chain;
  transport?: Transport;
  onlyBlobscriptions?: boolean;
  trimInput?: boolean;
  logging?: boolean;
};

export type TxPayload = {
  transaction: Omit<TransactionBase & TransactionEIP4844, 'accessList'>;
  block: Pick<
    Block,
    | 'timestamp'
    | 'miner'
    | 'blobGasUsed'
    | 'gasUsed'
    | 'gasLimit'
    | 'baseFeePerGas'
    | 'hash'
    | 'number'
  >;
  attachment?: BlobscriptionCreationAttachment;
};

export type HandlerFn = (payload: TxPayload) => Promise<void> | void;

export type BlobscriptionCreationAttachment = {
  contentType: Uint8Array | string;
  content: Uint8Array | string;
  sha?: `0x${string}`;
};

// // remappings for inserting into database columns
// const blockInfo = {
//   block_timestamp: payload.block.timestamp,
//   block_miner: payload.block.miner,
//   block_blob_gas_used: payload.block.blobGasUsed,
//   block_gas_used: payload.block.gasUsed,
//   block_gas_limit: payload.block.gasLimit,
//   block_base_fee_per_gas: payload.block.baseFeePerGas,
//   block_hash: payload.block.hash,
//   block_number: payload.block.number,
// };

// const chain_id = payload.transaction.chainId;

// const txnInfo = {
//   from_address: payload.transaction.from,
//   to_address: payload.transaction.to,
//   transaction_hash: payload.transaction.hash,
//   transaction_value: payload.transaction.value,
//   transaction_index: payload.transaction.transactionIndex,
//   transaction_nonce: payload.transaction.nonce,
//   transaction_input: payload.transaction.input,
// };

// const attachment = {
//   attachment_content: payload?.attachment?.content || null,
//   attachment_content_type: payload?.attachment?.contentType || null,
//   attachment_sha: payload?.attachment?.sha || null,
// };

// convert above to a single type

// export type Blobscription = {
//   chain_id: number;

//   block_hash: `0x${string}` | null;
//   block_number: string | null;
//   block_timestamp: string;
//   block_miner: `0x${string}`;
//   block_blob_gas_used: string;
//   block_gas_used: string;
//   block_gas_limit: string;
//   block_base_fee_per_gas: string | null;

//   from_address: `0x${string}`;
//   to_address: `0x${string}` | null;

//   transaction_hash: `0x${string}`;
//   transaction_value: string;
//   transaction_index: string;
//   transaction_nonce: string;
//   transaction_input: `0x${string}`;

//   attachment_content: `0x${string}` | null;
//   attachment_content_type: string | null;
//   attachment_sha: string | null;
// };
