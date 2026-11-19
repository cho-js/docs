---
outline: 2
---

# @chojs/vendor-fastify

Configure plugins and hooks before the first request and use the native listener when serving streamed responses. [Use native Fastify plugins and hooks](/adapters/fastify) · [Browse all packages](/api/)

## ChoFastifyErrorCode {#symbol-ChoFastifyErrorCode}

The codes of the errors of `@chojs/vendor-fastify`. Each is described in `README.md`.

A mistake the core finds for the package has a code of the core
(`ChoCoreErrorCode` of `@chojs/core`): an unknown option is
`CHO_CORE_UNKNOWN_OPTION`.

```ts
export type ChoFastifyErrorCode = "CHO_FASTIFY_ALREADY_LINKED" | "CHO_FASTIFY_HOOK_FAILED" | "CHO_FASTIFY_MOUNT_TOO_LATE" | "CHO_FASTIFY_NO_SOCKET" | "CHO_FASTIFY_WRONG_ADAPTER";
```

### Usage {#ChoFastifyErrorCode-usage}

```ts
const CODES: Record<ChoFastifyErrorCode, true> = {
  CHO_FASTIFY_ALREADY_LINKED: true,
  CHO_FASTIFY_HOOK_FAILED: true,
  CHO_FASTIFY_MOUNT_TOO_LATE: true,
  CHO_FASTIFY_NO_SOCKET: true,
  CHO_FASTIFY_WRONG_ADAPTER: true,
};
```

[Usage in vendor/fastify/errors_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/fastify/errors_test.ts#L8)

## FastifyHook {#symbol-FastifyHook}

A Fastify hook of the request phase (`onRequest`, `preValidation`,
`preHandler`): a function of the request and the reply, that either
returns a promise or calls `done`. It is what many Fastify plugins give to
protect a route: `fastify.basicAuth`, `fastify.auth([...])`,
`fastify.rateLimit()`, `fastify.csrfProtection`.

```ts
export type FastifyHook = (this: FastifyInstance, request: FastifyRequest, reply: FastifyReply, done: (error?: Error) => void) => unknown;
```

### Usage {#FastifyHook-usage}

```ts
const hook: FastifyHook = function (_request, reply) {
      reply.header("x-secret", (this as unknown as { secret: string }).secret);
      return Promise.resolve();
    };
```

[Usage in vendor/fastify/mod_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/fastify/mod_test.ts#L764)

## FastifyLinked {#symbol-FastifyLinked}

A Fastify application linked by `FastifyLinker`.

Serve it with Fastify: `instance.listen()`. `handler` is for tests
and for code that needs a `fetch`-style function.

```ts
export class FastifyLinked implements Linked<FastifyInstance> {

    readonly instance: FastifyInstance;
    readonly handler: (req: Request) => Promise<Response>;
    mount(route: Route): void;
    constructor(instance: FastifyInstance);
}
```

**`mount`** Register one more route on the Fastify application, after the routes it
has: what `app.mount` of `ChoWeb` calls.

The routes are registered when Fastify loads its plugins: on `listen()`,
on `ready()`, and on the first call of `handler`. A route is taken
until then.

**`instance`** The Fastify application.

**`handler`** A `fetch`-style request handler. It sends the request through Fastify's
`inject()`, without a network connection: the bodies of the request and
of the response are read whole, not streamed.

**`constructor`** Wrap a Fastify application.

### Usage {#FastifyLinked-usage}

```ts
const app = await ChoWeb.create(AppModule, { linker: new FastifyLinker() });
await app.linked.instance.listen({ port: 3000 });
```

## FastifyLinker {#symbol-FastifyLinker}

Registers the routes of a CHO web application on a Fastify application.
Fastify runs on Node.js: so does this adapter.

Fastify only matches requests: each route is registered with its method and
its full path, and answers through `Route.handle`, which `@chojs/web`
built. Middlewares, error handlers and the conversion of results to
responses are `@chojs/web`'s, so they behave the same on every adapter.

- Handlers receive a `ChoWebContext`, with a standard `Request` built from
  Fastify's. Fastify's request and reply are its `native` property (see
  `FastifyNative`).
- The routes are registered as a Fastify plugin, so they are there once the
  application is ready: `listen()`, `ready()` and the linked `handler` wait
  for it. Inside the plugin Fastify parses no body: `ctx.req` reads it.
- Fastify's router decides which route matches: a static path wins over a
  parameter, wherever they are declared.
- A `HEAD` request runs the `@Head` handler of the route; without one, the
  `@Get` handler answers it, without the body.
- A route that fails without a `@Catch` handler goes to Fastify's error
  handler (see `setErrorHandler`), and a request no route matches to its
  not-found handler (see `setNotFoundHandler`).
- A route mounted on the application (`app.mount`) is taken until the
  Fastify application is ready, and not after.
- Fastify plugins and hooks are not CHO middlewares. To use them, add them
  to a Fastify application and give it to the linker: they apply to every
  route.

```ts
export class FastifyLinker implements Linker<FastifyInstance> {

    constructor(app?: FastifyInstance);
    link(routes: readonly Route[]): FastifyLinked;
}
```

**`link`** Register routes on the linker's Fastify application.

**`constructor`** Create a linker.

### Usage {#FastifyLinker-usage}

```ts
import { ChoWeb } from "@chojs/web";
import { FastifyLinker } from "@chojs/vendor-fastify";

const app = await ChoWeb.create(AppModule, { linker: new FastifyLinker() });
await app.linked.instance.listen({ port: 3000 });
```

With Fastify options and plugins
```ts
import Fastify from "fastify";
import cors from "@fastify/cors";

const fastify = Fastify({ logger: true });
await fastify.register(cors);
const app = await ChoWeb.create(AppModule, {
  linker: new FastifyLinker(fastify),
});
```

## FastifyNative {#symbol-FastifyNative}

What a handler finds in `ctx.native` on this adapter: Fastify's request and
reply.

```ts
export type FastifyNative = {
    readonly request: FastifyRequest;
    readonly reply: FastifyReply;
};
```

**`request`** Fastify's request.

**`reply`** Fastify's reply.

### Usage {#FastifyNative-usage}

```ts
@Get("ip")
ip(ctx: ChoWebContext) {
  return (ctx.native as FastifyNative).request.ip;
}
```

## fromFastify {#symbol-fromFastify}

Turn a Fastify hook into a CHO middleware, so that what Fastify plugins
give to protect a route (`fastify.basicAuth`, `fastify.auth([...])`,
`fastify.rateLimit()`, ...) can be given to `@Middlewares`, on a handler, a
controller or a feature module.

The hook runs with Fastify's request and reply, at the place of the CHO
middleware in the chain, on the Fastify application of the route (`this`):

- when it is done (its promise resolves, or it calls `done()`), the rest
  of the CHO chain runs;
- when it answers by itself (`reply.send()`, `reply.redirect()`), the rest
  of the chain does not run, and the response is the one Fastify sends.
  The CHO middlewares around it see a response with that status and those
  headers, and cannot change it;
- when it fails (it throws, rejects, or calls `done(error)`), the error
  goes to the CHO error handlers, then to Fastify's.

A hook is a step before the handler: it cannot change the response of the
handler. For that, and for plugins that are not hooks (`@fastify/cors`,
`@fastify/helmet`), register the plugin on the Fastify application given
to the linker.

Fastify does not parse the body of CHO routes, so `request.body` is not set
in a hook.

It only works for an application created with a `FastifyLinker`: on
another adapter the middleware throws.

```ts
export function fromFastify(hook: FastifyHook): ChoWebMiddlewareFn;
```

### Usage {#fromFastify-usage}

```ts
import Fastify from "fastify";
import basicAuth from "@fastify/basic-auth";
import { ChoWeb, Controller, Get, Middlewares } from "@chojs/web";
import { FastifyLinker, fromFastify } from "@chojs/vendor-fastify";

const fastify = Fastify();
await fastify.register(basicAuth, { validate, authenticate: true });

@Middlewares(fromFastify(fastify.basicAuth))
@Controller({ route: "admin" })
class AdminController {
  @Get("report")
  report() {
    return { users: 3 };
  }
}

const app = await ChoWeb.create(App, { linker: new FastifyLinker(fastify) });
```

A hook of your own
```ts
const only_local = fromFastify(async (request, reply) => {
  if (request.ip !== "127.0.0.1") {
    return reply.code(403).send({ error: "forbidden" });
  }
});
```

## Also exported here

These declarations share their implementation with another entry point. Each link opens the full declaration.

[`ChoWebContext`](/api/web#symbol-ChoWebContext), [`ChoWebMiddlewareFn`](/api/web#symbol-ChoWebMiddlewareFn), [`ChoWebNext`](/api/web#symbol-ChoWebNext), [`Linked`](/api/web#symbol-Linked), [`Linker`](/api/web#symbol-Linker), [`Route`](/api/web#symbol-Route)
