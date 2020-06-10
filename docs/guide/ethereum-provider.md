# Ethereum Provider API

MetaMask injects a global API into websites visited by its users at `window.ethereum`.
This API allows websites to request users' Ethereum accounts, read data from blockchains the user is connected to, and suggest that the user sign messages and transactions.
The presence of the provider object indicates an Ethereum user.

```javascript
// this function detects most providers injected at window.ethereum
import detectProvider from '@metamask/detect-provider';

try {
  const provider = await detectProvider();
  // From now on, this should always be true:
  // provider === window.ethereum
  startApp(provider); // initialize your app
} catch (error) {
  console.log('Please install MetaMask!');
}
```

The provider API is specified by [EIP 1193](https://eips.ethereum.org/EIPS/eip-1193), and is designed to be minimal.
We recommend that all dapp developers read [Basic Usage section](#basic-usage).

## Table of Contents

[[toc]]

## Basic Usage

For any non-trivial Ethereum application, or dapp, to work, you will have to:

- Detect the Ethereum provider (`window.ethereum`)
- Detect which Ethereum network the user is connected to
- Get the user's Ethereum account(s)

The snippet at the top of this page is sufficient for detecting the provider.
You can learn how to accomplish the other two by reviewing [the snippet at the end of this page](#using-the-provider).

Although any Ethereum operation can be performed via the provider API, most developers use a convenience library with higher-level abstractions.
The most common such libraries are [ethers](https://www.npmjs.com/package/ethers) and [web3](https://www.npmjs.com/package/web3).
MetaMask recommends `ethers`.

Even if you use a convenience library, you will still need to detect the provider and initialize the library with it.
Other than that, you can generally learn everything you need to know from the documentation of those libraries, without reading this lower-level API.

However, for developers of convenience libraries, and for developers who would like to use features that are not yet supported by their favorite libraries, knowledge of the provider API is essential. Read on for more details.

## Upcoming Breaking Provider Changes

::: tip
These changes are _upcoming._ Follow [this GitHub issue](https://github.com/MetaMask/metamask-extension/issues/8077) for details.

If you are new to using the provider, or use `ethers`, you do not have to worry about these changes, and can skip ahead [to the next section](#api).
:::

### `window.ethereum` API Changes

In **Q3 2020** (date TBD), we are introducing minor breaking changes to this API, which we encourage you to
[read more about here](https://medium.com/metamask/breaking-changes-to-the-metamask-inpage-provider-b4dde069dd0a).

At that time, we will:

- Stop emitting `chainIdChanged`, and instead emit `chainChanged`
- Ensure that all `chainId` values are **not** 0-prefixed
  - For example, instead of `0x01`, we will always return `0x1`, wherever the chain ID is returned or accessible.
- Remove the following experimental methods:
  - `ethereum._metamask.isEnabled`
  - `ethereum._metamask.isApproved`
- Reload the page on chain change by default, if `window.ethereum` has been accessed

These changes _may_ break your website.
Please read our [migration guide](about:blank) for more details.

### `window.web3` Removal

::: tip
If you do not use the `window.web3` object injected by MetaMask, you will not be affected by these changes.
:::

In **Q4 2020** (date TBD), we will:

- Stop injecting `web3` into web pages

If you rely on the `window.web3` object currently injected by MetaMask, these changes _will_ break your website.
Please read our [migration guide](about:blank) for more details.

## Properties

### ethereum.isMetaMask

::: tip
This property is just a convention, and other providers may identify themselves as MetaMask.
:::

`true` if the user has MetaMask installed, some falsy value otherwise.

### ethereum.reloadOnChainChange

::: warning
Because chain changes can be difficult to handle correctly, MetaMask reloads the page on chain changes by default.

If you disable reloading on chain changes, you must handle those changes yourself using the [`chainChanged`](#chainchanged) event.
Otherwise, your users may end up interacting with different chains in unexpected ways, which is a security risk!

Even if the provider is set to reload on chain changes, the [`chainChanged`](#chainchanged) event will still be emitted immediately before the page is reloaded.
:::

`true` by default, causing MetaMask to reload the page whenever the connected chain changes.

If you wish to disable automatic reloading when the chain changes, set this property to `false` immediately after detecting the provider:

```javascript
ethereum.reloadOnChainChange = false;
```

::: tip
You can also pass the appropriate option to [`@metamask/detect-provider`](https://npmjs.com/package/@metamask/detect-provider).
:::

## Methods

### ethereum.request(args)

```typescript
interface RequestArguments {
  method: string;
  params?: unknown[] | object;
}

ethereum.request(args: RequestArguments): Promise<unknown>;
```

Use `request` to submit RPC requests to Ethereum via MetaMask.
Returns a `Promise` that resolves to the result of the method call.
The `params` type and the return value will vary by RPC method.
In practice, if a method has any `params`, they are almost always of type `Array<any>`.
If the request fails for any reason, the Promise will reject with an [Ethereum RPC Error](#errors).

MetaMask supports most standardized Ethereum RPC methods, in addition to a number of methods that may not be
supported by other wallets.
See the MetaMask [RPC API documentation](./rpc-api.html) for details.

#### Example

```javascript
params: [
  {
    from: '0xb60e8dd61c5d32be8058bb8eb970870f07233155',
    to: '0xd46e8dd67c5d32be8058bb8eb970870f07244567',
    gas: '0x76c0', // 30400
    gasPrice: '0x9184e72a000', // 10000000000000
    value: '0x9184e72a', // 2441406250
    data:
      '0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675',
  },
];

ethereum
  .request({
    method: 'eth_sendTransaction',
    params,
  })
  .then((result) => {
    // The result varies by by RPC method.
    // For example, this method will return a transaction hash hexadecimal string on success.
  })
  .catch((error) => {
    // If the request fails, the Promise will reject with an error.
  });
```

## Events

The MetaMask provider implements the [Node.js `EventEmitter`](https://nodejs.org/api/events.html) API.
This sections details the events emitted via that API.
There are more than enough guides to the `EventEmitter` API elsewhere, but you can listen to events like this:

```javascript
ethereum.on('accountsChanged', (accounts) => {
  // Handle the new accounts, or lack thereof!
  // "accounts" will always be an array, but it can be empty.
});

ethereum.on('chainChanged', (chainId) => {
  // By default, the page is about to reload!
  // However, if you set ethereum.reloadOnChainChange to false,
  // it's time to make sure that you handle the new chain!
});
```

### connect

```typescript
interface ConnectInfo {
  chainId: string;
}

ethereum.on('connect', listener: (connectInfo: ConnectInfo) => void);
```

The MetaMask provider emits this event when it first becomes able to submit RPC requests to a chain.
In general, you can assume that the MetaMask provider is connected and has emitted this event by the time you are able to reference it.

### disconnect

```typescript
ethereum.on('disconnect', listener: (error: ProviderRpcError) => void);
```

The MetaMask provider emits this event if it becomes unable to submit RPC requests to any chain.
In general, this will only happen due to network connectivity issues or some unforeseen error.

Once `disconnect` has been emitted, MetaMask will not accept any new requests until until `connect` is emitted, which may require refreshing the page.

### accountsChanged

```typescript
ethereum.on('accountsChanged', listener: (accounts: Array<string>) => void);
```

The MetaMask provider emits this event whenever the return value of the `eth_accounts` RPC method changes.
`eth_accounts` returns an array of account addresses that the user has decided to expose to the requesting domain (in the case of a dapp, identified by the _hostname_ of its URL).
This means that `accountsChanged` will be emitted when:

- A different set of accounts is exposed, i.e. one or more addresses are removed from or added to the array
- The order of the addresses changes

In general, the address at position `0` in the array is the account most recently viewed by the user in the MetaMask UI.
We call this the user's _Primary_ account, and you should only interact with that unless your UX supports multiple simultaneously connected accounts.

### chainChanged

::: warning
Remember that, by default, the provider will reload the page immediately after this event is emitted.
This is because chain changes are difficult to handle correctly.

See [`ethereum.reloadOnChainChange`](#ethereum-reloadonchainchange) for more details.

If the provider is configured to not reload the page on chain changes, you will have to use this event to handle chain changes appropriately.
:::

```typescript
ethereum.on('chainChanged', listener: (chainId: string) => void);
```

The MetaMask provider emits this event when the currently connected chain changes.
The emitted `chainId` value always matches the return value of the `eth_chainId` RPC method.

All RPC requests are be submitted to the currently connected chain, it's important to keep track of when the chain ID changes.

#### Chain IDs

Below you will find the chain IDs of the networks MetaMask supports by default.
Consult [chainid.network](https://chainid.network) for more.

| Hex  | Decimal | Network                         |
| ---- | ------- | ------------------------------- |
| 0x1  | 1       | Ethereum Main Network (MainNet) |
| 0x3  | 3       | Ropsten Test Network            |
| 0x4  | 4       | Rinkeby Test Network            |
| 0x5  | 5       | Goerli Test Network             |
| 0x2a | 42      | Kovan Test Network              |

### message

```typescript
interface ProviderMessage {
  type: string;
  data: unknown;
}

ethereum.on('message', listener: (message: ProviderMessage) => void);
```

The MetaMask provider emits this event when it receives some message that the consumer should be notified of.
The kind of message is identified by the `type` string.

One prominent example of such messages include updates from RPC subscriptions, such as `eth_subscribe`. For such messages, the message `type` will be `eth_subscription`.

### Errors

All errors thrown or returned by the MetaMask provider follow this interface:

```typescript
interface ProviderRpcError extends Error {
  message: string;
  code: number;
  data?: unknown;
}
```

Important errors include those defined in:

- [EIP 1193](https://eips.ethereum.org/EIPS/eip-1193#provider-errors)
- [EIP 1474](https://eips.ethereum.org/EIPS/eip-1474#error-codes)

The [`eth-rpc-errors`](https://npmjs.com/package/eth-rpc-errors) package may help you identify these errors and their meaning.

## Using the Provider

This snippet covers how to:

- Detect the Ethereum provider (`window.ethereum`)
- Detect which Ethereum network the user is connected to
- Get the user's Ethereum account(s)

<<< @/docs/snippets/handleProvider.js

## Deprecated API

Historically, the Ethereum provider API has been a mess.
Here, we document the remains of this mess in case you see it used in the wild and wonder what's going on.

_You should **never** rely on any of these methods, properties, or events._
There are no plans to remove them at the moment, but they may be removed in the future, and may not be updated to support new features.

## Deprecated Properties

### ethereum.autoRefreshOnNetworkChange (DEPRECATED)

::: warning
Use [`ethereum.reloadOnChainChange`](#ethereum-reloadonchainchange) instead.

Currently, setting this property to `true` will only cause the page to reload on chain changes if `window.web3` has been accessed.
In **Q3 2020** (date TBD), setting this property to `true` will cause the page to reload if `window.ethereum` has been accessed.
:::

Historically, MetaMask has reloaded dapps if the connected chain (network) changes, if our injected `window.web3` object has been accessed.
This can be controlled via the `autoRefreshOnNetworkChange` property, which is by default `true`.

If you wish to disable automatic reloading when the chain changes, set this property to `false` immediately after detecting the provider:

```javascript
ethereum.autoRefreshOnNetworkChange = false;
```

### ethereum.networkVersion (DEPRECATED)

::: warning
Use [`ethereum.request({ method: 'eth_chainId' })`](#ethereum-request-args) instead.
:::

Returns a numeric string representing the current blockchain's network ID. A few example values:

### ethereum.selectedAddress (DEPRECATED)

::: warning
Use [`ethereum.request({ method: 'eth_accounts' })`](#ethereum-request-args) instead.
:::

Returns a hexadecimal string representing the user's "currently selected" address.

## Deprecated Methods

### ethereum.enable() (DEPRECATED)

::: warning
Use [`ethereum.request({ method: 'eth_requestAccounts' })`](#ethereum-request-args) instead.
:::

Alias for `ethereum.request({ method: 'eth_requestAccounts' })`.

### ethereum.sendAsync() (DEPRECATED)

::: warning
Use [`ethereum.request()`](#ethereum-request-args) instead.
:::

```typescript
interface JsonRpcRequest {
  id: string | undefined;
  jsonrpc: '2.0';
  method: string;
  params?: Array<any>;
}

interface JsonRpcResponse {
  id: string | undefined;
  jsonrpc: '2.0';
  method: string;
  result?: unknown;
  error?: Error;
}

type JsonRpcCallback = (error: Error, response: JsonRpcResponse) => unknown;

ethereum.sendAsync(payload: JsonRpcRequest, callback: JsonRpcCallback): void;
```

This is the ancestor of `ethereum.request`. It only works for JSON-RPC methods, and takes a JSON-RPC request payload object and an error-first callback function as its arguments.

See [the Ethereum JSON-RPC API](https://eips.ethereum.org/EIPS/eip-1474) for details.

### ethereum.send() (DEPRECATED)

::: warning
Use [`ethereum.request()`](#ethereum-request-args) instead.
:::

```typescript
ethereum.send(
  methodOrPayload: string | JsonRpcRequest,
  paramsOrCallback: Array<unknown> | JsonRpcCallback,
): Promise<JsonRpcResponse> | unknown;
```

This method is mostly a Promise-based `sendAsync` with `method` and `params` instead of a payload as arguments.
However, it can behave in unexpected ways and should be avoided at all costs.

## Deprecated Events

### close (DEPRECATED)

::: warning
Use [`disconnect`](#disconnect) instead.
:::

```typescript
ethereum.on('close', listener: (error: Error) => void);
```

### chainIdChanged (DEPRECATED)

::: warning
Use [`chainChanged`](#chainchanged) instead.
:::

Misspelled alias of [`chainChanged`](#chainchanged).

```typescript
ethereum.on('chainChanged', listener: (chainId: string) => void);
```

### networkChanged (DEPRECATED)

::: warning
Use [`chainChanged`](#chainchanged) instead.
:::

Like [`chainChanged`](#chainchanged), but with the `networkId` instead.
Network IDs were deprecated in favor of chain IDs via [EIP-155](https://eips.ethereum.org/EIPS/eip-155) because they are insecure.
Avoid using them unless you know what you are doing.

```typescript
ethereum.on('networkChanged', listener: (networkId: string) => void);
```

### notification (DEPRECATED)

::: warning
Use [`message`](#message) instead.
:::

```typescript
ethereum.on('notification', listener: (payload: any) => void);
```
