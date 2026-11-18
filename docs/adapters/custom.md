# Implement an HTTP linker

A custom router only needs to select a route and translate the request. `route.handle` already knows how to call the controller, resolve arguments, run middleware and convert the result.

## Connect an existing router

This example adapts the built-in `ChoRouter` as a minimal implementation of the contract. It also records which compiled paths were registered. Replace the `ChoRouter` construction and dispatch with your router's registration API when adding a new integration.

```ts
import { ChoRouter } from "@chojs/web";
import type { Linked, Linker, Route } from "@chojs/web/linker";

export class CatalogLinker implements Linker<ChoRouter> {
  link(routes: readonly Route[]): Linked<ChoRouter> {
    const instance = new ChoRouter(routes);
    for (const route of routes) {
      console.log(route.method, route.path, route.name);
    }
    return { instance, handler: instance.fetch };
  }
}
```

Pass `new CatalogLinker()` as the `linker` option to `ChoWeb.create`. `app.linked.instance` will have the native type supplied to `Linker<T>`.

## Dispatch a request

Each route supplies `method`, a complete `path` and the controller-qualified `name`. Register it once in `link`. When it matches, call `route.handle(request, decodedParams, nativeContext, state)` and await the response. The last three arguments are optional. Pass a shared `Map` as `state` if router middleware has already populated it.

Handle unmatched requests and unhandled route rejections in the adapter. When the router uses a different parameter syntax, translate CHO's `:name` segments during registration. Document how static paths compete with parameter routes, how `HEAD` falls back to `GET`, and whether the native server streams or buffers bodies.

## Verify an integration

Exercise `/books/featured` and `/books/:id` together, a percent-encoded path parameter, an unknown path, an unhandled method exception and a `HEAD` response. Include one streaming route when the adapter promises streaming. The [adapter comparison](/adapters/) describes the behavior of the supplied integrations.
