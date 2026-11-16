# Error handling

An error thrown by a handler, or by a middleware, goes to an **error
handler**. `@Catch(handler)` declares one on a feature module, a controller or
a handler, and the `onError` option of `ChoMessage.create` covers what no
`@Catch` does.

```ts
import { Catch, type ChoMessageContext, Controller, Subscribe } from "@chojs/message";

@Controller({ topic: "orders" })
class OrdersController {
  // a value that is not JSON will never be: drop it, after keeping a copy
  @Catch(async (error, ctx) => {
    if (error instanceof SyntaxError) {
      await rejected.save(ctx.topic, ctx.value);
      return true; // handled
    }
  })
  @Subscribe("created")
  created(ctx: ChoMessageContext) {
    const order = ctx.json<Order>();
    /* ... */
  }
}
```

## What an error handler returns

**An error handler that returns nothing has not handled the error**: the
message failed, and the adapter is told so. To settle the message as handled,
the error handler returns `true`.

| The error handler                 | The message                                              |
| --------------------------------- | -------------------------------------------------------- |
| Returns `true`                    | Handled                                                  |
| Returns anything else, or nothing | Failed, with the original error                          |
| Throws                            | Failed, with the original error; what it threw is printed with `console.error` |
| There is none                     | Failed, with the original error                          |

It is the rule of [`@chojs/web`](/web/error-handling#what-an-error-handler-returns),
for the same reason. An error handler that only logs must not turn every
failed message into a handled one: the broker would never deliver them again,
and they would be lost silently.

```ts
const app = await ChoMessage.create(App, {
  linker,
  // logs, and leaves the message failed: the adapter decides what is next
  onError: (error, ctx) => {
    console.error(ctx.topic, ctx.key, error);
  },
});
```

Return `true` when the error handler dealt with the message itself: it wrote
it somewhere else, or it decided that the message is to be dropped.

## Retry, or drop

What a failed message leads to is the [adapter's](/message/adapters) decision:
most deliver it again. So the question an error handler answers is whether
another try can succeed.

| The error                                             | Another try | Do                                  |
| ----------------------------------------------------- | ----------- | ----------------------------------- |
| The database is down, a request timed out             | Can succeed | Leave the message failed            |
| The value is not JSON, a required field is missing    | Never will  | Keep a copy, and return `true`      |

A message that can never be handled, and is left failed, is delivered again
and again, and on some brokers holds back the messages after it.

## The nearest one

An error goes to the nearest error handler: the handler's, else the
controller's, else the feature's, else the application's `onError`. One of
them is called, not all.

```ts
@Catch(feature_handler) //   3. else this one
@Module({ controllers: [OrdersController] })
class App {}

@Catch(controller_handler) // 2. else this one
@Controller({ topic: "orders" })
class OrdersController {
  @Catch(handler_handler) //  1. this one, when it is declared
  @Subscribe("created")
  created() {}
}

await ChoMessage.create(App, { onError: app_handler }); // 4. else this one
```

A class or a method has one `@Catch`.

## Error handler classes

An error handler can be a class with a `handle(error, ctx)` method, created
by the injector like a [middleware class](/message/middlewares#middleware-classes):

```ts
@Injectable([DeadLetters])
class KeepRejected {
  constructor(readonly dead: DeadLetters) {}

  async handle(error: unknown, ctx: ChoMessageContext) {
    if (error instanceof SyntaxError) {
      await this.dead.save(ctx.topic, ctx.value, String(error));
      return true;
    }
  }
}

@Catch(KeepRejected)
@Controller({ topic: "orders" })
class OrdersController {/* ... */}

@Module({
  providers: [DeadLetters, KeepRejected],
  controllers: [OrdersController],
})
class App {}
```

The `onError` option takes a class too, created in the scope of the root
module.

## What reaches an error handler

- An error thrown by the handler, or a promise it returned that rejected.
- An error thrown by a middleware of the handler.
- A middleware that called `next()` twice.

The error is the value that was thrown, so its type is `unknown`.

With `CHO_DEBUGLOG=cho:message`, each of these errors is logged with its
topic and the name of its handler, whether an error handler settles it or not
([Debug logging](/reference/debugging)).
