---
outline: 2
---

# @chojs/vendor-nats

Choose Core NATS for a live request/reply service and JetStream for a durable subscription. The transport connection is supplied by the host. [Request a reply or consume durable events](/message/nats) · [Browse all packages](/api/)

## BAD_REQUEST {#symbol-BAD_REQUEST}

What a requester is told, when nothing else is said, for a message that is
not valid: the mistake is its own.

```ts
export const BAD_REQUEST: NatsErrorReply;
```

### Usage {#BAD_REQUEST-usage}

```ts
assert.deepEqual(BAD_REQUEST, { code: 400, description: "Bad Request" });
```

[Usage in vendor/nats/consume_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/consume_test.ts#L573)

## ChoNatsErrorCode {#symbol-ChoNatsErrorCode}

The codes of the errors of `@chojs/vendor-nats`. Each is described in `specs.md`, section 8.

A mistake the core finds for the package has a code of the core
(`ChoCoreErrorCode` of `@chojs/core`): an unknown option is
`CHO_CORE_UNKNOWN_OPTION`.

```ts
export type ChoNatsErrorCode = "CHO_NATS_ALREADY_LINKED" | "CHO_NATS_CONNECTION_CLOSED" | "CHO_NATS_CONSUMER_FAILED" | "CHO_NATS_DEAD_LETTER_FAILED" | "CHO_NATS_DUPLICATE_CONSUMER" | "CHO_NATS_INVALID_CONNECTION" | "CHO_NATS_INVALID_DEAD_LETTER" | "CHO_NATS_INVALID_JETSTREAM" | "CHO_NATS_INVALID_OPTION" | "CHO_NATS_NOT_STARTED" | "CHO_NATS_REPLY_FAILED" | "CHO_NATS_STREAM_NOT_FOUND" | "CHO_NATS_SUBSCRIPTION_FAILED";
```

### Usage {#ChoNatsErrorCode-usage}

```ts
const CODES: Record<ChoNatsErrorCode, true> = {
  CHO_NATS_ALREADY_LINKED: true,
  CHO_NATS_CONNECTION_CLOSED: true,
  CHO_NATS_CONSUMER_FAILED: true,
  CHO_NATS_DEAD_LETTER_FAILED: true,
  CHO_NATS_DUPLICATE_CONSUMER: true,
  CHO_NATS_INVALID_CONNECTION: true,
  CHO_NATS_INVALID_DEAD_LETTER: true,
  CHO_NATS_INVALID_JETSTREAM: true,
  CHO_NATS_INVALID_OPTION: true,
  CHO_NATS_NOT_STARTED: true,
  CHO_NATS_REPLY_FAILED: true,
  CHO_NATS_STREAM_NOT_FOUND: true,
  CHO_NATS_SUBSCRIPTION_FAILED: true,
};
```

[Usage in vendor/nats/errors_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/errors_test.ts#L8)

## ConsumerSettings {#symbol-ConsumerSettings}

The consumer the adapter makes for a route.

```ts
export type ConsumerSettings = {
    durable_name: string;
    ack_policy: "explicit";
    filter_subject: string;
    ack_wait: number;
    max_deliver: -1;
    max_ack_pending: number;
};
```

**`durable_name`** The name of the consumer: it is durable.

**`ack_policy`** Each message is acknowledged by itself.

**`filter_subject`** The subject of the route.

**`ack_wait`** How long a handler has, in nanoseconds.

**`max_deliver`** No limit: the adapter counts the deliveries itself.

**`max_ack_pending`** How many messages are not acknowledged yet at once.

### Usage {#ConsumerSettings-usage}

```ts
readonly made: [string, ConsumerSettings][] = [];
```

[Usage in vendor/nats/stream_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/stream_test.ts#L118)

## DEAD_LETTER_HEADERS {#symbol-DEAD_LETTER_HEADERS}

The headers the adapter adds to a dead letter.

```ts
export const DEAD_LETTER_HEADERS: {
    readonly topic: "cho-topic";
    readonly stream: "cho-stream";
    readonly sequence: "cho-sequence";
    readonly consumer: "cho-consumer";
    readonly attempts: "cho-attempts";
    readonly error: "cho-error";
};
```

### Usage {#DEAD_LETTER_HEADERS-usage}

```ts
assert.equal(
      with_dead.jetstream.published[0]!.headers[DEAD_LETTER_HEADERS.attempts],
      "1",
    );
```

[Usage in vendor/nats/stream_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/stream_test.ts#L721)

## ERROR_HEADERS {#symbol-ERROR_HEADERS}

The headers of an error reply: the ones a NATS service answers with, so a
requester reads an error of a CHO application as it reads any other.

```ts
export const ERROR_HEADERS: {
    readonly description: "Nats-Service-Error";
    readonly code: "Nats-Service-Error-Code";
};
```

**`description`** What went wrong.

**`code`** The code of the error.

### Usage {#ERROR_HEADERS-usage}

```ts
const { sender } = sender_of(() =>
      reply("", [
        [ERROR_HEADERS.description, ["Not Found"]],
        [ERROR_HEADERS.code, ["404"]],
      ])
    );
```

[Usage in vendor/nats/send_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/send_test.ts#L176)

## INTERNAL_ERROR {#symbol-INTERNAL_ERROR}

What a requester is told when nothing else is said.

```ts
export const INTERNAL_ERROR: NatsErrorReply;
```

### Usage {#INTERNAL_ERROR-usage}

```ts
assert.deepEqual(INTERNAL_ERROR, {
      code: 500,
      description: "Internal Error",
    });
```

[Usage in vendor/nats/consume_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/consume_test.ts#L513)

## JetStreamClientLike {#symbol-JetStreamClientLike}

What the adapter needs of the JetStream client.

```ts
export interface JetStreamClientLike {
    readonly consumers: {
        get(stream: string, name: string): Promise<JetStreamConsumerLike>;
    };
    publish(subject: string, data?: Uint8Array, options?: {
        headers?: MsgHdrs;
    }): Promise<unknown>;
    jetstreamManager(): Promise<JetStreamManagerLike>;
}
```

**`publish`** Publish a message, and wait until a stream has it.

**`jetstreamManager`** The manager: what makes consumers, and tells of streams.

**`consumers`** The consumers of the client.

### Usage {#JetStreamClientLike-usage}

```ts
const app = await ChoMessage.create(App, {
      prefix,
      linker: new NatsLinker({
        connect,
        queue: unique("queue"),
        jetstream: {
          client: (nc): JetStreamClientLike => jetstream(nc),
          streams: [stream],
        },
      }),
    });
```

[Usage in vendor/nats/nats_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/nats_test.ts#L988)

## JetStreamConsumerLike {#symbol-JetStreamConsumerLike}

What the adapter needs of a consumer of the JetStream client.

```ts
export interface JetStreamConsumerLike {
    consume(options?: {
        max_messages?: number;
    }): Promise<JetStreamMessagesLike>;
}
```

**`consume`** Ask for the messages of the consumer, as they come.

### Usage {#JetStreamConsumerLike-usage}

```ts
readonly consumers: {
    /** A consumer, by its stream and its name. */
    get(stream: string, name: string): Promise<JetStreamConsumerLike>;
  };
```

[Usage in vendor/nats/stream.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/stream.ts#L74)

## JetStreamManagerLike {#symbol-JetStreamManagerLike}

What the adapter needs of the manager of the JetStream client.

```ts
export interface JetStreamManagerLike {
    readonly streams: {
        info(stream: string): Promise<{
            config: {
                subjects?: string[];
            };
        }>;
    };
    readonly consumers: {
        add(stream: string, config: ConsumerSettings): Promise<unknown>;
    };
}
```

**`streams`** The streams of the server.

**`consumers`** The consumers of the server.

### Usage {#JetStreamManagerLike-usage}

```ts
let manager: JetStreamManagerLike;
```

[Usage in vendor/nats/stream.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/stream.ts#L268)

## JetStreamMessageLike {#symbol-JetStreamMessageLike}

What the adapter needs of a message of a stream.

```ts
export interface JetStreamMessageLike {
    readonly subject: string;
    readonly data: Uint8Array;
    readonly headers?: Iterable<[
        string,
        string[]
    ]> | undefined;
    readonly seq: number;
    readonly info: {
        readonly deliveryCount: number;
    };
    ack(): void;
    nak(millis?: number): void;
    term(reason?: string): void;
}
```

**`ack`** The message is handled: it is not delivered again.

**`nak`** The message failed: deliver it again, after `millis`.

**`term`** The message is given up: it is not delivered again.

**`subject`** The subject the message was published to.

**`data`** The payload.

**`headers`** The headers: each name, with its values.

**`seq`** The sequence of the message in its stream.

**`info`** Where the message comes from, and how many times it was delivered.

### Usage {#JetStreamMessageLike-usage}

```ts
push(...items: (JetStreamMessageLike | Error | null)[]) {
    this.#queue.push(...items);
    this.#wake?.();
  }
```

[Usage in vendor/nats/stream_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/stream_test.ts#L75)

## JetStreamMessagesLike {#symbol-JetStreamMessagesLike}

The messages of a consumer, in the order they are delivered.

```ts
export interface JetStreamMessagesLike extends AsyncIterable<JetStreamMessageLike> {
    close(): Promise<void | Error>;
}
```

**`close`** Ask for no more messages. The iteration ends.

### Usage {#JetStreamMessagesLike-usage}

```ts
class FakeMessages implements JetStreamMessagesLike {
  readonly #queue: (JetStreamMessageLike | Error | null)[] = [];
  #wake: (() => void) | undefined;
  closed = 0;
  close_error: Error | undefined;

  /** Give a message, an error that ends the consumer, or `null`: its end. */
  push(...items: (JetStreamMessageLike | Error | null)[]) {
    this.#queue.push(...items);
    this.#wake?.();
  }

  close() {
    this.closed++;
    if (this.close_error) {
      return Promise.reject(this.close_error);
    }
    this.push(null);
    return Promise.resolve();
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<JetStreamMessageLike> {
    while (true) {
      while (this.#queue.length === 0) {
        await new Promise<void>((resolve) => (this.#wake = resolve));
      }
      const item = this.#queue.shift()!;
      if (item === null) {
        return;
      }
      if (item instanceof Error) {
        throw item;
      }
      yield item;
    }
  }
}
```

[Usage in vendor/nats/stream_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/stream_test.ts#L68)

## NatsConnectionLike {#symbol-NatsConnectionLike}

What the adapter needs of the connection of the client library.

```ts
export interface NatsConnectionLike {
    subscribe(subject: string, options: {
        queue: string;
    }): NatsSubscriptionLike;
    publish(subject: string, data?: Uint8Array, options?: {
        headers?: MsgHdrs;
    }): void;
    request(subject: string, data?: Uint8Array, options?: {
        timeout: number;
        headers?: MsgHdrs;
    }): Promise<NatsMessageLike>;
    flush(): Promise<void>;
    drain(): Promise<void>;
    closed(): Promise<void | Error>;
    isClosed(): boolean;
}
```

**`subscribe`** Subscribe to a subject, as a member of a queue group.

**`publish`** Send a message.

**`request`** Send a message that asks for a reply, and wait for it.

**`flush`** Resolves when the server has what was sent.

**`drain`** End every subscription, send what is left, and close.

**`closed`** Resolves when the connection closes, with the error that closed it.

**`isClosed`** Whether the connection is closed.

### Usage {#NatsConnectionLike-usage}

```ts
const pump = new Pump(
        [route("orders")],
        () => given as unknown as NatsConnectionLike,
        settings(),
      );
```

[Usage in vendor/nats/consume_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/consume_test.ts#L381)

## NatsErrorReply {#symbol-NatsErrorReply}

What a requester is told when its message failed.

```ts
export type NatsErrorReply = {
    readonly code: number;
    readonly description: string;
    readonly value?: Uint8Array | string | undefined;
};
```

**`code`** The code, as the `Nats-Service-Error-Code` header: `500`, `404`, …

**`description`** What went wrong, as the `Nats-Service-Error` header. One line.

**`value`** The payload of the reply. Default: empty.

### Usage {#NatsErrorReply-usage}

```ts
export const INTERNAL_ERROR: NatsErrorReply = {
  code: 500,
  description: "Internal Error",
};
```

[Usage in vendor/nats/consume.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/consume.ts#L127)

## NatsErrorReplyFn {#symbol-NatsErrorReplyFn}

Decides what a requester is told when its message failed.

```ts
export type NatsErrorReplyFn = (error: unknown, message: NatsMessage) => NatsErrorReply | undefined | void;
```

### Usage {#NatsErrorReplyFn-usage}

```ts
readonly errorReply?: NatsErrorReplyFn | undefined;
```

[Usage in vendor/nats/mod.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/mod.ts#L178)

## NatsJetStreamOptions {#symbol-NatsJetStreamOptions}

The streams of an application, and what a failed message of one leads to:
the `jetstream` option of `NatsLinker`.

```ts
export type NatsJetStreamOptions<C extends NatsConnectionLike = NatsConnection> = {
    readonly client: (connection: C) => JetStreamClientLike;
    readonly streams: readonly string[];
    readonly retries?: number | undefined;
    readonly retryDelay?: number | ((retry: number) => number) | undefined;
    readonly deadLetter?: string | ((topic: string) => string) | undefined;
    readonly ackWait?: number | undefined;
};
```

**`client`** Makes the JetStream client of the connection: `jetstream` of
`@nats-io/jetstream`, which the application imports as it imports its
transport.

**`streams`** The streams of the application, by their names. A route whose subject is
a subject of one of them is consumed from it; every other route is a
core subscription. The adapter does not create a stream: `start()`
rejects for one that does not exist.

**`retries`** How many times a message that failed is delivered again, before it is
dead. Default: `3`. `0`: never.

**`retryDelay`** The milliseconds before a retry: a number, or a function of the retry
(`1` for the first). Default: `1000`.

**`deadLetter`** The subject a dead message is published to: a name, or a function of
the topic of the message. It must be a subject of a stream. Without it,
a dead message is ended, and logged.

**`ackWait`** The milliseconds a handler has: a message that is not settled by then
is delivered again. Default: `30000`, as NATS.

### Usage {#NatsJetStreamOptions-usage}

```ts
const app = await ChoMessage.create(AppModule, {
  linker: new NatsLinker({
    connect: () => connect({ servers }),
    queue: "example",
    jetstream: {
      client: (nc) => jetstream(nc),
      streams: ["EXAMPLE_ORDERS"],
      retries: 2,
      retryDelay: 200,
      deadLetter: (topic) => `dead.${topic}`,
    },
  }),
});
```

[Usage in examples/nats-stream.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/nats-stream.ts#L85)

## NatsLinked {#symbol-NatsLinked}

A message application linked to NATS by `NatsLinker`.

`ChoMessage` starts and stops it: `app.start()` and `app.close()`.

```ts
export class NatsLinked<C extends NatsConnectionLike = NatsConnection> implements Linked<C> {

    constructor(pump: Pump<C>);
    get instance(): C;
    start(): Promise<void>;
    stop(): Promise<void>;
}
```

**`instance`** The connection of the application, once `start()` resolved: publish and
request with it. The adapter closes it on `stop()`.

**`start`** Connect, and subscribe to the subject of each route. It resolves when the
server has the subscriptions.

**`stop`** Receive nothing more, handle and answer the messages that were received,
send what is left and close the connection.

**`constructor`** Wrap what subscribes an application. `NatsLinker.link` calls it.

### Usage {#NatsLinked-usage}

```ts
assert.ok(linked instanceof NatsLinked);
```

[Usage in vendor/nats/mod_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/mod_test.ts#L274)

## NatsLinker {#symbol-NatsLinker}

Subscribes the topics of a CHO message application to NATS, and answers the
messages that ask for a reply.

NATS only delivers: each message goes to `Route.handle`, which
`@chojs/message` built. Middlewares and error handlers are
`@chojs/message`'s, so they behave the same on every adapter.

- **The application is one queue group** (`queue`). A topic is a subject of
  NATS, named as it is in the application (`shop.orders.created`), and a
  message of it goes to one instance of the application.
- **What a handler returns is the reply** of a message that asks for one (a
  request). A handler that returns nothing answers with an empty reply. For
  a message that asks for none, what the handler returns is dropped.
- **A request that failed is answered with an error reply**: the headers
  `ERROR_HEADERS`, as a NATS service does. A `ReplyError` the
  handler threw gives its code and its description; for any other error
  `errorReply` decides, and by default they are `500` and `Internal Error`.
- **`sender` sends**, for a `ChoMessageClient` of `@chojs/message`: it
  publishes and requests with the connection of the application.
- **A message that failed and asks for no reply is lost**, and logged: this
  is core NATS, delivery is at most once, and nothing is tried again.
- **One message at a time for each subject**, in the order they came.
  `concurrency` (1) is how many messages of one subject are in hand at once.
- **`ctx.native`** is a `NatsNative`: the message of the client
  library (`subject`, `reply`, every value of the headers).

```ts
export class NatsLinker<C extends NatsConnectionLike = NatsConnection> implements Linker<C> {

    readonly sender: Sender;
    constructor(options: NatsLinkerOptions<C>);
    link(routes: readonly Route[]): NatsLinked<C>;
}
```

**`link`** Prepare the subscriptions of the routes. It connects nothing: `start()`
of the linked application does.

**`sender`** Sends messages with the connection of the application: give it to a
`ChoMessageClient`. It can be given before the application is created,
and it sends once `app.start()` was called: it waits for a start that is
not done yet.

**`constructor`** Create a linker. Nothing is connected yet.

### Usage {#NatsLinker-usage}

```ts
import { connect } from "@nats-io/transport-node";
import { ChoMessage } from "@chojs/message";
import { NatsLinker } from "@chojs/vendor-nats";

const app = await ChoMessage.create(AppModule, {
  linker: new NatsLinker({
    connect: () => connect({ servers: "nats:4222" }),
    queue: "mailer",
  }),
});
await app.start();

// the connection of the application: publish and request with it
app.linked.instance.publish("shop.orders.created", JSON.stringify(order));
```

What a requester is told when a handler failed
```ts
new NatsLinker({
  connect: () => connect({ servers: "nats:4222" }),
  queue: "mailer",
  concurrency: 8,
  errorReply: (error) =>
    error instanceof NotFound
      ? { code: 404, description: "Not Found" }
      : undefined, // 500, Internal Error
});
```
```ts
const linker = new NatsLinker({ connect, queue: "shop" });
const client = new ChoMessageClient(linker.sender);
```

## NatsLinkerOptions {#symbol-NatsLinkerOptions}

The options of `NatsLinker`.

```ts
export type NatsLinkerOptions<C extends NatsConnectionLike = NatsConnection> = {
    readonly connect: () => C | Promise<C>;
    readonly queue: string;
    readonly concurrency?: number | undefined;
    readonly errorReply?: NatsErrorReplyFn | undefined;
    readonly onFatal?: ((error: Error) => void) | undefined;
    readonly jetstream?: NatsJetStreamOptions<C> | undefined;
};
```

**`connect`** Connects to NATS: `connect` of the transport of the runtime, with the
options of the application (the servers, the credentials, TLS, how many
times the client connects again, …). The adapter calls it once, on
`start()`, and closes the connection on `stop()`.

**`queue`** The queue group: the name of the application for NATS. Every instance of
the application has the same one, and a message goes to one of them.

**`concurrency`** How many messages of one subject are in hand at once. With `1`, the
messages of a subject are handled in the order they came. Default: `1`.

**`errorReply`** What a requester is told when its message failed: the code and the
description of the error reply. It receives the error, and the message of
the client library. Default, and when it returns nothing: `500`,
`Internal Error`, so that the message of an error is not sent by mistake;
and `400`, `Bad Request`, for a message that is not valid. It is not
asked for a `ReplyError` a handler threw: that error says itself what is
told.

**`onFatal`** Called when the adapter stopped by itself: the connection closed and the
client does not connect again, or a subscription failed. Default: the
error is thrown, and ends the process when nothing catches it.

**`jetstream`** JetStream: the streams of the application. A route whose subject is of
one of them is consumed from it, and each of its messages is
acknowledged: delivery is at least once. Without it, every route is a
core subscription.

### Usage {#NatsLinkerOptions-usage}

```ts
const linker = new NatsLinker({
  connect: () => connect({ servers }),
  queue: "shop",
});
```

[Usage in examples/nats-reply.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/nats-reply.ts#L96)

## NatsMessage {#symbol-NatsMessage}

A message of NATS, as the client library gives it.

```ts
export type NatsMessage = Msg;
```

### Usage {#NatsMessage-usage}

```ts
const chosen = errorReply(error, message as NatsMessage);
```

[Usage in vendor/nats/consume.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/consume.ts#L490)

## NatsMessageLike {#symbol-NatsMessageLike}

What the adapter needs of a message of the client library.

```ts
export interface NatsMessageLike {
    readonly subject: string;
    readonly data: Uint8Array;
    readonly reply?: string | undefined;
    readonly headers?: Iterable<[
        string,
        string[]
    ]> | undefined;
    respond(data?: Uint8Array, options?: {
        headers?: MsgHdrs;
    }): boolean;
}
```

**`respond`** Send a reply to who asked.

**`subject`** The subject the message was sent to.

**`data`** The payload.

**`reply`** Where a reply goes, when the message asks for one.

**`headers`** The headers: each name, with its values.

### Usage {#NatsMessageLike-usage}

```ts
return {
    subject: "_INBOX.1",
    data: encoder.encode(value),
    headers,
    respond: () => false,
  };
```

[Usage in vendor/nats/send_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/send_test.ts#L70)

## NatsNative {#symbol-NatsNative}

What a handler finds in `ctx.native` on this adapter.

```ts
export type NatsNative = {
    readonly message: NatsMessage;
};
```

**`message`** The message of the client library: `subject`, `reply`, `headers`, …

### Usage {#NatsNative-usage}

```ts
const { message } = ctx.native as NatsNative;
console.log(message.subject);
```

## NatsSender {#symbol-NatsSender}

The sender of the NATS adapter.

- `publish` sends a message: its value, and its headers. NATS has no key:
  the key of a delivery is not sent.
- `request` sends it, and waits for the reply. A reply with the headers of
  an error (`ERROR_HEADERS`), as a NATS service and this adapter answer,
  rejects with a `ReplyError` of its code and its description.

```ts
export class NatsSender implements Sender {

    constructor(connection: () => Promise<NatsConnectionLike>);
    publish(topic: string, delivery: Delivery): Promise<void>;
    request(topic: string, delivery: Delivery, options?: RequestOptions): Promise<Reply>;
}
```

**`publish`** Send a message that asks for no reply.

**`request`** Send a message that asks for a reply, and wait for it.

**`constructor`** Make a sender. The linker of the adapter does: `linker.sender`.

### Usage {#NatsSender-usage}

```ts
return {
    ...made,
    sender: new NatsSender(() => Promise.resolve(made.connection)),
  };
```

[Usage in vendor/nats/send_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/send_test.ts#L83)

## NatsStreamMessage {#symbol-NatsStreamMessage}

A message of a stream, as the JetStream client gives it.

```ts
export type NatsStreamMessage = JsMsg;
```

### Usage {#NatsStreamMessage-usage}

```ts
const { message } = ctx.native as NatsStreamNative;
const event: NatsStreamMessage = message;
console.log(event.subject);
```

## NatsStreamNative {#symbol-NatsStreamNative}

What a handler finds in `ctx.native` for a message of a stream.

```ts
export type NatsStreamNative = {
    readonly message: NatsStreamMessage;
    readonly attempt: number;
};
```

**`message`** The message of the JetStream client: `seq`, `info`, `headers`, …

**`attempt`** `1` the first time the message is handled, `2` on its first retry, …

### Usage {#NatsStreamNative-usage}

```ts
const { attempt } = ctx.native as NatsStreamNative;
```

[Usage in examples/nats-stream.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/nats-stream.ts#L58)

## NatsSubscriptionLike {#symbol-NatsSubscriptionLike}

What the adapter needs of a subscription of the client library.

```ts
export interface NatsSubscriptionLike extends AsyncIterable<NatsMessageLike> {
    drain(): Promise<void>;
}
```

**`drain`** Receive nothing more from the server. The messages that were already
received are still given, then the iteration ends.

### Usage {#NatsSubscriptionLike-usage}

```ts
return {
        drain() {
          end();
          return Promise.resolve();
        },
        [Symbol.asyncIterator](): AsyncIterator<NatsMessageLike> {
          // No message: it ends when the subscription is drained.
          return {
            next: async () => {
              await ended;
              return { done: true, value: undefined };
            },
          };
        },
      };
```

[Usage in vendor/nats/stream_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/stream_test.ts#L211)

## REQUEST_TIMEOUT {#symbol-REQUEST_TIMEOUT}

How long a request waits when nothing says: the default of nats.js.

```ts
export const REQUEST_TIMEOUT = 1000;
```

### Usage {#REQUEST_TIMEOUT-usage}

```ts
assert.deepEqual(requested, [{
      subject: "shop.orders.price",
      value: '{"id":7}',
      headers: { Tenant: "acme" },
      timeout: REQUEST_TIMEOUT,
    }]);
```

[Usage in vendor/nats/send_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/send_test.ts#L149)

## Also exported here

These declarations share their implementation with another entry point. Each link opens the full declaration.

[`Delivery`](/api/message#symbol-Delivery), [`Linked`](/api/message#symbol-Linked), [`Linker`](/api/message#symbol-Linker), [`Reply`](/api/message#symbol-Reply), [`RequestOptions`](/api/message#symbol-RequestOptions), [`Route`](/api/message#symbol-Route), [`Sender`](/api/message#symbol-Sender)
