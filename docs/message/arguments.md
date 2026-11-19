# Read and validate message arguments

Use [`@Args`](/api/message#symbol-Args) when a handler needs specific delivery fields. For a shipment notice, the body can hold the ISBN, the key can identify the copy and a header can name the branch. The following subscriber trims the ISBN and rejects an invalid shipment before the inventory method runs.

<<< @/examples/message/arguments.ts

Save the file as `examples/arguments.ts` in the [development checkout](/guide/getting-started#run-examples-against-the-development-version) and run `deno run examples/arguments.ts`. The valid delivery prints `9780140268867 copy-17 central`. The second prints `CHO_MESSAGE_INVALID_MESSAGE`.

| Reader from `@chojs/message` | Value passed to the method |
| --- | --- |
| `Value()` or `Value("isbn")` | The decoded JSON body or one property. An empty body yields `undefined` |
| `Key()` | The string key, or `undefined` |
| `Header()` or `Header("branch")` | All headers or the exact named header. A missing named header yields `undefined` |
| A custom reader such as `ctx => ctx.text()` | The returned value, awaited if asynchronous. Use `ctx.value` for binary data |

List readers in parameter order. The method can also take [`ChoMessageContext`](/api/message#symbol-ChoMessageContext) as the last parameter. A string-topic subscription without `@Args` receives just the context. Readers run after middleware, immediately before the method.

## Decide what invalid input does

Pass a validator as the last argument to a built-in reader. It can parse, transform or asynchronously check the value. [`validate()`](/api/message#symbol-validate) enables validators on the method, controller or declaring feature module. When several apply, the nearest one supplies the policy. Without that middleware the handler receives the raw reader results.

By default an invalid field or malformed JSON read by [`Value`](/api/message#symbol-Value) fails the delivery. The selected [`@Catch`](/api/message#symbol-Catch) can handle the error. If it remains failed, Kafka and JetStream skip ordinary retries and apply their dead-letter policy. A Core NATS request receives a default `400 Bad Request` service reply.

To deliberately skip a malformed event, supply an `onInvalid` function to the validation middleware.

```ts
validate({
  onInvalid: ({ source, key, error }, ctx) => {
    console.warn(ctx.topic, source, key, error);
    return true;
  },
});
```

Returning `true` settles without a reply. Returning `false` or `undefined` keeps the failure. Any other encodable value supplies a fallback reply. [Delivery outcomes](/message/error-handling)

## Make failure observable

Give the validator a payload with the right JSON shape and the wrong field type. Add a counter inside the subscription method and inspect it after delivery. A rejected argument should reach the error policy before the method increments the counter.
