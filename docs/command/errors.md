# Report failures and exit codes

A command's return value is the status observed by `await app.run(argv)`. The process entry point passes that number to the operating system. Write command output to stdout and diagnostics to stderr so a caller can pipe them independently.

## Exit codes

| Outcome | Code |
| --- | --- |
| A command returns nothing or another non-code value | `0` |
| A command or middleware returns a non-negative integer | The integer, capped at `255` |
| Help, version or empty input in action mode | `0` |
| Unknown action or unhandled command exception | `1` |
| Error handler returns a non-negative integer | The integer, capped at `255` |
| Error handler returns no usable code | `1` |
| The selected error handler itself fails | `2` |

## Assign a code to a recoverable error

```ts
class MissingTitle extends Error {}

const app = ChoCommand.create(Library, {
  onError(error, ctx) {
    if (error instanceof MissingTitle) {
      console.error(ctx.command + ": supply a title");
      return 2;
    }
    console.error(error);
    return 1;
  },
});
```

Throw `MissingTitle` where the command detects that condition. For a local policy, attach `@Catch(handler)` to a method, controller or feature. CHO chooses the nearest handler in that order, then `onError`. The selected handler also sees failures in the command's middleware and lazy construction.

A malformed module graph fails during `ChoCommand.create`. Use `isChoError(error, "CHO_COMMAND_DUPLICATE_ACTION")` from `@chojs/command` to identify a conflicting action during startup. Framework [diagnostic codes](/reference/errors) are strings. The numeric exit codes above apply when you run a command. An unknown action is reported by the dispatcher. Neither failure calls a command's `@Catch`. To verify the contract, [test `run` directly](/command/testing).
