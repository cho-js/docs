# Decide whether a failed delivery is settled

A handler that throws produces a rejected delivery unless the selected error handler explicitly settles it. This decision affects what a broker adapter may acknowledge.

## What the caller observes

| Outcome | `app.handle` or `route.handle` | Broker adapter can… |
| --- | --- | --- |
| Subscription completes normally | Resolves with its [encoded reply](/message/replies), or `undefined` for no reply | Forward a reply if supported, then acknowledge |
| `@Catch` returns `true` | Resolves with `undefined` | Acknowledge without a reply |
| `@Catch` returns an encodable value other than `true`, `false` or `undefined` | Resolves with a fallback reply, including for `0`, `null` or `""` | Forward a reply if supported, then acknowledge |
| `@Catch` returns `false` or `undefined`, or no error handler is configured | Rejects with the original error | Apply its failure policy |
| `@Catch` throws or returns a value that cannot be encoded | Rejects with the original error. The secondary failure is logged | Apply its failure policy |

For example, a retired schema may be safe to discard while a failed database write needs another attempt.

```ts
class RetiredSchema extends Error {}

@Catch((error, ctx) => {
  if (error instanceof RetiredSchema) {
    console.warn("Skipping retired schema", ctx.topic, ctx.key);
    return true;
  }
  console.error("Delivery failed", ctx.topic, error);
  return false;
})
@Controller({ topic: "books" })
class Inventory { /* subscriptions */ }
```

## Choose the policy owner

CHO selects the closest [`@Catch`](/api/message#symbol-Catch) on the method, controller or declaring feature module. Otherwise it uses the application's `onError`. Exactly one handler gets the exception. A handler that only logs preserves the failure. A class used as a handler must be a visible provider with `handle(error, ctx)`.

## Verify the effect

For a request, throw `new ReplyError(404, "Unknown copy")` when the caller should receive a specific public failure. CHO applies the selected `@Catch` first. If the failure reaches Core NATS, a typed requester can match it with `isReplyError(error, 404)`. For a durable event, a [`ReplyError`](/api/message#symbol-ReplyError) follows the ordinary failure policy. An unhandled `CHO_MESSAGE_INVALID_MESSAGE` skips ordinary retries on Kafka and JetStream. [Message contracts](/message/contracts) · [JetStream failure policy](/message/jetstream#choose-the-failure-policy)

Test the distinction by delivering a known bad record with `app.handle` and asserting whether the promise resolves or rejects. Manual delivery makes one attempt. The [Kafka adapter](/message/kafka) adds retries, offset commits and optional dead-letter publication.

With [Core NATS](/message/nats#map-a-failure-for-the-caller), an unhandled failure during a request produces a service-error reply. A fallback returned by `@Catch` is sent as a successful reply. A failed event published without a reply address receives no further attempt. Enable `cho:nats` debug logging to see the exception.

## Place the retry decision

Simulate a transient storage error and let it propagate to the adapter. For an invalid request that callers can correct, use validation or a public reply error. Inspect both the caller's outcome and the consumer's acknowledgment policy before deciding to handle a failure locally.
