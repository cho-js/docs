# Configure the built-in router

`ChoWeb.create(Library)` uses `ChoLinker` by default. It compiles routes into `URLPattern` objects when the application starts. It requires no additional router package.

## Customize unmatched requests

```ts
import { ChoLinker, ChoWeb } from "@chojs/web";
import { Library } from "./app.ts";

const app = await ChoWeb.create(Library, {
  prefix: "api",
  linker: new ChoLinker({
    notFound: (request) => Response.json(
      { error: "No route", path: new URL(request.url).pathname },
      { status: 404 },
    ),
  }),
});
```

Request `/missing` to check your not-found response. Throwing from an existing method is a different path and follows [route error handling](/web/error-handling). By default a miss returns `404 Not Found`, and a thrown `HttpError` uses its declared status. Other unhandled route failures are logged and answered with `500`. The built-in router also renders `HttpError` from its router-wide middleware and not-found hook.

## Inspect a match

```ts
const match = app.linked.instance.match("GET", "/api/books/42");
console.log(match?.route.name, match?.params); // Books.find, { id: "42" }
```

`match` tests an exact verb and pathname without running middleware or invoking the method. `fetch` also implements the `HEAD` fallback to `GET` and returns a bodyless response. For a full request test, use `app.handler`, which additionally observes the application's closed state.

## Wrap the router

Supply `middlewares` to `new ChoLinker({ middlewares })` for behavior that applies even when no route matches. Use this scope for CORS preflight, request IDs or access logging. The router shares request state with the selected route. [Configure HTTP middleware](/adapters/middlewares)
