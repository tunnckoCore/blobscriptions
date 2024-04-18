// @ts-ignore bruh
import { formatEther, parseGwei } from 'npm:viem';

import wgwMints from './wgw-mints.js';

// sort by block_number then by tx_index
const mints = wgwMints.sort((a, b) => {
  if (a.block_number === b.block_number) {
    return a.tx_index - b.tx_index;
  }
  return a.block_number - b.block_number;
});

const tweaked = mints.map((x) => ({
  tx_fee: x.tx_fee,
  tx_burnt_fee: x.tx_fee - Number(parseGwei(String(x.gas_used))),
  tx_index: x.tx_index,
  block_timestamp: x.timestamp,
  block_number: x.block_number,
  gas_price: x.gas_price,
  gas_used: x.gas_used,
  token_ticker: x.token_ticker.toUpperCase(),
  token_operation: 'mint',
  token_amount: 100,
  from_address: x.from_address.toLowerCase(),
  to_address: x.to_address.toLowerCase(),
  tx_hash: x.tx_hash.toLowerCase(),
}));

const properMints = Object.values(
  tweaked.reduce((acc: any, x: any) => {
    if (acc[x.tx_hash]) {
      return acc;
    }

    acc[x.tx_hash] = x;

    return acc;
  }, {}),
).map((x: any, idx) => ({ cid: idx + 1, ...x }));

const totals = properMints.reduce(
  (acc: any, x: any) => {
    acc.total_spent_value += x.tx_fee;
    acc.total_backing_value += x.tx_burnt_fee;

    return acc;
  },
  {
    total_spent_value: 0,
    total_backing_value: 0,
  },
);

console.log(
  'export default',
  JSON.stringify(
    {
      ticker: 'WGW',
      total_spent_value: formatEther(totals.total_spent_value),
      total_backing_value: formatEther(totals.total_backing_value),
      total_supply: 69000,
      mints: properMints.slice(0, 690),
    },
    null,
    2,
  ),
);

// const tweakedMints = mints.map((x) => {
//   return {
//     tx_hash: x.tx_hash,
//     tx_fee: x.tx_fee,
//     tx_burnt_fee: x.tx_burnt_fee,
//     tx_index: x.tx_index,
//     tx_nonce: x.tx_nonce,
//     block_timestamp: x.timestamp,
//     block_number: x.block_number,
//     gas_price: x.gas_price,
//     gas_used: x.gas_used,
//     from_address: x.from_address,
//     to_address: x.to_address,
//     token_ticker: x.token_ticker,
//   };
// });

// console.log(JSON.stringify(tweakedMints, null, 2));
