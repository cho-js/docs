# Forward a catalog lookup to an upstream service

An HTTP controller can expose one operation from another service. The following method forwards a GET to a fixed upstream origin, streams the response body and preserves the upstream status. Replace the example hostname with the catalog service you operate.

```ts
import { Args, Controller, Get, Param, type ChoWebContext } from "@chojs/web";

const catalogOrigin = "https://catalog.example";

@Controller({ route: "books" })
class Books {
  @Get(":id")
  @Args(Param("id"))
  async find(id: string, ctx: ChoWebContext) {
    if (!/^[A-Za-z0-9_-]+$/.test(id)) {
      return new Response("Invalid book ID", { status: 400 });
    }
    const target = new URL("/v1/books/" + id, catalogOrigin);
    const edition = ctx.url.searchParams.get("edition");
    if (edition !== null) target.searchParams.set("edition", edition);
    let upstream: Response;
    try {
      upstream = await fetch(target, {
        headers: { accept: "application/json" },
        signal: ctx.req.signal,
        redirect: "error",
      });
    } catch (error) {
      if (ctx.req.signal.aborted) throw error;
      return new Response("Catalog unavailable", { status: 502 });
    }
    const headers = new Headers();
    const type = upstream.headers.get("content-type");
    if (type) headers.set("content-type", type);
    return new Response(upstream.body, { status: upstream.status, headers });
  }
}
```

## Check the boundary

- Request `/books/42?edition=second`. The upstream receives `/v1/books/42?edition=second`.
- Return a `404` from the upstream. The client receives its status and body. A connection failure or an unexpected redirect produces `502`.
- Only the selected query field and the configured `Accept` header are forwarded. If the upstream expects service credentials, obtain them from an injected configuration provider.
- The body passes through as a stream. The proxy owns the outgoing headers. Omitting upstream `Content-Length` and `Content-Encoding` avoids describing a representation that Fetch may already have decoded.

For a route that also accepts a large request body, decide which media types, methods and size limits it supports before forwarding the stream. [Request bodies](/web/arguments) · [HTTP middleware](/adapters/middlewares)

## Propagate cancellation

Start a slow lookup and disconnect the caller. Pass the incoming request's abort signal to the outbound fetch so the upstream request can stop too. Check which upstream status codes and headers the proxy exposes as part of its own API contract.
