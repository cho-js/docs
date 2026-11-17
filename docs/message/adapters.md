# Broker adapters

`@chojs/message` knows no broker. A **broker adapter** is a package of its
own, named after its broker, that connects the topics of an application to
one. The application passes it to `ChoMessage.create` as the `linker` option.

| Adapter                                   | Broker                                    | Runs on      |
| ----------------------------------------- | ----------------------------------------- | ------------ |
| [`@chojs/vendor-kafka`](/message/kafka)   | [Apache Kafka](https://kafka.apache.org)  | Node.js only |

For another broker, an application writes its own linker, as below, or
delivers its messages
[by hand](/message/application#delivering-a-message-by-hand).

## What an adapter does

An adapter does no plumbing. `@chojs/message` creates the context of a
message and runs the middlewares, the handler and the error handler. The
adapter:

1. connects to the broker;
2. subscribes to the topic of each route;
3. gives each message to its route;
4. acknowledges the messages that were handled, and decides what a message
   that failed leads to.

So middlewares, error handling and the outcome of a message behave the same
on every adapter.

## Writing one

An adapter implements `Linker`, from `@chojs/message/linker`:

```ts
interface Linker<T> {
  link(routes: readonly Route[]): Linked<T>;
}

interface Linked<T> {
  readonly instance: T; //   the adapter's own object
  start(): Promise<void>; // connect, and subscribe to the topic of each route
  stop(): Promise<void>; //  stop receiving, wait for what is handled, disconnect
}
```

Each `Route` is ready to call:

| Property | Holds                                                                    |
| -------- | ------------------------------------------------------------------------ |
| `topic`  | The full topic, global prefix included: `"staging.orders.created"`       |
| `name`   | Where it is declared, for logs: `"OrdersController.created"`             |
| `handle` | `(delivery, native?) => Promise<void>`: handles one message of the topic |

And a `Delivery` is one message, as plain data:

| Property  | Holds                                                    |
| --------- | -------------------------------------------------------- |
| `value`   | The bytes of the value, or a string; optional, or `null` |
| `key`     | The key, as a string; optional                           |
| `headers` | The headers, as an object of strings; optional           |

```ts
import type { Linked, Linker, Route } from "@chojs/message/linker";

export class MyLinker implements Linker<MyClient> {
  constructor(readonly options: MyOptions) {}

  link(routes: readonly Route[]): Linked<MyClient> {
    const client = new MyClient(this.options);
    return {
      instance: client, // app.linked.instance
      start: async () => {
        await client.connect();
        for (const route of routes) {
          await client.subscribe(route.topic, async (message) => {
            try {
              // the message as plain data, and the adapter's own: ctx.native
              await route.handle(
                { value: message.data, key: message.key },
                message,
              );
              await message.ack(); //        handled
            } catch {
              await message.retryLater(); // failed: the adapter's decision
            }
          });
        }
      },
      stop: () => client.close(),
    };
  }
}
```

```ts
const app = await ChoMessage.create(App, { linker: new MyLinker(options) });
await app.start();

app.linked.instance; // the MyClient, typed
```

### The contract

- **`link()` does no I/O.** `ChoMessage.create` calls it, and must not need a
  broker. `start()` connects.
- **`route.handle` resolves when the message is handled**, and the adapter
  acknowledges it. It **rejects, with the error, when the message failed**. It
  never does anything else: an adapter needs no `try` around the middlewares
  or the handler.
- **The second argument of `handle`** is the adapter's own message. Handlers
  see it as `ctx.native`.
- **`stop()` stops receiving first**, then waits for its messages, then
  disconnects. `ChoMessage.close()` calls it, waits for every message in
  hand, and only then disposes the instances.
- A message given to a route **after** the linker has stopped is refused:
  `handle` rejects with `The application is closed`.

## What each adapter decides

These depend on the broker, so each adapter answers them, and documents its
answers. The [Kafka adapter](/message/kafka#behavior) has its own.

| Question                          | Example of an answer                                         |
| --------------------------------- | ------------------------------------------------------------ |
| How the application is identified | The consumer group: a required option                        |
| What a failed message leads to    | Delivered again, at most `n` times, then a dead-letter topic |
| How many messages run at once     | One at a time for each partition                             |
| What `ctx.native` is              | The message of the client library: partition, offset, …      |
| How a topic is named              | As it is; or mapped to the names its broker allows           |
| Which runtimes it runs on         | Node.js only                                                 |

An adapter can run on some runtimes only, when the client library of its
broker does. `@chojs/message` itself runs on Deno, Node.js and Bun.

## A whole adapter, in memory

[`examples/hello-world-message.ts`](https://github.com/cho-js/cho/blob/main/examples/hello-world-message.ts)
has a complete adapter for a broker kept in memory: a queue, two more tries
for a message that failed, then a list of dead letters. It runs with no
installation, and is a good start for an adapter, or for an integration test.

```sh
git clone https://github.com/cho-js/cho && cd cho
deno run examples/hello-world-message.ts
```

## The graph

The tree behind the topics is on `app.graph`, with every instance, middleware
and error handler already created. Its types are in `@chojs/message/graph`:
`AppRef`, `FeatureRef`, `ControllerRef` and `MethodRef`, as in
[`@chojs/web`](/reference/web), with `topic` in place of `route`. An adapter
rarely needs it; a tool that lists or documents the topics does.
