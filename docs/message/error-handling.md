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

CHO selects the closest `@Catch` on the method, controller or declaring feature module. Otherwise it uses the application's `onError`. Exactly one handler gets the exception. A handler that only logs preserves the failure. A class used as a handler must be a visible provider with `handle(error, ctx)`.

## Verify the effect

Test the distinction by delivering a known bad record with `app.handle` and asserting whether the promise resolves or rejects. Manual delivery makes one attempt. The [Kafka adapter](/message/kafka) adds retries, offset commits and optional dead-letter publication.
