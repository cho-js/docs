# Serve CHO routes with Hono

Use [`HonoLinker`](/api/vendor-hono#symbol-HonoLinker) to mount compiled routes on Hono. This gives controllers access to Hono middleware and native context while preserving the request and response interface used by the [HTTP tutorial](/web/quick-start).

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

To run a Hono middleware on just one CHO controller or method, wrap it with [`fromHono`](/api/vendor-hono#symbol-fromHono) from `@chojs/vendor-hono` and pass the result to [`@Middlewares`](/api/web#symbol-Middlewares). It runs at that position in the CHO chain and receives Hono's own context.

## Use native bindings

`ctx.native` contains Hono's `Context`, including [`env`](/api/core-utils#symbol-env) when supplied by the host. On a worker that needs bindings, forward the worker's `request`, `env` and execution context to the native Hono application's `fetch`. In controllers that need only the standard request, use `ctx.req`. Configure unmatched requests on Hono and route failures through [CHO error handlers](/web/error-handling).

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

With either router, a provider or controller can also import `env` and `waitUntil` from `cloudflare:workers`. Use that approach when a service needs a binding independently of Hono's native context. [Worker bindings and startup](/guide/cloudflare-workers#connect-a-binding-to-a-provider)

## Choose the middleware boundary

Use Hono's native middleware on the Hono instance when it should cover requests handled entirely by Hono. Use `fromHono` at a CHO controller or method when the policy belongs to that feature. Exercise a matching route and an unknown path to check the intended coverage.

## Pass a Hono variable to a CHO handler

If existing Hono middleware has already assigned a request ID, read that value from Hono's context inside the controller. Give the same environment type to the Hono instance and the context cast. The following fragments belong in the linker setup and controller respectively.

```ts
import { Hono, type Context } from "hono";

type Env = { Variables: { requestId: string } };
const hono = new Hono<Env>();
hono.use(async (ctx, next) => {
  ctx.set("requestId", crypto.randomUUID());
  await next();
});
const app = await ChoWeb.create(Library, { linker: new HonoLinker(hono) });
```

```ts
@Get("trace")
trace(ctx: ChoWebContext) {
  const native = ctx.native as Context<Env>;
  return { id: native.get("requestId") };
}
```

Two requests receive distinct IDs because the middleware assigns the variable for each Hono context. For values shared by CHO middleware across router implementations, use [request state](/web/context).
