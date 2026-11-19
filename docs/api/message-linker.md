---
outline: 2
---

# @chojs/message/linker

Implement delivery and shutdown first. Expose a sender when clients also need to publish or request replies through the connection. [Connect a broker](/message/adapters) · [Browse all packages](/api/)

## request_error {#symbol-request_error}

Make the error of a request that got no answer. It is for the senders of
the adapters: `ChoMessageClient.request` rejects with what they throw.

```ts
export function request_error(code: "CHO_MESSAGE_NO_RESPONDERS" | "CHO_MESSAGE_REQUEST_TIMEOUT", topic: string, options?: ErrorOptions): ChoError<ChoMessageErrorCode>;
```

### Usage {#request_error-usage}

```ts
await assert.rejects(
        new ChoMessageClient(recording(request_error(code, "ping")).sender)
          .request(Ping),
        { code },
      );
```

[Usage in message/client_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/client_test.ts#L306)

## Also exported here

These declarations share their implementation with another entry point. Each link opens the full declaration.

[`ChoError`](/api/core#symbol-ChoError), [`ChoMessageErrorCode`](/api/message#symbol-ChoMessageErrorCode), [`Delivery`](/api/message#symbol-Delivery), [`Linked`](/api/message#symbol-Linked), [`Linker`](/api/message#symbol-Linker), [`Reply`](/api/message#symbol-Reply), [`ReplyError`](/api/message#symbol-ReplyError), [`RequestOptions`](/api/message#symbol-RequestOptions), [`Route`](/api/message#symbol-Route), [`Sender`](/api/message#symbol-Sender), [`isReplyError`](/api/message#symbol-isReplyError)
