---
lastUpdated: false
---

# Documentation status

The documentation covers CHO through **[b93db0a · ci: add all envs to ci with real brokers tests](https://github.com/cho-js/cho/commit/b93db0abc304a1e4d938b9de545ec723efadaa51)** on `main`. This commit follows the 3.4.0 release tags. To run the examples against this version, use the [development setup](/guide/getting-started#run-examples-against-the-development-version).

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
