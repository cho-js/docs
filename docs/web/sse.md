# Send server-sent events

Use `@Sse` when a client should receive several events over one HTTP response. An async generator is a convenient producer. Each `yield` writes one event, and completing the iterator ends the response.

## Observe the event stream

Add this controller to the `controllers` of a web module with no prefix. Start the application and run `curl -N http://127.0.0.1:3000/imports/progress`. The `-N` flag disables curl's output buffering.

```ts
import { Controller, Sse } from "@chojs/web";

@Controller({ route: "imports" })
class Imports {
  @Sse("progress")
  async *progress() {
    yield { event: "progress", id: "1", data: { rows: 25 } };
    yield { event: "complete", id: "2", data: { rows: 50 } };
  }
}
```

The response has status `200` and content type `text/event-stream`. A browser subscribes to the named events. Close the source when the finite import completes, because `EventSource` normally reconnects.

```js
const source = new EventSource("/imports/progress");
source.addEventListener("progress", (event) => console.log(JSON.parse(event.data)));
source.addEventListener("complete", () => source.close());
```

## Choose the event fields

| Field | Meaning on the wire |
| --- | --- |
| `data` | Required. Strings are written directly and other values are JSON encoded |
| `event` | Names the browser event. Without it the browser fires `message` |
| `id` | Last event identifier. A reconnecting client can send `Last-Event-ID` |
| `retry` | Client reconnection delay in milliseconds |

Yielding a plain string is shorthand for an event with only `data`. To support resumption, read `Header("last-event-id")` and resume from the corresponding position in your own data source.

## Handle long-lived connections

Set `{ keepAlive: 15000 }` to emit a comment after 15 seconds of silence. Pass `ctx.req.signal` to work that waits for the next event and release subscriptions in the generator's `finally`. For clients that send a body, configure `{ method: "POST" }` and read the event stream with `fetch`.

Perform checks that must return an HTTP error **before returning the iterator**. Code inside an async generator starts on iteration, after CHO has created the streaming response. A regular method decorated with `@Sse` can return either a rejection `Response` or an async iterable. A failure during iteration terminates the stream. A route error handler can no longer replace its status.

For raw byte streams, see [streaming responses](/recipes/streaming). For bounded server shutdown with active event streams, see [graceful shutdown](/recipes/shutdown).

## Test individual events

Because the example stream ends, you can read its entire body in a test. Decode it as text and verify the framing as well as the status. Supply `app` from a module that declares `Imports` without a prefix.

```ts
import assert from "node:assert/strict";

const response = await app.handler(new Request("http://local/imports/progress"));
assert.equal(response.status, 200);
assert.match(response.headers.get("content-type") ?? "", /^text\/event-stream/);
const frames = (await response.text()).trimEnd().split("\n\n");
assert.equal(frames.length, 2);
assert.ok(frames[0]?.includes("event: progress\n"));
assert.ok(frames[1]?.includes('data: {"rows":50}'));
```

For a subscription that stays open, read only the events under test and cancel the reader in `finally`. Calling `response.text()` on such a stream waits for the subscription to end. When using Fastify, test an open subscription on its native listener because the in-memory injection path buffers the response.
