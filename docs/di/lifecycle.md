# Lifecycle

An application goes through three steps: the graph is **validated**, the
instances are **created**, and at the end they are **released**.

| Step     | `@chojs/web`, `@chojs/message`                             | `@chojs/command`                                     |
| -------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| Validate | `ChoWeb.create`, `ChoMessage.create`                       | `ChoCommand.create`                                  |
| Create   | `ChoWeb.create`, `ChoMessage.create`: everything, up front | `run()`: only what the command needs, the first time |
| Release  | `app.close()`                                              | `app.close()`                                        |

The difference in the middle is deliberate. A server must not start
half-created, so a web application creates everything before it resolves, and
so does a message application, before it connects to its broker. A
command-line tool must print `--help` without needing the database, so it
creates lazily.

## Creating instances

- Each declaration is created **at most once** and shared. Concurrent requests
  for it share one creation.
- A declaration is created after its dependencies; independent ones are
  created in parallel.
- Factories and constructors can do their work asynchronously through
  `provider()` factories ([Tokens and providers](/di/providers)).

### Setup code

To run code before the application handles anything (open a connection, read a
configuration file), put it in a provider and depend on it:

```ts
const CONFIG = token<Config>("CONFIG");

@Module({
  providers: [
    provider({ provide: CONFIG, factory: () => Config.load("./app.json") }),
    provider({
      provide: Database,
      deps: [CONFIG],
      factory: async (config) => await Database.connect(config.dbUrl),
    }),
  ],
  controllers: [UsersController], // depends on Database
})
class App {}
```

### Failures

When a factory or a constructor throws, the creation fails with
`Failed to create X in module M`, with the original error as `cause`.
Everything that depends on it fails with that same error.

**There is no retry.** The failure is remembered, and every later request for
the declaration gets the same error. In a web application this makes
`ChoWeb.create` reject, and what was created until then is disposed: stop the
process.

## Releasing instances

`app.close()` releases what the application created, in **reverse creation
order**: a value is disposed before what it depends on.

A class takes part by implementing the standard methods of explicit resource
management. There is no CHO interface:

```ts
@Injectable()
class Database {
  async [Symbol.asyncDispose]() {
    await this.connection.close();
  }
}
```

- `[Symbol.asyncDispose]()` is used when present, else `[Symbol.dispose]()`.
- It applies to every created value: providers, controllers, modules, and what
  a `provider()` factory returns.
- A value with neither method is skipped; a value provided under several
  tokens is disposed once.
- One failure does not stop the others: `close()` then rejects with an
  `AggregateError` that holds each failure.
- Closing is final.

**CHO never closes on its own.** When the application ends is your decision.

::: code-group

```ts [Web]
import { serve } from "@chojs/web/serve";

const server = await serve(app.handler);

process.once("SIGTERM", async () => {
  await server.close(); // stop accepting, finish the requests in flight
  await app.close();
});
```

```ts [Command]
const code = await app.run(args);
await app.close(); // once, after the last run()
exit(code);
```

:::

Stop the server first, then close. A request that still reaches a closed web
application is answered `503 Service Unavailable`.

## Overrides, for tests

The `overrides` option replaces declared providers, wherever they are in the
module graph, without changing any module:

::: code-group

```ts [Web]
const app = await ChoWeb.create(App, {
  overrides: [provider({ provide: Database, factory: () => new FakeDatabase() })],
});
```

```ts [Command]
const app = ChoCommand.create(App, {
  overrides: [provider({ provide: Disk, factory: () => new FakeDisk() })],
});
```

:::

- An override replaces the `providers` entries of its token, a class or a
  provider object, in every module that declares one.
- Its `deps` resolve in the scope of the module that declares the provider it
  replaces.
- Controllers and modules cannot be overridden.
- An override that replaces nothing is an error, so a stale test fails loudly.

See [Testing a web application](/web/testing) and
[Testing a command-line application](/command/testing).
