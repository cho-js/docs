# Serve an HTTP application on Cloudflare Workers

Cloudflare Workers is CHO's fourth officially supported runtime alongside Node.js, Deno and Bun. A Worker receives a Fetch `Request` from the platform. Export `app.handler` as `fetch` and Cloudflare takes care of the listener. The built-in router and Hono both support this model.

## Run the example locally

The framework checkout includes a Worker, its Wrangler configuration and TypeScript paths pointing to the local CHO packages. From the checkout, run:

```sh
cd examples/worker
npx wrangler dev
```

In a second terminal, request the greeting. The controller reads the `name` query parameter and an injected provider supplies the greeting from a Worker binding.

```console
$ curl 'http://localhost:8787/hello?name=Ada'
{"message":"Hello, Ada"}
```

Try `/hello?name=` for a `400` response. The example also schedules a visit counter update with `waitUntil`. After the work finishes, `GET /visits` shows the count in the current isolate. Use a persistent binding for a counter shared across isolates. [Example source and Wrangler configuration](https://github.com/cho-js/cho/tree/main/examples/worker)

## Connect a binding to a provider

In your own Wrangler project, install `@chojs/web` with `npx jsr add @chojs/web`. Save this entry point as `src/index.ts`.

<<< @/examples/web/worker.ts

Use this `wrangler.toml` to supply the binding. Run `npx wrangler dev` and request `/branch`. The response should be `{"branch":"central"}`.

```toml
name = "library-api"
main = "src/index.ts"
compatibility_date = "2025-09-01"
keep_names = true

[vars]
BRANCH = "central"
```

The provider reads a binding at module initialization. If creating a provider opens a connection or performs other I/O, [create the application on the first request](/guide/runtimes#cloudflare-workers) and reuse its promise for that isolate. For work that should continue after returning a response, import `waitUntil` from `cloudflare:workers` and pass it the promise while handling the request. With Hono, the [native context](/adapters/hono#forward-worker-bindings) can also expose the bindings and execution context.

Keeping class and function names during bundling preserves controller names in logs, diagnostics and generated OpenAPI tags. For CHO debug configuration, pass the relevant environment values to `set_env` from `@chojs/core/utils`. [Debug logging](/reference/debugging)

## What runs in workerd

CHO's dedicated CI job runs the core, web, message, built-in HTTP middleware, Hono and OpenAPI tests inside Cloudflare's `workerd` runtime. The suite uses compatibility date `2025-09-01`. The test harness enables `nodejs_compat` for Node assertions. Separate application and binding tests run without the flag, as does the Worker above.

On Workers, deliver messages locally with `app.handle`. Run Kafka and NATS broker connections in a Node.js, Deno or Bun process. The CLI, Fastify and process listeners such as `serve()` are outside the Workers test suite. To reproduce the runtime checks from the CHO checkout, run `tools/workerd/run.sh`. [Framework test harness](https://github.com/cho-js/cho/tree/main/tools/workerd)
