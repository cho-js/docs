# Initialize and release providers

A provider declaration has one cached result per injector. Concurrent resolutions share its creation. Dependencies finish before the factory or constructor that consumes them. A failed creation is cached as well, so build a fresh application when retrying failed initialization.

| Entry point | When CHO checks the graph | When provider code runs |
| --- | --- | --- |
| `await ChoWeb.create(App)` | During creation | During initialization, before serving |
| `ChoCommand.create(App)` | During creation | On demand for the selected command |
| `await ChoMessage.create(App)` | During creation | During initialization, before connecting a broker |
| `await ChoMessage.from(injector)` | Uses the supplied graph | Uses the existing injector and its instances |

## Give resources a disposer

Wrap acquired resources in values with `[Symbol.asyncDispose]()` or `[Symbol.dispose]()`. For example, a factory can return an open file along with the behavior that uses it. This Deno provider releases the handle when the injector closes.

```ts
import { provider, token } from "@chojs/web";

const AUDIT = token<Deno.FsFile>("audit file");
const auditProvider = provider({
  provide: AUDIT,
  factory: () => Deno.open("audit.log", { create: true, append: true }),
});
```

Register `auditProvider` in the owning module and grant the process write access to the file. For your own disposable classes, use the async method for cleanup that must finish before shutdown. CHO prefers the async method when a value implements both.

## Close in dependency order

Stop the external source of work, allow active operations to finish, then release the injector. CHO disposes values in reverse creation order and disposes a shared object once. If disposal fails it continues with the remaining values and reports the failures in an `AggregateError`. See [HTTP shutdown](/recipes/shutdown) and [shared message consumers](/message/with-web).

## Overrides for tests

Pass `overrides: [provider({ provide: TOKEN, factory: () => fake })]` at application creation. This replaces every provider declaration for that token. Override dependencies resolve in the original declaration's scope. A token without a matching provider is a setup error. Apply overrides to the owning application when sharing an injector.

A fresh application per test isolates cached instances. Close it in `finally` so failed assertions also release resources.
