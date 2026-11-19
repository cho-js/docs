# Add a WebSocket endpoint

Use a WebSocket when a client needs to send messages and receive events over one long-lived connection. For a one-way feed that a browser consumes with `EventSource`, use [server-sent events](/web/sse). The WebSocket APIs below are present in the [framework checkout at 221b77c](https://github.com/cho-js/cho/commit/221b77c264413c02f6db1370cadd46659e53984c).

## Declare a room and its connection events

Save this as `app.ts`. The handshake selects a room. Once connected, the client receives the room name and can send text or binary messages to the echo handler.

```ts
import {
  Args, ChoWeb, type ChoWebSocket, Controller, Module, Param,
  Ws, WsClose, WsMessage, WsOpen,
} from "@chojs/web";

@Controller({ route: "rooms" })
class Rooms {
  @Ws(":room")
  @Args(Param("room"))
  join(room: string) { return { joined: room }; }

  @WsOpen()
  opened(socket: ChoWebSocket) { console.log("Joined", socket.ctx.params.room); }

  @WsMessage()
  echo(data: string | Uint8Array) { return data; }

  @WsClose()
  left(code: number, reason: string, socket: ChoWebSocket) {
    console.log(socket.ctx.params.room, code, reason);
  }
}

@Module({ controllers: [Rooms] })
class Library {}

export const app = await ChoWeb.create(Library);
```

Each controller can declare one upgrade method and at most one handler per event. Its instance is shared across connections. Keep connection-specific values in `socket.ctx.state` or in a store keyed by the socket. The context retains the original URL, parameters and headers.

## Connect a browser

On Node.js, Deno or Bun, pass the application to the listener so it can complete the upgrade. Save this as the server entry point beside `app.ts`.

```ts
import { serve } from "@chojs/web/serve";
import { app } from "./app.ts";

await serve(app, { port: 3000 });
```

From a local browser page, connect and send a message. The first text frame contains `{"joined":"catalog"}`; a subsequent frame echoes `hello`.

```js
const ws = new WebSocket("ws://localhost:3000/rooms/catalog");
ws.onmessage = ({ data }) => console.log(data);
ws.onopen = () => ws.send("hello");
```

The upgrade goes through the ordinary GET route pipeline. Use middleware and argument validation to decide who may join. Return a Fetch response or throw an HTTP error to refuse the handshake. A plain GET receives status 426. For a cookie-authenticated browser endpoint, check the request's Origin in handshake middleware.

## Send, close and clean up

A handler can return text, bytes or a JSON-serializable value. Returning nothing sends nothing. Call `socket.send(data)` to send independently of an incoming message. `socket.open` reports connection state and `socket.close(1000, "Finished")` initiates an orderly close. A connection processes its events in order, including asynchronous handlers. A failing event handler closes the connection with code 1011. Use `@WsClose` to remove subscriptions or room membership. Application shutdown closes connections with code 1001 before disposing providers.

## Choose the host

| Host | Entry point |
| --- | --- |
| Deno | `serve(app)` or `Deno.serve(app.handler)` |
| Node.js | `serve(app)` or attach `nodeUpgrade(app)` to an existing HTTP server's `upgrade` event |
| Bun | `serve(app)` or `Bun.serve({ ...bunOptions(app) })` |
| Cloudflare Workers | Export `{ fetch: app.handler }`. The runtime supplies the socket pair |

The built-in and Hono linkers support these routes. The Fastify linker rejects a socket route at startup with `CHO_FASTIFY_NO_SOCKET`. On Node.js and Bun, `maxPayload` defaults to 1 MiB and oversized messages close with code 1009. The Node server implements the protocol without message compression or subprotocol negotiation. Worker coverage applies to ordinary Worker fetch handlers; Durable Object hibernation is outside the matrix. OpenAPI generation omits WebSocket handshakes. [Compatibility notes](/reference/compatibility) · [Server integration API](/api/web-serve) · [Complete chat example](https://github.com/cho-js/cho/blob/221b77c264413c02f6db1370cadd46659e53984c/examples/ws-chat.ts)
