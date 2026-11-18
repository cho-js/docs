# HTTP API reference

Import application classes, decorators and argument readers from `@chojs/web`. Separate entry points cover listener startup (`@chojs/web/serve`), the router contract (`@chojs/web/linker`) and graph nodes (`@chojs/web/graph`). [Generated signatures on JSR](https://jsr.io/@chojs/web/doc)

## Application and listener

| API | Result or effect |
| --- | --- |
| `await ChoWeb.create(Root, options?)` | Initializes the injector and returns a linked application. Options are `prefix`, `linker`, `onError` and `overrides` |
| `app.handler(request)` | Promise of a Fetch `Response` |
| `app.routes` | Compiled routes with `method`, `path`, `name` and `handle` |
| `app.graph` | Feature, controller and method nodes, including declared inputs and documentation |
| `app.linked.instance` | Native router. Defaults to `ChoRouter` |
| `app.injector` | Injector that owns the initialized graph |
| `await app.close()` | Disposes dependencies and causes subsequent `app.handler` calls to return `503` |
| `await serve(app.handler, options?)` | Starts a listener on Deno, Bun or Node and returns `{ runtime, hostname, port, close }` |

`serve` accepts `port` (default `3000`, `0` for an allocated port), `hostname`, `signal` and `closeTimeout` in milliseconds. Await `server.close()` before `app.close()`. [Application lifecycle](/web/application)

## Declarations

| API | Declares |
| --- | --- |
| `@Module({ imports, providers, controllers, exports, dependencies, route })` | Module scope, dependencies and optional feature path |
| `@Controller({ dependencies, route })` | Constructor inputs and optional controller path |
| `@Injectable(dependencies?)`, `token<T>(description)`, `provider({ provide, deps?, factory })` | Class and factory providers and typed lookup keys |
| `@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`, `@Head`, `@Options` | One HTTP method per handler. Each takes a relative route string |
| `@Sse(route, { method?, keepAlive? }?)` | An async event stream. Defaults to `GET` |
| `@Args(...readers)` | Ordered method inputs, followed by the optional `ChoWebContext` |
| `@Middlewares(...items)`, `@Catch(handler)` | Route middleware and the nearest route error handler |
| `@Doc(options)` | Descriptions, tags and related documentation metadata |

## Input and output types

| Surface | Types or helpers |
| --- | --- |
| Request | `ChoWebContext` exposes `req`, `url`, `params`, `state` and `native` |
| Input | `Param`, `Query`, `Header`, `Body`, `Form` and custom `ChoWebArg<T>` functions |
| Validation | `ChoWebValidator<T>` supplies `parse`. `validate({ onInvalid? })` activates validators |
| Middleware | `ChoWebMiddlewareFn`, `ChoWebNext`, `ChoWebMiddleware` |
| Errors | `ChoWebErrorHandlerFn`, `ChoWebErrorHandler` |
| Events | `ChoWebSseEvent<T>`, `ChoWebSseOptions`, `ChoWebSseResult` |
| Metadata | `ChoWebDoc`, `ChoWebDocResponse`, `ChoWebArgInfo` |

A normal method may return a value or a promise. An SSE method returns an async iterable or an explicit `Response`. A middleware returns a `Response` or continues downstream. [Responses](/web/responses) · [Middleware](/web/middlewares) · [Events](/web/sse)

## Router contract

`Linker<T>.link(routes)` returns a `Linked<T>` with `instance` and `handler`. `ChoLinker` accepts `{ notFound?, middlewares? }`. Its `ChoRouter` exposes `routes`, `match(method, pathname)` and `fetch(request)`. [Adapter comparison](/adapters/) · [Implement a linker](/adapters/custom)
