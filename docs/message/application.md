# Start, deliver to and close a consumer

`await ChoMessage.create(Root, options)` validates declarations, initializes providers and compiles subscriptions. If a linker is supplied, creation prepares the adapter. Connection and subscription happen when you call `start`.

| Option | Effect |
| --- | --- |
| `prefix` | Prepends a namespace to every topic |
| `linker` | Attaches a broker adapter |
| `onError` | Sets the fallback delivery error handler |
| `overrides` | Replaces declared providers on an application that owns its injector |

## Delivering a message by hand

```ts
import { createApp } from "./app.ts"; // inventory quick start

const app = await createApp();
try {
  console.table(app.routes.map(({ name, topic }) => ({ name, topic })));
  await app.handle("books.received", { value: '{"isbn":"9780140268867"}' });
} finally {
  await app.close();
}
```

`handle` selects the exact topic and awaits its pipeline. On success it returns a [reply](/message/replies) or `undefined`. An unknown topic rejects with `CHO_MESSAGE_UNKNOWN_TOPIC` before a handler runs. This path works without `start` or a broker. Calling `start` on an application without a linker rejects.

## Manage a connected application

Create the application and await `start()` before reporting that the consumer is ready. Repeated starts share the first start promise, including its failure. Close a failed instance before creating one for another connection attempt.

`close()` waits for a pending start, stops the linked consumer if started, drains tracked deliveries and disposes the injector if the application owns it. Repeated closes share the shutdown promise. New manual deliveries are refused once closing begins.

Use `app.linked.instance` for the adapter's client, `app.graph` for the feature tree, and `app.routes` for complete topics and handler names. If another application already owns the providers, use [`ChoMessage.from`](/message/with-web).

## Start only when the transport is ready

Use manual delivery when embedding a consumer in a local process. For a connected consumer, await `app.start()` before advertising readiness and await `app.close()` during shutdown. This gives the adapter time to finish in-flight deliveries.
