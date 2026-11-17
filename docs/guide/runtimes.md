# Runtimes

CHO itself uses no runtime-specific API. The framework is tested on **Deno**,
**Node.js** and **Bun** on every change, and a web application runs on any
runtime that serves a `fetch`-style handler, edge runtimes included.

What differs between runtimes is small, and all of it is on this page:

- how the packages are installed;
- how TypeScript decorators are run;
- how the command line is read (`serve` takes care of serving `app.handler`);
- which [adapters](/adapters/) are available.

## Support at a glance

|                         | Deno | Node.js | Bun    | Edge (Workers, …) |
| ----------------------- | ---- | ------- | ------ | ----------------- |
| `@chojs/command`        | Yes  | Yes     | Yes    | n/a               |
| `@chojs/message`        | Yes  | Yes     | Yes    | n/a               |
| `@chojs/web`            | Yes  | Yes     | Yes    | Yes               |
| Its built-in router     | Yes  | 24+     | 1.3.4+ | With `URLPattern` |
| `serve`                 | Yes  | Yes     | Yes    | Export the handler |
| `@chojs/vendor-hono`    | Yes  | Yes     | Yes    | Yes               |
| `@chojs/vendor-fastify` | No   | Yes     | No     | No                |
| `@chojs/vendor-kafka`   | No   | Yes     | No     | n/a               |

The built-in router needs the global `URLPattern`; on a runtime without it, use
the [Hono adapter](/adapters/hono). `@chojs/vendor-fastify` is built on the HTTP
server of Node.js. `@chojs/message` needs nothing of a runtime; a
[broker adapter](/message/adapters) runs where the client library of its broker
does: the [Kafka adapter](/message/kafka) on Node.js.

## Deno

Deno runs TypeScript and standard decorators directly. Nothing to configure.

```sh
deno add jsr:@chojs/web
deno add jsr:@chojs/command
```

::: code-group

```ts [Web]
import { serve } from "@chojs/web/serve";

const app = await ChoWeb.create(App);

const server = await serve(app.handler, { port: 3000 }); // Deno.serve underneath

Deno.addSignalListener("SIGTERM", async () => {
  await server.close(); // stop accepting, finish the requests in flight
  await app.close(); //    then release the instances
});
```

```ts [Command]
const app = ChoCommand.create(App, { name: "fs", version: "1.0.0" });

const code = await app.run(Deno.args);
await app.close();
Deno.exit(code);
```

:::

```sh
deno run --allow-net --allow-env main.ts
deno run cli.ts copy a b
```

`--allow-env` lets CHO read the [debug logging](/reference/debugging) switches
from the environment.

## Node.js

```sh
npx jsr add @chojs/web
npx jsr add @chojs/command
```

`jsr add` adds the packages to `package.json` and points the `@jsr` scope to
the JSR registry in `.npmrc`. The packages are ES modules, so the application
is one too:

```json
{
  "type": "module"
}
```

**Decorators.** Node.js does not run decorators, with or without its built-in
type stripping. Either:

- run the application with [`tsx`](https://tsx.is): `npx tsx main.ts`; or
- compile it with TypeScript 5 (`tsc`) and run the output.

A `tsconfig.json` for standard decorators:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true
  }
}
```

Leave `experimentalDecorators` out to use standard decorators; CHO works with
it turned on too. See [Decorators](/guide/decorators).

**Serving.** Node.js has no built-in server for `fetch`-style handlers. `serve`
has the bridge between the HTTP server of Node.js and `Request` / `Response`,
so nothing else is needed:

::: code-group

```ts [Web]
import { serve } from "@chojs/web/serve";

const app = await ChoWeb.create(App);

const server = await serve(app.handler, { port: 3000 });

process.once("SIGTERM", async () => {
  await server.close(); // stop accepting, finish the requests in flight
  await app.close();
});
```

```ts [Web: Fastify]
import { FastifyLinker } from "@chojs/vendor-fastify";

const app = await ChoWeb.create(App, { linker: new FastifyLinker() });
const fastify = app.linked.instance; // the Fastify application

await fastify.listen({ port: 3000 });

process.on("SIGTERM", async () => {
  await fastify.close();
  await app.close();
});
```

```ts [Command]
const app = ChoCommand.create(App, { name: "fs", version: "1.0.0" });

const code = await app.run(process.argv.slice(2));
await app.close();
process.exit(code);
```

:::

With the [Fastify adapter](/adapters/fastify), Fastify is the server: `serve`
is not used.

## Bun

Bun runs TypeScript and decorators directly.

```sh
bunx jsr add @chojs/web
bunx jsr add @chojs/command
```

::: code-group

```ts [Web]
import { serve } from "@chojs/web/serve";

const app = await ChoWeb.create(App);

const server = await serve(app.handler, { port: 3000 }); // Bun.serve underneath

process.once("SIGTERM", async () => {
  await server.close(); // finish the requests in flight
  await app.close();
});
```

```ts [Command]
const app = ChoCommand.create(App, { name: "fs", version: "1.0.0" });

const code = await app.run(process.argv.slice(2));
await app.close();
process.exit(code);
```

:::

```sh
bun run main.ts
bun run cli.ts copy a b
```

## Edge runtimes

`app.handler` is a `fetch`-style function, which is what Cloudflare Workers and
similar runtimes export. There is no server to start there, so `serve` is not
used: the entry module exports the handler.

Edge runtimes limit what can run when the module is loaded, so create the
application on the first request and keep it:

```ts
import { ChoWeb } from "@chojs/web";
import { App } from "./app.ts";

let app: Promise<ChoWeb> | undefined;

export default {
  async fetch(req: Request): Promise<Response> {
    app ??= ChoWeb.create(App);
    return (await app).handler(req);
  },
};
```

The built-in router works where `URLPattern` exists. It gives handlers no
`ctx.native`; to reach what the platform passes with each request (the `env`
bindings and the execution context of Workers), use the
[Hono adapter](/adapters/hono), whose context carries them.

::: info
Deno, Node.js and Bun are the runtimes CHO is tested on. On an edge runtime,
the application code and `@chojs/web` use web standards only; check the
[adapter](/adapters/) you pick.
:::

**Environment variables.** CHO reads its own settings (the
[debug logging](/reference/debugging) switches) from `process.env`. On a
runtime without `process`, hand it the environment once, at startup, with
`set_env` from `@chojs/core/utils`:

```ts
import { set_env } from "@chojs/core/utils";

export default {
  async fetch(req: Request, env: Record<string, unknown>) {
    set_env(env); // before the application is created
    app ??= ChoWeb.create(App);
    return (await app).handler(req);
  },
};
```

This is the one place an application imports from the core.

## Writing code that runs everywhere

- **Use web standards** in handlers: `Request`, `Response`, `URL`, `Headers`,
  `fetch`, `crypto`, streams.
- **Stay off `ctx.native`** unless you need it. It is the adapter's own
  context, and code that uses it only runs on that adapter.
- **Declare static routes before parameter routes** (`@Get("me")` before
  `@Get(":id")`), so a route means the same on every adapter. See
  [Routing](/web/routing#matching-order).
- **Serve with `serve`.** It picks the server of the runtime, so `main.ts` is
  the same file on Deno, Node.js and Bun.
- **Keep the entry point thin.** Put the modules in their own files, and leave
  what is left of the runtime in `main.ts`: the command line of a command
  (`Deno.args`, `process.argv`), or the exported handler of an edge runtime.
  The same modules can then run anywhere, and be [tested](/web/testing) with
  no server.

```ts
// app.ts: no runtime API
@Module({ imports: [UsersModule] })
export class App {}

// main.ts: Deno, Node.js and Bun
import { serve } from "@chojs/web/serve";

await serve((await ChoWeb.create(App)).handler);
```
