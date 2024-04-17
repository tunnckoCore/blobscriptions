# blobscriptions

> A command-line interface, a library, and a set of tools to manage and manipulate blobscriptions.

Ethscriptions ESIP-8 implementation in JavaScript/TypeScript, also called Blobscriptions which is
using Ethereum Blob Transactions to create Ethscriptions. The package includes a CLI to create and
manage blobscriptions, as well as a library to track/index blobscriptions and BLOB-20 tokens. It is
built with plugins architecture for easier development.

For the BLOB-20 specification, see the [blob20](./blob20.md) file.

## Install and use

**This package is written entirely in TypeScript AND published on NPM as TypeScript.** So better
install and use a sane runtime like [Bun](htts://bun.sh) or [Deno](https://deno.com) to be able to
just run the TypeScript files directly. I just don't deal with Node.js tooling anymore, in the
future i will add a build step to compile the TypeScript files to JavaScript, but that's for now.

To use as a library, you can install it via npm:

```
npm i blobscriptions
```

And then import it in your project:

```typescript
import { blobscriptions, type TxPayload } from 'blobscriptions';

const options = { logging: true, blob20: true };

blobscriptions((payload: TxPayload) => {
  console.log('payload:', payload);
  // do whatever you want with the payload, like storing it in a database, etc.

  // it includes the block, the transaction, the attachment, and the blob20 (if it is a blob20 token transaction)
  console.log('block:', payload.block.number, payload.block.hash);
  console.log('tx:', payload.transaction.hash, payload.transaction.from, payload.transaction.to);
  console.log('attachment:', payload.attachment.contentType, payload.attachment.sha);

  // if it is a blob20 token transaction and blob20 is enabled (it is by default)
  console.log('blob20:', payload.blob20?.protocol, payload.blob20?.token.operation);
}, options).catch((e) => {
  console.error('Failure in blobscriptions handling...', e);
});
```

### Payload and types

The payload is an object with the following structure:

```typescript
import type { Block, Chain, TransactionBase, TransactionEIP4844, Transport } from 'viem';

type TxPayload = {
  transaction: TransactionBase & Omit<TransactionEIP4844, 'accessList'>;
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
  attachment: {
    contentType: Uint8Array | string;
    content: Uint8Array | string;
    sha: `0x${string}`;
  };
  blob20?: {
    protocol: 'blob20';
    token: {
      operation: 'deploy' | 'mint' | 'transfer';
      // operation-specific fields
      // ...
    };
  };
};

type TrackBlobsOptions = {
  chain?: Chain; // mainnet
  transport?: Transport; // http to 1rpc.io/eth
  onlyBlobscriptions?: boolean; // true
  blob20?: boolean; // true
  trimInput?: boolean; // true
  logging?: boolean; // false
};
```

## Deployment

You can deploy this package to a server, like a VPS, and run it as a service. The way to do that is
easy and require only few steps.

- Register for an account on a cloud provider like Digital Ocean, or Fly.io
  - i recommend [Fly.io](https://fly.io) because it is fast, cheap, and easy
- Tweak the `./src/main.ts` as you like, eg. add Webhook URL or payload handler function
- Create a project / machine on provider, and instruct it to run the `./src/main.ts` file
- Done!

I will provide a one-click deploy soon. For now, you can just follow the steps above.

In this repository there is also a Dockerfile and Fly.tom configuration file, so you can deploy it
to Fly.io easily. This Fly config is using Bun to run the `src/main.ts` file which in my case is
just sending me the payload to another service where i can handle it - this can be on serverless
platform without problem.

**NOTE:** You cannot use a serverless platform like Vercel or Netlify, because they are serverless
and the indexing process require an always-online server that listen on the Ethereum network. In the
serverless platforms, the server is not always online, it is only online when a request is made.

## Webhooks

In case you want to receive the payload as a webhook, you can use pass a URL string instead of a
function, or you can provide both a function and a URL string to send the payload to the URL as well
as to the function.

You can run it locally and try it with some Webhook service like https://webhook.site

```typescript
blobscriptions([
  'https://your-webhook-url.com',
  'https://webhook.site/0e4b8206-94a8-4c95-adf6-fea310c03e06',
  (payload: TxPayload) => {
    console.log('payload:', payload);
  },
]);
```

The webhook data that this POST request handler will receive is a JSON object with the following
structure:

```typescript
type WebhookPayload = {
  type: 'BLOBSCRIPTIONS';
  timestamp: number; // timestamp, javascript Date.now()
  payload: TxPayload;
};
```

## CLI

to be documented and implemented
