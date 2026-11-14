# `@chojs/web` API

Everything an application needs is exported by `@chojs/web`. The full,
generated API documentation is on [JSR](https://jsr.io/@chojs/web/doc).

## Entry points

| Entry point         | For                                                        |
| ------------------- | ---------------------------------------------------------- |
| `@chojs/web`        | Applications                                               |
| `@chojs/web/serve`  | Serving: `serve`                                           |
| `@chojs/web/linker` | Adapters: `Linker`, `Linked`, `Route`                      |
| `@chojs/web/graph`  | Introspection: `AppRef`, `FeatureRef`, `ControllerRef`, `MethodRef`, `NodeRef`, `ErrorHandlerRef` |

## `ChoWeb`

```ts
class ChoWeb<T = unknown> {
  // with a linker: T is the object of that linker's router
  static create<T>(app: Class, options: ChoWebOptions<T>): Promise<ChoWeb<T>>;
  // without one: the built-in router
  static create(app: Class, options?: ChoWebOptions): Promise<ChoWeb<ChoRouter>>;

  readonly handler: (req: Request) => Promise<Response>;
  readonly routes: readonly Route[];
  readonly graph: AppRef;
  readonly linked: Linked<T>; // { instance: T, handler }

  close(): Promise<void>;
}

type ChoWebOptions<T = unknown> = {
  linker?: Linker<T>; // default: new ChoLinker(), the built-in router
  prefix?: string;
  onError?: ChoWebErrorHandler;
  overrides?: readonly Provider[];
};
```

See [The application](/web/application).

## `serve`

```ts
import { serve } from "@chojs/web/serve";

function serve(
  handler: (req: Request) => Response | Promise<Response>,
  options?: { port?: number; hostname?: string; signal?: AbortSignal },
): Promise<ChoWebServer>;

type ChoWebServer = {
  readonly runtime: "deno" | "node" | "bun" | "workerd" | "edge" | "unknown";
  readonly port: number;
  readonly hostname: string;
  close(): Promise<void>;
};
```

Runs a `fetch`-style handler on the server of the current runtime: `Deno.serve`,
`Bun.serve`, or the HTTP server of Node.js. `port` defaults to `3000`. See
[Serving](/web/application#serving).

## The built-in router

```ts
class ChoLinker implements Linker<ChoRouter> {
  constructor(options?: {
    notFound?: (req: Request) => Response | Promise<Response>;
  });
  link(routes: readonly Route[]): Linked<ChoRouter>;
}

class ChoRouter {
  readonly routes: readonly Route[];
  match(method: string, pathname: string):
    | { route: Route; params: Readonly<Record<string, string>> }
    | undefined;
  readonly fetch: (req: Request) => Promise<Response>;
}
```

Both are exported by `@chojs/web`. See [The built-in router](/adapters/cho).

## Decorators

### Dependency injection

| Decorator                       | On      | Options                                                           |
| ------------------------------- | ------- | ----------------------------------------------------------------- |
| `@Injectable(dependencies?)`    | A class | The dependencies, in constructor order                            |
| `@Controller(options?)`         | A class | `dependencies`, `route`                                           |
| `@Module(options?)`             | A class | `imports`, `providers`, `controllers`, `exports`, `dependencies`, `route` |

### Routes

| Decorator                                                                  | On       | Argument                                     |
| -------------------------------------------------------------------------- | -------- | -------------------------------------------- |
| `@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`, `@Head`, `@Options` `(route)` | A method | The handler's route, such as `":id"` or `""` |

A method has one of them.

### Middlewares and errors

| Decorator                     | On                              | Argument                                                  |
| ----------------------------- | ------------------------------- | --------------------------------------------------------- |
| `@Middlewares(...middlewares)` | A module, a controller, a handler | Functions `(ctx, next)`, or classes with `handle(ctx, next)` |
| `@Catch(handler)`             | A module, a controller, a handler | A function `(error, ctx)`, or a class with `handle(error, ctx)` |

### Handler arguments and documentation

| Decorator        | On                                | Argument                                                                |
| ---------------- | --------------------------------- | ----------------------------------------------------------------------- |
| `@Args(...args)` | A handler                         | The arguments, in the order of the parameters                           |
| `@Doc(options)`  | A module, a controller, a handler | `summary`, `description`, `tags`, `deprecated`, `responses`, `hidden`   |

See [Handler arguments](/web/arguments), [Validation](/web/validation) and
[Describing the API](/web/api-docs).

## Functions

| Function                                | Returns                                         |
| --------------------------------------- | ----------------------------------------------- |
| `token<T>(description)`                 | A unique `InjectionToken<T>`                    |
| `provider({ provide, deps?, factory })` | A provider object, with `factory` typed from `deps` |
| `Param`, `Query`, `Header`, `Body`, `Form` `(key?, validator?)` | An argument for `@Args`: the whole source, or one key of it |
| `validate({ onInvalid? })`              | The validation middleware, for `@Middlewares`   |

## Types

### The context

```ts
interface ChoWebContext {
  readonly req: Request;
  readonly params: Readonly<Record<string, string>>;
  readonly url: URL;
  readonly state: Map<PropertyKey, unknown>;
  readonly native: unknown;
}
```

### Handlers, middlewares, error handlers

```ts
type ChoWebHandler = (ctx: ChoWebContext) => unknown;

type ChoWebNext = () => Promise<Response>;

type ChoWebMiddlewareFn = (
  ctx: ChoWebContext,
  next: ChoWebNext,
) => Response | void | Promise<Response | void>;

type ChoWebMiddleware =
  | ChoWebMiddlewareFn
  | Class<{ handle: ChoWebMiddlewareFn }>;

type ChoWebErrorHandlerFn = (error: unknown, ctx: ChoWebContext) => unknown;

type ChoWebErrorHandler =
  | ChoWebErrorHandlerFn
  | Class<{ handle: ChoWebErrorHandlerFn }>;
```

### Adapters

```ts
type Route = {
  readonly method: string; // "GET"
  readonly path: string; //   "/api/users/:id"
  readonly name: string; //   "UsersController.get"
  handle(
    req: Request,
    params?: Readonly<Record<string, string>>,
    native?: unknown,
  ): Promise<Response>;
};

interface Linked<T> {
  readonly instance: T;
  readonly handler: (req: Request) => Promise<Response>;
}

interface Linker<T> {
  link(routes: readonly Route[]): Linked<T>;
}
```

### Arguments and validation

```ts
type ChoWebArg<T> = ((ctx: ChoWebContext) => T | Promise<T>) & {
  readonly info?: {
    readonly source: "param" | "query" | "header" | "body" | "form";
    readonly key?: string;
    readonly validator?: ChoWebValidator;
  };
};

type ChoWebValidator<T> = { parse(value: unknown): T | Promise<T> };

type ChoWebInvalid = {
  readonly source: "param" | "query" | "header" | "body" | "form";
  readonly key?: string;
  readonly error: unknown;
};

type ChoWebDoc = {
  summary?: string;
  description?: string;
  tags?: readonly string[];
  deprecated?: boolean;
  responses?: Record<number, { description?: string; schema?: ChoWebValidator }>;
  hidden?: boolean;
};
```

### Others

`WebModuleOptions`, `WebControllerOptions`, and from the core `ModuleOptions`,
`ControllerOptions`, `InjectableOptions`, `InjectionToken`, `Provider`,
`WithDependencies`.

## Adapter packages

| Package                 | Exports                                |
| ----------------------- | -------------------------------------- |
| `@chojs/vendor-hono`    | `HonoLinker`, `HonoLinked`             |
| `@chojs/vendor-fastify` | `FastifyLinker`, `FastifyNative`       |

## Summary tables

### Result of a handler

| Returned                                    | Sent                              |
| ------------------------------------------- | --------------------------------- |
| A `Response`                                | As is                             |
| Nothing                                     | `204 No Content`                  |
| A string                                    | `text/plain;charset=UTF-8`        |
| Bytes, a `Blob`, a `ReadableStream`, a form | As is, like `new Response(value)` |
| Anything else                               | JSON, `application/json`          |

### Route levels

| Level         | Declared by                      |
| ------------- | -------------------------------- |
| Global prefix | `prefix` of `ChoWeb.create`      |
| Feature       | `route` of `@Module`             |
| Controller    | `route` of `@Controller`         |
| Handler       | The argument of `@Get`, …        |
