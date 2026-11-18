# Describe an HTTP API for tooling

`@Doc` records what clients need to know beyond the route and its argument readers. The [OpenAPI extra](/web/openapi) combines these declarations into a document, and can serve it with a browser UI. You can also read the metadata directly from `app.graph`.

## Document one operation

```ts
@Doc({ tags: ["catalog"] })
@Controller({ route: "books" })
class Books {
  @Doc({
    operationId: "findBook",
    summary: "Find a book by catalog ID",
    responses: { 200: { description: "Book record" }, 404: { description: "Unknown ID" } },
  })
  @Get(":id")
  @Args(Param("id"))
  find(id: string) { /* look up the book */ }
}
```

The default operation ID is the controller class and method name, such as `Books.find`. Set `operationId` when a client should keep the same operation name through a refactor. Each visible operation needs a unique ID.

| `@Doc` field | How `@chojs/openapi` uses it |
| --- | --- |
| `summary`, `operationId`, `responses` | Method-only options. A response entry accepts `description`, a validator as `schema`, and `contentType` for a media type such as `"text/csv"` |
| `description` | The method's description becomes the operation description |
| `tags` | Tags from feature, controller and method accumulate, with duplicates removed. Without explicit tags the controller supplies the tag |
| `hidden`, `deprecated` | A true value on any enclosing declaration hides the operation or marks it deprecated in the document. The route still serves requests |
| `security` | The nearest method, controller or feature declaration overrides the document default. `security: []` describes a public operation |

Register every referenced scheme in `openApi`'s `securitySchemes`, for example `{ bearer: { type: "http", scheme: "bearer" } }` for `@Doc({ security: [{ bearer: [] }] })`. A missing scheme or duplicate operation ID stops document generation. Set document-wide `security`, server URLs (`servers`), tag descriptions (`tags`) and a further documentation URL (`externalDocs`) in the generator options.

## How inputs and responses become OpenAPI entries

| Handler declaration | Generated contract |
| --- | --- |
| Path segment `:id` | Required `in: path` parameter, even when no reader consumes it |
| `Query("page", v)` or `Header("x-branch", v)` | Named parameter with the validator's input schema when available. A keyed query or header is optional in the document |
| `Query(v)`, `Header(v)` or `Param(v)` | One parameter per property in the validator's object schema, with required properties taken from that schema |
| `Body(v)` or `Form(v)` | Required request body, as `application/json` or `application/x-www-form-urlencoded`. Keyed readers become properties of that media type's object |
| `@Sse` with no declared success response | `200` with `text/event-stream` |
| `validate()` covering a reader with a validator | Adds a `400` response unless one was explicitly described |

For an ordinary handler without a declared `2xx` response, the generator supplies `200`. Document a returned `201` or `204` explicitly. Custom argument functions with no source metadata are skipped.

The generator asks validators implementing Standard JSON Schema for their input schema on arguments and output schema on responses. For other validators, pass `toJsonSchema(validator, io)` to the generator. Return a JSON Schema for the validators you recognize and `undefined` for the rest. Reusable definitions are moved into `components.schemas` and their references are rewritten. If a conversion is unavailable, the operation is still documented. Enable `CHO_DEBUGLOG=cho:openapi` to locate the missing schema.

## Inspect the declarations

```ts
for (const feature of app.graph.features) {
  for (const controller of feature.controllers) {
    for (const method of controller.methods) {
      console.log(method.method, method.name, method.doc.summary);
      for (const arg of method.args) {
        console.log(arg.info?.source, arg.info?.key, method.validated);
      }
    }
  }
}
```

A custom argument reader may have no `info`. `method.validated` indicates whether CHO's validation middleware covers the method. Use `app.routes` for a complete runtime inventory, including endpoints added with [`app.mount`](/web/mounted-routes).
