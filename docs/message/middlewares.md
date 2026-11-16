# Middlewares

A middleware wraps what comes after it: the next middlewares, then the
handler. It can drop a message, measure it or prepare its context.
`@Middlewares(...)` applies to a feature module, a controller, or a handler.

```ts
import {
  type ChoMessageContext,
  type ChoMessageMiddlewareFn,
  Controller,
  Middlewares,
  Subscribe,
} from "@chojs/message";

const timing: ChoMessageMiddlewareFn = async (ctx, next) => {
  const start = Date.now();
  await next();
  console.log(ctx.topic, `${Date.now() - start}ms`);
};

@Middlewares(timing) // every handler of the controller
@Controller({ topic: "orders" })
class OrdersController {
  @Subscribe("created")
  created(ctx: ChoMessageContext) {}
}
```

## What a middleware can do

Middlewares work as those of [`@chojs/web`](/web/middlewares) do, with one
difference: a message has **no result**. There is no `Response` to return or to
replace, only the outcome of the message, [handled or failed](/message/handlers#handled-or-failed).

- **`next()`** runs the rest of the chain. It resolves when the rest is done,
  and rejects with its error.
- **Returning without calling `next()`** skips the handler, and the message is
  **handled**. It is how a middleware drops a message.
- **What a middleware returns is ignored.**
- **Throwing** fails the message: the error goes to the
  [error handler](/message/error-handling), like an error of the handler.

::: code-group

```ts [Drop a message]
// messages that are not for this application
const mine: ChoMessageMiddlewareFn = (ctx, next) =>
  ctx.headers["tenant"] === "acme" ? next() : undefined;
```

```ts [Prepare the context]
const trace: ChoMessageMiddlewareFn = (ctx, next) => {
  ctx.state.set("trace", ctx.headers["trace-id"] ?? crypto.randomUUID());
  return next();
};
```

```ts [Refuse a message]
const signed: ChoMessageMiddlewareFn = (ctx, next) => {
  if (!ctx.headers["signature"]) {
    throw new Error("unsigned message"); // the message failed
  }
  return next();
};
```

:::

### A middleware cannot hide a failure

When `next()` rejects, the message failed, **even when the middleware catches
the error**. A middleware can look at the error, log it, and throw another in
its place. It cannot make the message handled.

```ts
const quiet: ChoMessageMiddlewareFn = async (_ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error(error);
    // returning here changes nothing: the message failed
  }
};
```

Settling a failed message as handled is what an
[error handler](/message/error-handling) does, where it is explicit. A
`try`/`catch` written for logging must not, by accident, acknowledge every
message that failed.

A middleware that calls `next()` twice makes the message fail.

## Middleware classes

A middleware can also be a class with a `handle(ctx, next)` method. It is
created by the injector, so it can have dependencies:

```ts
import {
  type ChoMessageContext,
  type ChoMessageNext,
  Injectable,
} from "@chojs/message";

@Injectable([Processed])
class Once {
  constructor(readonly processed: Processed) {}

  async handle(ctx: ChoMessageContext, next: ChoMessageNext) {
    const id = ctx.headers["message-id"];
    if (id && await this.processed.has(id)) {
      return; // handled before: skip the handler
    }
    await next();
    if (id) {
      await this.processed.add(id);
    }
  }
}

@Middlewares(Once)
@Controller({ topic: "orders" })
class OrdersController {/* ... */}

@Module({
  providers: [Processed, Once], // the class is a provider of the module
  controllers: [OrdersController],
})
class App {}
```

The class is created in the scope of the feature module, so it must be a
provider visible there: one of its `providers`, or exported by a module it
imports. It is created once, when the application is created.

### Dropping a message

`Once`, above, is the usual answer to
[at-least-once delivery](/message/handlers#handled-or-failed): it remembers the
id of each message it handled, and drops the ones it has seen. The id is
recorded **after** `next()` resolved, so a message whose handler failed is
tried again.

## Levels and order

A message runs the feature's middlewares, then the controller's, then the
handler's, each in declaration order.

```ts
@Middlewares(a) //     feature: every handler of its controllers
@Module({ controllers: [OrdersController] })
class App {}

@Middlewares(b) //     controller
@Controller({ topic: "orders" })
class OrdersController {
  @Middlewares(c) //   handler
  @Subscribe("created")
  created() {}
}

// a → b → c → created → c → b → a
```

**Middlewares belong to their handlers.** They only run for a message of a
topic they apply to. There is no middleware of the application: a message with
no handler never arrives, since the application did not subscribe to its
topic.

::: warning A module with web controllers too
`@Middlewares` on a module applies to every controller of the module. In an
application that shares one module graph with `@chojs/web`, a module that
holds both kinds of controllers declares no `@Middlewares` of its own
([With a web application](/message/with-web#rules)).
:::
