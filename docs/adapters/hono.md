# Hono adapter

`@chojs/vendor-hono` registers the routes of a CHO web application on a
[Hono](https://hono.dev) application. It runs wherever Hono does: Deno,
Node.js, Bun and edge runtimes.

## Install

::: code-group

```sh [Deno]
deno add jsr:@chojs/web jsr:@chojs/vendor-hono
```

```sh [Node.js]
npx jsr add @chojs/web @chojs/vendor-hono
```

```sh [Bun]
bunx jsr add @chojs/web @chojs/vendor-hono
```

:::

Hono comes with the adapter. Add it to your own dependencies (`hono`) when you
create the Hono application yourself, as below.

## Usage

Pass a `HonoLinker` to `ChoWeb.create`:

```ts
import { ChoWeb } from "@chojs/web";
import { HonoLinker } from "@chojs/vendor-hono";

const app = await ChoWeb.create(App, { linker: new HonoLinker() });

app.linked.instance; // the Hono application
```

Serve it like any CHO web application:

::: code-group

```ts [Deno, Node.js, Bun]
import { serve } from "@chojs/web/serve";

await serve(app.handler, { port: 3000 });
```

```ts [Cloudflare Workers]
let app: Promise<ChoWeb> | undefined;

export default {
  async fetch(req: Request) {
    app ??= ChoWeb.create(App, { linker: new HonoLinker() });
    return (await app).handler(req);
  },
};
```

:::

## Using Hono middlewares

Hono middlewares (`cors()`, `logger()`, …) are written for Hono's context, so
they are not CHO middlewares. Add them to a Hono application and give it to
the linker. The routes are registered after them, so they wrap every route:

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const hono = new Hono();
hono.use(logger());
hono.use(cors());
hono.notFound((c) => c.json({ error: "not found" }, 404));
hono.onError((error, c) => c.json({ error: "internal error" }, 500));

const app = await ChoWeb.create(App, { linker: new HonoLinker(hono) });
```

The same Hono application takes your `onError` and `notFound` handlers, and
any route you add to it yourself.

## Reaching Hono from a handler

Handlers, middlewares and error handlers receive a `ChoWebContext`, not Hono's
`Context`. Hono's is its `native` property, for what only Hono can do:

```ts
import type { Context } from "hono";

@Get("env")
env(ctx: ChoWebContext) {
  return (ctx.native as Context).env; // the bindings of an edge runtime
}
```

A handler that uses it only runs on this adapter.

## How it works

The adapter only matches requests. `@chojs/web` builds each route as one
function that runs its middlewares, its handler and its error handler; the
adapter registers it on Hono with its method and full path, and calls it with
the raw `Request`, Hono's decoded path parameters and Hono's context.

## Behavior

| Topic               | Behavior                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Matching order      | Routes are matched in declaration order: declare static routes before parameter routes (`@Get("me")` before `@Get(":id")`) |
| `HEAD` requests     | Run the `@Head` handler of the route, matched before the others. Without one, Hono answers from `@Get`, without the body   |
| Unhandled errors    | A route that fails with no `@Catch` and no `onError` goes to Hono's error handler, which logs it and answers `500`         |
| Unmatched requests  | Answered by Hono's `notFound`                                                                                              |
| HTTP methods        | Any method is registered as given                                                                                          |
| One linker, one app | A second `link()` on the same linker throws: its Hono application already holds the routes of the first                    |
