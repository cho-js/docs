# Translate route failures into HTTP responses

Throw an [`HttpError`](/api/web#symbol-HttpError) when the route knows what the client should receive. In the [catalog example](/web/example), import `HttpError` from `@chojs/web` and replace the body of `Books.find` with these three lines. Request `GET /api/books/missing` to see the result.

```ts
const book = this.catalog.find(id);
if (book === undefined) throw new HttpError(404, "Book not found");
return book;
```

When a catalog is temporarily unavailable, a route or middleware can tell the client when to retry.

```ts
throw new HttpError(503, "Catalog index rebuild in progress", {
  headers: { "Retry-After": "30" },
});
```

| Request outcome | What the client receives |
| --- | --- |
| The copy is missing | Status `404` and `{"error":"Book not found"}` |
| The catalog is rebuilding | Status `503`, `Retry-After: 30` and `{"error":"Service Unavailable"}` |

`new HttpError(status, message?, { headers?, cause? })` accepts integer statuses from 400 through 599. Write 4xx messages for the caller. For a 5xx response CHO uses the status text in the body and keeps the supplied message and cause available for logging. Omitting the message uses the status text by default.

Using 3.4.0? See the [development setup](/guide/getting-started#run-examples-against-the-development-version) to try `HttpError` from the CHO checkout.

## Set a policy for a route or application

For a controller route, CHO selects the closest [`@Catch`](/api/web#symbol-Catch) on the method, controller or declaring feature module, falling back to the application's `onError`. A mounted route uses the application's `onError`. Exactly one handler receives the exception, including an `HttpError`. A handler class with `handle(error, ctx)` must be a visible provider.

```ts
import { ChoWeb, isHttpError } from "@chojs/web";

const app = await ChoWeb.create(Library, {
  onError(error, ctx) {
    if (isHttpError(error)) {
      if (error.status >= 500) console.error(ctx.url.pathname, error);
      return error.toResponse();
    }
    console.error(ctx.req.method, ctx.url.pathname, error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  },
});
```

[`isHttpError`](/api/web#symbol-isHttpError) recognizes errors thrown by another copy of the web package. `toResponse()` builds a fresh JSON response with the error's status and headers. A handler can also translate a domain failure by throwing an `HttpError`. Returning `undefined` preserves the original error. CHO converts an outstanding `HttpError` automatically and passes other unhandled exceptions to the adapter. To choose a response yourself, return a `Response`. Ordinary returned objects follow the [response conversion rules](/web/responses).

## Handle failures outside the route

| Failure | Where to handle it |
| --- | --- |
| A built-in argument reader rejects input under `validate()` | Customize [validation's `onInvalid`](/web/validation) |
| No route matches the URL and verb | Configure the [adapter's not-found hook](/adapters/) |
| An SSE iterator fails after the headers were sent | Handle the failure in the [stream producer](/web/sse) |
| A route declaration or provider prevents startup | Catch the failure from `ChoWeb.create` and inspect its [framework error code](/reference/errors) |

## Choose the response seen by the client

Throw `new HttpError(404, "Unknown book")` for a missing record. Repeat with an unexpected storage failure. Check the status, public body and server log separately. This preserves a useful domain message for the caller while keeping internal failure details on the server.
