# Consume inventory events from Kafka

`@chojs/vendor-kafka` runs on **Node.js, Deno and Bun**. The upstream client, `@platformatic/kafka`, targets Node.js (22.22 or 24.6 and later). CHO has also tested the adapter against a real broker on Deno 2.9 and Bun 1.4 through their Node compatibility layers. Recheck the broker tests when upgrading the client on those runtimes.

The broker tests use a plaintext connection. TLS, SASL and compression are outside that coverage. [Cloudflare Workers](/guide/cloudflare-workers) supports local CHO message handling. Run the Kafka consumer in a server process.

To save CI time, the dedicated Kafka integration job uses Node.js. To run the same real-broker suite on Deno or Bun, see [Verify Kafka delivery and retries](/message/kafka-check#check-the-adapter-on-your-runtime).

## Start the consumer

Start with `app.ts` from the [inventory tutorial](/message/quick-start) and provision the topics `books.received` and `books.received.failed`. Install the adapter and run the same `worker.ts` with the commands for your runtime.

| Runtime | Install | Start |
| --- | --- | --- |
| Node.js | `npx jsr add @chojs/vendor-kafka` | `npx tsx worker.ts` |
| Deno | `deno add jsr:@chojs/vendor-kafka` | `deno run --allow-read --allow-net --allow-env worker.ts` |
| Bun | `bunx jsr add @chojs/vendor-kafka` | `bun run worker.ts` |

On Deno the client reads a file during import, before it opens its network connection. Include read access as well as network and environment access.

```ts
import process from "node:process";
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

The inventory tutorial throws its own `TypeError` for an invalid ISBN, so that example exercises the ordinary retry policy. If a route instead uses [CHO validation](/message/arguments) and the delivery rejects with `CHO_MESSAGE_INVALID_MESSAGE`, Kafka skips retries and immediately applies the dead-letter policy.

A successful application write can precede a failed offset commit. Use a stable event identifier for writes that must tolerate repeated delivery. Increasing concurrency allows different partitions to progress independently. Records in the same partition remain ordered, including during retries.

The adapter exposes `{ message, attempt }` through `ctx.native` as `KafkaNative`. The first attempt is `1`. Use the native message for raw key or repeated header bytes. For publishing, the linked client exposes `app.linked.instance.producer.send({ messages })`. Direct `app.handle` tests bypass Kafka. For a reproducible two-record exercise, [verify Kafka delivery and retries](/message/kafka-check).

## Publish with the linked producer

For a [typed event](/message/contracts), retain the `KafkaLinker` passed to `ChoMessage.create` and use `new ChoMessageClient(linker.sender)` from `@chojs/message`. For example, given a `BookReceived` contract, call `await client.publish(BookReceived, { isbn }, { key: copyId })`. The Kafka sender is ready once the application is created. The producer connects on first use. Calling `request` rejects with `CHO_MESSAGE_NO_REPLIES`.

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
