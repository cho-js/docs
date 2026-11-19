# Build a shelf-label CLI

The command `library label "The Odyssey" --shelf classics` will print a label. It will also tell a shell script when the title is missing. Start with [project setup](/guide/getting-started) and install `@chojs/command`.

## 1. Declare the command

Save as `app.ts`. The action name selects the method, `args._` contains the positional title, and `args.shelf` contains the named option. CHO also uses the flag declaration to generate help.

<<< @/examples/command/app.ts

## 2. Connect the process

Create `cli.ts` alongside `app.ts`. Only this entry point needs to know where the runtime keeps its arguments or how it reports an exit code.

::: code-group

```ts [Deno]
import { createApp } from "./app.ts";

const app = createApp();
let code: number;
try {
  code = await app.run(Deno.args);
} finally {
  await app.close();
}
Deno.exit(code);
```

```ts [Node.js and Bun]
import { createApp } from "./app.ts";

const app = createApp();
try {
  process.exitCode = await app.run(process.argv.slice(2));
} finally {
  await app.close();
}
```

:::

## 3. Try success, help and failure

::: code-group

```sh [Deno]
deno run cli.ts label "The Odyssey" -s classics
deno run cli.ts label --help
deno run cli.ts label
```

```sh [Node.js]
npx tsx cli.ts label "The Odyssey" -s classics
npx tsx cli.ts label --help
npx tsx cli.ts label
```

```sh [Bun]
bun run cli.ts label "The Odyssey" -s classics
bun run cli.ts label --help
bun run cli.ts label
```

:::

The first invocation prints `[classics] The Odyssey`. The second lists the shelf option, its alias and its default. The last prints `Supply a book title.` to stderr. In a POSIX shell, run `echo $?` immediately afterwards to see status `2`.

Use [`@Main`](/command/commands) for a tool with one implicit command. For a complete single-command project with an injected file reader, [build a catalog audit](/command/file-audit). For additional named actions, see [flag parsing](/command/flags) and [help output](/command/help).

## Use the command from another program

Pass `["label", "The Odyssey", "--shelf", "classics"]` directly to `run`. Keep the space inside the title in a single array element. Store the returned exit status separately from the text the action prints so a caller can branch on success.
