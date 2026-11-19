# Test the CLI contract

Call `run` with the same words a shell would supply, assert the exit code and close the application. This exercises action selection and parsing without spawning a process.

## Test the shelf-label application

Copy the following into `cli_test.ts` beside `app.ts` from the [CLI tutorial](/command/quick-start). Run `deno test cli_test.ts`.

```ts
import assert from "node:assert/strict";
import { createApp } from "./app.ts";

Deno.test("label requires a title", async () => {
  const app = createApp();
  try {
    assert.equal(await app.run(["label", "The Odyssey", "-s", "classics"]), 0);
    assert.equal(await app.run(["label"]), 2);
    assert.equal(await app.run(["absent"]), 1);
    assert.equal(await app.run(["label", "--help"]), 0);
  } finally {
    await app.close();
  }
});
```

For Node.js, register the same test with `test` from `node:test` and run with a decorator-capable runner such as `tsx --test`. Bun provides `test` from `bun:test`.

## Verify side effects separately

When printing or persistence is part of the contract, make the destination a provider. Supply an in-memory implementation through `overrides` and inspect what it recorded. This lets tests run without patching a process-wide console. Use a subprocess when the behavior under test is the executable itself, including how it forwards a status to the shell.

A help test can also use a factory that would throw if invoked. Help should succeed while leaving the factory untouched. A real command that depends on it should follow the configured [error policy](/command/errors).

## Exercise shell quoting without a shell

Pass a book title containing a space as one array element. In a second call, deliberately split it across two elements. The resulting positional values show which behavior belongs to shell tokenization and which belongs to the CHO command.
