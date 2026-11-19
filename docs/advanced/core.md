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

## Choose the resolution scope

Resolve a token in its declaring module and then from a consuming module. The consumer needs an import whose exports include that token. A diagnostic about an invisible provider usually points to this import/export boundary.

## Inventory the services visible to a feature

Use the root module from the injector example above. The scope exposes the provider tokens visible to each module, including imported exports. The dependency nodes identify the owner responsible for creating each controller.

```ts
const inspector = new Injector(Library);
try {
  for (const scope of inspector.modules()) {
    console.log(scope.ctr.name, {
      imports: scope.imports.map((entry) => entry.ctr.name),
      visibleProviders: scope.visible.size,
    });
  }
  for (const controller of inspector.controllers()) {
    console.log(controller.owner.name, controller.deps.map((dep) => dep.token));
  }
} finally {
  await inspector.dispose();
}
```

Inspecting the graph does not require calling the controllers. An extension that actually invokes a method resolves the instance with `inspector.resolve(controller.token, controller.owner)`. The owner matters when several modules contain their own local declarations. [Module scopes](/api/core#symbol-ModuleScope) · [Dependency nodes](/api/core#symbol-DependencyNode)

## Give a custom dispatcher a result contract

A job runner can use a numeric result to distinguish a completed job from a skipped one. Give `compose` the context type, the endpoint and a predicate that recognizes valid results. Here a disabled job completes with status 2 before the endpoint runs.

```ts
import { compose, type MiddlewareFn, type ResultKind } from "@chojs/core/utils";

type Job = { name: string; enabled: boolean };
const exitStatus: ResultKind<number> = {
  is: (value): value is number => typeof value === "number" && Number.isInteger(value),
  noun: "exit status",
  name: "an exit status",
};
const skipDisabled: MiddlewareFn<Job, number> = (job, next) =>
  job.enabled ? next() : 2;

const run = compose([skipDisabled], async (job: Job) => {
  console.log(job.name);
  return 0;
}, exitStatus);

console.log(await run({ name: "inventory", enabled: false })); // 2
```

For a delivery that only succeeds or throws, omit the result descriptor and use the void overload. A middleware can then finish the delivery by returning before it calls `next`. Call `next` once per invocation. [Composition examples and overloads](/api/core-utils#symbol-compose)
