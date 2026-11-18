# Inject a service into a controller

Suppose two endpoints need the same catalog. Declare one provider and ask CHO to pass it to each controller. This makes the lifetime explicit and gives a test a place to substitute a different catalog.

```ts
import { Args, Controller, Get, Injectable, Module, Param } from "@chojs/web";

@Injectable()
class Catalog {
  readonly titles = new Map([["42", "The Odyssey"]]);
}

@Controller({ route: "books", dependencies: [Catalog] })
class Books {
  constructor(readonly catalog: Catalog) {}

  @Get(":id")
  @Args(Param("id"))
  find(id: string) {
    const title = this.catalog.titles.get(id);
    return title === undefined
      ? new Response("Unknown book", { status: 404 })
      : { id, title };
  }
}

@Module({ providers: [Catalog], controllers: [Books] })
export class Library {}
```

## Trace the dependency

- `providers: [Catalog]` gives the module a declaration it can instantiate. `@Injectable()` describes how to build the class.
- `dependencies: [Catalog]` tells CHO which token to resolve for the first constructor argument. The compiler checks the constructor against that list.
- `controllers: [Books]` registers the HTTP entry point. When creating `Books`, CHO looks up `Catalog` in the module that declares `Books`.

Within an application, callers resolving the same declaration receive the same instance. A controller can therefore keep a reference to the catalog. Keep request-specific data on [the request context](/web/context).

## Choose the next step

| Requirement | Mechanism |
| --- | --- |
| Inject a string, interface or asynchronously constructed client | [Typed tokens and factory providers](/di/providers) |
| Supply a fixed value, select an implementation or alias an existing service | [Provider recipes](/di/recipes/bindings) |
| Create a fresh object per operation or share it within one request | [Lifetime recipes](/di/recipes/lifetimes) |
| Use one catalog across features | [Export it from a module](/di/modules) |
| Release a client or replace it during a test | [Provider lifecycle and overrides](/di/lifecycle) |
| Share instances between HTTP and message handlers | [Use one injector](/message/with-web) |
