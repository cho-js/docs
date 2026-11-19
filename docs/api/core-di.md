---
outline: 2
---

# @chojs/core/di

Extension authors can use this entry point to normalize decorator calls, record method metadata and resolve a handler in its declaring module. [Implement decorators and resolve handlers](/advanced/cho-module) · [Browse all packages](/api/)

## AbstractCtr {#symbol-AbstractCtr}

A class whose instances are of type `T`, abstract classes included.

Tokens accept abstract classes: an abstract class can identify a dependency
(for example a `Logger` interface-like base class) even though only a
provider can create a value for it.

```ts
export type AbstractCtr<T = Any> = abstract new (...args: never[]) => T;
```

### Usage {#AbstractCtr-usage}

```ts
export type Resolved<D> = D extends AbstractCtr<infer T> ? T
  : D extends InjectionToken<infer T> ? T
  : unknown;
```

[Usage in core/di/types.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/types.ts#L121)

## ChoMethodDecorator {#symbol-ChoMethodDecorator}

A method decorator that works with both decorator implementations:

- TC39 standard decorators call it with the method and a
  `ClassMethodDecoratorContext`;
- legacy (`experimentalDecorators`) and Bun decorators call it with the
  class prototype, the method name and the property descriptor.

Use `decorated_method` to find the method from these arguments.

```ts
export type ChoMethodDecorator = (target: Target | object, context: ClassMethodDecoratorContext | string | symbol, descriptor?: PropertyDescriptor) => void;
```

### Usage {#ChoMethodDecorator-usage}

```ts
export function Options(route: string): ChoMethodDecorator {
  return create_http_decorator("Options", route, "OPTIONS");
}
```

[Usage in web/decorators.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/web/decorators.ts#L594)

## DecoratedMethod {#symbol-DecoratedMethod}

A decorated method: where its record is stored, the method, its name, and
whether it is static or private.

```ts
export type DecoratedMethod = {
    meta: MetaTarget;
    fn: Function;
    name: string | symbol;
    static: boolean;
    private: boolean;
};
```

**`meta`** Where the method's record is stored: the target to give to
`add_to_metadata_object` and `read_metadata_object`.

It is the method's own metadata object, kept with its class by method
name (see `method_metadata`), so the record survives a decorator that
replaces the function, and is found for a subclass that inherits the
method. When the class cannot be reached from the decorator's arguments
(a static or private method, or TC39 decorators compiled for a runtime
without `Symbol.metadata`), it is the method function itself.

**`fn`** The method function.

**`name`** The method name. A private method's name includes the `#`.

**`static`** Whether the method is static.

**`private`** Whether the method is private (`#name`). Legacy / Bun decorators cannot
decorate private methods, so it is always `false` for them.

### Usage {#DecoratedMethod-usage}

```ts
return {
      meta: typeof ctr === "function"
        ? method_metadata(ctr, context)
        : descriptor.value,
      fn: descriptor.value,
      name: context,
      static: is_static,
      private: false,
    };
```

[Usage in core/di/decorations.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/decorations.ts#L758)

## Factory {#symbol-Factory}

Creates the value of a provider.

A factory receives the values of the provider's dependencies as arguments,
in the order the dependencies are declared, and never resolves anything
itself. It returns the value, or a promise of it, so creating a value can
include asynchronous initialization (opening a connection, reading a file).

```ts
export type Factory<T = Any> = (...deps: Any[]) => T | Promise<T>;
```

### Usage {#Factory-usage}

```ts
function class_factory(ctr: Ctr): Factory {
  // deno-lint-ignore require-await
  return async (...args: unknown[]) => Reflect.construct(ctr, args);
}
```

[Usage in core/di/metadata-graph.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/metadata-graph.ts#L182)

## METADATA_FORMAT {#symbol-METADATA_FORMAT}

The format of the records this copy of the package writes and reads: how
they are stored, and the keys and shapes of what the core writes in them.

Records are shared by every copy of the package in an application (see
`MetaKey`), so two copies must agree on the format. Each record is stamped
with the format it was written in, and reading a record of another format
throws instead of misreading it.

Increase it with any change that an older or newer copy would misread: a
renamed or re-shaped core key, or a change of where records are stored.

```ts
export const METADATA_FORMAT = 1;
```

### Usage {#METADATA_FORMAT-usage}

```ts
assert.equal(
      (method_metadata(Foo, "run") as Record<symbol, unknown>)[FORMAT],
      METADATA_FORMAT,
    );
```

[Usage in core/di/metadata_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/metadata_test.ts#L327)

## MetaTarget {#symbol-MetaTarget}

Where metadata can be stored: a class (or any function), or a TC39
decorator metadata object (`context.metadata` inside a decorator).

```ts
export type MetaTarget = Target | DecoratorMetadataObject;
```

### Usage {#MetaTarget-usage}

```ts
assert.equal(read_method_metadata({}, "run"), undefined);
```

[Usage in core/di/metadata_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/metadata_test.ts#L233)

## Resolved {#symbol-Resolved}

The value a dependency resolves to:

- the instance type, for a class;
- `T`, for an `InjectionToken``<T>`;
- `unknown`, for a symbol.

```ts
export type Resolved<D> = D extends AbstractCtr<infer T> ? T : D extends InjectionToken<infer T> ? T : unknown;
```

### Usage {#Resolved-usage}

```ts
expect_type<Equal<undefined extends Resolved<typeof Foo> ? 1 : 0, 0>>();
```

[Usage in core/di/types_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/types_test.ts#L79)

## ResolvedAll {#symbol-ResolvedAll}

The values of a list of dependencies, in the same order. This is the
argument list a factory receives.

```ts
export type ResolvedAll<D extends readonly unknown[]> = {
    -readonly [K in keyof D]: Resolved<D[K]>;
};
```

### Usage {#ResolvedAll-usage}

```ts
// [Config, string]
type Args = ResolvedAll<[typeof Config, InjectionToken<string>]>;
```

## add_to_metadata_object {#symbol-add_to_metadata_object}

Merge properties into the CHO record of a target.

Merge rules, per key (string and symbol keys alike):

- when both the existing and the added value are arrays, they are
  concatenated, existing values first, without removing duplicates;
- any other added value replaces the existing one. Objects are not merged
  deeply.

The result is written with `write_metadata_object`, so it is frozen.

```ts
export function add_to_metadata_object(target: MetaTarget, obj: Record<PropertyKey, unknown>): void;
```

### Usage {#add_to_metadata_object-usage}

```ts
add_to_metadata_object(Foo, { a: 1, b: [2] });
add_to_metadata_object(Foo, { b: [3], c: 4 });
read_metadata_object(Foo); // { a: 1, b: [2, 3], c: 4 }
```

## assert_handle {#symbol-assert_handle}

Assert that a value can be used as a middleware or an error handler: a
function, or a handle class. Nothing is created.

```ts
export function assert_handle(value: unknown, what: string): void;
```

### Usage {#assert_handle-usage}

```ts
assert.throws(() => assert_handle(Auth, "Middleware"), {
      code: "CHO_CORE_INVALID_MIDDLEWARE",
      message: "Middleware class Auth must implement 'handle' method.",
    });
```

[Usage in core/di/handles_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/handles_test.ts#L39)

## assert_known_options {#symbol-assert_known_options}

Assert that an options object only has known keys.

The closed option types catch a misspelled option when the code is
type-checked. This is the same check at runtime, for the decorators of CHO
modules, which know every option they accept: plain JavaScript, or a cast,
would otherwise let `{ deps: [...] }` through as an option nobody reads.

```ts
export function assert_known_options(decorator: string, options: object, known: readonly string[]): void;
```

### Usage {#assert_known_options-usage}

```ts
assert.throws(
      () => assert_known_options("@X()", loose({ a: 1, c: 3 }), ["a", "b"]),
      {
        code: "CHO_CORE_UNKNOWN_OPTION",
        message: '@X(): unknown option "c". Known options: a, b',
      },
    );
```

[Usage in core/di/decorations_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/decorations_test.ts#L53)

## assert_module_options {#symbol-assert_module_options}

Assert that the module options of `@Module` are valid, without writing
anything. `@Module` calls it before `set_injectable`, so a bad option
leaves the class undecorated.

```ts
export function assert_module_options(options: Partial<ModuleOptions> & ExtraOptions): void;
```

### Usage {#assert_module_options-usage}

```ts
assert_module_options({ imports, providers });
```

[Usage in core/di/configure.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/configure.ts#L148)

## decorated_method {#symbol-decorated_method}

Find the decorated method from the arguments of a
`ChoMethodDecorator`.

- TC39: `target` is the method and `context.kind` is `"method"`;
  `context.static` and `context.private` tell the method's kind;
- legacy / Bun: `target` is the prototype (or, for a static method, the
  class), `context` is the method name and the method is
  `descriptor.value`.

```ts
export function decorated_method(decorator: string, ...[target, context, descriptor]: Parameters<ChoMethodDecorator>): DecoratedMethod;
```

### Usage {#decorated_method-usage}

```ts
function Command(name: string): ChoMethodDecorator {
  return (target, context, descriptor) => {
    const method = decorated_method("@Command()", target, context, descriptor);
    add_to_metadata_object(method.meta, { command: name });
  };
}
```

## decorated_target {#symbol-decorated_target}

Find where a `ChoClassOrMethodDecorator` writes its record:

- on a class with TC39 decorators: `context.metadata`, as the DI decorators
  do. The runtime installs it as the class's `Symbol.metadata` after the
  class decorators run, replacing anything written onto the class itself;
- on a class with TC39 decorators but no `context.metadata` (compiled
  decorators on a runtime without `Symbol.metadata`): the class itself, as
  the DI decorators do;
- on a class with legacy / Bun decorators (no `context`): the class itself;
- on a method: the method's metadata object (see `decorated_method`).
  The method must be one whose record is read: public, not static, with a
  string name.

```ts
export function decorated_target(decorator: string, ...[target, context, descriptor]: Parameters<ChoClassOrMethodDecorator>): MetaTarget;
```

### Usage {#decorated_target-usage}

```ts
function Describe(text: string): ChoClassOrMethodDecorator {
  return (target, context, descriptor) => {
    const meta = decorated_target("@Describe()", target, context, descriptor);
    add_to_metadata_object(meta, { text });
  };
}
```

## is_handle_class {#symbol-is_handle_class}

Whether a value is a handle class: a class whose prototype has a `handle`
method.

```ts
export function is_handle_class<F>(value: unknown): value is Ctr<{
    handle: F;
}>;
```

### Usage {#is_handle_class-usage}

```ts
assert.equal(is_handle_class({ handle() {} }), false);
```

[Usage in core/di/handles_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/handles_test.ts#L21)

## is_token {#symbol-is_token}

Tell whether a value can be used as a token: a class (or any function), a
symbol, or an injection token created by `token`.

Strings and plain objects are not tokens.

```ts
export function is_token(value: unknown): value is Token;
```

### Usage {#is_token-usage}

```ts
assert.ok(!is_token(value), `${String(value)} should not be a token`);
```

[Usage in core/di/tokens_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/tokens_test.ts#L63)

## method_metadata {#symbol-method_metadata}

Where the record of a method is stored: a metadata object of its own, kept
with its class. Use it as the target of `read_metadata_object`,
`write_metadata_object` and `add_to_metadata_object`.

Decorators get it from `decorated_method` (`.meta`) or `decorated_target`,
which find the class from the decorator's arguments.

```ts
export function method_metadata(owner: MetaTarget, name: string | symbol): MetaTarget;
```

### Usage {#method_metadata-usage}

```ts
add_to_metadata_object(method_metadata(Cli, "run"), { command: "run" });
read_method_metadata(Cli, "run"); // { command: "run" }
```

## method_records {#symbol-method_records}

The records of the methods of a class, by method name: its own, and those
of the methods it inherits.

A subclass that decorates a method it inherits **adds to** the record of
its parent, by the merge rules of `add_to_metadata_object`: arrays
are concatenated, the parent's values first, and any other value of the
subclass replaces the parent's. So an override that only adds a middleware
keeps what the parent declared (a route, say), and an override that
declares it again replaces it. An override without any decorator inherits
the record as it is.

Two places are read for each class of the prototype chain, parents first,
and merged the same way when a method has a record in both (the table over
the function):

- the class's method table (see `method_metadata`), where decorators
  write;
- the method functions of its prototype, for records written on a function:
  by a decorator that could not reach the class (static and private
  methods, which are never listed here, and TC39 decorators compiled for a
  runtime without `Symbol.metadata`), or directly by a caller.

```ts
export function method_records(ctr: Target): Map<string | symbol, Readonly<Record<PropertyKey, unknown>>>;
```

### Usage {#method_records-usage}

```ts
assert.deepEqual([...method_records(Cli)], [
      ["run", { from: "base" }],
      ["copy", { from: "cli" }],
    ]);
```

[Usage in core/di/metadata_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/metadata_test.ts#L251)

## read_metadata_object {#symbol-read_metadata_object}

Read the CHO record of a target.

Only the target's own record is returned, never the one of a parent class.

```ts
export function read_metadata_object<T>(target: MetaTarget): T | undefined;
```

### Usage {#read_metadata_object-usage}

```ts
@Injectable([Logger])
class Db {}

read_metadata_object(Db);
// { [Symbol(chojs.core.isInjectable)]: true,
//   [Symbol(chojs.core.dependencies)]: [Logger] }
```

## read_method_metadata {#symbol-read_method_metadata}

Read the record of a method.

```ts
export function read_method_metadata<T>(owner: MetaTarget, name: string | symbol): T | undefined;
```

### Usage {#read_method_metadata-usage}

```ts
assert.deepEqual(
      (read_method_metadata(Ctrl, "created") as Record<symbol, unknown>)[ARGS],
      { list: [value] },
    );
```

[Usage in message/handler-args_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/message/handler-args_test.ts#L127)

## resolve_handle {#symbol-resolve_handle}

The function to call for a middleware or an error handler: the function
itself, or the `handle` method of the instance the injector creates for a
handle class, bound to it and named after its class (`Auth.handle`), for
error messages.

```ts
export function resolve_handle<F>(injector: Injector, value: unknown, scope: Ctr): Promise<F>;
```

### Usage {#resolve_handle-usage}

```ts
await assert.rejects(resolve_handle(new Injector(App), Timing, App), {
      code: "CHO_CORE_NOT_VISIBLE",
      message: "Timing is not visible in module App",
    });
```

[Usage in core/di/handles_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/handles_test.ts#L109)

## set_controller {#symbol-set_controller}

Add the controller fields to a target's record: the second step of
`@Controller`, after `set_injectable`.

Writes the `CONTROLLER` flag (see `ControllerRecord` in `keys.ts`) and
every option except `dependencies`, as is, under its own string key. Those
extra options are metadata for the application module that invokes the
controller, such as a CLI command's name; the DI system ignores them.
Values are stored by reference, except top-level arrays, which are copied.

`dependencies` is skipped: `set_injectable` already wrote it.

Nothing is validated, and an existing DI decorator is not checked for:
`@Controller` relies on its `set_injectable` call for both.

```ts
export function set_controller(target: MetaTarget, options: Partial<ControllerOptions> & ExtraOptions): void;
```

### Usage {#set_controller-usage}

```ts
set_injectable(Cli, { dependencies: [Logger] });
set_controller(Cli, { dependencies: [Logger], name: "cli" });
read_metadata_object(Cli);
// { [INJECTABLE]: true, [DEPENDENCIES]: [Logger], [CONTROLLER]: true,
//   name: "cli" }
```

## set_error_handler {#symbol-set_error_handler}

Set the error handler of a target: what `@Catch` does.

Writes the `ERROR_HANDLER` (see `keys.ts`). A target has at most one error
handler.

```ts
export function set_error_handler(target: MetaTarget, errorHandler: ChoErrorHandler): void;
```

### Usage {#set_error_handler-usage}

```ts
set_error_handler(Cli.prototype.run, (error) => 2);
```

## set_injectable {#symbol-set_injectable}

Mark a target as injectable: what `@Injectable` does, and the first step of
`@Module` and `@Controller`.

Writes the `INJECTABLE` flag and the `DEPENDENCIES` to the target's record
(see `InjectableRecord` in `keys.ts`).

```ts
export function set_injectable(target: MetaTarget, options: InjectableOptions, name?: string): void;
```

### Usage {#set_injectable-usage}

```ts
set_injectable(Server, { dependencies: [Logger, PORT] });
read_metadata_object(Server);
// { [INJECTABLE]: true, [DEPENDENCIES]: [Logger, PORT] }
```

## set_middlewares {#symbol-set_middlewares}

Add middlewares to a target's record: what `@Middlewares` does.

Writes the `MIDDLEWARES` list (see `keys.ts`). Middlewares from several calls are kept
all, in **source order of the decorators**: decorators are applied bottom
up, so each call puts its middlewares *before* the existing ones.

```ts
@Middlewares(a, b) // applied second: [a, b, c]
@Middlewares(c)    // applied first:  [c]
run() {}
```

```ts
export function set_middlewares(target: MetaTarget, middlewares: ChoMiddleware[]): void;
```

### Usage {#set_middlewares-usage}

```ts
set_middlewares(Cli.prototype.run, [auth, timing]);
read_metadata_object(Cli.prototype.run); // { [MIDDLEWARES]: [auth, timing] }
```

## set_module {#symbol-set_module}

Add the module fields to a target's record: the second step of `@Module`,
after `set_injectable`.

Writes the `MODULE` flag and the `IMPORTS`, `EXPORTS`, `PROVIDERS` and
`CONTROLLERS` lists, each defaulting to `[]` (see `ModuleRecord` in
`keys.ts`), plus every other option, as is, under its own string key. Those
extra options are metadata for the application module (such as a web route
prefix); the DI system ignores them. Values are stored by reference, except
top-level arrays, which are copied.

It does not write the `dependencies` option: that is `set_injectable`'s
job.

It does not check for an existing DI decorator either. Calling it twice on
the same target concatenates the lists; `@Module` never does, since its
`set_injectable` call throws first.

Only the shape of each list is validated (see the module documentation);
the rest is checked when the graph is read.

```ts
export function set_module(target: MetaTarget, options: Partial<ModuleOptions> & ExtraOptions): void;
```

### Usage {#set_module-usage}

```ts
set_injectable(App, { dependencies: [] });
set_module(App, { imports: [DbModule], providers: [UserService], route: "users" });
read_metadata_object(App);
// { [INJECTABLE]: true, [DEPENDENCIES]: [], route: "users", [MODULE]: true,
//   [IMPORTS]: [DbModule], [EXPORTS]: [], [PROVIDERS]: [UserService],
//   [CONTROLLERS]: [] }
```

## write_metadata_object {#symbol-write_metadata_object}

Write the CHO record of a target, replacing any existing one.

The stored record is a frozen copy of the own enumerable properties of
`obj`, string and symbol keys alike. Top-level arrays are copied and frozen
too; nested values (such as provider objects inside an array) are stored by
reference.

```ts
export function write_metadata_object(target: MetaTarget, obj: Record<PropertyKey, unknown>): void;
```

### Usage {#write_metadata_object-usage}

```ts
write_metadata_object(Foo, { a: 1 });
read_metadata_object(Foo); // { a: 1 }
```

## Also exported here

These declarations share their implementation with another entry point. Each link opens the full declaration.

[`Any`](/api/core#symbol-Any), [`Catch`](/api/core#symbol-Catch), [`ChoClassOrMethodDecorator`](/api/core#symbol-ChoClassOrMethodDecorator), [`ChoErrorHandler`](/api/core#symbol-ChoErrorHandler), [`ChoInjectableDecorator`](/api/core#symbol-ChoInjectableDecorator), [`ChoMiddleware`](/api/core#symbol-ChoMiddleware), [`ConfigureOptions`](/api/core#symbol-ConfigureOptions), [`Controller`](/api/core#symbol-Controller), [`ControllerMetadata`](/api/core#symbol-ControllerMetadata), [`ControllerOptions`](/api/core#symbol-ControllerOptions), [`Ctr`](/api/core#symbol-Ctr), [`Dependency`](/api/core#symbol-Dependency), [`DependencyGraph`](/api/core#symbol-DependencyGraph), [`DependencyNode`](/api/core#symbol-DependencyNode), [`ExtraOptions`](/api/core#symbol-ExtraOptions), [`HandlersMetadata`](/api/core#symbol-HandlersMetadata), [`Injectable`](/api/core#symbol-Injectable), [`InjectableMetadata`](/api/core#symbol-InjectableMetadata), [`InjectableOptions`](/api/core#symbol-InjectableOptions), [`InjectedArgs`](/api/core#symbol-InjectedArgs), [`InjectionToken`](/api/core#symbol-InjectionToken), [`Injector`](/api/core#symbol-Injector), [`InjectorOptions`](/api/core#symbol-InjectorOptions), [`MetadataGraph`](/api/core#symbol-MetadataGraph), [`MethodMetadata`](/api/core#symbol-MethodMetadata), [`Middlewares`](/api/core#symbol-Middlewares), [`Module`](/api/core#symbol-Module), [`ModuleMetadata`](/api/core#symbol-ModuleMetadata), [`ModuleOptions`](/api/core#symbol-ModuleOptions), [`ModuleScope`](/api/core#symbol-ModuleScope), [`NoExtraOptions`](/api/core#symbol-NoExtraOptions), [`OptionsMetadata`](/api/core#symbol-OptionsMetadata), [`Provider`](/api/core#symbol-Provider), [`ProviderMetadata`](/api/core#symbol-ProviderMetadata), [`Target`](/api/core#symbol-Target), [`Token`](/api/core#symbol-Token), [`WithDependencies`](/api/core#symbol-WithDependencies), [`configure`](/api/core#symbol-configure), [`provider`](/api/core#symbol-provider), [`token`](/api/core#symbol-token)
