# Accept a multipart file upload

A browser file upload uses `multipart/form-data`. Read it with `ctx.req.formData()`. CHO's [`Form`](/api/web#symbol-Form) argument reader is for URL-encoded text fields.

## Limit the request and inspect the file

Install `@chojs/vendor-cho` for [`bodyLimit`](/adapters/middlewares). Register this controller with a module on the built-in router:

```ts
import { Controller, Middlewares, Post, type ChoWebContext } from "@chojs/web";
import { bodyLimit } from "@chojs/vendor-cho";

@Controller()
class Imports {
  @Middlewares(bodyLimit({ maxSize: 2 * 1024 * 1024 }))
  @Post("imports")
  async upload(ctx: ChoWebContext) {
    let form: FormData;
    try {
      form = await ctx.req.formData();
    } catch {
      return new Response("Expected a multipart form", { status: 400 });
    }
    const file = form.get("catalog");
    if (!(file instanceof File) || file.size === 0) {
      return new Response("Supply a file in the catalog field", { status: 400 });
    }
    return Response.json({ filename: file.name, bytes: file.size });
  }
}
```

## Send a file

```sh
printf 'id,title\n42,The Odyssey\n' > books.csv
curl -i -F 'catalog=@books.csv' http://127.0.0.1:3000/imports
```

Expect JSON with `filename: "books.csv"` and a positive byte count. Replace `catalog` with `other` to exercise the `400` path. An oversized request is answered with `413` by the middleware. The limit includes the multipart framing.

For a multi-file field, inspect `form.getAll("catalog")` and validate each entry. Treat the supplied filename as display metadata. Generate a storage key if you persist the bytes. `formData()` materializes the form. For large raw uploads, choose a streaming format and pass `ctx.req.body` to a storage writer that supports backpressure and cancellation.

## Choose where to enforce size

Exercise one upload just under the configured byte limit and another just over it. Also try a request without a declared length. The reader may discover the limit while consuming the body, so check the response before persisting the uploaded file.
