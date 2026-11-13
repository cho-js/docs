# Flags and arguments

## The context

A command method receives the **context** of the run, a `ChoCommandContext`:

| Property  | Holds                                                                        |
| --------- | ---------------------------------------------------------------------------- |
| `args`    | The parsed command line: the positionals in `_`, and the flags               |
| `argv`    | The command line, as it was given to `run()`                                 |
| `command` | The command that runs: `"main"`, or the name of the action                   |
| `state`   | A `Map` for the run: what a middleware sets, later ones and the command read |

The middlewares, the command and the error handler of a run share one context;
each run has its own.

```ts
// fs copy a.txt 007 --force --mode=644 -v
copy(ctx: ChoCommandContext) {
  ctx.args._;     // ["a.txt", "007"]  positionals, always as typed
  ctx.args.force; // true
  ctx.args.mode;  // 644: not declared, so typed from its look
  ctx.args.v;     // true
  ctx.command;    // "copy"
}
```

## Positionals

`ctx.args._` holds the words that are not flags.

- **Positionals are strings**, exactly as typed: `007`, `0x10` and `1e3` are
  not turned into numbers.
- With multiple actions, `_` does not include the action name.
- Everything after `--` is a positional: `fs rm -- -weird-name`.

```ts
@Action("copy")
copy(ctx: ChoCommandContext) {
  const [from, to] = ctx.args._;
  if (!from || !to) throw new Error("usage: fs copy <from> <to>");
}
```

## Declaring flags

A command declares its own flags, as the second argument of `@Action` (the
first of `@Main`):

```ts
@Action("copy", {
  boolean: ["force", "color"], // --force                   never takes the next word
  string: ["mode"], //            --mode 0755               kept as typed: "0755"
  collect: ["exclude"], //        --exclude a --exclude b   ["a", "b"]
  negatable: ["color"], //        --no-color                for a boolean flag
  alias: { f: "force" }, //       -f
  default: { mode: "644" }, //    when the flag is not given
  describe: { force: "Overwrite existing files" }, // for --help
})
copy(ctx: ChoCommandContext) {
  // fs copy a b -f --mode 0755 --exclude x --exclude y
  // { _: ["a", "b"], f: true, force: true, color: false,
  //   mode: "0755", exclude: ["x", "y"] }
}
```

| Key         | Value                    | Meaning                                              |
| ----------- | ------------------------ | ---------------------------------------------------- |
| `boolean`   | Flag names               | No value: the flag never takes the next word         |
| `string`    | Flag names               | The value is kept as typed                           |
| `collect`   | Flag names               | The flag can repeat: values are collected in an array |
| `negatable` | Boolean flag names       | `--no-<name>` turns it off. List the flag in `boolean` too |
| `alias`     | `{ short: "long" }`      | Another name for a flag                              |
| `default`   | `{ name: value }`        | The value when the flag is not given                 |
| `describe`  | `{ name: "text" }`       | The flag's line in `--help`                          |

A declared `boolean` flag that is not given is `false`; other flags that are
not given, and have no default, are absent from `ctx.args`.

Declared flags apply when that command runs, and only then: another command
does not know them. They are listed in the command's `--help`. A malformed
declaration throws when the class is defined.

### Undeclared flags

A flag that is **not declared** still reaches the command, typed from the
command line alone:

| Command line   | `ctx.args`        | Why                                                  |
| -------------- | ----------------- | ---------------------------------------------------- |
| `--verbose`    | `verbose: true`   | No value                                             |
| `--out dir`    | `out: "dir"`      | Followed by a word that is not a flag: it takes it   |
| `--n=42`       | `n: 42`           | A value that looks like a number becomes one         |
| `--mode=0755`  | `mode: 755`       | Same: declare it as `string` to keep `"0755"`        |

Declare the flag to decide instead.

## Flags for every command

The application declares flags shared by every command with the
`parseOptions` option of `ChoCommand.create`:

```ts
const app = ChoCommand.create(App, {
  parseOptions: { boolean: ["verbose"], string: ["config"] },
});
```

It takes `boolean`, `string`, `collect`, `negatable`, `alias`, `default`,
`stopEarly`, `"--"` and `unknown`. A command's own flags are added to them.

## Reserved flags

Only two long flags are reserved: **`--help`** and **`--version`**.

- They never take a value: `--help copy` is the help of `copy`.
- `--no-help` and `--help=false` turn them off.
- They are never passed to commands, and a command cannot declare them.

Short flags (`-h`, `-v`) are left to the commands.

## Finding the command

With multiple actions, the command is the first word that **names an action**
and is not a flag, the value of a declared flag, or after `--`. It is removed,
and the rest is parsed with the application's options and the command's flags.

| Command line       | Runs   | Args                                                   |
| ------------------ | ------ | ------------------------------------------------------ |
| `copy a b`         | `copy` | `_: ["a", "b"]`                                        |
| `-v ls dir`        | `ls`   | `v: true`, `_: ["dir"]`: `-v` did not take `ls`        |
| `--out dir copy a` | `copy` | `out: "dir"`, `_: ["a"]`: `dir` is not an action       |
| `--force copy a`   | `copy` | `force: true`: a command's flag can come before it     |
| `--config ls copy` | `copy` | `config: "ls"`, once the application declares `config` |
| `copy -- ls`       | `copy` | `_: ["ls"]`                                            |

Only a word after a flag the **application** declares as `string` or
`collect` is known to be a value before the command is found. The value of
any other flag that happens to be an action name is taken as the command, so
declare application-wide value flags in `parseOptions`.

When no word names an action, the first positional is reported as an unknown
action; with no positional at all, the help is printed.

## Validating input

Throw from the command. Without an error handler the message is printed as
`Error: <message>` and the exit code is `1`:

```ts
@Action("goodbye", { string: ["to"], describe: { to: "Who to say goodbye to" } })
goodbye(ctx: ChoCommandContext) {
  if (!ctx.args.to) {
    throw new Error("--to is required");
  }
  console.log(`Goodbye, ${ctx.args.to}`);
}
```

```console
$ app goodbye
Error: --to is required
$ echo $?
1
```

For checks shared by several commands, use a
[middleware](/command/middlewares).
