# Diagnose an application failure

Identify the operation that failed before choosing where to handle it. A rejected `create` call, an unmatched HTTP request and a failed message delivery each have a different owner.

## Match a framework error by code

A `ChoError` has a stable string `code`. Log the message for the person fixing the problem and match the code in tests and recovery logic. Import `ChoError` and `isChoError` from `@chojs/core` or the web, command or message entry point. If your project is pinned to 3.4.0, see the [development setup](/guide/getting-started#run-examples-against-the-development-version). The guard also recognizes errors created by another copy of the package.

```ts
import { ChoWeb, isChoError } from "@chojs/web";

export async function createApp() {
  try {
    return await ChoWeb.create(Library);
  } catch (error) {
    if (isChoError(error, "CHO_WEB_DUPLICATE_ROUTE")) {
      console.error("Check controllers for overlapping paths and verbs.", error.message);
    }
    throw error;
  }
}
```

Use `isChoError(error)` to read the code when several failures share one reporting path. An exception from your code may reach you directly or as the `cause` of a framework error. A thrown [`HttpError`](/web/error-handling) describes a response to a client. A [command exit code](/command/errors) is the numeric status returned to the process.

| Package | Exported code type | Example |
| --- | --- | --- |
| `@chojs/core` | `ChoCoreErrorCode` | `CHO_CORE_UNRESOLVED_DEPENDENCY` |
| `@chojs/web` | `ChoWebErrorCode` | `CHO_WEB_DUPLICATE_ROUTE` |
| `@chojs/command` | `ChoCommandErrorCode` | `CHO_COMMAND_DUPLICATE_ACTION` |
| `@chojs/message` | `ChoMessageErrorCode` | `CHO_MESSAGE_UNKNOWN_TOPIC` |
| `@chojs/openapi` | `ChoOpenApiErrorCode` | `CHO_OPENAPI_UNKNOWN_SECURITY_SCHEME` |
| `@chojs/vendor-cho` | `ChoVendorErrorCode` | `CHO_VENDOR_INVALID_OPTION` |
| `@chojs/vendor-hono` | `ChoHonoErrorCode` | `CHO_HONO_WRONG_ADAPTER` |
| `@chojs/vendor-fastify` | `ChoFastifyErrorCode` | `CHO_FASTIFY_MOUNT_TOO_LATE` |
| `@chojs/vendor-kafka` | `ChoKafkaErrorCode` | `CHO_KAFKA_NO_DEAD_LETTER` |
| `@chojs/vendor-nats` | `ChoNatsErrorCode` | `CHO_NATS_NOT_STARTED` |

## When errors happen

| Failure occurs during… | Inspect first | Recovery |
| --- | --- | --- |
| Importing a source file | Decorator target and options | Correct the declaration or compiler configuration |
| Creating the application | Module scope, duplicate names, linker, eager factories | Correct the graph or configuration and create a fresh application |
| Executing a route, command or subscription | Input, middleware and selected error policy | Handle the failure at the relevant entry point |
| Closing a resource | Disposer and nested errors | Inspect individual causes in the cleanup error |

## Dependency injection

| Diagnostic or symptom | What to check |
| --- | --- |
| `CHO_CORE_UNRESOLVED_DEPENDENCY` | Start at the module that declares the consumer. Check its providers and the exports of direct imports. Compare token identity |
| `CHO_CORE_AMBIGUOUS_TOKEN` | Find distinct declarations with the same token exported by two imports. Share the original declaration, use separate tokens or choose a local provider |
| A class is not injectable | Use `@Injectable()` for class providers and put controllers in the module's `controllers` list |
| A circular import or dependency | Follow the reported chain. Move shared values into a module that both consumers can import without depending on each other |
| `CHO_CORE_CREATE_FAILED` | Read `error.cause` for the factory or constructor exception. The failed declaration is cached within that injector |
| An override matches nothing | Replace an existing provider token and import the exact token used in its declaration |
| `The injector is disposed` | Check that the owner outlives every consumer. Create a fresh application for the next test |
| `AggregateError` during release | Match `CHO_CORE_DISPOSE_FAILED` on individual entries in `error.errors` and inspect the cause of each one. Other resources are still given a chance to dispose |

[Module scopes](/di/modules) · [Provider lifetimes](/di/lifecycle)

## HTTP

| Symptom | Action |
| --- | --- |
| Invalid route at definition or startup | Use `""` for the root or relative segments like `"books/:id"`. Remove leading/trailing slashes and wildcards |
| Duplicate route | Inspect complete paths and verbs. Parameter names are ignored when detecting a duplicate |
| `app.mount` fails during registration | Check existing and proposed method/path pairs. Mount before Hono's first request or Fastify's readiness check |
| OpenAPI generation rejects an operation ID or security requirement | Give each visible operation a unique ID and declare every referenced scheme in `securitySchemes`. [API descriptions](/web/api-docs) |
| `ChoLinker needs the URL Pattern API` | Check `typeof URLPattern` in the serving runtime or use a Hono linker |
| A validated argument arrives as raw text | Ensure `validate()` covers the route. Inspect `method.validated` or enable `cho:web` |
| Middleware returned no response | Return a `Response` or call `next()` exactly once |
| A `@Catch` logs an error but the client receives `500` | Return an explicit `Response` to handle the error. Logging alone leaves it unhandled |
| A `404` has the adapter's default body | The route was never selected. Compare the requested verb and full path with `app.routes` |
| An event stream ends with status `200` after a producer error | Headers were already sent. Handle expected failures before returning the iterator and trace producer failures separately |

[Routing](/web/routing) · [Validation](/web/validation) · [Route errors](/web/error-handling)

## Message consumers and brokers

| Symptom | Action |
| --- | --- |
| Empty or duplicate topic | Inspect the assembled topic and declaring module. Register each subscription once |
| `start` reports no linker | For manual delivery call `handle` directly. For a broker attach a linker during creation |
| `no handler for the topic` | Compare the full literal topic with `app.routes`, including the deployment prefix |
| The consumer acknowledges a record you expected to retry | Look for a normally returning handler, a middleware that skips `next()`, or `@Catch` returning `true` or a fallback reply |
| `CHO_MESSAGE_INVALID_REPLY` | Check the payload's encoding. If you returned a `ChoMessageReply`, check for nested replies, empty header names or non-string header values. [Reply formats](/message/replies) |
| Retries stop intake | Check retry exhaustion, dead-letter setup, producer errors and `onFatal`. The failed offset can remain uncommitted |
| An existing consumer group ignores `from: "earliest"` | The adapter resumes committed offsets. `from` controls the fallback for a group without one |
| `CHO_NATS_NOT_STARTED` | Await `app.start()` before reading the NATS connection from `app.linked.instance` |
| `CHO_MESSAGE_INVALID_MESSAGE` | Inspect `error.cause` and the argument reader or contract request validator. An unhandled validation failure goes straight to the broker's invalid-message policy |
| `CHO_MESSAGE_UNEXPECTED_REPLY` | Check the responding service's JSON encoding and the reply validator in the shared contract |
| `CHO_NATS_STREAM_NOT_FOUND` | Enable JetStream and provision every named stream before starting the application |
| `CHO_NATS_DUPLICATE_CONSUMER` | Inspect the durable names derived from the queue and route. Dots become underscores, so different topics can produce the same consumer name |
| `CHO_NATS_REPLY_FAILED` | Check the server's payload limit and the reply headers. Use printable ASCII header names without spaces or colons, and single-line values |

[Delivery outcomes](/message/error-handling) · [NATS request failures](/message/nats#map-a-failure-for-the-caller) · [Kafka policy](/message/kafka)

## Command line

| Symptom | Action |
| --- | --- |
| `No @Main or @Action methods found` | Register a decorated method's controller in a reachable module |
| Mixed `@Main` and `@Action` or duplicate actions | Choose one mode across the whole module graph. Give each action a unique name |
| An unknown action exits with `1` | Pass only the argument words to `run`. Compare with global `--help` |
| A flag consumes the action name or loses leading zeros | Declare value-taking global flags in `parseOptions` and identifier values as `string` |
| A command failure produces `2` unexpectedly | Inspect the selected error handler for a thrown exception, as well as explicit code `2` returns |
| Help works but executing the action fails | Inspect the lazy provider or middleware construction for that action |

[Command selection](/command/commands) · [Flag parsing](/command/flags) · [Debug contexts](/reference/debugging)
