# `@chojs/command` API

Everything an application needs is exported by `@chojs/command`. The full,
generated API documentation is on [JSR](https://jsr.io/@chojs/command/doc).

## `ChoCommand`

```ts
class ChoCommand {
  static create(app: Class, options?: ChoCommandOptions): ChoCommand;

  run(argv: string[]): Promise<number>; // the exit code
  close(): Promise<void>;
}

type ChoCommandOptions = {
  name?: string; //               default "chojs"
  version?: string;
  parseOptions?: ParserOptions;
  onError?: ChoCommandErrorHandler;
  overrides?: readonly Provider[];
};
```

See [The application](/command/application).

## Decorators

### Dependency injection

| Decorator                    | On      | Options                                                          |
| ---------------------------- | ------- | ---------------------------------------------------------------- |
| `@Injectable(dependencies?)` | A class | The dependencies, in constructor order                           |
| `@Controller(options?)`      | A class | `dependencies`                                                   |
| `@Module(options?)`          | A class | `imports`, `providers`, `controllers`, `exports`, `dependencies` |

### Commands

| Decorator               | On                     | Arguments                                   |
| ----------------------- | ---------------------- | ------------------------------------------- |
| `@Main(flags?)`         | A method               | The flags the command declares              |
| `@Action(name, flags?)` | A method               | The action name, and the flags it declares  |
| `@Help(text)`           | A controller, a method | The help text                               |

### Middlewares and errors

| Decorator                      | On                               | Argument                                                        |
| ------------------------------ | -------------------------------- | --------------------------------------------------------------- |
| `@Middlewares(...middlewares)` | A module, a controller, a command | Functions `(ctx, next)`, or classes with `handle(ctx, next)`   |
| `@Catch(handler)`              | A module, a controller, a command | A function `(error, ctx)`, or a class with `handle(error, ctx)` |

## Functions

| Function                                | Returns                                             |
| --------------------------------------- | --------------------------------------------------- |
| `token<T>(description)`                 | A unique `InjectionToken<T>`                        |
| `provider({ provide, deps?, factory })` | A provider object, with `factory` typed from `deps` |

## Types

### The context

```ts
interface ChoCommandContext {
  readonly args: ChoArgs; //   { _: string[], [flag]: … }
  readonly argv: readonly string[];
  readonly command: string; // "main", or the action name
  readonly state: Map<PropertyKey, unknown>;
}
```

### Flags

```ts
type CommandFlags = {
  boolean?: readonly string[]; //   flags without a value
  string?: readonly string[]; //    flags whose value is kept as typed
  collect?: readonly string[]; //   flags that can repeat
  negatable?: readonly string[]; // boolean flags with a --no-<name> form
  alias?: Readonly<Record<string, string | readonly string[]>>;
  default?: Readonly<Record<string, unknown>>;
  describe?: Readonly<Record<string, string>>;
};
```

`ParserOptions`, for the `parseOptions` option, takes `boolean`, `string`,
`collect`, `negatable`, `alias`, `default`, `stopEarly`, `"--"` and `unknown`.

### Commands, middlewares, error handlers

| Type                       | Is                                                                   |
| -------------------------- | -------------------------------------------------------------------- |
| `ChoCommandHandler`        | A command method: `(ctx) => unknown`                                 |
| `ChoCommandNext`           | `next`: runs the rest of the chain, resolves to its exit code        |
| `ChoCommandMiddlewareFn`   | `(ctx, next) =>` an exit code or nothing                             |
| `ChoCommandMiddleware`     | A middleware function, or a class with `handle(ctx, next)`           |
| `ChoCommandErrorHandlerFn` | `(error, ctx) =>` an exit code or anything else                      |
| `ChoCommandErrorHandler`   | An error handler function, or a class with `handle(error, ctx)`      |

### Others

`ChoArgs`, and from the core `ModuleOptions`, `ControllerOptions`,
`InjectableOptions`, `InjectionToken`, `Provider`, `WithDependencies`.

## Summary tables

### Exit codes

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

Exit codes above `255` are capped at `255`.

### Reserved flags

`--help` and `--version`. Short flags are left to the commands.
