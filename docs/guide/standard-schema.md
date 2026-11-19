# Use one schema at the application boundary

Web and Message accept Standard Schema V1 validators, including compatible versions of Zod, Valibot and ArkType. A schema can validate, transform or do both. CHO also accepts existing objects with a synchronous or asynchronous `parse(value)` method. When a validator provides both interfaces, CHO chooses `~standard.validate`.

## Convert a query string before the handler runs

This example uses Zod 4. The client sends digits in a query string and the handler receives a number. Register the controller in a web module as in the [HTTP quick start](/web/quick-start).

```ts
import { z } from "zod";
import {
  Args, type ChoInput, type ChoOutput, Controller, Get, Middlewares, Query, validate,
} from "@chojs/web";

const Page = z.string().regex(/^[1-9]\d*$/).transform(Number);
type PageText = ChoInput<typeof Page>;    // string
type PageNumber = ChoOutput<typeof Page>; // number

@Middlewares(validate())
@Controller({ route: "books" })
class Books {
  @Get("")
  @Args(Query("page", Page))
  list(page: PageNumber) { return { page }; }
}
```

With `?page=2`, the response contains `{"page":2}`. With `?page=zero`, the reader reports a query issue and the default validation policy returns HTTP 400. Place `validate()` on the method, controller or declaring feature. Without it, the reader supplies its raw value. The same rule applies to message argument readers. [Web validation](/web/validation) · [Message validation](/message/arguments)

## Separate invalid input from a validator failure

| What the validator does | What CHO does |
| --- | --- |
| Standard Schema returns `{ value }` | Passes the transformed value downstream |
| Standard Schema returns `{ issues }` | Normalizes each issue into a message and optional path, then invokes the invalid-input policy |
| Standard Schema throws or its promise rejects | Propagates the exception through ordinary error handling. A dependency outage inside a validator can therefore be handled as a service failure |
| A legacy `parse` method throws | Treats the input as invalid, normalizes the issues and makes the original exception available as `invalid.error` |

In `onInvalid`, read `issues` for every validator. Paths use string field names and numeric array indexes, for example `["items", 0, "isbn"]`. A root issue can omit the path. Use the optional `error` for diagnostics when parsing actually threw. Keep raw exceptions out of public responses.

## Upgrade an existing application

Replace imports of `ChoWebValidator<T>` and `ChoMessageValidator<T>` with `ChoValidator<T>` from core, web or message. Use `ChoParseValidator<T>` when your own code specifically needs to invoke `parse`. Existing parse-based objects need no wrapper. Protocol types put the input first (`StandardSchemaV1<Input, Output>`), while the convenience type puts the output first (`ChoValidator<Output, Input>`).

For contracts, the client sends the request schema's input and receives the reply schema's output. Enable validation on the subscriber to deliver transformed requests to its method. For OpenAPI, a validator can also implement Standard JSON Schema conversion or the application can supply a converter. Runtime validation and document generation use distinct hooks. [Contract example](/message/contracts#use-different-types-on-the-wire-and-in-the-handler) · [OpenAPI conversion](/web/openapi) · [Shared validator types](/api/core#symbol-ChoValidator)
