import type { DefaultTheme } from "vitepress";

const setup = {
  text: "Get started",
  items: [
    { text: "How CHO fits together", link: "/guide/introduction" },
    { text: "Set up a project", link: "/guide/getting-started" },
    { text: "Runtime setup", link: "/guide/runtimes" },
    { text: "Configure decorators", link: "/guide/decorators" },
  ],
};

const tutorials = {
  text: "First application",
  items: [
    { text: "Serve a book as JSON", link: "/web/quick-start" },
    { text: "Build a shelf-label CLI", link: "/command/quick-start" },
    { text: "Receive an inventory message", link: "/message/quick-start" },
  ],
};

const injection = {
  text: "Dependency injection",
  items: [
    { text: "Inject a service", link: "/di/overview" },
    { text: "Tokens and factories", link: "/di/providers" },
    { text: "Share providers across modules", link: "/di/modules" },
    { text: "Initialization and disposal", link: "/di/lifecycle" },
  ],
};

const http = {
  text: "HTTP applications",
  items: [
    { text: "Serve a book as JSON", link: "/web/quick-start" },
    { text: "Build a writable catalog", link: "/web/example" },
    { text: "Test the catalog", link: "/web/testing" },
    { text: "Route matching", link: "/web/routing" },
    { text: "Mount a route", link: "/web/mounted-routes" },
    { text: "Request context", link: "/web/context" },
    { text: "Handler arguments", link: "/web/arguments" },
    { text: "Input validation", link: "/web/validation" },
    { text: "Responses", link: "/web/responses" },
    { text: "Server-sent events", link: "/web/sse" },
    { text: "Route middleware", link: "/web/middlewares" },
    { text: "Error handling", link: "/web/error-handling" },
    { text: "Application lifecycle", link: "/web/application" },
    { text: "API descriptions", link: "/web/api-docs" },
    { text: "Publish OpenAPI documentation", link: "/web/openapi" },
  ],
};

const adapters = {
  text: "HTTP adapters",
  items: [
    { text: "Choose an adapter", link: "/adapters/" },
    { text: "Built-in router", link: "/adapters/cho" },
    { text: "HTTP middleware", link: "/adapters/middlewares" },
    { text: "Hono", link: "/adapters/hono" },
    { text: "Fastify", link: "/adapters/fastify" },
    { text: "Implement a linker", link: "/adapters/custom" },
  ],
};

const recipes = {
  text: "HTTP recipes",
  items: [
    { text: "Find a recipe", link: "/recipes/" },
    { text: "Stream records", link: "/recipes/streaming" },
    { text: "Send a download", link: "/recipes/downloads" },
    { text: "Accept an upload", link: "/recipes/uploads" },
    { text: "Forward a lookup", link: "/recipes/proxy" },
    { text: "Drain requests on shutdown", link: "/recipes/shutdown" },
  ],
};

const command = {
  text: "Command-line applications",
  items: [
    { text: "Build a shelf-label CLI", link: "/command/quick-start" },
    { text: "Audit a catalog file", link: "/command/file-audit" },
    { text: "Command layouts", link: "/command/commands" },
    { text: "Flags and positional arguments", link: "/command/flags" },
    { text: "Generated help", link: "/command/help" },
    { text: "Command middleware", link: "/command/middlewares" },
    { text: "Errors and exit codes", link: "/command/errors" },
    { text: "Application lifecycle", link: "/command/application" },
    { text: "Test the CLI", link: "/command/testing" },
  ],
};

const messages = {
  text: "Message consumers",
  items: [
    { text: "Receive an inventory message", link: "/message/quick-start" },
    { text: "Topic names", link: "/message/topics" },
    { text: "Delivery context", link: "/message/handlers" },
    { text: "Return a reply", link: "/message/replies" },
    { text: "Message middleware", link: "/message/middlewares" },
    { text: "Failed deliveries", link: "/message/error-handling" },
    { text: "Test a subscription", link: "/message/testing" },
    { text: "Application lifecycle", link: "/message/application" },
    { text: "Share a store with HTTP", link: "/message/with-web" },
    { text: "Consume from Kafka", link: "/message/kafka" },
    { text: "Verify Kafka delivery and retries", link: "/message/kafka-check" },
    { text: "Implement a broker adapter", link: "/message/adapters" },
  ],
};

const reference = {
  text: "Reference",
  items: [
    { text: "HTTP API", link: "/reference/web" },
    { text: "Command API", link: "/reference/command" },
    { text: "Message API", link: "/reference/message" },
    { text: "Error diagnostics", link: "/reference/errors" },
    { text: "Debug logging", link: "/reference/debugging" },
  ],
};

const extensions = {
  text: "Framework extensions",
  items: [
    { text: "Use the injector directly", link: "/advanced/core" },
    { text: "Build a job runner", link: "/advanced/cho-module" },
    { text: "From declaration to dispatch", link: "/advanced/internals" },
  ],
};

const guide = [setup, tutorials, injection];
const web = [http, adapters, recipes];
const api = [reference, extensions];

export const sidebar: DefaultTheme.Sidebar = {
  "/guide/": guide,
  "/di/": guide,
  "/web/": web,
  "/adapters/": web,
  "/recipes/": web,
  "/command/": [command],
  "/message/": [messages],
  "/reference/": api,
  "/advanced/": api,
};
