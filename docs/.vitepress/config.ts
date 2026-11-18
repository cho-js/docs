import { defineConfig } from "vitepress";
import { sidebar } from "./sidebar";

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
      // [
      //   "script",
      //   {
      //       "data-website-id": '{ "token": "2c003d76cd43430b92975026f1ff7632" }',
      //       src: "https://static.cloudflareinsights.com/beacon.min.js",
      //       type: "module",
      //   },
      // ]
  ],
  markdown: {
    theme: { light: "github-light", dark: "github-dark" },
  },
  themeConfig: {
    siteTitle: false,
    logo: '/cho.svg',
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
          { text: "Documentation status", link: "/reference/status" },
          { text: "Packages on JSR", link: "https://jsr.io/@chojs" },
          { text: "Releases", link: "https://github.com/cho-js/cho/releases" },
          { text: "Contributing", link: "https://github.com/cho-js/cho/blob/main/CONTRIBUTING.md" },
        ],
      },
    ],
    sidebar,
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
