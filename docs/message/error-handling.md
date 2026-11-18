# Decide whether a failed delivery is settled

A handler that throws produces a rejected delivery unless the selected error handler explicitly settles it. This decision affects what a broker adapter may acknowledge.

## Retry or drop

| Outcome | `app.handle` or `route.handle` | Broker adapter can… |
| --- | --- | --- |
| Subscription completes normally | Resolves | Acknowledge |
| `@Catch` returns exactly `true` | Resolves | Acknowledge and advance |
| `@Catch` returns `false`, `undefined` or another value | Rejects with the original error | Apply its failure policy |
| `@Catch` throws | Rejects with the original error. The secondary failure is logged | Apply its failure policy |

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
