# Kafka adapter

`@chojs/vendor-kafka` subscribes the topics of a CHO message application to
[Apache Kafka](https://kafka.apache.org), as one consumer group.

::: warning Node.js only
The client library, [`@platformatic/kafka`](https://github.com/platformatic/kafka),
is written for Node.js: 22.22, or 24.6 and later. This adapter is tested on
Node.js alone, with Apache Kafka 3.5 to 4.2.
:::

## Install

```sh
npx jsr add @chojs/message @chojs/vendor-kafka
```

The client library comes with the adapter.

## Usage

Pass a `KafkaLinker` to `ChoMessage.create`, and start the application:

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
  @Subscribe("created") // the Kafka topic "shop.orders.created"
  created(ctx: ChoMessageContext) {
    console.log("order", ctx.key, ctx.json());
  }
}

@Module({ topic: "shop", controllers: [OrdersController] })
class AppModule {}

const app = await ChoMessage.create(AppModule, {
  linker: new KafkaLinker({
    brokers: ["localhost:9092"],
    groupId: "mailer",
    deadLetter: (topic) => `${topic}.dead`,
  }),
});

await app.start(); // connects, joins the group "mailer", and subscribes
```

`ChoMessage.create` connects to nothing: `start()` does, and rejects when Kafka
cannot be reached. To stop:

```ts
process.on("SIGTERM", () => app.close());
```

`close()` stops reading, waits for the messages in hand, leaves the group and
disconnects. A message that did not finish is not committed: Kafka delivers it
again.

## Options

| Option        | Default       | What it is                                                                                |
| ------------- | ------------- | ----------------------------------------------------------------------------------------- |
| `brokers`     | Required      | The brokers to connect first, as `host:port`                                              |
| `groupId`     | Required      | The consumer group: the name of the application for Kafka                                 |
| `clientId`    | The `groupId` | The name of this client, in the logs of the brokers                                       |
| `from`        | `"latest"`    | Where the group starts in a topic it never read: `"earliest"` or `"latest"`               |
| `retries`     | `3`           | How many times a failed message is tried again                                            |
| `retryDelay`  | `1000`        | The milliseconds before a retry: a number, or a function of the retry (`1` for the first) |
| `deadLetter`  | None          | The topic of the dead messages: a name, or a function of the topic of the message         |
| `concurrency` | `1`           | How many messages are in hand at once                                                     |
| `onFatal`     | Throws        | Called when the consumer [stopped by itself](#when-the-consumer-stops-by-itself)          |
| `client`      | None          | The connection options of the client library: `tls`, `sasl`, `connectTimeout`, …          |
| `consume`     | None          | More consumer options of the client library: `sessionTimeout`, `maxBytes`, `maxWaitTime`  |

An option that is missing, unknown or wrong throws a `TypeError` from the
constructor, which names it.

```ts
new KafkaLinker({
  brokers: ["kafka-1:9093", "kafka-2:9093"],
  groupId: "mailer",
  from: "earliest",
  retries: 5,
  retryDelay: (retry) => 500 * 2 ** retry, // 1s, 2s, 4s, 8s, 16s
  deadLetter: (topic) => `${topic}.dead`,
  concurrency: 8,
  client: {
    tls: {},
    sasl: { mechanism: "SCRAM-SHA-512", username, password },
  },
  consume: { sessionTimeout: 30_000 },
});
```

Every instance of the application has the same `groupId`: Kafka shares the
partitions between them.

::: tip A new group starts at the latest message
With `from: "latest"`, the default of Kafka, a group that is new does not read
the messages that were sent before it first started. Give `from: "earliest"`
to read a topic from its beginning.
:::

## A message that failed

A message failed when its handler threw and no
[error handler](/message/error-handling) settled it. Kafka cannot refuse one
message: a consumer commits a position in a partition, and everything before
it is done. So the adapter decides, in this order:

1. **It tries the message again, in place**: `retries` times, `retryDelay`
   milliseconds apart. The partition waits meanwhile, so its order is kept.
2. **Then the message is dead.** It is sent to the `deadLetter` topic and
   committed, and the partition goes on.
3. **Without `deadLetter`, the consumer stops.** The offset is not committed,
   so no message is lost or passed over: it is delivered again when the
   application starts again.

A dead letter is the message as it was (its key, its value and its headers),
with these headers added:

| Header          | Holds                                       |
| --------------- | ------------------------------------------- |
| `cho-topic`     | The topic the message comes from            |
| `cho-partition` | Its partition                               |
| `cho-offset`    | Its offset                                  |
| `cho-group`     | The consumer group that could not handle it |
| `cho-attempts`  | How many times it was tried                 |
| `cho-error`     | The message of the last error               |

Their names are exported as `DEAD_LETTER_HEADERS`. The dead-letter topic is not
created by the adapter, and cannot be the topic of the message itself. When the
dead letter cannot be sent, the consumer stops, as in 3.

To [drop](/message/error-handling#retry-or-drop) a message that can never be
handled, rather than try it again, settle it in an error handler:

```ts
@Catch((error) => error instanceof SyntaxError) // handled: committed
@Subscribe("created")
created(ctx: ChoMessageContext) {/* ... */}
```

## Order and concurrency

- The messages of **one partition** are handled one at a time, in the order of
  the partition, whatever `concurrency` is.
- `concurrency` is how many messages, of **different partitions**, are in hand
  at once. With `1`, the default, the application handles one message at a
  time: a message that waits for its retry holds the others back.
- A message is committed when it is settled, each one by itself.

Delivery is **at least once**: a message is handled again when the application
stopped before its commit, or when its partition moved to another instance
meanwhile. Handlers should give the same result when they see a message twice.

## Reaching Kafka from a handler

`ctx.native` is a `KafkaNative`: the message of the client library, and the
number of the attempt.

```ts
import type { KafkaNative } from "@chojs/vendor-kafka";

@Subscribe("created")
created(ctx: ChoMessageContext) {
  const { message, attempt } = ctx.native as KafkaNative;
  message.partition; //     number
  message.offset; //        bigint
  message.timestamp; //     bigint, in milliseconds
  message.key; //           the bytes of the key
  message.headerEntries; // every header, as bytes, repeated ones included
  attempt; //               1 the first time, 2 on the first retry
}
```

`ctx.key` and `ctx.headers` are strings. A key or a header that is not valid
UTF-8 is decoded with replacement characters, and when a header is repeated the
last one wins: the bytes, and every header, are in `ctx.native`.

A handler that reads `ctx.native` runs on this adapter only. It is `undefined`
for a message delivered
[by hand](/message/application#delivering-a-message-by-hand).

## Sending messages

`@chojs/message` handles messages: it does not send them. The adapter has a
producer of the client library, for its dead letters, and the application can
use it. It connects on its first message, and `app.close()` closes it:

```ts
import { Buffer } from "node:buffer";

const { producer } = app.linked.instance;

await producer.send({
  messages: [{
    topic: "shop.orders.created",
    key: Buffer.from("42"),
    value: Buffer.from(JSON.stringify({ id: 42 })),
    headers: new Map([[Buffer.from("message-id"), Buffer.from("abc")]]),
  }],
});
```

It writes bytes: keys, values and headers are `Buffer`s. `app.linked.instance`
also has the `consumer`.

## When the consumer stops by itself

The consumer stops by itself in three cases: a dead message with no
`deadLetter` topic, a dead letter that cannot be sent, and a connection the
client library could not restore. It then finishes the messages in hand,
closes its clients, and calls `onFatal` with the error. Its `cause` is the
error of the handler, or of the client.

Without `onFatal`, the error is thrown: an uncaught exception, which ends the
process, so that what runs the application starts it again. Give `onFatal` to
do something else:

```ts
new KafkaLinker({
  brokers,
  groupId: "mailer",
  onFatal: async (error) => {
    logger.fatal(error);
    await app.close(); // the adapter is stopped already: this ends the rest
    process.exit(1);
  },
});
```

## Behavior

| Question                          | On Kafka                                                                    |
| --------------------------------- | --------------------------------------------------------------------------- |
| How the application is identified | One consumer group, the `groupId` option, for every topic                   |
| What a failed message leads to    | Tried again in place, then the dead-letter topic; without one, a stop       |
| How many messages run at once     | One for each partition; `concurrency` partitions together                   |
| What `ctx.native` is              | `{ message, attempt }`                                                      |
| How a topic is named              | As it is: `shop.orders.created`. At most 249 characters                     |
| Which runtimes it runs on         | Node.js only                                                                |

- **Topics are not created by the adapter.** Create them, or let the broker do
  it (`auto.create.topics.enable`).
- **Offsets are committed by the adapter**, after the message is settled. A
  commit that fails is logged, and the consumer goes on: the message may be
  delivered again.
- **A message with no value** (a tombstone) reaches its handler with an empty
  value: `ctx.text()` is `""` and `ctx.json()` is `undefined`.
- **A linker serves one application.** `link()` throws the second time.
- **Logs** go to the `cho:kafka` [debug context](/reference/debugging):
  `CHO_DEBUGLOG=cho:kafka`.

## Testing

Handlers need no broker to be tested:
[`app.handle(topic, message)`](/message/testing) delivers a message by hand,
with no linker.
