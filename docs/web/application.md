# The application

`ChoWeb.create` turns a root module into a web application.

```ts
const app = await ChoWeb.create(App, {
  linker: new HonoLinker(), // required: the runtime adapter
  prefix: "api", //            optional: a prefix for every route
  onError: (error, ctx) => new Response("oops", { status: 500 }),
});
```

## Options

| Option      | Default  | Use                                                                      |
| ----------- | -------- | ------------------------------------------------------------------------ |
| `linker`    | required | The [runtime adapter](/adapters/), such as `new HonoLinker()`            |
| `prefix`    | `""`     | A route prefix for every route, such as `"api"` ([Routing](/web/routing)) |
| `onError`   | none     | The error handler for what no `@Catch` covers ([Error handling](/web/error-handling)) |
| `overrides` | none     | Providers that replace declared ones, for [tests](/web/testing)          |

## What `create` does

1. Builds the injector: the module graph is read and validated.
2. Creates **every** instance of the application, up front.
3. Builds and checks the routes.
4. Registers them with the adapter.

Every wiring, route, middleware or error handler mistake makes it reject,
before the server starts. What was created until then is disposed.

```ts
try {
  const app = await ChoWeb.create(App, { linker: new HonoLinker() });
  Deno.serve(app.handler);
} catch (error) {
  console.error(error); // "Duplicate route …", "Cannot resolve …", …
  Deno.exit(1);
}
```

## What the application exposes

| Member            | Holds                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| `handler`         | The request handler: `(req: Request) => Promise<Response>`            |
| `close()`         | Releases the instances                                                |
| `routes`          | Every route: `method`, `path`, `name`                                 |
| `graph`           | The same routes as a tree: features, controllers, handlers            |
| `linked.instance` | The adapter's own application object: a Hono app, a Fastify app, a `ChoRouter` |

```ts
app.handler; //         serve it
app.linked.instance; // the Hono application, with HonoLinker
app.routes; //          [{ method: "GET", path: "/api/users/:id", name: "UsersController.get", … }]
await app.close();
```

## Serving

`@chojs/web` does not run the server. It gives you a handler, and you give it
to the runtime's server:

::: code-group

```ts [Deno]
Deno.serve({ port: 3000 }, app.handler);
```

```ts [Node.js]
import { serve } from "@hono/node-server";

serve({ fetch: app.handler, port: 3000 });
```

```ts [Bun]
Bun.serve({ port: 3000, fetch: app.handler });
```

```ts [Node.js with Fastify]
await app.linked.instance.listen({ port: 3000 });
```

```ts [Edge]
let app: Promise<ChoWeb> | undefined;

export default {
  async fetch(req: Request) {
    app ??= ChoWeb.create(App, { linker: new HonoLinker() });
    return (await app).handler(req);
  },
};
```

:::

## Shutting down

`app.close()` disposes the application's instances, in reverse creation order:
every provider, controller or module with a `[Symbol.asyncDispose]()` or
`[Symbol.dispose]()` method ([Lifecycle](/di/lifecycle#releasing-instances)).

Because `@chojs/web` does not run the server, it never closes on its own:
**stop the server first, then close.**

::: code-group

```ts [Deno]
const server = Deno.serve(app.handler);

Deno.addSignalListener("SIGTERM", async () => {
  await server.shutdown(); // stop accepting, finish the requests in flight
  await app.close();
});
```

```ts [Node.js]
const server = serve({ fetch: app.handler, port: 3000 });

process.on("SIGTERM", () => {
  server.close(async () => {
    await app.close();
  });
});
```

```ts [Bun]
const server = Bun.serve({ fetch: app.handler });

process.on("SIGTERM", async () => {
  await server.stop();
  await app.close();
});
```

```ts [Node.js with Fastify]
const fastify = app.linked.instance;
await fastify.listen({ port: 3000 });

process.on("SIGTERM", async () => {
  await fastify.close();
  await app.close();
});
```

:::

A request that still reaches `app.handler` after `close()` is answered
`503 Service Unavailable`, and runs no route.

## Debug logging

```sh
CHO_DEBUGLOG=cho:web deno run --allow-net --allow-env main.ts
```

```
cho:web GET /v1/users/:id -> UsersController.get
cho:web GET /v1/users -> UsersController.list
cho:web application App created +2ms
cho:web ERROR GET /v1/users/1 failed: Error: db down
```

See [Debug logging](/reference/debugging).
