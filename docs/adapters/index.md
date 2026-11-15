# Choosing an adapter

Something has to match each request to a route. `@chojs/web` has a router for
that built in, so an application needs no adapter at all. A **runtime adapter**
does the matching on another HTTP library instead.

Whatever matches the requests, `@chojs/web` does everything else itself, the
same way: it creates the request context, runs the middlewares, the handler and
the error handler, and converts the result to a `Response`.

| Router                                       | Matches with                                       | Runs on                                                                     |
| -------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| [Built in](/adapters/cho)                    | The standard URL Pattern API, with no HTTP library | Runtimes with `URLPattern`: Deno, Node.js 24, Bun 1.3.4, Cloudflare Workers |
| [`@chojs/vendor-hono`](/adapters/hono)       | [Hono](https://hono.dev)                           | Deno, Node.js, Bun and edge runtimes                                        |
| [`@chojs/vendor-fastify`](/adapters/fastify) | [Fastify](https://fastify.dev)                     | Node.js only                                                                |

The built-in router is used when `ChoWeb.create` is given no linker. To use an
adapter, pass its linker:

::: code-group

```ts [Built in]
const app = await ChoWeb.create(App);
```

```ts [Hono]
import { HonoLinker } from "@chojs/vendor-hono";

const app = await ChoWeb.create(App, { linker: new HonoLinker() });
```

```ts [Fastify]
import { FastifyLinker } from "@chojs/vendor-fastify";

const app = await ChoWeb.create(App, { linker: new FastifyLinker() });
```

:::

Routes, middlewares and error handlers are the same on each. Changing router is
changing that one line, unless your code uses `ctx.native`.

## Which one

- **Built in** is the default: no dependency, and nothing to choose. It needs
  a runtime that has `URLPattern`.
- **Hono** when you want Hono's middlewares (`cors()`, `logger()`, …) around
  every request, when the runtime has no `URLPattern`, or when handlers need
  the platform context of an edge runtime.
- **Fastify** when the application lives on Node.js and you want Fastify's
  server, plugins, hooks and logger.
- [**Your own**](/adapters/custom) when you already have a router: an adapter
  is a few lines.

## Behavior

What differs between them:

|                        | Built in                           | `@chojs/vendor-hono`                             | `@chojs/vendor-fastify`                                    |
| ---------------------- | ---------------------------------- | ------------------------------------------------ | ---------------------------------------------------------- |
| Linker                 | `new ChoLinker(options?)`          | `new HonoLinker(hono?)`                          | `new FastifyLinker(fastify?)`                              |
| `app.linked.instance`  | A `ChoRouter`                      | The `Hono` application                           | The Fastify application                                    |
| Served with            | `app.handler`                      | `app.handler`                                    | `instance.listen()`; `app.handler` goes through `inject()` |
| `ctx.native`           | `undefined`                        | Hono's `Context`                                 | `{ request, reply }` of Fastify                            |
| When two routes match  | The first declared                 | The first declared                               | The static one                                             |
| `HEAD` without `@Head` | `@Get`, without the body           | `@Get`, without the body                         | `@Get`, without the body                                   |
| [Server-sent events](/web/sse) | Sent as they come          | Sent as they come                                | Sent as they come by `listen()`; `app.handler` waits for the end |
| No route matches       | The `notFound` option; `404`       | `notFound` of the Hono application               | The not-found handler of the Fastify application           |
| A route rejects        | Logged with `console.error`; `500` | `onError` of the Hono application; logged, `500` | The error handler of the Fastify application; `500`        |
| Its own middlewares    | [`@chojs/vendor-cho`](/adapters/middlewares) | [`fromHono(middleware)`](/adapters/hono#using-hono-middlewares) | [`fromFastify(hook)`](/adapters/fastify#using-fastify-options-plugins-and-hooks) |

"A route rejects" is what happens to an error that no `@Catch` and no
`onError` handled ([Error handling](/web/error-handling)).

::: tip Portable routes
Declare static routes before parameter routes (`@Get("me")` before
`@Get(":id")`), and a route means the same on all three.
:::
