# Message API reference

Use `@chojs/message` for consumers, `@chojs/message/linker` for broker contracts and `@chojs/message/graph` for compiled feature, controller and method nodes. [All message exports and usage examples](/api/message)

## Application

| API | Effect |
| --- | --- |
| `await ChoMessage.create(Root, options?)` | Initializes an owned injector and prepares the topic routes |
| `await ChoMessage.from(injector, options?)` | Prepares topic routes on a borrowed injector |
| `app.start()` | Connects and subscribes via a linker. Repeated calls share the first start |
| `app.handle(topic, delivery?)` | Delivers directly to one local route. Returns `Promise<Reply \| undefined>` and rejects on failure |
| `app.close()` | Stops intake, drains active deliveries and disposes an owned injector |
| `app.routes`, `app.graph` | Complete topic/name pairs and the corresponding declaration tree |
| `app.linked.instance`, `app.injector` | Adapter client and the application's injector |

Both factories accept `prefix`, `linker` and `onError`. Only `create` accepts `overrides`. Without a linker, `linked.instance` is `undefined` and only manual delivery is available. [Creating a consumer](/message/application)

## Subscription declarations

`@Subscribe(topic)` marks a method. Use `topic` on [`@Controller`](/api/message#symbol-Controller) and [`@Module`](/api/message#symbol-Module) to group related subscriptions. [`@Middlewares`](/api/message#symbol-Middlewares), [`@Catch`](/api/message#symbol-Catch), [`@Injectable`](/api/core#symbol-Injectable), `token<T>` and [`provider`](/api/core#symbol-provider) are available from the same package. [Topic syntax](/message/topics)

| Type | Contract |
| --- | --- |
| `Delivery` | Optional `value` (bytes, string or null), `key` and string `headers` |
| `ChoMessageReply`, `ChoMessageReplyOptions` | Use `new ChoMessageReply(value?, { headers }?)` in a subscription or error handler to attach string headers. Import from `@chojs/message` |
| `Reply` | Encoded result with `readonly value: Uint8Array` and optional `headers: Readonly<Record<string, string>>`. Exported by both message and linker entry points |
| `ChoMessageContext` | `topic`, `key`, `headers`, byte `value`, `text()`, `json<T>()`, per-delivery `state` and `native` |
| `ChoMessageHandler` | Receives the context. Return nothing to settle without replying, or a value to encode as a reply |
| `ChoMessageNext` | Runs remaining middleware and handler, returning `Promise<void>` |
| `ChoMessageMiddlewareFn` / `ChoMessageMiddleware` | Function middleware or, for the latter type, a class with `handle` |
| `ChoMessageErrorHandlerFn` / `ChoMessageErrorHandler` | Receives `(error, ctx)`. Return `true` to settle silently, `false` or `undefined` to preserve failure, or another encodable value for a fallback reply |

## Arguments, contracts and clients

| Message API | Purpose |
| --- | --- |
| `@Args(...readers)`, `Value`, `Key`, `Header` | Supply ordered method arguments followed by the optional context. [Argument signatures and examples](/message/arguments) |
| `validate({ onInvalid? })` | Run each built-in reader's validator before the subscriber and choose what happens to invalid input |
| `contract({ topic, request?, reply? })`, `@Subscribe(contract)` | Declare a shared JSON contract and bind the handler to its request and reply types |
| `new ChoMessageClient(sender, { prefix?, timeout? })` | Publish an event or request a typed reply with optional key, headers and per-request timeout |
| `localSender(app)` | Send through the local route pipeline for an in-process client test |
| `ReplyError`, `isReplyError(error, code?)` | Report or match a public service failure. [Contracts and client errors](/message/contracts) |

## Linkers and senders

A `Linker<T>` has `link(routes): Linked<T>`. A `Linked<T>` exposes `instance`, `start()` and `stop()`. A `Route` has `topic`, `name` and `handle(delivery, native?)`. Its `handle` method returns the same `Promise<Reply | undefined>` as manual delivery. The adapter decides how to forward a reply and when to acknowledge a record. See [reply formats](/message/replies) and [framework error codes](/reference/errors). For concrete retry and offset behavior, see [Kafka](/message/kafka).

For request/reply over Core NATS, import `NatsLinker` and `ERROR_HEADERS` from `@chojs/vendor-nats`. After `await app.start()`, `app.linked.instance` is the active connection. [NATS setup and delivery behavior](/message/nats)

[`Sender`](/api/message#symbol-Sender) exposes `publish(topic, delivery)` and optional `request(topic, delivery, options?)` for typed clients. NATS implements both and Kafka implements publishing. With the NATS linker's `jetstream` option, matched event routes use durable consumers. [JetStream setup and acknowledgment](/message/jetstream)
