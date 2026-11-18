# How CHO applications fit together

CHO connects TypeScript classes to HTTP requests, command lines and broker deliveries. A library catalog, for example, can expose a book over HTTP, print a shelf label from a terminal and update inventory when a shipment arrives. Each entry point can call the same catalog service.

| When the input is… | Declare the entry point with | Deliver input with |
| --- | --- | --- |
| An HTTP request | `@Get`, `@Post` or another HTTP method | `app.handler(request)` |
| A list of command-line arguments | `@Main` or `@Action` | `app.run(argv)` |
| A message addressed to a topic | `@Subscribe` | `app.handle(topic, delivery)` or a broker adapter |

## Follow one request

1. A **module** declares the controllers it owns and the providers they can use. The root module imports the features that make up the application.
2. A **controller** maps an input to a method. A web controller might declare `@Get(":id")` and receive the book ID as an argument.
3. A **provider** supplies a dependency, such as a catalog or database client. The controller lists its dependencies in constructor order. The injector supplies the instances.
4. The application compiles these declarations. For HTTP and messages, a **linker** gives the compiled routes to a router or broker client. For a CLI, CHO selects a command from the argument list.

Start with the entry point you can exercise locally. All three application packages export the module, controller and injection APIs their examples use.

## Choose a first project

- [Serve a book as JSON](/web/quick-start) and check the result with `curl`.
- [Print a shelf label](/command/quick-start) and inspect the generated help and exit status.
- [Receive an inventory message](/message/quick-start) and exercise a consumer in memory.

For a new project directory, begin with [project setup](/guide/getting-started). To share a catalog between applications, read [module scope](/di/modules) and [sharing an injector](/message/with-web).
