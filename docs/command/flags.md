# Parse flags and positional arguments

Declare flags whose spelling or type matters. Catalog identifiers, for example, may have leading zeros. Declaring a flag as `string` preserves those characters.

```ts
@Action("import", {
  string: ["branch", "tag"],
  collect: ["tag"],
  boolean: ["preview", "color"],
  negatable: ["color"],
  alias: { p: "preview" },
  default: { branch: "001", color: true },
  describe: { branch: "Branch identifier", tag: "Attach a tag" },
})
load({ args }: ChoCommandContext) {
  console.log(args._, args.branch, args.tag, args.preview, args.color);
}
```

With `import books.csv --branch 007 --tag new --tag fiction -p --no-color`, the command receives `["books.csv"]`, `"007"`, `["new", "fiction"]`, `true` and `false`. Without `string`, a numeric-looking flag value can become a number.

## Choose a flag declaration

| Setting | Meaning |
| --- | --- |
| `boolean` | A switch that does not consume the next word |
| `string` | Preserve the supplied text |
| `collect` | Gather repeated values in an array |
| `negatable` | Accept `--no-name` for a boolean option |
| `alias` | Map alternative names, including short flags |
| `default` | Value to use when the flag is omitted |
| `describe` | Text displayed in command help |

Undeclared flags can also reach the handler. Check required values and allowed combinations inside the command or a middleware. The parser handles syntax. Your command defines what counts as valid input.

## Finding the command

In action mode CHO looks for an action name before `--`, skipping flags and known flag values. Put global value-taking flags in `parseOptions` when they can precede the command:

```ts
const app = ChoCommand.create(Library, {
  parseOptions: { string: ["profile"], boolean: ["verbose"] },
});
```

With actions named `list` and `label`, `--profile list label` now selects `label` and supplies `"list"` as the profile. Once the action is selected, its flag declarations are combined with application parser options. Text after `--` is available as positional input by default.

## Read the context

`ctx.argv` preserves the input passed to `run`, `ctx.command` identifies the selected action, and `ctx.args._` contains positional words. `ctx.state` holds values shared within that run. CHO consumes the reserved long flags `--help` and `--version`. Short names such as `-h` and `-v` remain available to the application.

## Protect identifiers during parsing

Run the import twice, once with `--branch 007` and once with `--branch 7`. Both values remain strings when `branch` is declared in `string`. If those values identify different branches, keep that declaration in the common parser options whenever the flag can precede the action.
