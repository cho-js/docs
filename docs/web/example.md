# Build a writable book catalog

Extend the [read-only endpoint](/web/quick-start) so a client can create a book, follow its `Location` and retrieve the stored record. This example keeps its state in memory for the lifetime of one application.

## 1. Give the store an owner

Create `catalog.ts` beside `main.ts`. The store assigns identifiers and owns the records. It can be tested independently of HTTP.

<<< @/examples/catalog/catalog.ts

## 2. Register the store and routes

Replace `app.ts` with the following. Both methods share the `Catalog` instance declared in `Library`. The POST handler receives the trimmed title only after the validator succeeds.

<<< @/examples/catalog/app.ts

## 3. Create and retrieve a record

Use the `main.ts` and launch command from the [HTTP quick start](/web/quick-start). In another terminal, create a book:

```sh
curl -i http://127.0.0.1:3000/api/books \
  -H 'Content-Type: application/json' \
  -d '{"title":" The Odyssey "}'
```

Expect `201 Created`. Copy the path from the `Location` header and request it from the same server. For example, if the header reads `/api/books/abc`, request `http://127.0.0.1:3000/api/books/abc`. The body contains the generated ID and the trimmed title.

## 4. Check two distinct failures

| Send | Expected response | Which component answered |
| --- | --- | --- |
| `POST /api/books` with `{"title":" "}` | `400` with `key: "title"` | Validation middleware |
| `GET /api/books/missing` | `404` with `{"error":"Book not found"}` | The controller after a successful route match |

Restarting the process clears the map. To add durable storage, replace the store with a provider that owns the connection and [disposes it on shutdown](/di/lifecycle). To verify the HTTP contract before changing the implementation, [run the catalog test](/web/testing).
