# Migrate from NestJS to CHO

Start with one public operation. Keep its URL, input, successful response and failure behavior fixed while moving the implementation. A domain service that already accepts ordinary values and returns ordinary values is a good first candidate. The controller, dependency declarations and process entry point are where most of the translation happens.

## Port a lookup without changing the caller

Suppose clients depend on `GET /books/42` returning `{"id":"42","shelf":"B2"}`. A missing book must return a specific JSON body with status 404. Here is the original NestJS feature.

```ts
import { Controller, Get, Injectable, Module, NotFoundException, Param } from "@nestjs/common";

@Injectable()
class Catalog {
  shelf(id: string) { return id === "42" ? "B2" : undefined; }
}

@Controller("books")
class Books {
  constructor(private readonly catalog: Catalog) {}

  @Get(":id")
  find(@Param("id") id: string) {
    const shelf = this.catalog.shelf(id);
    if (!shelf) throw new NotFoundException({ error: "Unknown book" });
    return { id, shelf };
  }
}

@Module({ controllers: [Books], providers: [Catalog] })
export class Library {}
```

In CHO, the route declares its argument readers on the method. The controller declares its dependencies in constructor order. This works with standard TypeScript decorators and gives the injector the actual lookup keys at startup. The catalog method itself stays the same. [NestJS controllers](https://docs.nestjs.com/controllers) · [CHO decorator setup](/guide/decorators)

```ts
import {
  Args, ChoWeb, Controller, Get, Injectable, Module, Param,
} from "@chojs/web";

@Injectable()
class Catalog {
  shelf(id: string) { return id === "42" ? "B2" : undefined; }
}

@Controller({ route: "books", dependencies: [Catalog] })
class Books {
  constructor(private readonly catalog: Catalog) {}

  @Get(":id")
  @Args(Param("id"))
  find(id: string) {
    const shelf = this.catalog.shelf(id);
    if (!shelf) return Response.json({ error: "Unknown book" }, { status: 404 });
    return { id, shelf };
  }
}

@Module({ controllers: [Books], providers: [Catalog] })
export class Library {}

export const createApp = () => ChoWeb.create(Library);
```

`ChoWeb.create` prepares a Fetch handler. Pass it a `Request` directly, pass it to `serve` in a server process, or export a Worker fetch entry point. If the old bootstrap sets a global prefix, supply `{ prefix: "api" }` at creation. For write endpoints, set a required `201` explicitly with `Response.json(value, { status: 201 })`. Nest's default POST status and CHO's ordinary JSON result differ. [HTTP responses](/web/responses) · [Runtime entry points](/guide/runtimes)

## Move dependency bindings and lifetimes

Both frameworks organize features into modules with imports, providers and exports. Carry over the module that **owns** a service and export its token to the modules that consume it. CHO uses a class or an explicitly shared token as the lookup key. Import the same token object on both sides. [NestJS modules](https://docs.nestjs.com/modules) · [CHO module scope](/di/modules)

| Existing NestJS binding | CHO declaration |
| --- | --- |
| Class provider | List the class in `providers`. Declare its constructor inputs with `@Injectable([A, B])` |
| `{ provide: T, useValue: value }` | `provider({ provide: T, factory: () => value })` |
| `useFactory` with `inject: [Config]` | `provider({ provide: T, deps: [Config], factory: config => makeClient(config) })` |
| `useExisting: Client` | Register `Client`, then alias it with `provider({ provide: T, deps: [Client], factory: client => client })` |
| `useClass: Client` | Construct the implementation in the token's factory, declaring its inputs in `deps`. Use an alias when both tokens should resolve to the same instance |
| Dynamic module such as `forRoot(options)` | Bind the settings token through `configure(Module, { providers: [...] })` and import the returned module constant |

A CHO provider caches its result per declaration in an injector. Move Nest request-scoped data, such as the current user, into the invocation's `ctx.state` and pass it to the service method. For a fresh object per operation, inject a factory function and call it at that boundary. Keep pools and shared clients injector-owned. [NestJS custom providers](https://docs.nestjs.com/fundamentals/custom-providers) · [CHO binding recipes](/di/recipes/bindings) · [Lifetimes](/di/recipes/lifetimes) · [Configured modules](/di/configured-modules)

## Translate the request pipeline by behavior

| NestJS feature in the existing route | Where that behavior goes in CHO |
| --- | --- |
| `@Body()`, `@Query()`, `@Param()` | Put readers in `@Args(...)` in method parameter order. For raw Fetch input, read `ctx.req` |
| DTO plus validation or transformation pipe | Put a schema on a reader and apply `@Middlewares(validate())`. The handler receives the schema output. Encode whitelist, coercion and unknown-field rules in the schema |
| Guard | Middleware can inspect the request and return a `401` or `403` response before calling `next()`. Put an authenticated principal in request state |
| Interceptor | Await `next()` in middleware to observe timing, headers or the downstream response. Map a specific public representation in the handler when returning JSON |
| Exception filter | Apply `@Catch` in the owning scope or set application `onError`. Return the status, headers and body your clients expect |
| Express/Fastify request or reply extensions | Use Fetch APIs for portable handlers. Choose a specific linker and read `ctx.native` where the feature depends on a native plugin |

For example, replace a numeric query pipe with a schema on `Query("page", schema)`. Decide what an absent field means, whether `"02"` is valid, and what error body callers receive. CHO's default validation response includes the argument source and normalized issues. Use `onInvalid` to preserve an existing response envelope. [Request validation](/web/validation) · [Middleware ordering](/web/middlewares) · [Error handling](/web/error-handling)

## Move the host and transport last

A Nest HTTP application typically boots through `NestFactory` on Node.js. CHO offers Web, Command and Message entry points with a common module and DI model. Its four official runtimes are Node.js, Deno, Bun and Cloudflare Workers. Choose a compatible host per entry point. Fastify uses Node.js, while the Fetch-based built-in and Hono routers also serve Workers. At shutdown, drain the listener, then close the CHO application and its providers. [HTTP adapters](/adapters/) · [Shutdown](/recipes/shutdown)

For a Nest event handler, port the domain work first and declare the new subscription with `@Subscribe`. For request/reply, define a shared contract and choose a transport that supports replies, such as Core NATS. Preserve the producer's actual subject, encoding, headers, acknowledgment policy and retry expectations. A CHO typed contract uses JSON and does not imply compatibility with an existing Nest transport envelope. Kafka supports publishing and consuming on Node.js, Deno and Bun. [Message contracts](/message/contracts) · [NATS](/message/nats) · [Kafka](/message/kafka)

## Hand off one route at a time

For the catalog example, compare the status, content type and JSON body for both `/books/42` and a missing ID. Include an unauthorized request and invalid input if the original route handles them. For writes, also compare side effects and headers such as `Location`. Route traffic to the migrated feature once its observable behavior matches, then move the next feature that imports the catalog. [Exercise an HTTP application in memory](/web/testing)
