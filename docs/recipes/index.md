# Recipes

A recipe starts from something you want to do, and shows how to do it with what
`@chojs/web` already has. None of them needs an API of its own: a handler gets
the platform's `Request` and returns the platform's `Response`, so what the
platform can do, a handler can do.

| Recipe                                                    | Shows how to                                                     |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| [Stream a response](/recipes/streaming)                   | Send a body as it is produced: rows, lines of JSON, another stream |
| [Send a file to download](/recipes/downloads)             | Answer with a file, made in memory or read from disk             |
| [Receive an uploaded file](/recipes/uploads)              | Read the files of a form, or write a large body straight to disk |
| [Forward a request to another server](/recipes/proxy)     | Pass a request on, and its answer back                           |
| [Shut down gracefully](/recipes/shutdown)                 | Stop a server without dropping the requests it is answering      |

Every recipe has the same parts: the shortest code that works, its variations,
and **what to know**: the traps, and where the runtimes differ.

The code of the recipes was run on Deno, Node.js and Bun. Where a runtime
behaves differently, the recipe says so.
