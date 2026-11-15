# Request context

A handler receives the context of the request, a `ChoWebContext`:

| Property | Holds                                                                         |
| -------- | ----------------------------------------------------------------------------- |
| `req`    | The standard `Request`: `ctx.req.json()`, `ctx.req.headers`, …                |
| `params` | The path parameters of the route, decoded: `ctx.params.id`                    |
| `url`    | The request URL, parsed on first use: `ctx.url.searchParams`                  |
| `state`  | A `Map` for the request: what a middleware sets, later ones and handlers read |
| `native` | The adapter's own context, for what only that adapter can do                  |

The middlewares, the handler and the error handler of a request share one
context.

## Reading the request

`ctx.req` is the platform's `Request`. Everything you know about it applies.

::: code-group

```ts [Path parameters]
@Get("users/:id")
get(ctx: ChoWebContext) {
  return { id: ctx.params.id };
}
```

```ts [Query string]
// GET /search?q=cho&page=2
@Get("search")
search(ctx: ChoWebContext) {
  const q = ctx.url.searchParams.get("q") ?? "";
  const page = Number(ctx.url.searchParams.get("page") ?? 1);
  return { q, page };
}
```

```ts [Headers]
@Get("whoami")
whoami(ctx: ChoWebContext) {
  return { agent: ctx.req.headers.get("user-agent") };
}
```

```ts [JSON body]
@Post("users")
async create(ctx: ChoWebContext) {
  const body = await ctx.req.json();
  return Response.json(body, { status: 201 });
}
```

```ts [Form and files]
@Post("upload")
async upload(ctx: ChoWebContext) {
  const form = await ctx.req.formData();
  const file = form.get("file") as File;
  return { name: file.name, size: file.size };
}
```

```ts [Raw body]
@Post("import")
async import(ctx: ChoWebContext) {
  const text = await ctx.req.text();
  const stream = ctx.req.body; // or a ReadableStream
}
```

:::

Uploads have a recipe: [Receive an uploaded file](/recipes/uploads).

::: info
With `noUncheckedIndexedAccess`, `ctx.params.id` is `string | undefined`. The
route guarantees the parameter, so `ctx.params.id!` is safe in its handler.
:::

::: tip Declare it instead
A handler can receive the id, the query or the parsed body as parameters, with
`@Args(Param("id"), Body())`, and reach the context as the last parameter.
See [Handler arguments](/web/arguments).
:::

## Sharing values: `state`

`ctx.state` is a `Map` that lives for one request. A middleware sets a value;
the middlewares and the handler after it read it.

```ts
const auth: ChoWebMiddlewareFn = async (ctx, next) => {
  const user = await verify(ctx.req.headers.get("authorization"));
  if (!user) {
    return new Response("unauthorized", { status: 401 });
  }
  ctx.state.set("user", user);
  return next();
};

@Middlewares(auth)
@Controller({ route: "me" })
class MeController {
  @Get("")
  me(ctx: ChoWebContext) {
    return ctx.state.get("user");
  }
}
```

Keys can be strings or symbols. For typed access, keep the key and the type
together in a pair of helpers:

```ts
const USER = Symbol("user");

export const setUser = (ctx: ChoWebContext, user: User) =>
  ctx.state.set(USER, user);
export const getUser = (ctx: ChoWebContext) => ctx.state.get(USER) as User;
```

This is where request data belongs. Providers are singletons: do not store a
request's data in them.

## The adapter's context: `native`

`ctx.native` is whatever the adapter passes along:

| Adapter                 | `ctx.native`                    |
| ----------------------- | ------------------------------- |
| Built in                | `undefined`                     |
| `@chojs/vendor-hono`    | Hono's `Context`                |
| `@chojs/vendor-fastify` | `{ request, reply }` of Fastify |

```ts
import type { Context } from "hono";

@Get("env")
env(ctx: ChoWebContext) {
  return (ctx.native as Context).env;
}
```

::: warning
Code that uses `native` only runs on that adapter. Everything else on the
context is the same on all of them.
:::

## Handlers and `this`

A handler runs on its controller instance, so `this` works. Controllers are
created once, with their dependencies, when the application is created. A
handler can be `async`.
