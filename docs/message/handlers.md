# Read and handle a delivery

A subscription method receives a `ChoMessageContext`. Use the topic to identify the event contract and the body to read its data. Returning from the method signals that your handling work finished, so await any write that must succeed before acknowledgment.

| Member | Value for one delivery |
| --- | --- |
| `topic` | Complete subscribed topic, including the prefix |
| `value` | Raw `Uint8Array`. Missing and null values produce zero bytes |
| `key` | Optional string |
| `headers` | Read-only string dictionary. Missing headers produce an empty object |
| `text()` | UTF-8 text, decoded lazily and cached |
| `json<T>()` | Parsed JSON. An empty body yields `undefined` and invalid JSON throws |
| `state` | A fresh map shared between middleware and handler |
| `native` | Adapter-provided delivery details, absent in manual delivery |

## Pick a body representation

For an image or encoded payload, use `ctx.value` directly. For plain text, use `ctx.text()`. For structured data, start with `ctx.json<unknown>()` and validate the shape before persisting it. Supplying a generic type only tells TypeScript what you expect. See the [inventory consumer](/message/quick-start) for a complete input check.

## Finish, fail or publish

Return nothing to finish an event, or return a value to answer the caller. For example, returning `false` from a subscription sends the JSON value `false`. Throw or reject to report failure. See [Return a reply](/message/replies) for encoding and [Failed deliveries](/message/error-handling) for the separate meaning of a boolean returned by `@Catch`.

To publish a follow-up event, inject a producer that your application owns, or use the broker adapter's publishing API. `app.handle` invokes a local handler directly. [Kafka publishing](/message/kafka)
