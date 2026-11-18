import { serve } from "@chojs/web/serve";
import { createApp } from "./app.ts";

const app = await createApp();
const server = await serve(app.handler, { hostname: "127.0.0.1", port: 3000 });
console.log("Library listening on http://127.0.0.1:" + server.port);
