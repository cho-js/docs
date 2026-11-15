# Server-sent events

`@Sse` declares a handler that answers with a stream of
[server-sent events](https://developer.mozilla.org/docs/Web/API/Server-sent_events):
the response stays open, and the handler sends events for as long as it wants.

The handler is an `async *` method, and every `yield` is an event:

::: code-group

```ts [Server]
import { type ChoWebContext, Controller, Sse } from "@chojs/web";

@Controller({ route: "orders", dependencies: [Orders] })
class OrdersController {
  constructor(readonly orders: Orders) {}

  @Sse("events") // GET /orders/events
  async *events(ctx: ChoWebContext) {
    yield "listening"; // a string is the event { data: "listening" }
    for await (const order of this.orders.changes(ctx.req.signal)) {
      yield { event: "order", id: String(order.version), data: order };
    }
  }
}
```

```js [Browser]
const source = new EventSource("/orders/events");

source.onmessage = (event) => console.log(event.data); // "listening"
source.addEventListener("order", (event) => {
  show(JSON.parse(event.data));
});
```

```txt [On the wire]
HTTP/1.1 200 OK
content-type: text/event-stream
cache-control: no-cache, no-transform

data: listening

event: order
id: 7
data: {"id":"42","status":"paid","version":7}

```

:::

## Events

An event is an object:

| Property | Holds                                                                                        |
| -------- | -------------------------------------------------------------------------------------------- |
| `data`   | The data of the event, required. A string is sent as it is; anything else is sent as JSON    |
| `event`  | The name of the event, for `addEventListener(name)`. Without it, the event is a `message`    |
| `id`     | The id of the event. A client that reconnects sends the last one it got, as `Last-Event-ID`  |
| `retry`  | How long the client waits before it reconnects, in milliseconds                              |

```ts
yield "hello"; // short for { data: "hello" }
yield { data: { n: 1 } }; // data: {"n":1}
yield { event: "tick", id: "2", retry: 5000, data: "now" };
```

A string with several lines is sent as several `data:` lines, which the client
joins back.

The type is `ChoWebSseEvent<T>`, where `T` is the type of `data`. What the
handler returns is checked when the code is compiled: a handler that yields a
number, or an event without `data`, does not compile.

## The response

The response is a `200`, sent as soon as the handler has returned, before the
first event:

| Header              | Value                    | Why                                             |
| ------------------- | ------------------------ | ----------------------------------------------- |
| `content-type`      | `text/event-stream`      | What `EventSource` expects                      |
| `cache-control`     | `no-cache, no-transform` | Nothing on the way keeps or rewrites the events |
| `x-accel-buffering` | `no`                     | See below                                       |

::: details Why `x-accel-buffering`?
It is not a standard header: it is one that nginx reads. As a reverse proxy,
nginx collects a response before it passes it on, so the events of a stream
would reach the client late, and in batches. `no` turns that off for this
response, which saves setting `proxy_buffering off` in the configuration of the
proxy. Everything else ignores the header.
:::

## Options

`@Sse(route, options)` takes two options:

| Option      | Default | Use                                                                |
| ----------- | ------- | ------------------------------------------------------------------ |
| `method`    | `"GET"` | The HTTP method: `GET`, `POST`, `PUT`, `PATCH` or `DELETE`         |
| `keepAlive` | None    | Send a comment when that many milliseconds pass with nothing sent  |

### Another method

`EventSource` only sends `GET` requests, with no body. A stream that answers a
request with a body, such as the answer of a model to a question, is declared
with the `method` option, and the client reads it with `fetch`:

::: code-group

```ts [Server]
@Sse("answers", { method: "POST" }) // POST /chat/answers
@Args(Body<{ question: string }>())
async *answer(body: { question: string }) {
  for await (const word of this.model.answer(body.question)) {
    yield word;
  }
}
```

```js [Browser]
const response = await fetch("/chat/answers", {
  method: "POST",
  body: JSON.stringify({ question: "What is a stream?" }),
});
const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
let text = "";
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  text += value;
  const events = text.split("\n\n"); // an event ends with an empty line
  text = events.pop();
  for (const event of events) {
    if (event.startsWith("data: ")) show(event.slice("data: ".length));
  }
}
```

:::

### Keep-alive

A proxy closes a connection on which nothing is sent for a while, often a
minute. With `keepAlive`, a comment line, which clients ignore, is sent whenever
that many milliseconds pass with nothing sent:

```ts
@Sse("events", { keepAlive: 15_000 })
```

## Before the stream

Everything that runs before a handler runs before a stream too: the
[middlewares](/web/middlewares) of the route, its
[arguments](/web/arguments) and their [validation](/web/validation). They
answer a request they refuse the usual way, with a `401` or a `400`.

The last id a client got is an argument like any other:

```ts
@Sse("events")
@Args(Header("last-event-id"))
async *events(last: string | undefined, ctx: ChoWebContext) {
  for await (const order of this.orders.changesSince(last, ctx.req.signal)) {
    yield { id: String(order.version), data: order };
  }
}
```

::: warning An `async *` method cannot refuse a request
Its body runs as part of the stream, when the `200` is already sent. A handler
that must be able to answer with another status is a **plain method**, which
returns either a `Response` or the events:

```ts
@Sse(":id/events")
@Args(Param("id"))
events(id: string) {
  const order = this.orders.find(id);
  if (!order) {
    return new Response("no such order", { status: 404 });
  }
  return this.orders.eventsOf(order); // an async iterable
}
```

:::

## The end of the stream

- **The handler ends it.** When the iteration ends, the response ends.
  `EventSource` then reconnects by itself: to make it stop, the client calls
  `source.close()`, or the handler answers the next request with
  `new Response(null, { status: 204 })`.
- **The client goes away.** The iteration is ended, so the `finally` blocks of
  the method run, and `ctx.req.signal` is aborted.
- **A slow client slows the handler.** An event is read from the iteration when
  the connection can take it: nothing piles up in memory.

::: tip Watch the signal when you wait
An `async *` method that is waiting only ends once what it awaits settles. A
method that waits for long, on a queue or on a timer, should stop waiting when
`ctx.req.signal` is aborted:

```ts
@Sse("ticks")
async *ticks(ctx: ChoWebContext) {
  const { signal } = ctx.req;
  try {
    while (!signal.aborted) {
      yield { event: "tick", data: Date.now() };
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 1000);
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          resolve();
        }, { once: true });
      });
    }
  } finally {
    // release what the stream holds
  }
}
```

:::

## Errors

When the iteration throws, or yields something that is not an event, the status
is already sent:

- The stream is cut: the connection is closed without a proper end. A client
  sees a failed connection, and `EventSource` reconnects.
- The server prints the error, as it does for any response whose body fails.

::: warning Error handlers are not called
`@Catch` and `onError` ([Error handling](/web/error-handling)) answer a request,
and this one is already answered: an error in a stream that has started does not
reach them. If you rely on `onError` to log or report errors, the errors of your
streams are not in it.
:::

So the errors of a stream are the handler's own business. Catch them in the
handler, to log them, to report them, or to tell the client what went wrong with
an event of your own:

```ts
@Sse("events")
async *events(ctx: ChoWebContext) {
  try {
    yield* this.orders.changes(ctx.req.signal);
  } catch (error) {
    this.log.error(error);
    yield { event: "failed", data: "the feed is not available" };
  }
}
```

What happens **before** the stream is not concerned: an error of a middleware
or of an argument, and a handler that returns something that is neither a
`Response` nor an async iterable, are answered by the error handler, like any
other.

## Middlewares, servers and adapters

- For a middleware, `next()` resolves when the stream opens, not when it ends:
  what it measures or logs is the time until the first byte. A middleware must
  not read the body of an event stream, which would wait for its end. Among the
  [middlewares of `@chojs/vendor-cho`](/adapters/middlewares), `etag` and
  `compress` leave an event stream as it is.
- An open stream is a request in flight: `server.close()` of
  [`serve`](/web/application#serving) waits for it, for ever when the stream has
  no end. Give `serve` a [`closeTimeout`](/web/application#shutting-down): the
  streams that are still open after that long are cut, which ends their
  iteration like a client that goes away.
- A `HEAD` request to a `GET` stream gets the headers, and the events are never
  read.
- Every [adapter](/adapters/) sends the events as they come. On the
  [Fastify adapter](/adapters/fastify), that is with `instance.listen()`:
  `app.handler` goes through `inject()`, which collects the whole response, so
  it only suits a stream that ends.

## A runnable example

[`examples/sse-http.ts`](https://github.com/cho-js/cho/blob/main/examples/sse-http.ts)
has both kinds of streams, a clock read with `EventSource` and an answer read
with `fetch`, and the page that reads them.
