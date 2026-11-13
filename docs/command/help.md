# Help output

`--help` prints to stdout, built from the `@Help` texts and the flags each
command declares. Printing it creates no instance.

## A single command

`ls --help`: the usage, the controller's help, the method's help, then the
options.

```ts
@Help("List files")
@Controller()
class ListFiles {
  @Help("List the files of a directory")
  @Main()
  main(ctx: ChoCommandContext) {}
}
```

```
Usage: ls [options] [args]

List files

List the files of a directory

Options:
  --help     Show this help
  --version  Show the version
```

## Multiple actions

`fs`, `fs --help`, or `fs nope --help`: every action, grouped under the first
line of its controller's `@Help` (`Commands` for controllers without one), in
declaration order, each with the first line of its own help.

```
Usage: fs <command> [options] [args]

File system commands:
  copy  Copy a file
  rm    Delete a file

Commands:
  get

Options:
  --help     Show this help
  --version  Show the version

Run 'fs <command> --help' for help on a command.
```

## One action

`fs copy --help`: the usage, the method's help, then the options.

```
Usage: fs copy [options] [args]

Copy a file

Options:
  --help     Show this help
  --version  Show the version
```

## Options

The options listed are the flags the command declares, then the two reserved
flags. A declared flag is shown with its other names, how it is written, its
`describe` text and its default:

```ts
@Action("copy", {
  boolean: ["force", "color"],
  string: ["mode"],
  collect: ["exclude"],
  negatable: ["color"],
  alias: { f: "force" },
  default: { mode: "644" },
  describe: { force: "Overwrite existing files" },
})
```

```
Options:
  -f, --force           Overwrite existing files
  --[no-]color
  --mode <value>        (default: 644)
  --exclude <value>...
  --help                Show this help
  --version             Show the version
```

| Declared as | Shown as               |
| ----------- | ---------------------- |
| `boolean`   | `--name`               |
| `string`    | `--name <value>`       |
| `collect`   | `--name <value>...`    |
| `boolean` and `negatable` | `--[no-]name` |
| `alias`     | `-f, --force`          |

## The program name and version

Both come from the options of `ChoCommand.create`:

```ts
const app = ChoCommand.create(App, { name: "fs", version: "1.0.0" });
```

```console
$ fs --version
fs version 1.0.0
```

The name defaults to `chojs`. The version has no default: without one,
`--version` prints `fs (no version)`.

## Writing good help

- Give every controller and every command a `@Help`. The first line is what
  the list shows: keep it short, and put details on the following lines.
- `describe` every declared flag.
- Group actions by controller: the controller's `@Help` is the heading.
