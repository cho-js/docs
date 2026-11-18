# Build a runner for decorated methods

A transport adapter consumes routes that CHO already understands. A package that introduces a new kind of entry point also needs to describe and discover the methods itself. This example implements a named job that runs on demand.

## Declare and execute a job

Install `@chojs/core`, save the following file as `main.ts` and run it with your [TypeScript runner](/guide/runtimes). The expected output is `Catalog refreshed`.

<<< @/examples/jobs/main.ts

## Follow the lookup

1. `@Job("refresh")` calls `decorated_method` to normalize standard and legacy decorator arguments. It writes a package-specific symbol to the method's metadata.
2. `injector.controllers()` yields each controller with its declaring module. The runner reads only methods carrying the job symbol and rejects duplicate public names.
3. Calling the registered function resolves the controller in `node.owner` and invokes the method on the instance, preserving `this`. Listing jobs can therefore stay independent of the resources a job needs.
4. `finally` releases the injector on both success and failure.

## Extend the contract

To support middleware, decide what the downstream call returns. Collect the declaring module, controller and method middleware in that order. Use `resolve_handle` for injectable middleware classes and `compose` from `@chojs/core/utils` for dispatch. Define whether errors propagate, are translated or are considered settled. Publish these semantics along with your decorator and context types.

Test the extension with standard and legacy decorators, inherited methods, duplicate names and a failed asynchronous job. Core helper APIs are internal. Check the extension against the core version you distribute. [Core entry points](/advanced/core)
