# Receive an inventory message

Deliver a shipment notice to a handler, inspect its JSON payload and close the application. This first example runs entirely in one process. Install `@chojs/message` using [project setup](/guide/getting-started).

## 1. Subscribe to a topic

Save the following as `app.ts`. The controller and method names in the decorators combine into the literal topic `books.received`. The handler checks the incoming data before using it.

<<< @/examples/message/app.ts

## 2. Deliver a message

Save the entry point as `main.ts`. The key identifies the delivery in this example. The topic selects the handler.

<<< @/examples/message/main.ts

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

Expect `Received 9780140268867 on books.received`. The promise returned by `handle` resolves to `undefined` because this subscription returns nothing. To answer a lookup, [return a reply](/message/replies).

## 3. Exercise a failure

Change `value` to `'{"isbn":17}'` and run the program again. The handler throws `Expected a string isbn` and `handle` rejects. The `finally` block releases the application in either case. Changing the topic to `books.missing` tests a different failure, because there is no subscription for that name.

## Connect a broker

Once the handler works in memory, pass a linker to `ChoMessage.create` and call `await app.start()`. The linker subscribes to the compiled topics and forwards deliveries into the same handlers. To have another service ask for a result over the network, follow the [NATS request/reply guide](/message/nats). For event processing on Node.js with retries and dead-letter handling, follow the [Kafka guide](/message/kafka).

On NATS, use [JetStream](/message/jetstream) to retain shipments published while the inventory worker is offline. To validate each shipment before the handler runs, adapt the [message arguments example](/message/arguments).
