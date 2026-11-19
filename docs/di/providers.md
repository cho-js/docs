# Supply values with tokens and factories

A class can serve as its own lookup key. For a configuration value, an interface or two separately configured instances of one class, create a typed token. Export the token from one file and import that same object everywhere you use it. Creating another token with the same description produces a different key.

## Build a provider from dependencies

```ts
import { Injectable, Module, provider, token } from "@chojs/web";

const BRANCH = token<string>("library branch");
const LABEL_PREFIX = token<string>("label prefix");

@Injectable([LABEL_PREFIX])
class Printer {
  constructor(readonly prefix: string) {}
  label(title: string) {
    return this.prefix + " " + title;
  }
}

@Module({
  providers: [
    provider({ provide: BRANCH, factory: () => "central" }),
    provider({
      provide: LABEL_PREFIX,
      deps: [BRANCH],
      factory: (branch) => "[" + branch.toUpperCase() + "]",
    }),
    Printer,
  ],
  exports: [Printer],
})
export class LabelsModule {}
```

When CHO creates `Printer` it resolves `LABEL_PREFIX` first. That factory receives the branch string and returns `"[CENTRAL]"`. A factory may return a promise. CHO waits for it before constructing the consumer.

## Match the declaration to the consumer

| Consumer | Declare its inputs on | What receives the values |
| --- | --- | --- |
| Provider class | `@Injectable([A, B])` | Constructor |
| Controller or module | `dependencies: [A, B]` in decorator options | Constructor |
| Factory provider | `deps: [A, B]` in `provider({...})` | Factory function |

For three constructor parameters, list all three tokens in the same order. TypeScript can catch incompatible types. Two string tokens have the same value type, so their relative order still needs review. Use typed tokens for value inference. Symbols also work as runtime keys.

To replace one of these declarations for a test, pass a provider with the original `provide` token in [`overrides`](/di/lifecycle).

For working equivalents of `useValue`, `useClass`, `useExisting`, `useFactory` and multi-providers, follow the [provider recipes](/di/recipes/bindings).

## Substitute a value without changing its consumers

Keep the same typed token in the constructor dependency list and replace the provider's factory with one that reads deployment settings. If obtaining settings requires I/O, return a promise from that factory. Consumers receive the resolved value.
