---
layout: home

hero:
  name: CHO
  text: Modular applications, on every runtime
  tagline: A decorator-based framework for HTTP, command-line and message applications. Standard decorators, no reflection, the same code on Deno, Node.js, Bun and Edge.
  image:
    src: /cho.svg
    alt: CHO
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Why CHO?
      link: /guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/cho-js/cho

features:
  - title: Portable
    details: A web handler receives the standard Request and answers with a standard Response. The HTTP library underneath is a small adapter you can swap.
    link: /guide/runtimes
    linkText: Runtimes
  - title: Standard decorators
    details: Works with TC39 decorators, and with legacy and Bun decorators. No reflect-metadata, no compiler plugin, no emitted types.
    link: /guide/decorators
    linkText: Decorators
  - title: Dependency injection that fails early
    details: The whole module graph is validated once, at startup, so a missing provider never waits for the first request. A provider can await a connection before its value is ready.
    link: /di/overview
    linkText: Dependency injection
  - title: HTTP applications
    details: Controllers, routes, middlewares and error handlers with @chojs/web, on the plain URL Pattern router, Hono or Fastify.
    link: /web/quick-start
    linkText: Web quick start
  - title: Command-line applications
    details: Single commands or git-style actions with @chojs/command. Declared flags, generated help, exit codes instead of process.exit.
    link: /command/quick-start
    linkText: Command quick start
  - title: Message applications
    details: Handlers for the topics of a broker with @chojs/message. Acknowledged after handling, tested with no broker, on the same instances as your HTTP application.
    link: /message/quick-start
    linkText: Message quick start
---

## A quick look

An HTTP application:

```ts
import {
  ChoWeb,
  type ChoWebContext,
  Controller,
  Get,
  Injectable,
  Module,
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

  @Get(":id") // GET /users/42
  get(ctx: ChoWebContext) {
    return this.store.find(ctx.params.id!); // sent as JSON
  }
}

@Module({ providers: [UserStore], controllers: [UsersController] })
class App {}

const app = await ChoWeb.create(App);
```

Then serve `app.handler`. The same line runs on Deno, Node.js and Bun:

```ts
import { serve } from "@chojs/web/serve";

await serve(app.handler, { port: 3000 });
```

A command-line application, with the same modules, controllers and providers:

```ts
import {
  Action,
  ChoCommand,
  type ChoCommandContext,
  Controller,
  Help,
  Module,
} from "@chojs/command";

@Controller()
class Greeter {
  @Help("Say hello")
  @Action("hello", { string: ["name"] })
  hello(ctx: ChoCommandContext) {
    console.log(`Hello, ${ctx.args.name ?? "world"}!`);
  }
}

@Module({ controllers: [Greeter] })
class App {}

const app = ChoCommand.create(App, { name: "greet" });
const code = await app.run(Deno.args); // Node.js, Bun: process.argv.slice(2)
```

A message application, again with the same modules, controllers and providers:

```ts
import {
  ChoMessage,
  type ChoMessageContext,
  Controller,
  Module,
  Subscribe,
} from "@chojs/message";

@Controller({ topic: "orders" })
class OrdersController {
  @Subscribe("created") // the topic orders.created
  created(ctx: ChoMessageContext) {
    console.log(ctx.key, ctx.json());
  }
}

@Module({ controllers: [OrdersController] })
class App {}

const app = await ChoMessage.create(App);
await app.handle("orders.created", { key: "42", value: '{"id":"42"}' });
```
