# Testing

`run()` takes any command line and resolves to the exit code, without exiting
the process. A test runs the application and asserts on the code.

```ts
const app = ChoCommand.create(App);

assert.equal(await app.run(["rm", "a.txt", "--force"]), 0);
assert.equal(await app.run(["rm", "a.txt"]), 3);
assert.equal(await app.run(["nope"]), 1);

await app.close();
```

## Replacing providers

The `overrides` option replaces providers with fakes, anywhere in the module
graph:

```ts
import { provider } from "@chojs/command";

class FakeDisk {
  removed: string[] = [];
  copy() {}
  remove(path: string) {
    this.removed.push(path);
  }
}

const disk = new FakeDisk();
const app = ChoCommand.create(App, {
  overrides: [provider({ provide: Disk, factory: () => disk })],
});

assert.equal(await app.run(["rm", "a.txt", "--force"]), 0);
assert.deepEqual(disk.removed, ["a.txt"]);
```

An override that replaces nothing is an error, so a stale test fails loudly.

## A full test, on each runtime

::: code-group

```ts [Deno]
import { assertEquals } from "jsr:@std/assert";
import { ChoCommand, provider } from "@chojs/command";
import { App, Disk } from "./app.ts";

Deno.test("rm removes the file with --force", async () => {
  const removed: string[] = [];
  const app = ChoCommand.create(App, {
    overrides: [
      provider({
        provide: Disk,
        factory: () => ({
          copy() {},
          remove(path: string) {
            removed.push(path);
          },
        }),
      }),
    ],
  });

  assertEquals(await app.run(["rm", "a.txt", "--force"]), 0);
  assertEquals(removed, ["a.txt"]);
  await app.close();
});

// deno test
```

```ts [Node.js]
import assert from "node:assert/strict";
import { test } from "node:test";
import { ChoCommand, provider } from "@chojs/command";
import { App, Disk } from "./app.ts";

test("rm removes the file with --force", async () => {
  const removed: string[] = [];
  const app = ChoCommand.create(App, {
    overrides: [
      provider({
        provide: Disk,
        factory: () => ({
          copy() {},
          remove(path: string) {
            removed.push(path);
          },
        }),
      }),
    ],
  });

  assert.equal(await app.run(["rm", "a.txt", "--force"]), 0);
  assert.deepEqual(removed, ["a.txt"]);
  await app.close();
});

// npx tsx --test
```

```ts [Bun]
import { expect, test } from "bun:test";
import { ChoCommand, provider } from "@chojs/command";
import { App, Disk } from "./app.ts";

test("rm removes the file with --force", async () => {
  const removed: string[] = [];
  const app = ChoCommand.create(App, {
    overrides: [
      provider({
        provide: Disk,
        factory: () => ({
          copy() {},
          remove(path: string) {
            removed.push(path);
          },
        }),
      }),
    ],
  });

  expect(await app.run(["rm", "a.txt", "--force"])).toBe(0);
  expect(removed).toEqual(["a.txt"]);
  await app.close();
});

// bun test
```

:::

## Testing the output

Commands print with `console.log`; the help and the errors of `run()` are
printed the same way. To assert on output, inject what prints instead of
calling `console` directly, and override it:

```ts
const OUT = token<(line: string) => void>("OUT");

@Controller({ dependencies: [OUT] })
class Greet {
  constructor(readonly out: (line: string) => void) {}

  @Main({ string: ["name"] })
  main(ctx: ChoCommandContext) {
    this.out(`Hello, ${ctx.args.name ?? "world"}!`);
  }
}

@Module({
  providers: [provider({ provide: OUT, factory: () => console.log })],
  controllers: [Greet],
})
class App {}

// the test
const lines: string[] = [];
const app = ChoCommand.create(App, {
  overrides: [
    provider({
      provide: OUT,
      factory: () => (line: string) => void lines.push(line),
    }),
  ],
});

await app.run(["--name", "you"]);
assert.deepEqual(lines, ["Hello, you!"]);
```

## Tips

- **Export the root module** from a file that does not call `run()`, so tests
  import it without side effects. Keep `Deno.args` / `process.argv` and the
  exit in the entry point.
- **Exit codes are part of the API**; error message texts are not. Assert on
  the code.
- **One application, several runs.** Instances are kept between runs, so a
  test can call `run()` several times on one application, then `close()` it.
