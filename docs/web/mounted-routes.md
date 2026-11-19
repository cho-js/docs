# Mount a route on an initialized application

Use `app.mount` when an endpoint needs the initialized application itself. For example, a route inventory can read `app.routes` only after CHO has compiled the controllers. Register it between `ChoWeb.create` and the first request.

## List the routes in a local application

Using `app.ts` from the [HTTP quick start](/web/quick-start), replace `main.ts` with the following:

```ts
import { serve } from "@chojs/web/serve";
import { createApp } from "./app.ts";

const app = await createApp();
app.mount(
  "GET",
  "internal/routes",
  () => app.routes.map(({ method, path }) => ({ method, path })),
  { name: "routeInventory" },
);
await serve(app.handler, { hostname: "127.0.0.1", port: 3000 });
```

Run the application and request `http://127.0.0.1:3000/internal/routes`. The list includes `GET /api/books/:id` and `GET /internal/routes`. The mounted path is complete as written. To place it under `/api`, explicitly mount `"api/internal/routes"`.

## Match and handle a request

- Supply an uppercase `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD` or `OPTIONS`. Paths accept the same segments as controller routes, including `":id"` and `""` for the root.
- The handler receives [`ChoWebContext`](/api/web#symbol-ChoWebContext). Read decoded captures from `ctx.params` and return any [supported response value](/web/responses).
- Pass route-specific middleware **functions** in `{ middlewares: [guard, audit] }`. Feature and controller decorators belong to declared routes. Router-wide middleware still wraps mounted requests. An uncaught error in a mounted route goes to the application's `onError`, when configured.
- `name` identifies the route in diagnostics. It defaults to the function's name, or `"mounted"` for an anonymous handler.

## Choose the registration time

A successful mount appends to `app.routes`. `app.graph` continues to describe controller declarations. Reusing a method and equivalent path throws, including paths differing only in parameter names. Distinct routes can still compete: on the built-in router and Hono an earlier root `GET /:slug` can receive `GET /docs` before a later mounted page. Fastify gives static routes precedence.

Mount before serving for portability. The built-in router can accept further mounts after requests. Hono closes registration after its first request, and Fastify closes it when ready, including after `ready()`, `listen()` or the first injected request. A closed CHO application rejects new mounts.

## Mount an operational endpoint

Add `app.mount("GET", "health", () => ({ ready: true }))` immediately after creation. Request `/health` and inspect `app.routes`. To protect this endpoint, pass its middleware in the mount options. A route added here has no declaring controller.
