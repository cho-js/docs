# Translate route failures into HTTP responses

Handle expected failures close to the route that understands them. Use the application's `onError` for a consistent fallback across features.

```ts
class MissingBook extends Error {}

const app = await ChoWeb.create(Library, {
  onError(error, ctx) {
    if (error instanceof MissingBook) {
      return Response.json({ error: "Book not found" }, { status: 404 });
    }
    console.error(ctx.req.method, ctx.url.pathname, error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  },
});
```

## Where an error goes

CHO selects one handler for each route. It checks the method's `@Catch`, then the controller's, the declaring feature module's and finally `onError`. A class with `handle(error, ctx)` may serve as an error handler. Declare it as a visible provider. Application-level handlers resolve in the root module.

## What an error handler returns

A returned value follows the [response conversion rules](/web/responses). Returning an error object alone therefore produces JSON with status `200`. Return an explicit `Response` to set a failure status. Returning `undefined` leaves the original error unhandled. Throwing inside the selected handler also rejects the route. The HTTP adapter decides how to render that failure.

| Observation | Where to handle it |
| --- | --- |
| A known route fails in middleware or in a method | `@Catch` or `onError` |
| A built-in argument reader rejects invalid input under `validate()` | [`onInvalid`](/web/validation) |
| No route matches the URL and verb | The [adapter's not-found hook](/adapters/) |
| An SSE iterator fails after response headers have been sent | Inside the [stream producer](/web/sse) |
| An invalid route or provider prevents startup | Catch the rejection from `ChoWeb.create` at the entry point |
