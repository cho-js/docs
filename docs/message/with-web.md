# With a web application

An application that answers HTTP requests **and** handles messages should
have one set of instances: one database pool, one cache, one configuration.
`ChoMessage.from` builds the message application on the injector of the web
application.

```ts
import { ChoWeb } from "@chojs/web";
import { serve } from "@chojs/web/serve";
import { ChoMessage } from "@chojs/message";

const web = await ChoWeb.create(App);
const messages = await ChoMessage.from(web.injector, { linker });

const server = await serve(web.handler, { port: 3000, closeTimeout: 10_000 });
await messages.start();
```

`web.injector` holds every instance `ChoWeb.create` made. `ChoMessage.from`
finds the controllers with `@Subscribe` handlers in the same module graph,
and creates nothing that exists.

## One module graph, two kinds of controllers

```ts
// orders.http.ts
import { type ChoWebContext, Controller, Get } from "@chojs/web";

@Controller({ route: "orders", dependencies: [OrderStore] })
export class OrdersHttpController {
  constructor(readonly store: OrderStore) {}

  @Get(":id")
  get(ctx: ChoWebContext) {
    return this.store.find(ctx.params.id!);
  }
}
```

```ts
// orders.messages.ts
import { type ChoMessageContext, Controller, Subscribe } from "@chojs/message";

@Controller({ topic: "orders", dependencies: [OrderStore] })
export class OrdersMessageController {
  constructor(readonly store: OrderStore) {}

  @Subscribe("created")
  created(ctx: ChoMessageContext) {
    return this.store.save(ctx.json());
  }
}
```

```ts
// app.ts
import { Module } from "@chojs/web";

@Module({
  providers: [OrderStore],
  controllers: [OrdersHttpController, OrdersMessageController],
})
export class App {}
```

Both controllers receive the **same** `OrderStore`. Each package sees its own
controllers: `@chojs/web` takes the ones with `@Get`, `@Post`, … handlers,
and `@chojs/message` the ones with `@Subscribe` handlers.

## Rules

- **A controller is of one kind**, declared with the `@Controller` of its
  package. A file imports its decorators from one of the two packages.
- **`@Module` and `@Injectable` are the same** in both packages. A module
  with a `route` option is declared with the `@Module` of `@chojs/web`, one
  with a `topic` option with that of `@chojs/message`.
- **A module that holds both kinds declares no `@Middlewares` and no `@Catch`
  of its own.** They would apply to both kinds, and a web middleware cannot
  run for a message. Put them on the controllers, or keep the two kinds in two
  modules.

::: danger Nothing detects a module-level middleware of the wrong kind
A web middleware declared on a module with message controllers is given a
message context when a message arrives. It breaks then, not when the
application is created.
:::

## Who owns the injector

The web application created the injector, so it owns it:

| Call               | Does                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `messages.close()` | Stops receiving, waits for the messages in hand. Disposes nothing  |
| `web.close()`      | Disposes the instances, once                                       |

There is no `overrides` option for `ChoMessage.from`: overrides belong to
whoever creates the injector, here `ChoWeb.create`.

## Shutting down

Close in the order that lets work in progress finish while the instances it
needs still exist:

```ts
import process from "node:process";

let closing = false;
async function shutdown() {
  if (closing) {
    return;
  }
  closing = true;
  await server.close(); //   1. no new request; the ones in flight end
  await messages.close(); // 2. no new message; the ones in hand end
  await web.close(); //      3. release the instances, once
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

`web.close()` comes last: a handler that is still running must not find its
database pool closed. See [Shut down gracefully](/recipes/shutdown) for the
web side.

## Two applications, two injectors

Without `from`, each application has its own injector, and its own instances:

```ts
const web = await ChoWeb.create(App);
const messages = await ChoMessage.create(App, { linker });
// two OrderStore, two database pools
```

It is right for two processes: an HTTP service and a worker, deployed and
scaled apart, each importing the modules it needs. In one process, use
`from`.
