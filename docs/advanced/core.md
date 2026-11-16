# The core package

`@chojs/core` is the foundation of CHO: the asynchronous dependency injection
engine, plus the helpers CHO modules use to build on it.

::: warning Internal
Applications do not need this package: `@chojs/web`, `@chojs/command` and
`@chojs/message` re-export everything an application needs from it.

The core is internal, for now. Its functions are named in `snake_case`, which
in CHO marks an API with no compatibility promise: they can change between
versions without a major release.
:::

A **CHO module** is a package, like `@chojs/web`, `@chojs/command` or
`@chojs/message`, that
turns a module graph into a running application. This section is for people
who write one, or who want to use the injector on its own.

## Install

::: code-group

```sh [Deno]
deno add jsr:@chojs/core
```

```sh [Node.js]
npx jsr add @chojs/core
```

```sh [Bun]
bunx jsr add @chojs/core
```

:::

## Entry points

| Entry point                    | Contents                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `@chojs/core`                  | The DI essentials: the decorators, `Injector`, `token`, `provider`             |
| `@chojs/core/di`               | Everything above, plus the metadata and decorator helpers for CHO modules      |
| `@chojs/core/utils`            | Runtime helpers: `env`, `set_env`, `engine`, `debuglog`, `compose`, `describe` |
| `@chojs/core/utils/test_utils` | Test helpers: apply decorators as function calls, capture console output       |

## The injector

```ts
import { Injectable, Injector, Module, provider, token } from "@chojs/core";

const DB = token<Database>("DB");

@Injectable([DB])
class UserService {
  constructor(readonly db: Database) {}
}

@Module({
  providers: [
    provider({ provide: DB, factory: () => Database.connect("postgres://…") }),
    UserService,
  ],
  exports: [UserService],
})
class UsersModule {}

@Module({ imports: [UsersModule] })
class App {}

const injector = new Injector(App); //                validates the graph, creates nothing
const users = await injector.resolve(UserService); // connects, then constructs
await injector.dispose(); //                          releases what was created
```

| Member                    | Does                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `new Injector(root, { overrides? })` | Reads and validates the whole graph, synchronously. Creates nothing         |
| `resolve(token, module?)` | The value of a token, as the given module sees it (the root by default). Creates only what the token needs |
| `init()`                  | Creates every declaration of every module. A module is created after its imports; independent work runs in parallel |
| `dispose()`               | Releases the created values, in reverse creation order. Final                          |
| `controllers()`           | Every controller, once each: its class (`token`), its module (`owner`), its metadata (`meta`) |
| `modules()`               | Every module, once each, imported modules first, the root last                         |
| `graph`, `meta`           | The dependency graph and the metadata graph ([Internals](/advanced/internals))         |

- `init()` is not required before `resolve()`, and calling it again creates
  nothing twice.
- A failed creation is remembered: there is no retry.
- After `dispose()`, `resolve()` and `init()` reject with
  `The injector is disposed`. `await using injector = new Injector(App)` works
  too.

The rules of tokens, providers, modules and disposal are those of the
[Dependency injection](/di/overview) pages.

## Runtime helpers: `@chojs/core/utils`

| Function                               | Does                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| `env(key)`, `env_bool(key)`, `env_num(key)` | Read an environment variable: `undefined`, `false` or `NaN` when it is missing. `env_bool` accepts `1`, `true`, `yes`, `on` |
| `set_env(source)`                      | The environment to read first, as a record or a function. Needed on runtimes without `process` |
| `engine()`                             | The runtime: `"deno"`, `"node"`, `"bun"`, `"workerd"`, `"edge"` or `"unknown"`    |
| `debuglog(context)`                    | A logger to stderr for one context, with `.error()`, `.start()` and `.enabled`    |
| `compose(middlewares, endpoint, kind?)` | Runs a chain of middlewares around an endpoint, for any context, with a result or without one |
| `describe(value)`                      | A readable name for error messages                                                |
| `is_class(value)`, `is_class_implement(value, method)` | Whether a value is a class, and whether its prototype has a method |

```ts
import { debuglog, engine, env_bool } from "@chojs/core/utils";

const log = debuglog("my:module"); // enabled by CHO_DEBUGLOG=my:module

log(`running on ${engine()}`);
const done = log.start();
// … work
done("finished"); // adds the elapsed time
```

### `compose`

`compose` is the one implementation of the middleware chain, for every CHO
module. It has two forms:

```ts
import { compose, type ResultKind } from "@chojs/core/utils";

// With a result: a middleware can return one, in place of the endpoint's.
const kind: ResultKind<Response> = {
  is: (value): value is Response => value instanceof Response,
  name: "a Response", // for error messages
  noun: "response",
};
const handle = compose(middlewares, endpoint, kind); // (ctx) => Promise<Response>

// Without one: what a middleware returns is ignored.
const run = compose(middlewares, endpoint); //          (ctx) => Promise<void>
```

| | With a `kind` | Without |
| --- | --- | --- |
| Used by | `@chojs/web` (a `Response`), `@chojs/command` (an exit code) | `@chojs/message` |
| A middleware is | `MiddlewareFn<Ctx, Result>` | `VoidMiddlewareFn<Ctx>` |
| Returning without `next()` | Must return a result, or the chain fails | Skips the endpoint; the chain resolves |
| Returning after `next()` | A result replaces the endpoint's; nothing passes it on | Ignored |
| `next()` rejected, and the middleware caught it | The middleware's result is the answer | The chain still rejects, with that error |
| `next()` called twice | The chain fails | The chain fails |

## Naming

The name of a function says who it is for.

| What                                                   | Convention   | Examples                                      |
| ------------------------------------------------------ | ------------ | --------------------------------------------- |
| Public API: classes                                    | `PascalCase` | `ChoWeb`, `ChoMessage`, `HonoLinker`          |
| Public API: functions and methods                      | `camelCase`  | `ChoWeb.create()`, `app.close()`              |
| Decorators, public or internal                         | `PascalCase` | `@Injectable`, `@Get`, `@Action`              |
| Internal functions and methods, **even when exported** | `snake_case` | `is_token`, `read_metadata_object`, `set_env` |

A single word fits both conventions (`provider`, `token`, `compose`), so a
function can move between the two audiences without a rename.
