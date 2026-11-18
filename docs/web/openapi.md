# Publish an OpenAPI document

Give the [writable book catalog](/web/example) a page where a client can explore its endpoints and download an OpenAPI 3.1.1 document. The catalog already declares its paths, arguments, validators and response statuses. `@chojs/openapi` reads them from the initialized web application.

OpenAPI generation is tested in Cloudflare's `workerd` alongside the server runtimes. For a minified Worker bundle, set `keep_names = true` in `wrangler.toml` to preserve tags derived from controller class names. [Cloudflare Workers setup](/guide/cloudflare-workers)

## 1. Add the package

Start with `app.ts` and `catalog.ts` from the catalog tutorial. Install the OpenAPI extra alongside a version of `@chojs/web` that supports `app.mount`.

::: code-group

```sh [Deno]
deno add jsr:@chojs/openapi jsr:@chojs/web
```

```sh [Node.js]
npx jsr add @chojs/openapi @chojs/web
```

```sh [Bun]
bunx jsr add @chojs/openapi @chojs/web
```

:::

If you are working from the CHO repository, you can also run `deno run --allow-net examples/openapi-http.ts` at its root. That example serves a users API on port `8082` with Swagger UI, Scalar and Redoc.

## 2. Serve the catalog and its documentation

Save this entry point as `openapi.ts` beside `app.ts`. Call `openApi` after creating the application and before starting the listener. The `info.version` value identifies your catalog API.

<<< @/examples/catalog/openapi.ts

Run `deno run --allow-net openapi.ts`, `npx tsx openapi.ts` or `bun run openapi.ts` in the configured project. Open `http://127.0.0.1:3000/docs` for Swagger UI. The catalog prefix places its operations under `/api/books`. The documentation page and JSON have their own [mounted paths](/web/mounted-routes).

## 3. Check what clients receive

```sh
curl -fsS http://127.0.0.1:3000/docs/openapi.json
```

| In the document | Expected for this catalog | Source |
| --- | --- | --- |
| `paths["/api/books/{id}"].get` | Operation `findBook` with a required `id` path parameter | `@Get(":id")` and `@Doc` |
| `paths["/api/books"].post.requestBody` | An `application/json` object with a string `title` property | `Body("title", bookTitle)` and the schema converter |
| `paths["/api/books"].post.responses` | `201` for creation and `400` for invalid input | Explicit `@Doc` response and `validate()` covering the validator |

The extension builds the document once when `openApi` is called. Its own endpoints appear in `app.routes`. The generator reads the declaration graph, so its output lists the catalog operations and omits mounted endpoints.

## Choose the page and who can open it

The `route` option takes the full base path in CHO route syntax. For example, `route: "internal/api-docs"` puts the document at `/internal/api-docs/openapi.json`. `ui` accepts `"swagger"` (default), `"scalar"`, `"redoc"`, or a function receiving `{ url, title }` and returning HTML. Set `ui: false` to serve only the JSON. Built-in pages load version-pinned client assets from jsDelivr. Set `assets` to the base URL of a self-hosted copy when serving those files locally.

To restrict the page and JSON, pass a middleware function that uses your application's access check in `openApi`'s `middlewares` array. Both routes run that middleware. Controller and feature guards apply only to their declared handlers. OpenAPI `securitySchemes` and `security` describe credentials for API clients. Enforcement belongs in request middleware.

## Export a document without opening a port

Save this as `export.ts` beside `app.ts`. Running `deno run export.ts > openapi.json` writes a document suitable for a client generator or a contract check in CI.

```ts
import { openApiDocument } from "@chojs/openapi";
import { bookTitle, createApp } from "./app.ts";

const app = await createApp();
try {
  const document = openApiDocument(app, {
    info: { title: "Library catalog", version: "1.0.0" },
    toJsonSchema: (validator) =>
      validator === bookTitle ? { type: "string", pattern: "\\S" } : undefined,
  });
  console.log(JSON.stringify(document, null, 2));
} finally {
  await app.close();
}
```

If generation fails with `CHO_OPENAPI_DUPLICATE_OPERATION_ID`, check the IDs on visible operations. For `CHO_OPENAPI_UNKNOWN_SECURITY_SCHEME`, compare the security requirements with the keys in `securitySchemes`. Tests can match either [framework code](/reference/errors) with `isChoError` from `@chojs/web`.

`openApiDocument` returns a fresh object on each call. To generate HTML for an already hosted document, use `docsPage({ url: "/openapi.json", title: "Library catalog", ui: "redoc" })`. For operation IDs, response media types, inherited security and schema conversion, see [describe an HTTP API](/web/api-docs).
