# Configure decorators

Decorators record the classes, methods and dependencies that CHO will wire together at startup. The TypeScript types check whether the declarations fit the code. At runtime, CHO uses the actual tokens passed to the decorators.

## Select a compiler mode

For standard decorators, use TypeScript 5+ and omit `experimentalDecorators`. If an existing project enables `experimentalDecorators`, CHO also accepts that legacy calling convention. Deno, Bun and Node projects can share decorated classes. See [runtime setup](/guide/runtimes) for the runner.

Dependency injection works without `emitDecoratorMetadata` or a `reflect-metadata` import. An interface disappears during compilation, so give interface-shaped values a typed token.

```ts
import { Injectable, token } from "@chojs/web";

export const SHELF = token<string>("default shelf");

@Injectable([SHELF])
export class LabelPrinter {
  constructor(readonly shelf: string) {}
}
```

The decorator connects `SHELF` to constructor position zero. A module still needs to [provide a value for that token](/di/providers).

## No parameter decorators

Put web argument readers on the method. Their order is the order of the values supplied at dispatch. A method may also take the context after those values.

```ts
@Get(":id")
@Args(Param("id"), Query("edition"))
find(id: string, edition: string | undefined) {
  return { id, edition: edition ?? "first" };
}
```

This reads `GET /42?edition=second` as the pair `"42"` and `"second"`. [Handler arguments](/web/arguments) covers parsed bodies and custom readers.

## Order and inheritance

Use a single `@Middlewares(first, second)` when execution order matters. Put routing and input declarations together on public instance methods. A derived controller can reuse a decorated base method. An override can keep the inherited route or supply a new route decorator. Check the final method and path in `app.routes` after refactoring a base class.
