# `@chojs/message` API

Everything an application needs is exported by `@chojs/message`. The full,
generated API documentation is on [JSR](https://jsr.io/@chojs/message/doc).

## Entry points

| Entry point             | For                                                       |
| ----------------------- | --------------------------------------------------------- |
| `@chojs/message`        | Applications                                              |
| `@chojs/message/linker` | Adapters: `Linker`, `Linked`, `Route`, `Delivery`         |
| `@chojs/message/graph`  | Introspection: `AppRef`, `FeatureRef`, `ControllerRef`, `MethodRef`, `NodeRef`, `ErrorHandlerRef` |

## `ChoMessage`

```ts
class ChoMessage<T = unknown> {
  // with a linker: T is the object of that linker, such as the client of the broker
  static create<T>(app: Class, options: ChoMessageOptions<T>): Promise<ChoMessage<T>>;
  // without one: messages are delivered with handle()
  static create(app: Class, options?: ChoMessageOptions): Promise<ChoMessage<undefined>>;

  // on an injector that exists, such as web.injector
  static from<T>(injector: Injector, options: ChoMessageFromOptions<T>): Promise<ChoMessage<T>>;
  static from(injector: Injector, options?: ChoMessageFromOptions): Promise<ChoMessage<undefined>>;

  readonly routes: readonly Route[];
  readonly graph: AppRef;
  readonly linked: Linked<T>; // { instance: T, start, stop }
  readonly injector: Injector;

  start(): Promise<void>;
  handle(topic: string, message?: Delivery): Promise<void>;
  close(): Promise<void>;
}

type ChoMessageOptions<T = unknown> = {
  linker?: Linker<T>; // default: none
  prefix?: string;
  onError?: ChoMessageErrorHandler;
  overrides?: readonly Provider[];
};

type ChoMessageFromOptions<T = unknown> = Omit<ChoMessageOptions<T>, "overrides">;
```

| Method     | Resolves                             | Rejects                                                              |
| ---------- | ------------------------------------ | -------------------------------------------------------------------- |
| `create()` | To the application, not connected    | On any wiring, topic, middleware or error handler mistake            |
| `from()`   | To an application that owns nothing  | The same, and when it is not given an injector                       |
| `start()`  | Once subscribed                      | When the broker cannot be reached, without a linker, after `close()` |
| `handle()` | When the message is handled          | With the error when it failed; for an unknown topic; after `close()` |
| `close()`  | When stopped, and disposed if it owns the injector | When the linker cannot stop, or an instance cannot be disposed |

See [The application](/message/application) and
[With a web application](/message/with-web).

## Decorators

### Dependency injection

| Decorator                    | On      | Options                                                                    |
| ---------------------------- | ------- | -------------------------------------------------------------------------- |
| `@Injectable(dependencies?)` | A class | The dependencies, in constructor order                                     |
| `@Controller(options?)`      | A class | `topic`, `dependencies`                                                    |
| `@Module(options?)`          | A class | `topic`, `imports`, `providers`, `controllers`, `exports`, `dependencies`  |

### Handlers

| Decorator           | On       | Argument                                                  |
| ------------------- | -------- | --------------------------------------------------------- |
| `@Subscribe(topic)` | A method | The topic of the handler, relative to its controller; `""` for the controller's own |

### Middlewares and errors

| Decorator                      | On                                       | Argument                                                        |
| ------------------------------ | ---------------------------------------- | --------------------------------------------------------------- |
| `@Middlewares(...middlewares)` | A feature module, a controller, a handler | Functions `(ctx, next)`, or classes with `handle(ctx, next)`    |
| `@Catch(handler)`              | A feature module, a controller, a handler | A function `(error, ctx)`, or a class with `handle(error, ctx)` |

## Functions

| Function                                | Returns                                             |
| --------------------------------------- | --------------------------------------------------- |
| `token<T>(description)`                 | A unique `InjectionToken<T>`                        |
| `provider({ provide, deps?, factory })` | A provider object, with `factory` typed from `deps` |

## Types

### The context

```ts
interface ChoMessageContext {
  readonly topic: string; //   the full topic, global prefix included
  readonly value: Uint8Array; // empty when the message has none
  readonly key: string | undefined;
  readonly headers: Readonly<Record<string, string>>;
  text(): string; //           the value, decoded as UTF-8
  json<T = unknown>(): T; //   the value, parsed as JSON; undefined when empty
  readonly state: Map<PropertyKey, unknown>;
  readonly native: unknown; // the adapter's own message
}
```

### Handlers, middlewares, error handlers

| Type                       | Is                                                                |
| -------------------------- | ----------------------------------------------------------------- |
| `ChoMessageHandler`        | A handler method: `(ctx) => unknown`; what it returns is ignored  |
| `ChoMessageNext`           | `next`: runs the rest of the chain, `() => Promise<void>`         |
| `ChoMessageMiddlewareFn`   | `(ctx, next) => unknown`; what it returns is ignored              |
| `ChoMessageMiddleware`     | A middleware function, or a class with `handle(ctx, next)`        |
| `ChoMessageErrorHandlerFn` | `(error, ctx) =>` `true` to settle the message as handled         |
| `ChoMessageErrorHandler`   | An error handler function, or a class with `handle(error, ctx)`   |

### Adapters

```ts
type Delivery = {
  readonly value?: Uint8Array | string | null;
  readonly key?: string;
  readonly headers?: Readonly<Record<string, string>>;
};

type Route = {
  readonly topic: string; // "staging.orders.created"
  readonly name: string; //  "OrdersController.created"
  handle(delivery: Delivery, native?: unknown): Promise<void>;
};

interface Linked<T> {
  readonly instance: T;
  start(): Promise<void>;
  stop(): Promise<void>;
}

interface Linker<T> {
  link(routes: readonly Route[]): Linked<T>;
}
```

See [Broker adapters](/message/adapters).

| Package               | Exports                                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@chojs/vendor-kafka` | `KafkaLinker`, `KafkaLinked`, `KafkaLinkerOptions`, `KafkaClient`, `KafkaNative`, `KafkaMessage`, `DEAD_LETTER_HEADERS` ([Kafka adapter](/message/kafka)) |

### Others

`MessageModuleOptions`, `MessageControllerOptions`, `TopicOption`, and from
the core `ModuleOptions`, `ControllerOptions`, `InjectableOptions`,
`InjectionToken`, `Provider`, `WithDependencies`.

## Summary tables

### The outcome of a message

| Situation                                                    | Outcome |
| ------------------------------------------------------------ | ------- |
| The handler returns, or its promise resolves                 | Handled |
| A middleware returns without calling `next()`                | Handled |
| The handler or a middleware throws, with no error handler    | Failed  |
| The error handler returns `true`                             | Handled |
| The error handler returns anything else, or nothing          | Failed  |
| The error handler throws                                     | Failed, with the original error |
| A middleware catches the error of `next()` and returns       | Failed  |
| A middleware calls `next()` twice                            | Failed  |

### Topic levels

| Level         | Declared by                                   | Example      |
| ------------- | --------------------------------------------- | ------------ |
| Global prefix | The `prefix` option of `ChoMessage.create`    | `staging`    |
| Feature       | The `topic` option of the feature's `@Module` | `shop`       |
| Controller    | The `topic` option of `@Controller`           | `orders`     |
| Handler       | The argument of `@Subscribe`                  | `created`    |

Joined with `.`: `staging.shop.orders.created`. Segments are letters, digits,
`_` and `-`; there is no wildcard and no parameter ([Topics](/message/topics)).
