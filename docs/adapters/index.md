# Choose an HTTP adapter

A linker registers CHO's compiled routes with a router. Choose it at `ChoWeb.create`, based on the environment that will receive requests and the native integrations the application needs.

## Compare the adapters

| Use case | Linker | Where to serve |
| --- | --- | --- |
| A Fetch-based service on a host with `URLPattern` | Built-in `ChoLinker` | `serve(app.handler)` or a worker's fetch entry point |
| Hono middleware, worker bindings or a host without `URLPattern` | `HonoLinker` | `serve(app.handler)` or a worker's fetch entry point |
| A Node.js service using Fastify plugins and hooks | `FastifyLinker` | `app.linked.instance.listen(...)` |

## Behavior

On Cloudflare Workers, both the built-in router and Hono run in CHO's dedicated `workerd` test suite. Use the built-in router for a Fetch entry point with `URLPattern`. Choose Hono when your application needs its native middleware or context. [Run a Worker locally](/guide/cloudflare-workers)

The linker receives each route with its full path and method. CHO already handles DI, argument evaluation, validation, response conversion and route-level errors. The router decides which route matches and what to send when none does.

| Behavior | Built-in | Hono | Fastify |
| --- | --- | --- | --- |
| Competing static and parameterized paths | First declared | First declared | Static path first |
| Native context | `undefined` | Hono `Context` | Fastify request and reply |
| Customize a miss | `notFound` option | `hono.notFound` | `setNotFoundHandler` |
| In-memory request testing | `app.handler` | `app.handler` | `app.handler` or `inject` |
| Stream over the network | Fetch handler | Fetch handler | Native Fastify listener |
| Register routes with `app.mount` | Also accepts mounts after a request | Before the first request | Before `ready()`, `listen()` or the first injected request |

On all three adapters, put literal routes before parameter routes and use Web APIs in controllers when you want to keep a choice of host. [Built-in router](/adapters/cho) · [Hono](/adapters/hono) · [Fastify](/adapters/fastify) · [Implement a linker](/adapters/custom)

## Move one endpoint between routers

Create the catalog application with the built-in linker, then create a fresh instance with Hono. Send the same Fetch request to each handler and compare its status and body. Next try overlapping paths or unmatched requests to see where router-specific configuration takes effect.
