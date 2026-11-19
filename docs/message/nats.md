# Ask a service for a reply over NATS

Use `@chojs/vendor-nats` when a caller needs an answer from a running message service. Each complete CHO topic becomes a NATS subject. If several instances subscribe in the same queue group, NATS selects one to handle each request.

## Run a shelf lookup

Start a local Core NATS server in a separate terminal. If you use Docker, this command binds the service to loopback. Leave it running while you try the example.

```sh
docker run --rm -p 127.0.0.1:4222:4222 nats:2
```

The adapter and reply headers ship in 3.5.0. To follow the example with Deno, save the example below as `examples/library-nats.ts` in the [CHO checkout](/guide/getting-started#run-examples-against-the-development-version). The workspace already declares the Deno transport. Run this command from the repository root.

```sh
deno run --allow-net=127.0.0.1:4222 examples/library-nats.ts
```

<<< @/examples/message/nats.ts

The service subscribes to `books.locate`. Once `start()` resolves, its subscriptions are ready and the example uses the active connection to ask about two copies. A separate application can make the same `request` using its own connection. Expect these lines on stdout.

```text
copy-17 B2 application/json
copy-99 404 Unknown copy
```

Read the service-error header before decoding the payload. The missing copy produces a reply with an empty body and a `404` service code. A request that times out or has no responder rejects at the NATS client. When finished, stop the example broker with Ctrl+C.

## Choose between a request and an event

| Subscription outcome | Caller uses `nc.request` | Publisher uses `nc.publish` |
| --- | --- | --- |
| Returns a value | Receives the encoded payload and any [reply headers](/message/replies#attach-headers-to-a-reply) | The adapter drops the reply |
| Returns nothing | Receives an empty reply | Processing ends |
| Fails after CHO error handling | Receives a service-error reply | The event is lost. The failure appears in the adapter's debug output when enabled |

Core NATS delivers at most once. Use a request when the caller needs to know the outcome. For durable events on the same connection, configure [JetStream streams and consumers](/message/jetstream). For typed requests across services, share a [message contract](/message/contracts) and give `linker.sender` to [`ChoMessageClient`](/api/message#symbol-ChoMessageClient). The NATS sender uses a default request timeout of 1000 ms.

## Map a failure for the caller

An [`@Catch`](/api/message#symbol-Catch) that returns a fallback value produces an ordinary successful reply. If a [`ReplyError`](/api/message#symbol-ReplyError) reaches the adapter, its code and description go directly to the requester. For other failures, `errorReply(error, message)` can supply `{ code, description, value? }`, as the example does for `UnknownCopy`. Returning `undefined` selects the default empty service-error reply. Invalid input rejected by CHO validation gets `400 Bad Request` and other failures get `500 Internal Error`. Enable the adapter's debug output to see the original exception.

## Configure a worker

| Setting | What it controls |
| --- | --- |
| `connect` | Required callback that opens the connection on `start()`. Set servers, credentials, TLS and reconnect policy on the transport |
| `queue` | Required queue group. Give replicas of one service the same name to divide the work |
| `concurrency` | In-flight handlers **per subject**. The default of `1` preserves order within a subject. Other subjects can progress independently |
| `onFatal` | Called after a permanent connection closure or subscription failure. The default throws. Use this hook for process-level recovery |

Use `@nats-io/transport-deno` on Deno and `@nats-io/transport-node` on Node.js or Bun. For a WebSocket listener, supply `wsconnect` from `@nats-io/nats-core`. The linker owns the supplied connection and drains pending work and replies on `app.close()`.

For incoming messages, `ctx.headers` contains the first value of each header and `ctx.key` is `undefined`. If a handler needs repeated headers or the reply address, read `(ctx.native as NatsNative).message`, importing the type from `@chojs/vendor-nats`. Set `CHO_DEBUGLOG=cho:nats,cho:message` to trace subscriptions and deliveries. On Deno, add `--allow-env=CHO_DEBUGLOG` to the run command.

## Choose who receives a request

Run two instances with the same queue when they should share work. Send one request and observe a single response. Use separate subject or queue arrangements for independent subscribers that must each observe an event. For replay after downtime, choose JetStream.

## Handle a closed connection or rejected subscription

The adapter stops by itself in two cases: the connection closed and the client
does not connect again (`CHO_NATS_CONNECTION_CLOSED`), or a subscription failed,
as one the server refuses does (`CHO_NATS_SUBSCRIPTION_FAILED`). It then
finishes the messages in hand, closes what is still open, and calls `onFatal`
with the error (its `cause` is the error of the client).

nats.js connects again by itself: 10 times by default, 2 seconds apart. Give
`maxReconnectAttempts: -1` to `connect` for a client that never gives up.

Without `onFatal`, the error is thrown: an uncaught exception, which ends the
process, so that what runs the application starts it again. Give `onFatal` to do
something else:

```ts
new NatsLinker({
  connect,
  queue: "shop",
  onFatal: async (error) => {
    logger.fatal(error);
    await app.close(); // the adapter is stopped already: this ends the rest
    process.exit(1);
  },
});
```

## Read the native NATS message

`ctx.native` is the message of the client library, in a [`NatsNative`](/api/vendor-nats#symbol-NatsNative):

```ts
import type { NatsNative } from "@chojs/vendor-nats";

@Subscribe("created")
created(ctx: ChoMessageContext) {
  const { message } = ctx.native as NatsNative;
  message.subject; // "shop.orders.created"
  message.reply; //   where a reply goes, when one was asked
  message.headers?.values("Trace"); // every value of a header
}
```

`ctx.headers` has the first value of each header, and `ctx.key` is `undefined`:
NATS has no key. Code that reads `ctx.native` runs on this adapter only.
