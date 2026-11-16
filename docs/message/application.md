# The application

`ChoMessage.create` turns a root module into a message application.

```ts
const app = await ChoMessage.create(App, {
  linker, //            the adapter of a broker
  prefix: "staging", // optional: a prefix for every topic
  onError: (error, ctx) => console.error(ctx.topic, error),
});
```

## Options

| Option      | Default | Use                                                                                     |
| ----------- | ------- | --------------------------------------------------------------------------------------- |
| `linker`    | none    | The [broker adapter](/message/adapters). Without one, only `handle()` delivers messages |
| `prefix`    | `""`    | A prefix for every topic, such as `"staging"` ([Topics](/message/topics))               |
| `onError`   | none    | The error handler for what no `@Catch` covers ([Error handling](/message/error-handling)) |
| `overrides` | none    | Providers that replace declared ones, for [tests](/message/testing)                     |

An unknown option is an error.

## What `create` does

1. Builds the injector: the module graph is read and validated.
2. Creates **every** instance of the application, up front.
3. Builds and checks the topics.
4. Gives them to the linker, if there is one.

It **does not connect** to the broker: `start()` does. So every wiring, topic,
middleware or error handler mistake makes `create` reject before anything is
connected, and with no broker in reach. What was created until then is
disposed.

## Starting and stopping

A web application is called by a server. A broker is connected to, so a
message application starts and stops itself.

```ts
import process from "node:process";
import { ChoMessage } from "@chojs/message";

const app = await ChoMessage.create(WorkerModule, { linker });
await app.start();

// The connection to the broker keeps the process running.
let closing = false;
async function shutdown() {
  if (closing) {
    return;
  }
  closing = true;
  await app.close(); // finish the messages in hand, disconnect, release
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

| Method    | Does                                                                                    |
| --------- | --------------------------------------------------------------------------------------- |
| `start()` | Connects, and subscribes to every topic. Rejects when the broker cannot be reached       |
| `close()` | Stops receiving, waits for the messages that are being handled, disconnects, and disposes the instances, in reverse creation order |

- Both run once: calling one again returns the same promise.
- `start()` rejects for an application without a linker, and once `close()`
  was called.
- `close()` waits for the messages in hand **however long they take**: there
  is no timeout. A handler that can hang should have a timeout of its own.
- `await using app = await ChoMessage.create(App)` closes the application at
  the end of the block.

## Delivering a message by hand

`app.handle(topic, message)` gives one message to the handler of a topic. It
needs no linker and no `start()`.

```ts
const app = await ChoMessage.create(App);

await app.handle("orders.created", {
  value: JSON.stringify({ id: "42" }), // a string, or bytes
  key: "42", //                           optional
  headers: { "message-id": "abc" }, //    optional
});
```

- The topic is the **full** topic, global prefix included.
- It resolves when the message is handled, and rejects, with the error, when
  it failed.
- It rejects for a topic with no handler, and once the application is closed.
- `value` is a `Uint8Array` or a string, which is encoded as UTF-8. Without
  one, the value is empty.

It is how an application is [tested](/message/testing), and how messages that
arrive another way are handled. A broker that pushes its messages over HTTP,
such as Google Pub/Sub or Amazon SNS, is served by an HTTP handler that calls
`app.handle`:

```ts
import { serve } from "@chojs/web/serve";

const messages = await ChoMessage.create(App);

await serve(async (req) => {
  const topic = new URL(req.url).pathname.slice(1); // POST /orders.created
  try {
    await messages.handle(topic, {
      value: new Uint8Array(await req.arrayBuffer()),
    });
    return new Response(null, { status: 204 }); // acknowledged
  } catch {
    return new Response(null, { status: 500 }); // failed: it is sent again
  }
});
```

## What the application exposes

| Member            | Holds                                                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| `start()`         | Connects and subscribes                                                      |
| `handle()`        | Delivers one message by hand                                                 |
| `close()`         | Stops, and releases the instances                                            |
| `routes`          | Every topic: `topic`, `name`, `handle`                                       |
| `graph`           | The same topics as a tree: features, controllers, handlers                   |
| `linked.instance` | The adapter's own object, such as the client of the broker; `undefined` without a linker |
| `injector`        | The injector of the application ([With a web application](/message/with-web)) |

```ts
app.routes; //          [{ topic: "staging.orders.created", name: "OrdersController.created", … }]
app.linked.instance; // the client of the broker
```

## Debug logging

```sh
CHO_DEBUGLOG=cho:message deno run --allow-net --allow-env main.ts
```

```
cho:message staging.orders.created -> OrdersController.created
cho:message staging.orders.cancelled -> OrdersController.cancelled
cho:message application App created +2ms
cho:message ERROR staging.orders.created (OrdersController.created) failed: Error: db down
```

See [Debug logging](/reference/debugging).
