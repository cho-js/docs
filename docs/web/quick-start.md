# Serve a book as JSON

Build a read-only endpoint at `GET /api/books/:id`. You will define a route, start the server and send a request. Begin in a [project with `@chojs/web` installed](/guide/getting-started).

## 1. Define the application

Save this file as `app.ts`.

<<< @/examples/web/app.ts

The path has three pieces here. The application contributes `api`, the controller contributes `books` and the method captures one segment as `id`. CHO passes its decoded value to `find` and serializes the returned object as JSON. The fixed title keeps the example focused on routing.

## 2. Start a local server

Save this file beside it as `main.ts`. Keeping the listener in a separate file lets a test import `app.ts` directly.

<<< @/examples/web/main.ts

::: code-group

```sh [Deno]
deno run --allow-net main.ts
```

```sh [Node.js]
npx tsx main.ts
```

```sh [Bun]
bun run main.ts
```

:::

## 3. Check the route

In a second terminal, run:

```console
$ curl -i http://127.0.0.1:3000/api/books/42
```

Expect status `200`, a JSON content type and the body `{"id":"42","title":"The Odyssey"}`. Try `/books/42` without the application prefix to see the router's `404`. Stop the server with Ctrl+C.

## Exercise the same route in memory

```ts
import { createApp } from "./app.ts";

const app = await createApp();
try {
  const response = await app.handler(new Request("http://library/api/books/42"));
  console.log(response.status, await response.json());
} finally {
  await app.close();
}
```

Next, [build a catalog that accepts writes](/web/example), [test the endpoint](/web/testing) or [serve a Fetch handler on Cloudflare Workers](/guide/cloudflare-workers).

## Trace a request

Change the application prefix to `v2` and request `/v2/books/42`. The same method still receives `"42"`. The prefix belongs to the application, so every controller moves together. To move only the books endpoints, change the controller route instead.
