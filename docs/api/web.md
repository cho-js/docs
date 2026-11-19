---
outline: 2
---

# @chojs/web

Start by calling the Fetch handler with a Request, then add a listener or Worker entry point. [Build and dispatch HTTP routes](/web/quick-start) · [Browse all packages](/api/)

## AppRef {#symbol-AppRef}

The root of the HTTP graph: the application.

```ts
export class AppRef {
    readonly route: string;
    readonly errorHandler: ErrorHandlerRef;
    readonly features: FeatureRef[];
    constructor(route: string, errorHandler?: ErrorHandlerRef);
}
```

**`route`** The global route prefix; `""` when there is none.

**`errorHandler`** The error handler of the application (the `onError` option of
`ChoWeb.create`), or `null` when it has none. It handles the errors of the
routes that no `@Catch` handler covers.

**`features`** The features of the application.

**`constructor`** Create the application node, with no features yet.

### Usage {#AppRef-usage}

```ts
const graph: AppRef = app.graph;
console.log(graph.features.length);
```

## Args {#symbol-Args}

Declare the arguments a handler receives.

Standard decorators cannot decorate a parameter, so the arguments are
listed on the method, in the order of its parameters. The handler is then
called with the value of each argument, and with the context last:
`handler(...values, ctx)`. A handler without `@Args` receives the context
alone.

An argument is made by `Param`, `Query`, `Header`, `Body` or `Form`, or is
any function `(ctx) => value`. The parameters of the method are checked
against the arguments at compile time.

- The decorator goes above or below the HTTP method decorator.
- A method has one `@Args`. An override that declares it replaces the
  arguments it inherits; one that does not keeps them.
- The arguments are evaluated in order, after the middlewares of the route
  and just before the handler.

```ts
export function Args<const A extends readonly ChoWebArg[]>(...args: A): ChoWebArgsDecorator<ChoWebArgValues<A>>;
```

### Usage {#Args-usage}

```ts
@Controller({ route: "users" })
class UsersController {
  // PUT /users/42?notify=1
  @Put(":id")
  @Args(Param("id"), Query("notify"), Body<UpdateUser>())
  update(id: string, notify: string | undefined, user: UpdateUser, ctx: ChoWebContext) {
    return { id, ...user };
  }
}
```

## Body {#symbol-Body}

An argument from the body of the request, read and parsed as JSON.

- `Body()` gives the parsed body; an empty body gives `undefined`.
- `Body("name")` gives one property of it, or `undefined` when the body has
  none, or is not an object.
- The `content-type` of the request is not looked at.
- The body is read once for a request, whatever the number of `Body` and
  `Form` arguments. A handler that declares one must not read `ctx.req`
  itself.
- A validator can follow: `Body(validator)`, `Body("name", validator)`. It
  is run when the validation middleware covers the request. Without one,
  the value is `unknown`, or the type given by hand: `Body<User>()`.

```ts
export function Body<T = unknown>(): ChoWebArg<T>;
export function Body<T>(validator: ChoValidator<T>): ChoWebArg<T>;
export function Body<T = unknown>(key: string): ChoWebArg<T>;
export function Body<T>(key: string, validator: ChoValidator<T>): ChoWebArg<T>;
```

### Usage {#Body-usage}

```ts
@Post("")
@Args(Body<NewUser>())
create(user: NewUser) {
  return this.store.add(user);
}
```

## Catch {#symbol-Catch}

Declare the error handler of a feature module, a controller or a handler.

An error thrown by a handler or a middleware goes to the nearest one: the
handler's, else the controller's, else the feature's. What it returns is
the response, converted like a handler's result; when it returns nothing,
the error is still unhandled and goes on to the HTTP runtime (a `500`). A
class or method has at most one `@Catch`.

```ts
export function Catch(handler: ChoWebErrorHandler): ChoClassOrMethodDecorator;
```

### Usage {#Catch-usage}

```ts
@Catch((error, ctx) =>
  Response.json({ error: String(error), path: ctx.url.pathname }, { status: 500 })
)
@Controller({ route: "users" })
class UsersController {}
```

## ChoLinker {#symbol-ChoLinker}

Links the routes of a CHO web application to a `ChoRouter`: a plain
router on the standard URL Pattern API, with no HTTP library underneath.

The router only matches requests: each route answers through
`Route.handle`, which `@chojs/web` built. Middlewares, error handlers and
the conversion of results to responses are `@chojs/web`'s, so they behave
the same on every adapter.

- Routes are matched in declaration order.
- A `HEAD` request runs the `@Head` handler of the route; without one, the
  `@Get` handler answers it, without the body.
- A route that fails without a `@Catch` handler is logged with
  `console.error`, and answered with `500`.
- There is no runtime context: `ctx.native` is `undefined`.
- A route mounted on the application (`app.mount`) is taken at any time,
  and matched after the others.

It needs the global `URLPattern`, and is the linker of `ChoWeb.create`
when no linker is given.

```ts
export class ChoLinker implements Linker<ChoRouter> {

    constructor(options?: ChoLinkerOptions);
    link(routes: readonly Route[]): Linked<ChoRouter>;
}
```

**`link`** Create a router for routes.

**`constructor`** Create a linker.

### Usage {#ChoLinker-usage}

```ts
import { ChoLinker, ChoWeb } from "@chojs/web";

const app = await ChoWeb.create(AppModule, { linker: new ChoLinker() });
Deno.serve(app.handler);
```

With a not-found handler
```ts
const linker = new ChoLinker({
  notFound: () => Response.json({ error: "not found" }, { status: 404 }),
});
```

With middlewares that run for every request
```ts
import { cors } from "@chojs/vendor-cho";

const linker = new ChoLinker({ middlewares: [cors()] });
```

## ChoLinkerOptions {#symbol-ChoLinkerOptions}

The options of a `ChoLinker`.

```ts
export type ChoLinkerOptions = {
    readonly notFound?: (req: Request) => Response | Promise<Response>;
    readonly middlewares?: readonly ChoWebMiddlewareFn[];
};
```

**`notFound`** Answer a request no route matches. Default: `404`, with the text
`Not Found`.

**`middlewares`** The middlewares of the router: functions `(ctx, next)` that run for
**every** request, in order, around the route that answers it. Unlike the
middlewares of `@Middlewares`, they also run for a request no route
matches, which is what a CORS middleware needs to answer the preflight
requests of every path. Default: none.

They have a context of their own for each request: `params` are those of
the matched route (empty when there is none). Its `state` is the one the
middlewares and the handler of the route see, so what a middleware of the
router sets (the authenticated user, a request id) reaches them.

### Usage {#ChoLinkerOptions-usage}

```ts
const options: ChoLinkerOptions = { middlewares: [cors()] };
const app = await ChoWeb.create(Library, { linker: new ChoLinker(options) });
```

## ChoMatch {#symbol-ChoMatch}

A route a `ChoRouter` matched, and the parameters of the match.

```ts
export type ChoMatch = {
    readonly route: Route;
    readonly params: Readonly<Record<string, string>>;
};
```

**`route`** The route.

**`params`** The path parameters, decoded.

### Usage {#ChoMatch-usage}

```ts
const match: ChoMatch | undefined = router.match("GET", "/books/42");
if (match) console.log(match.route.name, match.params);
```

## ChoRouter {#symbol-ChoRouter}

The router of `ChoLinker`: the routes of an application, each with
its URL pattern.

```ts
export class ChoRouter {

    readonly routes: readonly Route[];
    constructor(routes: readonly Route[], options?: ChoLinkerOptions);
    mount(route: Route): void;
    match(method: string, pathname: string): ChoMatch | undefined;
    readonly fetch: (req: Request) => Promise<Response>;
}
```

**`mount`** Add a route, after the ones the router has: it is matched last. A router
takes a route at any time, also after it answered requests.

**`match`** Find the route of a request: the first one, in declaration order, with
that method and a path that matches.

**`routes`** The routes, in declaration order; the mounted ones come last.

**`fetch`** The request handler: a `fetch`-style function.

- The middlewares of the router, if any, run around everything below.
- A `HEAD` request without a `HEAD` route is answered by the `GET` route
  of the path, without the body.
- A request no route matches is answered by the `notFound` option.
- A route or a middleware of the router that rejects is logged with
  `console.error`, and answered with `500`.
- An `HttpError` thrown by a middleware of the router, or by `notFound`,
  is answered as a route answers it: with its status. One thrown in a
  route never gets here: the route answers it.

**`constructor`** Create a router.

### Usage {#ChoRouter-usage}

```ts
const app = await ChoWeb.create(AppModule, { linker: new ChoLinker() });
const router = app.linked.instance;
router.match("GET", "/users/42")?.params; // { id: "42" }
Deno.serve(router.fetch);
```

## ChoWeb {#symbol-ChoWeb}

A web application, built from a root module.

Every module that declares controllers is a feature. The route of a handler
joins up to four levels, each optional: the global `prefix`, the feature
module's `route`, the controller's `route` and the route given to the HTTP
method decorator (`@Get("…")`).

Handlers, middlewares and error handlers receive a `ChoWebContext`, built
on the standard `Request`, whatever the HTTP runtime. What a handler
returns is the response: a `Response` as is, nothing as `204`, a string
or bytes as they are, anything else as JSON.

```ts
export class ChoWeb<T = unknown> {

    readonly linked: Linked<T>;
    readonly graph: AppRef;
    readonly routes: readonly Route[];
    readonly injector: Injector;
    readonly handler: (req: Request) => Promise<Response>;
    readonly upgrade: (req: Request) => Promise<ChoWebUpgrade | Response>;
    static create<T>(app: Ctr, options: ChoWebOptions<T> & {
        linker: Linker<T>;
    }): Promise<ChoWeb<T>>;
    static create(app: Ctr, options?: Omit<ChoWebOptions<ChoRouter>, "linker">): Promise<ChoWeb<ChoRouter>>;
    constructor(linked: Linked<T>, graph: AppRef, routes: readonly Route[], injector: Injector);
    mount(method: ChoWebMountMethod, route: string, handler: (ctx: ChoWebContext) => unknown, options?: ChoWebMountOptions): void;
    close(): Promise<void>;
    [Symbol.asyncDispose](): Promise<void>;
}
```

**`create`** Create the web application of a root module.

Creates the injector and every instance of the application, builds the
HTTP graph, compiles its routes, and registers them with
`options.linker`.

**`create`** Create the web application of a root module, on the built-in router:
without a linker, the routes are registered with a `ChoLinker`, and
`linked.instance` is its `ChoRouter`.

**`mount`** Add one more route to the application, after it is created.

The routes of an application are declared by its controllers. `mount` is
for a route that cannot be declared, because it is made from the
application itself: the documentation of its routes, which reads
`graph`.

- The route is written like the route of a decorator (`"internal/docs"`,
  `"users/:id"`, `""`), and says its whole path: it is **not** under the
  global prefix, which is for the routes the application declares.
- It is added to `routes`, after the others, and registered on the
  HTTP runtime. It is not in `graph`.
- What the handler returns is the response, converted like the result of
  a declared handler.
- No middleware and no `@Catch` handler of the application runs for it:
  it has the `middlewares` of the options. When it fails, the `onError`
  of `ChoWeb.create` answers, if there is one; without one it
  rejects, and the HTTP runtime answers `500`.
- It is the last route: where the first declared route wins (the
  built-in router, Hono), a declared route that matches the same path
  answers first.

Call it before the application serves. Later, the HTTP runtime decides:
the built-in router takes the route, Hono and Fastify throw.

**`close`** Release the instances of the application: every provider, controller and
module that has a `Symbol.asyncDispose` or `Symbol.dispose`
method is disposed, in reverse creation order (see `Injector.dispose`).

Call it when the server has stopped: `@chojs/web` does not run the
server, so it cannot know. Requests still in flight keep the instances
they hold, disposed or not; a request that arrives afterwards is answered
`503 Service Unavailable` by `handler`, and runs no route. Calling
it again does nothing more.

**`[Symbol.asyncDispose]`** Close the application at the end of an `await using` block.

**`linked`** The linked HTTP application, which holds the runtime's own object.

**`graph`** The HTTP graph: the features, controllers and handlers of the
application, as a tree. For introspection, such as listing routes.

**`routes`** The routes of the application: those it declares, as given to the
linker, then those `mount` added.

**`injector`** The injector of the application: it holds its instances, and is disposed
by `close`. Give it to the `from` of another CHO module, such as
`ChoMessage.from(app.injector)` of `@chojs/message`, to build a second
application on the same instances. Close that application first: this
one owns the injector.

**`handler`** The request handler of the application: a `fetch`-style function that
takes a `Request` and resolves to a `Response`. It is the handler of the
linked runtime (`linked.handler`), with whatever other arguments the
server gives it, until the application is closed: after `close`, it
answers `503 Service Unavailable` without running any route.

**`constructor`** Use `ChoWeb.create`, which builds and links the application from a
module.

### Usage {#ChoWeb-usage}

```ts
import { ChoWeb, type ChoWebContext, Controller, Get, Module } from "@chojs/web";
import { HonoLinker } from "@chojs/vendor-hono";

@Controller({ route: "users" })
class UsersController {
  @Get(":id")
  get(ctx: ChoWebContext) {
    return { id: ctx.params.id };
  }
}

@Module({ route: "api", controllers: [UsersController] })
class App {}

// GET /api/users/42 -> {"id":"42"}
const app = await ChoWeb.create(App, { linker: new HonoLinker() });
Deno.serve(app.handler);
```
```ts
const app = await ChoWeb.create(AppModule, {
  linker: new HonoLinker(),
  prefix: "api",
});
Deno.serve({ port: 8080 }, app.handler);
```
```ts
const app = await ChoWeb.create(AppModule);
Deno.serve(app.handler);
```
```ts
const app = await ChoWeb.create(AppModule, { prefix: "api" });
app.mount("GET", "health", () => ({ status: "ok" })); // GET /health
Deno.serve(app.handler);
```
```ts
const app = await ChoWeb.create(AppModule, { linker: new HonoLinker() });
const server = Deno.serve(app.handler);
Deno.addSignalListener("SIGTERM", async () => {
  await server.shutdown(); // stop accepting, finish the requests
  await app.close();
});
```
Deno
```ts
Deno.serve(app.handler);
```

Bun
```ts
Bun.serve({ fetch: app.handler });
```

On a host and TypeScript toolchain with explicit resource management, scope the application to the block that owns it. Leaving the block awaits its async disposer. [Application lifecycle](/web/application)

```ts
{
  await using web = await ChoWeb.create(Library);
  console.log((await web.handler(new Request("http://library/books/42"))).status);
}
```

## ChoWebArg {#symbol-ChoWebArg}

An argument of a handler, as given to `@Args`: a function that takes the
context of the request and gives the value, now or as a promise.

`Param`, `Query`, `Header`, `Body` and `Form` make one, with its `info`. Any
other function of that shape is an argument too.

```ts
export type ChoWebArg<T = unknown> = ((ctx: ChoWebContext) => T | Promise<T>) & {
    readonly info?: ChoWebArgInfo;
};
```

### Usage {#ChoWebArg-usage}

```ts
const CurrentUser: ChoWebArg<User> = (ctx) => ctx.state.get("user") as User;
```

## ChoWebArgInfo {#symbol-ChoWebArgInfo}

What is known about an argument made by `Param`, `Query`, `Header`, `Body`
or `Form`: enough to describe it in an OpenAPI document.

```ts
export type ChoWebArgInfo = {
    readonly source: ChoWebArgSource;
    readonly key?: string;
    readonly validator?: ChoValidator;
};
```

**`source`** Where the value is read from.

**`key`** The key of the source, when the argument is one key of it.

**`validator`** The validator of the argument, when it has one: its schema.

### Usage {#ChoWebArgInfo-usage}

```ts
const info: ChoWebArgInfo = Object.freeze({
    source,
    ...(key === undefined ? {} : { key }),
    ...(validator === undefined ? {} : { validator }),
  });
```

[Usage in web/args.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/web/args.ts#L206)

## ChoWebArgSource {#symbol-ChoWebArgSource}

Where an argument made by `Param`, `Query`, `Header`, `Body` or `Form` reads from.

```ts
export type ChoWebArgSource = "param" | "query" | "header" | "body" | "form";
```

### Usage {#ChoWebArgSource-usage}

```ts
const fields: ChoWebArgSource[] = ["param", "query", "body"];
```

## ChoWebArgValues {#symbol-ChoWebArgValues}

The values of a list of arguments: what a handler receives for them, in
order.

```ts
export type ChoWebArgValues<A extends readonly ChoWebArg[]> = {
    -readonly [K in keyof A]: Awaited<ReturnType<A[K]>>;
};
```

### Usage {#ChoWebArgValues-usage}

```ts
return decorate as ChoWebArgsDecorator<ChoWebArgValues<A>>;
```

[Usage in web/decorators.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/web/decorators.ts#L702)

## ChoWebArgsDecorator {#symbol-ChoWebArgsDecorator}

The decorator `@Args` returns. It only accepts a method whose parameters
take the values of the arguments, in order, and then the context: a handler
that expects something else does not compile.

It has both decorator call shapes: standard (TC39) `(method, context)`, and
legacy / Bun `(prototype, name, descriptor)`.

```ts
export type ChoWebArgsDecorator<P extends unknown[]> = {
    <M extends (this: any, ...args: [
        ...P,
        ChoWebContext
    ]) => unknown>(method: M, context: ClassMethodDecoratorContext): void;
    <M extends (this: any, ...args: [
        ...P,
        ChoWebContext
    ]) => unknown>(target: object, name: string | symbol, descriptor: TypedPropertyDescriptor<M>): void;
};
```

### Usage {#ChoWebArgsDecorator-usage}

```ts
return decorate as ChoWebArgsDecorator<ChoWebArgValues<A>>;
```

[Usage in web/decorators.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/web/decorators.ts#L702)

## ChoWebContext {#symbol-ChoWebContext}

The context of one request.

```ts
export interface ChoWebContext {
    readonly req: Request;
    readonly params: Readonly<Record<string, string>>;
    readonly url: URL;
    readonly state: Map<PropertyKey, unknown>;
    readonly native: unknown;
}
```

**`req`** The request, as the standard `Request`.

**`params`** The path parameters of the matched route (`:id`), decoded.

**`url`** The request URL, parsed on first use.

**`state`** Values shared during the request: a middleware sets one (the
authenticated user, say) for the middlewares and the handler after it.

**`native`** The context of the HTTP runtime (Hono's `Context` with `HonoLinker`), or
`undefined` when the adapter has none. Code that uses it only runs on
that runtime.

### Usage {#ChoWebContext-usage}

```ts
@Controller({ route: "users" })
class UsersController {
  @Get(":id")
  get(ctx: ChoWebContext) {
    return { id: ctx.params.id, verbose: ctx.url.searchParams.has("v") };
  }
}
```

## ChoWebDoc {#symbol-ChoWebDoc}

The options of `@Doc`: what the code cannot tell about a handler, a
controller or a feature module, for the documentation of the application.

```ts
export type ChoWebDoc = {
    readonly summary?: string;
    readonly description?: string;
    readonly tags?: readonly string[];
    readonly deprecated?: boolean;
    readonly responses?: Readonly<Record<number, ChoWebDocResponse>>;
    readonly hidden?: boolean;
    readonly operationId?: string;
    readonly security?: readonly ChoWebDocSecurity[];
};
```

**`summary`** One line about the operation. On a handler only.

**`description`** A longer text.

**`tags`** The tags of the handlers under it.

**`deprecated`** Whether it should no longer be used.

**`responses`** The responses, by status. On a handler only.

**`hidden`** Whether it is left out of the documentation.

**`operationId`** The id of the operation. On a handler only. Default, for what generates
the documentation: the controller and the method, `UsersController.get`.

**`security`** What the handlers under it require: any one of the listed requirements.
The nearest one wins (the handler's, then the controller's, then the
feature's), and an empty list says that nothing is required. It only
documents what a middleware enforces.

### Usage {#ChoWebDoc-usage}

```ts
@Doc({
    summary: "List the users",
    security: [], // public
    responses: { 200: { description: "A page of users", schema: UsersSchema } },
  })
  @Get("")
  @Args(Query(PageSchema))
  list({ page, size }: Page) {
    return [...users.values()].slice((page - 1) * size, page * size);
  }
```

[Usage in examples/openapi-http.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/openapi-http.ts#L122)

## ChoWebDocResponse {#symbol-ChoWebDocResponse}

A response of a handler, as documented with `@Doc`.

```ts
export type ChoWebDocResponse = {
    readonly description?: string;
    readonly schema?: ChoValidator;
    readonly contentType?: string;
};
```

**`description`** What the response means.

**`schema`** The schema of its body: a validator.

**`contentType`** The media type of its body. Default: `application/json`.

### Usage {#ChoWebDocResponse-usage}

```ts
@Doc({
    summary: "List the users",
    security: [], // public
    responses: { 200: { description: "A page of users", schema: UsersSchema } },
  })
  @Get("")
  @Args(Query(PageSchema))
  list({ page, size }: Page) {
    return [...users.values()].slice((page - 1) * size, page * size);
  }
```

[Usage in examples/openapi-http.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/openapi-http.ts#L122)

## ChoWebDocSecurity {#symbol-ChoWebDocSecurity}

What a handler requires of a request, for the documentation: the name of a
security scheme, and the scopes it needs (an empty list when it has none).
It is the Security Requirement Object of OpenAPI.

```ts
export type ChoWebDocSecurity = Readonly<Record<string, readonly string[]>>;
```

### Usage {#ChoWebDocSecurity-usage}

```ts
const admin: ChoWebDocSecurity = { oauth: ["admin"] };
```

## ChoWebErrorCode {#symbol-ChoWebErrorCode}

The codes of the errors of `@chojs/web`. Each is described in `specs.md`,
section 9.

A mistake the core finds for a web application has a code of the core
(`ChoCoreErrorCode` of `@chojs/core`): an unknown option of a decorator is
`CHO_CORE_UNKNOWN_OPTION`.

```ts
export type ChoWebErrorCode = "CHO_WEB_CLOSED" | "CHO_WEB_CREATE_FAILED" | "CHO_WEB_DUPLICATE_DECORATOR" | "CHO_WEB_DUPLICATE_ROUTE" | "CHO_WEB_INVALID_ARGUMENT" | "CHO_WEB_INVALID_EVENT" | "CHO_WEB_INVALID_HANDLER" | "CHO_WEB_INVALID_METHOD" | "CHO_WEB_INVALID_MIDDLEWARE" | "CHO_WEB_INVALID_OPTION" | "CHO_WEB_INVALID_ROUTE" | "CHO_WEB_INVALID_SOCKET" | "CHO_WEB_INVALID_SOCKET_RESULT" | "CHO_WEB_INVALID_SSE_RESULT" | "CHO_WEB_INVALID_STATUS" | "CHO_WEB_INVALID_TARGET" | "CHO_WEB_NO_SERVER" | "CHO_WEB_NO_URL_PATTERN" | "CHO_WEB_UNKNOWN_PARAM";
```

### Usage {#ChoWebErrorCode-usage}

```ts
const CODES: Record<ChoWebErrorCode, true> = {
  CHO_WEB_CLOSED: true,
  CHO_WEB_CREATE_FAILED: true,
  CHO_WEB_DUPLICATE_DECORATOR: true,
  CHO_WEB_DUPLICATE_ROUTE: true,
  CHO_WEB_INVALID_ARGUMENT: true,
  CHO_WEB_INVALID_EVENT: true,
  CHO_WEB_INVALID_HANDLER: true,
  CHO_WEB_INVALID_METHOD: true,
  CHO_WEB_INVALID_MIDDLEWARE: true,
  CHO_WEB_INVALID_OPTION: true,
  CHO_WEB_INVALID_ROUTE: true,
  CHO_WEB_INVALID_SOCKET: true,
  CHO_WEB_INVALID_SOCKET_RESULT: true,
  CHO_WEB_INVALID_SSE_RESULT: true,
  CHO_WEB_INVALID_STATUS: true,
  CHO_WEB_INVALID_TARGET: true,
  CHO_WEB_NO_SERVER: true,
  CHO_WEB_NO_URL_PATTERN: true,
  CHO_WEB_UNKNOWN_PARAM: true,
};
```

[Usage in web/errors_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/web/errors_test.ts#L8)

## ChoWebErrorHandler {#symbol-ChoWebErrorHandler}

An error handler, as given to `@Catch`: a function, or a class with a
`handle(error, ctx)` method, created by the injector in the scope of the
feature module.

```ts
export type ChoWebErrorHandler = ChoWebErrorHandlerFn | Ctr<{
    handle: ChoWebErrorHandlerFn;
}>;
```

### Usage {#ChoWebErrorHandler-usage}

```ts
export function Catch(handler: ChoWebErrorHandler): ChoClassOrMethodDecorator {
  return (target, context, descriptor) => {
    const meta = decorated_target("@Catch()", target, context, descriptor);
    set_error_handler(meta, handler);
  };
}
```

[Usage in web/decorators.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/web/decorators.ts#L382)

## ChoWebErrorHandlerFn {#symbol-ChoWebErrorHandlerFn}

An error handler function. What it returns is the response, converted like
a handler's result, with one difference: returning nothing is not a
response. The error is then still unhandled, and goes on to the HTTP
runtime (a `500`), so a handler that only logs does not turn a failed
request into a success.

```ts
export type ChoWebErrorHandlerFn = (error: unknown, ctx: ChoWebContext) => unknown;
```

### Usage {#ChoWebErrorHandlerFn-usage}

```ts
const on_error: ChoWebErrorHandlerFn = (error, ctx) =>
  Response.json({ error: String(error), path: ctx.url.pathname }, { status: 500 });
```

## ChoWebHandler {#symbol-ChoWebHandler}

A route handler: a controller method marked with `@Get`, `@Post`, ...

What it returns (or resolves to) is the response: a `Response` is sent as
is, `undefined` answers `204 No Content`, a body the platform knows (a
string, bytes, a `Blob`, a `ReadableStream`, a form) is sent as it is, and
anything else is sent as JSON.

```ts
export type ChoWebHandler = (ctx: ChoWebContext) => unknown;
```

### Usage {#ChoWebHandler-usage}

```ts
const health: ChoWebHandler = () => ({ ready: true });
app.mount("GET", "health", health);
```

## ChoWebInvalid {#symbol-ChoWebInvalid}

What failed the validation of a request: given to `onInvalid`.

```ts
export type ChoWebInvalid = {
    readonly source: ChoWebArgSource;
    readonly key?: string;
    readonly issues: readonly ChoIssue[];
    readonly error?: unknown;
};
```

**`source`** The source of the argument that is not valid.

**`key`** Its key, when the argument is one key of the source.

**`error`** Optional original exception from parsing. Use `issues` for normalized validation failures.

### Usage {#ChoWebInvalid-usage}

```ts
function describeInvalid(field: ChoWebInvalid) {
  return { source: field.source, key: field.key, issues: field.issues };
}
```

## ChoWebMiddleware {#symbol-ChoWebMiddleware}

A middleware, as given to `@Middlewares`: a function, or a class with a
`handle(ctx, next)` method, created by the injector in the scope of the
feature module.

```ts
export type ChoWebMiddleware = ChoWebMiddlewareFn | Ctr<{
    handle: ChoWebMiddlewareFn;
}>;
```

### Usage {#ChoWebMiddleware-usage}

```ts
const trace: ChoWebMiddleware = async (ctx, next) => {
  console.log(ctx.req.method);
  return await next();
};
```

## ChoWebMiddlewareFn {#symbol-ChoWebMiddlewareFn}

A middleware function. It wraps the rest of the chain (the next
middlewares, then the handler):

- `next()` runs the rest of the chain and resolves to its `Response`;
- returning a `Response` answers the request with it, whether `next()` was
  called (to replace the response) or not (to answer early);
- returning nothing after calling `next()` passes the response on.

```ts
export type ChoWebMiddlewareFn = (ctx: ChoWebContext, next: ChoWebNext) => Response | void | Promise<Response | void>;
```

### Usage {#ChoWebMiddlewareFn-usage}

```ts
const timing: ChoWebMiddlewareFn = async (ctx, next) => {
  const start = Date.now();
  const res = await next();
  res.headers.set("x-time", `${Date.now() - start}ms`);
  return res;
};

const auth: ChoWebMiddlewareFn = (ctx, next) =>
  ctx.req.headers.has("authorization")
    ? next()
    : new Response("unauthorized", { status: 401 });
```

## ChoWebMountMethod {#symbol-ChoWebMountMethod}

An HTTP method of a mounted route (see `ChoWeb.mount`).

```ts
export type ChoWebMountMethod = typeof MOUNT_METHODS[number];
```

### Usage {#ChoWebMountMethod-usage}

```ts
const method: ChoWebMountMethod = "GET";
app.mount(method, "health", () => ({ ready: true }));
```

## ChoWebMountOptions {#symbol-ChoWebMountOptions}

The options of `ChoWeb.mount`.

```ts
export type ChoWebMountOptions = {
    middlewares?: readonly ChoWebMiddlewareFn[];
    name?: string;
};
```

**`middlewares`** Middleware functions `(ctx, next)`, in order, around the handler. A
mounted route is not declared: no middleware of a feature or of a
controller runs for it. Default: none.

**`name`** The name of the route, for logs and errors. Default: the name of the
handler function, or `mounted`.

### Usage {#ChoWebMountOptions-usage}

```ts
const options: ChoWebMountOptions = { name: "readiness" };
app.mount("GET", "health", () => ({ ready: true }), options);
```

## ChoWebNext {#symbol-ChoWebNext}

Runs the rest of the chain, and resolves to its response.

```ts
export type ChoWebNext = () => Promise<Response>;
```

### Usage {#ChoWebNext-usage}

```ts
async function addTiming(next: ChoWebNext) {
  const start = performance.now();
  const response = await next();
  console.log(response.status, performance.now() - start);
  return response;
}
```

## ChoWebOptions {#symbol-ChoWebOptions}

Options of `ChoWeb.create`. Every option is optional.

```ts
export type ChoWebOptions<T = unknown> = {
    linker?: Linker<T>;
    prefix?: string;
    onError?: ChoWebErrorHandler;
    overrides?: readonly Provider[];
};
```

**`linker`** The linker that registers the routes on an HTTP runtime,
such as `HonoLinker` from `@chojs/vendor-hono`.

Default: `new ChoLinker()`, the built-in router, which matches requests
with the standard URL Pattern API and needs no HTTP library.

**`prefix`** The global route prefix, added before every feature route, without
leading or trailing `/` (for example `"api"`). Default: `""`, no prefix.

**`onError`** The error handler of the application: it handles the errors of every
route that no `@Catch` handler covers (the handler's, the controller's
and the feature's come first). Like `@Catch`, it takes a function
`(error, ctx)`, or a class with a `handle(error, ctx)` method, created by
the injector in the scope of the root module; what it returns is the
response, converted like a handler's result. When it returns nothing
(it only logs, say), the error is still unhandled. Default: none.
Unhandled errors go to the HTTP runtime, which answers `500`.

It covers the errors of routes only: a request that matches no route
never reaches it (set the runtime's own not-found handler).

**`overrides`** Providers that replace the declared providers of the same token, for
tests (see `InjectorOptions.overrides` of `@chojs/core`). Default: none.

### Usage {#ChoWebOptions-usage}

```ts
import { HonoLinker } from "@chojs/vendor-hono";

const app = await ChoWeb.create(AppModule, {
  linker: new HonoLinker(),
  prefix: "api/v1", // every route starts with /api/v1
});
```

## ChoWebSseDecorator {#symbol-ChoWebSseDecorator}

The decorator `@Sse` returns. It only accepts a method that returns the
events of the stream (see `ChoWebSseResult`): a handler that returns
something else does not compile.

It has both decorator call shapes: standard (TC39) `(method, context)`, and
legacy / Bun `(prototype, name, descriptor)`.

```ts
export type ChoWebSseDecorator = {
    <M extends (this: any, ...args: any[]) => ChoWebSseResult | Promise<ChoWebSseResult>>(method: M, context: ClassMethodDecoratorContext): void;
    <M extends (this: any, ...args: any[]) => ChoWebSseResult | Promise<ChoWebSseResult>>(target: object, name: string | symbol, descriptor: TypedPropertyDescriptor<M>): void;
};
```

### Usage {#ChoWebSseDecorator-usage}

```ts
return create_http_decorator(
    "Sse",
    route,
    method,
    Object.freeze({ ...options }),
  ) as ChoWebSseDecorator;
```

[Usage in web/decorators.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/web/decorators.ts#L303)

## ChoWebSseEvent {#symbol-ChoWebSseEvent}

A server-sent event, as an `@Sse` handler yields it.

```ts
export type ChoWebSseEvent<T = unknown> = {
    data: T;
    event?: string;
    id?: string;
    retry?: number;
};
```

**`data`** The data of the event. A string is sent as it is, one `data:` line for
each of its lines; anything else is sent as JSON.

**`event`** The name of the event, for `addEventListener(name)` on the client.
Default: none, which makes it a `message` event.

**`id`** The id of the event. A client that reconnects sends the last one it got,
in the `Last-Event-ID` header. Default: none.

**`retry`** How long the client waits before it reconnects, in milliseconds. Default:
none, which leaves it to the client.

### Usage {#ChoWebSseEvent-usage}

```ts
const event: ChoWebSseEvent<Order> = { event: "order", id: "7", data: order };
```

## ChoWebSseMethod {#symbol-ChoWebSseMethod}

The HTTP methods an `@Sse` handler can answer.

```ts
export type ChoWebSseMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
```

### Usage {#ChoWebSseMethod-usage}

```ts
const method: ChoWebSseMethod = "POST";
// In a controller
@Sse("events", { method })
async *events() { yield "ready"; }
```

## ChoWebSseOptions {#symbol-ChoWebSseOptions}

The options of `@Sse`.

```ts
export type ChoWebSseOptions = {
    method?: ChoWebSseMethod;
    keepAlive?: number;
};
```

**`method`** The HTTP method of the route. Default: `"GET"`, the only one a browser's
`EventSource` sends; a stream on another method is read with `fetch`.

**`keepAlive`** Send a comment line, which clients ignore, whenever this many
milliseconds pass with nothing sent, so that a proxy does not close an
idle connection. Default: none.

### Usage {#ChoWebSseOptions-usage}

```ts
@Sse("answers", { method: "POST" })
  @Args(Body<{ question?: string }>())
  answer(body: { question?: string } | undefined, ctx: ChoWebContext) {
    const question = body?.question?.trim();
    if (!question) {
      return Response.json({ error: "ask a question" }, { status: 400 });
    }
    return this.words(question, ctx.req.signal);
  }
```

[Usage in examples/sse-http.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/sse-http.ts#L92)

## ChoWebSseResult {#symbol-ChoWebSseResult}

What an `@Sse` handler returns, now or as a promise: the events, as an
async iterable (what an `async *` method returns), or a `Response`, to
answer without a stream.

```ts
export type ChoWebSseResult = AsyncIterable<ChoWebSseEvent | string> | Response;
```

### Usage {#ChoWebSseResult-usage}

```ts
async function* updates() { yield "ready"; }
const result: ChoWebSseResult = updates();
```

## ChoWebValidateOptions {#symbol-ChoWebValidateOptions}

The options of `validate()`.

```ts
export type ChoWebValidateOptions = {
    onInvalid?: (invalid: ChoWebInvalid, ctx: ChoWebContext) => unknown;
};
```

**`onInvalid`** Answer a request that is not valid. What it returns is the response,
converted like the result of a handler. Default: `400`, with a JSON body
of `error`, `source`, `key` and `issues`.

### Usage {#ChoWebValidateOptions-usage}

```ts
legacy(
      loose(Middlewares(validate({
        onInvalid: ({ source }) => {
          throw new HttpError(422, `bad ${source}`);
        },
      }))),
      Things,
      "create",
    );
```

[Usage in web/http-error_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/web/http-error_test.ts#L555)

## Controller {#symbol-Controller}

Mark a class as a controller (see `@Controller` of `@chojs/core`): its
methods marked with `@Get`, `@Post`, ... are route handlers, under its
`route`.

```ts
export function Controller<const D extends readonly Dependency[] = [
]>(options?: WebControllerOptions<D>): ChoInjectableDecorator<NoInfer<D>>;
```

### Usage {#Controller-usage}

```ts
@Controller({ route: "users", dependencies: [UserStore] })
class UsersController {
  constructor(readonly store: UserStore) {}
}
```

## ControllerRef {#symbol-ControllerRef}

A controller, with its instance and its route handlers.

```ts
export class ControllerRef extends NodeRef {
    readonly instance: object;
    readonly methods: MethodRef[];
    constructor(route: string, middlewares: ChoWebMiddlewareFn[], errorHandler: ErrorHandlerRef, instance: object, doc?: ChoWebDoc);
}
```

**`instance`** The controller instance, created by the injector.

**`methods`** The route handlers of the controller, in declaration order.

**`constructor`** Create a controller node, with no route handlers yet.

### Usage {#ControllerRef-usage}

```ts
function handlerNames(controller: ControllerRef) {
  return controller.methods.map((method) => method.name);
}
```

## Delete {#symbol-Delete}

Mark a method as the handler of `DELETE route`.

The method receives the request's `ChoWebContext`. What it returns is the
response: a `Response` as is, nothing as `204`, a string or bytes as they
are, anything else as JSON.

```ts
export function Delete(route: string): ChoMethodDecorator;
```

### Usage {#Delete-usage}

```ts
@Controller({ route: "users" })
class UsersController {
  // DELETE /users/42
  @Delete(":id")
  remove(ctx: ChoWebContext) {
    return new Response(null, { status: 204 });
  }
}
```

## Doc {#symbol-Doc}

Describe a handler, a controller or a feature module for the documentation
of the application, such as an OpenAPI document. It says what the code
cannot tell, and changes nothing in how a request is handled.

What is declared is exposed on the graph of the application (`app.graph`),
as the `doc` of the feature, of the controller and of the handler.

```ts
export function Doc(options: ChoWebDoc): ChoClassOrMethodDecorator;
```

### Usage {#Doc-usage}

```ts
@Doc({ tags: ["users"], description: "The users of the application" })
@Controller({ route: "users" })
class UsersController {
  @Doc({
    summary: "Find a user",
    responses: { 200: { description: "The user" }, 404: { description: "No such user" } },
  })
  @Get(":id")
  get(ctx: ChoWebContext) {
    return this.store.find(ctx.params.id);
  }
}
```

## ErrorHandlerRef {#symbol-ErrorHandlerRef}

An error handler as stored in the graph: the function given to `@Catch`,
the bound `handle` method of a handler class, or `null` when there is none.

```ts
export type ErrorHandlerRef = ChoWebErrorHandlerFn | null;
```

### Usage {#ErrorHandlerRef-usage}

```ts
readonly errorHandler: ErrorHandlerRef;
```

[Usage in web/graph.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/web/graph.ts#L56)

## FeatureRef {#symbol-FeatureRef}

A feature: a module that declares controllers.

```ts
export class FeatureRef extends NodeRef {
    readonly controllers: ControllerRef[];
    constructor(route: string, middlewares: ChoWebMiddlewareFn[], errorHandler: ErrorHandlerRef, doc?: ChoWebDoc);
}
```

**`controllers`** The controllers of the feature that have route handlers.

**`constructor`** Create a feature node, with no controllers yet.

### Usage {#FeatureRef-usage}

```ts
function countControllers(feature: FeatureRef) {
  return feature.controllers.length;
}
console.log(app.graph.features.map(countControllers));
```

## Form {#symbol-Form}

An argument from the body of the request, read as a URL-encoded form
(`application/x-www-form-urlencoded`).

- `Form()` gives all the fields, as an object of strings; an empty body
  gives an empty object.
- `Form("name")` gives one field, or `undefined` when it is not there.
- A field that is repeated gives its first value.
- The `content-type` of the request is not looked at. Multipart forms and
  files are not covered: read them from `ctx.req.formData()`.
- A validator can follow: `Form(validator)`, `Form("name", validator)`. It
  is run when the validation middleware covers the request.

```ts
export function Form(): ChoWebArg<Readonly<Record<string, string>>>;
export function Form<T>(validator: ChoValidator<T>): ChoWebArg<T>;
export function Form(key: string): ChoWebArg<string | undefined>;
export function Form<T>(key: string, validator: ChoValidator<T>): ChoWebArg<T>;
```

### Usage {#Form-usage}

```ts
@Post("login")
@Args(Form("user"), Form("password"))
login(user: string | undefined, password: string | undefined) {
  return this.auth.login(user, password);
}
```

## Get {#symbol-Get}

Mark a method as the handler of `GET route`.

The method receives the request's `ChoWebContext`. What it returns is the
response: a `Response` as is, nothing as `204`, a string or bytes as they
are, anything else as JSON.

```ts
export function Get(route: string): ChoMethodDecorator;
```

### Usage {#Get-usage}

```ts
@Controller({ route: "users" })
class UsersController {
  // GET /users
  @Get("")
  list() {
    return [{ id: 1 }, { id: 2 }];
  }

  // GET /users/42
  @Get(":id")
  get(ctx: ChoWebContext) {
    return { id: ctx.params.id };
  }
}
```

## Head {#symbol-Head}

Mark a method as the handler of `HEAD route`.

The method receives the request's `ChoWebContext`. A `HEAD` response has no
body: only the status and the headers of what the method returns are sent,
so return a `Response` to set them.

Without a `@Head` handler, what a `HEAD` request gets is up to the adapter:
Hono answers it from the `@Get` handler of the same route, without the
body.

```ts
export function Head(route: string): ChoMethodDecorator;
```

### Usage {#Head-usage}

```ts
@Controller({ route: "files" })
class FilesController {
  // HEAD /files/report.pdf
  @Head(":name")
  async stat(ctx: ChoWebContext) {
    const size = await this.files.size(ctx.params.name);
    return new Response(null, { headers: { "content-length": `${size}` } });
  }
}
```

## Header {#symbol-Header}

An argument from the headers of the request.

- `Header()` gives all of them, as an object, with names in lower case.
- `Header("x-token")` gives one, or `undefined` when it is not there. The
  name is looked up without regard to case.
- A header sent several times has its values joined with `", "`, as the
  platform's `Headers` does.
- A validator can follow: `Header(validator)`, `Header("x-token",
  validator)`. It is run when the validation middleware covers the request.

```ts
export function Header(): ChoWebArg<Readonly<Record<string, string>>>;
export function Header<T>(validator: ChoValidator<T>): ChoWebArg<T>;
export function Header(key: string): ChoWebArg<string | undefined>;
export function Header<T>(key: string, validator: ChoValidator<T>): ChoWebArg<T>;
```

### Usage {#Header-usage}

```ts
@Get("")
@Args(Header("accept-language"))
hello(language: string | undefined) {
  return language?.startsWith("fr") ? "Bonjour" : "Hello";
}
```

## HttpError {#symbol-HttpError}

An error that answers a request with a status.

Throw it anywhere a request is handled: in a handler, in a middleware, in a
function of `@Args`. An error handler (`@Catch`, `onError`) gets it first,
like any error. When none answers, the request is answered with the status,
the headers, and a JSON body:

```json
{ "error": "no such user" }
```

**Below 500 the message is sent to the client**: write it for the client.
From 500 only the text of the status is sent (`Internal Server Error`), and
the message is for the logs.

```ts
export class HttpError extends Error {
    readonly status: number;
    readonly headers: Headers;
    constructor(status: number, message?: string, options?: HttpErrorOptions);
    toResponse(): Response;
}
```

**`toResponse`** The answer of the error: its status, its headers, and
`{ "error": "<message>" }` as JSON. From 500 the body has the text of the
status in place of the message.

It is what a request is answered with when no error handler answers. An
error handler calls it to answer the same way after doing something of
its own.

**`status`** The status of the answer: from 400 to 599.

**`headers`** The headers of the answer.

**`constructor`** Make an error that answers with a status.

### Usage {#HttpError-usage}

```ts
@Get(":id")
@Args(Param("id"))
get(id: string) {
  const user = users.get(id);
  if (!user) {
    throw new HttpError(404, "no such user");
  }
  return user;
}
```

With headers, and with the error that led to it
```ts
throw new HttpError(401, "token expired", {
  headers: { "www-authenticate": "Bearer" },
});
throw new HttpError(503, "the database is down", { cause: error });
```
```ts
onError: (error, ctx) => {
  if (isHttpError(error)) {
    metrics.count(error.status, ctx.url.pathname);
    return error.toResponse();
  }
},
```

## HttpErrorOptions {#symbol-HttpErrorOptions}

The options of an `HttpError`.

```ts
export type HttpErrorOptions = {
    headers?: HeadersInit;
    cause?: unknown;
};
```

**`headers`** Headers of the answer: `www-authenticate` of a `401`, `retry-after` of a
`429`, …

**`cause`** The error that led to this one. It is logged, and never sent.

### Usage {#HttpErrorOptions-usage}

```ts
const options: HttpErrorOptions = { headers: { "Retry-After": "30" } };
throw new HttpError(503, "Catalog unavailable", options);
```

## Linked {#symbol-Linked}

An HTTP application linked by a `Linker`: the runtime's own
application object, and its request handler.

```ts
export interface Linked<T> {
    readonly instance: T;
    readonly handler: (req: Request) => Promise<Response>;
    mount(route: Route): void;
}
```

**`mount`** Register one more route, after `Linker.link`: what `app.mount` of
`ChoWeb` calls.

The route behaves like one that was given to `link()`: the same answer
to a `HEAD` request, the same `ctx.native`, and the same order when two
routes match, after the routes the runtime already has.

**`instance`** The application object of the HTTP runtime.

**`handler`** The request handler: a `fetch`-style function that takes a `Request` and
resolves to a `Response`.

### Usage {#Linked-usage}

```ts
const app = new Hono();
const linked: Linked<Hono> = {
  instance: app,
  handler: (req) => Promise.resolve(app.fetch(req)),
  mount: (route) =>
    app.on(route.method, route.path, (ctx) =>
      route.handle(ctx.req.raw, ctx.req.param(), ctx)),
};
```

## Linker {#symbol-Linker}

Registers the routes of an application on a new application object of an
HTTP runtime.

```ts
export interface Linker<T> {
    link(routes: readonly Route[]): Linked<T>;
}
```

**`link`** Register the routes on a new application object of the runtime.

### Usage {#Linker-usage}

```ts
class MyLinker implements Linker<MyServer> {
  link(routes: readonly Route[]): Linked<MyServer> {
    const server = new MyServer();
    const mount = (route: Route) =>
      server.on(route.method, route.path, (req, params) =>
        route.handle(req, params));
    routes.forEach(mount);
    return { instance: server, handler: (req) => server.fetch(req), mount };
  }
}

const app = await ChoWeb.create(AppModule, { linker: new MyLinker() });
```

## MethodRef {#symbol-MethodRef}

A route handler: a controller method marked with `@Get`, `@Post`, ...

```ts
export class MethodRef extends NodeRef {
    readonly name: string;
    readonly method: string;
    readonly handler: ChoWebHandler;
    readonly args: readonly ChoWebArg[];
    readonly validated: boolean;
    readonly sse: ChoWebSseOptions | undefined;
    readonly socket: SocketRef | undefined;
    constructor(name: string, route: string, method: string, middlewares: ChoWebMiddlewareFn[], errorHandler: ErrorHandlerRef, handler: ChoWebHandler, args?: readonly ChoWebArg[], doc?: ChoWebDoc, validated?: boolean, sse?: ChoWebSseOptions, socket?: SocketRef);
}
```

**`name`** The name of the method on the controller.

**`method`** The HTTP method, such as `"GET"`.

**`handler`** Calls the method on its controller instance, with the context of a
request. When the method has arguments (`@Args`), they are evaluated
first, and the method receives their values and then the context.

**`args`** The arguments of the handler (`@Args`), in order; empty when it has none.

**`validated`** Whether the validation middleware (`validate()`) covers the handler: it
is among the middlewares of its feature, of its controller or its own.

**`sse`** The options of `@Sse` (an empty object when it has none), when the
handler answers with a stream of server-sent events; `undefined` for any
other handler.

**`constructor`** Create a route handler node.

### Usage {#MethodRef-usage}

```ts
function describeMethod(method: MethodRef) {
  return { name: method.name, arguments: method.args.length };
}
```

## Middlewares {#symbol-Middlewares}

Declare middlewares for a feature module, a controller or a handler.

A request runs the feature's middlewares, then the controller's, then the
handler's. The decorator can be applied several times: the middlewares are
kept in source order, top decorator first.

```ts
export function Middlewares(...middlewares: ChoWebMiddleware[]): ChoClassOrMethodDecorator;
```

### Usage {#Middlewares-usage}

```ts
const auth: ChoWebMiddlewareFn = (ctx, next) =>
  ctx.req.headers.has("authorization")
    ? next()
    : new Response("unauthorized", { status: 401 });

@Middlewares(auth)
@Controller({ route: "admin" })
class Admin {
  @Get("stats")
  stats() {
    return { users: 3 };
  }
}
```

## Module {#symbol-Module}

Mark a class as a module (see `@Module` of `@chojs/core`). A module that
declares controllers is a feature: its `route` comes before the routes of
its controllers.

```ts
export function Module<const D extends readonly Dependency[] = [
]>(options?: WebModuleOptions<D>): ChoInjectableDecorator<NoInfer<D>>;
```

### Usage {#Module-usage}

```ts
@Module({ route: "v1", providers: [UserStore], controllers: [UsersController] })
class App {}
```

## NodeRef {#symbol-NodeRef}

A node of the HTTP graph that has a route, middlewares and an error handler.

```ts
export abstract class NodeRef {
    readonly route: string;
    readonly middlewares: ChoWebMiddlewareFn[];
    readonly errorHandler: ErrorHandlerRef;
    readonly doc: ChoWebDoc;
    constructor(route: string, middlewares: ChoWebMiddlewareFn[], errorHandler: ErrorHandlerRef, doc?: ChoWebDoc);
}
```

**`route`** The route of the node, relative to its parent; `""` when it has none.

**`middlewares`** The middlewares of the node, created and in order.

**`errorHandler`** The error handler of the node, or `null` when it has none.

**`doc`** What `@Doc` declares about the node; an empty object when there is none.

**`constructor`** Create a node.

### Usage {#NodeRef-usage}

```ts
export class FeatureRef extends NodeRef {
  /** The controllers of the feature that have route handlers. */
  readonly controllers: ControllerRef[];

  /**
   * Create a feature node, with no controllers yet.
   *
   * @param route The route of the feature, relative to the global prefix.
   * @param middlewares The middlewares of the feature module.
   * @param errorHandler The error handler of the feature module, or `null`.
   * @param doc What `@Doc` declares about the feature. Default: nothing.
   */
  constructor(
    route: string,
    middlewares: ChoWebMiddlewareFn[],
    errorHandler: ErrorHandlerRef,
    doc: ChoWebDoc = {},
  ) {
    super(route, middlewares, errorHandler, doc);
    this.controllers = [];
  }
}
```

[Usage in web/graph.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/web/graph.ts#L175)

## Options {#symbol-Options}

Mark a method as the handler of `OPTIONS route`.

The method receives the request's `ChoWebContext`. What it returns is the
response: a `Response` as is, nothing as `204`, a string or bytes as they
are, anything else as JSON.

```ts
export function Options(route: string): ChoMethodDecorator;
```

### Usage {#Options-usage}

```ts
@Controller({ route: "users" })
class UsersController {
  // OPTIONS /users
  @Options("")
  options() {
    return new Response(null, {
      status: 204,
      headers: { allow: "GET, POST, OPTIONS" },
    });
  }
}
```

## Param {#symbol-Param}

An argument from the path parameters of the route, decoded.

- `Param()` gives all of them, as an object of strings.
- `Param("id")` gives one. The name must be a parameter of the handler's
  path: `ChoWeb.create` rejects one that is not.
- A validator can follow: `Param(validator)`, `Param("id", validator)`. It
  is run when the validation middleware covers the request.

```ts
export function Param(): ChoWebArg<Readonly<Record<string, string>>>;
export function Param<T>(validator: ChoValidator<T>): ChoWebArg<T>;
export function Param(key: string): ChoWebArg<string>;
export function Param<T>(key: string, validator: ChoValidator<T>): ChoWebArg<T>;
```

### Usage {#Param-usage}

```ts
@Get(":id")
@Args(Param("id"))
get(id: string) {
  return this.store.find(id);
}
```

## Patch {#symbol-Patch}

Mark a method as the handler of `PATCH route`.

The method receives the request's `ChoWebContext`. What it returns is the
response: a `Response` as is, nothing as `204`, a string or bytes as they
are, anything else as JSON.

```ts
export function Patch(route: string): ChoMethodDecorator;
```

### Usage {#Patch-usage}

```ts
@Controller({ route: "users" })
class UsersController {
  // PATCH /users/42
  @Patch(":id")
  async update(ctx: ChoWebContext) {
    const changes = await ctx.req.json();
    return { id: ctx.params.id, ...changes };
  }
}
```

## Post {#symbol-Post}

Mark a method as the handler of `POST route`.

The method receives the request's `ChoWebContext`. What it returns is the
response: a `Response` as is, nothing as `204`, a string or bytes as they
are, anything else as JSON.

```ts
export function Post(route: string): ChoMethodDecorator;
```

### Usage {#Post-usage}

```ts
@Controller({ route: "users" })
class UsersController {
  // POST /users
  @Post("")
  async create(ctx: ChoWebContext) {
    const user = await ctx.req.json();
    return new Response(JSON.stringify(user), { status: 201 });
  }
}
```

## Put {#symbol-Put}

Mark a method as the handler of `PUT route`.

The method receives the request's `ChoWebContext`. What it returns is the
response: a `Response` as is, nothing as `204`, a string or bytes as they
are, anything else as JSON.

```ts
export function Put(route: string): ChoMethodDecorator;
```

### Usage {#Put-usage}

```ts
@Controller({ route: "users" })
class UsersController {
  // PUT /users/42
  @Put(":id")
  async update(ctx: ChoWebContext) {
    const changes = await ctx.req.json();
    return { id: ctx.params.id, ...changes };
  }
}
```

## Query {#symbol-Query}

An argument from the query string of the request.

- `Query()` gives all of it, as an object of strings.
- `Query("page")` gives one key, or `undefined` when it is not there.
- A key that is repeated gives its first value. For every value, use
  `ctx.url.searchParams.getAll(key)`.
- A validator can follow: `Query(validator)`, `Query("page", validator)`.
  It is run when the validation middleware covers the request.

```ts
export function Query(): ChoWebArg<Readonly<Record<string, string>>>;
export function Query<T>(validator: ChoValidator<T>): ChoWebArg<T>;
export function Query(key: string): ChoWebArg<string | undefined>;
export function Query<T>(key: string, validator: ChoValidator<T>): ChoWebArg<T>;
```

### Usage {#Query-usage}

```ts
@Get("")
@Args(Query("page"), Query())
list(page: string | undefined, query: Record<string, string>) {
  return this.store.list(Number(page ?? 1), query);
}
```

## Route {#symbol-Route}

A route of the application, ready to register on an HTTP runtime.

```ts
export type Route = {
    readonly socket?: true;
    readonly method: string;
    readonly path: string;
    readonly name: string;
    handle(req: Request, params?: Readonly<Record<string, string>>, native?: unknown, state?: Map<PropertyKey, unknown>): Promise<Response>;
};
```

**`method`** The HTTP method, upper case, such as `"GET"`.

**`path`** The full path, global prefix included, starting with `/`. Parameters are
written `:name` and match one segment (`"/api/users/:id"`).

**`name`** Where the route is declared, for logs: `"UsersController.get"`.

### Usage {#Route-usage}

```ts
const named = (path: string, name: string): Route => ({
      ...echo("GET", path),
      handle: () => Promise.resolve(new Response(name)),
    });
```

[Usage in vendor/hono/mod_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/hono/mod_test.ts#L112)

## RouteOption {#symbol-RouteOption}

The option `@chojs/web` adds to `@Module` and `@Controller`.

```ts
export type RouteOption = {
    route?: string;
};
```

**`route`** The route of the feature module or of the controller, without leading or
trailing `/` (`"users"`, `"api/v1"`). Default: none.

### Usage {#RouteOption-usage}

```ts
return CoreController<RouteOption, D>(options);
```

[Usage in web/decorators.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/web/decorators.ts#L144)

## Sse {#symbol-Sse}

Mark a method as a handler that answers with a stream of
[server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html):
the response stays open, and the handler sends events for as long as it
wants. The route is `GET route`, unless the `method` option says otherwise.

The method returns the events as an async iterable, so it is usually an
`async *` method, where every `yield` is an event: an object
`{ data, event?, id?, retry? }`, or a string, short for `{ data: string }`.
It can also return a `Response`, to answer without a stream.

- The response is a `200` of `text/event-stream`, sent before the first
  event. The body of an `async *` method runs as part of the stream, so it
  cannot answer with another status: a handler that must be able to refuse
  is a plain method that returns a `Response` or the events.
- When the client goes away, the iteration is ended (the `finally` blocks
  of an `async *` method run), and `ctx.req.signal` is aborted.
- An error in the stream cuts it. No error handler is called: the response
  is already on its way. Catch the error in the method to log it, or to
  tell the client with an event of your own.
- The response has the headers `content-type: text/event-stream`,
  `cache-control: no-cache, no-transform`, and `x-accel-buffering: no`,
  which tells an nginx proxy to pass each event on at once.

```ts
export function Sse(route: string, options?: ChoWebSseOptions): ChoWebSseDecorator;
```

### Usage {#Sse-usage}

```ts
@Controller({ route: "clock" })
class ClockController {
  // GET /clock/ticks
  @Sse("ticks", { keepAlive: 15_000 })
  async *ticks(ctx: ChoWebContext) {
    while (!ctx.req.signal.aborted) {
      yield { event: "tick", data: { now: Date.now() } };
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
```

On another method, read with `fetch`
```ts
@Sse("answers", { method: "POST" })
@Args(Body<{ question: string }>())
async *answer(body: { question: string }) {
  for (const word of await this.model.answer(body.question)) {
    yield word;
  }
}
```

## WebControllerOptions {#symbol-WebControllerOptions}

Options of `@Controller` in a web application: its `dependencies`, and its
`route`.

```ts
export type WebControllerOptions<D extends readonly Dependency[] = readonly Dependency[]> = WithDependencies<Partial<ControllerOptions>, D> & RouteOption;
```

### Usage {#WebControllerOptions-usage}

```ts
@Controller({ route: "" })
export class PageController {
  // GET /
  @Get("")
  page() {
    return new Response(PAGE, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
}
```

[Usage in examples/sse-http.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/sse-http.ts#L111)

## WebModuleOptions {#symbol-WebModuleOptions}

Options of `@Module` in a web application: the module options of the core,
and the `route` of the feature.

```ts
export type WebModuleOptions<D extends readonly Dependency[] = readonly Dependency[]> = WithDependencies<Partial<ModuleOptions>, D> & RouteOption;
```

### Usage {#WebModuleOptions-usage}

```ts
@Module({
  providers: [Model],
  controllers: [PageController, ClockController, ChatController],
})
export class AppModule {}
```

[Usage in examples/sse-http.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/sse-http.ts#L122)

## isHttpError {#symbol-isHttpError}

Whether a value is an `HttpError`.

It does not use `instanceof`, which is false for an error made by another
copy of the package: a middleware of another package can bring one.

```ts
export function isHttpError(value: unknown): value is HttpError;
```

### Usage {#isHttpError-usage}

```ts
@Catch((error) => {
  if (isHttpError(error) && error.status === 404) {
    return new Response("nothing here", { status: 404 });
  }
})
```

## validate {#symbol-validate}

Make the validation middleware.

For the handlers it covers, every argument that has a validator goes
through it before the handler is called, and what the validator returns is
what the handler receives. When an argument is not valid, or the body
cannot be parsed, the handler is not called and the middleware answers:
`400` with a JSON body of `error`, `source`, `key` and `issues`, or what
`onInvalid` returns.

Wherever it is declared, validation happens at the same moment: after
every middleware of the route, just before the handler.

```ts
export function validate(options?: ChoWebValidateOptions): ChoWebMiddlewareFn;
```

### Usage {#validate-usage}

```ts
@Middlewares(validate())
@Controller({ route: "users" })
class UsersController {
  @Post("")
  @Args(Body(NewUser))
  create(user: NewUser) {
    return this.store.add(user);
  }
}
```

Another answer
```ts
validate({
  onInvalid: ({ source, key }) =>
    Response.json({ message: `bad ${source}`, key }, { status: 422 }),
});
```

## Also exported here

These declarations share their implementation with another entry point. Each link opens the full declaration.

[`ChoCoreErrorCode`](/api/core#symbol-ChoCoreErrorCode), [`ChoError`](/api/core#symbol-ChoError), [`ConfigureOptions`](/api/core#symbol-ConfigureOptions), [`ControllerOptions`](/api/core#symbol-ControllerOptions), [`Injectable`](/api/core#symbol-Injectable), [`InjectableOptions`](/api/core#symbol-InjectableOptions), [`InjectionToken`](/api/core#symbol-InjectionToken), [`ModuleOptions`](/api/core#symbol-ModuleOptions), [`Provider`](/api/core#symbol-Provider), [`WithDependencies`](/api/core#symbol-WithDependencies), [`configure`](/api/core#symbol-configure), [`isChoError`](/api/core#symbol-isChoError), [`provider`](/api/core#symbol-provider), [`token`](/api/core#symbol-token)

## Shared schema types

These types are also importable directly from this package. [ChoValidator](/api/core#symbol-ChoValidator) · [ChoParseValidator](/api/core#symbol-ChoParseValidator) · [ChoIssue](/api/core#symbol-ChoIssue) · [ChoInput](/api/core#symbol-ChoInput) · [ChoOutput](/api/core#symbol-ChoOutput) · [StandardTypedV1](/api/core#symbol-StandardTypedV1) · [StandardSchemaV1](/api/core#symbol-StandardSchemaV1) · [StandardJSONSchemaV1](/api/core#symbol-StandardJSONSchemaV1)

## Ws {#symbol-Ws}

`@Ws(route = "")` declares a GET upgrade route. Return a response to refuse the connection, a value to send an initial message, or nothing to accept silently. Middleware, argument readers, validation and HTTP error handling apply during the handshake. [Complete controller and browser example](/web/websockets)

## WsOpen {#symbol-WsOpen}

`@WsOpen()` runs after acceptance. Its method receives the connection, e.g. `opened(socket: ChoWebSocket) { this.clients.add(socket); }` when the controller owns a set of connected clients.

## WsMessage {#symbol-WsMessage}

`@WsMessage()` receives text or binary data followed by the socket. Returning the data echoes the message in its original format. Async handlers finish in arrival order per connection.

## WsClose {#symbol-WsClose}

`@WsClose()` receives the numeric code, reason and socket. Remove the connection from any shared collection here. The close handler runs once.

## ChoWebSocket {#symbol-ChoWebSocket}

The per-connection object exposes `ctx`, `open`, `native`, `send(data)` and `close(code?, reason?)`. For example, `socket.send({ room: socket.ctx.params.room })` sends a JSON text message.

## ChoWebUpgrade {#symbol-ChoWebUpgrade}

The accepted branch of `await app.upgrade(request)` exposes response headers and a one-time `accept(io)`. If the result is a Fetch response, return it to the caller. The server completes the host handshake before calling `accept`.

## ChoWebSocketIo {#symbol-ChoWebSocketIo}

Adapter implementations provide `send(string | Uint8Array)`, `close(code, reason)` and the native connection. Forward the host's events to the callbacks returned by CHO.

## ChoWebSocketEvents {#symbol-ChoWebSocketEvents}

```ts
const decision = await app.upgrade(request);
if (decision instanceof Response) return decision;
const native = host.upgrade(request, decision.headers); // host-specific operation
const io: ChoWebSocketIo = {
  native,
  send: (data) => native.send(data),
  close: (code, reason) => native.close(code, reason),
};
const events: ChoWebSocketEvents = decision.accept(io);
native.on("message", (data: string | Uint8Array) => events.message(data));
native.on("close", (code: number, reason: string) => events.closed(code, reason));
```

## ChoWebWsEventDecorator {#symbol-ChoWebWsEventDecorator}

Generic method decorator parameterized by the event's argument tuple. The three specialized types below describe the corresponding decorator factories. Handlers can omit trailing arguments.

## ChoWebWsOpenDecorator {#symbol-ChoWebWsOpenDecorator}

`const onConnect: ChoWebWsOpenDecorator = WsOpen();` creates a decorator for a method accepting the connection.

## ChoWebWsMessageDecorator {#symbol-ChoWebWsMessageDecorator}

`const onData: ChoWebWsMessageDecorator = WsMessage();` decorates a method accepting `string | Uint8Array` and optionally the connection.

## ChoWebWsCloseDecorator {#symbol-ChoWebWsCloseDecorator}

`const onDisconnect: ChoWebWsCloseDecorator = WsClose();` decorates a method accepting the close code, reason and connection.

## SocketRef {#symbol-SocketRef}

`MethodRef.socket` contains the controller's optional `open`, `message` and `close` event method references. It is undefined on ordinary HTTP operations. A compiled upgrade route carries `route.socket === true`.

## SocketMethodRef {#symbol-SocketMethodRef}

Each event method reference holds the method name and bound handler. For example, `method.socket?.message?.name` identifies the message callback when listing a controller's routes.
