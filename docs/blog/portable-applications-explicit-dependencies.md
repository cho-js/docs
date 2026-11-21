---
description: Why CHO declares dependencies explicitly, and how that small decision lets the same TypeScript application use different hosts and decorator implementations.
head:
  - - link
    - rel: canonical
      href: https://chojs.io/blog/portable-applications-explicit-dependencies
---

# What makes a CHO application portable?

November 21, 2026

Suppose a library prints a branch code on every book label. On a Node.js server, the code comes from an environment variable. On Cloudflare Workers, it comes from a binding. The librarian still expects the same label: `EAST · The Odyssey`. Why should moving the service require editing the class that prints it?

There are two ways a deployment detail can sneak into that class. One is easy to spot: a call to `process.env`. The other is less visible: a decorator that depends on one compiler emitting a particular piece of type information. CHO's approach to portability addresses both.

## Give the application a value it understands

Here is the label printer. It takes a branch code as a string. The token gives that particular string a name in the application.

```ts
// labels.ts
import { Injectable, token } from "@chojs/web";

export const BRANCH_CODE = token<string>("library branch code");

@Injectable([BRANCH_CODE])
export class LabelPrinter {
  constructor(readonly branch: string) {}

  print(title: string) {
    return `${this.branch} · ${title}`;
  }
}
```

At the edge of the application, a provider decides where the string comes from. Here are two ways to register the same token in the owning module's `providers` list, alongside `LabelPrinter`.

```ts
// Node.js deployment
import { provider } from "@chojs/web";
import { BRANCH_CODE } from "./labels.ts";

export const branchCode = provider({
  provide: BRANCH_CODE,
  factory: () => process.env.BRANCH_CODE ?? "CENTRAL",
});
```

```ts
// Cloudflare Workers deployment
import { provider } from "@chojs/web";
import { env } from "cloudflare:workers";
import { BRANCH_CODE } from "./labels.ts";

export const branchCode = provider({
  provide: BRANCH_CODE,
  factory: () => (env as { BRANCH_CODE?: string }).BRANCH_CODE ?? "CENTRAL",
});
```

Set `BRANCH_CODE` to `EAST` in either deployment and the same call to `print("The Odyssey")` produces the same label. Even the fallback policy is visible in one place per deployment. If a branch code later comes from a configuration service, the change belongs in the provider. The label printer and the controllers that use it can travel together. [Configure a module for a deployment](/di/configured-modules)

## Why the token appears beside the constructor

TypeScript knows that `branch` is a string. That annotation disappears when TypeScript becomes JavaScript. And even if a compiler emitted metadata saying “string,” it couldn't tell CHO whether the printer needs the branch code, the library name or the default language. All three might be strings.

That's what `@Injectable([BRANCH_CODE])` supplies: the identity of the dependency. At runtime, CHO looks up that token in the module's scope. During type-checking, CHO checks the declared dependencies against the constructor. Change the parameter to `branch: number` and TypeScript flags the mismatch with the string token. Two string tokens are still type-compatible, so giving each a meaningful name matters. [Declare and type-check providers](/di/providers)

This is also where standardization matters in practice. The TC39 decorator model and TypeScript's legacy `experimentalDecorators` use different calling conventions. CHO accepts both, as well as Bun's decorators. In each case, the application gives CHO the same token list. It needs neither `reflect-metadata` nor a CHO compiler plugin to infer constructor dependencies. The host's toolchain still has to handle the decorator syntax. For example, CHO's generated Node.js project uses `tsx`. [Create a workspace with the CHO CLI](/guide/create-workspace)

## How far can the application travel?

CHO officially supports **Node.js, Deno, Bun and Cloudflare Workers**. One shared HTTP application can hand its Fetch handler to a listener on the first three or export it to a Worker. The host still determines how requests arrive and which resources the application can use. A team considering AWS Lambda, for example, would need to account for Lambda's invocation contract separately. The [runtime compatibility table](/reference/compatibility) records the project's support for each runtime and adapter.

A practical place to start is one constructor. When you see a service reach for a platform API, ask what value it actually needs. For the label printer, the answer was a branch code. Once the code says that explicitly, the choice of host becomes a decision you can revisit without rewriting how a single label is printed.
