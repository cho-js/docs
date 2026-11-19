---
lastUpdated: false
---

# Documentation status

The documentation covers CHO through **[913e964 · feat: change validation to support standardschema](https://github.com/cho-js/cho/commit/913e9647671af610473c7cd6f69e37a685749158)** on `main`.

## November 19, 2026 · CHO blog

The [blog](/blog/) opens with [Building CHO, a TypeScript framework for every JavaScript runtime](/blog/building-cho-for-every-js-runtime), an article about moving an HTTP endpoint between a server process and Cloudflare Workers.

## November 19, 2026 · Standard Schema and migration from NestJS

Web and Message now accept Standard Schema V1 validators alongside parse-based validators. The documentation covers normalized issues, transforming message contracts and OpenAPI schema conversion. The NestJS migration guide ports a complete catalog lookup and maps DI, request handling and transport choices. This update was reviewed against the framework source without executing code, tests or a site build. [Standard Schema](/guide/standard-schema) · [Migrate from NestJS](/guide/migration-from-nestjs) · [Framework changes since 30ad35b](https://github.com/cho-js/cho/compare/30ad35bc87200c47e829d909c582887fc2c055aa...913e9647671af610473c7cd6f69e37a685749158)

## November 19, 2026 · Social previews

Shared links use the page title and a butterfly banner for the relevant documentation section. The homepage has its own framework banner. Open Graph and X card metadata are included in the statically generated HTML.

## November 19, 2026 · Application guides and public API

Start with the [application model](/guide/introduction) to follow a declaration through dependency resolution and dispatch. The [public API](/api/) covers all 18 package entry points, including adapter options, extension interfaces and utility subpaths. Re-exported symbols link to their shared documentation.

Release 3.5.0 includes the Kafka and Worker support described below. The subsequent module configuration change lets an application supply its own providers and imports to a library module. [Configure a library module](/di/configured-modules) · [Framework changes since b93db0a](https://github.com/cho-js/cho/compare/b93db0abc304a1e4d938b9de545ec723efadaa51...30ad35bc87200c47e829d909c582887fc2c055aa)

Documentation checks included building the VitePress site and checking the API inventory and internal links.

## November 18, 2026 · Cloudflare Workers and Kafka runtime support

- **Cloudflare Workers** is the fourth officially supported runtime. The new guide covers Fetch entry points, bindings, background work and the dedicated `workerd` CI job. [Cloudflare Workers](/guide/cloudflare-workers) · [Runtime support matrix](/guide/runtimes#background-consumers)
- **Kafka** runs on Node.js, Deno and Bun. The consumer guide now includes setup for all three, including Deno's file-read permission. To save CI time, the project runs the real-broker Kafka job on Node.js only. The same integration suite can be run on each runtime. [Kafka setup](/message/kafka) · [Broker test commands](/message/kafka-check#check-the-adapter-on-your-runtime)

The coverage notes follow the framework's runtime guides and CI workflow. [Changes since 0ffadb4](https://github.com/cho-js/cho/compare/0ffadb48e87366545b104c7b226a828d34e0f18c...b93db0abc304a1e4d938b9de545ec723efadaa51) · [CI configuration at this revision](https://github.com/cho-js/cho/blob/b93db0abc304a1e4d938b9de545ec723efadaa51/.github/workflows/ci.yml)

## November 18, 2026 · Framework overview

The [homepage](/) and site description now introduce CHO as a TypeScript framework for enterprise applications. The overview highlights module boundaries, startup dependency checks and durable event processing.

## November 18, 2026 · Message contracts and JetStream

The previous update covered Core NATS through [4329a0e](https://github.com/cho-js/cho/commit/4329a0ead1afb156572c30e2f41c84327ddfa928). This update covers the next three framework commits. [Compare the two CHO revisions](https://github.com/cho-js/cho/compare/4329a0ead1afb156572c30e2f41c84327ddfa928...0ffadb48e87366545b104c7b226a828d34e0f18c).

| CHO commit | What you can do | Guide |
| --- | --- | --- |
| [7a4d970](https://github.com/cho-js/cho/commit/7a4d9707953f30b767e02901f67c93af1550218c) | Read the payload, key and headers as handler arguments and validate them before processing | [Message arguments](/message/arguments) |
| [f1d7c0d](https://github.com/cho-js/cho/commit/f1d7c0d4e43ab6b6bcdfae6975a8375b56837c97) | Share a typed request and reply between services and exercise both sides in memory | [Message contracts](/message/contracts) |
| [0ffadb4](https://github.com/cho-js/cho/commit/0ffadb48e87366545b104c7b226a828d34e0f18c) | Consume stored NATS events, retry failed deliveries and inspect dead letters | [NATS JetStream](/message/jetstream) |

The argument and contract examples ran against this revision. The NATS checks verified a successful lookup, a service error and a dead letter stored after three failed attempts.
