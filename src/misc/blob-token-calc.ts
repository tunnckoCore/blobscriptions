/*

  $BLOB token mint op SHAs:

  0x69735911f4896cbd9ab6eefc09ac95a73eb69926044d06cbfbca081a7201043c - multi-lined json
  0x209e179c12c67efda341dbfa39d8e472cbc5ec4571ce51173be5a2eaaaeef5ba - oneliner type json
  0x2546b7e4ffd88362cece1100be591f0bbb14a439a587ae058ba738b099177981 - oneliner text plain
  0xcaaf0e438ef2f2fc5c5d811da82f2a1f695f629c24f4de2f1ef4ade87bb3e0e5 - multi-lined text plain

*/

import 'dotenv/config';

import { appendFile } from 'node:fs/promises';
import pMap from 'npm:p-map';
import pMapSeries from 'npm:p-map-series';
import { parseGwei, stringify } from 'npm:viem';

import { getXataClient } from '../xata.ts';

const xata = getXataClient();

// https://api.ethscriptions.com/v2/ethscriptions?reverse=true&attachment_present=true&transaction_hash_only=true&max_results=1000&

// function genUrlParams(sha: string) {
//   return new URLSearchParams(
//     `
//       reverse=true
//       &attachment_present=true
//       &max_results=1000
//       &transaction_hash_only=true
//       &attachment_sha=${sha}
//     `
//       .trim()
//       .split('\n')
//       .map((x) => x.trim())
//       .join(''),
//   );
// }

// record written: 0x480fa24cedf574624275198c68c29dc4b497d4397fc786bea73091aab4fea998 rec_cogir7lv0a9tjgrc48r0
// record written: 0x56663f5625f9e82f07108884652de83937980d4855fb89ad76ccb69dfe561100 rec_cogir7mnih5frtv77q4g
// record written: 0x9542311ddb6caecb79a72af5b34686defe49181312f8018f2f44cf5f0f5e9142 rec_cogir7lv0a9tjgrc48rg
// record written: 0x488eede5f46b3020c943f99077185e2f7dc5ddd1c41d55e24389d984890b3650 rec_cogir7h3gmbil69h1vv0
// record written: 0x9282cb0db728b13144b735b8ce073ca4e8f60f4f3654c0fd78941365881a0044 rec_cogir7mnih5frtv77q50
// record written: 0x5779e741c42183cd0c33a347005a41c35b8e187ccc117694412f21dbd4171a28 rec_cogir7h3gmbil69h1vug
// record written: 0x1affd32bc6007b36672e370e028109c2f0821a52a93ddf7410180371c5ab7859 rec_cogir7lv0a9tjgrc48s0
// record written: 0x240d195b9e01f3e009af197cb87645619418f54fd2fc6225997d2f39d7877971 rec_cogir7mnih5frtv77q5g
// record written: 0x54cf3fd2344e291238bf0cd5cfa3fbb96610b7e1fe7951d0d2ca334e75602595 rec_cogir7h3gmbil69h1vvg

function genUrlParams(sha?: string) {
  return new URLSearchParams(
    `
      reverse=true
      &attachment_present=true
      &attachment_content_type[]=text/plain
      &attachment_content_type[]=application/json
      &after_block=19526125
      &max_results=15
      &page_key=0x7e71faa679a850cffd0cf0bc4d227e9bd2b1f1d74100a426fcc3cbc20c0f87f7
    `
      .trim()
      .split('\n')
      .map((x) => x.trim())
      .join(''),
  );
}

const API_BASE = `https://api.ethscriptions.com/v2`;

const BLOB_TOKEN_MINT_SHAS = [
  '0x69735911f4896cbd9ab6eefc09ac95a73eb69926044d06cbfbca081a7201043c', // - multi-lined json
  '0x209e179c12c67efda341dbfa39d8e472cbc5ec4571ce51173be5a2eaaaeef5ba', // - oneliner type json
  '0x2546b7e4ffd88362cece1100be591f0bbb14a439a587ae058ba738b099177981', // - oneliner text plain
  '0xcaaf0e438ef2f2fc5c5d811da82f2a1f695f629c24f4de2f1ef4ade87bb3e0e5', // - multi-lined text plain
];

let count = 0;

async function fetchPage(searchParams: any, pageKey = '') {
  const response = await fetch(
    `${API_BASE}/ethscriptions?${searchParams}${pageKey ? `&page_key=${pageKey}` : ''}`,
  );
  const data = await response.json();
  return data;
}

async function writeToXata(data: any) {
  const record = await xata.db.blob20_transactions.create(data);

  console.log('record written:', data.transaction_hash, record.id);
}

async function fetchAllTransactions(data: any, handler: any) {
  await new Promise((r) => setTimeout(r, 1_100));

  let done = false;

  await pMap(
    data.result,
    async (x: any, idx: number) => {
      if (idx % 20 === 0) {
        await new Promise((r) => setTimeout(r, 1_100));
      }

      console.log('tx:', x.transaction_hash, x.block_number);

      // const columns = { ...metadata /*, page_key: data.pagination.page_key */ };

      const result = await handler(x);

      if (result === true) {
        console.log('done');
        done = true;
        Deno.exit(0);
        return;
      }

      if (!result) {
        console.log('failure to parse or handle tx:', x.transaction_hash);
        return;
      }

      await writeToXata(result);
      // await appendFile('./full-db.ndjson', stringify(result) + ',\n');
    },
    { concurrency: 15 },
  );

  return done;
}

const maxPerMintMap = {
  blobbed: 10000,
  blob: 1000,
  wgw: 100,
};

async function txHandler(x: any) {
  if (Number(x.block_number) > 19650000) {
    return true;
  }

  x.attachment_content_type = x.attachment_content_type.toLowerCase();
  if (
    x.attachment_content_type === 'application/json' ||
    x.attachment_content_type === 'text/plain'
  ) {
    const attachmentContentStr = await fetch(
      `https://api.ethscriptions.com/v2/ethscriptions/${x.transaction_hash}/attachment`,
    ).then((x) => x.text());

    let ret;

    try {
      const attachment = JSON.parse(attachmentContentStr.toLowerCase());

      if (attachment.protocol === 'blob20' && attachment.token) {
        attachment.token.ticker = attachment.token?.ticker?.toLowerCase();

        console.log(
          'token:',
          Number(x.block_number),
          x.transaction_hash,
          Number(x.transaction_index),
          attachment.token?.operation,
          attachment.token?.ticker,
        );

        // skip $WGW cuz we have it
        // if (attachment.token?.ticker?.toLowerCase() === 'wgw') {
        //   return;
        // }

        ret = {
          block_number: Number(x.block_number),
          block_hash: x.block_blockhash,
          block_timestamp: Number(x.block_timestamp),
          transaction_hash: x.transaction_hash,
          transaction_index: Number(x.transaction_index),
          transaction_fee: Number(x.transaction_fee),
          transaction_burnt_fee: Number(Number(x.transaction_fee) - Number(parseGwei(x.gas_used))),
          transaction_value: Number(x.transaction_value),
          from_address: x.creator,
          to_address: x.initial_owner,
          is_valid: true,
          operation: attachment.token?.operation,
          ticker: attachment.token?.ticker,
          amount: Number(attachment.token?.amount || 0),
          attachment_sha: x.attachment_sha,
          attachment_content_type: x.attachment_content_type,
          gas_price: Number(x.gas_price),
          gas_used: Number(x.gas_used),
          timestamp: new Date(Number(x.block_timestamp) * 1000).toISOString(),
          blob20: stringify(attachment),
        };

        // @ts-ignore bruh
        const maxPerMint = maxPerMintMap[attachment.token?.ticker?.toLowerCase()];

        if (attachment.token.operation === 'mint' && attachment.token?.amount > maxPerMint) {
          console.log('max per mint exceeded:', attachment.token?.amount, maxPerMint);
          ret.is_valid = false;
        } else if (attachment.token.operation === 'mint') {
          console.log(
            'mint success',
            x.transaction_hash,
            attachment.token?.amount,
            attachment.token?.ticker,
          );
        }

        return ret;
      }
    } catch (e) {
      console.log('cannot parse attachment content:', x.transaction_index, e);
    }
  }

  // await appendFile('./wgw-mints.csv', Object.values({ ...metadata }).join(',') + '\n');
}

async function main() {
  const searchParams = genUrlParams();
  let pageKey;
  let data;

  data = await fetchPage(searchParams);
  fetchAllTransactions(data, txHandler);

  while (data.pagination.has_more) {
    pageKey = data.pagination.page_key;
    data = await fetchPage(searchParams, pageKey);

    fetchAllTransactions(data, txHandler);
    // const done = await fetchAllTransactions(data, txHandler);
    // if (done) {
    //   break;
    // }

    console.log('== continue to next page ==', pageKey);
  }
  // await pMapSeries(BLOB_TOKEN_MINT_SHAS, async (sha) => {
  //   const searchParams = genUrlParams(sha);
  //   let pageKey;
  //   let data;
  //   data = await fetchPage(searchParams);
  //   count += data.result.length;
  //   console.log('SHA:', sha, 'count:', count);
  //   while (data.pagination.has_more) {
  //     pageKey = data.pagination.page_key;
  //     data = await fetchPage(searchParams, pageKey);
  //     count += data.result.length;
  //     console.log('SHA:', sha, 'count:', count);
  //     console.log('== continue to next page ==', pageKey);
  //   }
  //   // console.log('DONE SHA:', sha, 'count:', count);
  // });
}

main();
