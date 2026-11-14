# Handler arguments

A handler can declare what it receives instead of reading the
[context](/web/context). Standard decorators cannot decorate a parameter (see
[Decorators](/guide/decorators#no-parameter-decorators)), so the arguments are
listed once, on the method, with `@Args`:

```ts
import { Args, Body, Param, Query } from "@chojs/web";

@Controller({ route: "users" })
class UsersController {
  // PUT /users/42?notify=1
  @Put(":id")
  @Args(Param("id"), Query("notify"), Body<UpdateUser>())
  update(id: string, notify: string | undefined, user: UpdateUser) {
    return this.store.update(id, user);
  }
}
```

Compare with the same handler reading the context:

```ts
@Put(":id")
async update(ctx: ChoWebContext) {
  const id = ctx.params.id!;
  const notify = ctx.url.searchParams.get("notify") ?? undefined;
  const user = await ctx.req.json() as UpdateUser;
  return this.store.update(id, user);
}
```

Both work, and an application can mix them. Without `@Args`, a handler receives
the context alone, as before.

## The order of the arguments

The list of `@Args` **is** the parameter list of the method. Three rules:

1. **Same order.** The first argument is the first parameter, the second the
   second, and so on.
2. **The context is always last.** After the declared arguments the handler
   receives the `ChoWebContext`, so a handler with arguments can still reach
   the request, the state or the adapter's context.
3. **The context can be left out.** A handler that does not need it simply does
   not declare the parameter.

```ts
@Args(Param("id"), Body())
update(id: string, body: unknown, ctx: ChoWebContext) {} // the context, last

@Args(Param("id"), Body())
update(id: string, body: unknown) {} //                     or left out

@Args()
list(ctx: ChoWebContext) {} //                              no argument: the context alone
```

**It is checked when you compile.** The parameters of the method must accept
the values of the arguments, in order, and then the context. A handler that
expects something else is a type error, on the `@Args` line:

```ts
@Args(Param("id"))
get(id: number) {} //                   ✗ Param("id") is a string

@Args(Query("page"))
list(page: string) {} //                ✗ a query key can be undefined

@Args(Param("id"))
get(ctx: ChoWebContext, id: string) {} // ✗ the context comes last
```

::: warning Two arguments of the same type
The check compares types, not names. Two arguments of the same type that are
swapped compile: `@Args(Param("from"), Param("to"))` with `move(to: string,
from: string)` gives each parameter the other's value. Keep the two lists side
by side when you edit one.
:::

**They are evaluated in that order too,** one after the other, after the
[middlewares](/web/middlewares) of the route and just before the handler:

```
feature middlewares → controller middlewares → handler middlewares
  → argument 1 → argument 2 → … → handler(value 1, value 2, …, ctx)
```

So a middleware that answers by itself (a failed authentication, say) never
reads the body, and an argument that throws stops the request there: the
arguments after it are not evaluated, and the handler is not called.

## The five functions

Each reads one source of the request.

| Function | Reads                           | `Fn()`                                  | `Fn("key")`                |
| -------- | ------------------------------- | --------------------------------------- | -------------------------- |
| `Param`  | The path parameters, decoded    | All of them, as an object of strings    | One: a string              |
| `Query`  | The query string                | All of it, as an object of strings      | One key, or `undefined`    |
| `Header` | The headers of the request      | All of them, with names in lower case   | One header, or `undefined` |
| `Body`   | The body, parsed as JSON        | The parsed body                         | One property of it         |
| `Form`   | The body, as a URL-encoded form | All the fields, as an object of strings | One field, or `undefined`  |

Every one of them has the same four forms:

| Call                      | Gives                                   |
| ------------------------- | --------------------------------------- |
| `Query()`                 | The whole source                        |
| `Query(validator)`        | The whole source, with a validator      |
| `Query("page")`           | One key of the source                   |
| `Query("page", validator)` | One key of the source, with a validator |

A validator is always the last argument. [Validation](/web/validation) says
what it is and when it runs.

::: code-group

```ts [Param]
// GET /orgs/acme/users/42
@Get(":org/users/:id")
@Args(Param("id"), Param())
get(id: string, all: Record<string, string>) {
  // id  === "42"
  // all === { org: "acme", id: "42" }
}
```

```ts [Query]
// GET /search?q=cho&tag=a&tag=b
@Get("search")
@Args(Query("q"), Query("page"), Query())
search(q: string | undefined, page: string | undefined, all: Record<string, string>) {
  // q    === "cho"
  // page === undefined
  // all  === { q: "cho", tag: "a" }   the first value of a repeated key
}
```

```ts [Header]
@Get("")
@Args(Header("accept-language"), Header())
hello(language: string | undefined, all: Record<string, string>) {
  // the name is looked up in any case; `all` has names in lower case
}
```

```ts [Body]
// POST /users   {"name":"Ada","address":{"city":"London"}}
@Post("")
@Args(Body<NewUser>(), Body("name"))
create(user: NewUser, name: unknown) {
  // user === { name: "Ada", address: { city: "London" } }
  // name === "Ada"
}
```

```ts [Form]
// POST /login   user=ada&password=secret
@Post("login")
@Args(Form("user"), Form("password"))
login(user: string | undefined, password: string | undefined) {}
```

:::

Good to know:

- **`Param("id")`** must name a parameter of the handler's full path: the
  global prefix, the feature, the controller and the handler. `ChoWeb.create`
  rejects a name that is not there, so the value is always a string.
- **`Query()` and `Form()`** give the first value of a repeated key. For every
  value, use `ctx.url.searchParams.getAll(key)`.
- **`Header()`** gives a header that was sent several times as one value, joined
  with `", "`, as the platform does.
- **`Body("name")`** is `undefined` when the body has no such property, or is
  not an object.

## The body

`Body` and `Form` read the body for you: the handler has nothing to `await`.

- `Body` parses the text of the body as JSON. An empty body is `undefined`.
- `Form` parses it as a URL-encoded form: an object of strings. An empty body
  is an empty object.
- Neither looks at the `content-type` of the request: the function you choose
  says how the body is read.
- The body of a request can be read **once**. It is read the first time an
  argument needs it, and every `Body` and `Form` argument of the handler shares
  it. A handler that declares one must not read `ctx.req` itself.
- A body that cannot be parsed (invalid JSON) fails the request: the
  [validation middleware](/web/validation) answers `400` when it is on the
  route, and otherwise the error goes to the
  [error handlers](/web/error-handling).
- Multipart forms and files are not covered: read them from
  `ctx.req.formData()`.

## Your own arguments

An argument is any function `(ctx) => value`, which can be `async`. It is what
the five functions return, and it is how you declare an argument of your own:

```ts
import type { ChoWebArg } from "@chojs/web";

// what an authentication middleware put in the state
const CurrentUser: ChoWebArg<User> = (ctx) => ctx.state.get("user") as User;

// something computed from the request
const Locale: ChoWebArg<string> = (ctx) =>
  ctx.req.headers.get("accept-language")?.split(",")[0] ?? "en";

@Get("me")
@Args(CurrentUser, Locale)
me(user: User, locale: string) {
  return { user, locale };
}
```

An argument of your own has no access to the injector: for a service, inject
it in the controller.

## Types

| Argument                   | The parameter is                              |
| -------------------------- | --------------------------------------------- |
| `Param("id")`              | `string`                                      |
| `Query("page")`, `Header("x")`, `Form("x")` | `string \| undefined`        |
| `Param()`, `Query()`, `Header()`, `Form()` | `Readonly<Record<string, string>>` |
| `Body()`, `Body("name")`   | `unknown`                                     |
| `Body<NewUser>()`          | `NewUser`: your promise, nothing checks it    |
| Any of them with a validator | What the validator gives                    |
| A function of your own     | What it returns, awaited                      |

## Rules

- `@Args` goes above or below the HTTP method decorator.
- A method has one `@Args`.
- On a method that is not a handler it has no effect.
- A handler inherited from a base class keeps its arguments. An override that
  declares `@Args` replaces them; one that does not keeps them.
- Middlewares and error handlers are not handlers: they always receive the
  context.
