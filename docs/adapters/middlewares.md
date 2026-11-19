# Configure HTTP middleware

`@chojs/vendor-cho` supplies Fetch-based middleware for the built-in router. Install it alongside `@chojs/web` with `deno add jsr:@chojs/vendor-cho`, `npx jsr add @chojs/vendor-cho` or `bunx jsr add @chojs/vendor-cho`.

## Set the scope and order

```ts
import { ChoLinker, ChoWeb } from "@chojs/web";
import { bodyLimit, cors, logger, requestId, secureHeaders } from "@chojs/vendor-cho";
import { Library } from "./app.ts";

const app = await ChoWeb.create(Library, {
  linker: new ChoLinker({
    middlewares: [
      requestId(),
      logger(),
      secureHeaders(),
      cors({ origin: "https://catalog.example" }),
      bodyLimit({ maxSize: 1024 * 1024 }),
    ],
  }),
});
```

The first middleware wraps the others. With this order, logging sees a CORS preflight and a request refused by the size limit. To cover only the routes of one controller, pass middleware functions to [`@Middlewares`](/api/web#symbol-Middlewares) there.

## Allow browser clients from selected origins

Cross-Origin Resource Sharing: it lets a page of another origin call the
application from a browser.

```ts
cors({
  origin: ["https://example.com", "https://admin.example.com"],
  credentials: true,
  maxAge: 600,
});
```

| Option           | Default                                         | Use                                                                                                                 |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `origin`         | `"*"`                                           | The origins allowed: `"*"`, a string, a list, or a function `(origin, ctx)` that returns `true` (it can be `async`) |
| `methods`        | `GET`, `HEAD`, `PUT`, `POST`, `DELETE`, `PATCH` | The methods a cross-origin request may use                                                                          |
| `allowedHeaders` | the headers the preflight request asks for      | The request headers a cross-origin request may send                                                                 |
| `exposedHeaders` | none                                            | The response headers a script may read                                                                              |
| `credentials`    | `false`                                         | Whether requests may be sent with cookies or authorization                                                          |
| `maxAge`         | not sent                                        | For how long, in seconds, a browser may keep the answer to a preflight                                              |

What it does:

- **A preflight request** (an `OPTIONS` request with
  `Access-Control-Request-Method`) is answered `204` by the middleware itself.
  The handler does not run.
- **Any other request** runs as usual, and the CORS headers are added to its
  response.
- A request without an `Origin` header is left as it is. A request from an
  origin that is not allowed runs, and gets no CORS header: the browser is what
  refuses to give the response to the page.
- With `credentials`, a response never allows `*`: it names the origin of the
  request.
- `Vary: Origin` is added whenever the answer depends on the origin of the
  request, so that caches keep the answers apart.

**Put it on the router.** A browser sends a preflight request to the path of the
real request, with the method `OPTIONS`. A middleware declared with
`@Middlewares` only runs for a request that matches a route, so there it answers
preflight requests only where an [`@Options`](/api/web#symbol-Options) route exists. On the router
(`new ChoLinker({ middlewares: [cors()] })`) it answers them for every path.

## Bound request body size

Refuses a request whose body is larger than a limit, with
`413 Payload Too
Large`. A server on the standard `Request` has no limit of its
own: without it, a handler that reads the body reads all of it.

```ts
bodyLimit({ maxSize: 1024 * 1024 }); // 1 MB
```

| Option       | Default                    | Use                                     |
| ------------ | -------------------------- | --------------------------------------- |
| `maxSize`    | required                   | The largest body, in bytes              |
| `onExceeded` | `413`, `Payload Too Large` | A function `(ctx)` that answers instead |

- A request that declares its size (`Content-Length`) over the limit is refused
  at once, and nothing is read.
- A request that does not declare it (a chunked body) is counted while it is
  read. When it passes the limit, reading it fails, and the request is answered
  `413` whatever the rest of the chain answered.
- Put a larger limit on one handler with `@Middlewares`, such as an upload.

## Set security headers

Adds the response headers browsers use to protect a site.

```ts
secureHeaders({
  "content-security-policy": "default-src 'self'",
  "x-frame-options": "DENY",
  "strict-transport-security": false, // leave this default out
});
```

| Header                              | Default                               |
| ----------------------------------- | ------------------------------------- |
| `Cross-Origin-Opener-Policy`        | `same-origin`                         |
| `Cross-Origin-Resource-Policy`      | `same-origin`                         |
| `Origin-Agent-Cluster`              | `?1`                                  |
| `Referrer-Policy`                   | `no-referrer`                         |
| `Strict-Transport-Security`         | `max-age=15552000; includeSubDomains` |
| `X-Content-Type-Options`            | `nosniff`                             |
| `X-DNS-Prefetch-Control`            | `off`                                 |
| `X-Download-Options`                | `noopen`                              |
| `X-Frame-Options`                   | `SAMEORIGIN`                          |
| `X-Permitted-Cross-Domain-Policies` | `none`                                |
| `X-XSS-Protection`                  | `0`                                   |

The options are headers by name: a string sets one (a default or any other),
`false` leaves a default out. A header the response already has is kept. There
is no `Content-Security-Policy` by default.

## Record request outcomes

Writes one line for each request, when it is done: `GET /users/42 200 3ms`. The
query string is left out. A request that fails is logged too
(`GET /users/42 failed 3ms`), and its error goes on.

```ts
logger({
  log: (line) => log.info(line), // default: console.log
  format: ({ method, path, status, ms }) =>
    JSON.stringify({ method, path, status, ms }),
});
```

`format` receives `method`, `path`, `status` (`undefined` when the request
failed), `ms`, `error` and the context.

## Set a response deadline

Answers `504 Gateway Timeout` when the rest of the chain takes longer than a
limit.

```ts
timeout({ ms: 5000 });
```

| Option      | Default                  | Use                                     |
| ----------- | ------------------------ | --------------------------------------- |
| `ms`        | required                 | The limit, in milliseconds              |
| `onTimeout` | `504`, `Gateway Timeout` | A function `(ctx)` that answers instead |

The request is answered at the limit, but what was running is not stopped:
JavaScript has no way to stop it. Its result, or its error, is dropped.

## Carry a request ID through the handler

Gives every request an id. It is the one the request came with (the
`x-request-id` header) when that is a short, safe string, and a new UUID
otherwise. It is kept in `ctx.state` and sent back on the response.

```ts
import { REQUEST_ID, requestId } from "@chojs/vendor-cho";

requestId(); // or requestId({ header: "x-trace-id", generate: (ctx) => … })

// later, in a middleware or a handler
ctx.state.get(REQUEST_ID);
```

## Support conditional reads

Tags each response with a hash of its body (`ETag`), and answers
`304 Not Modified`, without the body, to a request that already has that tag
(`If-None-Match`).

```ts
etag(); // or etag({ weak: true })
```

- It applies to `GET` and `HEAD` requests answered `200`.
- The body is read whole to be hashed: keep it off the routes that stream.
- A stream of server-sent events (an [`@Sse`](/api/web#symbol-Sse) handler) is passed on as it is: its
  body is not read.
- A response that already has an `ETag` keeps it.

## Check a username and password

Asks for a name and a password, with HTTP Basic authentication. Anything else is
answered `401`, with the `WWW-Authenticate` header that makes a browser ask for
them. Use it over HTTPS only.

```ts
basicAuth({ username: "ada", password: "secret" });

basicAuth({
  realm: "Admin",
  verify: async (username, password, ctx) => {
    const user = await users.login(username, password);
    if (user) ctx.state.set("user", user);
    return user !== undefined;
  },
});
```

The name and the password of a single user are compared in constant time.

## Check a service token

Asks for a token, sent as `Authorization: Bearer <token>`. A request without the
header is answered `401` with `WWW-Authenticate: Bearer`; one with a token that
is not accepted, `401` with `error="invalid_token"`.

```ts
bearerAuth({ token: "s3cret" }); // or a list of tokens

bearerAuth({
  verify: async (token, ctx) => {
    const claims = await tokens.verify(token); // a JWT, say
    if (claims) ctx.state.set("claims", claims);
    return claims !== undefined;
  },
});
```

## Negotiate response compression

Compresses the body of a response, with `gzip` or `deflate`, for a client that
accepts it.

```ts
compress(); // or compress({ threshold: 4096 })
```

- A response is compressed when its body is a text type (text, JSON, XML,
  JavaScript, SVG), is not compressed already, does not say
  `Cache-Control: no-transform`, and is not smaller than `threshold` (1024 bytes
  by default).
- The body is compressed as a stream, so a streamed response stays streamed.
- A stream of server-sent events (an `@Sse` handler) is never compressed: its
  events go out as they come.
- `Vary: Accept-Encoding` is added, and a strong `ETag` becomes a weak one.
- It uses the standard `CompressionStream`; on a runtime without it, the
  middleware changes nothing. There is no Brotli.

## Check coverage

Send `OPTIONS` with `Origin` and `Access-Control-Request-Method` to a URL that has no explicit options handler. With the router setup above and the configured origin, expect `204` and CORS headers. Send a normal request and check for `x-request-id`. If preflight works only on registered paths, inspect where the middleware was installed.
