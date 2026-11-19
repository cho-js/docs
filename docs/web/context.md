# Read the request context

A handler without [`@Args`](/api/web#symbol-Args) receives one [`ChoWebContext`](/api/web#symbol-ChoWebContext). The same route context flows through middleware, the handler and its error handler. Use it when the decision depends on several parts of the request.

```ts
@Get("search")
search(ctx: ChoWebContext) {
  return {
    terms: ctx.url.searchParams.getAll("q"),
    language: ctx.req.headers.get("accept-language") ?? "en",
  };
}
```

For `GET /search?q=sea&q=travel`, `terms` contains both values in order. Use a [handler argument](/web/arguments) when one named field is sufficient.

| Member | What you can read or store |
| --- | --- |
| `req` | The standard `Request`, including its method, headers, body and abort signal |
| `url` | A `URL` built on first access |
| `params` | Decoded strings captured by the matched path |
| `state` | A fresh `Map<PropertyKey, unknown>` for request-local values |
| `native` | The adapter's context, or `undefined` with the built-in router |

## Pass a value from middleware to a handler

```ts
const REQUEST_ID = Symbol("request id");

@Middlewares(async (ctx, next) => {
  ctx.state.set(REQUEST_ID, crypto.randomUUID());
  return await next();
})
@Controller()
class Diagnostics {
  @Get("trace")
  trace(ctx: ChoWebContext) {
    return { requestId: ctx.state.get(REQUEST_ID) };
  }
}
```

The symbol keeps independently written middleware from overwriting the same key. Keep per-request values in this map. Controller fields are shared across concurrent requests.

## Read a body once

`ctx.req` follows Fetch body-consumption rules. After a middleware consumes `req.text()`, a handler cannot independently read `req.json()` from that request. Choose one reader and pass its result through `state`, or use CHO's cached [body arguments](/web/arguments).

## Keep concurrent requests independent

Send two requests with different correlation IDs. Copy each ID from the incoming header into `ctx.state` in middleware, then read it in the handler. Each handler should see its own ID. Writing that value to a field on the controller would share it across requests.
