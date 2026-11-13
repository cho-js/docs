# Tokens and providers

## Tokens

A token identifies something injectable.

| Token                        | Resolves to       | Example                    |
| ---------------------------- | ----------------- | -------------------------- |
| A class (abstract included)  | An instance of it | `Logger`                   |
| An injection token `token()` | `T`               | `token<string>("API_URL")` |
| A symbol                     | `unknown`         | `Symbol("cache")`          |

```ts
import { token } from "@chojs/web"; // or "@chojs/command"

const API_URL = token<string>("API_URL");
const PORT = token<number>("PORT");
```

- `token<T>(description)` creates a **unique** token. Two tokens with the same
  description are different tokens, so export a token and import it where it is
  needed.
- The description is for error messages, where the token reads
  `InjectionToken(API_URL)`.
- **Strings are not tokens.** Different packages could pick the same string;
  the decorators reject them.

## Providers

A provider says how to create the value of a token. There are two kinds.

### An `@Injectable` class

Its token is the class. Its value is an instance, created with the listed
dependencies as constructor arguments, in order.

```ts
@Injectable()
class Logger {}

@Injectable([Logger, PORT])
class Server {
  constructor(readonly logger: Logger, readonly port: number) {}
}
```

### A provider object

Built with `provider()`: a token, the dependencies (`deps`), and a factory that
receives their values, in order. The factory can be `async`.

```ts
import { provider, token } from "@chojs/web";

const API_URL = token<string>("API_URL");

provider({
  provide: API_URL,
  deps: [Config],
  factory: (config) => config.apiUrl, // config: Config
});
```

The factory's argument types are inferred from `deps`, and its result must
match the token's type.

Use a provider object for:

::: code-group

```ts [A plain value]
provider({ provide: PORT, factory: () => 3000 });
```

```ts [An async resource]
provider({
  provide: Database,
  deps: [Config],
  factory: async (config) => await Database.connect(config.dbUrl),
});
```

```ts [A class you do not own]
// A library class has no @Injectable: construct it in a factory.
provider({
  provide: S3Client,
  deps: [Config],
  factory: (config) => new S3Client({ region: config.region }),
});
```

```ts [An implementation of an abstract class]
abstract class Mailer {
  abstract send(to: string, text: string): Promise<void>;
}

provider({ provide: Mailer, factory: () => new SmtpMailer() });
```

```ts [Something new each time]
// Instances are singletons: provide a function, and call it.
const NEW_ID = token<() => string>("NEW_ID");

provider({ provide: NEW_ID, factory: () => () => crypto.randomUUID() });
```

:::

Providers are declared in the `providers` of a [module](/di/modules):

```ts
@Module({
  providers: [
    Config,
    Logger,
    provider({ provide: API_URL, deps: [Config], factory: (c) => c.apiUrl }),
  ],
})
class App {}
```

A `@Controller` or a `@Module` class is not a provider: it goes in
`controllers` or `imports`, and is rejected in `providers`.

## The dependencies are type-checked

`@Injectable`, `@Controller` and `@Module` only accept a class whose
constructor can be called with the values of the listed dependencies, in
order. This is a compile-time check; nothing is reflected at runtime.

```ts
@Injectable([PORT, Logger]) // compile error: the constructor wants (Logger, number)
class Server {
  constructor(logger: Logger, port: number) {}
}
```

What is checked:

- the value type of each dependency against the parameter at its position;
- that every required parameter has a dependency. A class may take fewer
  parameters than there are dependencies.

What to know:

- The check needs the list as written in the decorator. A list kept in a
  variable typed as an array is not checked.
- A symbol token has no value type, so it can be received as any type. Prefer
  `token<T>()`.
- TypeScript compares types by structure: a class with no members accepts any
  value, so the check is only as precise as the types are.

## Where dependencies are declared

| Decorator     | Dependencies                                   |
| ------------- | ---------------------------------------------- |
| `@Injectable` | The argument: `@Injectable([A, B])`            |
| `@Controller` | The `dependencies` option                      |
| `@Module`     | The `dependencies` option (see [Modules](/di/modules#a-module-is-injectable-itself)) |
| `provider()`  | The `deps` property                            |

Middleware and error handler classes are `@Injectable` classes too, so they
have dependencies the same way. See the middlewares pages of
[web](/web/middlewares) and [command](/command/middlewares).
