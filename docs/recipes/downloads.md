# Send a file for download

Set `Content-Disposition` to `attachment` and choose a `Content-Type` appropriate for the bytes. The response body can come from memory or a file stream.

## Generate a small report

```ts
@Get("inventory.csv")
download() {
  const report = "id,title\r\n41,The Iliad\r\n42,The Odyssey\r\n";
  return new Response(report, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="inventory.csv"',
    },
  });
}
```

Run the following from a second terminal:

```sh
curl -D - -o inventory.csv http://127.0.0.1:3000/inventory.csv
cat inventory.csv
```

Check for a `200` status, the attachment header and a file containing the two records. For dynamically generated CSV, quote and escape field values using a CSV writer.

## Stream a file from disk on Deno

For a large existing export, use a fixed path owned by the application and grant the process read access to that file.

```ts
@Get("archive")
async archive() {
  try {
    const file = await Deno.open("./exports/catalog.zip", { read: true });
    return new Response(file.readable, {
      headers: {
        "content-type": "application/zip",
        "content-disposition": 'attachment; filename="catalog.zip"',
      },
    });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return new Response("Export unavailable", { status: 404 });
    }
    throw error;
  }
}
```

The file's readable stream owns the open handle and closes it on completion or cancellation. For a user-selected export, look up an application-owned path by identifier. Choose a download name independently of the storage path. Use the native listener when testing a [Fastify](/adapters/fastify) download.
