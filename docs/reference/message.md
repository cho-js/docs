# Message API reference

Use `@chojs/message` for consumers, `@chojs/message/linker` for broker contracts and `@chojs/message/graph` for compiled feature, controller and method nodes. [Generated signatures on JSR](https://jsr.io/@chojs/message/doc)

## Application

| API | Effect |
| --- | --- |
| `await ChoMessage.create(Root, options?)` | Initializes an owned injector and prepares the topic routes |
| `await ChoMessage.from(injector, options?)` | Prepares topic routes on a borrowed injector |
| `app.start()` | Connects and subscribes via a linker. Repeated calls share the first start |
| `app.handle(topic, delivery?)` | Delivers directly to one local route. Resolves on success or rejects on failure |
| `app.close()` | Stops intake, drains active deliveries and disposes an owned injector |
| `app.routes`, `app.graph` | Complete topic/name pairs and the corresponding declaration tree |
| `app.linked.instance`, `app.injector` | Adapter client and the application's injector |

Both factories accept `prefix`, `linker` and `onError`. Only `create` accepts `overrides`. Without a linker, `linked.instance` is `undefined` and only manual delivery is available. [Creating a consumer](/message/application)

## Subscription declarations

`@Subscribe(topic)` marks a method. Use `topic` on `@Controller` and `@Module` to group related subscriptions. `@Middlewares`, `@Catch`, `@Injectable`, `token<T>` and `provider` are available from the same package. [Topic syntax](/message/topics)

| Type | Contract |
| --- | --- |
| `Delivery` | Optional `value` (bytes, string or null), `key` and string `headers` |
| `ChoMessageContext` | `topic`, `key`, `headers`, byte `value`, `text()`, `json<T>()`, per-delivery `state` and `native` |
| `ChoMessageHandler` | Receives the context. A normal return settles the work |
| `ChoMessageNext` | Runs remaining middleware and handler, returning `Promise<void>` |
| `ChoMessageMiddlewareFn` / `ChoMessageMiddleware` | Function middleware or, for the latter type, a class with `handle` |
| `ChoMessageErrorHandlerFn` / `ChoMessageErrorHandler` | Receives `(error, ctx)`. Return exactly `true` to settle the failed delivery |

## Broker contract

A `Linker<T>` has `link(routes): Linked<T>`. A `Linked<T>` exposes `instance`, `start()` and `stop()`. A `Route` has `topic`, `name` and `handle(delivery, native?)`. The adapter awaits `handle` before acknowledging a record. For concrete retry and offset behavior, see [Kafka](/message/kafka).
