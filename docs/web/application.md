# Create and serve an HTTP application

`ChoWeb.create` initializes the dependency graph, compiles HTTP routes and passes them to a linker. The returned application is ready to accept a `Request`. Starting a network listener is a separate operation.

```ts
import { ChoWeb } from "@chojs/web";
import { serve } from "@chojs/web/serve";
import { Library } from "./app.ts";

const app = await ChoWeb.create(Library, { prefix: "api" });
const server = await serve(app.handler, { port: 3000 });
console.log("Listening on", server.port);
```

## Options

| Option | Effect |
| --- | --- |
| `prefix` | Prepends relative segments to controller routes |
| `linker` | Registers compiled routes with a router. Defaults to `ChoLinker` |
| `onError` | Supplies the fallback error handler for matched routes |
| `overrides` | Replaces matching provider declarations before initialization |

If initialization or linking fails, creation rejects and CHO attempts to release instances already created. Start the listener only after creation succeeds.

## What the application exposes

Use `app.handler` for serving and request tests. Use `app.routes` to inspect final method/path pairs and their diagnostic names. `app.graph` retains feature, controller and method metadata for tools such as [API documentation generators](/web/api-docs). `app.linked.instance` exposes the selected adapter's native application. `app.injector` can be shared with a [message consumer](/message/with-web).

After creation, call `app.mount` to register endpoints that depend on the initialized application. These join `app.routes` with their own names and full paths. Register them before a listener, test request or adapter readiness check. [Mount a route](/web/mounted-routes) · [Publish OpenAPI documentation](/web/openapi)

## Shut down the listener

Await `server.close()` to stop accepting requests and drain active connections. Then await `app.close()` to dispose providers. Subsequent requests passed to `app.handler` receive `503`. Use `closeTimeout` when a long-lived stream could keep a listener open. [Graceful shutdown](/recipes/shutdown)

## Choose a readiness boundary

Await creation and register dynamic routes before opening the listener. Report the port returned by [`serve`](/api/web-serve#symbol-serve), which may differ from the requested port if the host allocated it. At shutdown, stop the listener before closing the application that supplies its providers.
