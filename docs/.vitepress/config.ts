import { defineConfig } from "vitepress";

// The path the site is served under: "/" locally, "/cho-docs/" on GitHub
// Pages (set by the deploy workflow through DOCS_BASE).
const base = '/'; // `${(process.env.DOCS_BASE ?? "").replace(/\/+$/, "")}/`;

export default defineConfig({
  base,
  title: "CHO",
  description:
    "A tiny decorator-based framework for modular HTTP and command-line applications, on Deno, Node.js, Bun and edge runtimes.",
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
      { text: "Web", link: "/web/quick-start", activeMatch: "^/(web|adapters)/" },
      { text: "Command", link: "/command/quick-start", activeMatch: "^/command/" },
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
          { text: "Responses", link: "/web/responses" },
          { text: "Middlewares", link: "/web/middlewares" },
          { text: "Error handling", link: "/web/error-handling" },
          { text: "The application", link: "/web/application" },
          { text: "Testing", link: "/web/testing" },
          { text: "Example: a REST API", link: "/web/example" },
        ],
      },
      {
        text: "Runtime adapters",
        items: [
          { text: "Choosing an adapter", link: "/adapters/" },
          { text: "Built-in router", link: "/adapters/cho" },
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
        text: "Reference",
        items: [
          { text: "@chojs/web API", link: "/reference/web" },
          { text: "@chojs/command API", link: "/reference/command" },
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
