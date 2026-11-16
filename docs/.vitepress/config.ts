import { defineConfig } from "vitepress";

// The path the site is served under: "/" locally, "/cho-docs/" on GitHub
// Pages (set by the deploy workflow through DOCS_BASE).
const base = '/'; // `${(process.env.DOCS_BASE ?? "").replace(/\/+$/, "")}/`;

export default defineConfig({
  base,
  title: "CHO",
  description:
    "A tiny decorator-based framework for modular HTTP, command-line and message applications, on Deno, Node.js, Bun and edge runtimes.",
  lang: "en-US",
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ["link", { rel: "icon", href: `${base}favicon.ico` }],
    // Google Tag Manager (analytics): the snippet Google gives, on every page.
    [
      "script",
      {
        async: "",
        src: "https://www.googletagmanager.com/gtm.js?id=GTM-T6PN74KC",
      },
    ],
    [
      "script",
      {},
      `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());`,
    ],
      [
        "script",
        {
            "data-website-id": '{ "token": "2c003d76cd43430b92975026f1ff7632" }',
            src: "https://static.cloudflareinsights.com/beacon.min.js",
            type: "module",
        },
      ]
  ],
  markdown: {
    theme: { light: "github-light", dark: "github-dark" },
  },
  themeConfig: {
    siteTitle: "CHO",
    outline: [2, 3],
    search: { provider: "local" },
    nav: [
      { text: "Guide", link: "/guide/introduction", activeMatch: "^/(guide|di)/" },
      { text: "Web", link: "/web/quick-start", activeMatch: "^/(web|adapters|recipes)/" },
      { text: "Command", link: "/command/quick-start", activeMatch: "^/command/" },
      { text: "Message", link: "/message/quick-start", activeMatch: "^/message/" },
      { text: "Reference", link: "/reference/web", activeMatch: "^/(reference|advanced)/" },
      {
        text: "v3",
        items: [
          { text: "Packages on JSR", link: "https://jsr.io/@chojs" },
          { text: "Releases", link: "https://github.com/cho-js/cho/releases" },
          { text: "Contributing", link: "https://github.com/cho-js/cho/blob/main/CONTRIBUTING.md" },
        ],
      },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Introduction", link: "/guide/introduction" },
          { text: "Getting started", link: "/guide/getting-started" },
          { text: "Runtimes", link: "/guide/runtimes" },
          { text: "Decorators", link: "/guide/decorators" },
        ],
      },
      {
        text: "Dependency injection",
        items: [
          { text: "Overview", link: "/di/overview" },
          { text: "Tokens and providers", link: "/di/providers" },
          { text: "Modules", link: "/di/modules" },
          { text: "Lifecycle", link: "/di/lifecycle" },
        ],
      },
      {
        text: "Web applications",
        items: [
          { text: "Quick start", link: "/web/quick-start" },
          { text: "Routing", link: "/web/routing" },
          { text: "Request context", link: "/web/context" },
          { text: "Handler arguments", link: "/web/arguments" },
          { text: "Validation", link: "/web/validation" },
          { text: "Responses", link: "/web/responses" },
          { text: "Server-sent events", link: "/web/sse" },
          { text: "Middlewares", link: "/web/middlewares" },
          { text: "Error handling", link: "/web/error-handling" },
          { text: "The application", link: "/web/application" },
          { text: "Describing the API", link: "/web/api-docs" },
          { text: "Testing", link: "/web/testing" },
          { text: "Example: a REST API", link: "/web/example" },
        ],
      },
      {
        text: "Recipes",
        items: [
          { text: "Overview", link: "/recipes/" },
          { text: "Stream a response", link: "/recipes/streaming" },
          { text: "Send a file to download", link: "/recipes/downloads" },
          { text: "Receive an uploaded file", link: "/recipes/uploads" },
          { text: "Forward a request", link: "/recipes/proxy" },
          { text: "Shut down gracefully", link: "/recipes/shutdown" },
        ],
      },
      {
        text: "Runtime adapters",
        items: [
          { text: "Choosing an adapter", link: "/adapters/" },
          { text: "Built-in router", link: "/adapters/cho" },
          { text: "Middlewares", link: "/adapters/middlewares" },
          { text: "Hono", link: "/adapters/hono" },
          { text: "Fastify", link: "/adapters/fastify" },
          { text: "Writing an adapter", link: "/adapters/custom" },
        ],
      },
      {
        text: "Command-line applications",
        items: [
          { text: "Quick start", link: "/command/quick-start" },
          { text: "Commands", link: "/command/commands" },
          { text: "Flags and arguments", link: "/command/flags" },
          { text: "Middlewares", link: "/command/middlewares" },
          { text: "Errors and exit codes", link: "/command/errors" },
          { text: "Help output", link: "/command/help" },
          { text: "The application", link: "/command/application" },
          { text: "Testing", link: "/command/testing" },
        ],
      },
      {
        text: "Message applications",
        items: [
          { text: "Quick start", link: "/message/quick-start" },
          { text: "Topics", link: "/message/topics" },
          { text: "Handlers and the context", link: "/message/handlers" },
          { text: "Middlewares", link: "/message/middlewares" },
          { text: "Error handling", link: "/message/error-handling" },
          { text: "The application", link: "/message/application" },
          { text: "With a web application", link: "/message/with-web" },
          { text: "Testing", link: "/message/testing" },
          { text: "Broker adapters", link: "/message/adapters" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "@chojs/web API", link: "/reference/web" },
          { text: "@chojs/command API", link: "/reference/command" },
          { text: "@chojs/message API", link: "/reference/message" },
          { text: "Error messages", link: "/reference/errors" },
          { text: "Debug logging", link: "/reference/debugging" },
        ],
      },
      {
        text: "Advanced",
        collapsed: true,
        items: [
          { text: "The core package", link: "/advanced/core" },
          { text: "Writing a CHO module", link: "/advanced/cho-module" },
          { text: "Internals", link: "/advanced/internals" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/cho-js/cho" },
      { icon: "x", link: "https://x.com/cho_framework" },
    ],
    editLink: {
      pattern: "https://github.com/cho-js/docs/edit/main/docs/:path",
      text: "Edit this page",
    },
    footer: {
      message: "Released under the MIT License.",
    },
  },
});
