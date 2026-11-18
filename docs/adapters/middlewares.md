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

The first middleware wraps the others. With this order, logging sees a CORS preflight and a request refused by the size limit. To cover only the routes of one controller, pass middleware functions to `@Middlewares` there.

## Request policies

| Function | Behavior and configuration |
| --- | --- |
| `cors({ origin, methods, allowedHeaders, exposedHeaders, credentials, maxAge })` | Responds to preflights and sets response headers for permitted origins. Mount on the router to cover `OPTIONS` requests without a matching route |
| `bodyLimit({ maxSize, onExceeded? })` | Enforces a byte limit. Rejects a declared oversize request immediately and counts a streamed body as it is read. Default failure status `413` |
| `basicAuth({ username, password })` | Checks HTTP Basic credentials. Use `verify` for programmatic verification. An unsuccessful check returns `401` |
| `bearerAuth({ token })` | Checks one or several accepted tokens, or use `verify`. An unsuccessful check returns `401` |
| `timeout({ ms, onTimeout? })` | Returns `504` by default when downstream work takes too long to produce a response. Long-running work needs its own cancellation policy |

## Response and observability policies

| Function | Behavior and configuration |
| --- | --- |
| `requestId({ header?, generate? })` | Reuses or creates an ID, sets the response header (default `x-request-id`) and exposes the value under `REQUEST_ID` in `ctx.state` |
| `logger({ log?, format? })` | Writes method, path, status and elapsed time. Supply `format` for structured fields or `log` to change the destination |
| `secureHeaders(options?)` | Adds the package's response header defaults. Supply header values or `false` to disable individual entries |
| `etag({ weak? })` | Computes a tag for eligible responses and answers matching conditional requests with `304`. Hashing a body can require buffering it |
| `compress({ threshold? })` | Negotiates supported compression for eligible responses. Observes `no-transform` and skips event streams |

## Check coverage

Send `OPTIONS` with `Origin` and `Access-Control-Request-Method` to a URL that has no explicit options handler. With the router setup above and the configured origin, expect `204` and CORS headers. Send a normal request and check for `x-request-id`. If preflight works only on registered paths, inspect where the middleware was installed.
