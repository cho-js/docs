# The application

`ChoWeb.create` turns a root module into a web application.

```ts
const app = await ChoWeb.create(App, {
  prefix: "api", //            optional: a prefix for every route
  onError: (error, ctx) => new Response("oops", { status: 500 }),
});
```

## Options

| Option      | Default  | Use                                                                      |
| ----------- | -------- | ------------------------------------------------------------------------ |
| `linker`    | the [built-in router](/adapters/cho) | A [runtime adapter](/adapters/), such as `new HonoLinker()` |
| `prefix`    | `""`     | A route prefix for every route, such as `"api"` ([Routing](/web/routing)) |
| `onError`   | none     | The error handler for what no `@Catch` covers ([Error handling](/web/error-handling)) |
| `overrides` | none     | Providers that replace declared ones, for [tests](/web/testing)          |

## What `create` does

1. Builds the injector: the module graph is read and validated.
2. Creates **every** instance of the application, up front.
3. Builds and checks the routes.
4. Registers them with the linker: the built-in router, or the adapter you
   gave.

Every wiring, route, middleware or error handler mistake makes it reject,
before the server starts. What was created until then is disposed.

```ts
try {
  const app = await ChoWeb.create(App);
  await serve(app.handler);
} catch (error) {
  console.error(error); // "Duplicate route …", "Cannot resolve …", …
  process.exit(1);
}
```

## What the application exposes

| Member            | Holds                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| `handler`         | The request handler: `(req: Request) => Promise<Response>`            |
| `close()`         | Releases the instances                                                |
| `routes`          | Every route: `method`, `path`, `name`                                 |
| `graph`           | The same routes as a tree: features, controllers, handlers            |
| `linked.instance` | The router's own object: a `ChoRouter` by default, a Hono or Fastify app with an adapter |

```ts
app.handler; //         serve it
app.linked.instance; // the ChoRouter (or the Hono application, with HonoLinker)
app.routes; //          [{ method: "GET", path: "/api/users/:id", name: "UsersController.get", … }]
await app.close();
```

## Serving

`ChoWeb` does not run a server: it gives you a handler. `serve`, from
`@chojs/web/serve`, gives that handler to the server of the runtime it runs on:
`Deno.serve` on Deno, `Bun.serve` on Bun, and the HTTP server of Node.js.

```ts
import { serve } from "@chojs/web/serve";

const server = await serve(app.handler, { port: 3000 });
console.log(`listening on http://localhost:${server.port}`);
```

| Option     | Default               | Use                                     |
| ---------- | --------------------- | --------------------------------------- |
| `port`     | `3000`                | The port; `0` picks a free one          |
| `hostname` | the runtime's default | The host name or address to listen on   |
| `signal`   | none                  | An `AbortSignal` that closes the server |

It resolves, once the server is listening, to `{ runtime, port, hostname,
close() }`. `serve` has no dependency, and is a separate import so that an
application that does not call it loads nothing of it.

Some runtimes are served differently:

::: code-group

```ts [Cloudflare Workers, edge]
// The runtime is the server: export the handler.
let app: Promise<ChoWeb> | undefined;

export default {
  async fetch(req: Request) {
    app ??= ChoWeb.create(App);
    return (await app).handler(req);
  },
};
```

```ts [Fastify]
// with: new FastifyLinker() from "@chojs/vendor-fastify"
await app.linked.instance.listen({ port: 3000 });
```

```ts [By hand]
// The runtime's own server takes the handler too.
Deno.serve({ port: 3000 }, app.handler);
Bun.serve({ port: 3000, fetch: app.handler });
```

:::

## Shutting down

`app.close()` disposes the application's instances, in reverse creation order:
every provider, controller or module with a `[Symbol.asyncDispose]()` or
`[Symbol.dispose]()` method ([Lifecycle](/di/lifecycle#releasing-instances)).

`ChoWeb` does not run the server, so it never closes on its own: **stop the
server first, then close.**

::: code-group

```ts [serve]
const server = await serve(app.handler);

process.once("SIGTERM", async () => {
  await server.close(); // stop accepting, finish the requests in flight
  await app.close();
});
```

```ts [Fastify]
const fastify = app.linked.instance;
await fastify.listen({ port: 3000 });

process.once("SIGTERM", async () => {
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
