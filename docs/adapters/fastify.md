# Serve CHO routes with Fastify

Use Fastify on Node.js when the service depends on Fastify plugins, hooks or its native server. In the Node.js [HTTP tutorial project](/web/quick-start), run `npx jsr add @chojs/vendor-fastify`. Also install `fastify` as a direct dependency when constructing an instance as below.

## Start the native listener

```ts
import Fastify from "fastify";
import { ChoWeb } from "@chojs/web";
import { FastifyLinker } from "@chojs/vendor-fastify";
import { Library } from "./app.ts";

const native = Fastify({ logger: true });
const app = await ChoWeb.create(Library, {
  prefix: "api",
  linker: new FastifyLinker(native),
});

try {
  await native.listen({ port: 3000, host: "127.0.0.1" });
} catch (error) {
  await native.close();
  await app.close();
  throw error;
}
```

Request `/api/books/42` and look for the request in Fastify's log. For shutdown, close `native` before releasing `app`. CHO registers its routes in a Fastify plugin and leaves the raw request body available for Fetch readers.

## Using Fastify options, plugins and hooks

Configure application-wide plugins and hooks on `native` before passing it to the linker. Set its not-found and error handlers there. For a hook that should run only on a CHO controller or method, use `fromFastify(hook)` in `@Middlewares`. The wrapper supports a pre-handler check. For changes after a response has been produced, use an appropriate native hook.

In an adapter-specific controller, narrow `ctx.native` to `FastifyNative` from `@chojs/vendor-fastify` to use its `request` and `reply`. Use `ctx.req` to read the body of a CHO route.

## Test without a socket

```ts
const result = await native.inject({ method: "GET", url: "/api/books/42" });
console.log(result.statusCode, result.json());
```

`app.handler` also makes an in-memory request using Fastify injection. It buffers the request and response bodies. Use the native listener when verifying downloads, SSE or disconnect behavior. Give each application its own linker and Fastify instance.

## Adapt a request hook

For a route that requires a particular media type, run a native hook before CHO reads the body. This example uses Fastify's request headers and short-circuits with its reply object.

```ts
import { Controller, Middlewares, Post } from "@chojs/web";
import { fromFastify } from "@chojs/vendor-fastify";

@Controller()
class Imports {
  @Middlewares(fromFastify(async (request, reply) => {
    const type = request.headers["content-type"]?.split(";")[0]?.trim();
    if (type !== "application/json") {
      return reply.code(415).send({ error: "Use application/json" });
    }
  }))
  @Post("imports")
  create() { return { accepted: true }; }
}
```

Register `Imports` with the module and test it through Fastify. A `text/plain` request should receive `415` without calling `create`. A request with the JSON media type should reach the controller. A transport-independent version of this check could read `ctx.req.headers` in a CHO middleware.
