# Dependency injection

Every kind of CHO application, web, command-line and message, is built from
the same three things:

| Concept        | What it is                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------ |
| **Provider**   | How a value is created: an `@Injectable` class, or a `provider()` object with a factory          |
| **Controller** | An entry point the framework calls: a class with route handlers, commands or message handlers    |
| **Module**     | A group of providers and controllers. It injects what it declares and what its imports export    |

A **token** identifies something injectable: a class, a `token<T>()`, or a
symbol. The **injector** validates the graph of a root module, creates the
instances and releases them. You rarely meet it: `ChoWeb`, `ChoCommand` and
`ChoMessage` create it for you.

Everything on these pages is imported from `@chojs/web`, `@chojs/command` or
`@chojs/message`, whichever your application uses.

## An example

```ts
import { Controller, Injectable, Module, provider, token } from "@chojs/web";

// A value that is not a class has a token.
const DB_URL = token<string>("DB_URL");

// A provider with dependencies, in constructor order.
@Injectable([DB_URL])
class Database {
  constructor(readonly url: string) {}
}

@Injectable([Database])
class UserStore {
  constructor(readonly db: Database) {}
}

// A module that keeps Database private and exports UserStore.
@Module({
  providers: [
    provider({ provide: DB_URL, factory: () => "postgres://localhost/app" }),
    Database,
    UserStore,
  ],
  exports: [UserStore],
})
class UsersModule {}

@Controller({ route: "users", dependencies: [UserStore] })
class UsersController {
  constructor(readonly store: UserStore) {}
}

// The root module is the application.
@Module({ imports: [UsersModule], controllers: [UsersController] })
class App {}
```

## Three rules

These shape every application. They are decisions, not gaps.

**Singletons.** A declaration has one instance per application, shared by
everything that depends on it. Data that belongs to a request lives in the
request's context (`ctx.state`), not in the container. A value that must be
new each time is made by a factory function: provide the function, and call
it.

**Every dependency is required.** An application does not start with a missing
dependency: it is a wiring error, reported when the application is created. For
something that may be absent, provide a default.

**Modules are not configured.** A module is a fixed declaration and takes no
parameters. What needs configuration is a value, and a value is created by a
provider. See [Modules](/di/modules#modules-are-not-configured).

## Asynchronous by default

Every value is created by a factory that can be `async`. A provider can open a
connection or read a file before its value is ready, and everything that
depends on it simply waits:

```ts
const DB = token<Database>("DB");

@Module({
  providers: [
    provider({
      provide: DB,
      factory: async () => await Database.connect("postgres://…"),
    }),
    UserStore, // @Injectable([DB]): created once the connection is open
  ],
})
class App {}
```

## Fails before it starts

Creating the application reads and validates the whole module graph first,
synchronously. Every wiring mistake is reported there, before a single
instance exists:

- a missing provider: `Cannot resolve Database (argument #0) of UserStore in
  module App. Provide it there or import a module that exports it.`
- a circular dependency: `Circular dependency detected in module App: A → B → A`
- a missing decorator: `Class UserStore is not injectable. Did you forget
  @Injectable?`

The full list is in [Error messages](/reference/errors).

## Next

- [Tokens and providers](/di/providers)
- [Modules](/di/modules): scopes, imports and exports
- [Lifecycle](/di/lifecycle): creation, disposal and overrides for tests
