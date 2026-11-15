# Responses

What a handler returns is the response.

| Returned                                                         | Sent                                                        |
| ---------------------------------------------------------------- | ----------------------------------------------------------- |
| A `Response`                                                     | As is                                                       |
| Nothing (`undefined`)                                            | `204 No Content`                                            |
| A string                                                         | As text: `text/plain;charset=UTF-8`                         |
| Bytes: `Uint8Array` and other typed arrays, `ArrayBuffer`        | As bytes, with no content type                              |
| A `Blob`                                                         | Its bytes, with the blob's own type                         |
| A `ReadableStream`                                               | Streamed, with no content type                              |
| A `FormData`, a `URLSearchParams`                                | As a form: `multipart/form-data` or `x-www-form-urlencoded` |
| Anything else: objects, arrays, numbers, booleans, `null`, dates | As JSON: `application/json`                                 |

Everything but a `Response` and `undefined` is sent with status `200`. **For
another status or content type, return a `Response`.**

## Examples

::: code-group

```ts [JSON]
@Get("users")
list() {
  return [{ id: "1", name: "Ada" }]; // 200, application/json
}
```

```ts [Status and headers]
@Post("users")
async create(ctx: ChoWebContext) {
  const user = await this.store.add(await ctx.req.json());
  return Response.json(user, {
    status: 201,
    headers: { location: `/users/${user.id}` },
  });
}
```

```ts [No content]
@Delete("users/:id")
async remove(ctx: ChoWebContext) {
  await this.store.remove(ctx.params.id!);
  // nothing returned: 204 No Content
}
```

```ts [Text and HTML]
@Get("ping")
ping() {
  return "pong"; // text/plain;charset=UTF-8
}

@Get("page")
page() {
  return new Response("<h1>Hello</h1>", {
    headers: { "content-type": "text/html;charset=UTF-8" },
  });
}
```

```ts [Redirect]
@Get("old")
old(ctx: ChoWebContext) {
  return Response.redirect(new URL("/new", ctx.url), 301);
}
```

```ts [Stream]
@Get("export")
export() {
  const encoder = new TextEncoder();
  const rows = this.store.rows(); // an iterator
  const stream = new ReadableStream({
    pull(controller) {
      const { done, value } = rows.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(encoder.encode(`${value.id},${value.name}\n`));
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "text/csv" } });
}
```

```ts [File download]
@Get("report")
report() {
  const csv = new Blob(["id,name\n1,Ada\n"], { type: "text/csv" });
  return new Response(csv, {
    headers: { "content-disposition": 'attachment; filename="report.csv"' },
  });
}
```

:::

## Details

- The bodies in the middle of the table are what the platform's `Response`
  accepts: the value is given to `new Response(value)`. The platform sets the
  content type, except for a string, where `@chojs/web` sets it so that it is
  the same on every runtime.
- `null` is JSON (`null`), not an empty response. Return nothing for a `204`.
- A value that cannot be serialized as JSON, such as a `BigInt` or an object
  with a cycle, is an error, handled like any error of the handler
  ([Error handling](/web/error-handling)).
- A handler can be `async`: the awaited value is converted.
- The response of a `@Head` handler is sent without its body.
- A stream of events for a browser has its own decorator, `@Sse`: see
  [Server-sent events](/web/sse).

The same conversion applies to what an
[error handler](/web/error-handling) returns, with one difference: an error
handler that returns nothing has not handled the error.
