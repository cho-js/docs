# Serve CHO routes with Hono

Use `HonoLinker` to mount compiled routes on Hono. This gives controllers access to Hono middleware and native context while preserving the request and response interface used by the [HTTP tutorial](/web/quick-start).

## Install and run

Add `@chojs/vendor-hono` using the JSR installer for your runtime. For example, run `deno add jsr:@chojs/vendor-hono` in the HTTP tutorial project. Replace its `main.ts` with:

```ts
import { ChoWeb } from "@chojs/web";
import { serve } from "@chojs/web/serve";
import { HonoLinker } from "@chojs/vendor-hono";
import { Library } from "./app.ts";

const app = await ChoWeb.create(Library, { prefix: "api", linker: new HonoLinker() });
await serve(app.handler, { port: 3000 });
```

Request `/api/books/42` to verify that the controller still receives the path parameter. Allocate a fresh linker for each application.

## Using Hono middlewares

When importing from `hono` directly, add Hono to the application's dependencies too. To wrap every request, configure the Hono instance before linking:

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";

const hono = new Hono();
hono.use(cors({ origin: "https://catalog.example" }));
hono.notFound((c) => c.json({ error: "Unknown route" }, 404));
const app = await ChoWeb.create(Library, { linker: new HonoLinker(hono) });
```

To run a Hono middleware on just one CHO controller or method, wrap it with `fromHono` from `@chojs/vendor-hono` and pass the result to `@Middlewares`. It runs at that position in the CHO chain and receives Hono's own context.

## Use native bindings

`ctx.native` contains Hono's `Context`, including `env` when supplied by the host. On a worker that needs bindings, forward the worker's `request`, `env` and execution context to the native Hono application's `fetch`. In controllers that need only the standard request, use `ctx.req`. Configure unmatched requests on Hono and route failures through [CHO error handlers](/web/error-handling).

### Forward worker bindings

For a Worker deployed with Hono, install `hono` directly so you can type its environment. This entry point accepts a `BRANCH` binding, forwards each request's bindings to Hono and keeps the compiled routes in the worker instance. A deployment can supply a different branch name without rebuilding the controllers.

```ts
import { Hono, type Context } from "hono";
import {
  ChoWeb, type ChoWebContext, Controller, Get, Module,
} from "@chojs/web";
import { HonoLinker } from "@chojs/vendor-hono";

type Bindings = { BRANCH: string };

@Controller()
class Branch {
  @Get("branch")
  current(ctx: ChoWebContext) {
    const native = ctx.native as Context<{ Bindings: Bindings }>;
    return { branch: native.env.BRANCH };
  }
}

@Module({ controllers: [Branch] })
class Library {}

const router = new Hono();
const ready = ChoWeb.create(Library, { linker: new HonoLinker(router) });

export default {
  async fetch(request: Request, env: Bindings) {
    await ready;
    return router.fetch(request, env);
  },
};
```

With `BRANCH=central` on the Worker, `GET /branch` returns `{"branch":"central"}`. If middleware needs `waitUntil`, also forward the worker's execution context as the third argument to `router.fetch`.
