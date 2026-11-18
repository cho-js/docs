# Use the injector directly

Use `@chojs/core` when building a runner that needs CHO's dependency graph without an HTTP, CLI or message dispatcher. Application packages already export their supported DI decorators and provider helpers. The core package's internal helpers can change between releases.

## Resolve a service

Install `@chojs/core` with your runtime's JSR installer. Save this as `main.ts` and use the TypeScript runner from [runtime setup](/guide/runtimes).

```ts
import { Injectable, Injector, Module, provider, token } from "@chojs/core";

const BRANCH = token<string>("branch");

@Injectable([BRANCH])
class Stamp {
  constructor(readonly branch: string) {}
}

@Module({
  providers: [provider({ provide: BRANCH, factory: () => "central" }), Stamp],
})
class Library {}

const injector = new Injector(Library);
try {
  const stamp = await injector.resolve(Stamp);
  console.log(stamp.branch); // central
} finally {
  await injector.dispose();
}
```

The constructor validates declarations and dependency edges synchronously. `resolve(token, owner?)` initializes the required dependencies. The owner defaults to the root module. Call `await injector.init()` to initialize the graph eagerly. Disposal releases values in reverse creation order.

## Inspect or extend the graph

| Entry point | Use |
| --- | --- |
| `@chojs/core` | `Injector`, decorators, provider and token helpers |
| `@chojs/core/di` | Graph types, decorator normalization, metadata records and injectable handler helpers |
| `@chojs/core/utils` | Middleware composition, runtime detection, environment access and debug logging |
| `@chojs/core/utils/test_utils` | Helpers for exercising decorator calling conventions and capturing console output |

`injector.meta` describes declarations and `injector.graph` describes their resolved links. `injector.modules()` yields imported modules before importers. `injector.controllers()` enumerates controllers in their declaring scopes. Use `node.owner` when resolving a controller obtained from that iterator.

## Compose middleware

`compose(middlewares, endpoint)` builds a chain that completes without a result, as in a message consumer. The overload accepting a result descriptor also checks which values a middleware may return in place of the downstream result. HTTP uses this for responses and CLI uses it for exit codes. A second call to `next()` from the same middleware rejects. For a working example of custom method discovery, [write a job runner](/advanced/cho-module).
