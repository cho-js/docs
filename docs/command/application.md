# Embed or launch a command application

`ChoCommand.create(Root, options)` returns synchronously after checking module wiring and command declarations. `run` is asynchronous. Reusing the application for several runs also reuses the services those runs have initialized.

## Configure the executable

| Option | Purpose |
| --- | --- |
| `name` | Program name in usage and version output. Default `chojs` |
| `version` | Version reported by `--version`. When omitted, CHO prints `<name> (no version)` |
| `parseOptions` | Parser options shared by every command |
| `onError` | Error handler used when a command has no closer `@Catch` |
| `overrides` | Replacements for declared providers, typically test doubles |

## Pass an argument list

```ts
import { createApp } from "./app.ts"; // from the shelf-label tutorial

const app = createApp();
try {
  const first = await app.run(["label", "The Odyssey"]);
  const second = await app.run(["label", "The Iliad", "--shelf", "classics"]);
  console.log({ first, second }); // both 0
} finally {
  await app.close();
}
```

Supply one string per shell argument. A quoted title is one array element. Omit the runtime and script name. In a process entry point use `Deno.args` or `process.argv.slice(2)`. See the [complete launch code](/command/quick-start).

## Release resources

Close the application after the last run finishes. The injector disposes only instances it created. In particular, printing help does not open a connection whose factory is only needed by an action. Use [debug logging](/reference/debugging) to see command selection and initialization.
