# Decorators

CHO is written with decorators, and works with both forms that exist today.

| Form            | Where it comes from                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Standard (TC39) | The [stage 3 proposal](https://github.com/tc39/proposal-decorators): TypeScript 5 without `experimentalDecorators`, and Deno |
| Legacy          | TypeScript with `experimentalDecorators: true`, and Bun's own implementation                                                 |

You do not choose in your code: the same application runs with either, and no
import changes. Every CHO decorator accepts both call shapes.

## What CHO does not need

- **No `reflect-metadata`.** Nothing is read from emitted type information.
- **No `emitDecoratorMetadata`**, and no compiler plugin.
- **No parameter decorators.** There is no `@Inject()` on constructor
  parameters, which standard decorators do not have.

Dependencies are listed in the decorator instead, in the order of the
constructor's parameters:

```ts
@Injectable([Logger, PORT])
class Server {
  constructor(logger: Logger, port: number) {}
}

@Controller({ route: "users", dependencies: [UserStore] })
class UsersController {
  constructor(readonly store: UserStore) {}
}
```

The list is checked against the constructor **at compile time**: a wrong order,
a wrong type or a missing dependency does not compile. See
[Tokens and providers](/di/providers#the-dependencies-are-type-checked).

## Per runtime

::: code-group

```jsonc [Deno: deno.jsonc]
{
  // Standard decorators are the default. Nothing to set.
  // For legacy decorators:
  "compilerOptions": { "experimentalDecorators": true }
}
```

```jsonc [Node.js: tsconfig.json]
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true
    // Standard decorators: leave "experimentalDecorators" out.
  }
}
```

```jsonc [Bun: tsconfig.json]
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "Preserve",
    "moduleResolution": "bundler",
    "strict": true
    // Legacy decorators: "experimentalDecorators": true
  }
}
```

:::

- **Deno** and **Bun** run TypeScript decorators directly.
- **Node.js** needs the application compiled with TypeScript 5 (`tsc`), or run
  with a tool such as `tsx`.

## Order of decorators

Decorators on one class or method can be written in any order, with one rule
of thumb: read them top to bottom as "outside in".

```ts
@Middlewares(auth) //   runs first
@Middlewares(timing) // runs second
@Catch(onError)
@Controller({ route: "admin" })
class AdminController {
  @Middlewares(audit) // after the controller's middlewares
  @Get("stats")
  stats() {}
}
```

- `@Middlewares` can be applied several times; middlewares are kept in source
  order, top decorator first, and within one decorator in argument order.
- A class has one of `@Injectable`, `@Module` or `@Controller`.
- A class or a method has at most one `@Catch`.
- A method has one HTTP method decorator (`@Get`, …), or one of `@Main` and
  `@Action`.

Mistakes in a decorator (a second `@Get` on a method, an unknown option, an
invalid route) throw when the class is **defined**, so they show up as soon as
the file is loaded.

## Inheritance

A controller has the handlers or commands it inherits from a base class. An
override keeps what its parent declared unless it declares it again:

```ts
@Controller({ route: "items" })
class ItemsController {
  @Get(":id")
  get(ctx: ChoWebContext) {}
}

@Controller({ route: "books" })
class BooksController extends ItemsController {
  @Middlewares(cache) // added after the parent's middlewares
  override get(ctx: ChoWebContext) {} // still GET /books/:id
}
```

The class decorators themselves are not inherited: a subclass is decorated on
its own.
