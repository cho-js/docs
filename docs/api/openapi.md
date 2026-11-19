---
outline: 2
---

# @chojs/openapi

Mount the document and viewer on the initialized application, or export the document for a client-generation pipeline. [Give clients an API description](/web/openapi) · [Browse all packages](/api/)

## ChoOpenApiErrorCode {#symbol-ChoOpenApiErrorCode}

The codes of the errors of `@chojs/openapi`. Each is described in `specs.md`, section 8.

A mistake the core finds for the package has a code of the core
(`ChoCoreErrorCode` of `@chojs/core`): an unknown option is
`CHO_CORE_UNKNOWN_OPTION`.

```ts
export type ChoOpenApiErrorCode = "CHO_OPENAPI_DUPLICATE_OPERATION_ID" | "CHO_OPENAPI_INVALID_OPTION" | "CHO_OPENAPI_UNKNOWN_SECURITY_SCHEME" | "CHO_OPENAPI_UNKNOWN_UI";
```

### Usage {#ChoOpenApiErrorCode-usage}

```ts
const CODES: Record<ChoOpenApiErrorCode, true> = {
  CHO_OPENAPI_DUPLICATE_OPERATION_ID: true,
  CHO_OPENAPI_INVALID_OPTION: true,
  CHO_OPENAPI_UNKNOWN_SECURITY_SCHEME: true,
  CHO_OPENAPI_UNKNOWN_UI: true,
};
```

[Usage in extras/openapi/errors_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/extras/openapi/errors_test.ts#L8)

## DocsPage {#symbol-DocsPage}

What a page shows: given to a `ui` function.

```ts
export type DocsPage = {
    readonly url: string;
    readonly title: string;
};
```

**`url`** Where the OpenAPI document is.

**`title`** The title of the page.

### Usage {#DocsPage-usage}

```ts
return PAGES[ui]({ url, title }, base);
```

[Usage in extras/openapi/page.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/extras/openapi/page.ts#L207)

## DocsPageOptions {#symbol-DocsPageOptions}

The options of `docsPage`.

```ts
export type DocsPageOptions = {
    url: string;
    ui?: DocsUi;
    title?: string;
    assets?: string;
};
```

**`url`** Where the OpenAPI document is: a URL, or a path of the application.

**`ui`** The client. Default: `"swagger"`.

**`title`** The title of the page. Default: `"API"`.

**`assets`** Where the files of the client are, for an application that hosts them
itself: it replaces the address of the package on the CDN, and the names
of the files stay the same. Default: the CDN.

### Usage {#DocsPageOptions-usage}

```ts
const scalar = docsPage({
      url: URL,
      ui: "scalar",
      assets: "https://assets.example.com/scalar",
    });
```

[Usage in extras/openapi/page_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/extras/openapi/page_test.ts#L84)

## DocsUi {#symbol-DocsUi}

The client of a page: one that is ready, or a function that returns the
HTML of the page, for any other client.

```ts
export type DocsUi = keyof typeof UI_VERSIONS | ((page: DocsPage) => string);
```

### Usage {#DocsUi-usage}

```ts
const ui: DocsUi = ({ url, title }) =>
  `<!doctype html><title>${title}</title><my-client spec="${url}"></my-client>`;
```

## JsonSchema {#symbol-JsonSchema}

A JSON Schema, as a plain object.

```ts
export type JsonSchema = {
    [keyword: string]: unknown;
};
```

### Usage {#JsonSchema-usage}

```ts
const page = standard({
      type: "object",
      properties: { page: { type: "integer" }, size: { type: "integer" } },
      required: ["page"],
    });
```

[Usage in extras/openapi/document_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/extras/openapi/document_test.ts#L525)

## OpenApiDocument {#symbol-OpenApiDocument}

An OpenAPI 3.1 document.

```ts
export type OpenApiDocument = {
    openapi: "3.1.1";
    info: OpenApiInfo;
    servers?: OpenApiServer[];
    paths: Record<string, OpenApiPathItem>;
    components?: {
        schemas?: Record<string, JsonSchema>;
        securitySchemes?: Record<string, OpenApiSecurityScheme>;
    };
    security?: OpenApiSecurityRequirement[];
    tags?: {
        name: string;
        description?: string;
    }[];
    externalDocs?: OpenApiExternalDocs;
};
```

**`openapi`** The version of OpenAPI.

**`info`** What the API is.

**`servers`** Where the API is served.

**`paths`** The operations, by path.

**`components`** What the document refers to.

**`security`** What every operation requires, unless it says otherwise.

**`tags`** The tags that have a description.

**`externalDocs`** More documentation.

### Usage {#OpenApiDocument-usage}

```ts
const document: OpenApiDocument = openApiDocument(app, {
  info: { title: "Catalog", version: "1" },
});
console.log(Object.keys(document.paths));
```

## OpenApiDocumentOptions {#symbol-OpenApiDocumentOptions}

The options of `openApiDocument`.

```ts
export type OpenApiDocumentOptions = {
    info: OpenApiInfo;
    servers?: readonly OpenApiServer[];
    tags?: Readonly<Record<string, string>>;
    securitySchemes?: Readonly<Record<string, OpenApiSecurityScheme>>;
    security?: readonly ChoWebDocSecurity[];
    externalDocs?: OpenApiExternalDocs;
    toJsonSchema?: ToJsonSchema;
};
```

**`info`** What the API is: its `title` and its `version` are required.

**`servers`** Where the API is served. Default: none, and a client calls the origin of
the page that shows the document.

**`tags`** A description for a tag, by its name: `{ users: "The users" }`.

**`securitySchemes`** The ways to authenticate, by name: what `security` refers to.

**`security`** What every operation requires, unless the `security` of a `@Doc` says
otherwise. Default: nothing.

**`externalDocs`** More documentation of the API.

**`toJsonSchema`** Turns a validator into a JSON Schema, for a validator that does not give
its own (see `ToJsonSchema`). Default: none.

### Usage {#OpenApiDocumentOptions-usage}

```ts
const document = openApiDocument(await create(App), {
      info: INFO,
      securitySchemes: loose(securitySchemes),
    });
```

[Usage in extras/openapi/document_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/extras/openapi/document_test.ts#L443)

## OpenApiExternalDocs {#symbol-OpenApiExternalDocs}

An External Documentation Object.

```ts
export type OpenApiExternalDocs = {
    url: string;
    description?: string;
};
```

**`url`** The URL of the documentation.

**`description`** What it is.

### Usage {#OpenApiExternalDocs-usage}

```ts
const guide: OpenApiExternalDocs = { url: "https://catalog.example/guide" };
openApi(app, { info: { title: "Catalog", version: "1" }, externalDocs: guide });
```

## OpenApiInfo {#symbol-OpenApiInfo}

The Info Object: what the API is.

```ts
export type OpenApiInfo = {
    title: string;
    version: string;
    summary?: string;
    description?: string;
    termsOfService?: string;
    contact?: {
        name?: string;
        url?: string;
        email?: string;
    };
    license?: {
        name: string;
        identifier?: string;
        url?: string;
    };
};
```

**`title`** The title of the API.

**`version`** The version of the API, not of OpenAPI: `"1.0.0"`.

**`summary`** One line about the API.

**`description`** A longer text. Markdown is allowed.

**`termsOfService`** The URL of the terms of service.

**`contact`** Who to contact.

**`license`** The license of the API.

### Usage {#OpenApiInfo-usage}

```ts
openApi(app, { info: { ...INFO, title: "Internal" }, route: "internal" });
```

[Usage in extras/openapi/mount_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/extras/openapi/mount_test.ts#L270)

## OpenApiMediaType {#symbol-OpenApiMediaType}

A Media Type Object: the schema of a body, for one media type.

```ts
export type OpenApiMediaType = {
    schema?: JsonSchema;
};
```

**`schema`** The schema of the body.

### Usage {#OpenApiMediaType-usage}

```ts
const title: OpenApiMediaType = { schema: { type: "string" } };
```

## OpenApiMethod {#symbol-OpenApiMethod}

The HTTP methods of a Path Item Object.

```ts
export type OpenApiMethod = "get" | "put" | "post" | "delete" | "options" | "head" | "patch";
```

### Usage {#OpenApiMethod-usage}

```ts
const method: OpenApiMethod = "get";
console.log(document.paths["/books/{id}"]?.[method]?.summary);
```

## OpenApiOperation {#symbol-OpenApiOperation}

An Operation Object: one handler of the application.

```ts
export type OpenApiOperation = {
    operationId: string;
    tags?: string[];
    summary?: string;
    description?: string;
    deprecated?: boolean;
    security?: OpenApiSecurityRequirement[];
    parameters?: OpenApiParameter[];
    requestBody?: OpenApiRequestBody;
    responses: Record<string, OpenApiResponse>;
};
```

**`operationId`** The id of the operation, unique in the document.

**`tags`** The tags of the operation.

**`summary`** One line about the operation.

**`description`** A longer text.

**`deprecated`** Whether it should no longer be used.

**`security`** What it requires, when it differs from the document: `[]` is nothing.

**`parameters`** The parameters of the path, of the query, and the headers.

**`requestBody`** The body of the request.

**`responses`** The responses, by status.

### Usage {#OpenApiOperation-usage}

```ts
function listResponses(operation: OpenApiOperation) {
  return Object.keys(operation.responses);
}
```

## OpenApiOptions {#symbol-OpenApiOptions}

The options of `openApi`: those of the document, and its own.

```ts
export type OpenApiOptions = OpenApiDocumentOptions & {
    route?: string;
    ui?: DocsUi | false;
    assets?: string;
    middlewares?: readonly ChoWebMiddlewareFn[];
};
```

### Usage {#OpenApiOptions-usage}

```ts
const options: OpenApiOptions = { info: { title: "Catalog", version: "1.0" }, ui: "scalar" };
openApi(app, options);
```

## OpenApiParameter {#symbol-OpenApiParameter}

A Parameter Object: a parameter of the path, of the query or a header.

```ts
export type OpenApiParameter = {
    name: string;
    in: "path" | "query" | "header";
    required?: boolean;
    schema: JsonSchema;
};
```

**`name`** The name of the parameter.

**`in`** Where it is.

**`required`** Whether a request must have it. Always `true` in the path.

**`schema`** Its schema.

### Usage {#OpenApiParameter-usage}

```ts
const id: OpenApiParameter = {
  name: "id", in: "path", required: true, schema: { type: "string" },
};
```

## OpenApiPathItem {#symbol-OpenApiPathItem}

A Path Item Object: the operations of one path, by method.

```ts
export type OpenApiPathItem = Partial<Record<OpenApiMethod, OpenApiOperation>>;
```

### Usage {#OpenApiPathItem-usage}

```ts
function listOperations(path: OpenApiPathItem) {
  return Object.values(path).map((operation) => operation.operationId);
}
```

## OpenApiRequestBody {#symbol-OpenApiRequestBody}

A Request Body Object.

```ts
export type OpenApiRequestBody = {
    required?: boolean;
    content: Record<string, OpenApiMediaType>;
};
```

**`required`** Whether a request must have a body.

**`content`** The body, by media type.

### Usage {#OpenApiRequestBody-usage}

```ts
const title: OpenApiRequestBody = {
  required: true, content: { "text/plain": { schema: { type: "string" } } },
};
```

## OpenApiResponse {#symbol-OpenApiResponse}

A Response Object.

```ts
export type OpenApiResponse = {
    description: string;
    content?: Record<string, OpenApiMediaType>;
};
```

**`description`** What the response means.

**`content`** The body, by media type.

### Usage {#OpenApiResponse-usage}

```ts
const missing: OpenApiResponse = { description: "Unknown book" };
```

## OpenApiSecurityRequirement {#symbol-OpenApiSecurityRequirement}

A Security Requirement Object: the name of a security scheme, and the
scopes it needs (an empty list when it has none).

```ts
export type OpenApiSecurityRequirement = Record<string, string[]>;
```

### Usage {#OpenApiSecurityRequirement-usage}

```ts
const staffOnly: OpenApiSecurityRequirement = { bearerAuth: [] };
```

## OpenApiSecurityScheme {#symbol-OpenApiSecurityScheme}

A Security Scheme Object: a way to authenticate.

```ts
export type OpenApiSecurityScheme = {
    type: "apiKey" | "http" | "mutualTLS" | "oauth2" | "openIdConnect";
    description?: string;
    name?: string;
    in?: "query" | "header" | "cookie";
    scheme?: string;
    bearerFormat?: string;
    flows?: Record<string, unknown>;
    openIdConnectUrl?: string;
};
```

**`type`** The kind of the scheme.

**`description`** What the scheme is.

**`name`** `apiKey`: the name of the header, of the query parameter or of the cookie.

**`in`** `apiKey`: where the key is.

**`scheme`** `http`: the scheme of the `Authorization` header, such as `"bearer"`.

**`bearerFormat`** `http`, with `"bearer"`: how the token is formatted, such as `"JWT"`.

**`flows`** `oauth2`: the flows.

**`openIdConnectUrl`** `openIdConnect`: the URL of the discovery document.

### Usage {#OpenApiSecurityScheme-usage}

```ts
openApi(app, {
      info: INFO,
      servers: [{ url: "https://api.example.com" }],
      securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
      security: [{ bearer: [] }],
      tags: { Users: "The users" },
    });
```

[Usage in extras/openapi/mount_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/extras/openapi/mount_test.ts#L98)

## OpenApiServer {#symbol-OpenApiServer}

A Server Object: where the API is served.

```ts
export type OpenApiServer = {
    url: string;
    description?: string;
    variables?: Record<string, {
        default: string;
        enum?: string[];
        description?: string;
    }>;
};
```

**`url`** The URL of the server. It can have `{variables}`.

**`description`** What the server is.

**`variables`** The variables of the URL.

### Usage {#OpenApiServer-usage}

```ts
openApi(app, {
      info: INFO,
      servers: [{ url: "https://api.example.com" }],
      securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
      security: [{ bearer: [] }],
      tags: { Users: "The users" },
    });
```

[Usage in extras/openapi/mount_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/extras/openapi/mount_test.ts#L98)

## SchemaIo {#symbol-SchemaIo}

The direction of a schema: what a validator takes, or what it gives.

```ts
export type SchemaIo = "input" | "output";
```

### Usage {#SchemaIo-usage}

```ts
function schemaTitle(io: SchemaIo) {
  return io === "input" ? "Request" : "Response";
}
```

## ToJsonSchema {#symbol-ToJsonSchema}

Turns a validator into a JSON Schema: the `toJsonSchema` option.

```ts
export type ToJsonSchema = (validator: ChoValidator, io: SchemaIo) => JsonSchema | undefined;
```

### Usage {#ToJsonSchema-usage}

```ts
const toJsonSchema: ToJsonSchema = (validator, io) =>
  validator instanceof z.ZodType
    ? z.toJSONSchema(validator, { io })
    : undefined;
```

## UI_VERSIONS {#symbol-UI_VERSIONS}

The version of each client `docsPage` loads. They are exact: a page
does not change until the package does.

```ts
export const UI_VERSIONS: {
    readonly swagger: "5.34.1";
    readonly scalar: "1.76.4";
    readonly redoc: "2.5.4";
};
```

**`swagger`** Swagger UI: the package `swagger-ui-dist`.

**`scalar`** Scalar: the package `@scalar/api-reference`.

**`redoc`** Redoc: the package `redoc`.

### Usage {#UI_VERSIONS-usage}

```ts
for (const version of Object.values(UI_VERSIONS)) {
      assert.match(version, /^\d+\.\d+\.\d+$/);
    }
```

[Usage in extras/openapi/page_test.ts](https://github.com/cho-js/cho/blob/30ad35bc87200c47e829d909c582887fc2c055aa/extras/openapi/page_test.ts#L72)

## docsPage {#symbol-docsPage}

The HTML of a page that shows an OpenAPI document.

The page loads a client of OpenAPI and gives it the URL of the document:
Swagger UI (`"swagger"`, the default), Scalar (`"scalar"`) or Redoc
(`"redoc"`), from the jsDelivr CDN, at the version of `UI_VERSIONS`.
For any other client, `ui` is a function that returns the HTML.

The title and the URL are escaped in the page of the three clients. A
function of your own escapes what it writes.

```ts
export function docsPage(options: DocsPageOptions): string;
```

### Usage {#docsPage-usage}

```ts
const html = docsPage({ url: "/docs/openapi.json", ui: "scalar" });
return new Response(html, {
  headers: { "content-type": "text/html; charset=utf-8" },
});
```

## openApi {#symbol-openApi}

Give an application its documentation: mount the OpenAPI document of its
routes, and a page that shows it.

| Route                      | Answers                          |
| -------------------------- | -------------------------------- |
| `GET <route>`              | the page, Swagger UI by default  |
| `GET <route>/openapi.json` | the document                     |

Call it between `ChoWeb.create` and the start of the server: the routes are
mounted with `app.mount`.

- The two routes are in `app.routes`, and not in `app.graph`: so they are
  not in the document.
- They are not under the global prefix of the application: `route` says
  their whole path.
- The document is made at once, and kept: the graph of an application does
  not change. So a mistake throws here, before the server starts, and
  nothing is mounted.
- The page finds the document by itself: its URL is the path of the request
  for the page, with `/openapi.json`.
- No middleware of the application runs for them: they have the
  `middlewares` of the options.

```ts
export function openApi(app: ChoWeb<unknown>, options: OpenApiOptions): void;
```

### Usage {#openApi-usage}

```ts
const app = await ChoWeb.create(AppModule);
openApi(app, { info: { title: "Shop", version: "1.0.0" } });
Deno.serve(app.handler); // GET /docs, GET /docs/openapi.json
```

## openApiDocument {#symbol-openApiDocument}

Make the OpenAPI document of an application, from what the application
declares: its routes, the arguments of its handlers, and its `@Doc`.

It reads the graph of the application (`app.graph`). It does no I/O, calls
no handler and no middleware, and returns a new plain object each time: the
application can change it before it serves it. The document is OpenAPI
3.1.1.

- Each handler is one operation, unless its `@Doc`, the one of its
  controller or the one of its feature says `hidden`.
- The parameters and the request body come from the arguments of the
  handler (`@Args`), with the schemas of their validators.
- The responses come from the `responses` of its `@Doc`.
- A route mounted on the application (`app.mount`) is not in the graph,
  and so not in the document.

A validator gives its schema when it implements Standard JSON Schema (a
Zod schema does). Any other one is given to the `toJsonSchema` option; a
validator with no schema is documented without one.

```ts
export function openApiDocument(app: ChoWeb<unknown>, options: OpenApiDocumentOptions): OpenApiDocument;
```

### Usage {#openApiDocument-usage}

```ts
const app = await ChoWeb.create(AppModule);
const document = openApiDocument(app, {
  info: { title: "Shop", version: "1.0.0" },
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  security: [{ bearer: [] }],
});
```
