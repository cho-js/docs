# Introduction

CHO is a tiny decorator-based framework for building modular applications:
HTTP services with `@chojs/web`, command-line tools with `@chojs/command`, both
on the same dependency injection.

If you know Angular, NestJS or Spring, the shape is familiar: **modules** group
**providers** and **controllers**, and decorators declare how they fit
together.

```ts
@Injectable()
class UserStore {}

@Controller({ route: "users", dependencies: [UserStore] })
class UsersController {
  constructor(readonly store: UserStore) {}
}

@Module({ providers: [UserStore], controllers: [UsersController] })
class App {}
```

What is different is the approach, which is also why the project exists.

## Why CHO

### Portability

Applications are deployed on Node.js, Deno, Bun, Cloudflare Workers, AWS Lambda
and more, each with its own APIs and limits. CHO keeps application code away
from all of that:

- A web handler receives the standard `Request` and answers with a standard
  `Response`. Nothing in a controller depends on the HTTP library underneath.
- That library is a small [adapter](/adapters/) you can swap: the plain URL
  Pattern router, Hono or Fastify.
- The framework itself uses no runtime-specific API, and every change is tested
  on Deno, Node.js and Bun.

An adapter may support fewer runtimes than the framework does; each one says
which. See [Runtimes](/guide/runtimes).

### Standard decorators

Decorators exist in two incompatible forms: the TC39 proposal (stage 3, the
standard one) and the older TypeScript `experimentalDecorators`, which Bun also
implements. Frameworks that rely on `reflect-metadata` and emitted types are
tied to the older form and to a compiler that emits them.

The same CHO application runs with both. It needs no `reflect-metadata` and no
compiler plugin: dependencies are declared explicitly, and are still checked
against the constructor at compile time.

```ts
@Injectable([PORT, Logger]) // compile error: the constructor wants (Logger, number)
class Server {
  constructor(logger: Logger, port: number) {}
}
```

See [Decorators](/guide/decorators).

### Built for performance

There is no reflection at runtime. The whole module graph is validated and
linked once, when the application starts, so creating an instance afterwards
needs no lookup. A mistake in the wiring (a missing provider, a circular
dependency, a duplicate route) never waits for the first request to show up.

## The packages

| Package                 | For                                                                 |
| ----------------------- | ------------------------------------------------------------------- |
| `@chojs/web`            | HTTP applications                                                   |
| `@chojs/command`        | Command-line applications                                           |
| `@chojs/vendor-hono`    | Running `@chojs/web` on [Hono](https://hono.dev)                    |
| `@chojs/vendor-fastify` | Running `@chojs/web` on [Fastify](https://fastify.dev), Node.js only |
| `@chojs/core`           | The dependency injection engine underneath                          |

All of them are published on [JSR](https://jsr.io/@chojs).

An application imports from **one** package: `@chojs/web` or `@chojs/command`.
Each re-exports what an application needs from the core (`@Module`,
`@Controller`, `@Injectable`, `token`, `provider`), so you never import
`@chojs/core` yourself. A web application adds one adapter package.

## How the documentation is organized

- **[Getting started](/guide/getting-started)** installs CHO and runs a first
  application on each runtime.
- **[Dependency injection](/di/overview)** explains modules, providers and
  tokens. It applies to both kinds of application.
- **[Web applications](/web/quick-start)** and
  **[Command-line applications](/command/quick-start)** are the guides of the
  two packages.
- **[Reference](/reference/web)** lists the API, the error messages and the
  debug logging.
- **[Advanced](/advanced/core)** is for people who build on the core itself.
