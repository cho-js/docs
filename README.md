# cho-docs

The documentation of the [CHO](https://github.com/cho-js/cho) framework, built
with [VitePress](https://vitepress.dev).

```sh
npm install
npm run dev      # local server, with hot reload
npm run build    # static site in docs/.vitepress/dist
npm run preview  # serve the built site
```

The pages are the Markdown files of `docs/`; the navigation is in
`docs/.vitepress/config.ts`.

The [documentation status page](docs/reference/status.md) records the CHO
framework revision covered by the guides. Follow the [update procedure](AGENTS.md)
whenever you change the documentation.

## Deployment

`.github/workflows/deploy.yml` builds the site and publishes it to GitHub Pages
on every push to `main`. In the repository settings, set **Pages → Source** to
**GitHub Actions**. The workflow passes the site's base path to the build as
`DOCS_BASE`, so a project site (`/cho-docs/`) and a custom domain both work.
