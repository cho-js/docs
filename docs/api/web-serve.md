---
outline: 2
---

# @chojs/web/serve

Keep the server handle returned by serve. Its port and close operation belong to the listener, while the application owns its providers. [Start and drain a network listener](/recipes/shutdown) · [Browse all packages](/api/)

## ChoWebServer {#symbol-ChoWebServer}

A server started by `serve`.

```ts
export type ChoWebServer = {
    readonly runtime: EngineType;
    readonly port: number;
    readonly hostname: string;
    close(): Promise<void>;
};
```

**`runtime`** The runtime the server runs on.

**`port`** The port the server listens on: the real one, when `0` was asked.

**`hostname`** The host name or address the server listens on.

### Usage {#ChoWebServer-usage}

```ts
const server: ChoWebServer = await serve(app.handler, { port: 0 });
console.log(server.port);
await server.close();
```

## ServeHandler {#symbol-ServeHandler}

A `fetch`-style request handler: what `serve` serves.

```ts
export type ServeHandler = (req: Request) => Response | Promise<Response>;
```

### Usage {#ServeHandler-usage}

```ts
const echo: ServeHandler = async (req) =>
        Response.json({
          method: req.method,
          url: req.url,
          token: req.headers.get("x-token"),
          accept: req.headers.get("accept"),
          body: req.body === null ? null : await req.text(),
        });
```

[Usage in web/serve_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/web/serve_test.ts#L80)

## ServeOptions {#symbol-ServeOptions}

The options of `serve`.

```ts
export type ServeOptions = {
    port?: number;
    hostname?: string;
    signal?: AbortSignal;
    closeTimeout?: number;
};
```

**`port`** The port to listen on. `0` picks a free port. Default: `3000`.

**`hostname`** The host name or address to listen on. Default: the default of the
runtime's server, which listens on every network interface.

**`signal`** Closes the server when it is aborted. Default: none.

**`closeTimeout`** How long closing the server waits for the requests in flight, in
milliseconds, before it cuts their connections; `0` cuts them at once.
Default: none: it waits for every request to end, however long that
takes, and for ever for a response that has no end, such as a stream of
server-sent events that is still open.

### Usage {#ServeOptions-usage}

```ts
const server = await serve(app.handler, { port: 8082, closeTimeout: 2000 });
```

[Usage in examples/sse-http.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/sse-http.ts#L195)

## serve {#symbol-serve}

Serve a `fetch`-style request handler on the server of the current runtime.

| Runtime | Server                                         |
| ------- | ---------------------------------------------- |
| Deno    | `Deno.serve` (needs `--allow-net`)             |
| Bun     | `Bun.serve`                                    |
| Node.js | `node:http`, bridged to `Request` / `Response` |

On Node.js a handler that rejects is logged with `console.error` and
answered with `500`; on Deno and Bun the runtime's server does the same.

Closing the server waits for the requests in flight. A response with no
end, such as an open stream of server-sent events, would hold it for ever:
the `closeTimeout` option cuts what is still in flight after a grace
period.

```ts
export function serve(handler: ServeHandler, options?: ServeOptions): Promise<ChoWebServer>;
```

### Usage {#serve-usage}

```ts
import { ChoWeb } from "@chojs/web";
import { serve } from "@chojs/web/serve";

const app = await ChoWeb.create(AppModule);
const server = await serve(app.handler, { port: 3000 });
console.log(`listening on http://localhost:${server.port}`);
```

Closing
```ts
const server = await serve(app.handler);
// ...
await server.close(); // stop the server, then release the application
await app.close();
```

Closing with open streams
```ts
// Requests get 10 seconds to end; what is still open then is cut.
const server = await serve(app.handler, { closeTimeout: 10_000 });
```

## serve_node {#symbol-serve_node}

Serve a handler on the `node:http` server. It is the Node.js part of
`serve`; it also runs on the runtimes that have `node:http`.

```ts
export function serve_node(handler: ServeHandler, port: number, hostname?: string, close_timeout?: number): Promise<ChoWebServer>;
```

### Usage {#serve_node-usage}

```ts
const server = await serve_node(app.handler, 3000, "127.0.0.1");
// During shutdown
await server.close();
```

## serve_on {#symbol-serve_on}

Serve a handler on the server of a given runtime (see `serve`).

```ts
export function serve_on(runtime: EngineType, handler: ServeHandler, options?: ServeOptions): Promise<ChoWebServer>;
```

### Usage {#serve_on-usage}

```ts
const server = await serve_on("deno", app.handler, { port: 3000 });
// During shutdown
await server.close();
```

## Also exported here

These declarations share their implementation with another entry point. Each link opens the full declaration.

[`EngineType`](/api/core-utils#symbol-EngineType)
