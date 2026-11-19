# Drain requests before closing providers

A running HTTP service has two owners. The listener owns connections and the CHO application owns provider instances. Stop the listener first so a request still using a store can complete before the store closes.

## Install a shutdown handler

Use the `app.ts` from the [HTTP quick start](/web/quick-start). This Node.js entry point handles both Ctrl+C and a service manager's termination signal.

```ts
import process from "node:process";
import { serve } from "@chojs/web/serve";
import { createApp } from "./app.ts";

const app = await createApp();
const server = await serve(app.handler, { port: 3000, closeTimeout: 10_000 });
let closing: Promise<void> | undefined;

async function shutdown() {
  try {
    await server.close();
  } finally {
    await app.close();
  }
}

function stop() {
  closing ??= shutdown().catch((error) => {
    console.error("Shutdown failed", error);
    process.exitCode = 1;
  });
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
```

`closeTimeout` is the time in milliseconds the server gives active requests before forcing connections closed. Choose it with your longest expected request and your host's termination deadline in mind. Without a timeout, an open event stream may keep graceful shutdown pending.

## Verify a drain

Start a request, send the process `SIGTERM` and watch the client. Work that completes within the deadline can return normally. For long-lived connections, have the handler observe `ctx.req.signal` and release subscriptions or cursors when the client disconnects.

With Fastify, await `app.linked.instance.close()` to stop its native listener. If a message consumer borrows the web injector, close it and wait for its active deliveries before calling `app.close()`. [Provider disposal](/di/lifecycle) · [Sharing HTTP and message services](/message/with-web)

## Choose a drain timeout

Start a request that takes longer than an ordinary catalog lookup, then initiate shutdown. Record whether it finishes before the configured timeout. Set the process supervisor's shutdown allowance to leave time for listener draining and provider disposal.
