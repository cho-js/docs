# Build a catalog audit command

A catalog import should stop if two records use the same identifier. Write a Deno CLI that checks a file and reports a status suitable for a shell script. Then test duplicate detection without reading the filesystem.

## 1. Inject the input operation

In a directory with `@chojs/command` installed, save the following as `app.ts`. The file contains one identifier per nonempty line. `READ_CATALOG` supplies the reading operation, so the command can concentrate on checking the data.

<<< @/examples/audit/app.ts

## 2. Expose the status to the shell

Copy the **Deno** version of `cli.ts` from the [shelf-label tutorial](/command/quick-start). Both examples export a `createApp` function. Run the following in a POSIX shell:

```sh
printf 'A17\nB21\n' > catalog.txt
deno run --allow-read=catalog.txt cli.ts
printf 'A17\n' >> catalog.txt
deno run --allow-read=catalog.txt cli.ts
echo $?
```

The first invocation prints `Checked 2 identifiers`. The second reports `Duplicate identifier: A17` and exits with status `1`. `@Main` receives the invocation directly, so there is no `audit` action word.

## 3. Replace disk access in a test

Save as `audit_test.ts`. Run `deno test audit_test.ts`. The override supplies the file's contents in memory and the test needs no read permission for a catalog file.

```ts
import assert from "node:assert/strict";
import { ChoCommand, provider } from "@chojs/command";
import { AuditModule, READ_CATALOG } from "./app.ts";

Deno.test("a duplicate identifier fails the audit", async () => {
  const app = ChoCommand.create(AuditModule, {
    overrides: [provider({
      provide: READ_CATALOG,
      factory: () => async () => ["A17", "B21", "A17"],
    })],
  });
  try {
    assert.equal(await app.run([]), 1);
  } finally {
    await app.close();
  }
});
```

To reuse the command on Node or Bun, provide a reader for that runtime under the same token and use its process entry point. Neither duplicate detection nor the test depends on the filesystem API.
