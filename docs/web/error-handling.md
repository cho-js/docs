# Error handling

An error thrown by a handler or a middleware goes to the nearest error
handler. What the error handler returns is the response.

```ts
import { Catch } from "@chojs/web";

class NotFound extends Error {}

@Catch((error, ctx) =>
  error instanceof NotFound
    ? new Response(`no user ${ctx.params.id}`, { status: 404 })
    : Response.json({ error: "internal error" }, { status: 500 })
)
@Controller({ route: "users", dependencies: [UserStore] })
class UsersController {
  constructor(readonly store: UserStore) {}

  @Get(":id")
  get(ctx: ChoWebContext) {
    const user = this.store.find(ctx.params.id!);
    if (!user) throw new NotFound();
    return user;
  }
}
```

## Where an error goes

`@Catch(handler)` applies to a handler, a controller or a feature module. An
error goes to the nearest one:

1. the `@Catch` of the handler, else
2. the `@Catch` of the controller, else
3. the `@Catch` of the feature module, else
4. the `onError` option of the application, else
5. the adapter, which answers `500`.

Only one of them runs: the nearest. A class or a method has at most one
`@Catch`.

```ts
@Catch((error) => Response.json({ error: String(error) }, { status: 500 }))
@Controller({ route: "users" })
class UsersController {
  @Catch((error, ctx) =>
    new Response(`no user ${ctx.params.id}`, { status: 404 })
  )
  @Get(":id")
  get(ctx: ChoWebContext) {/* ... */}
}
```

## The application's error handler

The `onError` option of `ChoWeb.create` is the fallback for every route, in
every feature, that no `@Catch` covers:

```ts
const app = await ChoWeb.create(App, {
  linker: new HonoLinker(),
  onError: (error, ctx) => {
    console.error(ctx.req.method, ctx.url.pathname, error);
    return Response.json({ error: "internal error" }, { status: 500 });
  },
});
```

It handles the errors of routes only. A request that matches no route never
reaches it: that answer belongs to the [adapter](/adapters/#behavior).

## What an error handler returns

Its result is converted like a handler's result
([Responses](/web/responses)): a `Response` as is, an object as JSON, and so
on. It can be `async`.

::: warning An error handler that returns nothing has not handled the error
A handler's `undefined` is a `204`. An error handler's is not, or a handler
that only logs would report every failed request as a success. The error goes
on to the adapter instead, which answers `500`.

```ts
@Catch((error) => {
  console.error(error); // logged, still a 500
})
```

To answer with an empty body, return a `Response`:
`new Response(null, { status: 204 })`.
:::

When an error handler throws, the error goes to the adapter too.

## Error handler classes

An error handler can be a class with a `handle(error, ctx)` method, created by
the injector like a [middleware class](/web/middlewares#middleware-classes):

```ts
@Injectable([Logger])
class ReportError {
  constructor(readonly logger: Logger) {}

  handle(error: unknown, ctx: ChoWebContext) {
    this.logger.error(ctx.req.method, ctx.url.pathname, error);
    return Response.json({ error: "internal error" }, { status: 500 });
  }
}

@Catch(ReportError)
@Module({ providers: [Logger, ReportError], controllers: [UsersController] })
class UsersModule {}
```

A class given to `@Catch` is created in the scope of the feature module; one
given to `onError`, in the scope of the root module.

## A pattern: HTTP errors

Errors that carry their own status keep handlers short and the mapping in one
place:

```ts
export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

// a handler
if (!user) throw new HttpError(404, "user not found");

// the application
const app = await ChoWeb.create(App, {
  linker: new HonoLinker(),
  onError: (error) =>
    error instanceof HttpError
      ? Response.json({ error: error.message }, { status: error.status })
      : Response.json({ error: "internal error" }, { status: 500 }),
});
```

## Unhandled errors

Without any error handler at any level, the error goes to the adapter:

| Adapter                 | Unhandled error                                           |
| ----------------------- | --------------------------------------------------------- |
| `@chojs/vendor-cho`     | Logged with `console.error`; `500`                        |
| `@chojs/vendor-hono`    | `onError` of the Hono application; logged, `500`          |
| `@chojs/vendor-fastify` | The error handler of the Fastify application; `500`       |

With [debug logging](/reference/debugging) enabled, every error a `@Catch`
handler receives is logged with the request's method and path.
