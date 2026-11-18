# Share a store between HTTP and messages

A shipment arrives as a message and a client asks for its status over HTTP. Both operations need the same inventory. Create the web application once, then pass its injector to `ChoMessage.from`.

## Run both entry points in one process

Install `@chojs/web` and `@chojs/message`. Save the following as `main.ts` and run `deno run main.ts`, `npx tsx main.ts` or `bun run main.ts` in your [configured project](/guide/getting-started).

<<< @/examples/shared/app.ts

Expect `{"received":true}`. Repeating the same shipment key leaves the set unchanged. Using `ChoMessage.create(Library)` here would allocate another store. The web endpoint would then report `false`.

## Scope middleware to its transport

Keep HTTP and message controllers separate. In a module that declares both kinds, place transport-specific `@Middlewares` and `@Catch` on the controllers or methods. A module-level declaration is visible to both pipelines, whose contexts and results differ.

## Who owns the injector

Configure provider overrides on `ChoWeb.create`. `ChoMessage.from` borrows the injector and accepts its own prefix, linker and fallback error handler. Closing the consumer drains its deliveries and leaves the shared dependencies available to the owner.

With a real listener and a broker, stop accepting HTTP traffic and close the consumer before disposing the web application. Await both drains before closing shared storage. The example uses nested `finally` blocks so the owner also closes if consumer creation or processing fails.
