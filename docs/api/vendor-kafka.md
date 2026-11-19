---
outline: 2
---

# @chojs/vendor-kafka

Choose the consumer group, retry budget and dead-letter topic before starting consumption. The Kafka adapter supports Node.js, Deno and Bun. [Consume partitioned events](/message/kafka) · [Browse all packages](/api/)

## ChoKafkaErrorCode {#symbol-ChoKafkaErrorCode}

The codes of the errors of `@chojs/vendor-kafka`. Each is described in `specs.md`, section 5.

A mistake the core finds for the package has a code of the core
(`ChoCoreErrorCode` of `@chojs/core`): an unknown option is
`CHO_CORE_UNKNOWN_OPTION`.

```ts
export type ChoKafkaErrorCode = "CHO_KAFKA_ALREADY_LINKED" | "CHO_KAFKA_CONSUME_FAILED" | "CHO_KAFKA_DEAD_LETTER_FAILED" | "CHO_KAFKA_INVALID_DEAD_LETTER" | "CHO_KAFKA_INVALID_OPTION" | "CHO_KAFKA_INVALID_TOPIC" | "CHO_KAFKA_NO_DEAD_LETTER" | "CHO_KAFKA_NOT_LINKED";
```

### Usage {#ChoKafkaErrorCode-usage}

```ts
const CODES: Record<ChoKafkaErrorCode, true> = {
  CHO_KAFKA_ALREADY_LINKED: true,
  CHO_KAFKA_CONSUME_FAILED: true,
  CHO_KAFKA_DEAD_LETTER_FAILED: true,
  CHO_KAFKA_INVALID_DEAD_LETTER: true,
  CHO_KAFKA_INVALID_OPTION: true,
  CHO_KAFKA_INVALID_TOPIC: true,
  CHO_KAFKA_NO_DEAD_LETTER: true,
  CHO_KAFKA_NOT_LINKED: true,
};
```

[Usage in vendor/kafka/errors_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/kafka/errors_test.ts#L8)

## DEAD_LETTER_HEADERS {#symbol-DEAD_LETTER_HEADERS}

The headers the adapter adds to a dead letter.

```ts
export const DEAD_LETTER_HEADERS: {
    readonly topic: "cho-topic";
    readonly partition: "cho-partition";
    readonly offset: "cho-offset";
    readonly group: "cho-group";
    readonly attempts: "cho-attempts";
    readonly error: "cho-error";
};
```

### Usage {#DEAD_LETTER_HEADERS-usage}

```ts
assert.equal(
      headers.get(DEAD_LETTER_HEADERS.error),
      "Invalid message of orders: the value is not valid",
    );
```

[Usage in vendor/kafka/consume_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/kafka/consume_test.ts#L486)

## KafkaClient {#symbol-KafkaClient}

What `KafkaLinker` links: the clients of the application.

```ts
export type KafkaClient = {
    readonly consumer: KafkaConsumer;
    readonly producer: KafkaProducer;
};
```

**`consumer`** The consumer of the application. It connects on `start()`.

**`producer`** The producer the adapter sends the dead letters with. It connects on its
first message: the application can send its own messages with it.

### Usage {#KafkaClient-usage}

```ts
const client: KafkaClient = app.linked.instance;
console.log(client.consumer, client.producer);
```

## KafkaClientOptions {#symbol-KafkaClientOptions}

The options of the connection to Kafka, as the client library takes them:
`tls`, `sasl`, `connectTimeout`, `retries`, … The brokers and the client id
are options of the linker.

```ts
export type KafkaClientOptions = Omit<BaseOptions, "bootstrapBrokers" | "clientId">;
```

### Usage {#KafkaClientOptions-usage}

```ts
const linked = new KafkaLinker({
      ...OPTIONS,
      client: { connectTimeout: 200, retries: 0 },
    }).link([route("orders")]);
```

[Usage in vendor/kafka/mod_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/kafka/mod_test.ts#L185)

## KafkaConsumeOptions {#symbol-KafkaConsumeOptions}

More options for the consumer, as the client library takes them:
`sessionTimeout`, `heartbeatInterval`, `maxBytes`, `maxWaitTime`, … What the
adapter decides by itself is left out.

```ts
export type KafkaConsumeOptions = Omit<ConsumeOptions<Buffer, Buffer, Buffer, Buffer>, "topics" | "autocommit" | "mode" | "fallbackMode" | "offsets" | "deserializers" | "registry" | "beforeDeserialization">;
```

### Usage {#KafkaConsumeOptions-usage}

```ts
new KafkaLinker({
      ...OPTIONS,
      clientId: "mailer-1",
      from: "earliest",
      retries: 0,
      retryDelay: (retry) => retry * 100,
      deadLetter: "dead",
      concurrency: 4,
      onFatal: () => {},
      client: { connectTimeout: 1000 },
      consume: { sessionTimeout: 10_000 },
    });
```

[Usage in vendor/kafka/mod_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/kafka/mod_test.ts#L107)

## KafkaConsumer {#symbol-KafkaConsumer}

The consumer of the client library, reading bytes.

```ts
export type KafkaConsumer = Consumer<Buffer, Buffer, Buffer, Buffer>;
```

### Usage {#KafkaConsumer-usage}

```ts
const consumer: KafkaConsumer = app.linked.instance.consumer;
```

## KafkaLinked {#symbol-KafkaLinked}

A message application linked to Kafka by `KafkaLinker`.

`ChoMessage` starts and stops it: `app.start()` and `app.close()`.

```ts
export class KafkaLinked implements Linked<KafkaClient> {

    readonly instance: KafkaClient;
    constructor(instance: KafkaClient, pump: Pump);
    start(): Promise<void>;
    stop(): Promise<void>;
}
```

**`start`** Connect, join the consumer group and subscribe to the topic of each
route. It resolves when the group is joined.

**`stop`** Stop reading, wait for the messages in hand, leave the group and
disconnect. A message that did not finish is not committed: Kafka
delivers it again.

**`instance`** The consumer and the producer of the application.

**`constructor`** Wrap the clients of an application. `KafkaLinker.link` calls it.

### Usage {#KafkaLinked-usage}

```ts
const close = (linked: Linked) => linked.stop();
```

[Usage in vendor/kafka/mod_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/kafka/mod_test.ts#L59)

## KafkaLinker {#symbol-KafkaLinker}

Subscribes the topics of a CHO message application to Apache Kafka. The
client library is written for Node.js; the adapter is tested on Deno and
Bun too.

Kafka only delivers: each message goes to `Route.handle`, which
`@chojs/message` built. Middlewares and error handlers are
`@chojs/message`'s, so they behave the same on every adapter.

- **The application is one consumer group** (`groupId`). Every topic of the
  application is read by this group. A topic is named in Kafka as it is in
  the application (`shop.orders.created`).
- **A message that was handled is committed.** Delivery is at least once: a
  message can be handled twice, after a crash or a rebalance.
- **A message that failed is tried again, in place**: `retries` times (3),
  `retryDelay` milliseconds apart (1000). Kafka cannot refuse one message,
  so the partition waits meanwhile. Then the message is dead: it is sent to
  the `deadLetter` topic with the headers `DEAD_LETTER_HEADERS`, and
  committed. Without `deadLetter`, the consumer stops, the offset is not
  committed, and `onFatal` is called.
- **One message at a time for each partition**, in the order of the
  partition. `concurrency` (1) is how many messages, of different
  partitions, are in hand at once.
- **`ctx.native`** is a `KafkaNative`: the message of the client
  library (`partition`, `offset`, `timestamp`, the bytes of the key and of
  the headers), and the number of the attempt.
- The topics are not created by the adapter: create them, or let the broker
  do it (`auto.create.topics.enable`).

```ts
export class KafkaLinker implements Linker<KafkaClient> {

    readonly sender: Sender;
    constructor(options: KafkaLinkerOptions);
    link(routes: readonly Route[]): KafkaLinked;
}
```

**`link`** Prepare the consumer of the routes. It connects nothing: `start()` of
the linked application does.

**`sender`** Sends messages with the producer of the adapter: give it to a
`ChoMessageClient`. It can be given before the application is created,
and it sends once `ChoMessage.create` linked the application: the
producer connects on its first message.

Kafka has no replies: this sender publishes, and a request on it throws.

**`constructor`** Create a linker. Nothing is connected yet.

### Usage {#KafkaLinker-usage}

```ts
import { ChoMessage } from "@chojs/message";
import { KafkaLinker } from "@chojs/vendor-kafka";

const app = await ChoMessage.create(AppModule, {
  linker: new KafkaLinker({ brokers: ["kafka:9092"], groupId: "mailer" }),
});
await app.start();
```

Retries, dead letters and TLS
```ts
new KafkaLinker({
  brokers: ["kafka:9093"],
  groupId: "mailer",
  retries: 5,
  retryDelay: (retry) => 500 * 2 ** retry,
  deadLetter: (topic) => `${topic}.dead`,
  concurrency: 8,
  client: {
    tls: {},
    sasl: { mechanism: "SCRAM-SHA-512", username, password },
  },
});
```
```ts
const linker = new KafkaLinker({ brokers, groupId: "shop" });
const client = new ChoMessageClient(linker.sender);
```

## KafkaLinkerOptions {#symbol-KafkaLinkerOptions}

The options of `KafkaLinker`.

```ts
export type KafkaLinkerOptions = {
    readonly brokers: readonly string[];
    readonly groupId: string;
    readonly clientId?: string | undefined;
    readonly from?: "earliest" | "latest" | undefined;
    readonly retries?: number | undefined;
    readonly retryDelay?: number | ((retry: number) => number) | undefined;
    readonly deadLetter?: string | ((topic: string) => string) | undefined;
    readonly concurrency?: number | undefined;
    readonly onFatal?: ((error: Error) => void) | undefined;
    readonly client?: KafkaClientOptions | undefined;
    readonly consume?: KafkaConsumeOptions | undefined;
};
```

**`brokers`** The brokers to connect first, as `host:port`. At least one.

**`groupId`** The consumer group: the name of the application for Kafka. Every instance
of the application has the same one, and shares the partitions with the
others.

**`clientId`** The name of this client, for the logs of the brokers. Default: the group.

**`from`** Where the group starts in a topic it never read: at the `"earliest"`
message that Kafka still has, or after the `"latest"`. Default:
`"latest"`, as Kafka does.

**`retries`** How many times a message that failed is tried again, in place, before it
is dead. Default: `3`. `0`: never.

**`retryDelay`** The milliseconds to wait before a retry: a number, or a function of the
retry (`1` for the first). Default: `1000`.

**`deadLetter`** The topic a dead message is sent to: a name, or a function of the topic
of the message. Without it, a dead message stops the consumer.

**`concurrency`** How many messages are in hand at once. The messages of one partition are
always handled one at a time, in order. Default: `1`.

**`onFatal`** Called when the consumer stopped by itself: a dead message with no
dead-letter topic, or a connection that cannot be restored. Default: the
error is thrown, and ends the process when nothing catches it.

**`client`** The options of the connection: `tls`, `sasl`, …

**`consume`** More options for the consumer: `sessionTimeout`, `maxBytes`, …

### Usage {#KafkaLinkerOptions-usage}

```ts
const linked = new KafkaLinker({
      ...OPTIONS,
      client: { connectTimeout: 200, retries: 0 },
    }).link([route("orders")]);
```

[Usage in vendor/kafka/mod_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/kafka/mod_test.ts#L185)

## KafkaMessage {#symbol-KafkaMessage}

A message of Kafka, as the client library gives it: bytes, not decoded.

```ts
export type KafkaMessage = Message<Buffer, Buffer, Buffer, Buffer>;
```

### Usage {#KafkaMessage-usage}

```ts
push(...items: (KafkaMessage | Error | null)[]) {
    this.#queue.push(...items);
    this.#wake?.();
  }
```

[Usage in vendor/kafka/consume_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/kafka/consume_test.ts#L39)

## KafkaNative {#symbol-KafkaNative}

What a handler finds in `ctx.native` on this adapter.

```ts
export type KafkaNative = {
    readonly message: KafkaMessage;
    readonly attempt: number;
};
```

**`message`** The message of the client library: partition, offset, timestamp, …

**`attempt`** `1` the first time the message is handled, `2` on its first retry, …

### Usage {#KafkaNative-usage}

```ts
attempts.push(`${text}#${(ctx.native as KafkaNative).attempt}`);
```

[Usage in vendor/kafka/kafka_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/kafka/kafka_test.ts#L187)

## KafkaProducer {#symbol-KafkaProducer}

The producer of the client library, writing bytes.

```ts
export type KafkaProducer = Producer<Buffer, Buffer, Buffer, Buffer>;
```

### Usage {#KafkaProducer-usage}

```ts
const producer: KafkaProducer = app.linked.instance.producer;
```

## KafkaSender {#symbol-KafkaSender}

The sender of the Kafka adapter.

`publish` sends a message with the producer of the adapter: its value, its
key and its headers. A message with no value is sent with none.

There is no `request`: Kafka has no replies, and
`ChoMessageClient.request` throws `CHO_MESSAGE_NO_REPLIES` on this sender.

```ts
export class KafkaSender implements Sender {

    constructor(producer: () => KafkaProducerLike);
    publish(topic: string, delivery: Delivery): Promise<void>;
}
```

**`publish`** Send a message.

**`constructor`** Make a sender. The linker of the adapter does: `linker.sender`.

### Usage {#KafkaSender-usage}

```ts
await assert.rejects(
      new KafkaSender(() => {
        throw missing;
      }).publish("orders", {}),
      missing,
    );
```

[Usage in vendor/kafka/send_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/kafka/send_test.ts#L85)

## Also exported here

These declarations share their implementation with another entry point. Each link opens the full declaration.

[`Linked`](/api/message#symbol-Linked), [`Linker`](/api/message#symbol-Linker), [`Route`](/api/message#symbol-Route), [`Sender`](/api/message#symbol-Sender)
