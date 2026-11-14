# Example: a REST API

A small but complete application: a feature module with a store, a controller
with every kind of handler, an authentication middleware class, error handling
and graceful shutdown. It runs unchanged on every runtime and adapter.

## The feature

::: code-group

```ts [todos/todo-store.ts]
import { Injectable } from "@chojs/web";

export type Todo = { id: string; title: string; done: boolean };

@Injectable()
export class TodoStore {
  readonly #todos = new Map<string, Todo>();

  list(): Todo[] {
    return [...this.#todos.values()];
  }

  find(id: string): Todo | undefined {
    return this.#todos.get(id);
  }

  add(title: string): Todo {
    const todo = { id: crypto.randomUUID(), title, done: false };
    this.#todos.set(todo.id, todo);
    return todo;
  }

  update(id: string, patch: Partial<Omit<Todo, "id">>): Todo | undefined {
    const todo = this.#todos.get(id);
    if (!todo) return undefined;
    Object.assign(todo, patch);
    return todo;
  }

  remove(id: string): boolean {
    return this.#todos.delete(id);
  }

  // called by app.close()
  [Symbol.dispose]() {
    this.#todos.clear();
  }
}
```

```ts [todos/todos.controller.ts]
import {
  type ChoWebContext,
  Controller,
  Delete,
  Get,
  Middlewares,
  Patch,
  Post,
} from "@chojs/web";
import { Auth } from "../auth.ts";
import { HttpError } from "../http-error.ts";
import { TodoStore } from "./todo-store.ts";

@Controller({ route: "todos", dependencies: [TodoStore] })
export class TodosController {
  constructor(readonly store: TodoStore) {}

  @Get("") // GET /api/todos?done=true
  list(ctx: ChoWebContext) {
    const done = ctx.url.searchParams.get("done");
    const todos = this.store.list();
    return done === null
      ? todos
      : todos.filter((todo) => todo.done === (done === "true"));
  }

  @Get(":id") // GET /api/todos/:id
  get(ctx: ChoWebContext) {
    const todo = this.store.find(ctx.params.id!);
    if (!todo) throw new HttpError(404, "todo not found");
    return todo;
  }

  @Middlewares(Auth)
  @Post("") // POST /api/todos
  async create(ctx: ChoWebContext) {
    const { title } = await ctx.req.json();
    if (typeof title !== "string" || title === "") {
      throw new HttpError(400, "title is required");
    }
    const todo = this.store.add(title);
    return Response.json(todo, {
      status: 201,
      headers: { location: `/api/todos/${todo.id}` },
    });
  }

  @Middlewares(Auth)
  @Patch(":id") // PATCH /api/todos/:id
  async update(ctx: ChoWebContext) {
    const todo = this.store.update(ctx.params.id!, await ctx.req.json());
    if (!todo) throw new HttpError(404, "todo not found");
    return todo;
  }

  @Middlewares(Auth)
  @Delete(":id") // DELETE /api/todos/:id
  remove(ctx: ChoWebContext) {
    if (!this.store.remove(ctx.params.id!)) {
      throw new HttpError(404, "todo not found");
    }
    // nothing returned: 204 No Content
  }
}
```

```ts [todos/todos.module.ts]
import { Module } from "@chojs/web";
import { Auth } from "../auth.ts";
import { ConfigModule } from "../config.module.ts";
import { TodoStore } from "./todo-store.ts";
import { TodosController } from "./todos.controller.ts";

@Module({
  imports: [ConfigModule], // exports API_KEY, which Auth depends on
  providers: [TodoStore, Auth],
  controllers: [TodosController],
})
export class TodosModule {}
```

:::

## Shared pieces

::: code-group

```ts [auth.ts]
import {
  type ChoWebContext,
  type ChoWebNext,
  Injectable,
  token,
} from "@chojs/web";

export const API_KEY = token<string>("API_KEY");

/** A middleware class: it has a dependency, so the injector creates it. */
@Injectable([API_KEY])
export class Auth {
  constructor(readonly key: string) {}

  handle(ctx: ChoWebContext, next: ChoWebNext) {
    if (ctx.req.headers.get("x-api-key") !== this.key) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    return next();
  }
}
```

```ts [http-error.ts]
export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}
```

```ts [config.module.ts]
import { Module, provider } from "@chojs/web";
import { API_KEY } from "./auth.ts";

// Deno: Deno.env.get(name). Node.js, Bun: process.env[name].
const readEnv = (name: string) => process.env[name];

@Module({
  providers: [
    provider({ provide: API_KEY, factory: () => readEnv("API_KEY") ?? "dev" }),
  ],
  exports: [API_KEY],
})
export class ConfigModule {}
```

```ts [app.ts]
import { type ChoWebErrorHandlerFn, Module } from "@chojs/web";
import { HttpError } from "./http-error.ts";
import { TodosModule } from "./todos/todos.module.ts";

@Module({ imports: [TodosModule] })
export class App {}

export const onError: ChoWebErrorHandlerFn = (error) => {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "internal error" }, { status: 500 });
};
```

:::

`Auth` is a provider of `TodosModule`, and
[dependencies resolve where the provider is declared](/di/modules#scope-rules),
so `API_KEY` must be visible there: `TodosModule` imports `ConfigModule`, which
exports it. `readEnv` is the one runtime-specific line of the application.

## The entry point

::: code-group

```ts [main.ts]
import { ChoWeb } from "@chojs/web";
import { serve } from "@chojs/web/serve";
import { App, onError } from "./app.ts";

const app = await ChoWeb.create(App, {
  prefix: "api",
  onError,
});

// the same file runs on Deno, Node.js and Bun
const server = await serve(app.handler, { port: 3000 });

process.once("SIGTERM", async () => {
  await server.close();
  await app.close();
});
```

```ts [main.ts: Node.js with Fastify]```ts [main.ts: Node.js with Fastify]
import { ChoWeb } from "@chojs/web";
import { FastifyLinker } from "@chojs/vendor-fastify";
import { App, onError } from "./app.ts";

const app = await ChoWeb.create(App, {
  linker: new FastifyLinker(),
  prefix: "api",
  onError,
});

const fastify = app.linked.instance;
await fastify.listen({ port: 3000 });

process.on("SIGTERM", async () => {
  await fastify.close();
  await app.close();
});
```

:::

## Try it

```console
$ curl -X POST localhost:3000/api/todos -H 'x-api-key: dev' -d '{"title":"Write docs"}'
{"id":"6f1c…","title":"Write docs","done":false}

$ curl localhost:3000/api/todos
[{"id":"6f1c…","title":"Write docs","done":false}]

$ curl -X POST localhost:3000/api/todos -d '{"title":"No key"}'
{"error":"unauthorized"}

$ curl localhost:3000/api/todos/nope
{"error":"todo not found"}
```

## A test

```ts
import { ChoWeb, provider } from "@chojs/web";
import { App, onError } from "./app.ts";
import { API_KEY } from "./auth.ts";

const app = await ChoWeb.create(App, {
  prefix: "api",
  onError,
  overrides: [provider({ provide: API_KEY, factory: () => "test-key" })],
});

const created = await app.handler(
  new Request("http://localhost/api/todos", {
    method: "POST",
    headers: { "x-api-key": "test-key" },
    body: JSON.stringify({ title: "Test" }),
  }),
);
// created.status === 201

await app.close();
```
