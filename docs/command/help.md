# Write help that matches the CLI

Help is generated from controller and method metadata. A user can inspect an installed command even when a service normally needed by its handler is offline. CHO checks declarations during startup and constructs command dependencies when a command actually runs.

## Describe an operation once

```ts
@Help("Catalog")
@Controller()
class Catalog {
  @Help("Print a shelf label\nPass the book title as one quoted argument.")
  @Action("label", {
    string: ["shelf"],
    alias: { s: "shelf" },
    default: { shelf: "general" },
    describe: { shelf: "Shelf printed on the label" },
  })
  label(ctx: ChoCommandContext) { /* print the label */ }
}
```

With `name: "library"`, `library --help` groups `label` under **Catalog** and shows the first line of its description. `library label --help` displays the full description and the action's declared flags. Flags must be listed in `boolean`, `string` or `collect` to appear in that table. A `describe` entry alone does not add a row.

## Check the public interface

| Invocation | Output |
| --- | --- |
| `library` with named actions | Global usage and command groups |
| `library --help` | Global help, or the single command's help in `@Main` mode |
| `library label --help` | Usage, description and flags for `label` |
| `library --version` | `library version 1.0.0` when configured with that version |

In single-command mode, use controller help for the program description and method help for usage details. In action mode, give each method a first line that makes sense in the command list. Run the actual help command when reviewing aliases, defaults and argument examples.
