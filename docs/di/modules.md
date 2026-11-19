# Share providers across modules

Split the application where ownership changes. A catalog module can own a store and its connection settings. A reporting module that imports the catalog only needs the store's public API.

## Scope rules

```ts
import { Injectable, Module, provider, token } from "@chojs/web";

const BRANCH = token<string>("branch");

@Injectable([BRANCH])
class Catalog {
  constructor(readonly branch: string) {}
}

@Module({
  providers: [provider({ provide: BRANCH, factory: () => "central" }), Catalog],
  exports: [Catalog],
})
class CatalogModule {}

@Injectable([Catalog])
class Reports {
  constructor(readonly catalog: Catalog) {}
}

@Module({ imports: [CatalogModule], providers: [Reports] })
export class ReportsModule {}
```

`Reports` can inject `Catalog` because its module directly imports `CatalogModule` and that module exports the token. `BRANCH` stays private. The catalog still receives its own module's setting, even if the reporting module declares another provider for `BRANCH`.

## Follow a lookup

1. Start at the module that declares the consumer. A local declaration takes precedence.
2. Inspect the exports of its direct imports. A module can re-export a visible token to make it available one level further.
3. If two imports export different declarations for the requested token, resolution is ambiguous. Use distinct tokens for distinct values or declare a local provider to select the intended value.

Importing the same module through two paths shares its declarations. Registering the same provider class in two modules creates two instances. This distinction matters for connection pools and in-memory stores.

## Add a controller

Register a controller in the `controllers` list of the module that owns its entry points. Register its services in `providers` or import them from another module. A module's own constructor can request its visible providers with `dependencies`.

Module imports control visibility. For a URL segment shared across independently imported features use the web application's `prefix`. For a common topic namespace use the message application's `prefix`. [HTTP routing](/web/routing) · [Message topics](/message/topics)

## Configure two instances of one client

A class token identifies one visible declaration. When a feature needs two differently configured clients, give each a distinct token and supply both from one module. The types stay the same while the identities distinguish the lookups.

```ts
import { Injectable, Module, provider, token } from "@chojs/web";

class CatalogClient {
  constructor(readonly base: URL) {}
}

const ARCHIVE = token<CatalogClient>("archive catalog");
const CURRENT = token<CatalogClient>("current catalog");

@Injectable([ARCHIVE, CURRENT])
class CompareEditions {
  constructor(readonly archive: CatalogClient, readonly current: CatalogClient) {}
}

@Module({
  providers: [
    provider({ provide: ARCHIVE, factory: () => new CatalogClient(new URL("https://archive.example")) }),
    provider({ provide: CURRENT, factory: () => new CatalogClient(new URL("https://catalog.example")) }),
    CompareEditions,
  ],
  exports: [CompareEditions],
})
class EditionsModule {}
```

A consuming module can import `EditionsModule` and inject `CompareEditions`. Keeping the client tokens private lets the owning module change the connection details without changing every importer. If an importer needs a different configuration, declare a separate provider for it and use that provider's token explicitly.

When a library module owns a default provider, use [module configuration](/di/configured-modules) to supply deployment settings and share the configured instance across consumers.
