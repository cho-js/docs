# Build a runner for decorated methods

A transport adapter consumes routes that CHO already understands. A package that introduces a new kind of entry point also needs to describe and discover the methods itself. This example implements a named job that runs on demand.

## Declare and execute a job

Install `@chojs/core`, save the following file as `main.ts` and run it with your [TypeScript runner](/guide/runtimes). The expected output is `Catalog refreshed`.

<<< @/examples/jobs/main.ts

## Follow the lookup

1. `@Job("refresh")` calls [`decorated_method`](/api/core-di#symbol-decorated_method) to normalize standard and legacy decorator arguments. It writes a package-specific symbol to the method's metadata.
2. `injector.controllers()` yields each controller with its declaring module. The runner reads only methods carrying the job symbol and rejects duplicate public names.
3. Calling the registered function resolves the controller in `node.owner` and invokes the method on the instance, preserving `this`. Listing jobs can therefore stay independent of the resources a job needs.
4. `finally` releases the injector on both success and failure.

## Extend the contract

To support middleware, decide what the downstream call returns. Collect the declaring module, controller and method middleware in that order. Use [`resolve_handle`](/api/core-di#symbol-resolve_handle) for injectable middleware classes and [`compose`](/api/core-utils#symbol-compose) from `@chojs/core/utils` for dispatch. Define whether errors propagate, are translated or are considered settled. Publish these semantics along with your decorator and context types.

Test the extension with standard and legacy decorators, inherited methods, duplicate names and a failed asynchronous job. Core helper APIs are internal. Check the extension against the core version you distribute. [Core entry points](/advanced/core)

## Expose a new job safely

Declare a second job and list the available names before invoking either job. Register two jobs with the same name to check the discovery error. Keep discovery separate from instance resolution so listing jobs does not open connections required only during execution.

## Exercise both decorator conventions

To develop the job decorator independently of the runner, export `Job` from its declaration file. The core test helpers can apply it to an ordinary method in both supported call shapes. Use a fresh method or class for each case so metadata from one case cannot satisfy the other.

```ts
import { read_method_metadata } from "@chojs/core/di";
import { legacy, tc39, tc39_record } from "@chojs/core/utils/test_utils";
import { Job } from "./job.ts";

class OlderJobs { refresh() {} }
legacy(Job("refresh"), OlderJobs, "refresh");
console.log(read_method_metadata(OlderJobs, "refresh"));

class StandardJobs { refresh() {} }
const method = StandardJobs.prototype.refresh;
tc39(Job("refresh"), method, "refresh");
console.log(tc39_record(method, "refresh"));
```

Both records should carry the job's symbol and the name `refresh`. For a CLI extension, capture the public output and the numeric result together. [Decorator fixtures and output helpers](/api/core-utils-test_utils)

```ts
import { capture } from "@chojs/core/utils/test_utils";

const { result, output } = await capture(async () => {
  console.log("Catalog refreshed");
  return 0;
});
console.log(result, output.log); // 0, ["Catalog refreshed"]
```
