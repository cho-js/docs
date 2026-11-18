# Consume inventory events from Kafka

`@chojs/vendor-kafka` connects a CHO message application to Kafka through `@platformatic/kafka` on Node.js. Start with a reachable broker, a `books.received` topic and the `Library` module from the [inventory tutorial](/message/quick-start). Provision the dead-letter topic used below as well.

## Start the consumer

In the Node.js project containing `app.ts`, install the adapter with `npx jsr add @chojs/vendor-kafka`. Save the following as `worker.ts` and run `npx tsx worker.ts`.

```ts
import { ChoMessage } from "@chojs/message";
import { KafkaLinker } from "@chojs/vendor-kafka";
import { Library } from "./app.ts";

const app = await ChoMessage.create(Library, {
  linker: new KafkaLinker({
    brokers: ["localhost:9092"],
    groupId: "inventory",
    from: "earliest",
    retries: 2,
    retryDelay: 500,
    deadLetter: (topic) => topic + ".failed",
  }),
});
try {
  await app.start();
} catch (error) {
  await app.close();
  throw error;
}
process.once("SIGINT", () => void app.close());
process.once("SIGTERM", () => void app.close());
```

Publish `{"isbn":"9780140268867"}` to `books.received` using your Kafka producer. The consumer prints the ISBN. To exercise the failure policy, publish `{"isbn":17}`. With this configuration the adapter attempts it three times in total, then publishes to `books.received.failed` before committing the original offset.

## Choose offset and retry settings

| Setting | Default | Operational effect |
| --- | --- | --- |
| `brokers`, `groupId` | Required | Bootstrap addresses and consumer group |
| `clientId` | Group ID | Name reported to Kafka |
| `from` | `"latest"` | Fallback when the group has no committed offset. Also accepts `"earliest"` |
| `retries` | `3` | Additional attempts after the first failure |
| `retryDelay` | `1000` ms | Fixed delay or function of the retry number |
| `deadLetter` | Unset | Fixed destination or function of the source topic |
| `concurrency` | `1` | Maximum in-flight records. Each partition retains its order |
| `onFatal` | Throws the error | Called after a fatal stop for process-level reporting or recovery |
| `client`, `consume` | Optional | Client and consumption settings. The adapter controls subscriptions and commits |

A handled delivery commits its offset. An error handler can settle a record by returning `true` or a fallback reply. Both bypass retries.

Kafka ignores reply bytes from subscriptions and error handlers and commits the handled record. With `cho:kafka` debugging enabled, the first ignored reply per route is logged. Use the linked producer below when a result needs its own Kafka record.

After retry exhaustion without a dead-letter destination, or if writing the dead letter fails, the consumer stops and leaves the failed offset uncommitted. Each dead letter carries the original payload and diagnostic headers including `cho-topic`, `cho-partition`, `cho-offset`, `cho-group`, `cho-attempts` and `cho-error`.

## Design for redelivery

A successful application write can precede a failed offset commit. Use a stable event identifier for writes that must tolerate repeated delivery. Increasing concurrency allows different partitions to progress independently. Records in the same partition remain ordered, including during retries.

The adapter exposes `{ message, attempt }` through `ctx.native` as `KafkaNative`. The first attempt is `1`. Use the native message for raw key or repeated header bytes. For publishing, the linked client exposes `app.linked.instance.producer.send({ messages })`. Direct `app.handle` tests bypass Kafka. For a reproducible two-record exercise, [verify Kafka delivery and retries](/message/kafka-check).

## Publish with the linked producer

To publish a follow-up event from the worker process, use the producer on the started application. The following fragment sends the same shape that the inventory handler accepts:

```ts
import { Buffer } from "node:buffer";

await app.linked.instance.producer.send({
  messages: [{
    topic: "books.received",
    key: Buffer.from("copy-17"),
    value: Buffer.from(JSON.stringify({ isbn: "9780140268867" })),
  }],
});
```

Successful `send` reports publication. For an end-to-end check, separately observe the consumer's side effect or committed offset. The linked producer is also used for dead letters. Closing the started application closes its Kafka clients.
