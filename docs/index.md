---
layout: home
markdownStyles: false
pageClass: cho-home
title: CHO
titleTemplate: Modular applications, on every runtime
---

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { withBase } from "vitepress";

const installCommand = "deno add jsr:@chojs/web";
const copyStatus = ref("");
const canCopy = ref(false);
let observer;
let copyTimer;

async function copyInstall() {
  clearTimeout(copyTimer);
  try {
    await navigator.clipboard.writeText(installCommand);
    copyStatus.value = "Copied!";
  } catch {
    copyStatus.value = "Select the command to copy it.";
  }
  copyTimer = setTimeout(() => { copyStatus.value = ""; }, 3000);
}

onMounted(() => {
  canCopy.value = !!navigator.clipboard?.writeText;
  const page = document.querySelector(".cho-page");
  if (!page || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  // Content stays visible without JavaScript or when reduced motion is requested.
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08 });
    page.classList.add("cho-reveal");
    page.querySelectorAll("[data-r]").forEach((el) => observer.observe(el));
  }
});

onUnmounted(() => {
  observer?.disconnect();
  clearTimeout(copyTimer);
});
</script>

<div class="cho-page">
<div class="cho-progress" aria-hidden="true"></div>

<div class="cho-first">
<section class="cho-hero" aria-labelledby="hero-title">
<div class="cho-wrap cho-hero-grid">
<div class="cho-hero-copy">
<a class="cho-badge" :href="withBase('/message/contracts')"><b>New</b> Typed message contracts <span aria-hidden="true">↗</span></a>
<h1 id="hero-title">One framework.<br><span class="cho-grad">Every runtime.</span></h1>
<p class="cho-lead">Build modular HTTP, command-line and message applications with a tiny TypeScript framework. Keep your code. Choose your runtime.</p>
<div class="cho-actions">
<a class="cho-btn primary" :href="withBase('/guide/getting-started')">Get started <span>→</span></a>
<a class="cho-btn" href="https://github.com/cho-js/cho" target="_blank" rel="noreferrer">View on GitHub <span aria-hidden="true">↗</span></a>
</div>
<div class="cho-install">
<span aria-hidden="true">$</span><code>{{ installCommand }}</code>
<button v-if="canCopy" type="button" class="cho-copy-install" aria-label="Copy install command" @click="copyInstall">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>
</button>
<span class="cho-copy-status" role="status">{{ copyStatus }}</span>
</div>
<ul class="cho-principles"><li>Standard decorators</li><li>No reflection</li><li>Type-checked DI</li></ul>
</div>
<div class="cho-preview">
<div class="cho-preview-mark" aria-hidden="true"><img :src="withBase('/cho.svg')" alt="" width="72" height="72"></div>
<div class="cho-editor">
<div class="cho-editor-bar"><span><i aria-hidden="true"></i> main.ts</span><span>TypeScript</span></div>
<div class="cho-code vp-doc">

```ts
import { ChoWeb, Controller, Get, Module } from "@chojs/web";
import { serve } from "@chojs/web/serve";

@Controller()
class HelloController {
  @Get("")
  hello() {
    return { message: "Hello, world!" };
  }
}

@Module({ controllers: [HelloController] })
class App {}

const app = await ChoWeb.create(App);
await serve(app.handler, { port: 3000 });
```

</div>
<div class="cho-response"><div><span class="cho-response-method">GET</span><code>localhost:3000/</code><span class="cho-response-status">200 OK</span></div><code>{ "message": "Hello, world!" }</code></div>
</div>
<p class="cho-preview-note"><span aria-hidden="true">↳</span> One file. A real application. Your choice of runtime.</p>
</div>
</div>
</section>

<section class="cho-runs" aria-label="Supported runtimes">
<div class="cho-wrap">
<p>At home on<br> <strong>your runtime.</strong></p>
<ul>
<li><span class="cho-logo"><img :src="withBase('/runtimes/deno.svg')" alt=""></span>Deno</li>
<li><span class="cho-logo"><img :src="withBase('/runtimes/node.svg')" alt=""></span>Node.js</li>
<li><span class="cho-logo"><img :src="withBase('/runtimes/bun.svg')" alt=""></span>Bun</li>
<li><span class="cho-logo"><img :src="withBase('/runtimes/cloudflare-workers.svg')" alt=""></span>Cloudflare Workers</li>
</ul>
</div>
</section>
</div>

<nav class="cho-section-nav" aria-label="Explore CHO">
<div class="cho-wrap"><span>A small core. A lot of possibility.</span><a href="#one-shape">One shape</a><a href="#portable">Portable</a><a href="#type-safe">Type-safe</a><a href="#batteries-included">In the box <span aria-hidden="true">↓</span></a></div>
</nav>

<section id="one-shape" class="cho-sec tint">
<div class="cho-wrap cho-split">
<div class="cho-copy" data-r="left">
<span class="cho-eyebrow">01 · One shape</span>
<h2>Learn the pattern.<br><span class="cho-grad">Build your thing.</span></h2>
<p>Modules, providers, controllers. The same three building blocks for an API, a CLI or a message consumer. Just change the decorator on the method.</p>
<div class="cho-packages">
<a :href="withBase('/web/quick-start')"><span class="cho-package-icon" aria-hidden="true">↗</span><span><b>HTTP applications</b><code>@chojs/web</code></span><span class="cho-package-arrow" aria-hidden="true">→</span></a>
<a :href="withBase('/command/quick-start')"><span class="cho-package-icon" aria-hidden="true">&gt;_</span><span><b>Command-line tools</b><code>@chojs/command</code></span><span class="cho-package-arrow" aria-hidden="true">→</span></a>
<a :href="withBase('/message/quick-start')"><span class="cho-package-icon" aria-hidden="true">⇄</span><span><b>Message consumers</b><code>@chojs/message</code></span><span class="cho-package-arrow" aria-hidden="true">→</span></a>
</div>
<a class="cho-more" :href="withBase('/guide/introduction')">How CHO is organized <span>→</span></a>
</div>
<div class="cho-code vp-doc" data-r="right" style="--d: 1">

::: code-group

```ts [HTTP]
import {
  ChoWeb,
  type ChoWebContext,
  Controller,
  Get,
  Injectable,
  Module,
} from "@chojs/web";

@Injectable()
class UserStore {
  find(id: string) {
    return { id, name: "Ada" };
  }
}

@Controller({ route: "users", dependencies: [UserStore] })
class UsersController {
  constructor(readonly store: UserStore) {}

  @Get(":id") // GET /users/42
  get(ctx: ChoWebContext) {
    return this.store.find(ctx.params.id!); // sent as JSON
  }
}

@Module({ providers: [UserStore], controllers: [UsersController] })
class App {}

const app = await ChoWeb.create(App);
```

```ts [Command line]
import {
  Action,
  ChoCommand,
  type ChoCommandContext,
  Controller,
  Help,
  Module,
} from "@chojs/command";

@Controller()
class Greeter {
  @Help("Say hello")
  @Action("hello", { string: ["name"] })
  hello(ctx: ChoCommandContext) {
    console.log(`Hello, ${ctx.args.name ?? "world"}!`);
  }
}

@Module({ controllers: [Greeter] })
class App {}

const app = ChoCommand.create(App, { name: "greet" });
const code = await app.run(Deno.args); // the exit code
```

```ts [Messages]
import {
  ChoMessage,
  Args, Value,
  Controller,
  Module,
  Subscribe,
} from "@chojs/message";

@Controller({ topic: "orders" })
class OrdersController {
  @Subscribe("created") // the topic orders.created
  @Args(Value<string>("id"))
  created(id: string) {
    console.log("Received order", id);
  }
}

@Module({ controllers: [OrdersController] })
class App {}

const app = await ChoMessage.create(App);
await app.handle("orders.created", { key: "42", value: '{"id":"42"}' });
await app.close();
```

:::

</div>
</div>
</section>

<section id="portable" class="cho-sec">
<div class="cho-wrap cho-split flip">
<div class="cho-copy" data-r="right">
<span class="cho-eyebrow">02 · Portable</span>
<h2>Your application.<br><span class="cho-grad">Your stack.</span></h2>
<p>Build on the web's <code>Request</code> and <code>Response</code>, not a library's API. Swap the router underneath without rewriting the controllers above.</p>
<ul class="cho-ticks">
<li>A router is built in, on the standard <code>URLPattern</code>.</li>
<li>Hono or Fastify with one option, and no change to a controller.</li>
<li><code>serve(app.handler)</code> picks the server of the runtime it runs on.</li>
</ul>
<a class="cho-more" :href="withBase('/guide/runtimes')">Runtimes and adapters <span>→</span></a>
</div>
<div class="cho-stack" role="group" aria-label="Application architecture, from your code to the runtime">
<div class="cho-layer yours" data-r style="--d: 0"><small>Yours</small><strong>Modules, controllers, providers</strong><em>(req: Request) =&gt; Response</em></div>
<span class="cho-join" data-r style="--d: 1"></span>
<div class="cho-layer" data-r style="--d: 1"><small>The framework</small><strong>@chojs/web</strong></div>
<span class="cho-join" data-r style="--d: 2"></span>
<div class="cho-layer" data-r style="--d: 2"><small>An adapter, swapped with one option</small>
<div class="cho-chips"><span>Built-in router</span><span>Hono</span><span>Fastify</span></div>
</div>
<span class="cho-join" data-r style="--d: 3"></span>
<div class="cho-layer" data-r style="--d: 3"><small>A runtime</small>
<div class="cho-chips">
<span><i class="cho-logo"><img :src="withBase('/runtimes/deno.svg')" alt=""></i>Deno</span>
<span><i class="cho-logo"><img :src="withBase('/runtimes/node.svg')" alt=""></i>Node.js</span>
<span><i class="cho-logo"><img :src="withBase('/runtimes/bun.svg')" alt=""></i>Bun</span>
<span><i class="cho-logo"><img :src="withBase('/runtimes/cloudflare-workers.svg')" alt=""></i>Workers</span>
</div>
</div>
</div>
</div>
</section>

<section id="type-safe" class="cho-sec tint">
<div class="cho-wrap cho-split">
<div class="cho-copy" data-r="left">
<span class="cho-eyebrow">03 · Standard decorators</span>
<h2>Less magic.<br><span class="cho-grad">More confidence.</span></h2>
<p>CHO runs with TC39 decorators, and with the legacy ones of TypeScript and Bun. Dependencies are declared, not guessed from emitted types, and the compiler checks them against the constructor.</p>
<ul class="cho-ticks">
<li>No <code>reflect-metadata</code>, no <code>emitDecoratorMetadata</code>.</li>
<li>The same application with both forms of decorators.</li>
<li>A wrong dependency is a compile error, not a surprise at startup.</li>
</ul>
<a class="cho-more" :href="withBase('/guide/decorators')">Decorators <span>→</span></a>
</div>
<div data-r="right" style="--d: 1">
<div class="cho-code vp-doc">

```ts
const PORT = token<number>("PORT");

@Injectable([Logger, PORT]) // in constructor order
class Server {
  constructor(logger: Logger, port: number) {}
}

@Injectable([PORT, Logger]) // [!code error]
class Broken {
  constructor(logger: Logger, port: number) {}
}
```

</div>
<p class="cho-note"><b>Compile error:</b> the constructor of <code>Broken</code> wants <code>(Logger, number)</code>.</p>
</div>
</div>
</section>

<section class="cho-sec">
<div class="cho-wrap cho-split flip">
<div class="cho-copy" data-r="right">
<span class="cho-eyebrow">04 · Dependency injection</span>
<h2>Catch wiring errors.<br><span class="cho-grad">Before the first request.</span></h2>
<p>The whole module graph is validated and linked once, when the application is created. A missing provider, a circular import or a duplicate route never waits for the first request.</p>
<ul class="cho-ticks">
<li>A provider can <code>await</code> a connection before its value is ready.</li>
<li>Everything that depends on it waits, with no <code>onInit</code> hook to write.</li>
<li><code>close()</code> releases the instances in reverse order.</li>
</ul>
<a class="cho-more" :href="withBase('/di/overview')">Dependency injection <span>→</span></a>
</div>
<div>
<div class="cho-term" data-r="left" style="--d: 1">
<header><i></i><i></i><i></i><span>deno run main.ts</span></header>
<pre v-pre><span class="p">$</span> deno run --allow-net main.ts
<span class="e">Error: Cannot resolve Database (argument #0) of UserStore
in module UsersModule. Provide it there or import a module
that exports it.</span>
<span class="d gap"># fixed, and run again</span>
<span class="p">$</span> deno run --allow-net main.ts
<span class="e">Error: Duplicate route "GET /users/:id": declared by
UsersController.get and AdminController.find</span>
<span class="d gap"># fixed</span>
<span class="p">$</span> deno run --allow-net main.ts
<span class="ok">listening on http://localhost:3000</span></pre>
</div>
<div class="cho-flow" data-r="left" style="--d: 2">
<div><b>create</b><span>Config</span><i>→</i><span>Database</span><i>→</i><span>UserStore</span><i>→</i><span>UsersController</span></div>
<div><b>close</b><span>UsersController</span><i>→</i><span>UserStore</span><i>→</i><span>Database</span><i>→</i><span>Config</span></div>
</div>
</div>
</div>
</section>

<section id="batteries-included" class="cho-sec tint">
<div class="cho-wrap">
<div class="cho-head" data-r>
<span class="cho-eyebrow">Small core. Thoughtful details.</span>
<h2>The everyday essentials.<br><span class="cho-grad">Already here.</span></h2>
<p>What an application needs every day is in the box, and behaves the same on every adapter.</p>
</div>
<div class="cho-bento">
<a class="wide" :href="withBase('/web/middlewares')" data-r style="--d: 0"><small>@Middlewares · @Catch</small><h3>Middlewares and error handlers, at every level</h3><p>On a module, a controller or one method. As a function, or as a class the injector creates, with dependencies of its own.</p></a>
<a class="wide" :href="withBase('/web/testing')" data-r style="--d: 1"><small>app.handler(new Request(…))</small><h3>Tests with no server, and no broker</h3><p>A request is a function call, and so is a message. Replace any provider with a fake, anywhere in the graph, with <code>overrides</code>.</p></a>
<a :href="withBase('/web/arguments')" data-r style="--d: 0"><small>@Args · validate()</small><h3>Typed arguments, validated</h3><p>Declare what a handler reads from the request. A Zod schema, or any object with a <code>parse</code> method, checks it.</p></a>
<a :href="withBase('/web/sse')" data-r style="--d: 1"><small>@Sse</small><h3>Server-sent events</h3><p>A handler is an async generator. Each <code>yield</code> is an event, and a client that leaves ends the loop.</p></a>
<a :href="withBase('/command/quick-start')" data-r style="--d: 2"><small>@Main · @Action</small><h3>Command lines that explain themselves</h3><p><code>--help</code> is generated from the flags each command declares. <code>run()</code> returns the exit code.</p></a>
<a :href="withBase('/message/jetstream')" data-r style="--d: 0"><small>NATS JetStream</small><h3>Resume event processing after downtime</h3><p>A durable consumer picks up stored events, retries failed deliveries and can send exhausted messages to a dead-letter stream.</p></a>
<a :href="withBase('/message/with-web')" data-r style="--d: 1"><small>ChoMessage.from(web.injector)</small><h3>HTTP and messages, one set of instances</h3><p>One database pool, one cache, for the requests and for the messages of the same process.</p></a>
<a :href="withBase('/recipes/')" data-r style="--d: 2"><small>Recipes</small><h3>The everyday tasks, worked out</h3><p>Streaming, downloads, uploads, forwarding a request and shutting down gracefully, checked on three runtimes.</p></a>
</div>
</div>
</section>

<section class="cho-end">
<div class="cho-wrap">
<img :src="withBase('/cho.svg')" alt="" width="64" height="64" data-r="zoom">
<span class="cho-eyebrow" data-r>Less setup. More building.</span>
<h2 data-r style="--d: 1">Your next application<br>starts with <span class="cho-grad">one package.</span></h2>
<p data-r style="--d: 2">Start with a single file. Grow into modules. Take it to the runtime that works for you.</p>
<div class="cho-code vp-doc" data-r style="--d: 3">

::: code-group

```sh [Deno]
deno add jsr:@chojs/web
```

```sh [Node.js]
npx jsr add @chojs/web
```

```sh [Bun]
bunx jsr add @chojs/web
```

:::

</div>
<div class="cho-actions" data-r style="--d: 4">
<a class="cho-btn primary" :href="withBase('/guide/getting-started')">Get started <span>→</span></a>
<a class="cho-btn" :href="withBase('/web/quick-start')">Web</a>
<a class="cho-btn" :href="withBase('/command/quick-start')">Command</a>
<a class="cho-btn" :href="withBase('/message/quick-start')">Message</a>
</div>
</div>
</section>

</div>
