import { openApi } from "@chojs/openapi";
import { serve } from "@chojs/web/serve";
import { bookTitle, createApp } from "./app.ts";

const app = await createApp();

openApi(app, {
  info: { title: "Library catalog", version: "1.0.0" },
  toJsonSchema(validator) {
    if (validator === bookTitle) return { type: "string", pattern: "\\S" };
  },
});

await serve(app.handler, { hostname: "127.0.0.1", port: 3000 });
