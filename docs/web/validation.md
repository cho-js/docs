# Validation

Each argument of a handler ([Handler arguments](/web/arguments)) can have a
**validator**, and one middleware, `validate()`, runs them.

```ts
import { z } from "zod";
import { Args, Body, Middlewares, Param, validate } from "@chojs/web";

const NewUser = z.object({ name: z.string(), age: z.number().optional() });

@Middlewares(validate()) // every handler of the controller is validated
@Controller({ route: "users" })
class UsersController {
  @Put(":id")
  @Args(Param("id", z.coerce.number()), Body(NewUser))
  update(id: number, user: z.infer<typeof NewUser>) {
    return this.store.update(id, user);
  }
}
```

## Validators

A validator is any object with a `parse(value)` method that returns the value,
or throws:

```ts
type ChoWebValidator<T> = { parse(value: unknown): T | Promise<T> };
```

That is the shape of a [zod](https://zod.dev) schema, so a zod schema is a
validator. `@chojs/web` does not depend on zod: any object of that shape works,
including one you write.

```ts
const Positive: ChoWebValidator<number> = {
  parse(value) {
    const n = Number(value);
    if (!(n > 0)) throw new Error("expected a positive number");
    return n;
  },
};

@Get("")
@Args(Query("page", Positive))
list(page: number) {}
```

A validator is the **last** argument of `Param`, `Query`, `Header`, `Body` and
`Form`, with or without a key:

| Call                       | Validates                         |
| -------------------------- | --------------------------------- |
| `Body(NewUser)`            | The whole body                    |
| `Body("name", z.string())` | One property of the body          |
| `Query(Paging)`            | The whole query string, as an object |
| `Param("id", z.coerce.number())` | One path parameter          |

## The validation middleware

Validation is **opt-in**: validators are run only for the handlers that
`validate()` covers. Declare it with [`@Middlewares`](/web/middlewares), at the
level you want:

::: code-group

```ts [A handler]
@Middlewares(validate())
@Post("")
@Args(Body(NewUser))
create(user: NewUser) {}
```

```ts [A controller]
@Middlewares(validate()) // every handler of the controller
@Controller({ route: "users" })
class UsersController {}
```

```ts [A feature]
@Middlewares(validate()) // every handler of every controller of the module
@Module({ controllers: [UsersController, OrdersController] })
class ApiModule {}
```

:::

There is no application-wide setting for now: an application with several
features declares it on each.

With the middleware on the route:

- every argument that has a validator goes through its `parse` before the
  handler is called;
- **what `parse` returns is what the handler receives.** A validator can
  convert (`z.coerce.number()` turns `"42"` into `42`), fill defaults, and drop
  what it does not know;
- a request that is not valid, or whose body cannot be parsed, never reaches
  the handler: the middleware answers.

## When it happens

Wherever `validate()` is declared, validation happens at the same moment:
**after every middleware of the route, just before the handler**, as the
arguments are evaluated ([the order of the arguments](/web/arguments#the-order-of-the-arguments)).

```ts
@Middlewares(validate()) //  on the controller: declared first
@Controller({ route: "users" })
class UsersController {
  @Middlewares(Auth) //      on the handler: runs after the controller's
  @Post("")
  @Args(Body(NewUser))
  create(user: NewUser) {}
}
```

A request without credentials is answered `401` by `Auth`, and its body is
never read or validated. You do not have to order the two.

Arguments are validated in order, and the first one that is not valid stops the
request: the answer reports that one.

## The answer to an invalid request

`400`, with a JSON body:

```json
{
  "error": "Invalid request",
  "source": "body",
  "key": "name",
  "issues": [{ "path": ["name"], "message": "Required" }]
}
```

| Property | Holds                                                                          |
| -------- | ------------------------------------------------------------------------------ |
| `source` | Where the argument comes from: `param`, `query`, `header`, `body` or `form`    |
| `key`    | The key of the argument, when it has one (`Body("name")`); absent for a whole source |
| `issues` | The `issues` of the error the validator threw, when it has them, as a zod error does. Otherwise one issue, with the error's message |

To answer differently, give the middleware an `onInvalid` function. It receives
what failed and the context; what it returns is the response, converted like
the [result of a handler](/web/responses):

```ts
validate({
  onInvalid: ({ source, key, error }, ctx) =>
    Response.json(
      { message: `Invalid ${source}`, path: ctx.url.pathname },
      { status: 422 },
    ),
});
```

An `onInvalid` that returns nothing (it only logs, say) leaves the default
answer in place.

The answer is the middleware's, not an error: a request that is not valid does
**not** go to `@Catch` or `onError`. Other errors do, as always.

## Without the middleware

Nothing is validated:

- validators are not run: the handler receives each value as its source gives
  it, **not converted**;
- a body that cannot be parsed is an error like any other, given to the
  nearest [error handler](/web/error-handling).

::: warning The type still comes from the validator
`Param("id", z.coerce.number())` types the parameter as a number. Without
`validate()` on the route, the handler receives the string. Run the application
with `CHO_DEBUGLOG=cho:web` to list every handler that has a validator and is
not covered:

```
cho:web UsersController.update has an argument with a validator and no validate() middleware: it is not validated
```

See [Debug logging](/reference/debugging).
:::

The validator is still kept with the argument, and still describes it
([Describing the API](/web/api-docs)).

## Asynchronous validators

`parse` can return a promise; it is awaited. A zod schema with asynchronous
checks is parsed with `parseAsync`, so wrap it:

```ts
const UniqueEmail = z.string().email().refine(is_free); // an async check

@Args(Body("email", { parse: (value) => UniqueEmail.parseAsync(value) }))
```

## Testing

`app.handler` takes a `Request`, so a test needs no server
([Testing](/web/testing)):

```ts
const app = await ChoWeb.create(App);

const response = await app.handler(
  new Request("http://localhost/users/7", { method: "PUT", body: "{}" }),
);
assert.equal(response.status, 400);
assert.equal((await response.json()).source, "body");
```
