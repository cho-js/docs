# Describing the API

Everything declared about a handler is kept, and exposed, so that tools can use
it. The first one it is meant for is an **OpenAPI document** of the
application, for Swagger UI and the like.

::: info
Generating the OpenAPI document is not part of `@chojs/web` yet. This page is
about what it will be built from, which is available today on `app.graph`.
:::

## What is already known

Nothing to add for these: they come from what the application declares anyway.

| Known                       | From                                                 | In an OpenAPI document         |
| --------------------------- | ---------------------------------------------------- | ------------------------------ |
| The HTTP method             | `@Get`, `@Post`, …                                   | The operation                  |
| The full path               | The four [route levels](/web/routing)                | The path, `:id` written `{id}` |
| The name                    | The controller and the method: `UsersController.get` | `operationId`                  |
| The controller, the feature | The classes                                          | Default `tags`                 |
| Each argument               | [`@Args`](/web/arguments)                            | `parameters` and `requestBody` |

An argument made by `Param`, `Query`, `Header`, `Body` or `Form` carries its
description:

| Property    | Holds                                                        |
| ----------- | ------------------------------------------------------------ |
| `source`    | `"param"`, `"query"`, `"header"`, `"body"` or `"form"`       |
| `key`       | The key, when there is one                                   |
| `validator` | The validator, when there is one: the schema of the argument |

| Argument           | In an OpenAPI document                                           |
| ------------------ | ---------------------------------------------------------------- |
| `Param("id", v)`   | A parameter `in: path`, required, with the schema of `v`         |
| `Query("page", v)` | A parameter `in: query`, with the schema of `v`                  |
| `Query(v)`         | One `in: query` parameter for each property of the schema of `v` |
| `Header("x", v)`   | A parameter `in: header`                                         |
| `Body(v)`          | The `requestBody`, `application/json`, with the schema of `v`    |
| `Body("name", v)`  | A property `name` of an `application/json` request body          |
| `Form(v)`          | The `requestBody`, `application/x-www-form-urlencoded`           |

So the more a handler declares with `@Args` and validators, the more the
document can say. An argument that is a function of your own has no
description, and is not part of the document.

A validator is kept as it was given. `@chojs/web` does not turn it into a JSON
Schema: the generator will take that function from the application (for zod,
`z.toJSONSchema`).

## `@Doc`: what the code cannot tell

A summary, a description, tags, the responses: declare them with `@Doc`, on a
handler, a controller or a feature module. It changes nothing in how a request
is handled.

```ts
import { Args, Controller, Doc, Get, Param } from "@chojs/web";

@Doc({ tags: ["users"], description: "The users of the application" })
@Controller({ route: "users" })
class UsersController {
  @Doc({
    summary: "Find a user",
    responses: {
      200: { description: "The user", schema: User },
      404: { description: "No such user" },
    },
  })
  @Get(":id")
  @Args(Param("id"))
  get(id: string) {
    return this.store.find(id);
  }
}
```

| Option        | On                                 | Holds                                                       |
| ------------- | ---------------------------------- | ----------------------------------------------------------- |
| `summary`     | A handler                          | One line about the operation                                |
| `description` | A handler, a controller, a feature | A longer text                                               |
| `tags`        | A handler, a controller, a feature | The tags of the handlers under it                           |
| `deprecated`  | A handler, a controller, a feature | `true` when it should no longer be used                     |
| `responses`   | A handler                          | By status: a `description`, and a `schema` (a validator) of the body |
| `hidden`      | A handler, a controller, a feature | `true` to leave it out of the documentation                 |

- An unknown option throws when the decorator is called, so a misspelled one
  cannot pass silently.
- `summary` and `responses` are for a handler: on a class they throw.
- A class or a method has one `@Doc`.

## Reading it

It is all on the graph of the application, `app.graph`
([The application](/web/application#what-the-application-exposes)):

```ts
const app = await ChoWeb.create(App);

for (const feature of app.graph.features) {
  feature.doc; //            what @Doc declares on the module
  for (const controller of feature.controllers) {
    controller.doc; //       what @Doc declares on the controller
    for (const method of controller.methods) {
      method.method; //      "GET"
      method.route; //       ":id", relative to the controller
      method.name; //        "get"
      method.args; //        the arguments, in order
      method.doc; //         what @Doc declares on the handler
      method.validated; //   whether validate() covers the handler
    }
  }
}
```

| Node            | Has                                                                                  |
| --------------- | ------------------------------------------------------------------------------------ |
| `FeatureRef`    | `doc`                                                                                |
| `ControllerRef` | `doc`                                                                                |
| `MethodRef`     | `args`: each with `info.source`, `info.key` and `info.validator`; `doc`; `validated` |

`doc` is an empty object when there is no `@Doc`, and `args` an empty list when
there is no `@Args`. `app.routes` has the full path of each handler.
