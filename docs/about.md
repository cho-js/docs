# About CHO

CHO is an open-source TypeScript framework for HTTP APIs, command-line tools and message consumers. The same module can supply a catalog, database client or other service to all three applications. Each entry point decides how to present the result to its caller.

CHO uses standard decorators and explicit dependency declarations. You can see which services a controller needs by reading the controller itself. For HTTP, the application exposes a Fetch handler that a server or a Cloudflare Worker can call. [How CHO fits together](/guide/introduction) · [Runtime compatibility](/reference/compatibility)

The project is maintained in the open and distributed under the MIT License. Read the design story on the [CHO blog](/blog/) or explore the [framework source on GitHub](https://github.com/cho-js/cho).
