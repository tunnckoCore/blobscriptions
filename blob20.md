# BLOB-20 Spec draft

- Author Twitter: [@wgw_eth](https://twitter.com/wgw_eth)
- Blobscriptions Indexer (not only BLOB-20):
  [Open Source on GitHub](https://github.com/tunnckoCore/blobscriptions-indexer/)
- Ethscriptions Discord: https://discord.gg/ethscriptions
- Ethscriptions Site: https://ethscriptions.com
- Ethscriptions Marketplace: https://ordex.io
- Ethscriptions Explorer: https://wgw.lol (soon v2)
- [ESIP-10 where ESIP-20/BLOB-20 was born](https://github.com/ethscriptions-protocol/ESIP-Discussion/issues/19)
- There is also [ESIP-11](https://github.com/ethscriptions-protocol/ESIP-Discussion/issues/20) -
  batch transferring of Ethscription through blob transactions
  - it support transferring multiple Ethscriptions to multiple recipients in on transaction
  - it would be pretty similar how the BLOB-20 `transfer` operation works here

This document specifies the Blob-20 standard for representing "blobbed tokens" on the Ethereum
blockchain. Blobbed tokens are blobscriptions-based tokens that are pretty similar to the regular
Ethereum's ERC-20 tokens.

- They are valid Ethscriptions
- They are valid Blobscriptions (ESIP-8, untagged CBOR)
- They are NOT like other BRC20-style tokens found in Ethscriptions and Ordinals
- They are inside the Blobscriptions `content` field
- BLOB-20 tokens must have contentType `application/json` (see more below)
- Ticker names are alphanumeric first-come-first-served and unique (anti-scam prevention)

**Blob-20 tokens are Blobscriptions.** **Blobscriptions are Ethscriptions.** **Ethscriptions are
on-chain assets on Ethereum L1.**

## First 3 blob20 tokens

- $BLOBBED - 6.9 million supply, 50 decimals, 10000 per mint transaction
- $BLOB - 69 million supply, 18 decimals, 1000 per mint transaction
- $WGW - 69000 supply, 50 decimals, 100 per mint transaction

_all minted out_

## Blobscriptions

- Blobscriptions are just Ethscriptions with
  [ESIP-8](https://docs.ethscriptions.com/esips/esip-8-ethscription-attachments-aka-blobscriptions)
- [The ESIP-8 discussion with Middlemarch and how we built it](https://github.com/ethscriptions-protocol/ESIP-Discussion/issues/16)
  - _there's a lot more in the #technical channel in the Ethscriptions Discord_

Blobscriptions are a way to represent data on the Ethereum blockchain, using the new "Type 3"
transaction that came with [EIP-4844](https://www.eip4844.com/). This type of transaction is known
as "blob transaction".

Blobscriptions allow for bigger data size for the Ethscriptions ecosystem. The regular Ethscriptions
are inside the Calldata of a transaction or inside the events emitted/created from smart contracts.
Blobscriptions are inside the "blobspace". This space was specifically designed to help Rollups and
Layer-2s to make their transactions more cheap and efficient.

We (the Ethscriptions creator Tom and WGW, and the Ethscriptions community as a whole) have decided
to use this space to increase the maxium size of each Ethscritpion can be to 768kb instead of just
96-128kb which is the limit of "regular Ethscriptions" created through calldata.

The ESIP-8 that we created is the standard for the Blobscriptions. It is a simple - you
"blob-scribe" an **untagged CBOR** using a blob transaction. The untagged CBOR must hold an object
with 2 fields - `content` and `contentType`. The `content` field is the actual data (text, image,
json) that you want, where in case of BLOB-20 we put JSON object with `protocol: 'blob20'` and
operation definition. The `contentType` field, in the general blobscriptions case, is useful for the
client (or APIs) to know how to parse and/or show the `content` field; in the blob20 case it's
`application/json` or `text/plain` (but this should be removed in future, it's currently there for
backwards-compatible reasons).

## Blob-20

Blob-20 is a standard for representing "blobbed tokens". They are objects inside the `content` field
of a valid Blobscriptions. The `contentType` field of Blobscription must be `application/json`. They
are similar to BRC20-style tokens found in Ethscriptions and Ordinals, **but they are not the
same**. Not at all.

**Currently, Blobscriptions/BLOB-20s with `contentType: 'text/plain'` are also allowed and indexed,
but this support will be removed in the future. Believe, text/plain is a nightmare. The web is what
it is because it follow strict standards and protocols and content types. Text is text. Json is
json.**

The regular BRC20-style tokens has many flaws. They are not efficient, they are not cheap, and they
hard to index and search. The whole thing is mostly unusable, not scalable, and require some sort of
"splitting". Other BRC20-style token standards are usually in "text/plain" form, which is a
nightmare for scaling and developers, especially when people start inscribing other than JSON as
plain text (like names, domains, digits, whatever; there's NO WAY to differentiate what is what).
The whole thing is a mess, not to mention many of them are not even "parsable" JSON, which renders
it totally unusable and with no way to do anything with that shit.

**BLOB-20 was specifically designed to be different.**

Because we are in Ethereum it is simple to understand. Ethereum is an account/balance-based system,
not like Bitcoin which is a UTXO-based system. Same with BLOB-20 tokens - they are account-based
system. All minted token amounts are added up (stacked) to form a "balance" for a given minter
address. When a "transfer" operation is created (and detected by the indexers) it is just a matter
of subtraction from the sender and addition to the receiver. This allows for far simpler design and
mental model.

**The BLOB-20 tokens DO NOT need "splitting".**

If you mint 1000 in one blobscription, you have 1000 tokens, not a single insciption with some
imaginary "1000" inside it. You can transfer & sell ANY amount with ANY decimals to ANYONE, at ANY
time.

For example, if you blob-scribe (mint) a $BLOB (the second deployed token) with `amount: 1000`, then
you have 1000 TOKENS! Just like if you are in Uniswap and you buy 1000, you have 1000 tokens that
you can transfer any amount of to anyone. Same here. Once you have 1000 tokens, you can transfer
`420.6969` with "transfer operation".

BLOB-20 does not have any artifical limits, except that ticker names should be alphanumeric only
without any length limit. The decimals can be anything from 0 to Infinity (eg. you can deploy a
token that have 50 decimals or more). The minting limit can be anything up to the max supply.

**Blob-20 tokens are first-come-first-served and unique.**

If you deploy a token with the ticker `BLOB`, then no one else can deploy a token with the same
ticker name. This is to prevent confusion and scams. If you want your ticker, be first or you will
be caught you're trying to scam people.

**Simple structure**

See more below in the [BLOB-20 indexing rules](#blob-20-rules) section.

```
CBOR({
  content: {
    protocol: 'blob20',
    token: {
      operation: '...',
      ... other operation fields ...
    }
  },
  contentType: 'application/json'
})
```

**Maximum 8 decimals, making our lifes easier**

Bitcoin chose to be with 8 decimals for a reason. A wide variaty of languages DO NOT support too big
numbers. We are in Ethereum, we can have 18 decimals, but we choose to have 8 to make working with
floating numbers and decimals precision easier with the languge we mainly use - JavaScript. In
JavaScript we have BigInt which is used in most of the time where we work with Ethereum stuff, but
it's bad and have its flaws. It's a good balance between usability and scalability. If you need
more, you **can** deploy a token with more decimals, **but this decimals will be ignored by the
indexers and behave as if it is set to 8.** Decimals are mostly a representation stuff. The 18 is
most of the time an unnecessary overhead, what you can do with 18 you can do with 8 too.

**Configurable**

On deploy, you can configure the settings of a token, like max supply, max amount per mint,
decimals, and more. There are plans to have "max limit per address", eg. maximum times a wallet can
mint. And another limit like "max amount per address" to cap the allowed total amount of tokens that
a wallet can mint.

And also settings like `start_block` and `end_block`, defining a period of blocks in which minting
is opened.

## BLOB-20 Indexing Rules

_For examples, check a few sections below._

Many of the rules are actual rules followed by other BRC-20 style protocols and organizations like
Best In Slot and Layer1 Foundation. The devil is in the details. The BLOB-20 is designed to be
simple, efficient, and scalable. It uses the account-balance model.

Here are the detailed indexing rules that should be followed:

- Every BLOB-20 inscription must be valid Blobscription (ESIP-8), otherwise it's ignored
- Must have `content` and `contentType` fields inside a CBOR-encoded object.
- The `contentType` field must be a string, either `application/json` or `text/plain`
- The `content` field must be a valid and parseable JSON object (not json string, or JSON5)
  - it can also be in bytes form of Uint8Array
  - the CBOR library that you are using for encoding/deocoding must output an UNTAGGED CBOR
  - the `cborg` JavaScript/npm library is a good choice and it outputs an untagged CBOR in
    Uint8Array form
- The JSON inside the `content` inside the CBOR must have both `protocol` and `token` fields;
  - extra fields are ignored;
  - pseudo-code:
    `cborg.encode({ content: { protocol: 'blob20', token: { ... operation fields ... } }, contentType: 'application/json' })`
- The `protocol` field must be a string "blob20", like so `protocol: 'blob20'`

  - The "blob20" string should be detected as case-insensitive
  - indexers should normalize it to lowercase; but no dashes like "blob-20" are allowed

- The `token` field must be a valid JSON object, not a string, JSON5, or array

  - all string values (like `operation`) must be trimmed of whitespaces before processed by indexer
  - it must have an `operation` field, which must be a string, one of "deploy", "mint", "transfer",
    "premine", and optionally more in the future (like `trade` for example)
  - the `operation` field value is and should be case-insensitive; indexers should trim whitespaces
    and normalize it to lowercase
  - it must have other fields depending on the `operation` field

- extra fields that are not the `protocol`, `token`, `operation` and the other operation-specific
  fields should be ignored by the indexers

- If `operation` is `'deploy'`, the other required fields are "ticker", "supply", "limit",
  "decimals"

  - all number values are javascript numbers, thus a dot must be used instead of a comma, it must be
    like `42.69`
  - all string values (like `ticker`) must be trimmed of whitespaces before processed by indexer
  - supply, limit, decimals and other limit settings must be numbers, not strings;
  - `ticker`, `supply`, `limit`, and `decimals` are required fields
  - all number max values is the JavaScript max number
  - `limit` is the max amount per mint transaction; to be more clear `max_limit_per_mint` should be
    used instead; all token deploys with `limit` are allowed too;
  - instead of `supply` using `max_supply` is also allowed and preferred
  - if you deploy with `limit` same as `supply`, then the whole supply can be minted in one
    transaction; use the `premine` operation instead to protect against front-running
  - `ticker` must be alphanumeric only, no length limit;
  - `ticker` must be unique, first-come-first-served; no one else can deploy a token with the same
    ticker name
  - `ticker` must be case-insensitive; indexers should normalize it to uppercase;
  - `decimals` must be a number from 0 to 8, **not more**! Deploys with more decimals should NOT be
    ignored; all first 11 deployed tokens are allowed to have more;
  - `decimals` are pure representation and SHOULD NOT be strict; if a token has 8 decimals, but
    someone mints with 20, that mint operation SHOULD NOT be ignored
  - `limit` / `max_limit_per_mint` must be a number, max value is the supply
  - if defined, `start_block` and `end_block` should be numbers representing the block number
  - optional fields `start_block` and `end_block` to define a period of blocks in which minting is
    opened;
  - if no `end_block` the mint is opened until the max `supply` is reached with `mint` operations
  - if there is both `start_block` and `end_block` defined and the current block is not in that
    range, the mint operation must be ignored
  - if both `start_block` and `end_block` defined, then the `end_block` must be greater than
    `start_block`
  - if only `start_block` is defined, the mint operation must be ignored if the current block is
    less than `start_block`
  - if only `end_block` is defined, the mint opens "immediately" and ends at the `end_block`
    (inclusive)
  - if `start_block` and `end_block` are not defined, the mint is opened "immediately" and ends when
    the max `supply` is reached
  - if `start_block` and `end_block` are defined, then the mint closes after the `end_block` no
    matter if there is still supply left
  - optional field `max_limit_per_address` - max times a wallet can make `mint` transactions;
    - it should work in combination of `max_limit_per_mint` and `max_amount_per_address`
    - for example, if `max_limit_per_mint` is 1000, `max_limit_per_address` is 10, then the wallet
      can mint 10 times 1000 tokens, but not more
  - optional field `max_amount_per_address` - max total amount of tokens that a wallet can mint;
    - it should work in combination of `max_limit_per_mint` and `max_limit_per_address`
    - for example, if `max_limit_per_mint` is 1000, `max_amount_per_address` is 10000, then the
      wallet can mint 10 times 1000 tokens, or 20 times 500 tokens; but not more
    - if `max_limit_per_mint` is 1000, `max_amount_per_address` is 10000, and
      `max_limit_per_address` is 10, then the wallet can mint 10 times 1000 tokens; if for some
      reason the wallet mints less than 1000 a few times then it will not be able to mint the full
      amount of allowed 10,000 tokens because the `max_limit_per_address` is reached

- If `operation` is `'mint'` , the other required fields are `ticker`, and `amount`.

  - all number values are javascript numbers, thus a dot must be used instead of a comma, it must be
    like `42.69`
  - all string values (like `ticker`) must be trimmed of whitespaces before processed by indexer
  - all mint transactions that are minting not deployed ticker must be ignored
  - all amounts of all `mint` operations for a wallet are added/stacked up to form a total account
    balance
  - the `amount` field must be a number, max value is the `limit` defined in the deploy operation
    for this token
  - it is allowed if a wallet mints less than the `limit` / `max_limit_per_mint` defined in the
    deploy operation
  - if `amount` is more than the `limit` / `max_limit_per_mint` defined in the deploy operation, the
    mint for that wallet must be ignored
  - The last mint inscription will mint the remaining tokens of the supply. For example, if the
    ticker has `max_supply: 1000` and there is only 100 tokens left but a minter inscribe a mint
    operation that has `amount: 500`, the minter **must receive only 100 more** added to his
    balance.

- If `operation` is `'transfer'` the other required fields are `ticker` and `transfers` field.

  - support single and batch transferring natively
  - all number values are javascript numbers, thus a dot must be used instead of a comma, it must be
    like `42.69`
  - all string values (like `ticker`) must be trimmed of whitespaces before processed by indexer
  - The `transfer` operation transaction must be sent to the same address that is creating it (eg.
    to self); otherwise it must be ignored.
    - it is a 0 ETH transaction to self; otherwise it must be ignored.
    - This acts as an "approve" transaction in regular Ethereum ERC-20 tokens.
    - this works because the actual "reciever" is inside the `transfers` list of objects containing
      a `to_address` and `amount` fields
    - for markets, we should add a seaprate `trade` operation, or `proxy_transfer`, or something
      similar
  - all amounts of all `transfer` operations for a wallet are subtracted from the total account
    balance
  - all amounts of inside the `transfers` list must be subtracted from the total balance of the
    transaction creator's wallet, and added to the receiver's (`to_address`) wallet
  - the `transfers` field must be an array of objects:
    - each object in `transfers` must have `to_address` (or just `to`) and `amount` fields
    - all `to_address` values must be trimmed of whitespaces before processed by indexer
    - each `to_address` can be any valid Ethereum address; if not, the transfer must be ignored
    - all `amount` values must be numbers, the maximum value can be the total balance of the wallet
    - all `amount` values must form a sum and checked if the wallet has enough balance to transfer
      the total sum; if all amounts are summed and are more than the total balance of the wallet,
      the entire `transfer` operation must be ignored
    - the `to` field must be a valid Ethereum address, indexers must lowercase it whenever they
      write it to the database
    - the `amount` can be any number with any decimals, up to the max `decimals` of the token
    - if `amount` is more than the total balance of the wallet, the transfer must be ignored
    - if `amount` has more decimal digits than the `decimals` defined in the token deploy operation,
      the transfer SHOULD NOT be ignored; decimals are pure representation and should not be strict

- If `operation` is `premine` it follows the same field rules as `deploy`:
  - must have `ticker`, `max_supply`, `max_limit_per_mint` and `decimals`
  - the `max_supply` and `max_limit_per_mint` must be exactly the same
  - indexer should consider `premine` operation transactions as combined `deploy` and `mint`
    operations to the deployer
  - indexers should assign the full supply to the creator of the `premine` operation transaction
    (deployer)
    - this prevents from front-running the deployer
  - all following mint operations to this `ticker` must be ignored
  - the deployer then can use the `transfer` operation to distribute the tokens to multiple
    addresses

## Wallets situation

Currently, there are no wallets that support Blob Transactions in general - neither creating, nor
visualizing. That's why we need so many manual steps for Blob-20 tokens and Blobscriptions in
general.

But I'm working on Ethscriptions-aware (thus Blobscriptions and BLOB-20 too) wallet that will be
self-custodial and will support all the operations and features that are needed for the BLOB-20,
Blobscriptions, and the Ethscriptions ecosystem in general.

Most of it is already done, and is primarily based on [Privy.io](https://privy.io) - safe, secure,
self-custodial wallet allowing you to manage Ethereum wallets and create one from email address, any
social account (Google, Apple, Facebook, Discord, Twitter, Linkedin), Farcaster, or just from
connecting existing Ethereum wallet.

Thus, as long as you have email or a social account, then you can have and use Ethscriptions and
BLOB-20s.

## Markets & DEXes

It is yet to be revealed how the trading and markets will work with BLOB-20 tokens. Regular
Blobscriptions (non BLOB-20 tokens) **can use the Ethscriptions ecosystem and markets without
problems**, but this is _NOT the case with BLOB-20 tokens_ because they work differently and require
different things.

Regular Ethscriptions-native markets like Ordex are adviced to not support BLOB-20 tokens as
"collection of ethscriptions". It beats the whole purpose and design of BLOB-20. If they want to
participate, they should build separate markets or DEX, i'm open to help and discuss.

## Notes on BLOB-20 transfers

You **should NOT use** regular "ethscription transfer transactions" to transfer BLOB-20 tokens, and
BLOB-20 mint inscriptions in general. The `transfer` operation is required for a reason. The reason
is that BLOB-20 is primarily and exclusively designed to depend only on Blobscriptions and Blob
Transactions, which means you only need Ethscriptions ESIP-8 indexer to index and detect BLOB-20
tokens and their operations. If we support transferring blob tokens with regular Ethscriptions
transfers (eg. putting transaction hash in calldata) then indexing and operating a BLOB-20 indexer
will require to build a whole Ethscriptions indexer which is completely different beast and
absolutely unnecessary for the BLOB-20 case. This Blobscriptions indexer is light and simple, and is
ESIP-8 compliant.

I've built general Ethscriptions indexer the same way, it is composable and with plugins. I'm going
to open source it too, but here we need just Blobscriptions one. The difference is that
Blobscriptions and Ethscriptions store data in different places, so different things and flows are
required.

The case is similar with ESIP-4 (Facet). To run an Ethscriptions indexer **you are not required** to
run a whole Facet indexer, database and the Facet VM to index and detect Facet transactions (facet
ethscriptions). You are aware of what is Facet transaction and what is not, but you don't mess with
the VM and computing (facet) state.

That's good for decentralization, scalability, and composition of protocols. Ethscriptions is the
base layer. Facet is built on top. Blobscriptions is built on top too. Blob-20 is built on top of
Blobscriptions and you only need Blobscriptions indexer (ESIP-8).

## FAQ and Q&A

> lcywestbrook (I9T5H): will the transfer of Blobscriptions still need to submit an Ethscriptions
> transaction? Blobs will only exist for 20 days. How to permanently record blobscriptions without
> submit Ethscriptions transaction

Blobsctiption is nothing more than just creating ethscriptions through blob transactions. Everything
else is the same, including transfers. Blobs are for 18 days, but ethscriptions created through
blobs are stored permanently on multiple places.

---

> lcywestbrook (I9T5H): If transferring blob20 also requires ethscription, the transfer fee will be
> very high, then how to reflect the advantages of blobs? In other words, can I transfer blob20
> without using calldata?

Blob20 and its transfers is completely different story.

First, calldata ethscription transfers are cheap! Nothing beats it until we support transferring
ethscriptions through blob transactions, eg.
[the ESIP-11 proposal](https://github.com/ethscriptions-protocol/ESIP-Discussion/issues/20)

Second, when you're using blob20 or any other blobscriptions you're also having and paying for
calldata. Minimal but still. Blob20 transfers are not through calldata, but through blobs.

Third, blob20 transfers are through transfer operation, as another blobscription. You're are
creating a blob20 transfer operation blobscription to yourself, that works like "approve". Then the
indexer picks it up and transfers the said amount to the said address(es).

Fourth, of course it requires a transaction. Everything should move through the chain whether
through a regular transaction or a blob one. Otherwise, it's not crypto.

Even regular Ethereum tokens are having calldata, that's how the whole system works. Including that
Ethscriptions is too a calldata-based protocol, now blob-based too.

---

> Can we do something like sorting, merging, and compression like L2 and then aggregate payments
> instead of paying calldata for each transaction?

We do that to some extent with CBOR. It can also be gzipped CBOR. The content inside the CBOR could
also be gzip compressed. Too much compression is not a good thing too, especially for blob20s we
don't need any.

All blobscriptions are CBOR blobs. The calldata you're paying for is like few characters, it's
nothing. And it's there only to just make the whole thing part of the ethscriptions ecosystem - eg.
all blobscriptions are just valid ethscriptions with as minimal as possible calldata like
`data:;rule=esip6,` this is why we come up with the term "attachment".

Blob20 idea is to support transferring of multiple tokens of a given ticker to multiple addresses
all at once in one transaction (like for airdrops; you deploy, then mint the whole supply and
airdrop). It's insanely scalable a unbeatably cheap.

## BLOB-20 operations

- `deploy` - deploy a new token: define a `ticker` name (alphanumeric only), max `supply`, max per
  mint `limit`, and the `decimals`
- [`premine`](#blob20-premine) - same as `deploy` operation, but immediately mints the whole supply
  to the deployer
- `mint` - mint new tokens, the `amount` could be anything up to the `limit` defined in the deploy
  operation for this token
- `transfer` - transfer tokens from one account to another or to yourself

### blob20 deploy

_[See BLOB-20 rules](#blob-20-indexing-rules)_

Here we deploy an example token with the ticker `EXAMPLE` with 30 decimals, supply of 1,000,000 and
mint limit per transaction 1,000. Anyone will be able to mint less than 1000 tokens in a single
transaction. But not more than 1000. Because the whole system is open, this is to prevent minting
the whole supply at once.

There is also plans to have "max limit per address", eg. maximum times a wallet can mint. And
another limit like "max amount per address" to cap the allowed total amount of tokens that a wallet
can mint.

_If you want such behavior, you can use the `premine` operation with `limit` same as `supply`, this
will mint the whole supply to the creator/deployer. This could be **useful for airdrops**, precisely
because how the transfer operation works - support batch sending to multiple addresses all at once
in one transaction_

```json
{
  "protocol": "blob20",
  "token": {
    "operation": "deploy",
    "ticker": "EXAMPLE",
    "max_supply": 1000000,
    "max_limit_per_mint": 1000,
    "decimals": 8
  }
}
```

### blob20 mint

_[See BLOB-20 rules](#blob-20-indexing-rules)_

Here we mint 1000 tokens of the above EXAMPLE ticker token.

```json
{
  "protocol": "blob20",
  "token": {
    "operation": "mint",
    "ticker": "EXAMPLE",
    "amount": 1000
  }
}
```

### blob20 transfer

_[See BLOB-20 rules](#blob-20-indexing-rules)_

- Supports single and batch transferring natively
- To be considered valid both the `from` and `to` of the ethereum transaction must be the same
  address
- Trading is a different beast and is not yet clearly specified

To be considered a valid and indexed transfer, you must send the blob transaction to yourself. Only
then the indexer will detect it and read where to transfer what amount based on the given `amount`
and `to_address` in the array of objects in the `transfers` field.

This is pretty similar to what TAP protocol in Bitcoin land is doing with the "tapping". Basically
it is a way to "approve" or "sign" a blob20 transfer transaction.

It is that strict because trading and markets/DEXes will require different things, maybe even
different operation like `trade`. Maybe markets will require the receiver of a `transfer` operation
to be the marketplace contract or wallet.

**Example**

Now that we have 1000 tokens, you can transfer some to another account. Here we transfer 123.69 to
`0x123...555` and 555.42 to `0x444...111`.

```json
{
  "protocol": "blob20",
  "token": {
    "operation": "transfer",
    "ticker": "EXAMPLE",
    "transfers": [
      { "to_address": "0x123...555", "amount": 123.69 },
      { "to_address": "0x444...111", "amount": 555.42 }
    ]
  }
}
```

**Above transfer operation should be ignored if the transaction creator is not having enough in his
account balance. The total sum of all amounts in the `transfers` field must be less than or equal to
the total balance of the wallet.**

If you want to make just a single transfer, then it's the same but with a single object in the
"transfers" field.

```json
{
  "protocol": "blob20",
  "token": {
    "operation": "transfer",
    "ticker": "EXAMPLE",
    "transfers": [{ "to": "0x123...555", "amount": 123.69 }]
  }
}
```

### blob20 premine

_[See BLOB-20 rules](#blob-20-indexing-rules)_

Premined BLOB-20 tokens are a way the deployer to mint the full supply to himself and later
distribute all tokens to a large number of users using the batch transferring feature of the
`transfer` operation. The BLOB-20 airdrops are simple - you deploy a token with "premine" operation,
the same `max_supply` and `max_limit_per_mint`. And then call the `transfer` operation with the list
of addresses and amounts.

**Example**

Here we create a token `$BLOBBY` with supply of **69 trillion**, and allow anyone to mint up to 69
trillion. No one can front-run the deployer because when an `premine` operation is detected, it is
considered like combined `deploy` + `mint` operations to the deployer.

```json
{
  "protocol": "blob20",
  "token": {
    "operation": "premine",
    "ticker": "BLOBBY",
    "max_supply": 69000000000,
    "max_limit_per_mint": 69000000000,
    "decimals": 8
  }
}
```

to distribute some tokens to some addresses make a batch transfer operation.

```json
{
  "protocol": "blob20",
  "token": {
    "operation": "transfer",
    "ticker": "BLOBBY",
    "transfers": [
      { "to_address": "address 1", "amount": 42.069 },
      { "to_address": "address 2", "amount": 1000 },
      { "to_address": "address 3", "amount": 111 },
      { "to_address": "address 4", "amount": 1000 },
      { "to_address": "address 5", "amount": 313 },
      { "to_address": "address 6", "amount": 1000 },
      { "to_address": "address 7", "amount": 1000 },
      { "to_address": "address 8", "amount": 69.42 },
      { "to_address": "address 9", "amount": 1000 },
      { "to_address": "address 10", "amount": 1000 }
    ]
  }
}
```

## Programatically create / mint / transfer BLOB-20 tokens

Example functions that create correctly formatted and valid BLOB-20 operations.

```js
function deployToken({ ticker, max_supply, max_limit_per_mint, decimals }) {
  // ... here some validation of settigns before that ...

  return {
    protocol: 'blob20',
    token: {
      operation: 'deploy',
      ticker: ticker.toUpperCase(),
      max_supply,
      max_limit_per_mint,
      decimals,
    },
  };
}

function mintToken({ ticker, amount }) {
  return {
    protocol: 'blob20',
    token: {
      operation: 'mint',
      ticker: ticker.toUpperCase(),
      amount,
    },
  };
}

type Transfer = { to_address: `0x${string}`; amount: number };

function transferToken(ticker, transfers: Transfer[]) {
  return {
    protocol: 'blob20',
    token: {
      operation: 'transfer',
      ticker: ticker.toUpperCase(),
      transfers,
    },
  };
}
```

Then you need to create a valid Blobscription with the above operations.

```js
import { encode as encodeCbor } from 'cborg';

// we strinigfy the object to JSON and then encode it into bytes for best experience
function encodeContent(obj) {
  const jsonStr = JSON.stringify(obj);
  return new TextEncoder().encode(jsonStr);
}

const blob20blobscription = encodeCbor({
  content: encodeContent(
    deployToken({
      ticker: 'EXAMPLE',
      max_supply: 1_000_000,
      max_limit_per_mint: 1000,
      decimals: 8,
    }),
  ),
  contentType: 'application/json',
});
```

To create a mint blob20 blobscription, then switch `deployToken` with `mintToken` like so

```js
const blob20blobscription = encodeCbor({
  content: encodeContent(mintToken({ ticker: 'EXAMPLE', amount: 1000 })),
  contentType: 'application/json',
});

// the result is a Uint8Array bytes representation of the CBOR-encoded object
```

Then use `viem` library to encode the CBOR to a blob format and then send the transaction to the
network.

```js
import { loadKZG } from 'kzg-wasm';
import { createWalletClient, createPublicClient, toBlobs } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

const account = privateKeyToAccount(
  'private key here or uncomment below to use mnemonic/seedphrase, or generate new wallet',
);

// or mnemonic/seedphrase to account
// const account = mnemonicToAccount('creator wallet seed/mnemonic phrase');

// to generate fresh new wallet which you will need to fund with ETH
// const account = mnemonicToAccount(generateMnemonic());

console.log('Creator account:', account);
console.log('Creator address:', account.address);

const client = createPublicClient({ chain: mainnet, transport: http('https://1rpc.io/eth') });
const wallet = createWalletClient({
  account,
  chain: mainnet,
  // or put another RPC URL here that support blob transactions like GetBlock.io
  transport: http('https://1rpc.io/eth'),
});



async function main() {
  // convert the CBOR data into "blobs" that are recognized by RPCs
  // and the Ethereum Network in general
  const blobs = toBlobs({ data: blob20blobscription });

  const fees = await client.estimateFeesPerGas();

  const tx = await wallet.sendTransaction({
    kzg: await loadKZG(),
    blobs
    account,
    to: '0x receiver address here',
    data: stringToHex('data:;rule=esip6,'), // makes it valid Ethscription
    value: 0n,
    type: 'eip4844' // important! creates a blob transaction instead of regular EIP-1559 one
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: parseGwei('2'), // adjust if needed
    maxFeePerBlobGas: fees.maxFeePerBlobGas || parseGwei('50'), // adjust if needed
  });
}

main().catch(console.error)
```

## Stuck / Unstuck BLOB-20 transactions

Due to the nature of Blob Transactions and the current limits of only 6 blobs per block, it is
possible when you try create Blobscriptions (thus Blob20) to have your transaction stuck in the
mempool indefinitely. This is not a problem with the BLOB-20 protocol, but with the Ethereum network
and the current limits of the blob transactions.

If you have a stuck transaction, you can try to "unstuck" it by sending a new transaction with the
same nonce and higher gas fee. This will replace the stuck transaction.

But. It is a bit more complex than just sending a new transaction with the same nonce and higher gas
in your Metamask or other wallet, because Blob transactions are not supported in ANY wallet. And to
unstuck a transaction you need to same the same type of transaction, which in this case is the
so-called "blob transaction / type 3" transaction.

This means that you or your mint site service must send the exact same "calldata" and "blob data"
(eg the mint operation) with the same nonce and higher gas fee - both "max priority fee per gas" and
"max fee per blob gas".

It is tricky and complex for the moment, but possible. You can use the same script as above, but
also add `nonce` field to the `sendTransaction` function. Generally to find the "nonce" you need to
see your last successful transaction's nonce and add 1 to it.

For example, if the last successful transaction has nonce `2`, then you need to send transaction
with `nonce: 2`.

```js
const last_success_nonce = 2; // the nonce of the stuck transaction
const unstuck_nonce = last_success_nonce + 1; // the nonce of the new transaction

const tx = await wallet.sendTransaction({
  // ... same as above ...
  nonce: unstuck_nonce, // the nonce of the new transaction
  maxPriorityFeePerGas: parseGwei('3'), // start with 1 and increase slowly
  maxFeePerBlobGas: parseGwei('100'), // start with 30-50 and increase slowly
});
```
