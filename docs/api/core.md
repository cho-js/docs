---
outline: 2
---

# @chojs/core

Start with a class provider, then introduce a token when a consumer needs a configuration value or a replaceable dependency. [Construct and share services](/di/overview) · [Browse all packages](/api/)

## Any {#symbol-Any}

An unchecked type, for values whose type the DI system cannot know, such as
the arguments of an arbitrary constructor or factory.

```ts
export type Any = any;
```

### Usage {#Any-usage}

```ts
function legacy_args(
  ctr: Any,
  name: string,
): [object, string, PropertyDescriptor] {
  return [
    ctr.prototype,
    name,
    Object.getOwnPropertyDescriptor(ctr.prototype, name)!,
  ];
}
```

[Usage in core/di/decorations_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/decorations_test.ts#L554)

## Catch {#symbol-Catch}

Declare the error handler of a class or a method.

It can be combined with the DI decorators, but a class or method has at most
one `@Catch`. The DI system only stores the handler; the application module
that runs the class or method calls it.

```ts
export function Catch(handler: ChoErrorHandler): ChoClassOrMethodDecorator;
```

### Usage {#Catch-usage}

```ts
@Controller()
class Cli {
  @Catch((error) => 2)
  @Action("copy")
  copy() {}
}
```

## ChoClassOrMethodDecorator {#symbol-ChoClassOrMethodDecorator}

A decorator for a class or a method, in both decorator implementations: the
calls of `ChoMethodDecorator`, plus those of a class decorator
(`(target, context?)`).

Use `decorated_target` to find where to write the record from these
arguments.

```ts
export type ChoClassOrMethodDecorator = (target: Target | object, context?: ClassDecoratorContext | ClassMethodDecoratorContext | string | symbol, descriptor?: PropertyDescriptor) => void;
```

### Usage {#ChoClassOrMethodDecorator-usage}

```ts
export function Catch(handler: ChoErrorHandler): ChoClassOrMethodDecorator {
  return (target, context, descriptor) => {
    const meta = decorated_target("@Catch()", target, context, descriptor);
    set_error_handler(meta, handler);
  };
}
```

[Usage in core/di/decorators.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/decorators.ts#L288)

## ChoCoreErrorCode {#symbol-ChoCoreErrorCode}

The codes of the errors of `@chojs/core`. Each is described in `specs.md`,
section 2.8.

```ts
export type ChoCoreErrorCode = "CHO_CORE_ALREADY_DECORATED" | "CHO_CORE_AMBIGUOUS_TOKEN" | "CHO_CORE_CIRCULAR_DEPENDENCY" | "CHO_CORE_CREATE_FAILED" | "CHO_CORE_DISPOSED" | "CHO_CORE_DISPOSE_FAILED" | "CHO_CORE_DUPLICATE_CATCH" | "CHO_CORE_DUPLICATE_OVERRIDE" | "CHO_CORE_DUPLICATE_TOKEN" | "CHO_CORE_INVALID_ERROR_HANDLER" | "CHO_CORE_INVALID_EXPORT" | "CHO_CORE_INVALID_MIDDLEWARE" | "CHO_CORE_INVALID_MIDDLEWARE_RESULT" | "CHO_CORE_INVALID_OPTION" | "CHO_CORE_INVALID_OVERRIDE" | "CHO_CORE_INVALID_PROVIDER" | "CHO_CORE_INVALID_TARGET" | "CHO_CORE_METADATA_FORMAT" | "CHO_CORE_MISPLACED_PROVIDER" | "CHO_CORE_MISSING_MIDDLEWARE_RESULT" | "CHO_CORE_NEXT_CALLED_TWICE" | "CHO_CORE_NOT_A_CLASS" | "CHO_CORE_NOT_A_CONTROLLER" | "CHO_CORE_NOT_A_MODULE" | "CHO_CORE_NOT_INJECTABLE" | "CHO_CORE_NOT_VISIBLE" | "CHO_CORE_UNKNOWN_MODULE" | "CHO_CORE_UNKNOWN_OPTION" | "CHO_CORE_UNKNOWN_OVERRIDE" | "CHO_CORE_UNRESOLVED_DEPENDENCY";
```

### Usage {#ChoCoreErrorCode-usage}

```ts
const CODES: Record<ChoCoreErrorCode, true> = {
  CHO_CORE_ALREADY_DECORATED: true,
  CHO_CORE_AMBIGUOUS_TOKEN: true,
  CHO_CORE_CIRCULAR_DEPENDENCY: true,
  CHO_CORE_CREATE_FAILED: true,
  CHO_CORE_DISPOSED: true,
  CHO_CORE_DISPOSE_FAILED: true,
  CHO_CORE_DUPLICATE_CATCH: true,
  CHO_CORE_DUPLICATE_OVERRIDE: true,
  CHO_CORE_DUPLICATE_TOKEN: true,
  CHO_CORE_INVALID_ERROR_HANDLER: true,
  CHO_CORE_INVALID_EXPORT: true,
  CHO_CORE_INVALID_MIDDLEWARE: true,
  CHO_CORE_INVALID_MIDDLEWARE_RESULT: true,
  CHO_CORE_INVALID_OPTION: true,
  CHO_CORE_INVALID_OVERRIDE: true,
  CHO_CORE_INVALID_PROVIDER: true,
  CHO_CORE_INVALID_TARGET: true,
  CHO_CORE_METADATA_FORMAT: true,
  CHO_CORE_MISPLACED_PROVIDER: true,
  CHO_CORE_MISSING_MIDDLEWARE_RESULT: true,
  CHO_CORE_NEXT_CALLED_TWICE: true,
  CHO_CORE_NOT_A_CLASS: true,
  CHO_CORE_NOT_A_CONTROLLER: true,
  CHO_CORE_NOT_A_MODULE: true,
  CHO_CORE_NOT_INJECTABLE: true,
  CHO_CORE_NOT_VISIBLE: true,
  CHO_CORE_UNKNOWN_MODULE: true,
  CHO_CORE_UNKNOWN_OPTION: true,
  CHO_CORE_UNKNOWN_OVERRIDE: true,
  CHO_CORE_UNRESOLVED_DEPENDENCY: true,
};
```

[Usage in core/errors_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/errors_test.ts#L13)

## ChoError {#symbol-ChoError}

An error of the framework, with a stable code.

```ts
export class ChoError<Code extends string = string> extends Error {
    readonly code: Code;
    constructor(code: Code, message: string, options?: ErrorOptions);
}
```

**`code`** Which mistake it is: stable, and the same on every runtime.

**`constructor`** Make an error of the framework.

### Usage {#ChoError-usage}

```ts
try {
  await ChoWeb.create(App);
} catch (error) {
  if (isChoError(error, "CHO_WEB_DUPLICATE_ROUTE")) {
    // ...
  }
  throw error;
}
```

## ChoErrorHandler {#symbol-ChoErrorHandler}

An error handler, declared with `@Catch`: a function, or a class.

The core only stores it. What it receives and returns, and how a class is
used, is defined by the CHO module that runs it, which declares its own,
precise type (`ChoWebErrorHandler` in `@chojs/web`).

```ts
export type ChoErrorHandler = ((...args: Any[]) => unknown) | Ctr;
```

### Usage {#ChoErrorHandler-usage}

```ts
export function Catch(handler: ChoErrorHandler): ChoClassOrMethodDecorator {
  return (target, context, descriptor) => {
    const meta = decorated_target("@Catch()", target, context, descriptor);
    set_error_handler(meta, handler);
  };
}
```

[Usage in core/di/decorators.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/decorators.ts#L288)

## ChoInjectableDecorator {#symbol-ChoInjectableDecorator}

A class decorator of the DI (`@Injectable`, `@Module`, `@Controller`),
typed by the dependencies it declares: it only accepts a class whose
constructor can be called with the values of those dependencies, in order.
A dependency list that does not match the constructor is a compile error.

```ts
@Injectable([PORT, Logger]) // error: the constructor wants (Logger, number)
class Server {
  constructor(logger: Logger, port: number) {}
}
```

What is checked: each dependency's value type against the parameter at its
position, and that every required parameter has a dependency. A class may
take fewer parameters than the list has dependencies.

The check needs the dependencies as a tuple, which a literal array given to
the decorator is. A list typed `Dependency[]` (built elsewhere, or kept in
a variable) is not checked.

It works with both decorator implementations: TC39 standard decorators,
which pass a `context` object, and legacy (`experimentalDecorators`) and Bun
decorators, which pass the class only, so `context` is `undefined`.

```ts
export type ChoInjectableDecorator<D extends readonly Dependency[] = readonly Dependency[]> = (target: new (...args: InjectedArgs<D>) => unknown, context?: ClassDecoratorContext) => void;
```

### Usage {#ChoInjectableDecorator-usage}

```ts
export function Controller<const D extends readonly Dependency[] = []>(
  options: WebControllerOptions<D> = {},
): ChoInjectableDecorator<NoInfer<D>> {
  assert_known_options("@Controller()", options, ["dependencies", "route"]);
  return CoreController<RouteOption, D>(options);
}
```

[Usage in web/decorators.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/web/decorators.ts#L140)

## ChoMiddleware {#symbol-ChoMiddleware}

A middleware, declared with `@Middlewares`: a function, or a class.

The core only stores middlewares. What a middleware receives and returns,
and how a class is used, is defined by the CHO module that runs it, which
declares its own, precise type (`ChoWebMiddleware` in `@chojs/web`).

```ts
export type ChoMiddleware = ((...args: Any[]) => unknown) | Ctr;
```

### Usage {#ChoMiddleware-usage}

```ts
export function Middlewares(
  ...middlewares: ChoMiddleware[]
): ChoClassOrMethodDecorator {
  return (target, context, descriptor) => {
    const meta = decorated_target(
      "@Middlewares()",
      target,
      context,
      descriptor,
    );
    set_middlewares(meta, middlewares);
  };
}
```

[Usage in core/di/decorators.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/decorators.ts#L250)

## ConfigureOptions {#symbol-ConfigureOptions}

What `configure` adds to a module.

```ts
export type ConfigureOptions = {
    readonly imports?: readonly Ctr[] | undefined;
    readonly providers?: readonly (Provider | Ctr)[] | undefined;
    readonly name?: string | undefined;
};
```

**`imports`** More modules to import: what the providers given need, when the module
does not import it already.

**`providers`** More providers: `@Injectable` classes and provider objects. One whose
token the module already provides replaces the provider of the module.

**`name`** The name of the new module, for logs and errors. Default: the name of
the module it is made from. Give one to an application that configures
one module twice, to tell the two apart.

### Usage {#ConfigureOptions-usage}

```ts
const options: ConfigureOptions = { name: "BranchLabels" };
const BranchLabels = configure(LabelsModule, options);
```

## Controller {#symbol-Controller}

Mark a class as a controller: an entry point of the application that an
application module invokes, such as a CLI command handler.

A controller is declared in the `controllers` of a module, not in its
`providers`. It is injectable: the injector creates it with the values of
`dependencies`, which resolve in the scope of the module that declares it.

CHO modules can accept options of their own (type parameter `E`), and
attach metadata to the controller's methods; the DI system collects both
(`ControllerMetadata.options` and `.methods`) but does not interpret them.

```ts
export function Controller<E extends ExtraOptions = NoExtraOptions, const D extends readonly Dependency[] = [
]>(options?: WithDependencies<Partial<ControllerOptions>, D> & NoInfer<E>): ChoInjectableDecorator<NoInfer<D>>;
```

### Usage {#Controller-usage}

```ts
@Controller({ dependencies: [Logger] })
class Cli {
  constructor(logger: Logger) {}
}

@Module({ providers: [Logger], controllers: [Cli] })
class App {}
```

## ControllerMetadata {#symbol-ControllerMetadata}

A normalized `@Controller` class.

```ts
export type ControllerMetadata = InjectableMetadata & HandlersMetadata & OptionsMetadata & {
    isController: true;
    methods: readonly MethodMetadata[];
};
```

### Usage {#ControllerMetadata-usage}

```ts
is_controller(): this is DependencyNode<ControllerMetadata> {
    return "isController" in this.meta && this.meta.isController === true;
  }
```

[Usage in core/di/dependency-graph.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/dependency-graph.ts#L98)

## ControllerOptions {#symbol-ControllerOptions}

Options of `@Controller`: its `dependencies`.

The type is closed, like `ModuleOptions`: a CHO module that reads
options of its own (the route of a web controller) declares them with the
type parameter of `@Controller`.

```ts
export type ControllerOptions = InjectableOptions;
```

### Usage {#ControllerOptions-usage}

```ts
@Controller({ dependencies: [UserService] })
class UsersController {
  constructor(readonly users: UserService) {}
}
```

## Ctr {#symbol-Ctr}

A concrete class whose instances are of type `T`.

```ts
export type Ctr<T = Any> = new (...args: Any[]) => T;
```

### Usage {#Ctr-usage}

```ts
return command_graph(new Injector(app)).actions.map(([node, method]) => [
    (node.token as Ctr).name,
    method.name,
    command_record(method.meta)[ALIAS],
  ]);
```

[Usage in command/graph_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/command/graph_test.ts#L17)

## Dependency {#symbol-Dependency}

A dependency of a provider: the token whose value the provider receives.

It is a separate name from `Token` because it describes a role, not
a kind of value: every place that lists what a provider needs uses
`Dependency`, every place that names what is provided uses `Token`.

```ts
export type Dependency = Token;
```

### Usage {#Dependency-usage}

```ts
const deps: Dependency[] = [PORT];
```

[Usage in core/di/types_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/types_test.ts#L200)

## DependencyGraph {#symbol-DependencyGraph}

The dependency graph of an application.

```ts
export type DependencyGraph = {
    root: ModuleScope;
    modules: ReadonlyMap<Ctr, ModuleScope>;
};
```

**`root`** The root module.

**`modules`** Every module of the application, by class. Imported modules come before
the modules that import them, and the root comes last.

### Usage {#DependencyGraph-usage}

```ts
export function build_dependency_graph(
  metaGraph: MetadataGraph,
): DependencyGraph {
  const modules = new Map<Ctr, ModuleScope>();
  const root = build_module_scope(metaGraph.root, modules, []);
  return { root, modules };
}
```

[Usage in core/di/dependency-graph.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/dependency-graph.ts#L448)

## DependencyNode {#symbol-DependencyNode}

One declaration of the application: a provider, a controller or a module,
declared in one module.

A node stands for a single instance: the injector creates at most one value
per node. The same class declared in two modules is two nodes, and two
instances.

```ts
export class DependencyNode<M extends ProviderMetadata = ProviderMetadata> {
    readonly token: Token;
    readonly meta: M;
    readonly owner: Ctr;
    readonly deps: readonly DependencyNode[];
    constructor(meta: M, owner: Ctr);
    is_controller(): this is DependencyNode<ControllerMetadata>;
}
```

**`is_controller`** Whether the node was built from a `@Controller` class, so that its `meta`
is a `ControllerMetadata`.

**`token`** The token the node provides.

**`meta`** The normalized declaration: its provider holds the factory.

**`owner`** The module that declares the node. Its dependencies were resolved in this
module's scope.

**`deps`** The nodes that provide the dependencies, in the order the factory
receives them. Set while the graph is built.

**`constructor`** Create an unlinked node. Its `deps` are set when the graph is built.

### Usage {#DependencyNode-usage}

```ts
is_controller(): this is DependencyNode<ControllerMetadata> {
    return "isController" in this.meta && this.meta.isController === true;
  }
```

[Usage in core/di/dependency-graph.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/dependency-graph.ts#L98)

## ExtraOptions {#symbol-ExtraOptions}

The options a CHO module adds to `@Module` or `@Controller`: the type
parameter of both decorators. They are stored as is in the class's record,
and the metadata graph hands them back as `options`.

The default, no extra option, is what makes the option types closed.

```ts
export type ExtraOptions = Record<string, unknown>;
```

### Usage {#ExtraOptions-usage}

A CHO module's own `@Controller`
```ts
type WebOptions = { route?: string };

export function Controller(
  options: Partial<ControllerOptions> & WebOptions = {},
): ChoInjectableDecorator {
  assert_known_options("@Controller()", options, ["dependencies", "route"]);
  return CoreController<WebOptions, readonly Dependency[]>(options);
}
```

## HandlersMetadata {#symbol-HandlersMetadata}

What `@Middlewares` and `@Catch` declared on a module, a controller or a
method. The DI system only stores them; the CHO module that runs the class
or method uses them.

```ts
export type HandlersMetadata = {
    middlewares: readonly ChoMiddleware[];
    errorHandler: ChoErrorHandler | undefined;
};
```

**`middlewares`** The middlewares of `@Middlewares`, in source order; `[]` when none.

**`errorHandler`** The error handler of `@Catch`, or `undefined` when none.

### Usage {#HandlersMetadata-usage}

```ts
function handlers(record: HandlersRecord): HandlersMetadata {
  return {
    middlewares: record[MIDDLEWARES] ?? [],
    errorHandler: record[ERROR_HANDLER],
  };
}
```

[Usage in core/di/metadata-graph.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/metadata-graph.ts#L210)

## Injectable {#symbol-Injectable}

Mark a class as injectable.

An injectable class can be listed in the `providers` of a module. The
injector then creates it by calling its constructor with the values of
`dependencies`, in order.

```ts
export function Injectable<const D extends readonly Dependency[] = [
]>(dependencies?: D): ChoInjectableDecorator<NoInfer<D>>;
```

### Usage {#Injectable-usage}

Without dependencies
```ts
@Injectable()
class Logger {}
```

With dependencies
```ts
const PORT = token<number>("PORT");

@Injectable([Logger, PORT])
class Server {
  constructor(logger: Logger, port: number) {}
}
```

## InjectableMetadata {#symbol-InjectableMetadata}

A normalized injectable class. Its provider constructs the class with the
dependencies it declared.

```ts
export type InjectableMetadata = ProviderMetadata & {
    isInjectable: true;
};
```

### Usage {#InjectableMetadata-usage}

```ts
return {
      isProvider: true,
      isInjectable: true,
      provider: provider({
        provide: p,
        deps: record[DEPENDENCIES],
        factory: class_factory(p),
      }),
    } satisfies InjectableMetadata;
```

[Usage in core/di/metadata-graph.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/metadata-graph.ts#L313)

## InjectableOptions {#symbol-InjectableOptions}

Options shared by every DI decorator.

```ts
export type InjectableOptions = {
    dependencies: readonly Dependency[];
};
```

**`dependencies`** Dependencies passed to the class constructor, in argument order.

### Usage {#InjectableOptions-usage}

```ts
assert.throws(() => set_injectable(Foo, { dependencies: [] }), {
      code: "CHO_CORE_ALREADY_DECORATED",
      message: ALREADY_DECORATED,
    });
```

[Usage in core/di/decorations_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/decorations_test.ts#L159)

## InjectedArgs {#symbol-InjectedArgs}

The constructor arguments a list of dependencies provides, in the same
order: what a class decorated with that list must accept.

It is `ResolvedAll`, except that a symbol, whose value type is
unknown, can be received as any type, and that a list which is not a tuple
(`Dependency[]`) gives `any[]`: it cannot be checked.

```ts
export type InjectedArgs<D extends readonly unknown[]> = number extends D["length"] ? Any[] : {
    -readonly [K in keyof D]: D[K] extends symbol ? Any : Resolved<D[K]>;
};
```

### Usage {#InjectedArgs-usage}

```ts
// [Logger, number]
type Args = InjectedArgs<[typeof Logger, InjectionToken<number>]>;
```

## InjectionToken {#symbol-InjectionToken}

A typed, unique token for a value that is not a class instance, such as a
URL, a configuration object or a function. Create one with `token<T>()`.

Tokens are compared by identity: two tokens created with the same
description are two different tokens.

```ts
export interface InjectionToken<T = Any> {
    readonly description: string;
    readonly [valueType]?: T;
}
```

**`description`** Human-readable description, shown in error messages.

**`valueType`** Type-only carrier of `T`. Never present at runtime.

### Usage {#InjectionToken-usage}

```ts
const API_URL: InjectionToken<string> = token<string>("API_URL");
```

## Injector {#symbol-Injector}

Creates and holds the instances of an application.

Instances belong to the injector: two injectors created for the same root
module share nothing.

Creation is memoized: each node's promise is stored before anything is
awaited, so concurrent and later requests for the same node share one
creation, and one instance. A failed creation is memoized too: every later
request for the node, or for anything that depends on it, gets the same
error. There is no retry: an application that must not run half-created
calls `init()` at startup and stops if it rejects.

Every instance is a singleton of its injector, by design: request data
belongs to the request's context, not to the DI. Every dependency is
required.

```ts
export class Injector {

    readonly meta: MetadataGraph;
    readonly graph: DependencyGraph;
    constructor(root: Ctr, options?: InjectorOptions);
    init(): Promise<void>;
    dispose(): Promise<void>;
    [Symbol.asyncDispose](): Promise<void>;
    resolve<T>(token: Token<T>, module?: Ctr): Promise<T>;
    modules(): IterableIterator<ModuleScope>;
    controllers(): IterableIterator<DependencyNode<ControllerMetadata>>;
}
```

**`init`** Create every module with everything it declares: its providers, its
controllers and the module itself.

A module is initialized only after all the modules it imports are, so
imported modules are always ready first. Modules that do not depend on
each other are initialized in parallel. Within a module, each node is
created after its own dependencies.

This is part of the application lifecycle and should be called before
any `resolve()`. It is not strictly necessary, since `resolve()` creates
what it needs, but it creates everything eagerly, so any error surfaces at
startup. It is safe to call more than once, or while `resolve()` calls are
in flight: nothing is created twice.

**`dispose`** Release everything the injector created.

It waits for the creations in flight, then goes through the created
values in reverse creation order, so a value is always disposed before
what it depends on. A value is disposed by its own
`Symbol.asyncDispose` or, without one, `Symbol.dispose`: the
standard methods of explicit resource management (`using`). Values that
have neither are skipped. A value provided under several tokens is
disposed once.

```ts
@Injectable()
class Db {
  async Symbol.asyncDispose {
    await this.connection.close();
  }
}
```

The injector never disposes on its own: call this when the application
ends (CHO modules do, in their `close()`). Disposal is final: afterwards
`resolve()` and `init()` reject, and an `init()` that was still running
creates nothing more. Calling it again returns the same disposal.

A value that fails to dispose does not stop the others.

**`[Symbol.asyncDispose]`** Dispose the injector at the end of an `await using` block.

**`resolve`** Get the value of a token, creating it, and what it depends on, if needed.

The token is looked up in the scope of a module: what that module declares
and what its imports export. It defaults to the root module.

Every failure, a failed lookup included, is reported as a rejected
promise: the method never throws synchronously.

**`modules`** The modules of the application, each once, in post-order: imported
modules before the modules that import them, the root last.

**`controllers`** The controllers of the application, each once, from the module that
declares it: for each module (see `modules`), the controllers it
declares, in `controllers` order. A controller that a module exports is
visible in the modules that import it too, but belongs to its own.

Application modules use it to find their entry points, and create a
controller with `resolve(node.token, node.owner)`.

**`meta`** The normalized metadata of the application: every module reachable from
the root, read and validated by the constructor.

**`graph`** The dependency graph of the application, built by the constructor.

**`constructor`** Build and validate the dependency graph of an application. Nothing is
created yet.

### Usage {#Injector-usage}

```ts
const injector = new Injector(AppModule);
await injector.init(); // create everything, imports first
const users = await injector.resolve(UserService);
```
```ts
const injector = new Injector(App);
try {
  await injector.init();
  // ... run the application
} finally {
  await injector.dispose();
}
```

With `await using`
```ts
await using injector = new Injector(App);
const users = await injector.resolve(UserService);
// disposed when the block ends
```
```ts
const users = await injector.resolve(UserService);
const url = await injector.resolve(API_URL); // string
const cli = await injector.resolve(Cli, CliModule); // in CliModule's scope
```

## InjectorOptions {#symbol-InjectorOptions}

Options of `Injector`.

```ts
export type InjectorOptions = {
    overrides?: readonly Provider[];
};
```

**`overrides`** Providers that replace the declared providers of the same token, in every
module that declares one. For tests: swap a database, a clock or a remote
service for a fake, deep inside the module graph, without changing any
module.

- An override replaces `providers` entries only (classes and provider
  objects), not controllers or modules.
- Its `deps` are resolved in the scope of the module that declares the
  provider it replaces, like any provider.
- An override that replaces nothing is an error.

### Usage {#InjectorOptions-usage}

```ts
const options: InjectorOptions = {
  overrides: [provider({ provide: BRANCH, factory: () => "test" })],
};
const injector = new Injector(Library, options);
try {
  await injector.init();
} finally {
  await injector.dispose();
}
```

## MetadataGraph {#symbol-MetadataGraph}

The normalized metadata of an application, from its root module.

```ts
export type MetadataGraph = {
    modules: ReadonlyMap<Ctr, ModuleMetadata>;
    root: ModuleMetadata;
};
```

**`modules`** Every module reachable from the root, each read once.

**`root`** The root module.

### Usage {#MetadataGraph-usage}

```ts
assert.throws(
        () => build_dependency_graph({ root: a, modules: new Map() }),
        {
          code: "CHO_CORE_CIRCULAR_DEPENDENCY",
          message: "Circular dependency detected: A → B → A",
        },
      );
```

[Usage in core/di/dependency-graph_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/dependency-graph_test.ts#L532)

## MethodMetadata {#symbol-MethodMetadata}

A method of a controller that carries metadata: what CHO modules' own
decorators wrote on it (such as `@Action`), and its middlewares and error
handler.

```ts
export type MethodMetadata = HandlersMetadata & {
    name: string;
    meta: Readonly<Record<PropertyKey, unknown>>;
};
```

### Usage {#MethodMetadata-usage}

```ts
const actionsByName = new Map<unknown, [ControllerNode, MethodMetadata]>();
```

[Usage in command/graph.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/command/graph.ts#L55)

## Middlewares {#symbol-Middlewares}

Declare middlewares for a class or a method.

Unlike the DI decorators, it can be combined with any of them, and applied
several times: the middlewares are kept in source order, top decorator
first (see `set_middlewares`). The DI system only stores them; the
application module that runs the class or method uses them.

```ts
export function Middlewares(...middlewares: ChoMiddleware[]): ChoClassOrMethodDecorator;
```

### Usage {#Middlewares-usage}

```ts
@Middlewares(auth)
@Controller()
class Cli {
  @Middlewares(timing)
  @Action("copy")
  copy() {}
}
```

## Module {#symbol-Module}

Mark a class as a module.

A module groups providers and controllers, and controls what other modules
can use:

- it can inject what it declares, and what its `imports` export;
- modules that import it can inject only what it `exports`.

A module is injectable itself: the injector creates it with the values of
`dependencies`, which resolve in the module's own scope.

```ts
export function Module<E extends ExtraOptions = NoExtraOptions, const D extends readonly Dependency[] = [
]>(options?: WithDependencies<Partial<ModuleOptions>, D> & NoInfer<E>): ChoInjectableDecorator<NoInfer<D>>;
```

### Usage {#Module-usage}

```ts
const API_URL = token<string>("API_URL");

@Module({
  imports: [DbModule],
  providers: [
    UserService,
    provider({ provide: API_URL, factory: () => Promise.resolve("https://example.com") }),
  ],
  exports: [UserService],
})
class UserModule {}
```

## ModuleMetadata {#symbol-ModuleMetadata}

A normalized `@Module` class, with everything it declares.

```ts
export type ModuleMetadata = InjectableMetadata & HandlersMetadata & OptionsMetadata & {
    isModule: true;
    imports: readonly ModuleMetadata[];
    exports: readonly Token[];
    providers: readonly (InjectableMetadata | ProviderMetadata)[];
    controllers: readonly ControllerMetadata[];
};
```

### Usage {#ModuleMetadata-usage}

```ts
const imports_of_a: ModuleMetadata[] = [];
```

[Usage in core/di/dependency-graph_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/dependency-graph_test.ts#L511)

## ModuleOptions {#symbol-ModuleOptions}

Options of `@Module`. Every field is optional; the lists default to `[]`.

The type is closed: a key that is not listed is a compile error, so a typo
(`provider` for `providers`) cannot pass as an option. A CHO module that
reads options of its own (the route prefix of a web feature) declares them
with the type parameter of `@Module`, and exports a decorator typed with it
(see `ExtraOptions`).

```ts
export type ModuleOptions = InjectableOptions & {
    imports: readonly Ctr[];
    providers: readonly (Provider | Ctr)[];
    controllers: readonly Ctr[];
    exports: readonly Token[];
};
```

### Usage {#ModuleOptions-usage}

```ts
const options: Partial<ModuleOptions> = {
  imports: [DbModule],
  providers: [UserService],
  controllers: [UsersController],
  exports: [UserService],
};

@Module(options)
class UsersModule {}
```

## ModuleScope {#symbol-ModuleScope}

A module of the application, with its scope: everything it can inject.

A module imported through several paths is one scope, shared by all its
importers.

```ts
export class ModuleScope {
    readonly ctr: Ctr;
    readonly meta: ModuleMetadata;
    readonly imports: readonly ModuleScope[];
    readonly visible: ReadonlyMap<Token, DependencyNode>;
    readonly ambiguous: ReadonlyMap<Token, readonly Ctr[]>;
    constructor(meta: ModuleMetadata, imports: readonly ModuleScope[], visible: ReadonlyMap<Token, DependencyNode>, ambiguous: ReadonlyMap<Token, readonly Ctr[]>);
}
```

**`ctr`** The module class.

**`meta`** The module's normalized metadata.

**`imports`** The scopes of the imported modules, in `imports` order.

**`visible`** Every token this module can inject, mapped to the node that provides it:
its own declarations (the module itself included) and the tokens its
imports export. Ambiguous tokens are left out.

Filled while the graph is built; read-only afterwards.

**`ambiguous`** The ambiguous tokens of this module: tokens that two or more imports
export as different instances, and that the module does not declare
itself. Each is mapped to the modules that export it. They are not in
`visible`: injecting, exporting or resolving one throws (see
`ambiguity_error`).

Filled while the graph is built; read-only afterwards.

**`constructor`** Create a module scope with an empty `visible` table. The table is filled
when the graph is built.

### Usage {#ModuleScope-usage}

```ts
*modules(): IterableIterator<ModuleScope> {
    yield* this.graph.modules.values();
  }
```

[Usage in core/di/injector.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/injector.ts#L475)

## NoExtraOptions {#symbol-NoExtraOptions}

No extra option: the default of `@Module` and `@Controller`.

```ts
export type NoExtraOptions = Record<never, never>;
```

### Usage {#NoExtraOptions-usage}

```ts
return CoreController<NoExtraOptions, D>(options);
```

[Usage in command/decorators.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/command/decorators.ts#L249)

## OptionsMetadata {#symbol-OptionsMetadata}

The other keys of a class's record, as they are: the extra options a CHO
module accepts on `@Module` / `@Controller` (string keys, such as `route`)
and what its own class decorators wrote (symbol keys). The DI system
ignores them; each CHO module reads its own.

They are kept apart from the normalized fields, so an option can have any
name (`middlewares`, `provider`, ...) without being mistaken for a field.

```ts
export type OptionsMetadata = {
    options: Readonly<Record<PropertyKey, unknown>>;
};
```

**`options`** The record's keys that are not the core's.

### Usage {#OptionsMetadata-usage}

```ts
export type ControllerMetadata =
  & InjectableMetadata
  & HandlersMetadata
  & OptionsMetadata
  & {
    /** Marks the declaration as a controller. */
    isController: true;
    /**
     * The controller's methods that carry metadata, in declaration order: its
     * own, and those it inherits (parents first). Methods without metadata are
     * left out.
     */
    methods: readonly MethodMetadata[];
  };
```

[Usage in core/di/metadata-graph.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/metadata-graph.ts#L127)

## Provider {#symbol-Provider}

Binds a token to the factory that creates its value and to the dependencies
that factory receives.

A class listed in a module's `providers` is shorthand for a provider: its
token is the class, its dependencies are the ones declared with
`@Injectable`, and its factory constructs the class. Use the `provider()`
helper to write a provider object with its factory arguments typed from
`deps`.

```ts
export type Provider<T = Any> = {
    readonly provide: Token<T>;
    readonly deps: readonly Dependency[];
    readonly factory: Factory<T>;
};
```

**`provide`** The token this provider creates a value for.

**`deps`** The dependencies passed to `factory`, in order.

**`factory`** Creates the value from the resolved dependencies.

### Usage {#Provider-usage}

```ts
function value(provide: Token, v: unknown = provide): Provider {
  return provider({ provide, factory: () => Promise.resolve(v) });
}
```

[Usage in core/di/dependency-graph_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/dependency-graph_test.ts#L22)

## ProviderMetadata {#symbol-ProviderMetadata}

A normalized declaration: anything that provides a value.

Provider objects listed in a module's `providers` are kept as they are.
Classes are normalized into the more specific `InjectableMetadata`,
`ControllerMetadata` and `ModuleMetadata`.

```ts
export type ProviderMetadata = {
    isProvider: true;
    provider: Provider;
};
```

**`isProvider`** Marks the record as a normalized declaration.

**`provider`** How to create the value: token, dependencies and factory.

### Usage {#ProviderMetadata-usage}

```ts
return {
    isProvider: true,
    provider: p,
  } satisfies ProviderMetadata;
```

[Usage in core/di/metadata-graph.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/metadata-graph.ts#L323)

## Target {#symbol-Target}

Any function, classes included. This is what a class decorator receives as
its target.

```ts
export type Target = Function;
```

### Usage {#Target-usage}

```ts
const chain: Target[] = [];
```

[Usage in core/di/metadata.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/metadata.ts#L415)

## Token {#symbol-Token}

The key that identifies something injectable. A token is one of:

| Token                                 | Value type             |
| ------------------------------------- | ---------------------- |
| a class (abstract classes included)   | the instance type      |
| an `InjectionToken``<T>`        | `T`                    |
| a symbol                              | `unknown` (untyped)    |

Strings are deliberately not tokens: two unrelated packages can easily pick
the same string, while classes, injection tokens and symbols are unique by
identity and cannot collide.

```ts
export type Token<T = Any> = Ctr<T> | AbstractCtr<T> | InjectionToken<T> | symbol;
```

### Usage {#Token-usage}

```ts
function value(provide: Token, v: unknown = provide): Provider {
  return provider({ provide, factory: () => Promise.resolve(v) });
}
```

[Usage in core/di/dependency-graph_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/core/di/dependency-graph_test.ts#L22)

## WithDependencies {#symbol-WithDependencies}

Options whose `dependencies` are the tuple `D`, so the decorator can check
them against the constructor of the decorated class.

```ts
export type WithDependencies<O, D extends readonly Dependency[]> = Omit<O, "dependencies"> & {
    dependencies?: D;
};
```

### Usage {#WithDependencies-usage}

```ts
@Module({ providers: [Timing], controllers: [HelloController] })
export class HelloApp {}
```

[Usage in examples/hello-world-cli.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/hello-world-cli.ts#L38)

## configure {#symbol-configure}

Make a module from another one, with more imports and more providers.

The module that is given does not change: `configure` returns a new module,
a class that extends it. It has everything the module has (its providers,
controllers and exports, its dependencies, its options such as a route,
its middlewares and its error handler), and after them what is given.

- **A provider given for a token the module already provides replaces
  it.** A library leaves a placeholder that way: a provider that throws, or
  a default, for who uses the module to fill.
- **The providers given are in the scope of the new module**: their
  dependencies see what the module declares and what it imports, the
  imports given included. They are private to the module unless it exports
  their token.
- **Each call makes one more module, with instances of its own.** The new
  module and the one it is made from are two modules: who imports the
  original does not get the configured one. Keep the result in a constant,
  and import that constant everywhere.

```ts
export function configure<C extends Ctr>(module: C, options?: ConfigureOptions): C;
```

### Usage {#configure-usage}

```ts
// a library: a module with a placeholder for its settings
export const MAIL_OPTIONS = token<MailOptions>("MAIL_OPTIONS");

@Module({
  providers: [
    provider({
      provide: MAIL_OPTIONS,
      factory: (): MailOptions => {
        throw new Error("give MAIL_OPTIONS to MailModule, with configure()");
      },
    }),
    Mailer,
  ],
  exports: [Mailer],
})
export class MailModule {}

// the application: one constant, imported everywhere
export const Mail = configure(MailModule, {
  imports: [ConfigModule],
  providers: [
    provider({
      provide: MAIL_OPTIONS,
      deps: [Config],
      factory: (config) => ({ from: config.mailFrom }),
    }),
  ],
});

@Module({ imports: [Mail] })
class App {}
```

## isChoError {#symbol-isChoError}

Whether a value is a `ChoError`.

It does not use `instanceof`, which is false for an error made by another
copy of the package.

```ts
export function isChoError(value: unknown): value is ChoError;
export function isChoError<Code extends string>(value: unknown, code: Code): value is ChoError<Code>;
```

### Usage {#isChoError-usage}

```ts
console.log(
      JSON.stringify(order),
      "->",
      isReplyError(error)
        ? `error ${error.code}: ${error.description}`
        : isChoError(error)
        ? error.code
        : error,
    );
```

[Usage in examples/nats-reply.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/nats-reply.ts#L114)

## provider {#symbol-provider}

Define a provider object, with the arguments of its factory typed from its
dependencies.

At runtime this only fills in `deps` with `[]` when it is omitted. Its value
is in the types: TypeScript checks that the factory accepts the values of
`deps`, in order, and returns the type of the provided token.

```ts
export function provider<T, const D extends readonly Dependency[] = [
]>(p: {
    provide: Token<T>;
    deps?: D;
    factory: (...deps: ResolvedAll<D>) => NoInfer<T> | Promise<NoInfer<T>>;
}): Provider<T>;
```

### Usage {#provider-usage}

```ts
const API_URL = token<string>("API_URL");

provider({
  provide: API_URL,
  deps: [Config],
  factory: (config) => Promise.resolve(config.apiUrl), // config: Config
});
```

## token {#symbol-token}

Create a typed, unique token for a value that is not a class instance.

The token is a frozen object. It is unique by identity: calling `token()`
twice with the same description creates two different tokens. Its
`toString()` returns `InjectionToken(<description>)`, which is how it appears
in error messages.

```ts
export function token<T>(description: string): InjectionToken<T>;
```

### Usage {#token-usage}

```ts
const API_URL = token<string>("API_URL");

@Module({
  providers: [
    provider({ provide: API_URL, factory: () => Promise.resolve("https://example.com") }),
  ],
})
class AppModule {}
```

## ChoValidator {#symbol-ChoValidator}

`ChoValidator<Output = unknown, Input = unknown>` accepts either `StandardSchemaV1<Input, Output>` or `ChoParseValidator<Output>`. Core, Web and Message export the shared validator types in this section. Use the schema directly with a reader or a contract. [Boundary validation walkthrough](/guide/standard-schema)

```ts
const page: ChoValidator<number, string> = z.string().regex(/^\d+$/).transform(Number);
```

## ChoParseValidator {#symbol-ChoParseValidator}

A parse-based validator supplies `parse(value: unknown): Output | Promise<Output>`. Throw to report invalid data.

```ts
const title: ChoParseValidator<string> = {
  parse(value) {
    if (typeof value !== "string" || !value.trim()) throw new Error("Expected a title");
    return value.trim();
  },
};
```

## ChoInput {#symbol-ChoInput}

`ChoInput<V>` extracts the declared schema input. For parse-only validators it uses the awaited result of `parse`.

```ts
const Quantity = z.string().transform(Number);
type WireQuantity = ChoInput<typeof Quantity>; // string
```

## ChoOutput {#symbol-ChoOutput}

`ChoOutput<V>` extracts the value available after successful validation.

```ts
type QuantityValue = ChoOutput<typeof Quantity>; // number
```

## ChoIssue {#symbol-ChoIssue}

A normalized issue has a string `message` and an optional readonly `path` of string or number keys. The argument's source and key are carried separately by the transport.

```ts
const issue: ChoIssue = { message: "Expected a title", path: ["books", 0, "title"] };
```

## StandardTypedV1 {#symbol-StandardTypedV1}

The common V1 protocol exposes vendor, version and optional input/output type information under `~standard`. Its namespace includes `InferInput` and `InferOutput`.

```ts
function schemaVendor(schema: StandardTypedV1) {
  return schema["~standard"].vendor;
}
```

## StandardSchemaV1 {#symbol-StandardSchemaV1}

Implement `StandardSchemaV1<Input, Output>` to supply a synchronous or asynchronous validation function directly. Return issues for invalid input.

```ts
const Title: StandardSchemaV1<string, string> = {
  "~standard": {
    version: 1, vendor: "catalog",
    validate(value) {
      return typeof value === "string" && value.trim()
        ? { value: value.trim() }
        : { issues: [{ message: "Expected a title" }] };
    },
  },
};
```

## StandardJSONSchemaV1 {#symbol-StandardJSONSchemaV1}

This companion protocol exposes input and output JSON Schema converters. A schema library may support validation without providing these converters.

```ts
function requestSchema(schema: StandardJSONSchemaV1) {
  return schema["~standard"].jsonSchema.input({ target: "draft-2020-12" });
}
```
