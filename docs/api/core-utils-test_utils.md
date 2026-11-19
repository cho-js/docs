---
outline: 2
---

# @chojs/core/utils/test_utils

These helpers capture output, supply environment values and simulate decorator calling conventions for extension tests. [Exercise a framework extension](/advanced/cho-module) · [Browse all packages](/api/)

## AnyMethodDecorator {#symbol-AnyMethodDecorator}

A method decorator, in either call shape.

```ts
export type AnyMethodDecorator = (target: object, context: ClassMethodDecoratorContext | string | symbol, descriptor?: PropertyDescriptor) => void;
```

### Usage {#AnyMethodDecorator-usage}

```ts
const args = (...list: unknown[]): AnyMethodDecorator =>
  loose(Args(...loose(list)));
```

[Usage in message/handler-args_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/handler-args_test.ts#L49)

## Output {#symbol-Output}

What a function wrote to `console.log` and `console.error`.

```ts
export type Output = {
    log: string[];
    error: unknown[];
};
```

### Usage {#Output-usage}

```ts
const output: Output = { log: [], error: [] };
```

[Usage in core/utils/test_utils.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/utils/test_utils.ts#L131)

## capture {#symbol-capture}

Run a function with `console.log` and `console.error` captured, and restore
them afterwards.

```ts
export function capture<T>(fn: () => T | Promise<T>): Promise<{
    result: T;
    output: Output;
}>;
```

### Usage {#capture-usage}

```ts
const { output } = await capture(() =>
      assert.rejects(app.handle("orders.created"), (error) => error === failure)
    );
```

[Usage in message/routes_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/routes_test.ts#L578)

## check_codes {#symbol-check_codes}

Check the error codes of a package against what it documents and what it
tests:

- every code is in the document, and the document has no other code with
  the prefix of the package;
- every code is named by a test of the package, other than the test that
  calls this function.

It reads files, so it needs a permission on Deno (`--allow-read`). Without
it nothing is checked, and `undefined` is returned; so it is where the test
is not a file (a bundle, as on Cloudflare Workers).

```ts
export function check_codes(codes: readonly string[], prefix: string, url: string, doc: string): Promise<string[] | undefined>;
```

### Usage {#check_codes-usage}

```ts
const problems = await check_codes(CODES, "CHO_WEB_", import.meta.url, "specs.md");
assert.deepEqual(problems ?? [], []);
```

## legacy {#symbol-legacy}

Apply a method decorator the legacy / Bun way.

```ts
export function legacy(decorator: AnyMethodDecorator, ctr: Ctr, name: string, { isStatic }?: {
    isStatic?: boolean;
}): void;
```

### Usage {#legacy-usage}

```ts
legacy(
      Catch((error) =>
        new Response(`caught: ${(error as Error).message}`, { status: 404 })
      ),
      Ctrl,
      "run",
    );
```

[Usage in web/handler-args_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/web/handler-args_test.ts#L323)

## loose {#symbol-loose}

Bypass the parameter types, to pass the values JS callers can.

```ts
export const loose: (value: unknown) => any;
```

### Usage {#loose-usage}

```ts
assert.throws(() => docsPage(loose({ url: URL, ui: "toString" })), {
      code: "CHO_OPENAPI_UNKNOWN_UI",
      message: /unknown ui "toString"/,
    });
```

[Usage in extras/openapi/page_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/extras/openapi/page_test.ts#L186)

## method_context {#symbol-method_context}

A TC39 method decorator context.

```ts
export function method_context(name: string | symbol, { isStatic, isPrivate }?: {
    isStatic?: boolean;
    isPrivate?: boolean;
}, metadata?: DecoratorMetadataObject): ClassMethodDecoratorContext;
```

### Usage {#method_context-usage}

```ts
decorator(fn, method_context(name, flags, metadata));
```

[Usage in core/utils/test_utils.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/utils/test_utils.ts#L98)

## tc39 {#symbol-tc39}

Apply a method decorator the TC39 way.

```ts
export function tc39(decorator: AnyMethodDecorator, fn: Function, name: string | symbol, flags?: {
    isStatic?: boolean;
    isPrivate?: boolean;
}): DecoratorMetadataObject;
```

### Usage {#tc39-usage}

```ts
assert.throws(
      () => tc39(Subscribe("created"), () => {}, "created", { isStatic: true }),
      { code: "CHO_MESSAGE_INVALID_TARGET" },
    );
```

[Usage in message/decorators_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/decorators_test.ts#L111)

## tc39_record {#symbol-tc39_record}

The record of a method decorated with `tc39`.

```ts
export function tc39_record(fn: Function, name?: string | symbol): unknown;
```

### Usage {#tc39_record-usage}

```ts
const flags_of = (fn: () => void) =>
    (tc39_record(fn, "run") as Record<symbol, unknown> | undefined)?.[FLAGS];
```

[Usage in command/decorators_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/command/decorators_test.ts#L352)

## with_env {#symbol-with_env}

Run a function with environment variables overridden, then restore the
environment, even when it throws.

The real environment is never changed. While `fn` runs, `globalThis.process`
is replaced by a stand-in (inheriting from the real one) whose `env` returns
the given values, and the real variables for every other name. So it needs
no permission (Deno's `--allow-env`), and tests cannot leak variables into
each other. Only code that reads `process.env` at call time sees the values,
as `env()` from `@chojs/core/utils` does.

```ts
export function with_env(vars: Record<string, string | undefined>, fn: () => void): void;
```

### Usage {#with_env-usage}

```ts
with_env({ CHO_DEBUG: "1", CHO_DEBUGLOG: undefined }, () => {
  assert.equal(debuglog("cho").enabled, true);
});
```

## standard_schema {#symbol-standard_schema}

`standard_schema<Output, Input = unknown>(validate)` builds a Standard Schema fixture with vendor `test`. Supply a function that returns a value or issues, optionally in a promise.

```ts
import { standard_schema } from "@chojs/core/utils/test_utils";

const nonEmpty = standard_schema<string, string>((value) =>
  typeof value === "string" && value.length > 0
    ? { value }
    : { issues: [{ message: "Expected a nonempty string" }] }
);
```
