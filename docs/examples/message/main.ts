import { createApp } from "./app.ts";

const app = await createApp();
try {
  await app.handle("books.received", {
    key: "copy-17",
    value: JSON.stringify({ isbn: "9780140268867" }),
  });
} finally {
  await app.close();
}
