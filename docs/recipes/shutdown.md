# Shut down gracefully

A server that is stopped while it answers a request drops that request. A
graceful shutdown stops taking requests, lets the ones in flight end, and then
releases what the application holds: database connections, timers, files.

## The code

```ts
import process from "node:process";
import { ChoWeb } from "@chojs/web";
import { serve } from "@chojs/web/serve";

const app = await ChoWeb.create(App);
const server = await serve(app.handler, {
  port: 3000,
  closeTimeout: 10_000, // how long the requests in flight get to end
});

let closing = false;

async function shutdown() {
  if (closing) {
    return; // a second signal changes nothing
  }
  closing = true;
  await server.close(); // 1. no new request; wait for the ones in flight
  await app.close(); //    2. release what the application holds
}

process.on("SIGTERM", shutdown); // sent by Docker, Kubernetes, systemd
process.on("SIGINT", shutdown); //  Ctrl+C
```

`node:process` runs on Node.js, Deno and Bun. Once the server and the
application are closed, nothing keeps the process running, and it exits by
itself.

## The order

1. **`server.close()`** stops accepting requests, and waits for the ones in
   flight. After `closeTimeout` milliseconds, the connections of the requests
   that are still in flight are cut.
2. **`app.close()`** disposes the instances of the application, in reverse
   creation order ([Lifecycle](/di/lifecycle#releasing-instances)).

The server first: a request in flight still needs the database. A request that
reaches `app.handler` after `app.close()` is answered `503`, and runs no route.

## What the application releases

A provider that holds something releases it in `[Symbol.asyncDispose]()`, which
`app.close()` calls:

```ts
@Injectable()
class Database {
  readonly pool = createPool(process.env.DATABASE_URL);

  async [Symbol.asyncDispose]() {
    await this.pool.end();
  }
}
```

## With an adapter

`serve` takes any handler, so the code above is the same with the
[Hono adapter](/adapters/hono). The [Fastify adapter](/adapters/fastify) runs
its own server, which is the one to close:

```ts
const fastify = app.linked.instance;
await fastify.listen({ port: 3000 });

async function shutdown() {
  await fastify.close();
  await app.close();
}
```

## What to know

- **Set `closeTimeout`.** Without it, `server.close()` waits for every request,
  for ever: an open stream, such as [server-sent events](/web/sse), never ends
  by itself.
- **Choose it between two numbers**: longer than your slowest request, and
  shorter than what stops the process. Docker kills a container 10 seconds
  after `SIGTERM` by default, and Kubernetes a pod after 30.
- **A request that is cut is told.** Its handler sees what it sees when a
  client goes away: `ctx.req.signal` is aborted, and the iteration of a
  [stream](/recipes/streaming) is ended, so its `finally` blocks run.
- **A request that ends in time is not cut**, and closing does not wait for the
  rest of the timeout.
- **On Deno, a request that arrives while the server is closing is answered
  `503`**, where Node.js and Bun refuse the connection.
- **`process.exit()` is not needed.** A process that stays after `shutdown` is
  kept by something that was not released, a timer or a connection: exiting
  would only hide it.
