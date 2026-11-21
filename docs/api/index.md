# Public API and examples

Choose a guide to build a feature, or open the import path from your source file to look up an individual declaration. Each symbol has a usage example. Controller methods and option objects are shown in context-sized fragments. Source excerpts link to the surrounding implementation or fixture. Start with the linked guides for complete applications. Shared exports lead to the same declaration from every package that exposes it.

## Application APIs

| Import path | Start with a guide | Exports |
| --- | --- | ---: |
| [`@chojs/web`](/api/web) | [Build and dispatch HTTP routes](/web/quick-start) | 102 |
| [`@chojs/command`](/api/command) | [Launch a CLI or embed a command](/command/application) | 34 |
| [`@chojs/message`](/api/message) | [Publish, subscribe and request a reply](/message/contracts) | 83 |
| [`@chojs/core`](/api/core) | [Construct and share services](/di/overview) | 51 |

## Adapters and OpenAPI

| Import path | Start with a guide | Exports |
| --- | --- | ---: |
| [`@chojs/vendor-cho`](/api/vendor-cho) | [Apply an HTTP request policy](/adapters/middlewares) | 26 |
| [`@chojs/vendor-hono`](/api/vendor-hono) | [Use Hono middleware in CHO](/adapters/hono) | 10 |
| [`@chojs/vendor-fastify`](/api/vendor-fastify) | [Use native Fastify plugins and hooks](/adapters/fastify) | 12 |
| [`@chojs/vendor-nats`](/api/vendor-nats) | [Request a reply or consume durable events](/message/nats) | 33 |
| [`@chojs/vendor-kafka`](/api/vendor-kafka) | [Consume partitioned events](/message/kafka) | 17 |
| [`@chojs/openapi`](/api/openapi) | [Give clients an API description](/web/openapi) | 26 |

## Developer tools

| Package or entry point | Guide and API examples |
| --- | --- |
| `@chojs/cli` executable | [Generate a workspace and configure cho.json](/guide/create-workspace) |
| `@chojs/dev` | [List endpoints, inspect dependencies and mount the graph viewer](/advanced/inspect-application) |
| `@chojs/prompt` | [Ask and validate terminal questions](/command/prompts) |
| `@chojs/prompt/testing` | [Script key presses and inspect the screen](/command/prompts#script-a-terminal) |


## Listeners, graphs and extension utilities

| Import path | Start with a guide | Exports |
| --- | --- | ---: |
| [`@chojs/core/di`](/api/core-di) | [Implement decorators and resolve handlers](/advanced/cho-module) | 69 |
| [`@chojs/core/utils`](/api/core-utils) | [Compose middleware and inspect the runtime](/advanced/core) | 22 |
| [`@chojs/core/utils/test_utils`](/api/core-utils-test_utils) | [Exercise a framework extension](/advanced/cho-module) | 11 |
| [`@chojs/web/serve`](/api/web-serve) | [Start and drain a network listener](/recipes/shutdown) | 13 |
| [`@chojs/web/linker`](/api/web-linker) | [Connect an HTTP router](/adapters/custom) | 3 |
| [`@chojs/web/graph`](/api/web-graph) | [Inspect compiled HTTP operations](/web/api-docs) | 21 |
| [`@chojs/message/linker`](/api/message-linker) | [Connect a broker](/message/adapters) | 12 |
| [`@chojs/message/graph`](/api/message-graph) | [Inspect compiled subscriptions](/message/application) | 17 |

