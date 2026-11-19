# Bind request data to method arguments

[`@Args`](/api/web#symbol-Args) describes a method's inputs in parameter order. For `PUT /books/42?notify=yes`, the following handler receives `"42"`, `"yes"` and the parsed request body. A final optional context parameter still gives access to request-local state.

```ts
@Put(":id")
@Args(Param("id"), Query("notify"), Body())
update(id: string, notify: string | undefined, body: unknown, ctx: ChoWebContext) {
  return { id, notify, body, path: ctx.url.pathname };
}
```

## Choose a reader

| Reader | Whole source | Named value |
| --- | --- | --- |
| `Param` | Decoded path parameters | String. CHO checks the name against the full path during creation |
| `Query` | Query keys mapped to first values | First value or `undefined` |
| `Header` | Request headers with lowercase names | Case-insensitive lookup or `undefined` |
| `Body` | Parsed JSON, or `undefined` for empty input | Object property or `undefined` |
| `Form` | URL-encoded fields mapped to first values | First field value or `undefined` |

Call a reader with no arguments for the whole source. Pass a string key for one field. To transform the result, pass a validator as the last argument and enable [validation middleware](/web/validation).

## Work with repeated values and bodies

Use `ctx.url.searchParams.getAll("tag")` for every query value. For multipart forms, use `await ctx.req.formData()`. [`Form`](/api/web#symbol-Form) parses URL-encoded text. The chosen body reader determines how CHO interprets the body, independently of the request's content type.

Multiple [`Body`](/api/web#symbol-Body) arguments can use the same cached JSON parse. `Body` and `Form` share the underlying text read and cache their own parsed representations. Choose the reader that matches the input your endpoint accepts. Calling `req.json()` yourself after `Body()` has already consumed the stream also fails.

## Define a custom reader

```ts
import { Args, Controller, Get, type ChoWebContext } from "@chojs/web";

const tags = (ctx: ChoWebContext) => ctx.url.searchParams.getAll("tag");

@Controller()
class Search {
  @Get("search")
  @Args(tags)
  search(values: string[]) { return { tags: values }; }
}
```

Readers may return promises. CHO evaluates them sequentially after route middleware calls through. An earlier failure prevents later reads and skips the handler. TypeScript checks the declared input types. Two parameters with the same type can still be accidentally transposed.

## Choose between a named field and a context

For an endpoint that only needs the book ID, use `@Args(Param("id"))`. If it also uses a response negotiation header, add a header reader in the next position. Keep the trailing request context for operations that need the original Fetch request, such as forwarding it.
