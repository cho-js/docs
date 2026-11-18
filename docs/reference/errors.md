# Diagnose an application failure

Identify the operation that failed before choosing where to handle it. A rejected `create` call, an unmatched HTTP request and a failed message delivery each have a different owner. Diagnostic text helps locate the declaration. Prefer exit codes, statuses and your own error types for programmatic decisions.

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
| `Cannot resolve` a dependency in a module | Start at the module that declares the consumer. Check its providers and the exports of direct imports. Compare token identity |
| A token is ambiguous | Find distinct declarations with the same token exported by two imports. Share the original declaration, use separate tokens or choose a local provider |
| A class is not injectable | Use `@Injectable()` for class providers and put controllers in the module's `controllers` list |
| A circular import or dependency | Follow the reported chain. Move shared values into a module that both consumers can import without depending on each other |
| `Failed to create … in module …` | Read `error.cause` for the factory or constructor exception. The failed declaration is cached within that injector |
| An override matches nothing | Replace an existing provider token and import the exact token used in its declaration |
| `The injector is disposed` | Check that the owner outlives every consumer. Create a fresh application for the next test |
| `AggregateError` during release | Inspect `error.errors` for the failing declaration and its cause. Other resources are still given a chance to dispose |

[Module scopes](/di/modules) · [Provider lifetimes](/di/lifecycle)

## HTTP

| Symptom | Action |
| --- | --- |
| Invalid route at definition or startup | Use `""` for the root or relative segments like `"books/:id"`. Remove leading/trailing slashes and wildcards |
| Duplicate route | Inspect complete paths and verbs. Parameter names are ignored when detecting a duplicate |
| `ChoLinker needs the URL Pattern API` | Check `typeof URLPattern` in the serving runtime or use a Hono linker |
| A validated argument arrives as raw text | Ensure `validate()` covers the route. Inspect `method.validated` or enable `cho:web` |
| Middleware returned no response | Return a `Response` or call `next()` exactly once |
| A `@Catch` logs an error but the client receives `500` | Return an explicit `Response` to handle the error. Logging alone leaves it unhandled |
| A `404` has the adapter's default body | The route was never selected. Compare the requested verb and full path with `app.routes` |
| An event stream ends with status `200` after a producer error | Headers were already sent. Handle expected failures before returning the iterator and trace producer failures separately |

[Routing](/web/routing) · [Validation](/web/validation) · [Route errors](/web/error-handling)

## Messages and Kafka

| Symptom | Action |
| --- | --- |
| Empty or duplicate topic | Inspect the assembled topic and declaring module. Register each subscription once |
| `start` reports no linker | For manual delivery call `handle` directly. For a broker attach a linker during creation |
| `no handler for the topic` | Compare the full literal topic with `app.routes`, including the deployment prefix |
| The consumer acknowledges a record you expected to retry | Look for a normally returning handler, a middleware that skips `next()`, or `@Catch` returning `true` |
| Retries stop intake | Check retry exhaustion, dead-letter setup, producer errors and `onFatal`. The failed offset can remain uncommitted |
| An existing consumer group ignores `from: "earliest"` | The adapter resumes committed offsets. `from` controls the fallback for a group without one |

[Delivery outcomes](/message/error-handling) · [Kafka policy](/message/kafka)

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
