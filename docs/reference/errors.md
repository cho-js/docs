# Error messages

CHO reports mistakes as early as it can: most when a class is defined or when
the application is created, before anything runs.

::: warning Messages are for people, not for code
Every error is a plain `Error` (or `TypeError`, `AggregateError`) with a
message. The messages listed here are the current wording: they are not part
of the API, and can be reworded in any release. **Do not match on their
text.** What is stable is when an error happens and, where it is documented,
its `cause`. Exit codes of `@chojs/command` are part of the API.
:::

In the messages, values are named by class name (`<anonymous>` for an
anonymous class), quoted string, `InjectionToken(<description>)` or
`Symbol(<description>)`. `<v>` is a short description of the bad value.

## When errors happen

| Step                             | What is checked                                                        |
| -------------------------------- | ---------------------------------------------------------------------- |
| A class is defined               | The arguments of each decorator                                        |
| The application is created       | The module graph, the routes or commands, the middlewares and handlers |
| An instance is created           | Factories and constructors                                             |
| A request or a command runs      | Middleware misuse, and your own errors                                 |
| The application is closed        | Dispose methods                                                        |

## Dependency injection

### Thrown by the decorators

| Mistake                                 | Message                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------- |
| A second DI decorator on a class        | `class X is already decorated with @Injectable, @Module or @Controller` |
| A list option is not an array           | `<option> must be an array, got <v>`                                    |
| A dependency is not a token             | `all dependencies must be classes, symbols or injection tokens: <v>`    |
| An import is not a class                | `all imports must be classes: <v>`                                      |
| A controller is not a class             | `all controllers must be classes: <v>`                                  |
| An export is not a token                | `all exports must be classes, symbols or injection tokens: <v>`         |
| A middleware is not a function          | `all middlewares must be functions: <v>`                                |
| An error handler is not a function      | `the error handler must be a function or a class: <v>`                  |
| A second `@Catch` on a class or method  | `an error handler is already set (one @Catch per target)`               |
| `@Middlewares` / `@Catch` on a static, private or symbol-named method | `TypeError: @Middlewares() cannot decorate static method <name>: only public, non-static methods with a string name are supported` |
| An unknown option                       | `@Controller(): unknown option "deps". Known options: dependencies, route` |

A malformed provider object gives one of these, checked in this order:

- `provider <name> is not an object`
- `provider <name> is missing the "provide" property`
- `provider <name>: "provide" must be a class, symbol or injection token, got <v>`
- `provider <name> is missing the "factory" property`
- `provider <name>: "factory" must be a function, got <v>`
- `provider <name>: "deps" must be an array, got <v>`
- `provider <name>: all deps must be classes, symbols or injection tokens: <v>`

### When the application is created

| Mistake                                 | Message                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| The root is not a class                 | `TypeError: Expected a module class, got <typeof>`                                                                    |
| Circular imports                        | `Circular dependency detected: A → B → A`                                                                             |
| An import is not a `@Module`            | `Class X is not a module. Did you forget @Module?`                                                                    |
| A provider is not `@Injectable`         | `Class X is not injectable. Did you forget @Injectable?`                                                              |
| A controller is not a `@Controller`     | `Class X is not a controller. Did you forget @Controller?`                                                            |
| A controller in `providers`             | `Class X is a controller: declare it in "controllers", not in "providers".`                                           |
| A module in `providers`                 | `Class X is a module: list it in "imports", not in "providers".`                                                      |
| A token declared twice                  | `X is declared more than once in module M (as <kind> and as <kind>). Declare each token once.`                        |
| An ambiguous token is used              | `X is ambiguous in module M: A, B export different instances of it. Provide X in M to choose which one to use.`       |
| A module re-exported                    | `Module M exports the imported module X. Re-exporting a module is not supported; export the tokens you need instead.` |
| An export not in scope                  | `Module M exports X, which it neither provides nor imports.`                                                          |
| A missing dependency                    | `Cannot resolve X (argument #i) of Y in module M. Provide it there or import a module that exports it.`               |
| Circular dependencies                   | `Circular dependency detected in module M: A → B → A`                                                                 |

`#i` counts from zero.

Overrides:

- `An override must be a provider object, built with provider()`
- `X is overridden more than once`
- `Cannot override X: no module of the application provides it`

### When instances are created or released

| Problem                         | Message                                                                 |
| ------------------------------- | ----------------------------------------------------------------------- |
| A factory or constructor failed | `Failed to create X in module M`, with the original error as `cause`    |
| The application is closed       | `The injector is disposed`                                              |
| A dispose method failed         | An `AggregateError`, `Failed to dispose N of the injector's instances`, whose `errors` are `Failed to dispose X in module M`, each with its `cause` |

## `@chojs/web`

### Thrown by the decorators

| Mistake                                        | Message                                                                                                               |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| A handler's route is invalid                   | `Invalid route "<route>" of @Get() on method <name>: <reason>`                                                        |
| A second HTTP method decorator on a method     | `Cannot add @Get() to method <name>: it already handles POST "<route>". A method can have one HTTP method decorator.` |
| A static, private or symbol-named handler      | `TypeError: @Get() cannot decorate static method <name>: a handler must not be static`                                |
| A second `@Args` on a method                   | `Cannot add @Args() to method <name>: it already has one.`                                                            |
| An argument of `@Args` is not a function       | `TypeError: @Args() on method <name>: argument <n> must be made with Param, Query, Header, Body or Form, or be a function, got <v>` |
| A key or a validator of the wrong type         | `TypeError: Body(): expected a key (a string) or a validator (an object with a parse method), got <v>`                |
| An unknown option of `@Doc`                    | `@Doc(): unknown option "tag". Known options: deprecated, description, hidden, responses, summary, tags`              |
| An unknown option of `@Sse`                    | `@Sse(): unknown option "keepalive". Known options: keepAlive, method` |
| A `method` a stream cannot answer              | `TypeError: @Sse(): method must be one of GET, POST, PUT, PATCH, DELETE, got <v>` |
| A `keepAlive` that is not a time               | `TypeError: @Sse(): keepAlive must be a positive whole number of milliseconds, got <v>` |
| A handler option of `@Doc` on a class          | `@Doc(): option "summary" is for a handler, not for a class (class <Name>)`                                           |

### Rejected by `ChoWeb.create`

Any dependency injection error above, and:

| Mistake                                       | Message                                                                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| A route is not a string                       | `TypeError: Invalid route of <where>: expected a string, got <v>`                                                       |
| A route breaks a rule                         | `Invalid route "<route>" of <where>: <reason>`                                                                          |
| Two handlers with the same method and path    | `Duplicate route "<METHOD> <path>": declared by <Controller.method> and <Controller.method>`                            |
| The same controller declared by two modules   | The message above, followed by `Its controller is declared in more than one module: declare it in one.`                 |
| A wildcard in a route                         | `Invalid route "<route>" of <where>: "<segment>" has a "*": wildcards are not part of the route syntax`                 |
| A malformed parameter (`:`, `:1id`, `:a:b`)   | `Invalid route "<route>" of <where>: "<segment>" is not a valid parameter: write ":name", with letters, digits and "_"` |
| `Param("x")` names no parameter of the path   | `@Args() of <Controller.method>: Param("x") is not a parameter of the route "<path>"`                                   |
| `onError` is not a function or a class        | `Invalid error handler <v>: must be a function or a class with a 'handle' method.`                                      |
| A middleware class has no `handle` method     | `Middleware class <Name> must implement 'handle' method.`                                                               |
| A middleware class cannot be created          | `Failed to create middleware <Name> in module <Module>`, with `cause`                                                   |
| An error handler class has no `handle` method | `Error handler class <Name> must implement 'handle' method.`                                                            |
| An error handler class cannot be created      | `Failed to create error handler <Name> in module <Module>`, with `cause`                                                |

`<where>` names the declaration: `the global prefix`, `feature <Module>`,
`controller <Controller>` or `method <name> of controller <Controller>`.

### Failing a request

These go to the route's [error handler](/web/error-handling):

| Mistake                                               | Message                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| A middleware calls `next()` twice                     | `middleware <name>: next() called more than once`                              |
| A middleware returns nothing without calling `next()` | `middleware <name> returned no response: return a Response or call next()`     |
| A middleware returns something else                   | `TypeError: middleware <name> must return a Response or nothing, got <typeof>` |
| An `@Sse` handler returns something else              | `TypeError: @Sse() handler <Controller.method> must return an async iterable or a Response, got <typeof>` |

A middleware class is named `<Class>.handle`.

### Cutting an event stream

These happen once a stream of [server-sent events](/web/sse) has started. The
stream is cut, and the server prints the error. No
[error handler](/web/error-handling) is called: the request is already
answered.

| Mistake                                   | Message                                                                                                    |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Something that is not an event is yielded | `TypeError: @Sse() handler <Controller.method>: an event must be a string or an object with data, got <v>` |
| An `event` or an `id` that cannot be sent | `TypeError: @Sse() handler <Controller.method>: "event" must be a string with no line break, got <v>`      |
| A `retry` that is not a time              | `TypeError: @Sse() handler <Controller.method>: "retry" must be a whole number of milliseconds, got <v>`   |
| `data` that cannot be serialized as JSON  | The `TypeError` of `JSON.stringify`                                                                        |

## `@chojs/command`

### Thrown by the decorators

| Mistake                                      | Message                                                                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `@Action` name is empty or not a string      | `TypeError: Action must be a non-empty string`                                                                          |
| `@Action` name has whitespace                | `TypeError: @Action("<name>"): the name must not contain whitespace`                                                    |
| `@Action` name starts with `-`               | `TypeError: @Action("<name>"): the name must not start with "-"`                                                        |
| `@Main` / `@Action` on a symbol-named method | `TypeError: <decorator> cannot decorate method Symbol(...): a command method must have a string name`                   |
| `@Main` / `@Action` on a `#private` method   | `TypeError: <decorator> cannot decorate private method '#<name>': a command method must be public`                      |
| `@Main` / `@Action` on a static method       | `TypeError: <decorator> cannot decorate static method '<name>': a command method must not be static`                    |
| `@Main` / `@Action` on anything but a method | `TypeError: <decorator> can only decorate a method`                                                                     |
| A second `@Main` / `@Action` on a method     | `Cannot add <decorator> to method '<name>': it already has <existing>. A method can have at most one @Main or @Action.` |
| `@Help` text is empty or not a string        | `TypeError: Help must be a non-empty string`                                                                            |
| `@Help` on anything but a class or a method  | `TypeError: @Help() can only decorate a class or a method`                                                              |

Flags declared with `@Main` / `@Action`, each message starting with the
decorator (`@Action("copy"): …`):

- `TypeError: … the flags must be an object`
- `… unknown option "<key>". Known options: boolean, string, collect, negatable, alias, default, describe`
- `TypeError: … "<key>" must be an array of flag names`
- `TypeError: … "<key>" must be an object`
- `… the flag "<name>" is reserved by the application`

### Thrown by `ChoCommand.create`

Any dependency injection error above, and:

- `No @Main or @Action methods found in the application`
- `Mixing @Main and @Action methods in the same application is not allowed`
- `Multiple @Main methods in the same application is not allowed`
- `Duplicate @Action("<name>"): declared on <Controller>.<method> and <Controller>.<method>`
- `Middleware class <Name> must implement 'handle' method.`
- `Error handler class <Name> must implement 'handle' method.`
- `Invalid error handler <v>: must be a function or a class with a 'handle' method.`
- `Middleware class <Name> is not visible in module <Module>. Provide it there or import a module that exports it.`
- `Middleware class <Name> is ambiguous in module <Module>: several of its imports export it. Provide it there to choose one.`

The last two also exist for error handler classes.

### Printed by `run()`

With exit code `1`, besides the command's own errors:

- `Error: Action '<name>' not found. Use --help for usage information.`
- `Error: middleware <name>: next() called more than once`
- `Error: middleware <name> returned no exit code: return an exit code or call next()`
- `Error: middleware <name> must return an exit code or nothing, got <typeof>`
- `Error: The injector is disposed` (a command that needs a new instance, after `close()`)
