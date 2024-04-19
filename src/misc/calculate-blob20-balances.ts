// https://api.ethscriptions.com/v2/ethscriptions
// ?reverse=true&max_results=1000&transaction_hash_only=true&attachment_present=true&attachment_content_type[]=application/json&attachment_content_type[]=text/plain

// block 19526126 is the first block with a valid blob20 operation transaction - the $BLOBBED token deploy op
// block 19526198 is the block with FIRST mint op of $BLOB token
// block 19576966 is the block with last mint op of $BLOB token
//       19576840
// block 19565268 is the block with last mint op of $BLOBBED
// block 19526617 is the block with FIRST $WGW token (0x2d6f706109fac8431799bfc1f44da842fcb8076f0e51a4b3a6058c5ba31d10d3)
// block 19577001 is to have extra room and faster api query times

import { appendFile } from 'node:fs/promises';
import pMapSeries from 'npm:p-map-series';
import pMap from 'p-map';

// &transaction_hash_only=true
// &max_results=1000
const searchParams = new URLSearchParams(
  `
  reverse=true
  &attachment_present=true
  &max_results=45
  &attachment_content_type[]=text/plain
  &attachment_content_type[]=application/json
  &after_block=19526617
  &before_block=19586400
`
    .trim()
    .split('\n')
    .map((x) => x.trim())
    .join(''),
);

const API_BASE = `https://api.ethscriptions.com/v2`;

async function fetchPage(pageKey = '') {
  const response = await fetch(
    `${API_BASE}/ethscriptions?${searchParams}${pageKey ? `&page_key=${pageKey}` : ''}`,
  );
  const data = await response.json();
  return data;
}

async function fetchTxMetadata(txhash: string) {
  const response = await fetch(`https://eth.blockscout.com/api/v2/transactions/${txhash}`);
  if (response.ok === false) {
    return response.statusText;
  }
  const data = await response.json();

  if (data.result === 'success' && data.status === 'ok') {
    return {
      tx_hash: data.hash,
      tx_fee: data.fee.value,
      tx_burnt_fee: data.tx_burnt_fee,
      tx_index: data.position,
      tx_nonce: data.nonce,

      timestamp: data.timestamp,
      block_number: data.block,

      eth_price_usd: data.exchange_rate,

      blob_gas_price: data.blob_gas_price,
      gas_price: data.gas_price,
      gas_used: data.gas_used,
      priority_fee: data.priority_fee,
      base_fee_per_gas: data.base_fee_per_gas,
      max_priority_fee_per_gas: data.max_priority_fee_per_gas,
      max_fee_per_blob_gas: data.max_fee_per_gas,

      from_address: data.from.hash,
      to_address: data.to.hash,
    };
  }
}

async function fetchAllTransactions(data: any, handler: any) {
  await new Promise((r) => setTimeout(r, 1_000));

  await pMap(
    data.result,
    async (x: any, idx: number) => {
      if (idx % 10 === 0) {
        await new Promise((r) => setTimeout(r, 1_100));
      }

      console.log('txhash:', x.transaction_hash);
      const metadata = await fetchTxMetadata(x.transaction_hash);

      if (typeof metadata === 'string') {
        console.log('skipping / rate limitted at:', metadata, x);
        return;
      }

      if (!metadata) {
        console.log('skipping above: not successful transaction');
        return;
      }

      console.log('metadata:', metadata.tx_hash, metadata.block_number);

      // const columns = { ...metadata /*, page_key: data.pagination.page_key */ };

      await handler(metadata);
      // await appendFile('./db.csv', Object.values(columns).join(',') + '\n');

      console.log('=================');
    },
    { concurrency: 10 },
  );
}

// first time only
const columns = [
  'tx_hash',
  'tx_fee',
  'tx_burnt_fee',
  'tx_index',
  'tx_nonce',
  'timestamp',
  'block_number',
  'eth_price_usd',
  'blob_gas_price',
  'gas_price',
  'gas_used',
  'priority_fee',
  'base_fee_per_gas',
  'max_priority_fee_per_gas',
  'max_fee_per_blob_gas',
  'from_address',
  'to_address',
];

// console.log('columns:', columns.join(','));

// latest pageKey: 0xaec305aac8f549bc6e0e4e67849665fb001d0e542a03190793c1cc0641d9daf1

// await appendFile('./wgw-mints.csv', columns.join(',') + '\n');

const table = {
  balances: {},
  supply: 0,
};

async function txHandler(metadata: any) {
  const result = await fetch(
    `https://api.ethscriptions.com/v2/ethscriptions/${metadata.tx_hash}/attachment`,
  ).then((x) => x.text());

  // currentBlock = metadata.block_number;

  try {
    const attachment = JSON.parse(
      result.replace(/^[\uFEFF\r\n\t]*|[\uFEFF\r\n\t]*|[\uFEFF\r\n\t]*$/gi, '').toLowerCase(),
    );

    if (
      table.supply < 70_000 &&
      attachment.protocol === 'blob20' &&
      attachment.token.ticker === 'wgw'
    ) {
      console.log('wgw mint:', metadata.block_number, metadata.tx_hash, metadata.tx_index);

      if (attachment.token.operation === 'mint') {
        if (attachment.token.amount <= 100) {
          table.supply += attachment.token.amount;

          // @ts-ignore bruh
          table.balances[metadata.to_address] = attachment.token.amount;

          await appendFile(
            './src/misc/wgw-mints.csv',
            Object.values({
              ...metadata,
              total_supply: table.supply,
              token_ticker: attachment.token.ticker,
              token_amount: attachment.token.amount,
            }).join(',') + '\n',
          );
        } else {
          console.log('skipping mint, exceed max per mint:', attachment.token.amount);
        }
      }

      //   if (attachment.token.operation === 'transfer' && attachment.token.transfers) {
      //     console.log(
      //       'transfer detected:',
      //       metadata.tx_hash,
      //       metadata.tx_index,
      //       attachment.token.ticker,
      //     );

      //     attachment.token.transfers.forEach((x: any) => {
      //       // @ts-ignore bruh
      //       table.balances[metadata.from_address] -= x.amount;
      //       // @ts-ignore bruh
      //       table.balances[x.to || x.to_address] += x.amount;
      //     });
      //   }
    }
  } catch (e) {
    console.log('cannot parse attachment content:', metadata.tx_hash, e);
  }

  // await appendFile('./wgw-mints.csv', Object.values({ ...metadata }).join(',') + '\n');
}

async function main() {
  let pageKey = '';

  let data = await fetchPage(pageKey);

  fetchAllTransactions(data, txHandler);

  await new Promise((r) => setTimeout(r, 2_000));

  while (data.pagination.has_more) {
    pageKey = data.pagination.page_key;
    data = await fetchPage(pageKey);
    await fetchAllTransactions(data, txHandler);
    console.log('== continue to next page ==', pageKey);
  }

  console.log(table.balances);

  // console.log(data);
}

main();
