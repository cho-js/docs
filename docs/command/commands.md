# Commands

Commands are methods of **controllers**: classes decorated with
`@Controller()` and listed in the `controllers` of a `@Module`.

```ts
@Help("File system commands")
@Controller({ dependencies: [Disk] })
class FileSystem {
  constructor(readonly disk: Disk) {}

  @Help("Copy a file")
  @Action("copy")
  copy(ctx: ChoCommandContext) {}
}

@Module({ providers: [Disk], controllers: [FileSystem] })
class App {}
```

The usual [dependency injection](/di/overview) rules apply: a controller
receives its `dependencies` in its constructor, resolved in the scope of the
module that declares it. Controllers can be declared in any module of the
application, imported ones included. A controller without command methods is
ignored.

## `@Main(flags?)`

Marks the method that runs for every command line. The application has exactly
one, and no `@Action`.

```ts
@Controller()
class ListFiles {
  @Help("List the files of a directory")
  @Main({ boolean: ["all"], alias: { a: "all" } })
  main(ctx: ChoCommandContext) {
    if (ctx.args._.length !== 1) {
      throw new Error("expected one directory");
    }
    console.log(`listing ${ctx.args._[0]}`);
  }
}
```

```console
$ ls -a src
```

## `@Action(name, flags?)`

Marks the method that runs for `app <name>`.

```ts
@Action("copy", { boolean: ["force"] })
copy(ctx: ChoCommandContext) {}

@Action("rm")
remove(ctx: ChoCommandContext) {}
```

- The name is a non-empty string, without whitespace, that does not start
  with `-`: a word the command line can pass as is, and not as a flag. Any
  other character is allowed (`x-y`, `v1.2`, `42`).
- Names share **one namespace** across the whole application. Two actions with
  the same name, in any controllers or modules, are an error.
- There are no groups or nested subcommands. Controllers group actions in the
  help output only.

`flags` declares the flags the command accepts: see
[Flags and arguments](/command/flags).

## `@Help(text)`

Help text, printed by `--help`:

- on a controller, it describes the group of commands the controller holds;
- on a command method, it describes the command.

```ts
@Help("Remote repositories")
@Controller()
class Remotes {
  @Help(`Add a remote
The name must be unique. The URL is not checked.`)
  @Action("remote-add")
  add(ctx: ChoCommandContext) {}
}
```

The text must be a non-empty string. It can span several lines: where only one
line fits (a group heading, the list of commands), the first line is used. See
[Help output](/command/help).

## What a command returns

The exit code of the run:

| Returned                             | Exit code |
| ------------------------------------ | --------- |
| A non-negative integer `n`           | `n`       |
| Anything else, or nothing            | `0`       |
| The command throws                   | `1`, or what an [error handler](/command/errors) returns |

```ts
@Action("check")
async check(ctx: ChoCommandContext) {
  const problems = await this.linter.run(ctx.args._);
  return problems.length > 0 ? 1 : 0;
}
```

A command can be `async`. It runs on its controller instance, so `this` works.

## Rules

- A command method is a public, non-static method with a string name.
- A method has at most one `@Main` or `@Action`. `@Help` combines with either,
  in any order.
- The mode follows from the whole application, when `ChoCommand.create` runs:

  | The application has                    | Mode             |
  | -------------------------------------- | ---------------- |
  | Exactly one `@Main`, no `@Action`      | A single command |
  | One or more `@Action`, no `@Main`      | Multiple actions |
  | No command, both kinds, or two `@Main` | An error         |

## Inherited commands

A controller also has the commands it inherits from a base class. An override
keeps the inherited command unless it declares one itself:

```ts
class BaseCommands {
  @Help("Show the status")
  @Action("status")
  status(ctx: ChoCommandContext) {}
}

@Controller()
class Commands extends BaseCommands {
  @Middlewares(timing) // added after the parent's middlewares
  override status(ctx: ChoCommandContext) {} // still the "status" action
}
```

`@Help` or `@Middlewares` on the override add to what the parent declared;
`@Action(…)` on it replaces the command.

## Several controllers and modules

Controllers group related actions; modules group controllers with the
providers they need.

```ts
@Help("Branches")
@Controller({ dependencies: [Repo] })
class Branches {
  @Help("List branches")
  @Action("branch")
  list() {}

  @Help("Switch branch")
  @Action("switch")
  switch(ctx: ChoCommandContext) {}
}

@Help("Remotes")
@Controller({ dependencies: [Repo, Network] })
class Remotes {
  @Help("Download from a remote")
  @Action("fetch")
  fetch(ctx: ChoCommandContext) {}
}

@Module({
  providers: [Repo, Network],
  controllers: [Branches, Remotes],
})
class App {}
```

Only what the command that runs needs is created: `app branch` never creates
`Network`.
