---
outline: 2
---

# @chojs/vendor-hono

Pass an existing Hono application to the linker for router-wide setup, or adapt a native middleware at a CHO method. [Use Hono middleware in CHO](/adapters/hono) · [Browse all packages](/api/)

## ChoHonoErrorCode {#symbol-ChoHonoErrorCode}

The codes of the errors of `@chojs/vendor-hono`. Each is described in `README.md`.

A mistake the core finds for the package has a code of the core
(`ChoCoreErrorCode` of `@chojs/core`): an unknown option is
`CHO_CORE_UNKNOWN_OPTION`.

```ts
export type ChoHonoErrorCode = "CHO_HONO_ALREADY_LINKED" | "CHO_HONO_WRONG_ADAPTER";
```

### Usage {#ChoHonoErrorCode-usage}

```ts
const CODES: Record<ChoHonoErrorCode, true> = {
  CHO_HONO_ALREADY_LINKED: true,
  CHO_HONO_WRONG_ADAPTER: true,
};
```

[Usage in vendor/hono/errors_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/hono/errors_test.ts#L8)

## HonoLinked {#symbol-HonoLinked}

A Hono application linked by `HonoLinker`.

```ts
export class HonoLinked implements Linked<Hono> {

    readonly instance: Hono;
    constructor(instance: Hono);
    mount(route: Route): void;
    get handler(): (req: Request) => Promise<Response>;
}
```

**`mount`** Register one more route on the Hono application, after the routes it
has: what `app.mount` of `ChoWeb` calls.

Hono takes routes until it answers its first request: after it, this
throws Hono's error.

**`handler`** The Hono application's `fetch`, as a request handler.

**`instance`** The Hono application.

**`constructor`** Wrap a Hono application.

### Usage {#HonoLinked-usage}

```ts
const app = await ChoWeb.create(AppModule, { linker: new HonoLinker() });
app.linked.instance; // the Hono application
Deno.serve(app.linked.handler);
```

## HonoLinker {#symbol-HonoLinker}

Registers the routes of a CHO web application on a Hono application.

Hono only matches requests: each route is registered with its method and
its full path, and answers through `Route.handle`, which `@chojs/web`
built. Middlewares, error handlers and the conversion of results to
responses are `@chojs/web`'s, so they behave the same on every adapter.

- Handlers receive a `ChoWebContext`; Hono's own `Context` is its `native`
  property.
- Routes are matched in declaration order, `HEAD` routes first.
- A `HEAD` request runs the `@Head` handler of the route; without one, Hono
  answers it from the `@Get` handler, without the body.
- A route that fails without a `@Catch` handler goes to Hono's error
  handler, which logs the error and answers `500` (see `app.onError`).
- A route mounted on the application (`app.mount`) is registered after the
  others, until Hono answers its first request: after it, Hono throws.
- Hono middlewares (`cors()`, `logger()`, ...) are not CHO middlewares. To
  use them, add them to a Hono application and give it to the linker: the
  routes are registered after them, so they wrap every route.

```ts
export class HonoLinker implements Linker<Hono> {

    constructor(app?: Hono);
    link(routes: readonly Route[]): HonoLinked;
}
```

**`link`** Register routes on the linker's Hono application.

**`constructor`** Create a linker.

### Usage {#HonoLinker-usage}

```ts
import { ChoWeb } from "@chojs/web";
import { HonoLinker } from "@chojs/vendor-hono";

const app = await ChoWeb.create(AppModule, { linker: new HonoLinker() });
Deno.serve(app.handler);
```

With Hono middlewares
```ts
import { Hono } from "hono";
import { cors } from "hono/cors";

const hono = new Hono();
hono.use(cors());
const app = await ChoWeb.create(AppModule, { linker: new HonoLinker(hono) });
```

## fromHono {#symbol-fromHono}

Turn a Hono middleware into a CHO middleware, so that the middlewares that
come with Hono (`cors()`, `basicAuth()`, `etag()`, `secureHeaders()`, ...)
can be given to `@Middlewares`, on a handler, a controller or a feature
module.

The Hono middleware runs with the Hono context of the request, at the
place of the CHO middleware in the chain:

- its `next()` runs the rest of the CHO chain (the next middlewares, then
  the handler), and sets `c.res` to the response, which the middleware can
  read and change;
- a `Response` it returns answers the request;
- an `HTTPException` it throws is answered with the exception's response,
  as Hono does. Any other error goes to the CHO error handlers.

It only works for an application created with a `HonoLinker`: on
another adapter the middleware throws.

A middleware that must also cover the requests no route matches (CORS
preflight requests of paths without an `OPTIONS` route, say) belongs on the
Hono application given to the linker instead (`hono.use(cors())`).

```ts
export function fromHono(middleware: MiddlewareHandler): ChoWebMiddlewareFn;
```

### Usage {#fromHono-usage}

```ts
import { basicAuth } from "hono/basic-auth";
import { etag } from "hono/etag";
import { Controller, Get, Middlewares } from "@chojs/web";
import { fromHono } from "@chojs/vendor-hono";

@Middlewares(fromHono(basicAuth({ username: "ada", password: "secret" })))
@Controller({ route: "admin" })
class AdminController {
  @Middlewares(fromHono(etag()))
  @Get("report")
  report() {
    return { users: 3 };
  }
}
```

## Also exported here

These declarations share their implementation with another entry point. Each link opens the full declaration.

[`ChoWebContext`](/api/web#symbol-ChoWebContext), [`ChoWebMiddlewareFn`](/api/web#symbol-ChoWebMiddlewareFn), [`ChoWebNext`](/api/web#symbol-ChoWebNext), [`Linked`](/api/web#symbol-Linked), [`Linker`](/api/web#symbol-Linker), [`Route`](/api/web#symbol-Route)
