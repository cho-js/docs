# Testing

`app.handler` takes a `Request` and resolves to a `Response`, so a test needs
no server, no port and no HTTP client.

```ts
const app = await ChoWeb.create(App, { linker: new HonoLinker() });

const response = await app.handler(new Request("http://localhost/v1/users/42"));

assert.equal(response.status, 200);
assert.deepEqual(await response.json(), { id: "42", name: "Ada" });

await app.close();
```

## Replacing providers

The `overrides` option replaces providers with fakes, anywhere in the module
graph, without changing a module:

```ts
import { provider } from "@chojs/web";

class FakeStore {
  find(id: string) {
    return { id, name: "Test" };
  }
}

const app = await ChoWeb.create(App, {
  linker: new HonoLinker(),
  overrides: [provider({ provide: UserStore, factory: () => new FakeStore() })],
});
```

An override that replaces nothing is an error, so a stale test fails loudly.
The rules are in [Lifecycle](/di/lifecycle#overrides-for-tests).

## A full test, on each runtime

The test body is the same; only the test runner differs.

::: code-group

```ts [Deno]
import { assertEquals } from "jsr:@std/assert";
import { ChoWeb, provider } from "@chojs/web";
import { HonoLinker } from "@chojs/vendor-hono";
import { App, UserStore } from "./app.ts";

Deno.test("GET /v1/users/:id", async () => {
  const app = await ChoWeb.create(App, {
    linker: new HonoLinker(),
    overrides: [
      provider({
        provide: UserStore,
        factory: () => ({ find: (id: string) => ({ id, name: "Test" }) }),
      }),
    ],
  });

  const res = await app.handler(new Request("http://localhost/v1/users/7"));

  assertEquals(res.status, 200);
  assertEquals(await res.json(), { id: "7", name: "Test" });
  await app.close();
});

// deno test
```

```ts [Node.js]
import assert from "node:assert/strict";
import { test } from "node:test";
import { ChoWeb, provider } from "@chojs/web";
import { HonoLinker } from "@chojs/vendor-hono";
import { App, UserStore } from "./app.ts";

test("GET /v1/users/:id", async () => {
  const app = await ChoWeb.create(App, {
    linker: new HonoLinker(),
    overrides: [
      provider({
        provide: UserStore,
        factory: () => ({ find: (id: string) => ({ id, name: "Test" }) }),
      }),
    ],
  });

  const res = await app.handler(new Request("http://localhost/v1/users/7"));

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { id: "7", name: "Test" });
  await app.close();
});

// npx tsx --test
```

```ts [Bun]
import { expect, test } from "bun:test";
import { ChoWeb, provider } from "@chojs/web";
import { HonoLinker } from "@chojs/vendor-hono";
import { App, UserStore } from "./app.ts";

test("GET /v1/users/:id", async () => {
  const app = await ChoWeb.create(App, {
    linker: new HonoLinker(),
    overrides: [
      provider({
        provide: UserStore,
        factory: () => ({ find: (id: string) => ({ id, name: "Test" }) }),
      }),
    ],
  });

  const res = await app.handler(new Request("http://localhost/v1/users/7"));

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ id: "7", name: "Test" });
  await app.close();
});

// bun test
```

:::

## Sending a body

```ts
const res = await app.handler(
  new Request("http://localhost/v1/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Grace" }),
  }),
);
assert.equal(res.status, 201);
```

## Tips

- **Export the root module** from a file that does not start a server, so tests
  import it without side effects. Keep `Deno.serve` and friends in `main.ts`.
- **Test one feature** by creating the application from the feature module
  instead of the root: any module can be a root.
- **Any adapter works** in tests. With the [Fastify adapter](/adapters/fastify),
  `app.handler` sends the request through Fastify's `inject()`, with no network
  connection.
- **Close the application** at the end of a test, so that what it created (a
  fake connection, a timer) is released.
- **Assert on wiring errors.** `ChoWeb.create` rejects on a bad graph; do not
  match on the message text, which can change between releases
  ([Error messages](/reference/errors)).
