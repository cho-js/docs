import { defineConfig } from "vitepress";
import { sidebar } from "./sidebar";

// The path the site is served under: "/" locally, "/cho-docs/" on GitHub
// Pages (set by the deploy workflow through DOCS_BASE).
const base = '/'; // `${(process.env.DOCS_BASE ?? "").replace(/\/+$/, "")}/`;

const origin = "https://chojs.io";
const sectionBanners: Record<string, string> = {
  guide: "guides", di: "guides", advanced: "guides",
  web: "web", adapters: "web", recipes: "web",
  command: "command", message: "message", api: "api", reference: "api",
};
const bannerLabels: Record<string, string> = {
  framework: "TypeScript framework", guides: "Developer guides", web: "Web applications",
  command: "Command-line tools", message: "Messaging", api: "API reference",
};

export default defineConfig({
  base,
  title: "CHO",
  description:
    "CHO is a TypeScript framework for enterprise applications. Run HTTP APIs on Deno, Node.js, Bun and Cloudflare Workers, and Kafka consumers on Node.js, Deno and Bun.",
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
  transformHead({ page, pageData, title, description }) {
    if (pageData.isNotFound || page === "404.md") return [];
    const route = page.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, "");
    const banner = sectionBanners[route.split("/")[0]] ?? "framework";
    const url = new URL(route, origin).href;
    const cover = pageData.frontmatter.cover;
    const image = new URL(cover?.src ?? `/social/${banner}.png`, origin).href;
    const alt = cover?.alt ?? `CHO — ${bannerLabels[banner]}, with the orange butterfly logo`;
    return [
      ["meta", { property: "og:type", content: route ? "article" : "website" }],
      ["meta", { property: "og:site_name", content: "CHO" }],
      ["meta", { property: "og:url", content: url }],
      ["meta", { property: "og:title", content: title }],
      ["meta", { property: "og:description", content: description }],
      ["meta", { property: "og:image", content: image }],
      ["meta", { property: "og:image:type", content: "image/png" }],
      ["meta", { property: "og:image:width", content: "1200" }],
      ["meta", { property: "og:image:height", content: "630" }],
      ["meta", { property: "og:image:alt", content: alt }],
      ["meta", { name: "twitter:card", content: "summary_large_image" }],
      ["meta", { name: "twitter:site", content: "@cho_framework" }],
      ["meta", { name: "twitter:title", content: title }],
      ["meta", { name: "twitter:description", content: description }],
      ["meta", { name: "twitter:image", content: image }],
      ["meta", { name: "twitter:image:alt", content: alt }],
    ];
  },
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
      { text: "API", link: "/api/", activeMatch: "^/(api|reference|advanced)/" },
      { text: "Blog", link: "/blog/", activeMatch: "^/blog/" },
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
  },
});
