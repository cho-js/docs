# Connect a broker to compiled subscriptions

The message package owns parsing, middleware and error handling. An adapter owns the connection and the broker's acknowledgment policy. Its input is a list of routes with complete topic names.

## Implement the lifecycle

| Stage | Adapter responsibility |
| --- | --- |
| `link(routes)` | Build a topic index and return a `Linked<T>` with `instance`, `start` and `stop`. Keep this step free of broker I/O |
| `start()` | Connect and subscribe. Resolve once subscriptions are ready |
| Incoming record | Translate to `Delivery`, call the selected `route.handle(delivery, native)` and await it |
| `stop()` | Stop intake, settle in-flight operations and close client resources |

Import `Linker`, `Linked`, `Route` and `Delivery` from `@chojs/message/linker`. Keys and headers are strings. Values may be bytes, a string or `null`. Use `native` for broker-specific details that portable handlers can ignore.

## Keep delivery and acknowledgment distinct

This callback illustrates the boundary with a client that exposes `ack` and `retry` operations. Adapt those operations to the actual broker.

```ts
import type { Delivery, Reply, Route } from "@chojs/message/linker";

interface BrokerRecord {
  delivery: Delivery;
  sendReply?(reply: Reply): Promise<void>;
  ack(): Promise<void>;
  retry(error: unknown): Promise<void>;
}

async function dispatch(route: Route, record: BrokerRecord) {
  try {
    const reply = await route.handle(record.delivery, record);
    if (reply && record.sendReply) await record.sendReply(reply);
  } catch (error) {
    await record.retry(error);
    return;
  }
  await record.ack();
}
```

For a request with a reply address, bind `sendReply` to that address, send `reply.value`, copy `reply.headers` when supported and carry over the broker's correlation ID. Event-only adapters can ignore the result. This example treats failure to send the reply as retryable, so delivery can run again. The [Core NATS adapter](/message/nats) has its own policy, including an empty response when a request handler returns nothing.

An acknowledgment failure happens after the handler may have written data. Account for redelivery when designing that write. Specify ordering, concurrency, retry limits and what happens when retries are exhausted. The [Kafka adapter](/message/kafka) documents these decisions for a concrete broker.
