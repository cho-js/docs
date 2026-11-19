---
outline: 2
---

# @chojs/vendor-cho

Install router-wide middleware for preflight requests or misses. Install feature-specific policies on the controller or method they protect. [Apply an HTTP request policy](/adapters/middlewares) · [Browse all packages](/api/)

## BasicAuthOptions {#symbol-BasicAuthOptions}

The options of `basicAuth`: one user, or a function that checks.

```ts
export type BasicAuthOptions = {
    readonly realm?: string;
} & ({
    readonly username: string;
    readonly password: string;
} | {
    readonly verify: (username: string, password: string, ctx: ChoWebContext) => boolean | Promise<boolean>;
});
```

### Usage {#BasicAuthOptions-usage}

```ts
const options: BasicAuthOptions = { realm: "staff", verify: checkStaffPassword };
const staffOnly = basicAuth(options);
```

## BearerAuthOptions {#symbol-BearerAuthOptions}

The options of `bearerAuth`: tokens, or a function that checks.

```ts
export type BearerAuthOptions = {
    readonly token: string | readonly string[];
} | {
    readonly verify: (token: string, ctx: ChoWebContext) => boolean | Promise<boolean>;
};
```

### Usage {#BearerAuthOptions-usage}

```ts
const options: BearerAuthOptions = { token: serviceToken };
const serviceOnly = bearerAuth(options);
```

## BodyLimitOptions {#symbol-BodyLimitOptions}

The options of `bodyLimit`.

```ts
export type BodyLimitOptions = {
    readonly maxSize: number;
    readonly onExceeded?: (ctx: ChoWebContext) => Response | Promise<Response>;
};
```

**`maxSize`** The largest body a request may have, in bytes.

**`onExceeded`** Answer a request whose body is too large. Default: `413`, with the text
`Payload Too Large`.

### Usage {#BodyLimitOptions-usage}

```ts
const options: BodyLimitOptions = { maxSize: 64 * 1024 };
const limitUploads = bodyLimit(options);
```

## ChoVendorErrorCode {#symbol-ChoVendorErrorCode}

The codes of the errors of `@chojs/vendor-cho`. Each is described in `README.md`.

A mistake the core finds for the package has a code of the core
(`ChoCoreErrorCode` of `@chojs/core`): an unknown option is
`CHO_CORE_UNKNOWN_OPTION`.

```ts
export type ChoVendorErrorCode = "CHO_VENDOR_BODY_TOO_LARGE" | "CHO_VENDOR_INVALID_OPTION";
```

### Usage {#ChoVendorErrorCode-usage}

```ts
const CODES: Record<ChoVendorErrorCode, true> = {
  CHO_VENDOR_BODY_TOO_LARGE: true,
  CHO_VENDOR_INVALID_OPTION: true,
};
```

[Usage in vendor/cho/errors_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/cho/errors_test.ts#L8)

## CompressOptions {#symbol-CompressOptions}

The options of `compress`.

```ts
export type CompressOptions = {
    readonly threshold?: number;
};
```

**`threshold`** The smallest body worth compressing, in bytes, for a response that
declares its size. Default: `1024`.

### Usage {#CompressOptions-usage}

```ts
const options: CompressOptions = { threshold: 2048 };
const compressReports = compress(options);
```

## CorsOptions {#symbol-CorsOptions}

The options of `cors`.

```ts
export type CorsOptions = {
    readonly origin?: string | readonly string[] | ((origin: string, ctx: ChoWebContext) => boolean | Promise<boolean>);
    readonly methods?: readonly string[];
    readonly allowedHeaders?: readonly string[];
    readonly exposedHeaders?: readonly string[];
    readonly credentials?: boolean;
    readonly maxAge?: number;
};
```

**`origin`** The origins that may read the responses:

- `"*"`: any origin. Default.
- a string: that origin (`"https://example.com"`);
- a list of strings: those origins;
- a function `(origin, ctx)`: the origins it returns `true` for. It can
  be `async`.

An origin is compared as it is sent: scheme, host and port, with no
trailing slash.

**`methods`** The methods a cross-origin request may use, sent in answer to a
preflight request. Default: `GET`, `HEAD`, `PUT`, `POST`, `DELETE`,
`PATCH`.

**`allowedHeaders`** The request headers a cross-origin request may send, sent in answer to a
preflight request. Default: the headers the preflight request asks for.

**`exposedHeaders`** The response headers a script may read, besides the ones every script
may. Default: none.

**`credentials`** Whether a cross-origin request may be sent with credentials (cookies,
authorization). With credentials, a response never allows `*`: it names
the origin of the request. Default: `false`.

**`maxAge`** For how long, in seconds, a browser may keep the answer to a preflight
request. Default: not sent, so the browser's own default.

### Usage {#CorsOptions-usage}

```ts
const app = await ChoWeb.create(app_module(), {
      linker: new ChoLinker({
        middlewares: [cors({ origin: ORIGIN, credentials: true })],
      }),
    });
```

[Usage in vendor/cho/cors_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/cho/cors_test.ts#L333)

## EtagOptions {#symbol-EtagOptions}

The options of `etag`.

```ts
export type EtagOptions = {
    readonly weak?: boolean;
};
```

**`weak`** Whether the tag is a weak one (`W/"…"`): the content is equivalent, not
identical byte for byte. Default: `false`.

### Usage {#EtagOptions-usage}

```ts
const { response } = await run(etag({ weak }), {}, () => new Response(body));
```

[Usage in vendor/cho/etag_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/cho/etag_test.ts#L10)

## LoggerEntry {#symbol-LoggerEntry}

What `logger` knows about a request when it is done.

```ts
export type LoggerEntry = {
    readonly method: string;
    readonly path: string;
    readonly status: number | undefined;
    readonly ms: number;
    readonly error?: unknown;
    readonly ctx: ChoWebContext;
};
```

**`method`** The method of the request.

**`path`** The path of the request, without its query string.

**`status`** The status of the response; `undefined` when the request failed.

**`ms`** How long the request took, in milliseconds.

**`error`** The error the rest of the chain threw, when the request failed.

**`ctx`** The context of the request.

### Usage {#LoggerEntry-usage}

```ts
const entries: LoggerEntry[] = [];
```

[Usage in vendor/cho/logger_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/cho/logger_test.ts#L40)

## LoggerOptions {#symbol-LoggerOptions}

The options of `logger`.

```ts
export type LoggerOptions = {
    readonly log?: (line: string) => void;
    readonly format?: (entry: LoggerEntry) => string;
};
```

**`log`** Writes a line. Default: `console.log`.

**`format`** Makes the line of a request. Default: `GET /users/42 200 12ms`, and
`GET /users/42 failed 12ms` for a request that failed.

### Usage {#LoggerOptions-usage}

```ts
const options: LoggerOptions = { log: (line) => console.info(line) };
const logRequest = logger(options);
```

## REQUEST_ID {#symbol-REQUEST_ID}

The key of the request id in `ctx.state`.

```ts
export const REQUEST_ID = "requestId";
```

### Usage {#REQUEST_ID-usage}

```ts
assert.equal(ctx.state.get(REQUEST_ID), "trace-42.a/b");
```

[Usage in vendor/cho/request-id_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/cho/request-id_test.ts#L39)

## RequestIdOptions {#symbol-RequestIdOptions}

The options of `requestId`.

```ts
export type RequestIdOptions = {
    readonly header?: string;
    readonly generate?: (ctx: ChoWebContext) => string;
};
```

**`header`** The header that carries the id, on the request and on the response.
Default: `x-request-id`.

**`generate`** Makes the id of a request that has none. Default: a random UUID.

### Usage {#RequestIdOptions-usage}

```ts
const middleware = requestId({
      header: "x-trace",
      generate: (ctx) => `${ctx.req.method}-${++n}`,
    });
```

[Usage in vendor/cho/request-id_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/cho/request-id_test.ts#L53)

## SecureHeadersOptions {#symbol-SecureHeadersOptions}

The options of `secureHeaders`: headers by name, in any case. A
string sets the header, one of the defaults or any other
(`"content-security-policy"`); `false` leaves a default out.

```ts
export type SecureHeadersOptions = Readonly<Record<string, string | false>>;
```

### Usage {#SecureHeadersOptions-usage}

```ts
const options: SecureHeadersOptions = {};
const headers = secureHeaders(options);
```

## TimeoutOptions {#symbol-TimeoutOptions}

The options of `timeout`.

```ts
export type TimeoutOptions = {
    readonly ms: number;
    readonly onTimeout?: (ctx: ChoWebContext) => Response | Promise<Response>;
};
```

**`ms`** How long a request may take, in milliseconds.

**`onTimeout`** Answer a request that took too long. Default: `504`, with the text
`Gateway Timeout`.

### Usage {#TimeoutOptions-usage}

```ts
const options: TimeoutOptions = { ms: 2000 };
const serviceDeadline = timeout(options);
```

## basicAuth {#symbol-basicAuth}

Make a middleware that asks for a name and a password, with HTTP Basic
authentication. A request without the right ones is answered `401`, with
the `WWW-Authenticate` header that makes a browser ask for them.

Basic authentication sends the password with every request, encoded but
not encrypted: use it over HTTPS only.

```ts
export function basicAuth(options: BasicAuthOptions): ChoWebMiddlewareFn;
```

### Usage {#basicAuth-usage}

One user
```ts
@Middlewares(basicAuth({ username: "ada", password: "secret" }))
@Controller({ route: "admin" })
class AdminController {}
```

Checking against a store
```ts
basicAuth({
  verify: async (username, password, ctx) => {
    const user = await users.login(username, password);
    if (user) ctx.state.set("user", user);
    return user !== undefined;
  },
});
```

## bearerAuth {#symbol-bearerAuth}

Make a middleware that asks for a token, sent as
`Authorization: Bearer <token>`.

- A request without the header is answered `401`, with
  `WWW-Authenticate: Bearer`.
- A request with a token that is not accepted is answered `401`, with
  `WWW-Authenticate: Bearer error="invalid_token"`.

```ts
export function bearerAuth(options: BearerAuthOptions): ChoWebMiddlewareFn;
```

### Usage {#bearerAuth-usage}

```ts
@Middlewares(bearerAuth({ token: process.env.API_TOKEN! }))
@Controller({ route: "api" })
class ApiController {}
```

Checking a token of your own, such as a JWT
```ts
bearerAuth({
  verify: async (token, ctx) => {
    const claims = await tokens.verify(token);
    if (claims) ctx.state.set("claims", claims);
    return claims !== undefined;
  },
});
```

## bodyLimit {#symbol-bodyLimit}

Make a middleware that refuses a request whose body is larger than a
limit, with `413 Payload Too Large`.

A server on the standard `Request` has no limit of its own: without this
middleware, a handler that reads the body reads all of it, whatever its
size.

- A request that declares its size (`Content-Length`) over the limit is
  refused at once: the rest of the chain does not run, and nothing is
  read.
- A request that does not declare it (a streamed body) is counted while it
  is read. When it passes the limit, reading it fails, and the request is
  answered `413`, whatever the rest of the chain answered.
- A request without a body is left as it is.

```ts
export function bodyLimit(options: BodyLimitOptions): ChoWebMiddlewareFn;
```

### Usage {#bodyLimit-usage}

```ts
import { ChoLinker, ChoWeb } from "@chojs/web";
import { bodyLimit } from "@chojs/vendor-cho";

const app = await ChoWeb.create(AppModule, {
  linker: new ChoLinker({
    middlewares: [bodyLimit({ maxSize: 1024 * 1024 })], // 1 MB
  }),
});
```

A larger limit for one handler
```ts
@Middlewares(bodyLimit({ maxSize: 50 * 1024 * 1024 }))
@Post("upload")
upload(ctx: ChoWebContext) {
  return ctx.req.arrayBuffer();
}
```

## compress {#symbol-compress}

Make a middleware that compresses the body of a response, with `gzip` or
`deflate`, for a client that accepts it (`Accept-Encoding`).

A response is compressed when it has a body of a text type (text, JSON,
XML, JavaScript, SVG), is not compressed already, does not forbid it
(`Cache-Control: no-transform`), and is not smaller than the threshold. The
body is compressed as a stream: a streamed response stays streamed. A stream
of server-sent events (`text/event-stream`, an `@Sse` handler) is never
compressed: its events must go out as they come.

It uses the standard `CompressionStream`. On a runtime that does not have
it, the middleware changes nothing.

```ts
export function compress(options?: CompressOptions): ChoWebMiddlewareFn;
```

### Usage {#compress-usage}

```ts
import { ChoLinker, ChoWeb } from "@chojs/web";
import { compress } from "@chojs/vendor-cho";

const app = await ChoWeb.create(AppModule, {
  linker: new ChoLinker({ middlewares: [compress()] }),
});
```

## cors {#symbol-cors}

Make a CORS (Cross-Origin Resource Sharing) middleware: it lets pages of
other origins call the application from a browser.

- **A preflight request** (an `OPTIONS` request with
  `Access-Control-Request-Method`) is answered `204` by the middleware
  itself, with what is allowed. The rest of the chain does not run.
- **Any other request** runs the rest of the chain, and the middleware adds
  the CORS headers to its response.
- A request without an `Origin` header is not a cross-origin request: it is
  left as it is. A request from an origin that is not allowed gets no CORS
  header, so the browser refuses to give its response to the page.
- `Vary: Origin` is added whenever the answer depends on the origin of the
  request, so that caches keep the answers apart.

**Where to put it.** A browser sends a preflight request to the path of
the real request, with the method `OPTIONS`. A middleware of
`@Middlewares` only runs for a request that matches a route, so it answers
a preflight request only where there is an `@Options` route. To cover every
path, give the middleware to the router: `new ChoLinker({ middlewares:
[cors()] })`.

```ts
export function cors(options?: CorsOptions): ChoWebMiddlewareFn;
```

### Usage {#cors-usage}

On every request
```ts
import { ChoLinker, ChoWeb } from "@chojs/web";
import { cors } from "@chojs/vendor-cho";

const app = await ChoWeb.create(AppModule, {
  linker: new ChoLinker({
    middlewares: [
      cors({
        origin: ["https://example.com", "https://admin.example.com"],
        credentials: true,
        maxAge: 600,
      }),
    ],
  }),
});
```

On some routes
```ts
@Middlewares(cors({ origin: "https://example.com" }))
@Controller({ route: "public" })
class PublicController {
  @Get("status")
  status() {
    return { ok: true };
  }
}
```

## etag {#symbol-etag}

Make a middleware that lets a client keep a response it already has: it
tags each response with a hash of its body (`ETag`), and answers
`304 Not Modified`, without the body, to a request that already has that
tag (`If-None-Match`).

- It applies to `GET` and `HEAD` requests answered `200`.
- The body is read whole to be hashed, so a streamed response is not
  streamed any more: keep the middleware off the routes that stream.
- A stream of server-sent events (`text/event-stream`, an `@Sse` handler)
  is passed on as it is, its body unread.
- A response that already has an `ETag` is not hashed: its own tag is
  compared.

```ts
export function etag(options?: EtagOptions): ChoWebMiddlewareFn;
```

### Usage {#etag-usage}

```ts
@Middlewares(etag())
@Get("report")
report() {
  return this.reports.latest();
}
```

## logger {#symbol-logger}

Make a middleware that writes one line for each request, when it is done:
its method, its path, the status of the response and how long it took.

The query string is left out of the line: it can hold what should not be
in a log. A request that fails (the rest of the chain throws) is logged
too, and its error goes on.

```ts
export function logger(options?: LoggerOptions): ChoWebMiddlewareFn;
```

### Usage {#logger-usage}

```ts
import { ChoLinker, ChoWeb } from "@chojs/web";
import { logger } from "@chojs/vendor-cho";

const app = await ChoWeb.create(AppModule, {
  linker: new ChoLinker({ middlewares: [logger()] }),
});
// GET /users/42 200 3ms
```

As JSON, to another logger
```ts
logger({
  log: (line) => log.info(line),
  format: ({ method, path, status, ms }) =>
    JSON.stringify({ method, path, status, ms }),
});
```

## requestId {#symbol-requestId}

Make a middleware that gives every request an id, to follow it through
the logs.

- The id is the one the request came with (the `x-request-id` header),
  when it is a short string of letters, digits and `-_.=+/:`. Otherwise a
  new one is made.
- It is in `ctx.state`, under `REQUEST_ID` (`"requestId"`), for the
  middlewares and the handler after this one.
- It is sent back on the response, in the same header.

```ts
export function requestId(options?: RequestIdOptions): ChoWebMiddlewareFn;
```

### Usage {#requestId-usage}

```ts
import { ChoLinker, ChoWeb, type ChoWebContext } from "@chojs/web";
import { REQUEST_ID, requestId } from "@chojs/vendor-cho";

const app = await ChoWeb.create(AppModule, {
  linker: new ChoLinker({ middlewares: [requestId()] }),
});

// in a handler
@Get("")
list(ctx: ChoWebContext) {
  console.log(ctx.state.get(REQUEST_ID), "listing users");
}
```

## secureHeaders {#symbol-secureHeaders}

Make a middleware that adds the response headers browsers use to protect a
site: it turns off content type sniffing, framing by other sites, and so
on.

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

A header the response already has is kept: a handler can set its own.
There is no `Content-Security-Policy` by default, as it depends on the
application: give one in the options.

```ts
export function secureHeaders(options?: SecureHeadersOptions): ChoWebMiddlewareFn;
```

### Usage {#secureHeaders-usage}

```ts
import { ChoLinker, ChoWeb } from "@chojs/web";
import { secureHeaders } from "@chojs/vendor-cho";

const app = await ChoWeb.create(AppModule, {
  linker: new ChoLinker({
    middlewares: [
      secureHeaders({
        "content-security-policy": "default-src 'self'",
        "x-frame-options": "DENY",
        "strict-transport-security": false, // not behind HTTPS yet
      }),
    ],
  }),
});
```

## timeout {#symbol-timeout}

Make a middleware that answers `504 Gateway Timeout` when the rest of the
chain takes longer than a limit.

The request is answered at the limit, but what was running is not
stopped: JavaScript has no way to stop it. Its result, or its error, is
dropped when it comes. A handler that can be stopped should watch
`ctx.req.signal` or its own timer.

```ts
export function timeout(options: TimeoutOptions): ChoWebMiddlewareFn;
```

### Usage {#timeout-usage}

```ts
@Middlewares(timeout({ ms: 5000 }))
@Controller({ route: "reports" })
class ReportsController {}
```

## Also exported here

These declarations share their implementation with another entry point. Each link opens the full declaration.

[`ChoWebContext`](/api/web#symbol-ChoWebContext), [`ChoWebMiddlewareFn`](/api/web#symbol-ChoWebMiddlewareFn), [`ChoWebNext`](/api/web#symbol-ChoWebNext)
