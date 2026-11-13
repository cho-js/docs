# Choosing an adapter

`@chojs/web` depends on no HTTP library. A **runtime adapter** matches
requests to routes; `@chojs/web` does everything else itself, the same way on
every adapter: it creates the request context, runs the middlewares, the
handler and the error handler, and converts the result to a `Response`.

There are three.

| Adapter                                    | Router                                             | Runs on                                                 |
| ------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------- |
| [`@chojs/vendor-cho`](/adapters/cho)       | The standard URL Pattern API, with no HTTP library | Runtimes with `URLPattern`: Deno, Node.js 24, Bun 1.3.4 |
| [`@chojs/vendor-hono`](/adapters/hono)     | [Hono](https://hono.dev)                           | Deno, Node.js, Bun and edge runtimes                    |
| [`@chojs/vendor-fastify`](/adapters/fastify) | [Fastify](https://fastify.dev)                   | Node.js only                                            |

Pass the adapter's linker to `ChoWeb.create`:

::: code-group

```ts [Plain]
import { ChoLinker } from "@chojs/vendor-cho";

const app = await ChoWeb.create(App, { linker: new ChoLinker() });
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

Routes, middlewares and error handlers are the same on each. Changing adapter
is changing that one line, unless your code uses `ctx.native`.

## Which one

- **Hono** is the default choice: it runs everywhere, and gives you Hono's
  middlewares (`cors()`, `logger()`, …) for what should wrap every request.
- **Plain** when you want no dependency at all, and your runtime has
  `URLPattern`.
- **Fastify** when the application lives on Node.js and you want Fastify's
  server, plugins, hooks and logger.
- [**Your own**](/adapters/custom) when you already have a router: an adapter
  is a few lines.

## Behavior

What differs between the adapters:

|                        | `@chojs/vendor-cho`                | `@chojs/vendor-hono`                             | `@chojs/vendor-fastify`                                    |
| ---------------------- | ---------------------------------- | ------------------------------------------------ | ---------------------------------------------------------- |
| Linker                 | `new ChoLinker(options?)`          | `new HonoLinker(hono?)`                          | `new FastifyLinker(fastify?)`                              |
| `app.linked.instance`  | A `ChoRouter`                      | The `Hono` application                           | The Fastify application                                    |
| Served with            | `app.handler`                      | `app.handler`                                    | `instance.listen()`; `app.handler` goes through `inject()` |
| `ctx.native`           | `undefined`                        | Hono's `Context`                                 | `{ request, reply }` of Fastify                            |
| When two routes match  | The first declared                 | The first declared                               | The static one                                             |
| `HEAD` without `@Head` | `@Get`, without the body           | `@Get`, without the body                         | `@Get`, without the body                                   |
| No route matches       | The `notFound` option; `404`       | `notFound` of the Hono application               | The not-found handler of the Fastify application           |
| A route rejects        | Logged with `console.error`; `500` | `onError` of the Hono application; logged, `500` | The error handler of the Fastify application; `500`        |

"A route rejects" is what happens to an error that no `@Catch` and no
`onError` handled ([Error handling](/web/error-handling)).

::: tip Portable routes
Declare static routes before parameter routes (`@Get("me")` before
`@Get(":id")`), and a route means the same on all three.
:::
