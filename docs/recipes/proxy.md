# Forward a request to another server

A handler that stands in front of another server passes the request on with
`fetch`, and the answer back. Both bodies are streamed: nothing is held in
memory, in either direction.

## The function

The answer of `fetch` cannot be returned as it is: some headers of a request
and of a response belong to one connection, not to the next one. Copy this
function into your application:

```ts
/** The headers that describe one connection, or that `fetch` sets itself. */
const SKIPPED = [
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

/** Send a request to another URL, and give its answer back. */
export async function forward(
  req: Request,
  target: string | URL,
): Promise<Response> {
  const headers = new Headers(req.headers);
  for (const name of SKIPPED) {
    headers.delete(name);
  }
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: req.body, //     streamed; null for a request without a body
      duplex: "half", //     required to send a stream as a body
      redirect: "manual", // a redirect is the client's to follow
      signal: req.signal, // the client went away: stop asking
    } as RequestInit);
  } catch (error) {
    if (req.signal.aborted) {
      throw error; // nobody is left to answer
    }
    return new Response("Bad Gateway", { status: 502 });
  }
  const answer = new Headers(upstream.headers);
  for (const name of [...SKIPPED, "content-encoding"]) {
    answer.delete(name);
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: answer,
  });
}
```

## The handlers

A route has no wildcard ([Routing](/web/routing#route-rules)), so each path that is
forwarded is a route:

```ts
const BILLING = "https://billing.internal";

@Controller({ route: "invoices" })
class InvoicesController {
  @Get("") // GET /invoices?year=2026
  list(ctx: ChoWebContext) {
    return forward(ctx.req, `${BILLING}/v2/invoices${ctx.url.search}`);
  }

  @Get(":id") // GET /invoices/42
  @Args(Param("id"))
  get(id: string, ctx: ChoWebContext) {
    return forward(
      ctx.req,
      `${BILLING}/v2/invoices/${encodeURIComponent(id)}`,
    );
  }

  @Post("") // POST /invoices, with its body
  create(ctx: ChoWebContext) {
    return forward(ctx.req, `${BILLING}/v2/invoices`);
  }
}
```

The status, the headers and the body of the other server reach the client: a
`404` stays a `404`, and a redirect stays a redirect. A server that cannot be
reached is answered `502 Bad Gateway`.

What runs before a handler runs before these too: the
[middlewares](/web/middlewares) of the route check who asks, before anything is
forwarded.

## Changing what is forwarded

`forward` takes a `Request`, so the handler can give it another one:

```ts
@Get(":id")
@Args(Param("id"))
get(id: string, ctx: ChoWebContext) {
  const req = new Request(ctx.req, { headers: new Headers(ctx.req.headers) });
  req.headers.delete("cookie"); // not the other server's business
  req.headers.set("authorization", `Bearer ${this.config.billingToken}`);
  return forward(req, `${BILLING}/v2/invoices/${encodeURIComponent(id)}`);
}
```

And it returns a `Response`, whose headers the handler can change before it
returns it:

```ts
const response = await forward(ctx.req, url);
response.headers.set("cache-control", "private, max-age=60");
return response;
```

## What to know

- **Why `content-encoding` is removed.** `fetch` decompresses the body it
  receives, and leaves the headers as they came. Passed on as they are, they
  announce a compressed body that is not compressed any more: on Node.js and
  Bun, the client fails to read the response. To compress what the client gets,
  use [`compress`](/adapters/middlewares#compress).
- **Encode what goes into the URL.** A path parameter is decoded:
  `encodeURIComponent(id)` keeps an id such as `../admin` a single segment.
- **The body of the request is read by `fetch`.** A handler that forwards it
  must not read it too, with a `Body` argument or with `ctx.req.json()`.
- **A stream is forwarded as a stream.** An answer that is sent piece by piece,
  [server-sent events](/web/sse) included, reaches the client piece by piece.
  When the client goes away, the request to the other server is aborted.
- **On Deno, a notice is printed** the first time a handler uses
  `ctx.req.signal`: `request.signal aborts on successful responses (legacy
  behavior)`. It announces a change of Deno, and changes nothing here.
- **The other server sees your server**, not the client: the request comes from
  the address of your server, and its `host` header is the other server's.
