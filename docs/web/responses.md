# Set response status, body and headers

Return an object for a conventional JSON response. Return a Fetch `Response` when the client needs a specific status or header.

| Handler result | Response |
| --- | --- |
| `{ id: "42" }`, an array, number, boolean or `null` | JSON, status `200` |
| A string | Text with UTF-8 content type, status `200` |
| `undefined`, including a method with no return | Empty body, status `204` |
| `Uint8Array`, `ArrayBuffer`, other array views, `Blob`, `FormData`, `URLSearchParams` or `ReadableStream` | Fetch body with the platform's applicable headers |
| A `Response` | Its status, headers and body |

CHO awaits a promise before applying these rules. Check for a missing record explicitly. Returning `undefined` from a lookup would send `204` to the client.

## Report creation

```ts
@Post("")
@Args(Body("title", titleValidator))
create(title: string) {
  const book = this.catalog.add(title);
  return Response.json(book, {
    status: 201,
    headers: { location: "/books/" + encodeURIComponent(book.id) },
  });
}
```

In this controller fragment, `titleValidator` runs under [`validate()`](/web/validation) and `catalog` is an injected store. Set `Location` to the actual public path, including any application prefix.

## Stream or download a body

Wrap a byte stream in `new Response(stream, { headers })` to choose its media type. For a browser download, also set `Content-Disposition`. For typed event streams, `@Sse` handles event framing and response headers. [Stream bytes](/recipes/streaming) · [Download a file](/recipes/downloads) · [Server-sent events](/web/sse)
