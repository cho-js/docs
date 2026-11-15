# Receive an uploaded file

A browser sends files in a `multipart/form-data` form. `ctx.req` is the
platform's `Request`, and its `formData()` reads such a form: a file of the form
is a `File`.

## A form with a file

::: code-group

```ts [Server]
import { bodyLimit } from "@chojs/vendor-cho";

const MAX = 5 * 1024 * 1024; // 5 MB

@Middlewares(bodyLimit({ maxSize: MAX })) // refuse a larger body: 413
@Post("avatars") // POST /avatars
async upload(ctx: ChoWebContext) {
  const form = await ctx.req.formData().catch(() => undefined);
  if (!form) {
    return Response.json({ error: "a form is expected" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "file is required" }, { status: 400 });
  }
  if (file.type !== "image/png") {
    return Response.json({ error: "not a PNG image" }, { status: 415 });
  }
  const id = await this.avatars.save(new Uint8Array(await file.arrayBuffer()));
  return Response.json(
    { id, name: file.name, size: file.size, title: form.get("title") },
    { status: 201 },
  );
}
```

```html [Page]
<form id="avatar">
  <input name="title">
  <input name="file" type="file" accept="image/png">
  <button>Send</button>
</form>

<script type="module">
  const form = document.querySelector("#avatar");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    // no content-type header: the browser sets it, with the boundary
    const response = await fetch("/avatars", {
      method: "POST",
      body: new FormData(form),
    });
    console.log(response.status, await response.json());
  });
</script>
```

:::

`form.get("title")` is a string, and `form.get("file")` is a `File`: its
`name`, `type` and `size` come with it, and `arrayBuffer()`, `text()` and
`stream()` read it.

## Several files

`getAll` gives every value of a field. With
`<input name="files" type="file" multiple>`:

```ts
@Post("photos")
async upload(ctx: ChoWebContext) {
  const form = await ctx.req.formData();
  const files = form.getAll("files").filter((value) => value instanceof File);
  for (const file of files) {
    await this.photos.save(file);
  }
  return files.map((file) => ({ name: file.name, size: file.size }));
}
```

## A large file

`formData()` reads the whole body into memory. A file too large for that is
sent as the body itself, with no form around it, and the handler writes the body
to disk as it arrives:

::: code-group

```ts [Server]
import { createWriteStream } from "node:fs";
import { rm } from "node:fs/promises";
import { Writable } from "node:stream";

const MAX = 2 * 1024 * 1024 * 1024; // 2 GB

@Middlewares(bodyLimit({ maxSize: MAX }))
@Post("videos") // POST /videos
async upload(ctx: ChoWebContext) {
  if (!ctx.req.body) {
    return Response.json({ error: "a body is expected" }, { status: 400 });
  }
  const id = crypto.randomUUID();
  const path = `/data/videos/${id}`; // a name of your own, not the client's
  const target = Writable.toWeb(createWriteStream(path)) as WritableStream;
  try {
    await ctx.req.body.pipeTo(target);
  } catch (error) {
    await rm(path, { force: true }); // the upload was cut: drop the part of it
    throw error;
  }
  return Response.json({ id }, { status: 201 });
}
```

```js [Client]
const file = document.querySelector("input[type=file]").files[0];

const response = await fetch("/videos", {
  method: "POST",
  headers: { "content-type": file.type },
  body: file, // the file is the body
});
```

:::

`node:fs` runs on Node.js, Deno and Bun. On Deno, the target can also be
`(await Deno.create(path)).writable`.

## What to know

- **Limit the size before the body is read.** A server on the standard
  `Request` has no limit of its own. The file is in memory by the time
  `file.size` can be checked, so the limit belongs to
  [`bodyLimit`](/adapters/middlewares#bodylimit), which refuses the request
  first.
- **`formData()` rejects for a body that is not a form.** Without the `catch`
  above, a request with another content type is an error of the handler: a
  `500`.
- **What the client says is not checked.** `file.name` and `file.type` are what
  the client sent. Do not use the name as a path on disk, and check the content
  itself when its type matters.
- **The body is read once.** A handler that calls `formData()` cannot also
  declare a `Body` or a `Form` [argument](/web/arguments).
- **The `Form` argument reads a URL-encoded form**, which has no files. A form
  with files is read with `ctx.req.formData()`.
