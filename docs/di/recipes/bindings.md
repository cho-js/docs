# Supply a value, class, alias or factory

CHO accepts an [`@Injectable`](/api/core#symbol-Injectable) class directly in `providers` when consumers look it up by class. For an explicit binding, CHO has one provider object shape. `provide` is the token consumers request, `deps` lists the inputs in order and `factory` returns the value they receive.

| If you usually reach for… | In CHO |
| --- | --- |
| `useValue` | Return the configuration value or existing object from a zero-argument factory |
| `useClass` | Construct the chosen implementation in the factory for the public token |
| `useExisting` | Depend on the original token and return the resolved object |
| `useFactory` | List the input tokens and compute or asynchronously load the result |
| A multi-provider | Give each contribution its own token and collect them with an array factory |

The first four recipes build a label printer for a library. Each snippet is part of the same runnable example.

## Inject a fixed value

<<< @/examples/di/labels.ts#value

A consumer can now request `BRANCH` as a string. To supply an existing object, capture it in the factory, for example `factory: () => settings`. Every consumer of that declaration receives the object you supplied.

## Select an implementation for an interface

<<< @/examples/di/labels.ts#class

Consumers request `PRINTER` and depend only on `LabelPrinter`. The factory owns construction, so `ShelfPrinter` can be an ordinary TypeScript class. To use a different implementation, change the factory. To substitute a recording printer in a test, override `PRINTER` with `provider({ provide: PRINTER, factory: () => recordingPrinter })`. [Test overrides](/di/lifecycle#overrides-for-tests)

## Give an existing instance a second token

<<< @/examples/di/labels.ts#alias

Both desks receive the same object. Constructing another `ShelfPrinter` in the alias factory would give the returns desk a second instance. If the original is already registered as an `@Injectable` class, put that class in `deps` and return its instance the same way.

## Build a value from other providers

<<< @/examples/di/labels.ts#factory

CHO resolves the printer before calling the outer function. It caches the resulting batch function, which the desk can call with different titles each time. For asynchronous setup, a factory can return a promise. CHO waits for its result before creating dependent providers.

## Wire the recipes together

<<< @/examples/di/labels.ts#consumer

To run it, add `@chojs/core` to a Deno project with `deno add jsr:@chojs/core`, copy the complete example below into `labels.ts` and run `deno run labels.ts`. The first line should read `Central | The Odyssey`. The second should read `true`, confirming that both printer tokens resolve to the same instance.

::: details Complete labels.ts
<<< @/examples/di/labels.ts
:::

## Collect several implementations

For a desk that prints to two **different** devices, give each one its own binding. Ask for both in the factory of a typed collection. With `PRINTER` and `BRANCH` from above, add these two providers to `Library.providers`.

```ts
const ARCHIVE_PRINTER = token<LabelPrinter>("archive printer");
const ALL_PRINTERS = token<readonly LabelPrinter[]>("all printers");

const archivePrinterProvider = provider({
  provide: ARCHIVE_PRINTER,
  deps: [BRANCH],
  factory: (branch) => new ShelfPrinter(branch + " archive"),
});
const allPrintersProvider = provider({
  provide: ALL_PRINTERS,
  deps: [PRINTER, ARCHIVE_PRINTER],
  factory: (desk, archive) => [desk, archive],
});
```

Inject `ALL_PRINTERS` to iterate over the devices in the declared order. Registering the same token twice in one module is a duplicate declaration. When contributions live in separate modules, export each token and import those modules where you declare the collection. [Module visibility](/di/modules)

## Choose an alias or a second instance

Resolve a client through its class token and through an alias whose factory returns the injected client. The two references should be identical. To supply a second client, use a new token with a factory that constructs it using the second configuration.
