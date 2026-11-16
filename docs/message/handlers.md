# Handlers and the context

A handler receives one argument, the `ChoMessageContext` of the message.
Middlewares and error handlers receive the same one.

```ts
import { type ChoMessageContext, Controller, Subscribe } from "@chojs/message";

@Controller({ topic: "orders" })
class OrdersController {
  @Subscribe("created")
  created(ctx: ChoMessageContext) {
    const order = ctx.json<{ id: string }>();
    console.log(ctx.topic, ctx.key, order.id, ctx.headers["message-id"]);
  }
}
```

## The context

| Property  | Holds                                                                         |
| --------- | ----------------------------------------------------------------------------- |
| `topic`   | The full topic of the message, global prefix included                         |
| `value`   | The value of the message, as bytes (`Uint8Array`); empty when it has none     |
| `key`     | The key of the message; `undefined` when it has none                          |
| `headers` | The headers of the message, as an object of strings; empty when it has none   |
| `text()`  | The value, decoded as UTF-8; `""` for an empty value                          |
| `json()`  | The value, parsed as JSON; `undefined` for an empty value                     |
| `state`   | A `Map` for the message: what a middleware sets, later ones and handlers read |
| `native`  | The adapter's own message, for what only that adapter has                     |

The context is plain data. It is the same whatever the broker, which is what
keeps a controller free of the client library.

## Reading the value

A broker carries bytes, and nothing decodes them before the handler. The
handler says how the value is read:

```ts
@Subscribe("created")
created(ctx: ChoMessageContext) {
  ctx.value; //            Uint8Array: Avro, Protobuf, an image
  ctx.text(); //           string
  ctx.json<Order>(); //    your promise: nothing checks the type
}
```

- `json<T>()` types the result by your word. To check it, give the parsed
  value to a validator, such as a Zod schema.
- `json()` throws a `SyntaxError` for a value that is not JSON. That error
  goes to the [error handler](/message/error-handling), like any other.
- `text()` decodes once: calling it, or `json()`, again costs nothing.

## Handled, or failed

A handler has no response to give. A message has one of two outcomes:

| Outcome     | When                                                        | The adapter                                          |
| ----------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| **Handled** | The handler returns, or an error handler settles its error  | Acknowledges the message: it is not delivered again  |
| **Failed**  | The handler throws, and no error handler settles the error  | Does what its broker does with such a message        |

- **What a handler returns is ignored.** A handler can be `async`: the message
  is handled when its promise resolves.
- **What "failed" leads to is the adapter's decision**: delivering the message
  again, moving it to a dead-letter topic, or stopping. Each adapter documents
  it.
- **A message is acknowledged after its handler has returned.** A process that
  stops in the middle of a handler gets the message again.

::: warning Write handlers that are safe to run twice
With acknowledgement after handling, a message is delivered **at least once**.
A handler that charges a card must know that it already did, by the id of the
message or of the order. A [middleware](/message/middlewares#dropping-a-message)
can do that for every handler.
:::

## `ctx.native`

The adapter's own message: its partition and offset, its delivery count,
whatever its client library gives. Its type is `unknown`, and the adapter says
what it is.

```ts
@Subscribe("created")
created(ctx: ChoMessageContext) {
  const { partition, offset } = ctx.native as KafkaMessage;
}
```

Code that reads it runs on that adapter only. It is `undefined` for a message
delivered [by hand](/message/application#delivering-a-message-by-hand) without
one.

## Sending a message

`@chojs/message` receives. An application sends with the client of its broker,
provided like any other dependency:

```ts
const PRODUCER = token<Producer>("PRODUCER");

@Controller({ topic: "orders", dependencies: [PRODUCER] })
class OrdersController {
  constructor(readonly producer: Producer) {}

  @Subscribe("created")
  async created(ctx: ChoMessageContext) {
    await this.producer.send("mails.outgoing", ctx.value);
  }
}
```

See [Tokens and providers](/di/providers) for a provider that connects before
it is ready, and is closed with the application.
