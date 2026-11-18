# Wrap message processing

Use middleware to measure handling time, attach delivery metadata or filter messages before calling the consumer. For the incoming message, CHO invokes middleware from the feature module, controller and method, in that order.

```ts
import type { ChoMessageMiddlewareFn } from "@chojs/message";

const audit: ChoMessageMiddlewareFn = async (ctx, next) => {
  const start = performance.now();
  try {
    await next();
    console.log("handled", ctx.topic, ctx.key);
  } finally {
    console.log("elapsed ms", Math.round(performance.now() - start));
  }
};
```

Apply `@Middlewares(audit)` to the controller or to a single subscription. A `finally` block runs even when the delivery fails. Exceptions continue into the selected [error handler](/message/error-handling).

## Filter deliberately

```ts
const currentEdition: ChoMessageMiddlewareFn = async (ctx, next) => {
  if (ctx.headers.edition === "retired") return;
  await next();
};
```

Returning before `next()` skips the remaining chain and **settles the delivery successfully**. Use this for records you intend to discard. Throw to leave a delivery failed. Returning `false` from middleware does not request a retry. Call `next()` at most once.

## Share dependencies and state

A middleware class can request services through `@Injectable([Service])` and expose `handle(ctx, next)`. Register it in providers and pass the class to `@Middlewares`. Use `ctx.state` for data computed for this delivery. The class instance can serve concurrent deliveries, even though each delivery has its own state map.
