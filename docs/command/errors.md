# Errors and exit codes

`run()` resolves to the exit code of the command line. It never throws for a
failing command, and never exits the process.

## Exit codes

| Situation                                              | Exit code |
| ------------------------------------------------------ | --------- |
| The command returns a non-negative integer `n`         | `n`       |
| The command returns anything else, or nothing          | `0`       |
| `--help`, `--version`, or no action (multiple actions) | `0`       |
| A middleware returns a non-negative integer `n`        | `n`       |
| The command fails, and its error handler returns `n`   | `n`       |
| The command fails, and its error handler returns anything else | `1` |
| The command fails, without an error handler            | `1`       |
| The command fails, and its error handler fails too     | `2`       |
| An unknown action (multiple actions)                   | `1`       |

An exit code above `255` is capped at `255`: a process reports exit codes
modulo 256, so `256` would read as success.

## `@Catch`

`@Catch(handler)` applies to a command method, a controller, or a module that
declares controllers. Its result gives the exit code.

```ts
import { Catch } from "@chojs/command";

@Catch((error, ctx) => {
  console.error(`${ctx.command} failed: ${error}`);
  return 2;
})
@Controller()
class FileSystem {
  @Catch((error) => (error instanceof NotFound ? 4 : 1)) // for `rm` only
  @Action("rm")
  remove(ctx: ChoCommandContext) {/* ... */}

  @Action("copy") // covered by the controller's handler
  copy(ctx: ChoCommandContext) {/* ... */}
}
```

A handler is called with the error, as thrown, and the context of the run, and
awaited.

## Where an error goes

An error thrown by a command, by a middleware, or while creating what the
command needs (its controller, a middleware class), goes to the nearest
handler:

1. the `@Catch` of the method, else
2. the `@Catch` of the controller, else
3. the `@Catch` of the module, else
4. the `onError` option of the application, else
5. `run()` prints `Error: <message>` to stderr and resolves to `1`.

```ts
const app = ChoCommand.create(App, {
  onError: (error, ctx) => {
    console.error(`${ctx.command}: ${error}`);
    return 70;
  },
});
```

If the handler itself fails (it throws, or its class cannot be created),
`run()` prints the original error and resolves to `2`.

## Error handler classes

A handler can be a class with a `handle(error, ctx)` method, created by the
injector when it first has an error to handle:

```ts
@Injectable([Logger])
class ReportError {
  constructor(readonly logger: Logger) {}

  handle(error: unknown, ctx: ChoCommandContext) {
    this.logger.error(ctx.command, error);
    return 3;
  }
}

@Controller()
class FileSystem {
  @Catch(ReportError)
  @Action("sync")
  sync(ctx: ChoCommandContext) {/* ... */}
}

@Module({ providers: [Logger, ReportError], controllers: [FileSystem] })
class App {}
```

A class given to `@Catch` is created in the scope of the module that declares
the controller; one given to `onError`, in the scope of the root module.

## What is not an error of a command

These are answered by the application itself. No middleware and no error
handler runs for them:

| Command line                    | Output                                                        | Exit code |
| ------------------------------- | ------------------------------------------------------------- | --------- |
| `--help`                        | The help                                                      | `0`       |
| `--version`                     | `<name> version <version>`, or `<name> (no version)`          | `0`       |
| No action (multiple actions)    | The help                                                      | `0`       |
| An unknown action               | `Error: Action '<name>' not found. Use --help for usage information.` | `1` |

## A pattern: errors with exit codes

```ts
export class CliError extends Error {
  constructor(message: string, readonly code = 1) {
    super(message);
  }
}

// a command
throw new CliError("no such file", 4);

// the application
const app = ChoCommand.create(App, {
  onError: (error) => {
    if (error instanceof CliError) {
      console.error(`error: ${error.message}`);
      return error.code;
    }
    console.error(error); // unexpected: print the stack
    return 70;
  },
});
```
