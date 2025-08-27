# Internals

## Decorators and Metadata

Decorator write metadata directly to the class or method using
`Object.defineProperty` with a unique symbol as the key.

This approach is simple and efficient, but it has some limitations:

- Metadata is not inherited. If a class extends another class, the metadata of
  the parent class is not available in the child class.
- Metadata is not type-safe. There is no guarantee that the metadata is of the
  expected type.
- Metadata is not easily discoverable. There is no way to list all metadata keys
  or values

The pros of this approach:

- No external dependencies
- No need for a separate metadata storage/registry
- No need for reflection API

## Types

For creating decorators, some banned types are needed, so we provide a meta
types to replace them.

For cases when we need a real `any` type, and we don't want to add a comment to
disable the lint rule:

```ts
type Any = any;
```

For cases when we need a real `Function` type, and we don't want to add a
comment to disable the lint rule:

```ts
type Target = Function;
```

And `constructor` and `instance` types to represent classes and instances of
classes:

```ts
type Ctr<T> = new (...args: Any[]) => T;

type Instance<T> = Object & T;
```

## Dependency Injection

The DI system designed with **_simplicity_** and modularity in mind.
The building blocks of the DI system are `provider` and `module`. Provider is a recipe for creating a dependency, and module is a logical container of providers.

Module can import other modules and get access to their providers. Any provider is exported by default, so any module that imports a module gets access to all its providers.

For simplicity, there are only single type of provider, factory one. And only async factory is supported.

### Providing Values

A provider can provide a value using the factory function:

```ts
@Module(
  Provide("token", async () => value),
)
```

### Providing Classes

Class decorated with `@Injectable` can be provided using its class as the token:

```ts

@Injectable()
class MyService {
}

@Module(
  Provide(MyService),
)

```

### Providing Classes with Dependencies

Extending the `@Injectable` decorator with `dependsOn` function let you define the dependencies of the class:

```ts

@Injectable(DependsOn("token"))
class MyService {
  constructor(private token: string) {
  }
}

@Module(
  // or import module providing the token
  Provide("token", () => Promise.resolve("value")),
  Provide(MyService),
)

```

## Web

### Transformations

