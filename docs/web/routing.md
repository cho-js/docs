# Map methods to URLs

A route identifies a public instance method by HTTP verb and path. Use [`@Get`](/api/web#symbol-Get), [`@Post`](/api/web#symbol-Post), [`@Put`](/api/web#symbol-Put), [`@Patch`](/api/web#symbol-Patch), [`@Delete`](/api/web#symbol-Delete), [`@Head`](/api/web#symbol-Head) or [`@Options`](/api/web#symbol-Options). Pass `""` for the current path. With all levels empty, `@Get("")` serves `/`.

## Assemble the full path

| Level | Example | Result so far |
| --- | --- | --- |
| Application `prefix` | `"api"` | `/api` |
| Declaring module's `route` | `"v1"` | `/api/v1` |
| Controller's `route` | `"books"` | `/api/v1/books` |
| Method route | `":id"` | `/api/v1/books/:id` |

Only the module that declares the controller contributes a path. Importing `BooksModule` from `AdminModule` does not give its routes an `admin` prefix. Use the application prefix to mount every feature together.

Programmatic routes registered after creation supply their entire path, independent of these four levels. [Mount a route](/web/mounted-routes)

## Matching order

```ts
@Controller({ route: "books" })
class Books {
  @Get("featured")
  featured() { return ["42"]; }

  @Get(":id")
  @Args(Param("id"))
  byId(id: string) { return { id }; }
}
```

Declare fixed paths before parameterized siblings. The built-in router and Hono select the first match. Fastify gives the static route priority. With the order above, `GET /books/featured` reaches `featured` on all three.

## Diagnose a route

- Use relative segments such as `"books/:id"`. Leading or trailing slashes, empty segments, `.`, `..` and wildcards are rejected. A parameter occupies one segment and its name uses letters, digits or underscores.
- Duplicate method/path pairs fail at creation. Renaming `:id` to `:isbn` still matches the same requests.
- A derived controller inherits decorated methods. Decorating an override with a new HTTP route replaces the inherited one.
- A `HEAD` request can use an explicit `@Head` route or fall back to `GET` on the supplied adapters. The response carries headers and status with an empty body.
- On a `404`, inspect the registered method and complete path before debugging the handler. The adapter handles unmatched requests.

```ts
console.table(app.routes.map(({ method, path, name }) => ({ method, path, name })));
```

## Find a route that never runs

Print `app.routes.map(({ method, path }) => [method, path])` immediately after creation. If the expected method and path are present, send the same request through `app.handler` and inspect the response. With an overlapping literal and parameter route, try the literal first. The selected linker determines matching precedence.
