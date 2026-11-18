# Run CHO on your platform

The HTTP tutorials use a Fetch-compatible handler. A local process needs a listener to turn incoming connections into `Request` objects. A worker platform already supplies the request. The same controller can serve both.

| Platform | Execute decorated TypeScript | Receive an HTTP request | Read CLI arguments |
| --- | --- | --- | --- |
| Deno | `deno run` | `serve(app.handler)` | `Deno.args` |
| Node.js | `tsx` or compiled ESM | `serve(app.handler)` or Fastify | `process.argv.slice(2)` |
| Bun | `bun run` | `serve(app.handler)` | `process.argv.slice(2)` |
| Fetch-based worker | Platform build tool | Export a `fetch` entry point | — |

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

Use Node.js 24 with the built-in router, or select Hono where `URLPattern` is unavailable. On Node, `serve` bridges the native HTTP server to Fetch. With [Fastify](/adapters/fastify), the Fastify instance can listen directly.

## Bun

Install with `bunx jsr add @chojs/web` and run `bun run main.ts`. Use a Bun runtime that provides `URLPattern` for the built-in router. When debugging differences between adapters, exercise `app.handler` in the same runtime you deploy.

## Edge runtimes

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

If controllers need platform-specific bindings, pass those through the adapter's native context. The [Hono guide](/adapters/hono) describes how to access it. For configuration of CHO's own loggers on a host without `process.env`, see [debug logging](/reference/debugging).

## Background consumers

Manual message delivery runs wherever the message package runs. The [NATS adapter](/message/nats) accepts a connection from the runtime's transport on Deno, Node.js or Bun. The [Kafka adapter](/message/kafka) targets a long-running Node.js process.
