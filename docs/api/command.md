---
outline: 2
---

# @chojs/command

Create the command graph once. Pass the argument array to run and use the returned number as the exit status. [Launch a CLI or embed a command](/command/application) · [Browse all packages](/api/)

## Action {#symbol-Action}

Mark a method as the command `alias` of a multi-command application.

```ts
export function Action(alias: string, flags?: CommandFlags): ChoMethodDecorator;
```

### Usage {#Action-usage}

```ts
import { type ChoCommandContext, ChoCommand, Controller, Action, Module } from "@chojs/command";

@Controller()
class Files {
  // ./fs copy a.txt b.txt
  @Action("copy")
  copy(ctx: ChoCommandContext) {
    const [from, to] = ctx.args._;
    console.log(`copy ${from} to ${to}`);
  }

  // ./fs remove a.txt --force
  @Action("remove")
  remove(ctx: ChoCommandContext) {
    return ctx.args.force ? 0 : 1; // the exit code
  }
}

@Module({ controllers: [Files] })
class App {}

const app = ChoCommand.create(App, { name: "fs" });
Deno.exit(await app.run(Deno.args));
```

## Catch {#symbol-Catch}

Declare the error handler of a module that declares controllers, a
controller, or a command method.

An error thrown by a command, by a middleware, or while creating what the
command needs, goes to the nearest one: the method's, else the
controller's, else the module's, else the application's (`onError`). A
non-negative integer it returns is the exit code; anything else gives `1`.
A class or method has at most one `@Catch`.

```ts
export function Catch(handler: ChoCommandErrorHandler): ChoClassOrMethodDecorator;
```

### Usage {#Catch-usage}

```ts
@Catch((error, ctx) => {
  console.error(`${ctx.command} failed: ${error}`);
  return 2;
})
@Controller()
class Files {}
```

## ChoArgs {#symbol-ChoArgs}

The parsed command line, exactly as `parseArgs` from `@std/cli` returns it
(minimist API): the `args` of the context a command receives
(`ChoCommandContext`).

Positionals in `_` are always strings, as typed (`"007"` stays `"007"`).
The value of a flag that is not declared is typed from its look: `--n=42`
gives the number `42`; declare the flag as a `string` to keep it as typed.
In multi-command mode, `_` does not include the command name. The reserved
`--help` and `--version` flags are not included either.

```ts
export type ChoArgs = Args;
```

### Usage {#ChoArgs-usage}

```ts
@Controller()
class Files {
  // ./fs copy a.txt b.txt --force --mode=644
  @Action("copy")
  copy(ctx: ChoCommandContext) {
    ctx.args._;     // ["a.txt", "b.txt"]
    ctx.args.force; // true
    ctx.args.mode;  // 644 (a number: `mode` is not declared)
  }
}
```

## ChoCommand {#symbol-ChoCommand}

A command-line application, built from a root module.

The mode depends on the command methods of the whole module graph:

- **single command**: exactly one `@Main` method, run for every command line
  (`./app [options] [args]`);
- **multiple actions**: one or more `@Action` methods, the first positional
  argument names the one to run (`./app <command> [options] [args]`).

```ts
export class ChoCommand {

    static create(app: Ctr, options?: Partial<ChoCommandOptions>): ChoCommand;
    constructor(injector: Injector, graph: CommandGraph, options: Partial<ChoCommandOptions>, parser: ChoArgsParser);
    run(argv: string[]): Promise<number>;
    close(): Promise<void>;
    [Symbol.asyncDispose](): Promise<void>;
}
```

**`create`** Create the application of a root module.

Creates the injector and the command graph, and picks the parser of the
mode. No instance is created: controllers are created by `run`.

**`run`** Run one command line.

- `--help`: prints the help (for the command, if one is named) and
  resolves to `0`;
- `--version`: prints `<name> version <version>` (`<name> (no version)`
  when the application sets none) and resolves to `0`;
- no command in multi-command mode: prints the global help and resolves to
  `0`;
- an unknown command in multi-command mode: prints an error and resolves
  to `1`;
- otherwise: runs the command through its middlewares, with the context
  of the run (`ChoCommandContext`). A non-negative integer the command (or a
  middleware) returns is the exit code; anything else gives `0`.

An error while creating the controller or a middleware class, in a
middleware, or in the command, goes to the nearest error handler (the
method's, the controller's, the module's `@Catch`, then `onError`): a
non-negative integer it returns is the exit code, anything else gives
`1`. Without a handler, the error is printed and the exit code is `1`;
when the handler fails too, `2`.

It never exits the process: pass the result to `Deno.exit` or
`process.exit`.

**`close`** Release the instances the application created: every provider,
controller and module that has a `Symbol.asyncDispose` or
`Symbol.dispose` method is disposed, in reverse creation order (see
`Injector.dispose`).

`run()` does not do it: instances are kept between runs. Call it once,
after the last `run()` and before exiting the process. Afterwards `run()`
fails with exit code `1`. Calling it again does nothing more.

**`[Symbol.asyncDispose]`** Close the application at the end of an `await using` block.

**`constructor`** Use `ChoCommand.create`, which builds the arguments from a module.

### Usage {#ChoCommand-usage}

```ts
const app = ChoCommand.create(AppModule, { name: "fs", version: "1.0.0" });
Deno.exit(await app.run(Deno.args));
```
```ts
const app = ChoCommand.create(AppModule, { name: "fs", version: "1.0.0" });
```
Deno
```ts
Deno.exit(await app.run(Deno.args));
```

Node.js and Bun
```ts
process.exit(await app.run(process.argv.slice(2)));
```
```ts
const app = ChoCommand.create(AppModule);
const code = await app.run(Deno.args);
await app.close();
Deno.exit(code);
```

On a host and TypeScript toolchain with explicit resource management, scope the application to the block that owns it. Leaving the block awaits its async disposer. [Application lifecycle](/command/application)

```ts
{
  await using cli = ChoCommand.create(Library);
  console.log(await cli.run(["--help"]));
}
```

## ChoCommandContext {#symbol-ChoCommandContext}

The context of one run: one command line, and the command it runs.

```ts
export interface ChoCommandContext {
    readonly args: ChoArgs;
    readonly argv: readonly string[];
    readonly command: string;
    readonly state: Map<PropertyKey, unknown>;
}
```

**`args`** The parsed command line: the positionals in `_`, and the flags. In
multi-command mode, `_` does not include the command name. The reserved
`--help` and `--version` flags are never in it.

**`argv`** The command line, as it was given to `run()`.

**`command`** The command that runs: `"main"`, or the name of the action.

**`state`** Values shared during the run: a middleware sets one (an opened
configuration, say) for the middlewares and the command after it.

### Usage {#ChoCommandContext-usage}

```ts
@Controller()
class Files {
  // ./fs copy a.txt b.txt --force
  @Action("copy", { boolean: ["force"] })
  copy(ctx: ChoCommandContext) {
    ctx.args._;     // ["a.txt", "b.txt"]
    ctx.args.force; // true
    ctx.command;    // "copy"
  }
}
```

## ChoCommandErrorCode {#symbol-ChoCommandErrorCode}

The codes of the errors of `@chojs/command`. Each is described in `specs.md`, section 7.

A mistake the core finds for the package has a code of the core
(`ChoCoreErrorCode` of `@chojs/core`): an unknown option is
`CHO_CORE_UNKNOWN_OPTION`.

```ts
export type ChoCommandErrorCode = "CHO_COMMAND_AMBIGUOUS_CLASS" | "CHO_COMMAND_DUPLICATE_ACTION" | "CHO_COMMAND_DUPLICATE_DECORATOR" | "CHO_COMMAND_DUPLICATE_MAIN" | "CHO_COMMAND_INVALID_ARGUMENT" | "CHO_COMMAND_INVALID_FLAGS" | "CHO_COMMAND_INVALID_METHOD" | "CHO_COMMAND_INVALID_TARGET" | "CHO_COMMAND_MIXED_COMMANDS" | "CHO_COMMAND_NOT_VISIBLE" | "CHO_COMMAND_NO_COMMANDS" | "CHO_COMMAND_RESERVED_FLAG";
```

### Usage {#ChoCommandErrorCode-usage}

```ts
const CODES: Record<ChoCommandErrorCode, true> = {
  CHO_COMMAND_AMBIGUOUS_CLASS: true,
  CHO_COMMAND_DUPLICATE_ACTION: true,
  CHO_COMMAND_DUPLICATE_DECORATOR: true,
  CHO_COMMAND_DUPLICATE_MAIN: true,
  CHO_COMMAND_INVALID_ARGUMENT: true,
  CHO_COMMAND_INVALID_FLAGS: true,
  CHO_COMMAND_INVALID_METHOD: true,
  CHO_COMMAND_INVALID_TARGET: true,
  CHO_COMMAND_MIXED_COMMANDS: true,
  CHO_COMMAND_NOT_VISIBLE: true,
  CHO_COMMAND_NO_COMMANDS: true,
  CHO_COMMAND_RESERVED_FLAG: true,
};
```

[Usage in command/errors_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/command/errors_test.ts#L8)

## ChoCommandErrorHandler {#symbol-ChoCommandErrorHandler}

An error handler, as given to `@Catch` or to the `onError` option: a
function, or a class with a `handle(error, ctx)` method, created by the
injector.

```ts
export type ChoCommandErrorHandler = ChoCommandErrorHandlerFn | Ctr<{
    handle: ChoCommandErrorHandlerFn;
}>;
```

### Usage {#ChoCommandErrorHandler-usage}

```ts
export function Catch(
  handler: ChoCommandErrorHandler,
): ChoClassOrMethodDecorator {
  return (target, context, descriptor) => {
    const meta = decorated_target("@Catch()", target, context, descriptor);
    set_error_handler(meta, handler);
  };
}
```

[Usage in command/decorators.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/command/decorators.ts#L470)

## ChoCommandErrorHandlerFn {#symbol-ChoCommandErrorHandlerFn}

An error handler function. What it returns gives the exit code: a
non-negative integer is the exit code, anything else is `1`.

```ts
export type ChoCommandErrorHandlerFn = (error: unknown, ctx: ChoCommandContext) => unknown;
```

### Usage {#ChoCommandErrorHandlerFn-usage}

```ts
const on_error: ChoCommandErrorHandlerFn = (error, ctx) => {
  console.error(`${ctx.command} failed: ${error}`);
  return 2;
};
```

## ChoCommandHandler {#symbol-ChoCommandHandler}

A command: a controller method marked with `@Main` or `@Action`.

What it returns (or resolves to) gives the exit code: a non-negative
integer is the exit code, anything else is `0`.

```ts
export type ChoCommandHandler = (ctx: ChoCommandContext) => unknown;
```

### Usage {#ChoCommandHandler-usage}

```ts
const showTitle: ChoCommandHandler = (ctx) => {
  console.log(ctx.args._[0]);
};
```

## ChoCommandMiddleware {#symbol-ChoCommandMiddleware}

A middleware, as given to `@Middlewares`: a function, or a class with a
`handle(ctx, next)` method, created by the injector in the scope of the
module that declares the controller.

```ts
export type ChoCommandMiddleware = ChoCommandMiddlewareFn | Ctr<{
    handle: ChoCommandMiddlewareFn;
}>;
```

### Usage {#ChoCommandMiddleware-usage}

```ts
const trace: ChoCommandMiddleware = async (ctx, next) => {
  console.log(ctx.command);
  return await next();
};
```

## ChoCommandMiddlewareFn {#symbol-ChoCommandMiddlewareFn}

A middleware function. It wraps the rest of the chain (the next
middlewares, then the command):

- `next()` runs the rest of the chain and resolves to its exit code;
- returning an exit code (a non-negative integer) ends the run with it,
  whether `next()` was called (to replace the exit code) or not (to stop
  before the command);
- returning nothing after calling `next()` passes the exit code on.

```ts
export type ChoCommandMiddlewareFn = (ctx: ChoCommandContext, next: ChoCommandNext) => number | void | Promise<number | void>;
```

### Usage {#ChoCommandMiddlewareFn-usage}

```ts
const timing: ChoCommandMiddlewareFn = async (ctx, next) => {
  const start = performance.now();
  await next();
  console.error(`${ctx.command}: ${Math.round(performance.now() - start)}ms`);
};

const confirm: ChoCommandMiddlewareFn = (ctx, next) =>
  ctx.args.yes ? next() : 1; // stops, with exit code 1
```

## ChoCommandNext {#symbol-ChoCommandNext}

Runs the rest of the chain, and resolves to its exit code.

```ts
export type ChoCommandNext = () => Promise<number>;
```

### Usage {#ChoCommandNext-usage}

```ts
async handle(ctx: ChoCommandContext, next: ChoCommandNext) {
    const start = performance.now();
    const code = await next();
    const ms = Math.round(performance.now() - start);
    console.error(`${ctx.command} took ${ms}ms and exited ${code}`);
    return code;
  }
```

[Usage in examples/hello-world-cli.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/examples/hello-world-cli.ts#L17)

## ChoCommandOptions {#symbol-ChoCommandOptions}

Options of `ChoCommand.create`. Every option is optional.

```ts
export type ChoCommandOptions = {
    version: string;
    name: string;
    parseOptions: ParserOptions;
    overrides: readonly Provider[];
    onError: ChoCommandErrorHandler;
};
```

**`version`** The application version, printed by `--version`. There is no default:
an application that sets none has no version to report, and `--version`
prints `<name> (no version)`.

**`name`** The application name, printed by `--version` and in the help usage lines.
Default: `"chojs"`.

**`parseOptions`** `parseArgs` options that declare the handlers' flags, for example
`{ boolean: ["force"] }`. `--help` and `--version` stay negatable
booleans whatever they declare. Default: none.

**`overrides`** Providers that replace the declared providers of the same token, for
tests (see `InjectorOptions.overrides` of `@chojs/core`). Default: none.

**`onError`** The error handler of the application: it handles the errors of every
command that no `@Catch` handler covers (the method's, the controller's
and the module's come first). Like `@Catch`, it takes a function
`(error, ctx)`, or a class with a `handle(error, ctx)` method, created by
the injector in the scope of the root module; a non-negative integer it
returns is the exit code, anything else gives `1`. Default: none, such
errors are printed and the exit code is `1`.

It handles the errors of commands only: an unknown command is reported
by the application.

### Usage {#ChoCommandOptions-usage}

```ts
const app = ChoCommand.create(App, {
  name: "fs",
  version: "2.1.0", // ./fs --version -> fs version 2.1.0
  parseOptions: { boolean: ["force"], alias: { f: "force" } },
});
```

## CommandFlags {#symbol-CommandFlags}

The flags of one command, declared with `@Main(flags)` or
`@Action(name, flags)`. They are used when that command runs, on top of the
application's `parseOptions`, and listed in the command's `--help`.

```ts
export type CommandFlags = {
    boolean?: readonly string[];
    string?: readonly string[];
    collect?: readonly string[];
    negatable?: readonly string[];
    alias?: Readonly<Record<string, string | readonly string[]>>;
    default?: Readonly<Record<string, unknown>>;
    describe?: Readonly<Record<string, string>>;
};
```

**`boolean`** Flags without a value: `--force`. They never take the next word.

**`string`** Flags whose value is kept as typed: `--mode 0755` gives `"0755"`.

**`collect`** Flags that can repeat; their values are collected in an array.

**`negatable`** Boolean flags that can be turned off with `--no-<name>`.

**`alias`** Other names of a flag, by flag name: `{ force: "f" }` or `{ f: "force" }`.

**`default`** The value of a flag that is not given.

**`describe`** What each flag does, by flag name, for `--help`.

### Usage {#CommandFlags-usage}

```ts
@Action("copy", {
  boolean: ["force"],
  string: ["mode"],
  collect: ["exclude"],
  alias: { f: "force" },
  default: { mode: "644" },
  describe: { force: "Overwrite existing files", mode: "File mode" },
})
copy(ctx: ChoCommandContext) {
  // ./fs copy a b -f --mode 0755 --exclude x --exclude y
  ctx.args.force;   // true
  ctx.args.mode;    // "0755": a declared string is kept as typed
  ctx.args.exclude; // ["x", "y"]
}
```

## Controller {#symbol-Controller}

Mark a class as a controller (see `@Controller` of `@chojs/core`): its
methods marked with `@Main` or `@Action` are the commands of the
application.

```ts
export function Controller<const D extends readonly Dependency[] = [
]>(options?: WithDependencies<Partial<ControllerOptions>, D>): ChoInjectableDecorator<NoInfer<D>>;
```

### Usage {#Controller-usage}

```ts
@Controller({ dependencies: [Disk] })
class Files {
  constructor(readonly disk: Disk) {}
}
```

## Help {#symbol-Help}

Help text for a controller class or for a command method, printed by
`--help`.

On a controller, the text describes the group of commands; on a method, it
describes the command.

```ts
export function Help(help: string): ChoClassOrMethodDecorator;
```

### Usage {#Help-usage}

```ts
import { Action, Controller, Help } from "@chojs/command";

@Help("File operations")
@Controller()
class Files {
  @Help("Copy a file: fs copy <from> <to>")
  @Action("copy")
  copy() {}
}

// ./fs --help       -> every command, with its help
// ./fs copy --help  -> the help of `copy`
```

## Main {#symbol-Main}

Mark a method as the single command of the application.

The application then runs this method for every command line
(`./app [options] [args]`). The whole module graph can have only one `@Main`
method, and cannot mix it with `@Action` methods.

```ts
export function Main(flags?: CommandFlags): ChoMethodDecorator;
```

### Usage {#Main-usage}

```ts
import { type ChoCommandContext, ChoCommand, Controller, Main, Module } from "@chojs/command";

@Controller()
class Greet {
  @Main()
  main(ctx: ChoCommandContext) {
    console.log(`Hello, ${ctx.args._[0] ?? "world"}!`);
  }
}

@Module({ controllers: [Greet] })
class App {}

// ./greet Alice -> Hello, Alice!
const app = ChoCommand.create(App, { name: "greet" });
Deno.exit(await app.run(Deno.args));
```

## Middlewares {#symbol-Middlewares}

Declare middlewares for a module that declares controllers, a controller,
or a command method.

A run executes the module's middlewares, then the controller's, then the
method's, around the command. The decorator can be applied several times:
the middlewares are kept in source order, top decorator first.

Middlewares only run for a command: `--help`, `--version` and an unknown
command run none.

```ts
export function Middlewares(...middlewares: ChoCommandMiddleware[]): ChoClassOrMethodDecorator;
```

### Usage {#Middlewares-usage}

```ts
const timing: ChoCommandMiddlewareFn = async (ctx, next) => {
  const start = performance.now();
  await next();
  console.error(`${ctx.command}: ${Math.round(performance.now() - start)}ms`);
};

@Middlewares(timing)
@Controller()
class Files {
  @Action("copy")
  copy(ctx: ChoCommandContext) {}
}
```

## Module {#symbol-Module}

Mark a class as a module (see `@Module` of `@chojs/core`).

```ts
export function Module<const D extends readonly Dependency[] = [
]>(options?: WithDependencies<Partial<ModuleOptions>, D>): ChoInjectableDecorator<NoInfer<D>>;
```

### Usage {#Module-usage}

```ts
@Module({ providers: [Disk], controllers: [Files] })
class App {}
```

## ParserOptions {#symbol-ParserOptions}

Options of `parseArgs` from `@std/cli`, to declare the handlers' flags (for
example `boolean: ["force"]`, so `--force copy` does not take `copy` as its
value).

The reserved flags (`--help`, `--version`) always stay negatable booleans:
they are added to `boolean` and `negatable`, and removed from `string`,
`collect` and `default`.

```ts
export type ParserOptions = ParseOptions;
```

### Usage {#ParserOptions-usage}

```ts
const options: ParserOptions = {
  boolean: ["force"],
  string: ["out"],
  alias: { f: "force", o: "out" },
};
const app = ChoCommand.create(App, { parseOptions: options });
```

## Also exported here

These declarations share their implementation with another entry point. Each link opens the full declaration.

[`ChoCoreErrorCode`](/api/core#symbol-ChoCoreErrorCode), [`ChoError`](/api/core#symbol-ChoError), [`ConfigureOptions`](/api/core#symbol-ConfigureOptions), [`ControllerOptions`](/api/core#symbol-ControllerOptions), [`Injectable`](/api/core#symbol-Injectable), [`InjectableOptions`](/api/core#symbol-InjectableOptions), [`InjectionToken`](/api/core#symbol-InjectionToken), [`ModuleOptions`](/api/core#symbol-ModuleOptions), [`Provider`](/api/core#symbol-Provider), [`WithDependencies`](/api/core#symbol-WithDependencies), [`configure`](/api/core#symbol-configure), [`isChoError`](/api/core#symbol-isChoError), [`provider`](/api/core#symbol-provider), [`token`](/api/core#symbol-token)
