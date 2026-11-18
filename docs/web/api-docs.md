# Describe an HTTP API for tooling

After creation, `app.routes` has the full method and path of each route. Use `app.graph` when a tool also needs to know where an argument comes from, whether validation covers the method, or what a response represents.

## Document one operation

```ts
@Doc({ tags: ["catalog"] })
@Controller({ route: "books" })
class Books {
  @Doc({
    summary: "Find a book by catalog ID",
    responses: { 200: { description: "Book record" }, 404: { description: "Unknown ID" } },
  })
  @Get(":id")
  @Args(Param("id"))
  find(id: string) { /* look up the book */ }
}
```

`@Doc` records descriptive metadata. The controller still implements the actual responses. A documentation generator can use descriptions, tags, `deprecated` and `hidden` at feature, controller and method level. Use `summary` and `responses` on methods. Each response can also carry a `schema`. Unknown fields are rejected.

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

A custom argument reader may have no `info`. A validator on a built-in reader describes its input, while `method.validated` indicates coverage by CHO's route validation middleware. A generator can combine these records with `app.routes` and its own schema conversion. Adding `@Doc` alone does not publish a documentation endpoint.
