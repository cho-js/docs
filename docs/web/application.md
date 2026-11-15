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
| `closeTimeout` | none              | How long closing waits for the requests in flight, in milliseconds ([Shutting down](#shutting-down)) |

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
const server = await serve(app.handler, { closeTimeout: 10_000 });

process.once("SIGTERM", async () => {
  // stop accepting, give the requests in flight 10 seconds to finish
  await server.close();
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

`server.close()` stops accepting requests and waits for the ones in flight. A
request that never ends, such as an open stream of
[server-sent events](/web/sse), would hold it for ever. With the `closeTimeout`
option of `serve`, closing waits that many milliseconds, and then cuts the
connections of the requests that are still in flight; `0` cuts them at once.

- A request that ends in time is not cut, and closing does not wait for the rest
  of the timeout.
- The handler of a request that is cut sees what it sees when a client goes
  away: `ctx.req.signal` is aborted, and the iteration of an `@Sse` handler is
  ended.
- The timeout also applies when the `signal` option closes the server.
- On Deno, a request that arrives while such a server is closing is answered
  `503`.

A request that still reaches `app.handler` after `close()` is answered
`503 Service Unavailable`, and runs no route.

The whole of it, with both signals, is a recipe:
[Shut down gracefully](/recipes/shutdown).

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
