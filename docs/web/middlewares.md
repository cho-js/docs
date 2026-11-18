# Run middleware around a route

A web middleware receives the request context and a `next` function. Calling `next()` runs the remaining middleware and eventually the handler. Await it to measure elapsed time or inspect the final response.

```ts
import { type ChoWebMiddlewareFn } from "@chojs/web";

export const timing: ChoWebMiddlewareFn = async (ctx, next) => {
  const start = performance.now();
  const response = await next();
  console.log(ctx.req.method, ctx.url.pathname, response.status,
    Math.round(performance.now() - start) + "ms");
  return response;
};
```

## Choose the scope

Apply `@Middlewares(timing)` to one method, a controller, or the module that declares those controllers. For a matched route, incoming work proceeds in this order:

1. Feature module middleware.
2. Controller middleware.
3. Method middleware.
4. Argument readers and the method.

After `await next()`, execution unwinds in reverse order. A root module that only imports features contributes no middleware to their routes. For every incoming request, including a preflight or a miss, use [router middleware](/adapters/middlewares).

## Short-circuit or continue

A middleware can return its own `Response` before calling `next()`. For example, a guard may return a `403` before the request body is read. If it returns nothing, it must have called `next()` so CHO can use the downstream response. Calling `next()` twice is an error.

```ts
@Middlewares(timing, validate())
@Controller({ route: "books" })
class Books { /* route methods */ }
```

A middleware that needs a provider can be an injectable class with `handle(ctx, next)`. Register the class in the declaring module's visible providers and pass the class itself to `@Middlewares`. Share per-request data through [`ctx.state`](/web/context).
