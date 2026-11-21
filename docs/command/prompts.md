# Ask questions in a terminal

Use `@chojs/prompt` when a command needs a decision from the person running it. Terminal input works on Deno, Node.js and Bun. A Worker can import the package, but has no interactive terminal. For commands that also run in automation, accept flags and use `isInteractive()` before asking for missing input.

Add the package to the command project: `deno add jsr:@chojs/prompt`, `npx jsr add @chojs/prompt` (Node.js), or `bunx jsr add @chojs/prompt`. The same package includes the scripted terminal used below.

## Collect and validate answers

```ts
import { confirm, isInteractive, select, text } from "@chojs/prompt";

if (isInteractive()) {
  const name = await text({
    message: "Catalog name",
    placeholder: "central",
    validate: value => value.trim() ? undefined : "Enter a catalog name",
  });
  const format = await select({
    message: "Export format",
    choices: [
      { value: "json", label: "JSON", hint: "For another application" },
      { value: "csv", label: "CSV", hint: "For a spreadsheet" },
    ],
    default: "csv",
  });
  if (await confirm({ message: "Continue with export?", default: false })) {
    console.log(name, format);
  }
}
```

- `text(options: TextOptions)` resolves to the entered string. An empty answer uses `default` if supplied. A placeholder is a visual hint on a color terminal. A validator may return a message to keep the question open, or return nothing to accept. Async validators work the same way. Its result type is `ChoPromptMistake`.
- `select(options: SelectOptions<T>)` resolves to the chosen value. Each `ChoPromptChoice<T>` carries a value and optional display label and hint. Use the arrow keys to choose and Enter to submit.
- `confirm(options: ConfirmOptions)` resolves to a boolean. Enter accepts the default. Without a default, choose yes or no first.

Await one question before opening the next. For error handling, `ChoPromptErrorCode` includes `CHO_PROMPT_BUSY`, `CHO_PROMPT_CANCELLED` (Ctrl+C), `CHO_PROMPT_INVALID_OPTION` and `CHO_PROMPT_NO_TERMINAL`. Let the calling command decide its exit code when a user cancels.

## Script a terminal

Use `createPrompts(terminal?)` to give a command a `ChoPrompts` instance. Its three question methods use the supplied `ChoPromptTerminal`, or the process terminal by default. This makes it possible to exercise the same questions with a known sequence of keys.

```ts
import { createPrompts } from "@chojs/prompt";
import { scriptedTerminal } from "@chojs/prompt/testing";

const terminal = scriptedTerminal(["down", "return"]);
const prompts = createPrompts(terminal);
const format = await prompts.select({
  message: "Export format",
  choices: [{ value: "json" }, { value: "csv" }],
});
// format is "csv"
console.log(terminal.screen()); // final visible lines
```

`scriptedTerminal(keys?, options?)` returns a `ScriptedTerminal`. Each `ScriptedKey` can be text to type, a named key such as `"down"`, a combination such as `"ctrl+c"`, or a `ChoPromptKey` object. Use `keys_of("abc")` to obtain the three individual key objects. Pass `ScriptedTerminalOptions` such as `{ interactive: false }` to exercise unattended use, or set `columns` and `colors` to control rendering. Inspect `screens` for the intermediate frames, `written` for raw output, and `left`, `cursor` and `reading` for terminal state.
