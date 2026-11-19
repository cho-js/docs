---
outline: 2
---

# @chojs/message

Use manual delivery to develop a subscription locally. Introduce a shared contract and sender when a second service needs to call it. [Publish, subscribe and request a reply](/message/contracts) · [Browse all packages](/api/)

## AppRef {#symbol-AppRef}

The root of the message graph: the application.

```ts
export class AppRef {
    readonly topic: string;
    readonly errorHandler: ErrorHandlerRef;
    readonly features: FeatureRef[];
    constructor(topic: string, errorHandler?: ErrorHandlerRef);
}
```

**`topic`** The global topic prefix; `""` when there is none.

**`errorHandler`** The error handler of the application (the `onError` option of
`ChoMessage.create`), or `null` when it has none. It handles the errors
of the handlers that no `@Catch` handler covers.

**`features`** The features of the application.

**`constructor`** Create the application node, with no features yet.

### Usage {#AppRef-usage}

```ts
const graph: AppRef = app.graph;
console.log(graph.features.length);
```

## Args {#symbol-Args}

Declare the arguments of a handler.

Standard decorators cannot decorate a parameter, so the arguments are
listed on the method, in the order of its parameters. The handler is then
called with the value of each argument, and with the context last:
`handler(...values, ctx)`. A handler without `@Args` receives the context
alone.

An argument is made by `Value`, `Key` or `Header`, or is any function
`(ctx) => value`. The parameters of the method are checked against the
arguments at compile time.

- The decorator goes above or below `@Subscribe`.
- A method has one `@Args`. An override that declares it replaces the
  arguments it inherits; one that does not keeps them.
- The arguments are evaluated in order, after the middlewares of the route
  and just before the handler.
- A validator of an argument is run when `validate()` is among the
  middlewares of the handler, of its controller or of its feature module.

```ts
export function Args<const A extends readonly ChoMessageArg[]>(...args: A): ChoMessageArgsDecorator<ChoMessageArgValues<A>>;
```

### Usage {#Args-usage}

```ts
@Middlewares(validate())
@Controller({ topic: "orders" })
class OrdersController {
  @Subscribe("created")
  @Args(Value(Order), Header("tenant"))
  created(order: Order, tenant: string | undefined, ctx: ChoMessageContext) {
    return this.store.of(tenant).add(order);
  }
}
```

## Catch {#symbol-Catch}

Declare the error handler of a feature module, a controller or a handler.

An error thrown by a handler or a middleware goes to the nearest one: the
handler's, else the controller's, else the feature's. It settles the
message as handled by returning `true`; when it returns anything else, or
nothing, the message failed. A class or method has at most one `@Catch`.

```ts
export function Catch(handler: ChoMessageErrorHandler): ChoClassOrMethodDecorator;
```

### Usage {#Catch-usage}

```ts
// a message that is not JSON is dropped; any other error fails it
@Catch((error) => error instanceof SyntaxError)
@Controller({ topic: "orders" })
class OrdersController {}
```

## ChoMessage {#symbol-ChoMessage}

A message application, built from a root module.

Every module that declares controllers is a feature. The topic of a handler
joins up to four levels with `.`, each optional: the global `prefix`, the
feature module's `topic`, the controller's `topic` and the topic given to
`@Subscribe`. A handler handles one topic, and a topic has one handler.

Handlers, middlewares and error handlers receive a `ChoMessageContext`,
whatever the broker. A message is handled when its handler returns; it
failed when its handler throws and no error handler settles it.

```ts
export class ChoMessage<T = unknown> {

    readonly linked: Linked<T>;
    readonly graph: AppRef;
    readonly routes: readonly Route[];
    readonly injector: Injector;
    static create<T>(app: Ctr, options: ChoMessageOptions<T> & {
        linker: Linker<T>;
    }): Promise<ChoMessage<T>>;
    static create(app: Ctr, options?: Omit<ChoMessageOptions<undefined>, "linker">): Promise<ChoMessage<undefined>>;
    static from<T>(injector: Injector, options: ChoMessageFromOptions<T> & {
        linker: Linker<T>;
    }): Promise<ChoMessage<T>>;
    static from(injector: Injector, options?: Omit<ChoMessageFromOptions<undefined>, "linker">): Promise<ChoMessage<undefined>>;
    constructor(linker: Linker<T> | undefined, graph: AppRef, routes: readonly Route[], injector: Injector, owner?: boolean);
    start(): Promise<void>;
    handle(topic: string, message?: Delivery): Promise<Reply | undefined>;
    close(): Promise<void>;
    [Symbol.asyncDispose](): Promise<void>;
}
```

**`create`** Create a message application from a root module, with an injector of its
own.

It builds the injector, creates every instance of the application,
builds and checks the topics, and gives them to the linker. It does not
connect to the broker: `ChoMessage.start` does.

**`create`** Create a message application without a linker: it has no broker, and its
messages are delivered by hand, with `ChoMessage.handle`. It is how
an application is tested.

**`from`** Create a message application on an injector that exists, such as the one
of a web application (`web.injector`): the two applications then share
one set of instances.

It finds the controllers that have `@Subscribe` handlers, resolves them
(nothing that exists is created again), and builds and checks the topics,
as `ChoMessage.create` does.

The application does not own the injector: its `close()` stops it, and
disposes nothing. Whoever created the injector disposes the instances,
after this application is closed.

**`from`** Create a message application without a linker on an injector that
exists: its messages are delivered by hand, with
`ChoMessage.handle`.

**`start`** Connect to the broker, and subscribe to every topic of the application.
Messages can arrive before it resolves.

**`handle`** Give one message to the handler of a topic, without a broker: the
counterpart of calling `app.handler(new Request(…))` in `@chojs/web`. It
needs no linker, and no `start()`.

**`close`** Stop the application: stop receiving messages, wait for the ones that are
being handled, and disconnect. An application made by
`ChoMessage.create` then disposes its instances, in reverse
creation order; one made by `ChoMessage.from` disposes nothing.

**`[Symbol.asyncDispose]`** Stop the application: the same as `ChoMessage.close`, for
`await using`.

**`linked`** The linked application: the adapter's own object (`linked.instance`), and
what connects it to the broker. Without a linker, its `instance` is
`undefined`.

**`graph`** The topics of the application as a tree: features, controllers and
handlers, with their instances, middlewares and error handlers.

**`routes`** Every topic of the application, in declaration order: its `topic`, the
`name` of its handler, and `handle`, which handles one message.

**`injector`** The injector of the application: it holds its instances. Give it to the
`from` of another CHO module to build a second application on the same
instances. An application made by `ChoMessage.create` owns it, and
disposes it in `ChoMessage.close`; one made by
`ChoMessage.from` has the injector it was given.

**`constructor`** Create a message application from its parts. Applications are made with
`ChoMessage.create` or `ChoMessage.from`.

### Usage {#ChoMessage-usage}

```ts
import {
  ChoMessage,
  type ChoMessageContext,
  Controller,
  Module,
  Subscribe,
} from "@chojs/message";
import { KafkaLinker } from "@chojs/vendor-kafka";

@Controller({ topic: "orders" })
class OrdersController {
  @Subscribe("created") // the topic orders.created
  created(ctx: ChoMessageContext) {
    console.log(ctx.key, ctx.json());
  }
}

@Module({ controllers: [OrdersController] })
class App {}

const app = await ChoMessage.create(App, {
  linker: new KafkaLinker({ brokers: ["localhost:9092"], groupId: "shop" }),
});
await app.start();
```
```ts
const app = await ChoMessage.create(AppModule, { linker });
await app.start();
```
```ts
const app = await ChoMessage.create(AppModule);
await app.handle("orders.created", { value: '{"id":"42"}' });
```
```ts
const web = await ChoWeb.create(AppModule);
const messages = await ChoMessage.from(web.injector, { linker });

await messages.start();
// ... later, in this order:
await messages.close(); // stops; disposes nothing
await web.close(); //      disposes the instances, once
```
```ts
await app.handle("orders.created", {
  value: JSON.stringify({ id: "42" }),
  key: "42",
  headers: { "message-id": "abc" },
});
```

The reply of a handler
```ts
const reply = await app.handle("orders.price", { value: "42" });
JSON.parse(new TextDecoder().decode(reply?.value)); // { total: 12 }
```
```ts
process.on("SIGTERM", () => app.close());
```

On a host and TypeScript toolchain with explicit resource management, scope the application to the block that owns it. Leaving the block awaits its async disposer. [Application lifecycle](/message/application)

```ts
{
  await using messages = await ChoMessage.create(Library);
  await messages.handle("books.received", { value: '{"isbn":"42"}' });
}
```

## ChoMessageArg {#symbol-ChoMessageArg}

An argument of a handler, as given to `@Args`: a function that takes the
context of the message and gives the value, now or as a promise.

`Value`, `Key` and `Header` make one, with its `info`. Any other function of
that shape is an argument too.

```ts
export type ChoMessageArg<T = unknown> = ((ctx: ChoMessageContext) => T | Promise<T>) & {
    readonly info?: ChoMessageArgInfo;
};
```

### Usage {#ChoMessageArg-usage}

```ts
const Tenant: ChoMessageArg<string> = (ctx) => ctx.state.get("tenant") as string;
```

## ChoMessageArgInfo {#symbol-ChoMessageArgInfo}

What is known about an argument made by `Value`, `Key` or `Header`: enough
to describe it in the documentation of an application.

```ts
export type ChoMessageArgInfo = {
    readonly source: ChoMessageArgSource;
    readonly key?: string;
    readonly validator?: ChoValidator;
};
```

**`source`** Where the value is read from.

**`key`** The key of the source, when the argument is one key of it.

**`validator`** The validator of the argument, when it has one: its schema.

### Usage {#ChoMessageArgInfo-usage}

```ts
const info: ChoMessageArgInfo = Object.freeze({
    source,
    ...(key === undefined ? {} : { key }),
    ...(validator === undefined ? {} : { validator }),
  });
```

[Usage in message/args.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/args.ts#L190)

## ChoMessageArgSource {#symbol-ChoMessageArgSource}

Where an argument made by `Value`, `Key` or `Header` reads from.

```ts
export type ChoMessageArgSource = "value" | "key" | "header";
```

### Usage {#ChoMessageArgSource-usage}

```ts
const fields: ChoMessageArgSource[] = ["value", "key", "header"];
```

## ChoMessageArgValues {#symbol-ChoMessageArgValues}

The values of a list of arguments: what a handler receives for them, in
order.

```ts
export type ChoMessageArgValues<A extends readonly ChoMessageArg[]> = {
    -readonly [K in keyof A]: Awaited<ReturnType<A[K]>>;
};
```

### Usage {#ChoMessageArgValues-usage}

```ts
return decorate as ChoMessageArgsDecorator<ChoMessageArgValues<A>>;
```

[Usage in message/decorators.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/decorators.ts#L448)

## ChoMessageArgsDecorator {#symbol-ChoMessageArgsDecorator}

The decorator `@Args` returns. It only accepts a method whose parameters
take the values of the arguments, in order, and then the context: a handler
that expects something else does not compile.

It has both decorator call shapes: standard (TC39) `(method, context)`, and
legacy / Bun `(prototype, name, descriptor)`.

```ts
export type ChoMessageArgsDecorator<P extends unknown[]> = {
    <M extends (this: any, ...args: [
        ...P,
        ChoMessageContext
    ]) => unknown>(method: M, context: ClassMethodDecoratorContext): void;
    <M extends (this: any, ...args: [
        ...P,
        ChoMessageContext
    ]) => unknown>(target: object, name: string | symbol, descriptor: TypedPropertyDescriptor<M>): void;
};
```

### Usage {#ChoMessageArgsDecorator-usage}

```ts
return decorate as ChoMessageArgsDecorator<ChoMessageArgValues<A>>;
```

[Usage in message/decorators.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/decorators.ts#L448)

## ChoMessageClient {#symbol-ChoMessageClient}

Sends the messages of contracts.

A contract speaks JSON: the value is sent as JSON, and the reply is read
as JSON. The types of both come from the contract.

```ts
export class ChoMessageClient {

    constructor(sender: Sender, options?: ChoMessageClientOptions);
    publish<Request, Sent = Request>(contract: Contract<Request, any, Sent, any>, ...sent: ChoMessageSent<Sent, ChoMessageSendOptions>): Promise<void>;
    request<Request, Reply, Sent = Request>(contract: Contract<Request, Reply, Sent, any>, ...sent: ChoMessageSent<Sent, ChoMessageRequestOptions>): Promise<Reply>;
}
```

**`publish`** Send a message that asks for no reply.

**`request`** Send a message that asks for a reply, and wait for it.

**`constructor`** Make a client. Nothing is sent, or connected, yet.

### Usage {#ChoMessageClient-usage}

```ts
const client = new ChoMessageClient(linker.sender);

await client.publish(OrderCreated, { id: 7, total: 12 });
const { price } = await client.request(GetPrice, { id: 7 });
```

Provided to an application
```ts
const linker = new NatsLinker({ connect, queue: "shop" });

@Module({
  providers: [
    provider({
      provide: ChoMessageClient,
      factory: () => new ChoMessageClient(linker.sender),
    }),
  ],
  controllers: [OrdersController],
})
class AppModule {}

const app = await ChoMessage.create(AppModule, { linker });
```

## ChoMessageClientOptions {#symbol-ChoMessageClientOptions}

The options of `ChoMessageClient`.

```ts
export type ChoMessageClientOptions = {
    readonly prefix?: string | undefined;
    readonly timeout?: number | undefined;
};
```

**`prefix`** The prefix of the application that listens: the `prefix` option of its
`ChoMessage.create` (`"staging"`). It is put before the topic of each
contract. Default: none.

**`timeout`** The milliseconds a request waits for its answer, when the request does
not say. Default: the sender's.

### Usage {#ChoMessageClientOptions-usage}

```ts
const options: ChoMessageClientOptions = { prefix: "staging", timeout: 2000 };
const client = new ChoMessageClient(linker.sender, options);
```

## ChoMessageContext {#symbol-ChoMessageContext}

The context of one message.

```ts
export interface ChoMessageContext {
    readonly topic: string;
    readonly value: Uint8Array;
    readonly key: string | undefined;
    readonly headers: Readonly<Record<string, string>>;
    text(): string;
    json<T = unknown>(): T;
    readonly state: Map<PropertyKey, unknown>;
    readonly native: unknown;
}
```

**`text`** The value, decoded as UTF-8.

**`json`** The value, parsed as JSON.

**`topic`** The full topic of the message, global prefix included.

**`value`** The value of the message, as bytes; empty when it has none.

**`key`** The key of the message; `undefined` when it has none.

**`headers`** The headers of the message; an empty object when it has none.

**`state`** Values shared while the message is handled: a middleware sets one for
the middlewares and the handler after it.

**`native`** The adapter's own message (its partition and offset, say), or
`undefined` when the adapter has none. Code that uses it only runs on
that adapter.

### Usage {#ChoMessageContext-usage}

```ts
@Controller({ topic: "orders" })
class OrdersController {
  @Subscribe("created")
  created(ctx: ChoMessageContext) {
    const order = ctx.json<{ id: string }>();
    console.log(ctx.topic, ctx.key, order.id);
  }
}
```

## ChoMessageContractDecorator {#symbol-ChoMessageContractDecorator}

The decorator `@Subscribe(contract)` returns. It only accepts a method that
takes the request of the contract, then the context, and returns the input to the
reply validator. A handler with incompatible types does not compile.

It has both decorator call shapes: standard (TC39) `(method, context)`, and
legacy / Bun `(prototype, name, descriptor)`.

```ts
export type ChoMessageContractDecorator<Request, Reply> = {
    <M extends (this: any, request: Request, ctx: ChoMessageContext) => ChoMessageContractResult<Reply> | Promise<ChoMessageContractResult<Reply>>>(method: M, context: ClassMethodDecoratorContext): void;
    <M extends (this: any, request: Request, ctx: ChoMessageContext) => ChoMessageContractResult<Reply> | Promise<ChoMessageContractResult<Reply>>>(target: object, name: string | symbol, descriptor: TypedPropertyDescriptor<M>): void;
};
```

### Usage {#ChoMessageContractDecorator-usage}

```ts
export function Subscribe<Request, Reply, Sent, Returned>(
  contract: Contract<Request, Reply, Sent, Returned>,
): ChoMessageContractDecorator<Request, Returned>;
```

[Usage in message/decorators.ts](https://github.com/cho-js/cho/blob/913e9647671af610473c7cd6f69e37a685749158/message/decorators.ts#L223)

## ChoMessageContractResult {#symbol-ChoMessageContractResult}

What a handler of a contract returns: the reply, or a `ChoMessageReply`
for a reply with headers. A contract with no reply lets it return nothing.

```ts
export type ChoMessageContractResult<Reply> = Reply | ChoMessageReply | (undefined extends Reply ? void : never);
```

### Usage {#ChoMessageContractResult-usage}

```ts
export type ChoMessageContractDecorator<Request, Reply> = {
  <
    M extends (
      // deno-lint-ignore no-explicit-any
      this: any,
      request: Request,
      ctx: ChoMessageContext,
    ) =>
      | ChoMessageContractResult<Reply>
      | Promise<ChoMessageContractResult<Reply>>,
  >(
    method: M,
    context: ClassMethodDecoratorContext,
  ): void;
  <
    M extends (
      // deno-lint-ignore no-explicit-any
      this: any,
      request: Request,
      ctx: ChoMessageContext,
    ) =>
      | ChoMessageContractResult<Reply>
      | Promise<ChoMessageContractResult<Reply>>,
  >(
    target: object,
    name: string | symbol,
    descriptor: TypedPropertyDescriptor<M>,
  ): void;
};
```

[Usage in message/contract.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/contract.ts#L67)

## ChoMessageErrorCode {#symbol-ChoMessageErrorCode}

The codes of the errors of `@chojs/message`. Each is described in `specs.md`, section 9.

A mistake the core finds for the package has a code of the core
(`ChoCoreErrorCode` of `@chojs/core`): an unknown option is
`CHO_CORE_UNKNOWN_OPTION`.

```ts
export type ChoMessageErrorCode = "CHO_MESSAGE_CLOSED" | "CHO_MESSAGE_CREATE_FAILED" | "CHO_MESSAGE_DUPLICATE_DECORATOR" | "CHO_MESSAGE_DUPLICATE_TOPIC" | "CHO_MESSAGE_INVALID_ARGUMENT" | "CHO_MESSAGE_INVALID_CLIENT" | "CHO_MESSAGE_INVALID_CONTRACT" | "CHO_MESSAGE_INVALID_INJECTOR" | "CHO_MESSAGE_INVALID_MESSAGE" | "CHO_MESSAGE_INVALID_REPLY" | "CHO_MESSAGE_INVALID_REPLY_ERROR" | "CHO_MESSAGE_INVALID_TARGET" | "CHO_MESSAGE_INVALID_TOPIC" | "CHO_MESSAGE_INVALID_VALUE" | "CHO_MESSAGE_NO_LINKER" | "CHO_MESSAGE_NO_REPLIES" | "CHO_MESSAGE_NO_RESPONDERS" | "CHO_MESSAGE_REQUEST_TIMEOUT" | "CHO_MESSAGE_UNEXPECTED_REPLY" | "CHO_MESSAGE_UNKNOWN_TOPIC";
```

### Usage {#ChoMessageErrorCode-usage}

```ts
const CODES: Record<ChoMessageErrorCode, true> = {
  CHO_MESSAGE_CLOSED: true,
  CHO_MESSAGE_CREATE_FAILED: true,
  CHO_MESSAGE_DUPLICATE_DECORATOR: true,
  CHO_MESSAGE_DUPLICATE_TOPIC: true,
  CHO_MESSAGE_INVALID_ARGUMENT: true,
  CHO_MESSAGE_INVALID_CLIENT: true,
  CHO_MESSAGE_INVALID_CONTRACT: true,
  CHO_MESSAGE_INVALID_INJECTOR: true,
  CHO_MESSAGE_INVALID_MESSAGE: true,
  CHO_MESSAGE_INVALID_REPLY: true,
  CHO_MESSAGE_INVALID_REPLY_ERROR: true,
  CHO_MESSAGE_INVALID_TARGET: true,
  CHO_MESSAGE_INVALID_TOPIC: true,
  CHO_MESSAGE_INVALID_VALUE: true,
  CHO_MESSAGE_NO_LINKER: true,
  CHO_MESSAGE_NO_REPLIES: true,
  CHO_MESSAGE_NO_RESPONDERS: true,
  CHO_MESSAGE_REQUEST_TIMEOUT: true,
  CHO_MESSAGE_UNEXPECTED_REPLY: true,
  CHO_MESSAGE_UNKNOWN_TOPIC: true,
};
```

[Usage in message/errors_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/errors_test.ts#L8)

## ChoMessageErrorHandler {#symbol-ChoMessageErrorHandler}

An error handler, as given to `@Catch`: a function, or a class with a
`handle(error, ctx)` method, created by the injector in the scope of the
feature module.

```ts
export type ChoMessageErrorHandler = ChoMessageErrorHandlerFn | Ctr<{
    handle: ChoMessageErrorHandlerFn;
}>;
```

### Usage {#ChoMessageErrorHandler-usage}

```ts
export function Catch(
  handler: ChoMessageErrorHandler,
): ChoClassOrMethodDecorator {
  return (target, context, descriptor) => {
    const meta = decorated_target("@Catch()", target, context, descriptor);
    set_error_handler(meta, handler);
  };
}
```

[Usage in message/decorators.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/decorators.ts#L358)

## ChoMessageErrorHandlerFn {#symbol-ChoMessageErrorHandlerFn}

An error handler function. What it returns settles the message:

- nothing, or `false`: the message failed. An error handler that only logs
  does not turn a failed message into a handled one;
- `true`: the message is handled, and has no reply;
- any other value: the message is handled, and the value is its reply,
  converted as what a handler returns is.

```ts
export type ChoMessageErrorHandlerFn = (error: unknown, ctx: ChoMessageContext) => unknown;
```

### Usage {#ChoMessageErrorHandlerFn-usage}

```ts
// a value that is not JSON never will be: drop the message
const on_error: ChoMessageErrorHandlerFn = (error, ctx) => {
  console.error(ctx.topic, error);
  return error instanceof SyntaxError;
};

// tells who asked what went wrong
const answer: ChoMessageErrorHandlerFn = (error) => ({
  error: error instanceof NotFound ? "not found" : "failed",
});
```

## ChoMessageFromOptions {#symbol-ChoMessageFromOptions}

Options of `ChoMessage.from`: those of `ChoMessage.create`,
without `overrides`, which belong to whoever creates the injector.

```ts
export type ChoMessageFromOptions<T = unknown> = Omit<ChoMessageOptions<T>, "overrides">;
```

### Usage {#ChoMessageFromOptions-usage}

```ts
const options = { prefix: "staging" } satisfies ChoMessageFromOptions;
const messages = await ChoMessage.from(web.injector, options);
```

## ChoMessageHandler {#symbol-ChoMessageHandler}

A message handler: a controller method marked with `@Subscribe`.

When it returns (or resolves), the message is handled. What it returns is
the reply of the message: bytes and strings as they are, anything else as
JSON, a `ChoMessageReply` for a reply with headers, and nothing for no
reply. It is sent when the message asks for one,
by an adapter whose broker has replies; otherwise it is dropped. When it
throws (or rejects), the error goes to the nearest error handler.

A handler that declares arguments with `@Args` is called with their values,
and then with the context.

```ts
export type ChoMessageHandler = (ctx: ChoMessageContext) => unknown;
```

### Usage {#ChoMessageHandler-usage}

```ts
const logDelivery: ChoMessageHandler = (ctx) => {
  console.log(ctx.topic, ctx.key, ctx.text());
};
```

## ChoMessageInvalid {#symbol-ChoMessageInvalid}

What failed the validation of a message: given to `onInvalid`.

```ts
export type ChoMessageInvalid = {
    readonly source: ChoMessageArgSource;
    readonly key?: string;
    readonly issues: readonly ChoIssue[];
    readonly error?: unknown;
};
```

**`source`** The source of the argument that is not valid.

**`key`** Its key, when the argument is one key of the source.

**`error`** Optional exception from parsing a value or decoding its payload
as JSON.

### Usage {#ChoMessageInvalid-usage}

```ts
function logInvalid(field: ChoMessageInvalid) {
  console.warn(field.source, field.key, field.issues);
}
```

## ChoMessageMiddleware {#symbol-ChoMessageMiddleware}

A middleware, as given to `@Middlewares`: a function, or a class with a
`handle(ctx, next)` method, created by the injector in the scope of the
feature module.

```ts
export type ChoMessageMiddleware = ChoMessageMiddlewareFn | Ctr<{
    handle: ChoMessageMiddlewareFn;
}>;
```

### Usage {#ChoMessageMiddleware-usage}

```ts
const trace: ChoMessageMiddleware = async (ctx, next) => {
  console.log(ctx.topic);
  await next();
};
```

## ChoMessageMiddlewareFn {#symbol-ChoMessageMiddlewareFn}

A middleware function. It wraps the rest of the chain (the next
middlewares, then the handler):

- `next()` runs the rest of the chain;
- returning without calling `next()` skips the handler: the message is
  handled, and has no reply;
- what it returns is ignored.

A middleware cannot hide the failure of the rest of the chain: when
`next()` rejects, the message failed, even when the middleware catches the
error. Settling a failed message as handled is what an error handler does.

```ts
export type ChoMessageMiddlewareFn = (ctx: ChoMessageContext, next: ChoMessageNext) => unknown;
```

### Usage {#ChoMessageMiddlewareFn-usage}

```ts
const timing: ChoMessageMiddlewareFn = async (ctx, next) => {
  const start = Date.now();
  await next();
  console.log(ctx.topic, `${Date.now() - start}ms`);
};

// drops the messages that are not for this application
const mine: ChoMessageMiddlewareFn = (ctx, next) =>
  ctx.headers["tenant"] === "acme" ? next() : undefined;
```

## ChoMessageNext {#symbol-ChoMessageNext}

Runs the rest of the chain. It resolves when the rest is done, and rejects
with its error. It does not give the reply: the reply is the handler's, and
a middleware neither reads nor replaces it.

```ts
export type ChoMessageNext = () => Promise<void>;
```

### Usage {#ChoMessageNext-usage}

```ts
async function traceDelivery(next: ChoMessageNext) {
  const start = performance.now();
  await next();
  console.log("Handled in", performance.now() - start);
}
```

## ChoMessageOptions {#symbol-ChoMessageOptions}

Options of `ChoMessage.create`. Every option is optional.

```ts
export type ChoMessageOptions<T = unknown> = {
    linker?: Linker<T>;
    prefix?: string;
    onError?: ChoMessageErrorHandler;
    overrides?: readonly Provider[];
};
```

**`linker`** The linker that connects the topics to a broker, such as `KafkaLinker`
from `@chojs/vendor-kafka`.

Default: none. The application then has no broker: `start()` rejects,
and messages are delivered by hand, with `handle()`.

**`prefix`** The global topic prefix, added before every feature topic, such as the
name of an environment (`"staging"`). Default: `""`, no prefix.

**`onError`** The error handler of the application: it handles the errors of every
handler that no `@Catch` handler covers (the handler's, the controller's
and the feature's come first). Like `@Catch`, it takes a function
`(error, ctx)`, or a class with a `handle(error, ctx)` method, created by
the injector in the scope of the root module. It settles the message as
handled by returning `true`; when it returns anything else, or nothing
(it only logs, say), the message failed. Default: none.

**`overrides`** Providers that replace the declared providers of the same token, for
tests (see `InjectorOptions.overrides` of `@chojs/core`). Default: none.

### Usage {#ChoMessageOptions-usage}

```ts
import { KafkaLinker } from "@chojs/vendor-kafka";

const app = await ChoMessage.create(AppModule, {
  linker: new KafkaLinker({ brokers: ["localhost:9092"], groupId: "shop" }),
  prefix: "staging", // every topic starts with staging.
});
```

## ChoMessageReply {#symbol-ChoMessageReply}

A reply with headers. A handler, or an error handler, returns one when the
reply needs more than its value: what a `Response` with headers is for a
handler of `@chojs/web`.

The value becomes the bytes of the reply as a returned value does: bytes
and strings as they are, anything else as JSON. With no value, the reply
is empty: it is still a reply.

Headers are sent by an adapter whose broker has replies with headers, such
as `@chojs/vendor-nats`.

```ts
export class ChoMessageReply {
    readonly value: unknown;
    readonly headers: Readonly<Record<string, string>>;
    constructor(value?: unknown, options?: ChoMessageReplyOptions);
}
```

**`value`** The value of the reply, as the handler gave it.

**`headers`** The headers of the reply. Empty when it has none.

**`constructor`** Make a reply.

### Usage {#ChoMessageReply-usage}

```ts
@Subscribe("price")
price(ctx: ChoMessageContext) {
  const { id } = ctx.json<{ id: string }>();
  return new ChoMessageReply({ id, total: 42 }, {
    headers: { "content-type": "application/json", "cache": "60" },
  });
}
```

## ChoMessageReplyOptions {#symbol-ChoMessageReplyOptions}

The options of `ChoMessageReply`.

```ts
export type ChoMessageReplyOptions = {
    readonly headers?: Readonly<Record<string, string>> | undefined;
};
```

**`headers`** The headers of the reply: names and values, as strings.

### Usage {#ChoMessageReplyOptions-usage}

```ts
const options: ChoMessageReplyOptions = { headers: { "X-Branch": "central" } };
return new ChoMessageReply("B2", options);
```

## ChoMessageRequestOptions {#symbol-ChoMessageRequestOptions}

The options of a request.

```ts
export type ChoMessageRequestOptions = ChoMessageSendOptions & RequestOptions;
```

### Usage {#ChoMessageRequestOptions-usage}

```ts
await new ChoMessageClient(sender, { timeout: 500 }).request(
      Ping,
      undefined,
      { timeout: 50, headers: { a: "1" } },
    );
```

[Usage in message/client_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/client_test.ts#L235)

## ChoMessageSendOptions {#symbol-ChoMessageSendOptions}

The options of a message that is sent.

```ts
export type ChoMessageSendOptions = {
    readonly key?: string | undefined;
    readonly headers?: Readonly<Record<string, string>> | undefined;
};
```

**`key`** The key of the message, on a broker that has keys.

**`headers`** The headers of the message.

### Usage {#ChoMessageSendOptions-usage}

```ts
await client.publish(Created, { id: 7 }, {
      key: "k7",
      headers: { tenant: "acme" },
    });
```

[Usage in message/client_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/client_test.ts#L154)

## ChoMessageSent {#symbol-ChoMessageSent}

The value to send for a contract, and the options: the value can be left
out when the contract lets it be `undefined`.

```ts
export type ChoMessageSent<Sent, Options> = undefined extends Sent ? [
    value?: Sent,
    options?: Options
] : [
    value: Sent,
    options?: Options
];
```

### Usage {#ChoMessageSent-usage}

```ts
const delivery: ChoMessageSent<string, ChoMessageSendOptions> = ["41", { key: "book" }];
await client.publish(NextId, ...delivery);
```

See the [transformed contract example](/message/contracts#use-different-types-on-the-wire-and-in-the-handler) for the definition of `NextId`.

## ChoMessageValidateOptions {#symbol-ChoMessageValidateOptions}

The options of `validate()`.

```ts
export type ChoMessageValidateOptions = {
    readonly onInvalid?: ((invalid: ChoMessageInvalid, ctx: ChoMessageContext) => unknown) | undefined;
};
```

**`onInvalid`** Decide what a message that is not valid leads to, as an error handler
does:

- nothing, or `false`: the message failed, with a `ChoError` of the code
  `CHO_MESSAGE_INVALID_MESSAGE`. This is the default;
- `true`: the message is handled, and has no reply. It is skipped;
- any other value: the message is handled, and the value is its reply.

### Usage {#ChoMessageValidateOptions-usage}

```ts
const says = (name: string) =>
      validate({
        onInvalid: () => {
          calls.push(name);
          return true;
        },
      });
```

[Usage in message/handler-args_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/handler-args_test.ts#L562)

## Contract {#symbol-Contract}

A contract: the topic of a message, what it holds, and what is replied.

```ts
export type Contract<Request = unknown, Reply = undefined, Sent = Request, Returned = Reply> = {
    readonly topic: string;
    readonly request?: ChoValidator<Request> | undefined;
    readonly reply?: ChoValidator<Reply> | undefined;
};
```

**`topic`** The whole topic of the message, without the prefix of an application:
`"shop.orders.price"`.

**`request`** The validator of the value of the message, when it has one.

**`reply`** The validator of the reply, when it has one.

### Usage {#Contract-usage}

```ts
const GetPrice = contract({
  topic: "shop.prices.get",
  request: IsOrder,
  reply: IsPrice,
});
```

[Usage in examples/nats-reply.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/nats-reply.ts#L71)

## Controller {#symbol-Controller}

Mark a class as a controller (see `@Controller` of `@chojs/core`): its
methods marked with `@Subscribe` are message handlers, under its `topic`.

```ts
export function Controller<const D extends readonly Dependency[] = [
]>(options?: MessageControllerOptions<D>): ChoInjectableDecorator<NoInfer<D>>;
```

### Usage {#Controller-usage}

```ts
@Controller({ topic: "orders", dependencies: [Mailer] })
class OrdersController {
  constructor(readonly mailer: Mailer) {}
}
```

## ControllerRef {#symbol-ControllerRef}

A controller, with its instance and its message handlers.

```ts
export class ControllerRef extends NodeRef {
    readonly instance: object;
    readonly methods: MethodRef[];
    constructor(topic: string, middlewares: ChoMessageMiddlewareFn[], errorHandler: ErrorHandlerRef, instance: object);
}
```

**`instance`** The controller instance, created by the injector.

**`methods`** The message handlers of the controller, in declaration order.

**`constructor`** Create a controller node, with no message handlers yet.

### Usage {#ControllerRef-usage}

```ts
function handlerNames(controller: ControllerRef) {
  return controller.methods.map((method) => method.name);
}
```

## Delivery {#symbol-Delivery}

One message, as plain data: what an adapter gives to a route.

```ts
export type Delivery = {
    readonly value?: Uint8Array | string | null | undefined;
    readonly key?: string | undefined;
    readonly headers?: Readonly<Record<string, string>> | undefined;
};
```

**`value`** The value of the message: its bytes, or a string, which is encoded as
UTF-8. A message without a value has none, or `null`.

**`key`** The key of the message, when it has one.

**`headers`** The headers of the message, when it has some.

### Usage {#Delivery-usage}

```ts
await assert.rejects(
      deliver(
        validated(() => {
          throw boom;
        }),
        { value: "{}" },
      ),
      boom,
    );
```

[Usage in message/handler-args_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/handler-args_test.ts#L549)

## ErrorHandlerRef {#symbol-ErrorHandlerRef}

An error handler as stored in the graph: the function given to `@Catch`,
the bound `handle` method of a handler class, or `null` when there is none.

```ts
export type ErrorHandlerRef = ChoMessageErrorHandlerFn | null;
```

### Usage {#ErrorHandlerRef-usage}

```ts
readonly errorHandler: ErrorHandlerRef;
```

[Usage in message/graph.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/graph.ts#L53)

## FeatureRef {#symbol-FeatureRef}

A feature: a module that declares controllers.

```ts
export class FeatureRef extends NodeRef {
    readonly controllers: ControllerRef[];
    constructor(topic: string, middlewares: ChoMessageMiddlewareFn[], errorHandler: ErrorHandlerRef);
}
```

**`controllers`** The controllers of the feature that have message handlers.

**`constructor`** Create a feature node, with no controllers yet.

### Usage {#FeatureRef-usage}

```ts
function countControllers(feature: FeatureRef) {
  return feature.controllers.length;
}
console.log(app.graph.features.map(countControllers));
```

## Header {#symbol-Header}

An argument from the headers of the message.

- `Header()` gives all of them, as an object of strings.
- `Header("tenant")` gives one, or `undefined` when it is not there. The
  name is the one the broker gave, in the same case: the headers of a
  broker, unlike those of HTTP, tell `Tenant` from `tenant`.
- A validator can follow: `Header(validator)`, `Header("tenant",
  validator)`. It is run when the validation middleware covers the handler.

```ts
export function Header(): ChoMessageArg<Readonly<Record<string, string>>>;
export function Header<T>(validator: ChoValidator<T>): ChoMessageArg<T>;
export function Header(key: string): ChoMessageArg<string | undefined>;
export function Header<T>(key: string, validator: ChoValidator<T>): ChoMessageArg<T>;
```

### Usage {#Header-usage}

```ts
@Subscribe("created")
@Args(Header("tenant"), Value<Order>())
created(tenant: string | undefined, order: Order) {
  return this.store.of(tenant).add(order);
}
```

## Key {#symbol-Key}

An argument from the key of the message.

- `Key()` gives the key, or `undefined` when the message has none, as on a
  broker that has no keys.
- A validator can follow: `Key(validator)`. It is run when the validation
  middleware covers the handler.

```ts
export function Key(): ChoMessageArg<string | undefined>;
export function Key<T>(validator: ChoValidator<T>): ChoMessageArg<T>;
```

### Usage {#Key-usage}

```ts
@Subscribe("created")
@Args(Key(), Value<Order>())
created(key: string | undefined, order: Order) {
  return this.store.add(key, order);
}
```

## Linked {#symbol-Linked}

An application linked by a `Linker`: the adapter's own object, and
what connects it to the broker.

```ts
export interface Linked<T> {
    readonly instance: T;
    start(): Promise<void>;
    stop(): Promise<void>;
}
```

**`start`** Connect to the broker, and subscribe to the topic of each route.

**`stop`** Stop receiving messages, wait for the ones that are being handled, and
disconnect.

**`instance`** The adapter's own object.

### Usage {#Linked-usage}

```ts
return {
      instance: broker,
      start: () => {
        routes.forEach((route) => broker.subscribe(route));
        return Promise.resolve();
      },
      stop: () => broker.idle(),
    };
```

[Usage in examples/hello-world-message.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/hello-world-message.ts#L94)

## Linker {#symbol-Linker}

Connects the routes of an application to a broker.

```ts
export interface Linker<T> {
    link(routes: readonly Route[]): Linked<T>;
}
```

**`link`** Prepare the routes for a broker. It does no I/O: `ChoMessage.create`
calls it, and must not need a broker. `Linked.start` connects.

### Usage {#Linker-usage}

```ts
class MyLinker implements Linker<MyClient> {
  link(routes: readonly Route[]): Linked<MyClient> {
    const client = new MyClient();
    return {
      instance: client,
      start: async () => {
        await client.connect();
        for (const route of routes) {
          await client.subscribe(route.topic, async (message) => {
            try {
              const reply = await route.handle(
                { value: message.data },
                message,
              );
              await message.ack();
              // only for a broker that has replies
              if (reply && message.replyTo) {
                await client.publish(message.replyTo, reply.value, {
                  headers: reply.headers ?? {},
                });
              }
            } catch {
              await message.retryLater();
            }
          });
        }
      },
      stop: () => client.close(),
    };
  }
}

const app = await ChoMessage.create(AppModule, { linker: new MyLinker() });
```

## LocalApplication {#symbol-LocalApplication}

What `localSender` delivers to: an application, or its `handle`.

```ts
export type LocalApplication = {
    handle(topic: string, message?: Delivery): Promise<Reply | undefined>;
};
```

### Usage {#LocalApplication-usage}

```ts
export function localSender(app: LocalApplication): Sender {
  if (
    typeof app !== "object" || app === null || typeof app.handle !== "function"
  ) {
    throw message_error(
      "CHO_MESSAGE_INVALID_CLIENT",
      `localSender(): expected an application, such as what ChoMessage.create gives, got ${
        describe(app)
      }`,
    );
  }
  return {
    async publish(topic, delivery) {
      await app.handle(topic, delivery);
    },
    request: (topic, delivery) => app.handle(topic, delivery),
  };
}
```

[Usage in message/client.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/client.ts#L327)

## MessageControllerOptions {#symbol-MessageControllerOptions}

Options of `@Controller` in a message application: its `dependencies`, and
its `topic`.

```ts
export type MessageControllerOptions<D extends readonly Dependency[] = readonly Dependency[]> = WithDependencies<Partial<ControllerOptions>, D> & TopicOption;
```

### Usage {#MessageControllerOptions-usage}

```ts
@Middlewares(validate())
@Controller({ topic: "shop.prices" })
class PricesController {
  /** `shop.prices.get`: the price of an order. The object is sent as JSON. */
  @Subscribe(GetPrice)
  get(order: Order): Price {
    if (order.id > 100) {
      throw new ReplyError(404, "Not Found"); // what who asked is told
    }
    if (order.id < 0) {
      throw new Error("the password of the database is wrong"); // not told
    }
    return { id: order.id, price: order.id * 10 };
  }
}
```

[Usage in examples/nats-reply.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/nats-reply.ts#L77)

## MessageModuleOptions {#symbol-MessageModuleOptions}

Options of `@Module` in a message application: the module options of the
core, and the `topic` of the feature.

```ts
export type MessageModuleOptions<D extends readonly Dependency[] = readonly Dependency[]> = WithDependencies<Partial<ModuleOptions>, D> & TopicOption;
```

### Usage {#MessageModuleOptions-usage}

```ts
@Module({ topic: "shop", providers: [Mailer], controllers: [OrdersController] })
export class AppModule {}
```

[Usage in examples/hello-world-message.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/hello-world-message.ts#L161)

## MethodRef {#symbol-MethodRef}

A message handler: a controller method marked with `@Subscribe`.

```ts
export class MethodRef extends NodeRef {
    readonly name: string;
    readonly handler: ChoMessageHandler;
    readonly args: readonly ChoMessageArg[];
    readonly validated: boolean;
    readonly contract: Contract<unknown, unknown> | undefined;
    constructor(name: string, topic: string, middlewares: ChoMessageMiddlewareFn[], errorHandler: ErrorHandlerRef, handler: ChoMessageHandler, args?: readonly ChoMessageArg[], validated?: boolean, contract?: Contract<unknown, unknown>);
}
```

**`name`** The name of the method on the controller.

**`handler`** Calls the method on its controller instance, with the context of a
message alone: it evaluates the arguments of `@Args` itself, and
validates them when `validated` is `true`.

**`args`** The arguments of the handler, as given to `@Args`, in order; empty when
it has none. An argument made by `Value`, `Key` or `Header` has an
`info`: its source, its key and its validator.

**`validated`** Whether the validation middleware covers the handler: whether
`validate()` is among the middlewares of the feature, of the controller
or of the handler. The validators of `args` are run only then.

**`contract`** The contract of the handler, when `@Subscribe` was given one: its whole
topic, and the validators of its request and of its reply.

**`constructor`** Create a message handler node.

### Usage {#MethodRef-usage}

```ts
function describeMethod(method: MethodRef) {
  return { name: method.name, arguments: method.args.length };
}
```

## Middlewares {#symbol-Middlewares}

Declare middlewares for a feature module, a controller or a handler.

A message runs the feature's middlewares, then the controller's, then the
handler's. The decorator can be applied several times: the middlewares are
kept in source order, top decorator first.

```ts
export function Middlewares(...middlewares: ChoMessageMiddleware[]): ChoClassOrMethodDecorator;
```

### Usage {#Middlewares-usage}

```ts
const log: ChoMessageMiddlewareFn = async (ctx, next) => {
  console.log("in", ctx.topic);
  await next();
  console.log("done", ctx.topic);
};

@Middlewares(log)
@Controller({ topic: "orders" })
class OrdersController {
  @Subscribe("created")
  created() {}
}
```

## Module {#symbol-Module}

Mark a class as a module (see `@Module` of `@chojs/core`). A module that
declares controllers is a feature: its `topic` comes before the topics of
its controllers.

```ts
export function Module<const D extends readonly Dependency[] = [
]>(options?: MessageModuleOptions<D>): ChoInjectableDecorator<NoInfer<D>>;
```

### Usage {#Module-usage}

```ts
@Module({ topic: "shop", providers: [Mailer], controllers: [OrdersController] })
class App {}
```

## NodeRef {#symbol-NodeRef}

A node of the message graph that has a topic, middlewares and an error handler.

```ts
export abstract class NodeRef {
    readonly topic: string;
    readonly middlewares: ChoMessageMiddlewareFn[];
    readonly errorHandler: ErrorHandlerRef;
    constructor(topic: string, middlewares: ChoMessageMiddlewareFn[], errorHandler: ErrorHandlerRef);
}
```

**`topic`** The topic of the node, relative to its parent; `""` when it has none.

**`middlewares`** The middlewares of the node, created and in order.

**`errorHandler`** The error handler of the node, or `null` when it has none.

**`constructor`** Create a node.

### Usage {#NodeRef-usage}

```ts
export class FeatureRef extends NodeRef {
  /** The controllers of the feature that have message handlers. */
  readonly controllers: ControllerRef[];

  /**
   * Create a feature node, with no controllers yet.
   *
   * @param topic The topic of the feature, relative to the global prefix.
   * @param middlewares The middlewares of the feature module.
   * @param errorHandler The error handler of the feature module, or `null`.
   */
  constructor(
    topic: string,
    middlewares: ChoMessageMiddlewareFn[],
    errorHandler: ErrorHandlerRef,
  ) {
    super(topic, middlewares, errorHandler);
    this.controllers = [];
  }
}
```

[Usage in message/graph.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/graph.ts#L161)

## Reply {#symbol-Reply}

The reply of a message, as plain data: what a route gives back to an
adapter. It is a `Delivery` in the other direction.

A handler does not make one: it returns a value, and `@chojs/message`
makes the reply of it (bytes and strings as they are, anything else as
JSON). A handler that returns a `ChoMessageReply` gives the headers.

```ts
export type Reply = {
    readonly value: Uint8Array;
    readonly headers?: Readonly<Record<string, string>> | undefined;
};
```

**`value`** The value of the reply, as bytes.

**`headers`** The headers of the reply, when the handler gave some: absent otherwise.
An adapter whose broker has no headers for a reply ignores them.

### Usage {#Reply-usage}

```ts
return result !== null && typeof result === "object"
        ? result as Reply
        : { value: encoder.encode(String(result)) };
```

[Usage in vendor/nats/consume_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/consume_test.ts#L210)

## ReplyError {#symbol-ReplyError}

An error with a code and a description, for who asked.

- **A handler throws one** to say what a requester is told: an adapter
  whose broker has replies answers with its code and its description, in
  place of what it tells for any other error.
- **Who asks gets one**: `ChoMessageClient.request` rejects with it when
  the other side answered with an error.

It is an error like any other for the rest: it goes to the nearest error
handler first, and a message that asks for no reply fails with it.

```ts
export class ReplyError extends Error {
    readonly code: number;
    constructor(code: number, description: string, options?: ReplyErrorOptions);
    get description(): string;
}
```

**`description`** What went wrong, for who asked: the `message` of the error.

**`code`** The code of the error: `404`, `409`, …

**`constructor`** Make an error for who asked.

### Usage {#ReplyError-usage}

```ts
@Subscribe(GetPrice)
price(request: { id: number }) {
  const order = this.orders.find(request.id);
  if (!order) {
    throw new ReplyError(404, "Not Found");
  }
  return { id: order.id, price: order.price };
}

// who asked
try {
  await client.request(GetPrice, { id: 7 });
} catch (error) {
  if (isReplyError(error, 404)) {
    // no such order
  }
}
```

## ReplyErrorOptions {#symbol-ReplyErrorOptions}

The options of `ReplyError`.

```ts
export type ReplyErrorOptions = {
    cause?: unknown;
};
```

**`cause`** The error that led to this one. It is logged, and never sent.

### Usage {#ReplyErrorOptions-usage}

```ts
const options: ReplyErrorOptions = { cause: error };
throw new ReplyError(503, "Catalog unavailable", options);
```

## RequestOptions {#symbol-RequestOptions}

The options of a request.

```ts
export type RequestOptions = {
    readonly timeout?: number | undefined;
};
```

**`timeout`** The milliseconds to wait for the answer. Default: the adapter's.

### Usage {#RequestOptions-usage}

```ts
const requested: [string, Delivery, RequestOptions | undefined][] = [];
```

[Usage in message/client_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/client_test.ts#L57)

## Route {#symbol-Route}

A route of the application: a topic, ready to subscribe to.

```ts
export type Route = {
    readonly topic: string;
    readonly name: string;
    handle(delivery: Delivery, native?: unknown): Promise<Reply | undefined>;
};
```

**`topic`** The full topic, global prefix included: `"staging.orders.created"`.

**`name`** Where the route is declared, for logs: `"OrdersController.created"`.

### Usage {#Route-usage}

```ts
subscribe(route: Route) {
    this.#routes.set(route.topic, route);
  }
```

[Usage in examples/hello-world-message.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/hello-world-message.ts#L44)

## Sender {#symbol-Sender}

Sends messages to a broker: what a `ChoMessageClient` is built on. Each
adapter gives one, made of the client of its broker.

A `Delivery` is the message to send: its value, as bytes or as a
string, its key and its headers. A sender ignores what its broker has not
(a key, on NATS).

```ts
export interface Sender {
    publish(topic: string, delivery: Delivery): Promise<void>;
    request?(topic: string, delivery: Delivery, options?: RequestOptions): Promise<Reply | undefined>;
}
```

**`publish`** Send a message that asks for no reply.

**`request`** Send a message that asks for a reply, and wait for it. A sender whose
broker has no replies has no `request`.

### Usage {#Sender-usage}

```ts
const sender: Sender = {
  publish: (topic, { value }) => client.publish(topic, value),
  async request(topic, { value }, options) {
    const answer = await client.request(topic, value, options?.timeout);
    if (answer.error) {
      throw new ReplyError(answer.error.code, answer.error.text);
    }
    return { value: answer.data };
  },
};
```

## Subscribe {#symbol-Subscribe}

Mark a method as the handler of the messages of a topic.

The method receives the `ChoMessageContext` of each message. When it
returns, the message is handled, and what it returns is ignored. When it
throws, the error goes to the nearest error handler (`@Catch`), and without
one the message failed: the broker adapter does what its broker does with
such a message.

A handler handles one topic, and a topic has one handler. The decorator
works with both decorator implementations (TC39, and legacy / Bun), and
checks, when the class is defined, what would otherwise be silently lost:
the topic must be valid, the method must be one the graph builder collects
(public, not static, with a string name), and it can have only one
`@Subscribe`.

Given a contract in place of a topic, the handler takes its topic, its
argument and its types from it: see the second signature.

```ts
export function Subscribe(topic: string): ChoMethodDecorator;
export function Subscribe<Request, Reply, Sent, Returned>(contract: Contract<Request, Reply, Sent, Returned>): ChoMessageContractDecorator<Request, Returned>;
```

### Usage {#Subscribe-usage}

```ts
@Controller({ topic: "orders" })
class OrdersController {
  // the topic orders.created
  @Subscribe("created")
  created(ctx: ChoMessageContext) {
    console.log(ctx.key, ctx.json());
  }
}
```
```ts
@Middlewares(validate())
@Controller({ topic: "shop.orders" })
class OrdersController {
  // the topic shop.orders.price
  @Subscribe(GetPrice)
  price(request: { id: number }, ctx: ChoMessageContext) {
    return { id: request.id, price: 42 };
  }
}
```

## TopicOption {#symbol-TopicOption}

The option `@chojs/message` adds to `@Module` and `@Controller`.

```ts
export type TopicOption = {
    topic?: string;
};
```

**`topic`** The topic of the feature module or of the controller: segments of
letters, digits, `_` and `-`, separated by `.` (`"orders"`,
`"shop.orders"`). It comes before the topics of what the module or the
controller holds. Default: none.

### Usage {#TopicOption-usage}

```ts
return CoreController<TopicOption, D>(options);
```

[Usage in message/decorators.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/decorators.ts#L140)

## Value {#symbol-Value}

An argument from the value of the message, parsed as JSON.

- `Value()` gives the parsed value; a message with no value gives
  `undefined`.
- `Value("name")` gives one property of it, or `undefined` when the value
  has none, or is not an object.
- The value is parsed once for a message, whatever the number of `Value`
  arguments. For its text or its bytes, read `ctx.text()` and `ctx.value`.
- A validator can follow: `Value(validator)`, `Value("name", validator)`.
  It is run when the validation middleware covers the handler. Without
  one, the value is `unknown`, or the type given by hand: `Value<Order>()`.

```ts
export function Value<T = unknown>(): ChoMessageArg<T>;
export function Value<T>(validator: ChoValidator<T>): ChoMessageArg<T>;
export function Value<T = unknown>(key: string): ChoMessageArg<T>;
export function Value<T>(key: string, validator: ChoValidator<T>): ChoMessageArg<T>;
```

### Usage {#Value-usage}

```ts
@Subscribe("created")
@Args(Value(Order))
created(order: Order) {
  return this.store.add(order);
}
```

## contract {#symbol-contract}

Make a contract.

- `topic` is the whole topic of the message, without the prefix of an
  application.
- Optional request and reply schemas can implement Standard Schema or expose a `parse` method. Type-only contracts perform no runtime validation.
- A contract speaks JSON: the value of the message and the reply are sent
  as JSON, both ways.

```ts
export function contract<Request = unknown, Reply = undefined, Sent = Request, Returned = Reply>(
  options: ContractOptions<Request, Reply, Sent, Returned>
): Contract<Request, Reply, unknown extends Sent ? Request : Sent, unknown extends Returned ? Reply : Returned>;
```

### Usage {#contract-usage}

```ts
export const GetPrice = contract({
  topic: "shop.orders.price",
  request: z.object({ id: z.number() }),
  reply: z.object({ id: z.number(), price: z.number() }),
});

// the service that answers
@Subscribe(GetPrice)
price(request: { id: number }) {
  return { id: request.id, price: 42 };
}

// the service that asks
const { price } = await client.request(GetPrice, { id: 7 });
```

## isReplyError {#symbol-isReplyError}

Whether a value is a `ReplyError`, of any copy of the package.

```ts
export function isReplyError(value: unknown, code?: number): value is ReplyError;
```

### Usage {#isReplyError-usage}

```ts
if (isReplyError(error, 404)) {
  return undefined;
}
```

## localSender {#symbol-localSender}

A sender with no broker: it delivers each message to an application in the
same process, with `app.handle`. It is for tests: a client and the
application it talks to, end to end.

- `publish` resolves when the message is handled, and rejects with its
  error when it failed.
- `request` resolves with the reply of the handler, and rejects with what
  it threw: a `ReplyError` as it is.
- A topic that has no handler rejects with `CHO_MESSAGE_UNKNOWN_TOPIC`.

```ts
export function localSender(app: LocalApplication): Sender;
```

### Usage {#localSender-usage}

```ts
const app = await ChoMessage.create(AppModule);
const client = new ChoMessageClient(localSender(app));
assert.deepEqual(await client.request(GetPrice, { id: 7 }), { id: 7, price: 42 });
```

## validate {#symbol-validate}

Make the validation middleware.

For the handlers it covers, every argument that has a validator goes
through it before the handler is called, and what the validator returns is
what the handler receives. When an argument is not valid, or the value
cannot be parsed as JSON, the handler is not called and the message fails,
with a `ChoError` of the code `CHO_MESSAGE_INVALID_MESSAGE`: an adapter
does not try such a message again. `onInvalid` decides otherwise.

Wherever it is declared, validation happens at the same moment: after
every middleware of the route, just before the handler. When several cover
a handler, the nearest one decides: the handler's, then the controller's,
then the feature's.

```ts
export function validate(options?: ChoMessageValidateOptions): ChoMessageMiddlewareFn;
```

### Usage {#validate-usage}

```ts
@Middlewares(validate())
@Controller({ topic: "orders" })
class OrdersController {
  @Subscribe("created")
  @Args(Value(Order))
  created(order: Order) {
    return this.store.add(order);
  }
}
```

Skip a message that is not valid
```ts
validate({
  onInvalid: ({ source, key, issues }, ctx) => {
    console.error(ctx.topic, source, key, issues);
    return true; // handled: it is not delivered again
  },
});
```

## Also exported here

These declarations share their implementation with another entry point. Each link opens the full declaration.

[`ChoCoreErrorCode`](/api/core#symbol-ChoCoreErrorCode), [`ChoError`](/api/core#symbol-ChoError), [`ConfigureOptions`](/api/core#symbol-ConfigureOptions), [`ControllerOptions`](/api/core#symbol-ControllerOptions), [`Injectable`](/api/core#symbol-Injectable), [`InjectableOptions`](/api/core#symbol-InjectableOptions), [`InjectionToken`](/api/core#symbol-InjectionToken), [`ModuleOptions`](/api/core#symbol-ModuleOptions), [`Provider`](/api/core#symbol-Provider), [`WithDependencies`](/api/core#symbol-WithDependencies), [`configure`](/api/core#symbol-configure), [`isChoError`](/api/core#symbol-isChoError), [`provider`](/api/core#symbol-provider), [`token`](/api/core#symbol-token)

## Shared schema types

These types are also importable directly from this package. [ChoValidator](/api/core#symbol-ChoValidator) · [ChoParseValidator](/api/core#symbol-ChoParseValidator) · [ChoIssue](/api/core#symbol-ChoIssue) · [ChoInput](/api/core#symbol-ChoInput) · [ChoOutput](/api/core#symbol-ChoOutput) · [StandardTypedV1](/api/core#symbol-StandardTypedV1) · [StandardSchemaV1](/api/core#symbol-StandardSchemaV1) · [StandardJSONSchemaV1](/api/core#symbol-StandardJSONSchemaV1)

## ContractOptions {#symbol-ContractOptions}

`ContractOptions<Request, Reply, Sent, Returned>` declares the topic and optional validators. Its `request` accepts `ChoValidator<Request, Sent>`; its `reply` accepts `ChoValidator<Reply, Returned>`. Defaults are `unknown`, `undefined`, `Request` and `Reply` respectively.

```ts
const decimal = z.string().regex(/^\d+$/).transform(Number);
const options = {
  topic: "catalog.next", request: decimal, reply: decimal,
} satisfies ContractOptions<number, number, string, string>;
const Next = contract(options);
```

[Sending and handling a transformed message](/message/contracts#use-different-types-on-the-wire-and-in-the-handler)
