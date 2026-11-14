# Web quick start

`@chojs/web` builds HTTP applications with decorators. Controllers declare
route handlers; `ChoWeb` turns the application into a `fetch`-style request
handler that any server can call.

- **Built on web standards.** Handlers receive the standard `Request` and
  answer with a standard `Response`.
- **No HTTP library needed.** A router on the standard URL Pattern API is
  built in, so an application depends on `@chojs/web` alone.
- **Or bring your own router.** A small [adapter](/adapters/) matches requests
  to routes on another library, such as Hono or Fastify.
- **Same behavior on every adapter.** Middlewares, error handling and the
  conversion of results are done by `@chojs/web` itself.
- **Fails early.** A bad route, a duplicate route or a missing provider is
  reported when the application is created, not on the first request.

## Install

::: code-group

```sh [Deno]
deno add jsr:@chojs/web
```

```sh [Node.js]
npx jsr add @chojs/web
```

```sh [Bun]
bunx jsr add @chojs/web
```

:::

Nothing else is needed: the [built-in router](/adapters/cho) matches the
requests. An [adapter](/adapters/) can replace it.

## An application

```ts
import {
  ChoWeb,
  type ChoWebContext,
  Controller,
  Get,
  Injectable,
  Module,
  Post,
} from "@chojs/web";

@Injectable()
class UserStore {
  find(id: string) {
    return { id, name: "Ada" };
  }
}

@Controller({ route: "users", dependencies: [UserStore] })
class UsersController {
  constructor(readonly store: UserStore) {}

  @Get(":id") // GET /v1/users/42
  get(ctx: ChoWebContext) {
    return this.store.find(ctx.params.id!); // sent as JSON
  }

  @Post("") // POST /v1/users
  async create(ctx: ChoWebContext) {
    const user = await ctx.req.json(); // ctx.req is the standard Request
    return Response.json(user, { status: 201 });
  }
}

@Module({ route: "v1", providers: [UserStore], controllers: [UsersController] })
class App {}

const app = await ChoWeb.create(App);
```

::: tip Parameters instead of the context
A handler can also declare what it receives:
`@Args(Param("id"))` on `get(id: string)`, or `@Args(Body())` on
`create(user: unknown)`. See [Handler arguments](/web/arguments).
:::

## Serve it

`app.handler` is a plain `(req: Request) => Promise<Response>`. `serve` gives
it to the server of the runtime: the same line runs on Deno, Node.js and Bun.

```ts
import { serve } from "@chojs/web/serve";

await serve(app.handler, { port: 3000 });
```

::: code-group

```sh [Deno]
deno run --allow-net --allow-env main.ts
```

```sh [Node.js]
npx tsx main.ts
```

```sh [Bun]
bun run main.ts
```

:::

```console
$ curl http://localhost:3000/v1/users/42
{"id":"42","name":"Ada"}

$ curl -X POST http://localhost:3000/v1/users -d '{"name":"Grace"}'
{"name":"Grace"}
```

## What to read next

| Topic                                | Page                                   |
| ------------------------------------ | -------------------------------------- |
| How paths are built and matched      | [Routing](/web/routing)                |
| What a handler receives              | [Request context](/web/context)        |
| Declaring the id, the query, the body as parameters | [Handler arguments](/web/arguments) |
| Validating a request, with zod or your own | [Validation](/web/validation)    |
| What a handler can return            | [Responses](/web/responses)            |
| Authentication, logging, timing      | [Middlewares](/web/middlewares)        |
| Turning errors into responses        | [Error handling](/web/error-handling)  |
| Options, shutdown, introspection     | [The application](/web/application)    |
| Summaries, tags and responses, for OpenAPI | [Describing the API](/web/api-docs) |
| Tests without a server               | [Testing](/web/testing)                |
| A complete application               | [Example: a REST API](/web/example)    |
