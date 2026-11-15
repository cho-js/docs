# Send a file to download

A download is a response with a `content-disposition: attachment` header: it
tells the browser to save the body as a file, under the name the header gives,
instead of showing it.

## A file made in memory

A `Blob` has a type, which becomes the content type of the response:

```ts
@Get("report") // GET /report
report() {
  const csv = new Blob(["id,name\n1,Ada\n"], { type: "text/csv" });
  return new Response(csv, {
    headers: { "content-disposition": 'attachment; filename="report.csv"' },
  });
}
```

A file too large to build in memory is streamed as it is produced:
[Stream a response](/recipes/streaming).

## A file on disk

The file is streamed from the disk: it is not read into memory. Each runtime
has its own way to open a file as a stream; the one of Node.js runs on Deno and
Bun too.

::: code-group

```ts [Node.js]
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

@Get("invoices/:id") // GET /invoices/42
@Args(Param("id"))
async invoice(id: string) {
  const path = this.invoices.pathOf(id); // "/data/invoices/42.pdf", or undefined
  const info = path && await stat(path).catch(() => undefined);
  if (!path || !info?.isFile()) {
    return new Response("no such invoice", { status: 404 });
  }
  const body = Readable.toWeb(createReadStream(path)) as ReadableStream;
  return new Response(body, {
    headers: {
      "content-type": "application/pdf",
      "content-length": String(info.size),
      "content-disposition": `attachment; filename="invoice-${id}.pdf"`,
    },
  });
}
```

```ts [Deno]
@Get("invoices/:id") // GET /invoices/42
@Args(Param("id"))
async invoice(id: string) {
  const path = this.invoices.pathOf(id); // "/data/invoices/42.pdf", or undefined
  const file = path && await Deno.open(path).catch(() => undefined);
  if (!file) {
    return new Response("no such invoice", { status: 404 });
  }
  const { size } = await file.stat();
  // the file is closed when the stream ends, or when the client goes away
  return new Response(file.readable, {
    headers: {
      "content-type": "application/pdf",
      "content-length": String(size),
      "content-disposition": `attachment; filename="invoice-${id}.pdf"`,
    },
  });
}
```

```ts [Bun]
@Get("invoices/:id") // GET /invoices/42
@Args(Param("id"))
async invoice(id: string) {
  const path = this.invoices.pathOf(id); // "/data/invoices/42.pdf", or undefined
  const file = path && Bun.file(path);
  if (!file || !(await file.exists())) {
    return new Response("no such invoice", { status: 404 });
  }
  // Bun sets content-type and content-length from the file
  return new Response(file, {
    headers: {
      "content-disposition": `attachment; filename="invoice-${id}.pdf"`,
    },
  });
}
```

:::

## The name of the file

The quoted `filename` only holds plain ASCII. For a name with other characters,
give both forms: `filename`, for old clients, and `filename*`, which every
current browser prefers.

```ts
/** A `content-disposition` for a download, for any file name. */
export function attachment(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]|["\\]/g, "_");
  const encoded = encodeURIComponent(name);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

attachment("דוח שנתי.csv");
// attachment; filename="___ ____.csv"; filename*=UTF-8''%D7%93%D7%95%D7%97%20…csv
```

To show the file in the browser and still name it, for a PDF or an image, use
`inline` in place of `attachment`.

## What to know

- **Never open a path that comes from the request as it is.** A path parameter
  is decoded: `..%2F..%2Fetc%2Fpasswd` reaches the handler as
  `../../etc/passwd`. Look the path up from an id, as above. To serve the files
  of a folder by name, resolve the name and check that it is still inside:

  ```ts
  import { resolve, sep } from "node:path";

  const ROOT = resolve("public");

  const path = resolve(ROOT, name);
  if (!path.startsWith(ROOT + sep)) {
    return new Response("no such file", { status: 404 });
  }
  ```

- **`content-length`** lets the browser show the progress of the download. Deno
  and Node.js send the one you set with a stream. Bun drops it, and sends the
  stream in chunks: on Bun, return `Bun.file(path)`, which has its length.
- **A part of a file is not served.** A `Range` request, which a video player
  sends to jump ahead, gets the whole file: nothing reads the header for you.
  The exception is Bun, which answers `206` with the part for a response made
  of `Bun.file(path)`.
- **Keep [`etag`](/adapters/middlewares#etag) off these routes**: it reads the
  whole body into memory to hash it.
- **An error while the file is read cuts the response**, like any error in a
  stream: see [Stream a response](/recipes/streaming#what-to-know).
