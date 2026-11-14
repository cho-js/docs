# The built-in router

`@chojs/web` matches requests to routes with the standard
[URL Pattern API](https://developer.mozilla.org/docs/Web/API/URL_Pattern_API),
and nothing else. There is no HTTP library underneath, no dependency, and
nothing to install: it is the router `ChoWeb.create` uses when it is given no
linker.

## Runtime support

The router needs the global `URLPattern`:

| Runtime            | Supported                               |
| ------------------ | --------------------------------------- |
| Deno               | Yes                                     |
| Node.js            | 24 and later                            |
| Bun                | 1.3.4 and later                         |
| Cloudflare Workers | Yes                                     |
| Anything else      | When `typeof URLPattern === "function"` |

On a runtime without it, `ChoWeb.create` fails with an error that says so. Use
the [Hono adapter](/adapters/hono) there.

## Usage

Give `ChoWeb.create` no linker:

```ts
import { ChoWeb } from "@chojs/web";
import { serve } from "@chojs/web/serve";

const app = await ChoWeb.create(App);

await serve(app.handler, { port: 3000 }); // Deno, Node.js and Bun
```

On Cloudflare Workers and other edge runtimes there is no server to start: the
entry module exports the handler.

```ts
let app: Promise<ChoWeb> | undefined;

export default {
  async fetch(req: Request) {
    app ??= ChoWeb.create(App);
    return (await app).handler(req);
  },
};
```

The router is the `ChoLinker` class of `@chojs/web`. Create it yourself to
give it options:

```ts
import { ChoLinker, ChoWeb } from "@chojs/web";

const app = await ChoWeb.create(App, { linker: new ChoLinker() });
```

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

There is no runtime context on this router: `ctx.native` is `undefined`.

## How it works

The router only matches requests. `@chojs/web` builds each route as one
function that runs its middlewares, its handler and its error handler; the
router makes one `URLPattern` for each route, and calls the first route whose
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
