---
description: CHO runs on Node.js, Deno, Bun, and Cloudflare Workers today. Here’s what moving an HTTP endpoint between them looks like, and what we’re still working toward.
cover:
  src: /social/building-cho-four-runtimes.png
  alt: Building CHO — one endpoint, four runtimes. The CHO butterfly with the Node.js, Deno, Bun, and Cloudflare Workers logos.
head:
  - - link
    - rel: canonical
      href: https://chojs.io/blog/building-cho-for-every-js-runtime
---

# Building CHO, a TypeScript framework for every JavaScript runtime

November 19, 2026

![Building CHO — one endpoint, four runtimes. The CHO butterfly with the Node.js, Deno, Bun, and Cloudflare Workers logos.](/social/building-cho-four-runtimes.png)

I’m building CHO with a goal: you should be able to choose where your TypeScript application runs *after* you’ve written it.

Today, CHO officially supports **Node.js, Deno, Bun, and Cloudflare Workers**. “Every JavaScript runtime” is the ambition. We’re working on it. The most useful way to explain how far we’ve come is to take one endpoint and move it from a server process to a Worker.

## One endpoint, four runtimes

Here’s a small catalog API. A request to `GET /books/42` should return `{"id":"42","shelf":"B2"}`. An unknown book should return a `404`.

```ts
// app.ts
import {
  Args, ChoWeb, Controller, Get, HttpError, Module, Param,
} from "@chojs/web";

const shelves = new Map([["42", "B2"]]);

@Controller({ route: "books" })
class Books {
  @Get(":id")
  @Args(Param("id"))
  find(id: string) {
    const shelf = shelves.get(id);
    if (shelf === undefined) throw new HttpError(404, "Unknown book");
    return { id, shelf };
  }
}

@Module({ controllers: [Books] })
class Library {}

export const app = await ChoWeb.create(Library);
```

At this point, nothing is listening on a port. But the application can already answer a request:

```ts
const response = await app.handler(new Request("http://library/books/42"));

console.log(response.status);       // 200
console.log(await response.json()); // { id: "42", shelf: "B2" }
```

That `Request → Response` boundary is the portability decision behind CHO. It also has a nice everyday benefit: I can try a route, including its parameter handling and serialization, without starting a server.

On **Node.js, Deno, or Bun**, I give that handler to a listener:

```ts
// server.ts
import { serve } from "@chojs/web/serve";
import { app } from "./app.ts";

await serve(app.handler, { port: 3000 });
```

On **Cloudflare Workers**, the platform already receives the request. I export the handler:

```ts
// worker.ts
import { app } from "./app.ts";

export default { fetch: app.handler };
```

Those are the two files I’d compare when deciding where to deploy. The route, the lookup, and the `404` all live in `app.ts`. The host-specific decision is who calls the handler.

## Why build a framework around this?

Real applications tend to acquire a second entrance. A catalog starts as an HTTP API. Then someone needs a CLI to import books, and a warehouse starts sending inventory events.

CHO supports three application types: **HTTP APIs, command-line tools, and message consumers**. They share a module and dependency-injection model. I can move the shelf lookup into an injectable `Catalog` service, then call it from an HTTP controller, a CLI action, or a message subscription. Each entry point decides how to present a missing book: an HTTP status, a shell exit code, or a reply to another service.

I chose **standard TypeScript decorators and explicit dependencies** for this. A controller declares `dependencies: [Catalog]`, so the lookup key is visible in the source. CHO can wire the application without depending on emitted constructor-type metadata.

There’s also something more immediately useful if you’re building an API: CHO can publish an **OpenAPI document** from the initialized application and serve **Swagger UI, Scalar, or Redoc** alongside it. Someone trying your API can open a page, inspect a route, and send their first request from the browser. [OpenAPI walkthrough](/web/openapi)

## What “every runtime” means today

HTTP is where the promise is easiest to see. The built-in router and the Hono adapter can both serve a Fetch handler on Cloudflare Workers. If I need a Fastify plugin, I can use the Fastify adapter on Node.js. For a Kafka consumer, the supported choices today are Node.js, Deno, and Bun.

I want those boundaries to be clear **before** someone chooses a deployment target. A controller that uses standard web APIs is straightforward to move. A service that depends on a Worker binding, a native plugin, or a broker connection has a real requirement. CHO gives that dependency a place to live, and the [runtime guide](/guide/runtimes) documents which combinations are supported.

That’s where CHO stands: four official runtimes today, with more work ahead. If you’d like to try it, the [HTTP quick start](/web/quick-start) takes you from a controller to your first request, and the [source is on GitHub](https://github.com/cho-js/cho).

**Which runtime would you want CHO to support next, and what would you actually deploy on it?** A concrete use case would help me decide what to work on next.
