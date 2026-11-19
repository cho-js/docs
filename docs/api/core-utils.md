---
outline: 2
---

# @chojs/core/utils

Use these utilities when building a transport or extension that needs middleware composition, runtime detection or diagnostic output. [Compose middleware and inspect the runtime](/advanced/core) · [Browse all packages](/api/)

## Debuglog {#symbol-Debuglog}

A logger for one context.

```ts
export type Debuglog = {
    (...args: unknown[]): void;
    error(...args: unknown[]): void;
    start(): (...args: unknown[]) => void;
    readonly enabled: boolean;
};
```

**`enabled`** Whether this context logs; check it before building costly messages.

### Usage {#Debuglog-usage}

```ts
const log = Object.assign(
      (...parts: unknown[]) => void lines.push(parts.join(" ")),
      { error: () => {}, start: () => () => {}, enabled: true },
    ) satisfies Debuglog;
```

[Usage in message/handler-args_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/handler-args_test.ts#L647)

## EngineType {#symbol-EngineType}

A JavaScript runtime that `engine` can detect:

- `"node"`: Node.js;
- `"deno"`: Deno;
- `"bun"`: Bun;
- `"workerd"`: Cloudflare Workers;
- `"edge"`: an edge runtime, such as Vercel Edge Functions;
- `"unknown"`: anything else, such as a browser.

```ts
export type EngineType = "node" | "deno" | "bun" | "workerd" | "edge" | "unknown";
```

### Usage {#EngineType-usage}

```ts
const runtime: EngineType = engine();
console.log("Running on", runtime);
```

## EnvSource {#symbol-EnvSource}

An environment that `env` can read: a record of variables (such as a
Cloudflare Workers `env`), or a function that returns a variable's value.
Only string values count; any other value is treated as not set.

```ts
export type EnvSource = Readonly<Record<string, unknown>> | ((key: string) => unknown);
```

### Usage {#EnvSource-usage}

```ts
const bindings: EnvSource = { CHO_DEBUGLOG: "*" };
set_env(bindings);
const setting = env("CHO_DEBUGLOG");
```

## MiddlewareFn {#symbol-MiddlewareFn}

A middleware function, as `compose` runs it. It wraps the rest of the
chain (the next middlewares, then the endpoint):

- `next()` runs the rest of the chain and resolves to its result;
- returning a result ends the chain with it, whether `next()` was called
  (to replace the result) or not (to end early);
- returning nothing after calling `next()` passes the result on.

```ts
export type MiddlewareFn<Ctx, Result> = (ctx: Ctx, next: () => Promise<Result>) => Result | void | Promise<Result | void>;
```

### Usage {#MiddlewareFn-usage}

```ts
export function compose<Ctx, Result>(
  middlewares: readonly MiddlewareFn<Ctx, Result>[],
  endpoint: (ctx: Ctx) => Promise<Result>,
  kind: ResultKind<Result>,
): (ctx: Ctx) => Promise<Result>;
```

[Usage in core/utils/compose.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/utils/compose.ts#L101)

## ResultKind {#symbol-ResultKind}

What the chain produces: how to recognize it, and how to name it in error
messages.

```ts
export type ResultKind<Result> = {
    is(value: unknown): value is Result;
    name: string;
    noun: string;
};
```

**`name`** The result, with its article: `"a Response"`, `"an exit code"`.

**`noun`** The result, as a bare noun: `"response"`, `"exit code"`.

### Usage {#ResultKind-usage}

```ts
return compose_chain(middlewares, endpoint, {
    is: (value) => value instanceof Response,
    name: "a Response",
    noun: "response",
  });
```

[Usage in web/compose.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/web/compose.ts#L34)

## VoidMiddlewareFn {#symbol-VoidMiddlewareFn}

A middleware function of a chain that has no result, as `compose`
runs it without a `kind`. It wraps the rest of the chain (the next
middlewares, then the endpoint):

- `next()` runs the rest of the chain. It resolves when the rest is done,
  and rejects with its error;
- returning without calling `next()` ends the chain there: the endpoint
  does not run, and the chain is done;
- what it returns is ignored.

```ts
export type VoidMiddlewareFn<Ctx> = (ctx: Ctx, next: () => Promise<void>) => unknown;
```

### Usage {#VoidMiddlewareFn-usage}

```ts
export function compose<Ctx>(
  middlewares: readonly VoidMiddlewareFn<Ctx>[],
  endpoint: (ctx: Ctx) => Promise<void>,
): (ctx: Ctx) => Promise<void>;
```

[Usage in core/utils/compose.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/utils/compose.ts#L142)

## compose {#symbol-compose}

Compose middlewares and an endpoint into one function.

The middlewares run in order; each `next()` runs the rest of the chain and
resolves to its result. See `MiddlewareFn` for what a middleware can
return.

```ts
export function compose<Ctx, Result>(middlewares: readonly MiddlewareFn<Ctx, Result>[], endpoint: (ctx: Ctx) => Promise<Result>, kind: ResultKind<Result>): (ctx: Ctx) => Promise<Result>;
export function compose<Ctx>(middlewares: readonly VoidMiddlewareFn<Ctx>[], endpoint: (ctx: Ctx) => Promise<void>): (ctx: Ctx) => Promise<void>;
```

### Usage {#compose-usage}

```ts
const run = compose<{ user?: string }, number>(
  [async (ctx, next) => {
    ctx.user = "ada";
    return await next();
  }],
  (ctx) => Promise.resolve(ctx.user ? 0 : 1),
  {
    is: (value) => typeof value === "number",
    name: "an exit code",
    noun: "exit code",
  },
);
await run({}); // 0
```
```ts
const seen: string[] = [];
const run = compose<{ topic: string }>(
  [async (ctx, next) => {
    seen.push(`in ${ctx.topic}`);
    await next();
    seen.push(`out ${ctx.topic}`);
  }],
  (ctx) => {
    seen.push(`handled ${ctx.topic}`);
    return Promise.resolve();
  },
);
await run({ topic: "orders" }); // in orders, handled orders, out orders
```

## debuglog {#symbol-debuglog}

Create a logger for a context. When the context is disabled, every method is
a no-op.

```ts
export function debuglog(context: string): Debuglog;
```

### Usage {#debuglog-usage}

```ts
const all = new Schemas(() => {
          throw new Error("boom");
        }, debuglog("cho:openapi"));
```

[Usage in extras/openapi/schema_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/extras/openapi/schema_test.ts#L121)

## describe {#symbol-describe}

Readable name of a class, token or any value, for error messages.
Classes and functions give their name (or `<anonymous>`), strings are quoted,
symbols give `Symbol(description)`, injection tokens
`InjectionToken(description)`.

It never throws, so it is safe to call while reporting another error: a value
that `String()` cannot convert (an object without a prototype, or whose
`toString` throws) gives its `Object.prototype.toString` tag, such as
`[object Object]`, and `<unknown>` as a last resort.

```ts
export function describe(value: unknown): string;
```

### Usage {#describe-usage}

```ts
assert.equal(describe(Object.create(null)), "[object Object]");
```

[Usage in core/utils/describe_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/utils/describe_test.ts#L42)

## engine {#symbol-engine}

Detect the JavaScript runtime the code runs on.

Runtimes that emulate others are checked first: Cloudflare Workers and edge
runtimes can expose Node.js globals, and Bun and Deno expose `process`.

```ts
export function engine(): EngineType;
```

### Usage {#engine-usage}

```ts
import { engine } from "@chojs/core/utils";

if (engine() === "deno") {
  // ...
}
```

## env {#symbol-env}

Read an environment variable: from the `set_env` source first, then
from `process.env`.

```ts
export function env(key: string): string | undefined;
```

### Usage {#env-usage}

```ts
const dbHost = env("DB_HOST") ?? "localhost";
```

## env_bool {#symbol-env_bool}

Read an environment variable as a boolean: `1`, `true`, `yes` and `on`, in
any case, are `true`; anything else, or no value, is `false`.

```ts
export function env_bool(key: string): boolean;
```

### Usage {#env_bool-usage}

```ts
const isDebug = env_bool("DEBUG");
```

## env_num {#symbol-env_num}

Read an environment variable as a number.

```ts
export function env_num(key: string): number;
```

### Usage {#env_num-usage}

```ts
const port = env("PORT") ? env_num("PORT") : 3000;
```

## is_class {#symbol-is_class}

Check if a value is a class constructor.

```ts
export function is_class(v: unknown): v is Ctr;
```

### Usage {#is_class-usage}

```ts
class MyClass {}
function myFunction() {}

console.log(is_class(MyClass));
// true
console.log(is_class(myFunction));
// false
console.log(is_class({}));
// false
```

## is_class_implement {#symbol-is_class_implement}

Check if a value is a class whose prototype has a given method.

```ts
export function is_class_implement<T>(v: unknown, method: string): v is Ctr<T>;
```

### Usage {#is_class_implement-usage}

```ts
assert.equal(is_class_implement(handler, "handle"), false);
```

[Usage in core/utils/is_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/utils/is_test.ts#L45)

## make_error {#symbol-make_error}

Make an error of a package: a `ChoError` whose stack starts where the
mistake was found, not in the function that made the error.

Each package has a function of its own that calls this one with its codes:
`core_error` is the one of `@chojs/core`.

```ts
export function make_error<Code extends string>(code: Code, message: string, options: ErrorOptions | undefined, above: Function): ChoError<Code>;
```

### Usage {#make_error-usage}

```ts
return make_error(
    "CHO_MESSAGE_INVALID_MESSAGE",
    text,
    undefined,
    invalid_message,
  );
```

[Usage in vendor/nats/consume_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/vendor/nats/consume_test.ts#L219)

## set_env {#symbol-set_env}

Set where `env` reads variables from, before `process.env`.

It applies to the whole program, until it is set again. Call it at startup,
before anything reads the environment: `debuglog()` reads it when a logger
is created.

```ts
export function set_env(env: EnvSource | undefined): void;
```

### Usage {#set_env-usage}

Cloudflare Workers
```ts
import { env as worker_env } from "cloudflare:workers";

set_env(worker_env);
```

A function
```ts
set_env((key) => config.get(key));
```

## is_validator {#symbol-is_validator}

`is_validator(value: unknown)` narrows objects or callable schemas that expose a Standard Schema validator or a parse method.

```ts
if (is_validator(candidate)) {
  const result = await run_validator(candidate, raw);
  console.log(result);
}
```

## run_validator {#symbol-run_validator}

`run_validator(schema, value)` awaits validation and returns a `Validated<Output>`. Standard Schema takes precedence. Exceptions thrown by its validate function propagate.

```ts
const result = await run_validator(titleSchema, rawTitle);
if (result.issues) console.warn(result.issues);
else console.log(result.value);
```

## Validated {#symbol-Validated}

The result union contains either the validated value or normalized issues with an optional original error.

```ts
function display(result: Validated<string>) {
  return result.issues ? result.issues.map(i => i.message).join(", ") : result.value;
}
```

## to_issues {#symbol-to_issues}

`to_issues(issues: readonly unknown[]): ChoIssue[]` normalizes messages and paths. An empty list produces one issue with the message `Invalid value`.

```ts
to_issues([{ path: [{ key: "title" }], message: "Required" }]);
// [{ message: "Required", path: ["title"] }]
```

## error_issues {#symbol-error_issues}

`error_issues(error: unknown): ChoIssue[]` normalizes a thrown object's issues or obtains a single issue from its message.

```ts
error_issues(new Error("Missing ISBN")); // [{ message: "Missing ISBN" }]
```
