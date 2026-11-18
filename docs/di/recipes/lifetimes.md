# Share an instance or create one per operation

CHO caches one result per provider declaration in each injector. Choose what the declaration returns based on how long the **object you use** should live.

| Desired lifetime | What to register | Where the object is created |
| --- | --- | --- |
| Shared service (singleton) | The service class or a factory returning its instance | Once when CHO resolves the declaration |
| Fresh on demand (transient) | A function that constructs the object | Each time the consumer calls the injected function |
| Shared within one HTTP request | The same creator plus a route middleware | Once in middleware for the matched request |

## Share one service across features

Register the service in one owning module, export its token and import that module wherever it is needed. Consumers share the owning declaration's cached instance. Declaring the class again in a second module creates another instance. The [module sharing example](/di/modules) shows the full registration.

## Create a fresh object on demand

Suppose a checkout desk needs a new slip for each transaction. Inject a creator so the desk can decide when a transaction begins.

<<< @/examples/di/slips.ts#creator

The outer function runs once for the provider declaration. The inner function runs every time a consumer calls `newSlip()`. Two calls produce two different slips, even in the same request. For objects that own resources, the caller must also arrange cleanup. CHO tracks the provider result, which here is the creator function.

## Share the object for one HTTP request

Call the creator in middleware and store the slip on `ctx.state`. The controller reads that same slip. The body and the `X-Slip-Id` header will agree, including when requests overlap.

<<< @/examples/di/slips.ts#request

Register `slipProvider` and `OpenSlip` under `providers` and `Checkout` under `controllers`. The `Symbol` identifies the entry in the request's state map. `NEW_SLIP` is the DI token for the shared creator. For a message consumer, apply the same pattern to the [delivery context](/message/handlers) to share a value during one delivery.

::: details Complete app.ts
<<< @/examples/di/slips.ts
:::

To try it, save the complete example as `app.ts` in a project with `@chojs/web`. Save the following alongside it as `check.ts` and run `deno run check.ts`.

```ts
import assert from "node:assert/strict";
import { createApp } from "./app.ts";

const app = await createApp();
try {
  async function readSlip() {
    const response = await app.handler(new Request("http://library.test/slip"));
    assert.equal(response.status, 200);
    const { id } = await response.json();
    assert.equal(id, response.headers.get("X-Slip-Id"));
    return id;
  }
  const [first, second] = await Promise.all([readSlip(), readSlip()]);
  assert.notEqual(first, second);
} finally {
  await app.close();
}
```
