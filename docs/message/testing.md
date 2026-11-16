# Testing

`app.handle` takes a message, so a test needs no broker, no container and no
network.

```ts
const app = await ChoMessage.create(App);

await app.handle("orders.created", {
  value: JSON.stringify({ id: "42", email: "ada@example.com" }),
  key: "42",
});

await app.close();
```

`handle` runs what the broker would: the middlewares, the handler and the
error handler. It resolves when the message is handled, and **rejects, with
the error, when it failed**.

## Replacing providers

A handler answers nothing, so a test looks at what the handler did. The
`overrides` option replaces providers with fakes, anywhere in the module
graph, without changing a module:

```ts
import { provider } from "@chojs/message";

class FakeMailer {
  readonly sent: string[] = [];
  confirm(order: { id: string }) {
    this.sent.push(order.id);
  }
}

const mailer = new FakeMailer();
const app = await ChoMessage.create(App, {
  overrides: [provider({ provide: Mailer, factory: () => mailer })],
});

await app.handle("orders.created", { value: '{"id":"42","email":"a@b.c"}' });
assert.deepEqual(mailer.sent, ["42"]);
```

An override that replaces nothing is an error, so a stale test fails loudly.
The rules are in [Lifecycle](/di/lifecycle#overrides-for-tests).

## Handled, or failed

```ts
// handled: resolves
await app.handle("orders.created", { value: '{"id":"42","email":"a@b.c"}' });

// failed: rejects, with the error of the handler
await assert.rejects(
  app.handle("orders.created", { value: "not json" }),
  SyntaxError,
);
```

A message that an [error handler](/message/error-handling) settles with `true`
resolves; one that a [middleware](/message/middlewares) drops resolves too. To
tell them from a message that was handled, assert on the fakes.

## A full test, on each runtime

The test body is the same; only the test runner differs.

::: code-group

```ts [Deno]
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { ChoMessage, provider } from "@chojs/message";
import { App, Mailer } from "./app.ts";

Deno.test("orders.created", async () => {
  const sent: string[] = [];
  const app = await ChoMessage.create(App, {
    overrides: [
      provider({
        provide: Mailer,
        factory: () => ({ confirm: (order: { id: string }) => sent.push(order.id) }),
      }),
    ],
  });

  await app.handle("orders.created", { value: '{"id":"7","email":"a@b.c"}' });
  assertEquals(sent, ["7"]);

  await assertRejects(() => app.handle("orders.created", { value: "not json" }));
  await app.close();
});

// deno test
```

```ts [Node.js]
import assert from "node:assert/strict";
import { test } from "node:test";
import { ChoMessage, provider } from "@chojs/message";
import { App, Mailer } from "./app.ts";

test("orders.created", async () => {
  const sent: string[] = [];
  const app = await ChoMessage.create(App, {
    overrides: [
      provider({
        provide: Mailer,
        factory: () => ({ confirm: (order: { id: string }) => sent.push(order.id) }),
      }),
    ],
  });

  await app.handle("orders.created", { value: '{"id":"7","email":"a@b.c"}' });
  assert.deepEqual(sent, ["7"]);

  await assert.rejects(app.handle("orders.created", { value: "not json" }));
  await app.close();
});

// npx tsx --test
```

```ts [Bun]
import { expect, test } from "bun:test";
import { ChoMessage, provider } from "@chojs/message";
import { App, Mailer } from "./app.ts";

test("orders.created", async () => {
  const sent: string[] = [];
  const app = await ChoMessage.create(App, {
    overrides: [
      provider({
        provide: Mailer,
        factory: () => ({ confirm: (order: { id: string }) => sent.push(order.id) }),
      }),
    ],
  });

  await app.handle("orders.created", { value: '{"id":"7","email":"a@b.c"}' });
  expect(sent).toEqual(["7"]);

  await expect(app.handle("orders.created", { value: "not json" })).rejects.toThrow();
  await app.close();
});

// bun test
```

:::

## Testing the wiring

`ChoMessage.create` connects to nothing, so creating the application is a
test of its own: every provider resolves, every topic is valid, and no topic
is declared twice.

```ts
test("the application is wired", async () => {
  const app = await ChoMessage.create(App);

  assert.deepEqual(
    app.routes.map((route) => route.topic),
    ["orders.created", "orders.cancelled"],
  );
  await app.close();
});
```

## Keys, headers and bytes

```ts
await app.handle("orders.created", {
  value: new Uint8Array([1, 2, 3]), // bytes, for a binary format
  key: "42",
  headers: { "message-id": "abc", "tenant": "acme" },
});

await app.handle("orders.created"); // a message with no value
```

`ctx.native` is `undefined` in such a test. A handler that reads it is tested
with the route itself, which takes the adapter's message as its second
argument:

```ts
const route = app.routes.find((route) => route.topic === "orders.created")!;

await route.handle({ value: "{}" }, { partition: 0, offset: "12" });
```

## With a shared injector

An application made with [`ChoMessage.from`](/message/with-web) is tested the
same way. The overrides are given to the application that creates the
injector:

```ts
const web = await ChoWeb.create(App, {
  overrides: [provider({ provide: Mailer, factory: () => mailer })],
});
const messages = await ChoMessage.from(web.injector);

await messages.handle("orders.created", { value: '{"id":"42"}' });

await messages.close();
await web.close();
```
