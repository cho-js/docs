import assert from "node:assert/strict";
import { createApp } from "./app.ts";

Deno.test("a created book is readable at its Location", async () => {
  const app = await createApp();
  try {
    const url = "http://library/api/books";
    const created = await app.handler(new Request(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: " The Odyssey " }),
    }));
    assert.equal(created.status, 201);
    const location = created.headers.get("location");
    assert.ok(location);
    const found = await app.handler(new Request(new URL(location, url)));
    assert.equal(found.status, 200);
    const book = await found.json();
    assert.equal(book.title, "The Odyssey");
    assert.deepEqual(book, await created.json());

    const invalid = await app.handler(new Request(url, {
      method: "POST",
      body: JSON.stringify({ title: "  " }),
    }));
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).key, "title");
  } finally {
    await app.close();
  }
});
