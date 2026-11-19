# Stream a response as records become available

Use newline-delimited JSON when a client can process each record independently. Return a `Response` whose body is a `ReadableStream<Uint8Array>`. Each pull below reads one record, so the producer does not have to build a large JSON array.

## Encode an async data source

```ts
function asNdjson(records: AsyncIterable<unknown>): Response {
  const iterator = records[Symbol.asyncIterator]();
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const row = await iterator.next();
        if (row.done) controller.close();
        else controller.enqueue(encoder.encode(JSON.stringify(row.value) + "\n"));
      } catch (error) {
        controller.error(error);
        await iterator.return?.();
      }
    },
    async cancel() { await iterator.return?.(); },
  });
  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8" },
  });
}
```

## Add a controller method

```ts
@Get("export")
export() {
  async function* books() {
    yield { id: "41", title: "The Iliad" };
    yield { id: "42", title: "The Odyssey" };
  }
  return asNdjson(books());
}
```

Run `curl -N http://127.0.0.1:3000/export`. Expect two lines, each parseable independently. Network chunks can split a line or contain several lines. A client should buffer incomplete lines between reads.

For a database cursor, pass `ctx.req.signal` into operations that can block and release the cursor in the producer's `finally`. Check permissions and acquire resources that may fail before returning the streaming response if the client needs a meaningful HTTP error status. Once the body starts, a producer error ends the stream.

## Observe incremental output

Add a short delay between two source records and request the endpoint with a client that displays bytes as they arrive. The first complete record should be readable while the producer is still waiting for the second.
