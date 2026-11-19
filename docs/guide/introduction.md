# How CHO applications fit together

Think of a library that receives shipments, serves its catalog over HTTP and prints shelf labels from a terminal. All three operations need a catalog. Only one needs to know what an HTTP request looks like. In CHO, **providers implement the work, controllers translate inputs, and modules decide which dependencies those controllers can use**. An application connects those declarations to a particular way of invoking the work.

## Follow a book lookup from declaration to response

<<< @/examples/web/app.ts

1. **Declare the boundary.** `Library` owns the `Books` controller. The standard TypeScript decorators record the declarations as the classes are defined. A constructor dependency is listed explicitly, so the injector can resolve it without reflecting on emitted parameter types.
2. **Create the application.** Calling `createApp()` starts from the root module. CHO reads its imports, checks the dependency graph and composes the application prefix, controller route and method path. The HTTP linker registers `GET /api/books/:id` with the router.
3. **Dispatch one input.** A Fetch request for `/api/books/42` matches this route. Its middleware runs around the handler. `@Args(Param("id"))` reads the captured string and supplies it as the first argument of `find`. The returned object becomes a JSON response.
4. **Give the application an owner.** A server can receive thousands of requests through the same handler. Its owner closes the application when it has finished serving. The [shutdown recipe](/recipes/shutdown) shows how to drain requests before releasing providers.

To connect this endpoint to a real catalog, move the lookup into an injectable class, register it in the module and list it in the controller's dependencies. Export that provider when a second module needs it. A request ID, a parsed flag and a message key belong to their individual invocations. Keep those values in the invocation context or pass them to the service as arguments. [Inject a service](/di/overview) · [Work with provider lifetimes](/di/recipes/lifetimes)

## Choose the application by its input

| Application | What selects the handler | What a caller observes | First guide |
| --- | --- | --- | --- |
| Web | HTTP method and path, declared with decorators such as `@Get` | A Fetch `Response` with a status, headers and body | [Serve a book as JSON](/web/quick-start) |
| Command | An argument list selects `@Main` or a named `@Action` | Output from the action and a numeric exit status from `run` | [Print a shelf label](/command/quick-start) |
| Message | An exact topic selects a `@Subscribe` method | Completion, a reply or a delivery failure handled according to the transport | [Receive an inventory update](/message/quick-start) |

Follow [one catalog through all three entry points](/guide/three-entry-points) to see how a missing book becomes an HTTP status, a CLI exit code or a service reply.

Try each entry point before connecting a host. Pass a `Request` to `web.handler`, an array such as `["label", "Odyssey"]` to `command.run`, or a topic and delivery to `messages.handle`. These calls go through CHO's dispatch pipeline. For two application models in one process, create one injector and attach the second application with `from`. The [shared inventory guide](/message/with-web) shows a delivery changing the result of an HTTP request.

## Choose where the input comes from

Deno, Node.js, Bun and Cloudflare Workers are the four officially supported runtimes. A server process opens a listener. A Worker receives a Fetch event from its host. CLI arguments come from a process, while a broker consumer needs a transport that can maintain its connection. [Runtime support and entry points](/guide/runtimes)

- **HTTP.** The built-in router and Hono serve Fetch requests, including on Cloudflare Workers. Choose Hono to reuse its middleware. Choose Fastify for a Node.js service that needs its plugins, hooks or native listener. [Compare HTTP adapters](/adapters/)
- **Messaging.** Start locally with manual delivery or a typed client backed by [`localSender`](/api/message#symbol-localSender). Use Core NATS for request/reply, JetStream for durable NATS subscriptions, or Kafka for partitioned events and consumer groups. The Kafka adapter supports Node.js, Deno and Bun. [Message contracts](/message/contracts) · [NATS](/message/nats) · [JetStream](/message/jetstream) · [Kafka](/message/kafka)
- **Command line.** Pass the arguments after the executable and script to `run`. The launcher owns the process exit status. Embedded callers can invoke the same command and inspect the result. [Launch or embed a CLI](/command/application)

Start with [project setup](/guide/getting-started) if you are creating a new directory. When reading existing code, use the import path to find its [public API and usage examples](/api/).
