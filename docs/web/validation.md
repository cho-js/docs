# Validate and transform input

A request body or query parameter starts as external data. Give its reader a validator with a `parse(value)` method, then put `validate()` around the route. The value returned by `parse` becomes the method argument.

## Parse a page number

```ts
import {
  Args, Controller, Get, Middlewares, Query, validate,
} from "@chojs/web";

const pageNumber = {
  parse(value: unknown): number {
    if (value === undefined) return 1;
    if (typeof value !== "string" || !/^[1-9][0-9]*$/.test(value) ||
        !Number.isSafeInteger(Number(value))) {
      throw new Error("page must be a positive integer");
    }
    return Number(value);
  },
};

@Middlewares(validate())
@Controller({ route: "books" })
class Books {
  @Get("")
  @Args(Query("page", pageNumber))
  list(page: number) { return { page }; }
}
```

| Request | Status | Result |
| --- | --- | --- |
| `GET /books` | 200 | `{"page":1}` |
| `GET /books?page=2` | 200 | `{"page":2}` |
| `GET /books?page=zero` | 400 | `source` is `"query"` and `key` is `"page"` |

## Place the middleware

Attach `validate()` to a method, controller or feature module. An outer authentication middleware can reject a request before CHO reads its arguments. Without validation middleware, built-in readers still extract data, but their validators are skipped. A TypeScript annotation or `Body<T>()` alone performs no runtime check.

Async `parse` methods are supported. A parser should return the normalized value or throw. Errors from built-in input readers, such as malformed JSON, also reach the validation middleware. Exceptions thrown by the handler itself go through [route error handling](/web/error-handling).

## Set the error format

```ts
@Middlewares(validate({
  onInvalid: ({ source, key }) =>
    Response.json({ field: key ?? source, message: "Invalid input" }, { status: 422 }),
}))
```

The default body contains `error: "Invalid request"`, `source`, optional `key` and an `issues` array. CHO preserves an exception's `issues` array when available. An `onInvalid` hook returning `undefined` selects this default.

## Validate an entire document

A field reader such as `Body("title", validator)` works for an independent field. Use a validator on `Body` itself when several fields must agree. This example normalizes whitespace and validates the relationship between two quantities.

```ts
import type { ChoWebValidator } from "@chojs/web";

type Stock = { isbn: string; copies: number; reserved: number };

const stock: ChoWebValidator<Stock> = {
  parse(input) {
    if (typeof input !== "object" || input === null) throw new Error("Expected stock data");
    const { isbn, copies, reserved } = input as Record<string, unknown>;
    if (typeof isbn !== "string" || !isbn.trim()) throw new Error("Supply an ISBN");
    if (typeof copies !== "number" || !Number.isSafeInteger(copies) || copies < 0) {
      throw new Error("copies must be a non-negative integer");
    }
    if (typeof reserved !== "number" || !Number.isSafeInteger(reserved) ||
        reserved < 0 || reserved > copies) {
      throw new Error("reserved must be between zero and copies");
    }
    return { isbn: isbn.trim(), copies, reserved };
  },
};
```

Attach `@Args(Body(stock))` to a POST handler under `@Middlewares(validate())`. A request with two copies and three reservations now fails before the write. A schema library can provide the same `parse` contract. If its asynchronous API is named `parseAsync`, adapt it as `{ parse: (value) => schema.parseAsync(value) }`.
