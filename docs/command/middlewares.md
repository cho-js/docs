# Wrap a command invocation

Use command middleware for behavior shared by several actions, such as timing, checking a profile or opening an operation-specific context. Each invocation gets a new `state` map, even when the application reuses the same controller instance.

```ts
import type { ChoCommandMiddlewareFn } from "@chojs/command";

const report: ChoCommandMiddlewareFn = async (ctx, next) => {
  const start = performance.now();
  const code = await next();
  console.error(ctx.command, code, Math.round(performance.now() - start) + "ms");
  return code;
};
```

## Choose where it runs

Attach `@Middlewares(report)` to a command for a single operation, to a controller for its actions, or to the declaring module for its controllers. The incoming order is feature, controller, method, command. After `await next()`, the middleware resumes in reverse order.

A middleware may complete early by returning a non-negative integer. For example, a required-profile check can print a diagnostic and return `2` before the command runs. When returning nothing, call `next()` once to pass the downstream status through. Returning a non-code value from middleware is a pipeline error.

## Inject a dependency

Use an injectable class with a `handle(ctx, next)` method when the check needs configuration or a service. Register that class as a provider visible in the feature module. Pass the class to `@Middlewares`. The pipeline resolves it on first use. Help and version output bypass the pipeline entirely.

For exceptions in the check, use [command error handling](/command/errors).
