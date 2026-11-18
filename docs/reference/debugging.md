# Trace routing, injection and delivery

Select a debug context before creating the application. CHO writes its diagnostics to stderr, which leaves a command's stdout available for its output.

| Context | Use it to inspect |
| --- | --- |
| `cho:di` | Module scopes, resolutions, provider creation and failures |
| `cho:web` | Registered method/path pairs, startup errors and route exceptions |
| `cho:openapi` | OpenAPI document generation and validators whose schemas could not be converted |
| `cho:command` | Discovered actions, selected command, duration and exit status |
| `cho:message` | Complete topics, graph creation and delivery failures |
| `cho:kafka` | Subscription, retry, dead-letter handling, commit failures and shutdown |

## Enable a focused trace

For the HTTP quick start, run one of the following in a POSIX shell. The startup log should include `GET /api/books/:id` and `Books.find`.

::: code-group

```sh [Deno]
CHO_DEBUGLOG=cho:web,cho:di deno run --allow-env=CHO_DEBUGLOG --allow-net main.ts
```

```sh [Node.js]
CHO_DEBUGLOG=cho:web,cho:di npx tsx main.ts
```

```sh [Bun]
CHO_DEBUGLOG=cho:web,cho:di bun run main.ts
```

:::

Use `CHO_DEBUGLOG='cho:*'` for matching context names or `CHO_DEBUG=1` for all contexts. On a host that supplies environment bindings directly, call `set_env(bindings)` from `@chojs/core/utils` before creating the application. The environment source is process-wide and a logger reads the setting when constructed.

## Use the trace to isolate a failure

1. **An HTTP method never runs.** Find its full method and path in `cho:web`. Compare the verb, application prefix and ordering of literal and parameter routes. With an unmatched path the adapter answers before route middleware.
2. **A dependency cannot be created.** Find the first failure in `cho:di`. The named module is where the dependency must be visible. Inspect the original error's `cause` if a factory failed.
3. **A Kafka message appears twice.** Inspect `cho:message` for handler failures and `cho:kafka` for retries or commit errors. A successful handler can still precede a failed offset commit.
4. **A CLI returns a surprising status.** Check which action `cho:command` selected. Then compare the command, middleware and error-handler return values with the [exit-code table](/command/errors).

For setup failures grouped by phase, see [error diagnostics](/reference/errors).
