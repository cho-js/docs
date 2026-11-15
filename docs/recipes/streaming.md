# Stream a response

A handler streams by returning a `ReadableStream`, or a `Response` whose body is
one. The response starts at once, and its body is sent as it is produced: the
client does not wait for the whole of it, and the server does not hold it in
memory.

There is no decorator for it: a stream is one of the values a handler can
return ([Responses](/web/responses)).

::: tip Events for a browser
A stream of events that a page reads with `EventSource` has its own decorator,
which formats the events: [`@Sse`](/web/sse).
:::

## A stream you already have

The body of a `fetch` response and an open file are streams already. Return the
stream:

```ts
@Get("logo")
async logo() {
  const upstream = await fetch("https://cdn.example.com/logo.png");
  return upstream.body; // a ReadableStream: 200
}
```

A stream says nothing of what it holds, so return it in a `Response` to give it
a content type, or another status:

```ts
@Get("logo")
async logo() {
  const upstream = await fetch("https://cdn.example.com/logo.png");
  if (!upstream.ok) {
    return new Response("no logo", { status: 502 });
  }
  return new Response(upstream.body, {
    headers: { "content-type": "image/png" },
  });
}
```

::: warning Return the body, not the response
Do not return the response of `fetch` itself. Its headers describe the body as
it was sent, compressed, and its body is already decompressed: on Node.js and
Bun the client fails to read it. To pass a whole answer on, see
[Forward a request to another server](/recipes/proxy).
:::

## A stream you produce

Rows of a database, the words of a model: what is produced step by step is
written as an `async *` method, and turned into a stream by a small function.
Copy it into your application:

```ts
/** A stream of bytes, from an async iterable of strings or of bytes. */
export function toStream(
  source: AsyncIterable<string | Uint8Array>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let iterator: AsyncIterator<string | Uint8Array> | undefined;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      iterator ??= source[Symbol.asyncIterator]();
      const { done, value } = await iterator.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(
          typeof value === "string" ? encoder.encode(value) : value,
        );
      }
    },
    cancel() {
      // The client went away: end the iteration, so its `finally` blocks run.
      iterator?.return?.().catch(() => {});
    },
  }, { highWaterMark: 0 }); // nothing is read ahead of the client
}
```

The handler returns the stream, and the `async *` method next to it yields the
body, a piece at a time:

```ts
@Controller({ route: "users", dependencies: [Users] })
class UsersController {
  constructor(readonly users: Users) {}

  @Get("export") // GET /users/export
  export() {
    return new Response(toStream(this.rows()), {
      headers: { "content-type": "text/csv" },
    });
  }

  async *rows() {
    yield "id,name\n";
    for await (const user of this.users.all()) {
      yield `${user.id},${user.name}\n`;
    }
  }
}
```

```txt
HTTP/1.1 200 OK
content-type: text/csv
transfer-encoding: chunked

id,name
1,Ada
2,Grace
```

::: info `ReadableStream.from`
Deno, Node.js and Bun have `ReadableStream.from(iterable)`, which does the same
for an iterable of **bytes**. It does not encode strings, and browsers and the
types of TypeScript do not all have it yet.
:::

## Lines of JSON

A list too long for one JSON array is sent as NDJSON: an object on each line.
The client can use every object as soon as its line arrives.

::: code-group

```ts [Server]
@Get("orders") // GET /orders
orders() {
  return new Response(toStream(this.lines()), {
    headers: { "content-type": "application/x-ndjson" },
  });
}

async *lines() {
  for await (const order of this.store.orders()) {
    yield JSON.stringify(order) + "\n";
  }
}
```

```js [Client]
const response = await fetch("/orders");
const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
let text = "";
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  text += value;
  const lines = text.split("\n");
  text = lines.pop(); // the line that is not whole yet
  for (const line of lines) {
    show(JSON.parse(line));
  }
}
```

:::

## Refusing a request

The status is sent before the body. Decide in the handler, before it returns
the stream; the `async *` method runs when the `200` is already sent.

```ts
@Get(":id/export")
@Args(Param("id"))
export(id: string) {
  const report = this.reports.find(id);
  if (!report) {
    return new Response("no such report", { status: 404 });
  }
  return new Response(toStream(this.rows(report)), {
    headers: { "content-type": "text/csv" },
  });
}
```

## What to know

- **An error in the stream cuts it.** When the `async *` method throws, the
  status is already sent: the connection is closed without a proper end, and the
  server prints the error. `@Catch` and `onError`
  ([Error handling](/web/error-handling)) are not called: they answer a request,
  and this one is answered. Catch what can fail inside the method.
- **A client that goes away ends the iteration.** `toStream` ends it, so the
  `finally` blocks of the method run: release there what the stream holds, such
  as a database cursor.
- **A method that is waiting ends when what it awaits settles.** A method that
  waits for long, on a queue or on a timer, should stop waiting when
  `ctx.req.signal` is aborted: see the
  [example for `@Sse`](/web/sse#the-end-of-the-stream), which applies as it is.
- **A slow client slows the method.** A piece is read from the iteration when
  the connection can take it: nothing piles up in memory.
- **Set a content type.** Without one, Deno and Node.js send none, and Bun sends
  `application/octet-stream`.
- **For a middleware, `next()` resolves when the stream opens**, not when it
  ends. Among the [middlewares of `@chojs/vendor-cho`](/adapters/middlewares),
  `timeout` only covers the time until then, `compress` compresses a stream of
  text as a stream, and `etag` reads the whole body to hash it: keep `etag` off
  the routes that stream.
- **An open stream is a request in flight.** `server.close()` waits for it:
  give `serve` a `closeTimeout`
  ([Shut down gracefully](/recipes/shutdown)).
- **On the [Fastify adapter](/adapters/fastify)**, a stream is sent as it comes
  with `instance.listen()`. `app.handler` goes through `inject()`, which
  collects the whole response.
