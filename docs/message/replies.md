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

| Subscription returns | What the caller receives |
| --- | --- |
| Nothing or `undefined` | `undefined`. Handling succeeded without a reply |
| A string | Its UTF-8 bytes. Read with `new TextDecoder().decode(reply.value)` |
| An `ArrayBuffer`, typed array or `DataView` | Binary data. For a view, only the bytes in its range are included |
| A JSON value such as an object, array, boolean, number or `null` | UTF-8 JSON. Decode and parse it as in the example |

A `Reply` contains a single `value: Uint8Array` field. Agree on a format per topic. A zero-length byte array or empty string produces a reply with zero bytes. Check `reply === undefined` when the distinction matters. If serialization fails, for example because a returned object contains a cycle, CHO sends `CHO_MESSAGE_INVALID_REPLY` to the selected [error handler](/message/error-handling).

## Receive the reply through a broker

Direct delivery returns the reply to the local caller. For a remote caller, the [adapter](/message/adapters) must forward the bytes to the reply address and preserve any correlation information required by the broker. The [Kafka adapter](/message/kafka) consumes events and ignores returned replies. Use its producer to publish a follow-up event when another consumer needs the result.
