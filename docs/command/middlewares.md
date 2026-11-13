# Middlewares

A middleware wraps what comes after it: the next middlewares, then the
command. It can stop the command, change its exit code or prepare its context.
`@Middlewares(...)` applies to a module that declares controllers, a
controller, or a command method.

```ts
import { type ChoCommandMiddlewareFn, Middlewares } from "@chojs/command";

const confirm: ChoCommandMiddlewareFn = (ctx, next) =>
  ctx.args.yes ? next() : 1; // stops here, with exit code 1

const timing: ChoCommandMiddlewareFn = async (ctx, next) => {
  const start = performance.now();
  await next();
  console.error(`${ctx.command}: ${Math.round(performance.now() - start)}ms`);
};

@Middlewares(timing) // every command of the controller
@Controller()
class FileSystem {
  @Middlewares(confirm) // this command only
  @Action("rm")
  remove(ctx: ChoCommandContext) {}
}
```

## What a middleware can do

Middlewares work as those of [`@chojs/web`](/web/middlewares) do, with the
**exit code** where web has a `Response`:

- **`next()`** runs the rest of the chain and resolves to its exit code.
- **Returning an exit code** (a non-negative integer) ends the run with it:
  without calling `next()` to stop before the command, or after it to replace
  the exit code.
- **Returning nothing** after calling `next()` passes the exit code on, so
  `await next();` alone is enough.

::: code-group

```ts [Stop before the command]
const requireRepo: ChoCommandMiddlewareFn = async (_ctx, next) => {
  if (!(await exists(".git"))) {
    console.error("not a repository");
    return 128;
  }
  return next();
};
```

```ts [Replace the exit code]
const neverFail: ChoCommandMiddlewareFn = async (_ctx, next) => {
  const code = await next();
  return code === 0 ? 0 : 1; // collapse every failure to 1
};
```

```ts [Prepare the context]
const verbose: ChoCommandMiddlewareFn = (ctx, next) => {
  ctx.state.set("log", ctx.args.verbose ? console.error : () => {});
  return next();
};
```

:::

A middleware that calls `next()` twice, returns something that is not an exit
code, or returns nothing without calling `next()`, makes the run fail
([Errors and exit codes](/command/errors)).

## Middleware classes

A middleware can also be a class with a `handle(ctx, next)` method. It is
created by the injector, so it can have dependencies:

```ts
@Injectable([Config])
class LoadProfile {
  constructor(readonly config: Config) {}

  async handle(ctx: ChoCommandContext, next: ChoCommandNext) {
    ctx.state.set("profile", await this.config.profile(ctx.args.profile));
    return await next();
  }
}

@Middlewares(LoadProfile) // every command of the controller
@Controller()
class FileSystem {
  @Action("rm")
  remove(ctx: ChoCommandContext) {
    const profile = ctx.state.get("profile");
  }
}

@Module({
  providers: [Config, LoadProfile], // the class is a provider of the module
  controllers: [FileSystem],
})
class App {}
```

The class is created in the scope of the module that declares the controller,
so it must be a provider visible there: one of its `providers`, or exported by
a module it imports.

## Levels and order

A run executes the module's middlewares, then the controller's, then the
method's, each in declaration order.

```ts
@Middlewares(a) //     module: every command of its controllers
@Module({ controllers: [FileSystem] })
class App {}

@Middlewares(b) //     controller
@Controller()
class FileSystem {
  @Middlewares(c) //   command
  @Action("rm")
  remove() {}
}

// a → b → c → remove → c → b → a
```

**Middlewares belong to their commands.** They only run for a command they
apply to: never for the commands of another controller or module, nor for
`--help`, `--version` or an unknown action.

## Nothing is created before a command runs

A middleware class is created the first time a command it applies to runs, and
kept. Printing the help creates nothing.

What can be checked without creating anything is still checked by
`ChoCommand.create`: a middleware is a function, or a class with a `handle`
method that is visible in the controller's module. A class the injector could
not find is a wiring mistake, reported when the application is created, not
when its command first runs.
