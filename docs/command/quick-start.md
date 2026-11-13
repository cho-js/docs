# Command quick start

`@chojs/command` builds command-line applications with decorators. Classes
declare commands; `ChoCommand` parses the command line, runs the right one and
returns the exit code.

- **Two shapes of application.** A single command, like `ls`, or multiple
  actions, like `git`.
- **Help for free.** `--help` and `--version` are built in, generated from
  `@Help` texts and the flags each command declares.
- **Declared flags.** A command says which flags it takes and of which type.
- **Middlewares and error handlers** on a module, a controller or a command.
- **Nothing is created to print help.** A command's dependencies are created
  when it first runs.
- **Exit codes, not `process.exit`.** `run()` resolves to the exit code and
  never exits the process itself.

## Install

::: code-group

```sh [Deno]
deno add jsr:@chojs/command
```

```sh [Node.js]
npx jsr add @chojs/command
```

```sh [Bun]
bunx jsr add @chojs/command
```

:::

## Multiple actions

The first word of the command line names the action to run, like `git commit`.

```ts
import {
  Action,
  ChoCommand,
  type ChoCommandContext,
  Controller,
  Help,
  Injectable,
  Module,
} from "@chojs/command";

@Injectable()
class Disk {
  copy(from: string, to: string) {/* ... */}
  remove(path: string) {/* ... */}
}

@Help("File system commands")
@Controller({ dependencies: [Disk] })
class FileSystem {
  constructor(readonly disk: Disk) {}

  @Help("Copy a file")
  @Action("copy")
  copy(ctx: ChoCommandContext) {
    const [from, to] = ctx.args._;
    this.disk.copy(String(from), String(to));
  }

  @Help("Delete a file")
  @Action("rm", { boolean: ["force"], alias: { f: "force" } })
  remove(ctx: ChoCommandContext) {
    if (!ctx.args.force) return 3; // the exit code
    this.disk.remove(String(ctx.args._[0]));
  }
}

@Module({ providers: [Disk], controllers: [FileSystem] })
class App {}

const app = ChoCommand.create(App, { name: "fs", version: "1.0.0" });
```

## A single command

One method runs for every command line, like `ls`. Mark it with `@Main()`
instead of `@Action`:

```ts
import {
  ChoCommand,
  type ChoCommandContext,
  Controller,
  Help,
  Main,
  Module,
} from "@chojs/command";

@Controller()
class Greet {
  @Help("Greet someone")
  @Main({ string: ["name"], describe: { name: "Who to greet" } })
  main(ctx: ChoCommandContext) {
    console.log(`Hello, ${ctx.args.name ?? "world"}!`);
  }
}

@Module({ controllers: [Greet] })
class App {}

const app = ChoCommand.create(App, { name: "greet", version: "1.0.0" });
```

An application has either one `@Main` or one or more `@Action`, never both.

## Run it

`run()` takes the command line and resolves to the exit code. The runtime
gives you the first and takes the second:

::: code-group

```ts [Deno]
const code = await app.run(Deno.args);
await app.close();
Deno.exit(code);
```

```ts [Node.js]
const code = await app.run(process.argv.slice(2));
await app.close();
process.exit(code);
```

```ts [Bun]
const code = await app.run(process.argv.slice(2));
await app.close();
process.exit(code);
```

:::

::: code-group

```sh [Deno]
deno run --allow-read --allow-write fs.ts copy src dest
```

```sh [Node.js]
npx tsx fs.ts copy src dest
```

```sh [Bun]
bun run fs.ts copy src dest
```

:::

```console
$ fs copy src dest
$ fs rm path/to/file --force
$ fs --version
fs version 1.0.0
$ fs --help
Usage: fs <command> [options] [args]

File system commands:
  copy  Copy a file
  rm    Delete a file

Options:
  --help     Show this help
  --version  Show the version

Run 'fs <command> --help' for help on a command.
```

## Making it an executable

::: code-group

```ts [Deno]
#!/usr/bin/env -S deno run --allow-read --allow-write
import { ChoCommand } from "@chojs/command";
// …

// chmod +x fs.ts && ./fs.ts copy a b
// or a single binary: deno compile --output fs fs.ts
```

```ts [Node.js]
#!/usr/bin/env -S npx tsx
import { ChoCommand } from "@chojs/command";
// …

// chmod +x fs.ts && ./fs.ts copy a b
// or compile with tsc and set "bin" in package.json
```

```ts [Bun]
#!/usr/bin/env bun
import { ChoCommand } from "@chojs/command";
// …

// chmod +x fs.ts && ./fs.ts copy a b
// or a single binary: bun build --compile --outfile fs fs.ts
```

:::

## What to read next

| Topic                                 | Page                                        |
| ------------------------------------- | ------------------------------------------- |
| `@Main`, `@Action`, `@Help`, rules    | [Commands](/command/commands)               |
| Flags, positionals, the context       | [Flags and arguments](/command/flags)       |
| Confirmation, timing, shared setup    | [Middlewares](/command/middlewares)         |
| `@Catch` and exit codes               | [Errors and exit codes](/command/errors)    |
| What `--help` prints                  | [Help output](/command/help)                |
| Options, setup, cleanup               | [The application](/command/application)     |
| Tests                                 | [Testing](/command/testing)                 |
