# Debug logging

CHO logs what it does to **debug contexts**, on stderr. Logging is off by
default and costs nothing when disabled.

## Enabling it

| Variable        | Value                    | Enables                              |
| --------------- | ------------------------ | ------------------------------------ |
| `CHO_DEBUG`     | `1`, `true`, `yes`, `on` | Every context                        |
| `CHO_DEBUGLOG`  | `cho:web`                | One context                          |
| `CHO_DEBUGLOG`  | `cho:web,cho:di`         | Several contexts                     |
| `CHO_DEBUGLOG`  | `cho:*`                  | Every context that starts with `cho:` |

::: code-group

```sh [Deno]
CHO_DEBUG=1 deno run --allow-net --allow-env main.ts
```

```sh [Node.js]
CHO_DEBUG=1 npx tsx main.ts
```

```sh [Bun]
CHO_DEBUG=1 bun run main.ts
```

:::

On Deno, the process needs `--allow-env` to read the variables.

On a runtime without `process.env`, such as Cloudflare Workers, give CHO the
environment before the application is created:

```ts
import { set_env } from "@chojs/core/utils";

set_env(env); // a record, or a function (key) => value
```

## The contexts

| Context       | Logged by         | What                                                    |
| ------------- | ----------------- | ------------------------------------------------------- |
| `cho:di`      | The injector      | Modules, resolutions, creations and their time, failures |
| `cho:web`     | `@chojs/web`      | Routes, application creation, errors given to handlers  |
| `cho:command` | `@chojs/command`  | Commands found, each run, exit codes, errors            |
| `cho:message` | `@chojs/message`  | Topics, application creation, messages that failed      |
| `cho:kafka`   | `@chojs/vendor-kafka` | The subscription, retries, dead letters, failed commits, the stop |

### `cho:di`

```
12:00:00.001 cho:di module Db: 3 declarations
12:00:00.001 cho:di module App: 3 declarations, imports Db
12:00:00.002 cho:di graph of App built: 2 modules +1ms
12:00:00.002 cho:di resolve Users in module App
12:00:00.003 cho:di created Logger in module Db +0ms
12:00:00.003 cho:di created Users in module App +1ms
12:00:00.004 cho:di ERROR failed to create Broken in module App: Error: no config
```

It logs the modules of the graph once it is built (or the error when it is
invalid), each resolution and each failed lookup, each declaration it creates
with the time its factory took, and each failing factory with the original
error.

### `cho:web`

```
cho:web UsersController.update has an argument with a validator and no validate() middleware: it is not validated
cho:web GET /v1/users/:id -> UsersController.get
cho:web GET /v1/users -> UsersController.list
cho:web application App created +2ms
cho:web ERROR GET /v1/users/1 failed: Error: db down
```

It logs every route with its handler, the error that stops the application
from being created, and each error a `@Catch` handler receives, with the
request's method and path. It also lists each handler that has an argument
with a validator and is not covered by the
[validation middleware](/web/validation): its validators are not run.

### `cho:command`

```
cho:command actions mode: copy (Files.copy), rm (Files.remove)
cho:command run [ "copy", "a", "b" ]
cho:command copy (Files.copy) exited 0 +2ms
cho:command run [ "rm" ]
cho:command ERROR rm failed: Error: no such file
cho:command handled by onError
```

It logs the commands found when the application is created, each command line
with what it ran (a command, the help or the version), each command's exit
code and duration, each error, the error handler that received it, and a
handler that failed.

### `cho:message`

```
cho:message shop.orders.created -> OrdersController.created
cho:message shop.orders.cancelled -> OrdersController.cancelled
cho:message application App created +6ms
cho:message ERROR shop.orders.created (OrdersController.created) failed: TypeError: an order has an email
```

It logs every topic with its handler, the error that stops the application
from being created, and each error of a handler or a middleware, with the
topic and the handler of its message. It is logged before the error handler
runs, so a message that is then settled as handled still leaves a line. An
application made with `ChoMessage.from` logs
`application created on a given injector`.

Debug logging only adds these lines: errors are reported the same way with or
without it.

## Troubleshooting

| Symptom                                                | Look at                                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `Cannot resolve X … in module M`                       | `X` is not in `M`'s scope: provide it in `M`, or export it from a module `M` imports ([Modules](/di/modules#scope-rules)) |
| `Class X is not injectable`                            | `@Injectable()` is missing on a class listed in `providers`                                 |
| A route answers `404`                                  | `CHO_DEBUGLOG=cho:web` lists every route with its full path; routes have no leading `/`     |
| The wrong route answers                                | A parameter route declared before a static one ([Routing](/web/routing#matching-order))     |
| An error handler runs but the client gets `500`        | The handler returns nothing ([Error handling](/web/error-handling#what-an-error-handler-returns)) |
| A middleware does not run                              | Middlewares belong to their routes, commands or topics; a module without controllers has none |
| A message is never handled                             | `CHO_DEBUGLOG=cho:message` lists every topic in full, global prefix included ([Topics](/message/topics)) |
| A message is delivered again and again                 | It fails each time: its error handler returns nothing ([Error handling](/message/error-handling#retry-or-drop)) |
| `SyntaxError: Invalid or unexpected token` at an `@`   | Node.js is running the file without `tsx` or compilation ([Runtimes](/guide/runtimes#node-js)) |
| A flag value is taken as the command                   | Declare the flag in `parseOptions` ([Flags](/command/flags#finding-the-command))            |
