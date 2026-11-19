# Run CHO on your platform

CHO has four officially supported runtimes: **Deno, Node.js, Bun and Cloudflare Workers**. HTTP controllers use the same Fetch handler on all four. A server process opens a listener. Cloudflare calls the Worker's exported `fetch` handler. Choose the runtime for each entry point according to the adapters it uses.

| Platform | Execute decorated TypeScript | Receive an HTTP request | Read CLI arguments |
| --- | --- | --- | --- |
| Deno | `deno run` | `serve(app.handler)` | `Deno.args` |
| Node.js | `tsx` or compiled ESM | `serve(app.handler)` or Fastify | `process.argv.slice(2)` |
| Bun | `bun run` | `serve(app.handler)` | `process.argv.slice(2)` |
| Cloudflare Workers | Bundle with Wrangler | Export `{ fetch: app.handler }` | — |

## Deno

Install the application package with `deno add jsr:@chojs/web`. Run a listener with `deno run --allow-net main.ts`. Add environment access when you want CHO to read debug settings, for example `--allow-env=CHO_DEBUGLOG`. The in-memory quick starts use neither a listening socket nor a broker.

## Node.js

Use an ESM project (`"type": "module"`). Install with `npx jsr add @chojs/web` and run the TypeScript examples with `npx tsx main.ts` after installing `tsx`. This step transforms decorators and supports the examples' top-level `await`. To type-check separately with TypeScript 5, a suitable `tsconfig.json` for these examples is:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "strict": true,
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

Use Node.js 24 with the built-in router, or select Hono where `URLPattern` is unavailable. On Node, [`serve`](/api/web-serve#symbol-serve) bridges the native HTTP server to Fetch. With [Fastify](/adapters/fastify), the Fastify instance can listen directly.

## Bun

Install with `bunx jsr add @chojs/web` and run `bun run main.ts`. Use a Bun runtime that provides `URLPattern` for the built-in router. When debugging differences between adapters, exercise `app.handler` in the same runtime you deploy.

## Cloudflare Workers

For the [HTTP quick start](/web/quick-start), put this worker entry point beside `app.ts`. The first request creates the application. Concurrent requests share the initialization promise.

```ts
import { createApp } from "./app.ts";

let ready: ReturnType<typeof createApp> | undefined;
export default {
  async fetch(request: Request) {
    ready ??= createApp().catch((error) => {
      ready = undefined;
      throw error;
    });
    return (await ready).handler(request);
  },
};
```

Use lazy creation for providers that perform I/O. If providers only compute values or read binding configuration, create the app at module scope. The [Workers guide](/guide/cloudflare-workers) shows a complete entry point, bindings and a local verification request. It also explains which packages run in the dedicated `workerd` CI job.

## Background consumers

| Capability | Node.js | Deno | Bun | Cloudflare Workers |
| --- | --- | --- | --- | --- |
| Built-in HTTP router, Hono, OpenAPI and dependency injection | Yes | Yes | Yes | Tested in `workerd` |
| `@chojs/message` local delivery through `app.handle` | Yes | Yes | Yes | Tested in `workerd` |
| Kafka producer and consumer | Native client runtime | Tested on 2.9 | Tested on 1.4 | — |
| NATS broker adapter | Yes | Yes | Yes | — |
| Fastify HTTP adapter | Yes | — | — | — |

Kafka uses the Node compatibility layers on Deno and Bun. For installation, Deno permissions and broker verification, follow the [Kafka guide](/message/kafka). For NATS, supply the [transport for your runtime](/message/nats).

## Choose entry points per deployment

A service can expose HTTP from Cloudflare Workers and consume the same catalog's Kafka events from a Node.js, Bun or Deno process. Share the service code and contracts between deployments. Supply each deployment's connections and bindings in its own module configuration.
