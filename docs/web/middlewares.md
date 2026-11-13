# Middlewares

A middleware wraps what comes after it: the next middlewares, then the
handler. `@Middlewares(...)` applies to a feature module, a controller or a
handler.

```ts
import { type ChoWebMiddlewareFn, Middlewares } from "@chojs/web";

const auth: ChoWebMiddlewareFn = (ctx, next) =>
  ctx.req.headers.has("authorization")
    ? next()
    : new Response("unauthorized", { status: 401 }); // answers early

const timing: ChoWebMiddlewareFn = async (ctx, next) => {
  const start = Date.now();
  const response = await next();
  response.headers.set("x-time", `${Date.now() - start}ms`);
  return response;
};

@Middlewares(auth) // every route of the controller
@Controller({ route: "admin" })
class AdminController {
  @Middlewares(timing) // this route only
  @Get("stats")
  stats() {
    return { users: 3 };
  }
}
```

## What a middleware can do

A middleware is called with the [context](/web/context) and `next`:

- **`next()`** runs the rest of the chain and resolves to its `Response`.
- **Returning a `Response`** answers the request with it: without calling
  `next()` to answer early, or after it to replace the response.
- **Returning nothing** after calling `next()` passes the response on, so
  `await next();` alone is enough.

::: code-group

```ts [Before the handler]
const requireJson: ChoWebMiddlewareFn = (ctx, next) =>
  ctx.req.headers.get("content-type")?.includes("application/json")
    ? next()
    : new Response("expected JSON", { status: 415 });
```

```ts [After the handler]
const noStore: ChoWebMiddlewareFn = async (_ctx, next) => {
  const response = await next();
  response.headers.set("cache-control", "no-store");
  return response;
};
```

```ts [Around the handler]
const log: ChoWebMiddlewareFn = async (ctx, next) => {
  const start = performance.now();
  try {
    await next(); // returns nothing: the response is passed on
  } finally {
    const ms = Math.round(performance.now() - start);
    console.log(ctx.req.method, ctx.url.pathname, `${ms}ms`);
  }
};
```

```ts [Preparing the context]
const loadUser: ChoWebMiddlewareFn = async (ctx, next) => {
  ctx.state.set("user", await findUser(ctx.req));
  return next();
};
```

:::

A middleware that calls `next()` twice, returns something that is not a
`Response`, or returns nothing without calling `next()`, makes the request
fail; the error goes to the [error handler](/web/error-handling).

## Middleware classes

A middleware can also be a class with a `handle(ctx, next)` method. It is
created by the injector, so it can have dependencies:

```ts
@Injectable([Tokens])
class Auth {
  constructor(readonly tokens: Tokens) {}

  handle(ctx: ChoWebContext, next: ChoWebNext) {
    const user = this.tokens.user(ctx.req.headers.get("authorization"));
    if (!user) {
      return new Response("unauthorized", { status: 401 });
    }
    ctx.state.set("user", user); // for the handler
    return next();
  }
}

@Middlewares(Auth)
@Controller({ route: "admin" })
class AdminController {
  @Get("me")
  me(ctx: ChoWebContext) {
    return ctx.state.get("user");
  }
}

@Module({
  providers: [Tokens, Auth], // the class is a provider of the feature module
  controllers: [AdminController],
})
class AdminModule {}
```

The class is created in the scope of the feature module, so it must be a
provider visible there: one of its `providers`, or exported by a module it
imports. Like every provider it is a singleton, created when the application
is.

## Levels and order

```ts
@Middlewares(a) //        feature: every route of the module
@Module({ controllers: [UsersController] })
class UsersModule {}

@Middlewares(b, c) //     controller: every route of the controller
@Controller({ route: "users" })
class UsersController {
  @Middlewares(d) //      handler: this route only
  @Get(":id")
  get() {}
}

// a → b → c → d → get → d → c → b → a
```

A request runs the feature's middlewares, then the controller's, then the
handler's, each in declaration order.

**Middlewares belong to their routes.** They only run for a request that
matches a route they apply to: never for another feature's or controller's
routes, nor for a request that matches nothing.

## Application-wide middlewares

There is no global CHO middleware, because features are independent. For
something that wraps every request, unmatched ones included, use the HTTP
library through the adapter:

::: code-group

```ts [Hono]
import { Hono } from "hono";
import { cors } from "hono/cors";

const hono = new Hono();
hono.use(cors());

const app = await ChoWeb.create(App, { linker: new HonoLinker(hono) });
```

```ts [Fastify]
import Fastify from "fastify";
import cors from "@fastify/cors";

const fastify = Fastify();
await fastify.register(cors);

const app = await ChoWeb.create(App, { linker: new FastifyLinker(fastify) });
```

```ts [Any adapter]
// app.handler is a function: wrap it.
const handler = async (req: Request) => {
  const response = await app.handler(req);
  response.headers.set("x-powered-by", "cho");
  return response;
};

Deno.serve(handler);
```

:::

Middlewares of the HTTP library (Hono's `cors()`, Fastify plugins) are written
for that library's context, so they are not CHO middlewares and cannot be
given to `@Middlewares`.
