# Message quick start

`@chojs/message` builds applications that handle the messages of a broker, such
as Kafka or NATS, with decorators. Controllers declare message handlers;
`ChoMessage` gives their topics to a broker adapter, which subscribes to them.

It is the sibling of [`@chojs/web`](/web/quick-start): the same modules,
controllers, middlewares and error handlers, with a **topic** where `@chojs/web`
has a route.

- **The broker stays outside.** A handler receives a message as plain data: its
  value, its key and its headers. Nothing in a controller depends on the client
  library of the broker.
- **One handler for a topic.** A topic is a name, with no pattern, so it means
  the same on every broker.
- **No message is lost silently.** A message is acknowledged after its handler
  has returned, and an error handler that only logs leaves it failed.
- **Testable with no broker.** `app.handle(topic, message)` gives a message to
  its handler.
- **One set of instances with a web application.** `ChoMessage.from` builds a
  message application on the injector of a `ChoWeb`.
- **Fails early.** A bad topic, a duplicate topic or a missing provider is
  reported when the application is created, not on the first message.

::: warning No broker adapter is published yet
`@chojs/message` is complete, and no adapter for a broker is published yet.
Until one is, an application delivers its messages
[by hand](/message/application#delivering-a-message-by-hand), or with a
[linker of its own](/message/adapters), which is some forty lines for most
client libraries.
:::

## Install

::: code-group

```sh [Deno]
deno add jsr:@chojs/message
```

```sh [Node.js]
npx jsr add @chojs/message
npm install -D tsx typescript
```

```sh [Bun]
bunx jsr add @chojs/message
```

:::

## A first application

```ts
import {
  ChoMessage,
  type ChoMessageContext,
  Controller,
  Injectable,
  Module,
  Subscribe,
} from "@chojs/message";

type Order = { id: string; email: string };

@Injectable()
class Mailer {
  async confirm(order: Order) {
    console.log(`mail to ${order.email}: order ${order.id} is confirmed`);
  }
}

@Controller({ topic: "orders", dependencies: [Mailer] })
class OrdersController {
  constructor(readonly mailer: Mailer) {}

  @Subscribe("created") // the topic orders.created
  async created(ctx: ChoMessageContext) {
    const order = ctx.json<Order>();
    await this.mailer.confirm(order);
    // returning without an error: the message is handled
  }

  @Subscribe("cancelled") // the topic orders.cancelled
  cancelled(ctx: ChoMessageContext) {
    console.log(ctx.topic, ctx.key, ctx.text());
  }
}

@Module({ providers: [Mailer], controllers: [OrdersController] })
class App {}

const app = await ChoMessage.create(App);
```

`ChoMessage.create` builds the injector, creates every instance and checks
every topic. It connects to nothing.

## Give it a message

Without a broker, a message is delivered by hand. `handle` resolves when the
message is handled, and rejects, with the error, when it failed:

```ts
await app.handle("orders.created", {
  value: JSON.stringify({ id: "42", email: "ada@example.com" }),
  key: "42",
});
// mail to ada@example.com: order 42 is confirmed

await app.close();
```

::: code-group

```sh [Deno]
deno run main.ts
```

```sh [Node.js]
npx tsx main.ts
```

```sh [Bun]
bun run main.ts
```

:::

## Connect it to a broker

A broker is not called, it is connected to. The application takes a **linker**,
the adapter of a broker, and starts:

```ts
const app = await ChoMessage.create(App, { linker: new MyLinker() });

await app.start(); // connects, and subscribes to the two topics
```

`MyLinker` is yours for now: [Broker adapters](/message/adapters) shows a whole
one. The repository has a runnable example with a broker kept in memory,
[`hello-world-message.ts`](https://github.com/cho-js/cho/blob/main/examples/hello-world-message.ts).

## What to read next

| Topic                                        | Page                                             |
| -------------------------------------------- | ------------------------------------------------ |
| The four levels of a topic, and its rules    | [Topics](/message/topics)                        |
| The context, and the outcome of a message    | [Handlers and the context](/message/handlers)    |
| Dropping, timing, shared setup               | [Middlewares](/message/middlewares)              |
| `@Catch`, and what settles a failed message  | [Error handling](/message/error-handling)        |
| Options, `start()`, `handle()`, `close()`    | [The application](/message/application)          |
| One injector for HTTP and messages           | [With a web application](/message/with-web)      |
| Tests                                        | [Testing](/message/testing)                      |
| Connecting a broker                          | [Broker adapters](/message/adapters)             |
