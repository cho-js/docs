# Routing

A **handler** is a controller method marked with an HTTP method decorator:

| Decorator          | HTTP method |
| ------------------ | ----------- |
| `@Get(route)`      | `GET`       |
| `@Post(route)`     | `POST`      |
| `@Put(route)`      | `PUT`       |
| `@Patch(route)`    | `PATCH`     |
| `@Delete(route)`   | `DELETE`    |
| `@Head(route)`     | `HEAD`      |
| `@Options(route)`  | `OPTIONS`   |

`@Sse(route)` is one more: a handler, `GET` by default, that answers with a
stream of [server-sent events](/web/sse).

```ts
@Controller({ route: "users" })
class UsersController {
  @Get("") //          GET    /users
  list() {}

  @Get(":id") //       GET    /users/:id
  get(ctx: ChoWebContext) {}

  @Post("") //         POST   /users
  create(ctx: ChoWebContext) {}

  @Put(":id") //       PUT    /users/:id
  replace(ctx: ChoWebContext) {}

  @Delete(":id") //    DELETE /users/:id
  remove(ctx: ChoWebContext) {}

  helper() {} //       not a route
}
```

A handler is a public, non-static method with a string name, and has one HTTP
method decorator.

## The four levels

A handler's path joins up to four levels, each optional:

| Level         | Declared by                                   |
| ------------- | --------------------------------------------- |
| Global prefix | The `prefix` option of `ChoWeb.create`        |
| Feature       | The `route` option of the feature's `@Module` |
| Controller    | The `route` option of the `@Controller`       |
| Handler       | The argument of `@Get`, `@Post`, …            |

```ts
@Controller({ route: "users" })
class UsersController {
  @Get(":id")
  get(ctx: ChoWebContext) {}
}

@Module({ route: "v1", controllers: [UsersController] })
class App {}

const app = await ChoWeb.create(App, {
  prefix: "api",
});
// GET /api/v1/users/:id
```

A level that is missing or `""` adds nothing: `@Get("")` on a controller with
`route: "users"` in a module without a route is `GET /users`.

## Features

A **feature** is a module that declares controllers.

**Every feature is mounted at the root of the application, whatever imports
it.** Importing a module does not nest its routes:

```ts
@Module({ route: "users", controllers: [UsersController] })
class UsersModule {}

@Module({ route: "orders", controllers: [OrdersController] })
class OrdersModule {}

@Module({ route: "admin", imports: [UsersModule, OrdersModule] })
class App {}

// /users/…  and  /orders/…   (not /admin/users/…)
```

`App` declares no controller here, so it is not a feature and its `route` is
ignored. To put every route under a common path, use the `prefix` option.

Only what serves a route counts. A controller without a handler is not part of
the web application, and a module without such a controller is not a feature:
its `route`, its middlewares and its error handler are ignored.

## Route rules

Routes are trimmed, then checked: a handler's route when its class is defined,
the others when the application is created.

- **No leading or trailing `/`**: write `"users/:id"`, not `"/users/:id/"`.
- No empty segment (`a//b`), and no `.` or `..` segment.
- Only characters a URL path allows, or percent-encoded bytes.
- A segment that starts with `:` is a **parameter**, `:name` (letters, digits
  and `_`). It matches exactly one segment.

Parameters are the only pattern. There are no wildcards (`*` is rejected) and
no optional or regular-expression segments, so a route means the same on every
adapter.

```ts
@Get("users/:userId/orders/:orderId")
order(ctx: ChoWebContext) {
  const { userId, orderId } = ctx.params; // decoded strings
}
```

## Duplicate routes

Two handlers with the same HTTP method and the same full path are an error
when the application is created. Parameter names do not count: `users/:id` and
`users/:name` are the same path.

```
Duplicate route "GET /users/:id": declared by UsersController.get and PeopleController.find
```

## Matching order

Routes are given to the adapter in declaration order. What happens when two
routes match the same request depends on the adapter:

| Adapter              | Wins                 |
| -------------------- | -------------------- |
| Built in             | The first declared   |
| `@chojs/vendor-hono` | The first declared   |
| `@chojs/vendor-fastify` | The static route  |

::: tip Declare static routes first
```ts
@Get("me") //  first
me() {}

@Get(":id") // then the parameter route
get(ctx: ChoWebContext) {}
```
Written this way, a route means the same on all three adapters.
:::

## `HEAD` requests

The response of a `@Head` handler is sent without its body: only its status
and headers. Without a `@Head` handler, the three adapters answer a `HEAD`
request from the `@Get` handler of the route, without the body.

## Unmatched requests

A request that matches no route never reaches CHO: the answer belongs to the
adapter. Each one has its own not-found handler; see
[Choosing an adapter](/adapters/#behavior).

## Inherited handlers

A controller also has the handlers it inherits from a base class. An override
keeps the inherited route unless it declares one itself:

```ts
class CrudController {
  @Get(":id")
  get(ctx: ChoWebContext) {}

  @Delete(":id")
  remove(ctx: ChoWebContext) {}
}

@Controller({ route: "books" })
class BooksController extends CrudController {
  @Middlewares(adminOnly) // added after the parent's middlewares
  override remove(ctx: ChoWebContext) {} // still DELETE /books/:id
}
```

`@Get(…)` on the override replaces the route instead.

## Listing the routes

```ts
for (const route of app.routes) {
  console.log(route.method, route.path, "->", route.name);
}
// GET /api/v1/users/:id -> UsersController.get
```

`app.graph` holds the same routes as a tree of features, controllers and
handlers.
