# Writing a CHO module

A CHO module is a package that turns a module graph into a running
application, as `@chojs/web` does for HTTP, `@chojs/command` for the command
line and `@chojs/message` for the messages of a broker. You could write one
for a scheduler, a WebSocket server or a GraphQL API.

The recipe has three parts:

1. **Decorators** of your own attach metadata to controller methods.
2. **The injector** hands that metadata back, with the middlewares and error
   handlers the core collected.
3. **Your runner** resolves the controllers and calls their methods.

::: warning
This uses `@chojs/core/di`, an internal API with no compatibility promise
([The core package](/advanced/core)).
:::

## 1. A decorator

A decorator only declares: it writes a record, and creates nothing. Every
decorator must accept both call shapes, TC39 `(value, context)` and legacy /
Bun `(prototype, name, descriptor)`; `decorated_method` hides the difference.

```ts
import {
  add_to_metadata_object,
  type ChoMethodDecorator,
  decorated_method,
} from "@chojs/core/di";

// The module's own, private key.
const ON: unique symbol = Symbol.for("chojs.my-events.on");

/** Marks the method that handles an event. */
export function On(event: string): ChoMethodDecorator {
  return (target, context, descriptor) => {
    const method = decorated_method("@On()", target, context, descriptor);
    add_to_metadata_object(method.meta, { [ON]: event });
  };
}
```

Keys are `Symbol.for("chojs.<package>.<key>")` symbols, so they never collide
with user options or with other modules, and are shared across copies of the
package.

## 2. Reading it back

`injector.controllers()` gives every controller of the application. Each
method that has metadata comes with it, and with its `middlewares` and
`errorHandler`:

```ts
import { Injector } from "@chojs/core/di";

const injector = new Injector(App);

for (const node of injector.controllers()) {
  // node.token: the controller class
  // node.owner: the module that declares it
  // node.meta:  its options, middlewares, errorHandler and methods
  for (const { name, meta, middlewares, errorHandler } of node.meta.methods) {
    const event = meta[ON];
    if (event) {
      // … register
    }
  }
}
```

## 3. Running

Resolve the controller in the scope of its module, compose the middlewares
around the method, and hand errors to the error handler:

```ts
import { Injector, resolve_handle } from "@chojs/core/di";
import { compose } from "@chojs/core/utils";

export class Events {
  readonly #handlers = new Map<string, (payload: unknown) => Promise<void>>();
  readonly #injector: Injector;

  private constructor(injector: Injector) {
    this.#injector = injector;
  }

  static async create(app: new (...args: never[]) => unknown): Promise<Events> {
    const injector = new Injector(app);
    await injector.init(); // eager, like @chojs/web
    const events = new Events(injector);

    for (const node of injector.controllers()) {
      const controller = await injector.resolve(node.token, node.owner);
      for (const { name, meta } of node.meta.methods) {
        const event = meta[ON] as string | undefined;
        if (!event) continue;
        events.#handlers.set(
          event,
          async (payload) => await controller[name](payload),
        );
      }
    }
    return events;
  }

  async emit(event: string, payload: unknown): Promise<void> {
    await this.#handlers.get(event)?.(payload);
  }

  close(): Promise<void> {
    return this.#injector.dispose();
  }
}
```

An application then looks like any CHO application:

```ts
@Controller({ dependencies: [Mailer] })
class UserEvents {
  constructor(readonly mailer: Mailer) {}

  @On("user.created")
  welcome(user: User) {
    return this.mailer.send(user.email, "Welcome!");
  }
}

@Module({ providers: [Mailer], controllers: [UserEvents] })
class App {}

const events = await Events.create(App);
await events.emit("user.created", { email: "ada@example.com" });
await events.close();
```

## Middlewares and error handlers

The core stores `@Middlewares` and `@Catch`, and hands them back as the
`middlewares` and `errorHandler` fields of the module, controller and method
metadata. Your module decides how and when to call them.

- **`compose(middlewares, endpoint, kind?)`** runs a chain of middlewares
  around an endpoint, in the onion model every built-in module uses. Each
  middleware is `(ctx, next)`; `kind` says what a result is and how to name it
  in error messages. `@chojs/web` uses it with a `Response`, `@chojs/command`
  with an exit code. Without a `kind` the chain has no result, as in
  `@chojs/message`: what a middleware returns is ignored
  ([The core package](/advanced/core#compose)).
- **`assert_handle`, `is_handle_class`, `resolve_handle`** accept middlewares
  and error handlers written as injectable classes with a `handle` method:
  checking them, and creating them with the injector, so every CHO module
  accepts the same values and reports the same mistakes.
- The core types, `ChoMiddleware` and `ChoErrorHandler`, are "any function or
  class". Declare the precise type of what you run, and export `Middlewares`
  and `Catch` typed with it.

By convention an error handler is called **error first**: `(error, ctx)`.

## Options of your own

A CHO module that adds options to `@Module` or `@Controller`, as `@chojs/web`
adds `route`, declares them with the type parameter of the core's decorators,
and exports decorators typed with it. `assert_known_options` gives the same
check at runtime:

```ts
import {
  assert_known_options,
  type ChoInjectableDecorator,
  Controller as CoreController,
  type ControllerOptions,
  type Dependency,
  type WithDependencies,
} from "@chojs/core/di";

type TopicOption = { topic?: string };

export function Controller<const D extends readonly Dependency[] = []>(
  options: WithDependencies<Partial<ControllerOptions>, D> & TopicOption = {},
): ChoInjectableDecorator<D> {
  assert_known_options("@Controller()", options, ["dependencies", "topic"]);
  return CoreController<TopicOption, D>(options);
}
```

The second type parameter, `D`, carries the dependencies as a tuple, so the
compile-time constructor check still applies through your decorator. Extra
options are stored as is and handed back as `options` in the metadata.

## What to re-export

An application should import from one package. Re-export what it needs from
the core, as the built-in modules do:

```ts
export {
  Injectable,
  type InjectionToken,
  type Provider,
  provider,
  token,
} from "@chojs/core/di";
```

## Helpers for decorators

| Export                                                                    | Use                                                                 |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `decorated_method`, `decorated_target`                                    | Find what a decorator was applied to, in both call shapes           |
| `read_metadata_object`, `write_metadata_object`, `add_to_metadata_object` | Read and write the CHO record of a class or a method                |
| `method_metadata`, `read_method_metadata`, `method_records`               | Where a method's record is stored, and reading a class's methods    |
| `set_injectable`, `set_module`, `set_controller`, `set_middlewares`, `set_error_handler` | What the core decorators do, for decorators that wrap them |
| `assert_known_options`                                                    | Reject unknown options of your `@Module` / `@Controller`            |
| `is_token`                                                                | Whether a value is a token                                          |
| `ChoMethodDecorator`, `ChoClassOrMethodDecorator`                         | Decorator types that accept both call shapes                        |

## Testing decorators

`@chojs/core/utils/test_utils` applies decorators as plain function calls, in
each of the two call shapes, whatever the runtime's own decorator
implementation is:

| Helper              | Does                                                        |
| ------------------- | ----------------------------------------------------------- |
| `legacy()`, `tc39()` | Apply a method decorator in each call shape                |
| `tc39_record()`     | Reads back the record a `tc39()` call wrote                 |
| `method_context()`  | Builds a TC39 method context                                |
| `capture()`         | Records what a function writes to `console.log` and `console.error` |
| `with_env()`        | Runs a function with environment variables set              |
