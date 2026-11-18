# Test an HTTP application in memory

Send a standard `Request` directly to `app.handler`. This exercises routing, middleware, argument validation, dependency injection and response conversion. The test can inspect the same status, headers and body a network client would receive.

## Test a write followed by a read

Place `catalog_test.ts` next to the two files from [the writable catalog](/web/example). Run `deno test catalog_test.ts`.

<<< @/examples/catalog/catalog_test.ts

The test reads the resource through the URL returned by the server. A broken `Location` therefore fails the test even when the store inserted the book. A fresh application per test keeps data isolated.

## Replace an external dependency

When a provider normally opens a database or calls an upstream API, replace its token during creation. For the catalog example:

```ts
import { ChoWeb, provider } from "@chojs/web";
import { Library } from "./app.ts";
import { Catalog } from "./catalog.ts";

const fixture = new Catalog();
const book = fixture.add("The Iliad");
const app = await ChoWeb.create(Library, {
  prefix: "api",
  overrides: [provider({ provide: Catalog, factory: () => fixture })],
});
try {
  const response = await app.handler(new Request("http://library/api/books/" + book.id));
  console.log(response.status); // 200
} finally {
  await app.close();
}
```

## Select the test boundary

Use the ordinary application and linker when testing route precedence or a not-found response. Use the adapter's native test facility when asserting native plugin behavior. Use a listening server for transport concerns such as client disconnects and connection draining. [Fastify tests](/adapters/fastify) · [Shutdown](/recipes/shutdown)
