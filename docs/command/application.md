# The application

`ChoCommand.create` builds the application from its root module.

```ts
const app = ChoCommand.create(App, {
  name: "fs",
  version: "1.0.0",
  parseOptions: { boolean: ["verbose"] },
  onError: (error, ctx) => 70,
});
```

It reads and checks the module graph and the commands, and throws on any
mistake. **It creates no instance**, and it is synchronous.

## Options

| Option         | Default   | Use                                                              |
| -------------- | --------- | ---------------------------------------------------------------- |
| `name`         | `"chojs"` | The program name, in `--version` and the help usage lines        |
| `version`      | none      | Printed by `--version`                                           |
| `parseOptions` | none      | Flags declared for every command ([Flags](/command/flags#flags-for-every-command)) |
| `onError`      | none      | The error handler for what no `@Catch` covers ([Errors](/command/errors)) |
| `overrides`    | none      | Providers that replace declared ones, for [tests](/command/testing) |

## `run(argv)`

Runs one command line and resolves to the exit code. It never exits the
process: pass the result to the runtime.

::: code-group

```ts [Deno]
const code = await app.run(Deno.args);
await app.close();
Deno.exit(code);
```

```ts [Node.js]
const code = await app.run(process.argv.slice(2));
await app.close();
process.exit(code);
```

```ts [Bun]
const code = await app.run(process.argv.slice(2));
await app.close();
process.exit(code);
```

:::

What `run()` does, in order:

1. `--help` prints the help and resolves to `0`.
2. `--version` prints the version and resolves to `0`.
3. With multiple actions, a command line without an action prints the help and
   resolves to `0`.
4. With multiple actions, an unknown action prints an error and resolves to
   `1`.
5. Otherwise the command's controller is created, with its dependencies, and
   the method is called with the context, through its middlewares, and
   awaited.

Only what that command needs is created, the first time only: later runs
reuse it. `run()` can be called several times, which is what a REPL or a test
does.

## Setup and cleanup

To run setup code before a command (open a connection, read a configuration
file), put it in a provider, an async factory if needed, and make the
controller depend on it. The injector creates it before the controller, once
per application:

```ts
const CONFIG = token<Config>("CONFIG");

@Module({
  providers: [
    provider({ provide: CONFIG, factory: () => Config.load("./fs.json") }),
    Disk,
  ],
  controllers: [FileSystem],
})
class App {}
```

To release it afterwards, give the provider a `[Symbol.asyncDispose]()` or
`[Symbol.dispose]()` method and call `app.close()` after the last `run()`:

```ts
@Injectable()
class Database {
  async [Symbol.asyncDispose]() {
    await this.connection.close();
  }
}

const app = ChoCommand.create(App);
const code = await app.run(args);
await app.close(); // disposes the instances, in reverse creation order
```

`run()` never closes: instances are kept between runs. Closing is final: call
it once, after the last `run()`. A later run that still has something to
create prints `Error: The injector is disposed` and resolves to `1`.

See [Lifecycle](/di/lifecycle).

## Debug logging

```sh
CHO_DEBUGLOG=cho:command fs copy a b
```

```
cho:command actions mode: copy (Files.copy), rm (Files.remove)
cho:command run [ "copy", "a", "b" ]
cho:command copy (Files.copy) exited 0 +2ms
```

See [Debug logging](/reference/debugging).
