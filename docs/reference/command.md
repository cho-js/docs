# Command API reference

Import the application factory, decorators and context types from `@chojs/command`. The package re-exports the dependency injection declarations used to build a command module. [All command exports and usage examples](/api/command)

## Application

| API | Contract |
| --- | --- |
| `ChoCommand.create(Root, options?)` | Synchronous graph validation. Returns a reusable command application |
| `app.run(argv: string[])` | Resolves to a numeric exit status. Expects the arguments after the executable and script |
| `app.close()` | Asynchronously releases initialized resources |
| `app[Symbol.asyncDispose]()` | Enables block-scoped async disposal |

Options are `name` (default `"chojs"`), `version`, `parseOptions`, `overrides` and `onError`. `--help` and `--version` are reserved long flags. See [launching a CLI](/command/application).

## Decorators and providers

| API | Target and behavior |
| --- | --- |
| `@Main(flags?)` | One implicit command in the application |
| `@Action(name, flags?)` | Named command. Names are unique, contain no whitespace and cannot begin with a dash |
| `@Help(text)` | Controller group or method help. The first line serves as its summary |
| `@Middlewares(...items)` | Module, controller or method. Calls downstream through `next()` |
| `@Catch(handler)` | Selects an error handler for that scope |
| `@Module`, `@Controller`, `@Injectable` | Declare ownership and constructor dependencies |
| `token<T>`, `provider` | Identify values and declare factories |

## Arguments and handlers

[`CommandFlags`](/api/command#symbol-CommandFlags) supports `boolean`, `string`, `collect`, `negatable`, `alias`, `default` and [`describe`](/api/core-utils#symbol-describe). [`ParserOptions`](/api/command#symbol-ParserOptions) configures the application parser, including options such as `stopEarly` and `"--"`. Local flag definitions are merged for the selected action. [Flag semantics](/command/flags)

| `ChoCommandContext` member | Value |
| --- | --- |
| `args` | `ChoArgs` with `_` for positional strings and fields for parsed flags |
| `argv` | Original list passed to `run` |
| `command` | `"main"` or the selected action name |
| `state` | Per-run `Map<PropertyKey, unknown>` |

Use [`ChoCommandMiddlewareFn`](/api/command#symbol-ChoCommandMiddlewareFn) and [`ChoCommandNext`](/api/command#symbol-ChoCommandNext) for function middleware. [`ChoCommandMiddleware`](/api/command#symbol-ChoCommandMiddleware) also accepts a class with `handle`. The analogous error-handler types are [`ChoCommandErrorHandlerFn`](/api/command#symbol-ChoCommandErrorHandlerFn) and [`ChoCommandErrorHandler`](/api/command#symbol-ChoCommandErrorHandler).

## Exit codes

A valid code is a non-negative integer, capped at `255`. A normal command with no code succeeds with `0`. Unhandled command errors and unknown actions produce `1`. A failing error handler produces `2`. A successful error handler may choose its own code. [Full exit-code rules](/command/errors)
