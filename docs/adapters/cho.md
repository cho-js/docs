# Plain adapter

`@chojs/vendor-cho` matches requests to routes with the standard
[URL Pattern API](https://developer.mozilla.org/docs/Web/API/URL_Pattern_API),
and nothing else. There is no HTTP library underneath, and no dependency.

## Runtime support

The adapter needs the global `URLPattern`:

| Runtime            | Supported                               |
| ------------------ | --------------------------------------- |
| Deno               | Yes                                     |
| Node.js            | 24 and later                            |
| Bun                | 1.3.4 and later                         |
| Cloudflare Workers | Yes                                     |
| Anything else      | When `typeof URLPattern === "function"` |

On a runtime without it, `ChoWeb.create` fails with an error that says so. Use
the [Hono adapter](/adapters/hono) there.

## Install

::: code-group

```sh [Deno]
deno add jsr:@chojs/web jsr:@chojs/vendor-cho
```

```sh [Node.js]
npx jsr add @chojs/web @chojs/vendor-cho
npm install @hono/node-server
```

```sh [Bun]
bunx jsr add @chojs/web @chojs/vendor-cho
```

:::

## Usage

Pass a `ChoLinker` to `ChoWeb.create`:

```ts
import { ChoWeb } from "@chojs/web";
import { ChoLinker } from "@chojs/vendor-cho";

const app = await ChoWeb.create(App, { linker: new ChoLinker() });
```

::: code-group

```ts [Deno]
Deno.serve(app.handler);
```

```ts [Node.js]
import { serve } from "@hono/node-server";

serve({ fetch: app.handler, port: 3000 });
```

```ts [Bun]
Bun.serve({ fetch: app.handler });
```

```ts [Cloudflare Workers]
let app: Promise<ChoWeb> | undefined;

export default {
  async fetch(req: Request) {
    app ??= ChoWeb.create(App, { linker: new ChoLinker() });
    return (await app).handler(req);
  },
};
```

:::

On Node.js, `@hono/node-server` is only the bridge between Node's HTTP server
and a `fetch`-style handler; the routing is still the plain adapter's.

## Unmatched requests

A request no route matches is answered with `404` and the text `Not Found`.
Give the linker a `notFound` handler to answer it yourself:

```ts
const linker = new ChoLinker({
  notFound: (req) =>
    Response.json({ error: "not found", path: new URL(req.url).pathname }, {
      status: 404,
    }),
});

const app = await ChoWeb.create(App, { linker });
```

## The router

`app.linked.instance` is the `ChoRouter` of the application:

```ts
const router = app.linked.instance;

router.routes; //                    the routes, in declaration order
router.match("GET", "/users/42"); // { route, params: { id: "42" } }, or undefined
router.fetch; //                     the request handler, the same function as app.handler
```

There is no runtime context on this adapter: `ctx.native` is `undefined`.

## How it works

The adapter only matches requests. `@chojs/web` builds each route as one
function that runs its middlewares, its handler and its error handler; the
adapter makes one `URLPattern` for each route, and calls the first route whose
method and pattern match with the `Request` and the decoded path parameters.

## Behavior

| Topic              | Behavior                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Matching order     | Routes are matched in declaration order: declare static routes before parameter routes (`@Get("me")` before `@Get(":id")`) |
| Paths              | Matched as written: case and a trailing slash count. A parameter matches one segment, never an empty one                   |
| Path parameters    | Percent-decoded. One that cannot be decoded is passed as it was sent                                                       |
| `HEAD` requests    | Run the `@Head` handler of the route. Without one, the `@Get` handler answers, without the body                            |
| Unhandled errors   | A route that fails with no `@Catch` and no `onError` is logged with `console.error`, and answered with `500`               |
| Unmatched requests | Answered by the `notFound` option; `404` by default, also when the path exists under another method                        |
| HTTP methods       | Any method is matched as given                                                                                             |
| Several apps       | A linker can be used for several applications: each `link()` makes a new router                                            |
