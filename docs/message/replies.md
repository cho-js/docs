# Return a reply from a subscription

A caller can ask which shelf holds a book and read the answer from the same delivery. Return a value from the subscription, then await `app.handle(topic, delivery)` to receive its bytes. An event consumer that only updates inventory can keep returning nothing.

This API was added after 3.4.0. To try it from the CHO checkout, follow the [development setup](/guide/getting-started#run-examples-against-the-development-version).

## Run a shelf lookup

In a project configured for `@chojs/message`, save the example as `replies.ts` and run `deno run replies.ts` or `npx tsx replies.ts`. The request carries a copy ID as plain text. The reply contract is JSON. A missing copy is an expected outcome, so the error handler supplies a fallback answer. Unexpected errors still reject the lookup.

<<< @/examples/message/replies.ts

```text
copy-17 B2
copy-99 unknown copy
```

## Choose the reply format

These rules apply to a subscription declared with a topic string. A [contract subscription](/message/contracts) encodes the handler's return value as JSON, including a string. Its typed client decodes that JSON and runs the reply validator if one was supplied.

| Subscription returns | What the caller receives |
| --- | --- |
| Nothing or `undefined` | `undefined`. Handling succeeded without a reply |
| A string | Its UTF-8 bytes. Read with `new TextDecoder().decode(reply.value)` |
| An `ArrayBuffer`, typed array or `DataView` | Binary data. For a view, only the bytes in its range are included |
| A JSON value such as an object, array, boolean, number or `null` | UTF-8 JSON. Decode and parse it as in the example |

A `Reply` carries encoded bytes in `value` and optional string `headers`. A zero-length byte array or empty string produces a reply with zero bytes. Check `reply === undefined` when the distinction matters. If serialization fails, for example because a returned object contains a cycle, CHO sends `CHO_MESSAGE_INVALID_REPLY` to the selected [error handler](/message/error-handling).

## Attach headers to a reply

Import `ChoMessageReply` from `@chojs/message` when the caller also needs metadata. In the shelf lookup above, replace the successful return with the following.

```ts
return new ChoMessageReply({ found: true, shelf }, {
  headers: { "Content-Type": "application/json" },
});
```

The caller reads `reply.headers?.["Content-Type"]` and decodes `reply.value` as before. The wrapper works in both subscriptions and `@Catch` handlers. For a header-only acknowledgment, return `new ChoMessageReply(undefined, { headers: { "X-Result": "accepted" } })`. The caller receives a present reply with zero payload bytes. A plain object such as `{ value, headers }` is encoded as ordinary JSON.

## Receive the reply through a broker

Direct delivery returns the reply to the local caller. With the [NATS adapter](/message/nats), a remote caller uses `nc.request` and receives both the bytes and the headers. The [Kafka adapter](/message/kafka) consumes events and ignores returned replies. Use its producer to publish a follow-up event when another consumer needs the result.
