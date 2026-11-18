# Choose a command layout

Decide what the first positional word means to the person running the tool. If `library "The Odyssey"` acts on a title, use `@Main`. If `library label "The Odyssey"` selects one of several operations, use `@Action("label")`.

## One implicit command

```ts
import { Controller, Main, type ChoCommandContext } from "@chojs/command";

@Controller()
class Count {
  @Main()
  count({ args }: ChoCommandContext) {
    console.log(args._.length);
  }
}
```

Register `Count` in the module's `controllers` list. Running the application with `["a", "b"]` prints `2`. The context identifies the command as `"main"`. All positionals remain available to the handler.

## Named actions

Use `@Action(name, flags?)` on each public instance method and register its controller. Names must be unique across the application. An action receives its arguments with the matched name removed. The [shelf-label tutorial](/command/quick-start) shows a complete action, module and process entry point.

A command application must declare either one `@Main` or one or more named actions. CHO checks the complete module graph during creation, so a second `@Main` in an imported module also fails. A controller's ordinary helper methods remain private to its implementation unless decorated as commands.

## Group and extend commands

Controllers can group actions such as inventory and reporting. Give each controller a `@Help` heading to group those actions in global help. Separate modules can own their providers while contributing commands to the same executable.

A subclass inherits decorated commands from its base class. An override can keep the command mapping or declare another one. Check global help after moving commands between controllers to verify the public names and grouping.
