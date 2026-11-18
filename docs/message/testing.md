# Test a subscription without a broker

Test a consumer by asserting what happened to a delivered record. Use the same `app.handle` boundary for valid input, invalid input and topic lookup. It runs the actual middleware and error policy.

## Exercise parsing and routing

Save as `inventory_test.ts` beside `app.ts` from the [inventory quick start](/message/quick-start). Run `deno test inventory_test.ts`.

```ts
import assert from "node:assert/strict";
import { isChoError } from "@chojs/message";
import { createApp } from "./app.ts";

Deno.test("inventory accepts an ISBN and rejects a malformed shipment", async () => {
  const app = await createApp();
  try {
    await app.handle("books.received", { value: '{"isbn":"9780140268867"}' });
    await assert.rejects(
      app.handle("books.received", { value: '{"isbn":42}' }),
      /Expected a string isbn/,
    );
    await assert.rejects(app.handle("books.missing"), (error) =>
      isChoError(error, "CHO_MESSAGE_UNKNOWN_TOPIC")
    );
  } finally {
    await app.close();
  }
});
```

A rejection assertion should match the expected cause. Otherwise a typo in the topic could make a validation test pass. Pass `new TextEncoder().encode(payload)` as the value to exercise binary delivery. Supply `headers` and `key` explicitly when a middleware depends on them.

For a subscription that answers its caller, assert that the reply exists, then decode `reply.value` using the topic's format. Test a missing result separately from a successful empty reply. The [shelf lookup example](/message/replies) exercises both a regular and a fallback answer.

## Assert a side effect

Use `overrides` to replace a declared mailer, writer or store with a recording implementation. Await delivery, then assert on its calls. To test that HTTP sees the write, [share the web injector](/message/with-web) and request the HTTP endpoint after delivery.

A local `handle` test exercises one attempt. Verify broker-specific behavior, such as commits, redelivery and partition assignment, with the chosen adapter and a broker integration test.
