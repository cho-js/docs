# Topics

A handler is a controller method marked with `@Subscribe(topic)`. The topic is
to a message application what a route is to a web application: it says which
messages the method handles.

```ts
import { Controller, Subscribe } from "@chojs/message";

@Controller({ topic: "orders" })
class OrdersController {
  @Subscribe("created") // orders.created
  created() {}

  @Subscribe("") //        orders: the controller's own topic
  all() {}
}
```

## The four levels

The full topic of a handler joins up to four levels with a `.`. Each is
optional:

| Level         | Declared by                                                        |
| ------------- | ------------------------------------------------------------------ |
| Global prefix | The `prefix` option of `ChoMessage.create`                         |
| Feature       | The `topic` option of the feature's `@Module`                      |
| Controller    | The `topic` option of `@Controller`                                |
| Handler       | The argument of `@Subscribe`                                       |

```ts
@Controller({ topic: "orders" })
class OrdersController {
  @Subscribe("created")
  created() {}
}

@Module({ topic: "shop", controllers: [OrdersController] })
class ShopModule {}

const app = await ChoMessage.create(ShopModule, { prefix: "staging" });
// staging.shop.orders.created
```

A **feature** is a module that declares controllers. Importing a module does
not nest its topics: every feature starts at the global prefix, whatever
imports it.

```ts
@Module({ topic: "billing", controllers: [InvoicesController] })
class BillingModule {}

@Module({ topic: "shop", imports: [BillingModule], controllers: [OrdersController] })
class ShopModule {}

// shop.orders.created
// billing.invoices.paid      not shop.billing.invoices.paid
```

A level can hold several segments, such as `@Controller({ topic: "shop.orders" })`.

## The rules

- A topic is **segments of letters, digits, `_` and `-`, separated by `.`**. A
  name with another separator is one segment:
  `@Subscribe("orders-created")`.
- It does not start or end with a `.`, and has no empty segment (`..`).
- **There is no pattern**: no wildcard (`*`, `>`, `#`) and no parameter. A
  handler handles one topic.
- **A topic has one handler.** Two handlers with the same full topic are an
  error when the application is created.
- A handler needs at least one level: a handler whose four levels are all
  empty is an error.
- Topics are compared as written: `Orders` and `orders` are two topics.

Every one of these is checked when the application is created, before
anything connects ([Error messages](/reference/errors#chojs-message)).

::: tip Why no wildcards
Brokers do not agree on them: NATS has `*` and `>`, MQTT has `+` and `#`,
Kafka subscribes with a regular expression. A name means the same everywhere,
so an application can change its broker without changing its controllers.
:::

## A handler

`@Subscribe` goes on a public, non-static method with a string name. A method
has one `@Subscribe`: to handle two topics the same way, write two methods
that call a third.

```ts
@Controller({ topic: "orders" })
class OrdersController {
  @Subscribe("created")
  created(ctx: ChoMessageContext) {
    return this.#notify(ctx);
  }

  @Subscribe("updated")
  updated(ctx: ChoMessageContext) {
    return this.#notify(ctx);
  }

  #notify(ctx: ChoMessageContext) {/* ... */}
}
```

A controller with no `@Subscribe` method is not part of the message
application. It is how one module graph holds the controllers of a
[web application](/message/with-web) too.

## What is not part of a topic

| What                               | Where it is                                              |
| ---------------------------------- | -------------------------------------------------------- |
| The consumer group                 | An option of the [adapter](/message/adapters)            |
| The partition, the offset          | `ctx.native`, the adapter's own message                  |
| The type of a message, in a header | `ctx.headers`: the handler of the topic looks at it      |

## Listing the topics

```ts
const app = await ChoMessage.create(App, { prefix: "staging" });

app.routes.map((route) => `${route.topic} -> ${route.name}`);
// [ "staging.orders.created -> OrdersController.created", … ]
```

With `CHO_DEBUGLOG=cho:message`, the same list is logged when the application
is created ([Debug logging](/reference/debugging)).
