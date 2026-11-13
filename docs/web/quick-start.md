# Web quick start

`@chojs/web` builds HTTP applications with decorators. Controllers declare
route handlers; `ChoWeb` turns the application into a `fetch`-style request
handler that any server can call.

- **Built on web standards.** Handlers receive the standard `Request` and
  answer with a standard `Response`.
- **Bring your own router.** `@chojs/web` depends on no HTTP library. A small
  [adapter](/adapters/) matches requests to routes.
- **Same behavior on every adapter.** Middlewares, error handling and the
  conversion of results are done by `@chojs/web` itself.
- **Fails early.** A bad route, a duplicate route or a missing provider is
  reported when the application is created, not on the first request.

## Install

::: code-group

```sh [Deno]
deno add jsr:@chojs/web jsr:@chojs/vendor-hono
```

```sh [Node.js]
npx jsr add @chojs/web @chojs/vendor-hono
npm install @hono/node-server
```

```sh [Bun]
bunx jsr add @chojs/web @chojs/vendor-hono
```

:::

Any [adapter](/adapters/) can replace `@chojs/vendor-hono`.

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
import { HonoLinker } from "@chojs/vendor-hono";

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

const app = await ChoWeb.create(App, { linker: new HonoLinker() });
```

## Serve it

`app.handler` is a plain `(req: Request) => Promise<Response>`.

::: code-group

```ts [Deno]
Deno.serve({ port: 3000 }, app.handler);
```

```ts [Node.js]
import { serve } from "@hono/node-server";

serve({ fetch: app.handler, port: 3000 });
```

```ts [Bun]
Bun.serve({ port: 3000, fetch: app.handler });
```

```ts [Node.js with Fastify]
// with: new FastifyLinker() from "@chojs/vendor-fastify"
await app.linked.instance.listen({ port: 3000 });
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
| What a handler can return            | [Responses](/web/responses)            |
| Authentication, logging, timing      | [Middlewares](/web/middlewares)        |
| Turning errors into responses        | [Error handling](/web/error-handling)  |
| Options, shutdown, introspection     | [The application](/web/application)    |
| Tests without a server               | [Testing](/web/testing)                |
| A complete application               | [Example: a REST API](/web/example)    |
