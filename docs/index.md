---
layout: home

hero:
  name: CHO
  text: Modular applications, on every runtime
  tagline: A tiny decorator-based framework for HTTP and command-line applications. Standard decorators, no reflection, the same code on Deno, Node.js, Bun and the edge.
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
  - title: Fails before it starts
    details: The whole module graph is validated and linked once, at startup. A missing provider or a duplicate route never waits for the first request.
    link: /di/overview
    linkText: Dependency injection
  - title: Asynchronous dependency injection
    details: A provider can await a connection or a file before its value is ready. Everything that depends on it waits, and is released in reverse order.
    link: /di/lifecycle
    linkText: Lifecycle
  - title: HTTP applications
    details: Controllers, routes, middlewares and error handlers with @chojs/web, on the plain URL Pattern router, Hono or Fastify.
    link: /web/quick-start
    linkText: Web quick start
  - title: Command-line applications
    details: Single commands or git-style actions with @chojs/command. Declared flags, generated help, exit codes instead of process.exit.
    link: /command/quick-start
    linkText: Command quick start
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

  @Get(":id") // GET /users/42
  get(ctx: ChoWebContext) {
    return this.store.find(ctx.params.id!); // sent as JSON
  }
}

@Module({ providers: [UserStore], controllers: [UsersController] })
class App {}

const app = await ChoWeb.create(App, { linker: new HonoLinker() });
```

Then serve `app.handler` with whatever the runtime has:

::: code-group

```ts [Deno]
Deno.serve(app.handler);
```

```ts [Bun]
Bun.serve({ fetch: app.handler });
```

```ts [Node.js]
import { serve } from "@hono/node-server";

serve({ fetch: app.handler, port: 3000 });
```

:::

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
