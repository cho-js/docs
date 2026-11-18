# Trace an entry point from declaration to dispatch

Use this page when debugging a new adapter or extending CHO. A provider wiring failure, a duplicate route and an exception inside a handler arise at different stages, even if they mention the same controller.

## 1. Record declarations

Class decorators record providers, constructor dependencies and module options. Method decorators attach transport-specific metadata. CHO's decorator helpers handle standard and legacy conventions. Handlers keep ordinary instance methods and the metadata describes how the runner can reach them.

## 2. Resolve ownership

Starting at the root, the metadata graph normalizes declarations. The dependency graph computes what each module can see and links each dependency to its owning declaration. A missing token, ambiguous export or circular dependency stops graph construction.

At this point CHO can validate wiring before running constructors. During resolution the injector caches the creation promise per declaration. Concurrent consumers wait for the same factory result. A provider depends on the declaration visible in its own module.

## 3. Build the transport-specific application

| Package | Output of compilation | First dispatch |
| --- | --- | --- |
| Web | A tree of HTTP features and a flat list of complete method/path routes | The linker matches a request and calls its composed route |
| Command | A single-command or named-action graph and a pipeline per command | The parser selects an action. The pipeline resolves its dependencies lazily |
| Message | A topic graph and a tracked handle function per complete topic | Manual delivery or the adapter invokes the route. Its promise determines the delivery outcome |

`ChoWeb.create` and `ChoMessage.create` initialize their injectors eagerly. HTTP or topic compilation can still fail after provider initialization. Those factories clean up created instances on failure. `ChoMessage.from` uses another owner's injector and leaves its lifetime to that owner.

## 4. Dispatch within one context

A matched operation creates a fresh context with its own state map. The compiled middleware chain surrounds the endpoint. The HTTP endpoint evaluates request arguments and converts the method's return value to a response. The command pipeline produces a status. A message pipeline tracks completion and failure. Keeping the context local lets a single provider instance serve overlapping operations.

## Locate the implementation

Packages in `extras/` consume framework internals such as the declaration graph and are maintained alongside the framework. For example, `extras/openapi` walks `app.graph` to generate an API contract, then uses `app.mount` to serve it. The two mounted endpoints appear in the runtime route list while the graph still describes the original controllers. Applications opt in by installing the extra. [Generate an OpenAPI document](/web/openapi)

The package specifications sit beside the graph builders and tests. Follow the package closest to the failing boundary. [Core](https://github.com/cho-js/cho/blob/main/core/specs.md) · [Web](https://github.com/cho-js/cho/blob/main/web/specs.md) · [Command](https://github.com/cho-js/cho/blob/main/command/specs.md) · [Message](https://github.com/cho-js/cho/blob/main/message/specs.md)
