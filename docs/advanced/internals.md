# Internals

How CHO works underneath. Nothing here is needed to use it; the source code
is the reference.

## Metadata

Decorators only declare: each writes one record on the class, or on the
method, and creates nothing.

- **Where.** The record is stored on the class's own `Symbol.metadata` object,
  the TC39 decorator metadata (`Symbol.for("Symbol.metadata")` where the
  runtime has none), under the key `Symbol.for("chojs.meta")`. With TC39
  decorators it is written to `context.metadata`; with legacy or Bun
  decorators, to the class itself.
- **Class records are own-only.** A subclass never sees its parent's record,
  and can be decorated on its own.
- **Method records are stored with the class**, by method name, not on the
  method function. Reading a class's methods walks its prototype chain,
  parents first, so inherited methods keep their records; a subclass's record
  is merged over its parent's: arrays are concatenated, other values replaced.
- **Records are versioned.** Every copy of the package in an application
  shares the records, so each is stamped with the format it was written in.
  Reading a record of another format throws, and says that two incompatible
  versions of `@chojs/core` are loaded.
- **Records are frozen** and replaced on every write, never mutated.
- **Keys.** Everything the framework writes is stored under symbol keys,
  `Symbol.for("chojs.<package>.<key>")`, private to the package that writes
  them. User options are stored next to them under their own string keys, so
  the two can never collide.

## The two graphs

Creating the injector builds two graphs, synchronously.

**1. The metadata graph.** Starting from the root, it reads every module's
record, following imports, and checks that each class has the right
decorator. Every declaration becomes a provider: a provider object as is, a
class as a provider whose factory constructs it. Controller method metadata
is collected here. Overrides are applied at this step.

**2. The dependency graph.** One scope per module, with a table of every
token the module can inject and a table of the ambiguous ones, and one node
per declaration, holding its token, its owner module and the nodes of its
dependencies, in argument order. Modules are linked imported-first.

After this step, every dependency is linked to the node that provides it.
**Creating an instance needs no lookup**: this is what "no reflection at
runtime" means in practice.

## Creating instances

- Each node's creation is a promise, stored per injector **before** anything
  is awaited. This is what makes concurrent requests share one instance, and
  what makes a failure permanent.
- A node first awaits its dependencies, in parallel, then calls its factory
  with their values.
- `init()` initializes a module after its imports (sibling imports in
  parallel), then creates the nodes the module owns, in parallel.
- A failing factory is wrapped once, where it fails; dependents pass that
  error on unchanged.
- Each created value is recorded when its factory returns, so the record is
  in dependency order; disposal walks it backwards.

## `@chojs/web`

- **Records.** `@Get` and its siblings write `{ method, route }` on the
  method under a private symbol key. The `route` option of `@Module` /
  `@Controller` is a plain extra option of the core. `@Middlewares` and
  `@Catch` write the core's records.
- **Building the graph.** For each module of the injector with a controller
  that has handlers, the routes are read and checked, the controllers are
  resolved in that module's scope, and middleware and error handler classes
  are created there.
- **Compiling the routes.** Each handler of the graph becomes one `Route`.
  Its `handle` creates the context, runs the feature's, controller's and
  handler's middlewares around the handler with the core's `compose`,
  converts the result, and gives an error to the nearest error handler.
  Duplicate routes are rejected here.
- **The adapters** receive those routes and only match requests:
  - the Hono adapter registers each route on one Hono application, and calls
    `route.handle` with the raw `Request`, Hono's decoded parameters and
    Hono's context;
  - the plain adapter makes one `URLPattern` for each route, and calls the
    first route whose method and pattern match;
  - the Fastify adapter registers the routes as one Fastify plugin, in which
    Fastify parses no body. It builds a standard `Request` from Fastify's,
    and lets Fastify send the `Response`.

## `@chojs/command`

- **Finding commands.** `ChoCommand.create` creates an injector for the root
  module and walks its controllers: imported modules first, the root last;
  controllers and methods in declaration order. That order is the order of
  the actions in the help.
- **Running.** Each command has a pipeline, built from the core's metadata:
  the middlewares and the error handler of the module that declares the
  controller, of the controller and of the method. `run()` parses the command
  line, answers the built-ins, creates the context and calls the pipeline of
  the command.
- **Laziness.** On its first run, a pipeline resolves the controller and its
  middleware classes with the injector, and composes them around the command
  method. An error handler class is resolved when it first has an error to
  handle. Everything is created once per application, and only for the
  commands that run.
- **Parsing.** The parser is a vendored copy of `parseArgs` from
  `@std/cli`, so the package has no dependency besides `@chojs/core`.

## `@chojs/message`

- **Records.** `@Subscribe` writes `{ topic }` on the method under a private
  symbol key. The `topic` option of `@Module` / `@Controller` is a plain extra
  option of the core.
- **Building the graph**, as `@chojs/web` does, for the controllers that have
  `@Subscribe` handlers. Every topic is checked before anything is created.
- **Compiling the routes.** Each handler becomes one `Route`. Its `handle`
  creates the context and runs the middlewares around the handler with the
  core's `compose`, without a result. An error goes to the nearest error
  handler, and only one that returns `true` makes `handle` resolve.
- **Messages in hand.** `ChoMessage` wraps each route to remember the messages
  that are being handled. `close()` stops the linker, waits for them, and
  refuses the ones that come after.
- **A given injector.** `ChoMessage.from` skips the first step: it builds the
  same graph on an injector it does not own, and so never disposes it. It is
  what lets one module graph hold web and message controllers: each package
  reads its own records, and ignores a controller that has none.

## Specifications

Each package has a specification next to its source, which these pages are
based on:

- [`core/specs.md`](https://github.com/cho-js/cho/blob/main/core/specs.md)
- [`web/specs.md`](https://github.com/cho-js/cho/blob/main/web/specs.md)
- [`command/specs.md`](https://github.com/cho-js/cho/blob/main/command/specs.md)
- [`message/specs.md`](https://github.com/cho-js/cho/blob/main/message/specs.md)
