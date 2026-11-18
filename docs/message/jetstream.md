# Deliver inventory events with NATS JetStream

Use a stream when a worker must receive events published while it was offline. In the same CHO application, a shelf lookup can keep answering Core NATS requests while inventory updates go through a durable JetStream consumer. The subjects captured by your streams determine which route uses which behavior.

## Run a delivery, retry and dead letter

Start a disposable JetStream server in its own terminal. The example creates, resets and removes streams named `EXAMPLE_ORDERS` and `EXAMPLE_DEAD`. Use the isolated server below so the exercise only touches its own data.

```sh
docker run --rm -p 127.0.0.1:14222:4222 nats:2 -js
```

From the root of the [CHO development checkout](/guide/getting-started#run-examples-against-the-development-version), run the included `examples/nats-stream.ts` against that port.

```sh
NATS_URL=127.0.0.1:14222 deno run --allow-env=NATS_URL,CHO_DEBUG,CHO_DEBUGLOG --allow-net=127.0.0.1:14222 examples/nats-stream.ts
```

Orders 1 and 3 succeed on their first attempt. Order 2 fails three times. The final line reads back its stored dead letter, including the original payload and delivery count.

```text
dead letter: {"id":2,"stock":false} after 3 attempts: no stock
```

Stop the example server with Ctrl+C.

## Configure a durable route

For an inventory service, provision a stream named `INVENTORY` for `books.received` and a separate stream for `dead.books.received`. The application creates and updates durable consumers for matching routes each time it starts. Operators own the streams. Keeping `books.locate` outside those streams leaves that route available for requests.

```ts
import { jetstream } from "@nats-io/jetstream-deno";
import { connect } from "@nats-io/transport-deno";
import { NatsLinker } from "@chojs/vendor-nats";

const linker = new NatsLinker({
  connect: () => connect({ servers: "127.0.0.1:4222" }),
  queue: "inventory",
  jetstream: {
    client: (nc) => jetstream(nc),
    streams: ["INVENTORY"],
    retries: 2,
    retryDelay: 200,
    deadLetter: (topic) => "dead." + topic,
  },
});
```

The Deno import above uses the alias in CHO's workspace for `jsr:@nats-io/jetstream`. On Node.js and Bun, import `jetstream` from `@nats-io/jetstream` and `connect` from `@nats-io/transport-node`. Pass `linker` to `ChoMessage.create` and await `app.start()`. Use the JetStream client when the publisher needs confirmation that the stream stored an event.

```ts
const js = jetstream(app.linked.instance);
const ack = await js.publish("books.received", JSON.stringify({ isbn: "9780140268867" }));
console.log(ack.stream, ack.seq);
```

## Choose the failure policy

| Outcome | What the consumer does |
| --- | --- |
| Handler completes or `@Catch` settles the delivery | Acknowledges the event. Returned replies are discarded |
| Ordinary handler failure | Schedules redelivery. `retries` counts additional attempts (default `3`). `retryDelay` defaults to `1000` ms and can be a function of the retry number |
| Retries exhausted, or validation failed with `CHO_MESSAGE_INVALID_MESSAGE` | Publishes the dead letter, then terminates delivery. Without a dead-letter destination, it terminates delivery and continues to the next event |
| Dead-letter publication fails | Leaves the original eligible for redelivery so publication can be tried again |

The dead letter retains the original payload and headers. Inspect `cho-topic`, `cho-stream`, `cho-sequence`, `cho-consumer`, `cho-attempts` and `cho-error` to trace the failure. The package exports their names as `DEAD_LETTER_HEADERS`.

Each queue group shares one durable consumer per matching route across replicas. Delivery is at least once. Use an idempotent write and set `ackWait` (default `30000` ms) to cover normal handler duration. `concurrency` defaults to `1` per route and includes messages waiting for retry. Read `(ctx.native as NatsStreamNative).attempt` for the delivery count. On shutdown, CHO waits for active handlers and leaves received but unprocessed work available for redelivery.
