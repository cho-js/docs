# Runtimes

CHO itself uses no runtime-specific API. The framework is tested on **Deno**,
**Node.js** and **Bun** on every change, and a web application runs on any
runtime that serves a `fetch`-style handler, edge runtimes included.

What differs between runtimes is small, and all of it is on this page:

- how the packages are installed;
- how TypeScript decorators are run;
- how `app.handler` is served, or how the command line is read;
- which [adapters](/adapters/) are available.

## Support at a glance

|                          | Deno | Node.js | Bun | Edge (Workers, …) |
| ------------------------ | ---- | ------- | --- | ----------------- |
| `@chojs/command`         | Yes  | Yes     | Yes | n/a               |
| `@chojs/web`             | Yes  | Yes     | Yes | Yes               |
| `@chojs/vendor-hono`     | Yes  | Yes     | Yes | Yes               |
| `@chojs/vendor-cho`      | Yes  | 24+     | 1.3.4+ | With `URLPattern` |
| `@chojs/vendor-fastify`  | No   | Yes     | No  | No                |

`@chojs/vendor-cho` needs the global `URLPattern`; `@chojs/vendor-fastify` is
built on the HTTP server of Node.js.

## Deno

Deno runs TypeScript and standard decorators directly. Nothing to configure.

```sh
deno add jsr:@chojs/web jsr:@chojs/vendor-hono
deno add jsr:@chojs/command
```

::: code-group

```ts [Web]
const app = await ChoWeb.create(App, { linker: new HonoLinker() });

const server = Deno.serve({ port: 3000 }, app.handler);

Deno.addSignalListener("SIGTERM", async () => {
  await server.shutdown(); // stop accepting, finish the requests in flight
  await app.close(); //       then release the instances
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
deno run --allow-net main.ts
deno run cli.ts copy a b
```

Add `--allow-env` to enable [debug logging](/reference/debugging) from the
environment.

## Node.js

```sh
npx jsr add @chojs/web @chojs/vendor-hono
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

**Serving.** Node.js has no built-in server for `fetch`-style handlers. Use a
small bridge such as
[`@hono/node-server`](https://github.com/honojs/node-server), which serves any
`(req: Request) => Response` function, whatever the adapter:

::: code-group

```ts [Web: Hono or plain adapter]
import { serve } from "@hono/node-server";

const app = await ChoWeb.create(App, { linker: new HonoLinker() });

const server = serve({ fetch: app.handler, port: 3000 });

process.on("SIGTERM", () => {
  server.close(async () => {
    await app.close();
  });
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

With the [Fastify adapter](/adapters/fastify), Fastify is the server: no bridge
is needed.

## Bun

Bun runs TypeScript and decorators directly.

```sh
bunx jsr add @chojs/web @chojs/vendor-hono
bunx jsr add @chojs/command
```

::: code-group

```ts [Web]
const app = await ChoWeb.create(App, { linker: new HonoLinker() });

const server = Bun.serve({ port: 3000, fetch: app.handler });

process.on("SIGTERM", async () => {
  await server.stop(); // finish the requests in flight
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
similar runtimes export. Use the [Hono adapter](/adapters/hono), or the
[plain adapter](/adapters/cho) where `URLPattern` exists.

Edge runtimes limit what can run when the module is loaded, so create the
application on the first request and keep it:

```ts
import { ChoWeb } from "@chojs/web";
import { HonoLinker } from "@chojs/vendor-hono";
import { App } from "./app.ts";

let app: Promise<ChoWeb> | undefined;

export default {
  async fetch(req: Request): Promise<Response> {
    app ??= ChoWeb.create(App, { linker: new HonoLinker() });
    return (await app).handler(req);
  },
};
```

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
    app ??= ChoWeb.create(App, { linker: new HonoLinker() });
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
- **Keep the entry point thin.** Put the modules in their own files, and leave
  the runtime-specific lines (`Deno.serve`, `Bun.serve`, `process.argv`) in a
  small `main.ts` per runtime. The same modules can then be served by any of
  them, and [tested](/web/testing) with none.

```ts
// app.ts: no runtime API
@Module({ imports: [UsersModule] })
export class App {}

// main.deno.ts
Deno.serve((await ChoWeb.create(App, { linker: new HonoLinker() })).handler);

// main.bun.ts
Bun.serve({ fetch: (await ChoWeb.create(App, { linker: new HonoLinker() })).handler });
```
