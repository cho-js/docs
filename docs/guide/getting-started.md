# Getting started

Pick the package for what you are building. It brings everything an application
needs.

## Install

### An HTTP application

`@chojs/web` is all it needs: a router is built in. To match requests with
another HTTP library, add a [runtime adapter](/adapters/).

::: code-group

```sh [Deno]
deno add jsr:@chojs/web
```

```sh [Node.js]
npx jsr add @chojs/web
npm install -D tsx typescript
```

```sh [Bun]
bunx jsr add @chojs/web
```

:::

### A command-line application

::: code-group

```sh [Deno]
deno add jsr:@chojs/command
```

```sh [Node.js]
npx jsr add @chojs/command
npm install -D tsx typescript
```

```sh [Bun]
bunx jsr add @chojs/command
```

:::

::: tip Node.js
The packages are ES modules: set `"type": "module"` in `package.json`. Node.js
does not run decorators by itself, so compile the application with
TypeScript 5 or run it with a tool such as `tsx`. [Runtimes](/guide/runtimes)
has the details.
:::

## A first HTTP application

Create `main.ts`. The whole file is the same on every runtime.

```ts
import {
  ChoWeb,
  type ChoWebContext,
  Controller,
  Get,
  Injectable,
  Module,
} from "@chojs/web";
import { serve } from "@chojs/web/serve";

@Injectable()
class Greeter {
  greet(name: string) {
    return { message: `Hello, ${name}!` };
  }
}

@Controller({ route: "hello", dependencies: [Greeter] })
class HelloController {
  constructor(readonly greeter: Greeter) {}

  @Get("") // GET /hello
  world() {
    return this.greeter.greet("world"); // sent as JSON
  }

  @Get(":name") // GET /hello/you
  name(ctx: ChoWebContext) {
    return this.greeter.greet(ctx.params.name!);
  }
}

@Module({ providers: [Greeter], controllers: [HelloController] })
class App {}

const app = await ChoWeb.create(App);
await serve(app.handler, { port: 3000 });
```

Run it:

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
$ curl http://localhost:3000/hello/you
{"message":"Hello, you!"}
```

What happened:

- `@Injectable()` makes `Greeter` a **provider**: a class the injector can
  create.
- `@Controller` declares a class with route handlers, and lists the providers
  its constructor receives.
- `@Module` groups them. The root module is the application.
- `ChoWeb.create` validates everything, creates the instances, and gives
  `app.handler`: a plain `(req: Request) => Promise<Response>`.
- `serve` gives the handler to the server of the runtime it runs on:
  `Deno.serve`, `Bun.serve`, or the HTTP server of Node.js.

Continue with the [web guide](/web/quick-start).

## A first command-line application

Create `cli.ts`:

```ts
import {
  Action,
  ChoCommand,
  type ChoCommandContext,
  Controller,
  Help,
  Module,
} from "@chojs/command";

@Help("Greetings")
@Controller()
class Greeter {
  @Help("Say hello")
  @Action("hello", { string: ["name"], describe: { name: "Who to greet" } })
  hello(ctx: ChoCommandContext) {
    console.log(`Hello, ${ctx.args.name ?? "world"}!`);
  }

  @Help("Say goodbye")
  @Action("bye")
  bye() {
    console.log("Goodbye!");
  }
}

@Module({ controllers: [Greeter] })
class App {}

const app = ChoCommand.create(App, { name: "greet", version: "1.0.0" });
```

Run it with the command line of the process, and exit with the code it
resolves to:

::: code-group

```ts [Deno]
const code = await app.run(Deno.args);
await app.close();
Deno.exit(code);

// deno run cli.ts hello --name you
```

```ts [Node.js]
const code = await app.run(process.argv.slice(2));
await app.close();
process.exit(code);

// npx tsx cli.ts hello --name you
```

```ts [Bun]
const code = await app.run(process.argv.slice(2));
await app.close();
process.exit(code);

// bun run cli.ts hello --name you
```

:::

```console
$ greet hello --name you
Hello, you!
$ greet --help
Usage: greet <command> [options] [args]

Greetings:
  hello  Say hello
  bye    Say goodbye

Options:
  --help     Show this help
  --version  Show the version

Run 'greet <command> --help' for help on a command.
```

Continue with the [command guide](/command/quick-start).

## Next steps

- [Runtimes](/guide/runtimes): what each runtime needs, and how to serve, stop
  and deploy on it.
- [Dependency injection](/di/overview): modules, providers and tokens.
