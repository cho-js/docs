---
layout: home
markdownStyles: false
pageClass: cho-home
title: CHO
titleTemplate: Modular applications, on every runtime
---

<script setup>
import { onMounted, onUnmounted } from "vue";
import { withBase } from "vitepress";

// The page is a sequence of steps. On a screen that is wide and tall enough
// for a step to fit (the same condition as in home.css), the page moves a
// whole step at a time: the browser snaps to a step, and the wheel, which the
// browser would let stop half way, is taken over here.
const STEPS = "(min-width: 1100px) and (min-height: 740px)";

let observer;
let stop_wheel = () => {};

onMounted(() => {
  const page = document.querySelector(".cho-page");
  if (!page) {
    return;
  }
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Sections come in as they are scrolled to. Without the script, or for a
  // reader who asked for less motion, everything is simply shown.
  if ("IntersectionObserver" in window && !calm) {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      }
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    page.classList.add("cho-reveal");
    page.querySelectorAll("[data-r]").forEach((el) => observer.observe(el));
  }

  const wide = matchMedia(STEPS);
  const steps = [...page.querySelectorAll(".cho-step")];
  const root = document.documentElement;
  const nav = () =>
    parseFloat(getComputedStyle(root).getPropertyValue("--vp-nav-height")) || 0;
  const bottom = () => root.scrollHeight - innerHeight;
  // Where the page stops: the top of each step, then the end of the page.
  const stops = () => [
    ...steps.map((el, i) =>
      i === 0 ? 0 : Math.round(el.getBoundingClientRect().top + scrollY - nav())
    ),
    bottom(),
  ];

  let moving = false; //  a step is being scrolled to
  let last = 0; //        the time of the last wheel event
  let timer;

  const on_wheel = (event) => {
    if (!wide.matches || event.ctrlKey || event.deltaY === 0) {
      return; // a narrow or short screen, a pinch, or a sideways scroll
    }
    if (event.target.closest?.(".VPLocalSearchBox, .VPNavScreen")) {
      return; // the search and the menu scroll by themselves
    }
    // A code sample that is longer than its frame scrolls first.
    const pre = event.target.closest?.("pre");
    if (pre && pre.scrollHeight > pre.clientHeight + 1) {
      const room = event.deltaY > 0
        ? pre.scrollTop + pre.clientHeight < pre.scrollHeight - 1
        : pre.scrollTop > 0;
      if (room) {
        last = performance.now();
        return;
      }
    }
    const now = performance.now();
    // One gesture is one step: a trackpad keeps sending events after the
    // fingers are lifted, and they must not start the next step.
    const same_gesture = now - last < 160;
    last = now;
    const down = event.deltaY > 0;
    const all = stops();
    const y = scrollY;
    let at = 0;
    all.forEach((top, i) => {
      if (Math.abs(top - y) < Math.abs(all[at] - y)) {
        at = i;
      }
    });

    // A step taller than the screen scrolls freely, up to its edge.
    const el = steps[at];
    if (el && !moving) {
      const box = el.getBoundingClientRect();
      const more_below = box.bottom > innerHeight + 2;
      const more_above = box.top < nav() - 2;
      if (down ? more_below : more_above) {
        return;
      }
    }

    event.preventDefault();
    if (moving || same_gesture) {
      return;
    }
    const to = all[at + (down ? 1 : -1)];
    if (to === undefined || Math.abs(to - y) < 2) {
      return;
    }
    moving = true;
    scrollTo({ top: to, behavior: calm ? "auto" : "smooth" });
    const done = () => {
      moving = false;
      clearTimeout(timer);
      removeEventListener("scrollend", done);
    };
    addEventListener("scrollend", done);
    timer = setTimeout(done, 1200); // for a browser without "scrollend"
  };

  addEventListener("wheel", on_wheel, { passive: false });
  stop_wheel = () => {
    removeEventListener("wheel", on_wheel);
    clearTimeout(timer);
  };
});

onUnmounted(() => {
  observer?.disconnect();
  stop_wheel();
});
</script>

<div class="cho-page">
<div class="cho-progress" aria-hidden="true"></div>

<div class="cho-first cho-step">
<section class="cho-hero">
<div class="cho-wrap cho-hero-grid">
<div>
<a class="cho-badge" :href="withBase('/message/quick-start')" data-r><b>New</b> Message applications, with @chojs/message →</a>
<h1 data-r style="--d: 1">Modular applications, on <span class="cho-grad">every runtime</span></h1>
<p class="cho-lead" data-r style="--d: 2">A tiny decorator-based framework for HTTP, command-line and message applications. Standard decorators, no reflection, the same code on Deno, Node.js, Bun and the edge.</p>
<div class="cho-actions" data-r style="--d: 3">
<a class="cho-btn primary" :href="withBase('/guide/getting-started')">Get started <span>→</span></a>
<a class="cho-btn" :href="withBase('/guide/introduction')">Why CHO?</a>
<a class="cho-btn" href="https://github.com/cho-js/cho" target="_blank" rel="noreferrer">GitHub</a>
</div>
<div class="cho-install" data-r style="--d: 4"><i>$</i> deno add jsr:@chojs/web</div>
</div>
<div class="cho-mark" data-r="zoom" style="--d: 2">
<span class="cho-ring"></span>
<span class="cho-ring r2"></span>
<img :src="withBase('/cho.svg')" alt="The CHO butterfly" width="260" height="260">
</div>
</div>
</section>

<section class="cho-runs">
<div class="cho-wrap">
<p data-r>One codebase runs on</p>
<ul>
<li data-r style="--d: 1"><span class="cho-logo"><img :src="withBase('/runtimes/deno.svg')" alt=""></span>Deno</li>
<li data-r style="--d: 2"><span class="cho-logo"><img :src="withBase('/runtimes/node.svg')" alt=""></span>Node.js</li>
<li data-r style="--d: 3"><span class="cho-logo"><img :src="withBase('/runtimes/bun.svg')" alt=""></span>Bun</li>
<li data-r style="--d: 4"><span class="cho-logo"><img :src="withBase('/runtimes/cloudflare-workers.svg')" alt=""></span>Workers</li>
</ul>
</div>
</section>
</div>

<section class="cho-sec tint cho-step">
<div class="cho-wrap cho-split">
<div class="cho-copy" data-r="left">
<span class="cho-eyebrow">01 · One shape</span>
<h2>Learn it once. Build <span class="cho-grad">three kinds</span> of application.</h2>
<p>Modules group providers and controllers, and decorators say how they fit together. An HTTP service, a command-line tool and a message consumer are the same three things, with a route, a command or a topic on the method.</p>
<ul class="cho-ticks">
<li><b>HTTP</b> with <code>@chojs/web</code>: routes, typed arguments, validation, server-sent events.</li>
<li><b>Command line</b> with <code>@chojs/command</code>: declared flags, generated help, exit codes.</li>
<li><b>Messages</b> with <code>@chojs/message</code>: one handler for a topic, acknowledged after it returns.</li>
</ul>
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
  type ChoMessageContext,
  Controller,
  Module,
  Subscribe,
} from "@chojs/message";

@Controller({ topic: "orders" })
class OrdersController {
  @Subscribe("created") // the topic orders.created
  created(ctx: ChoMessageContext) {
    console.log(ctx.key, ctx.json());
    // returning without an error: the message is handled
  }
}

@Module({ controllers: [OrdersController] })
class App {}

const app = await ChoMessage.create(App);
await app.handle("orders.created", { key: "42", value: '{"id":"42"}' });
```

:::

</div>
</div>
</section>

<section class="cho-sec cho-step">
<div class="cho-wrap cho-split flip">
<div class="cho-copy" data-r="right">
<span class="cho-eyebrow">02 · Portable</span>
<h2>Your code never meets the <span class="cho-grad">HTTP library</span>.</h2>
<p>A handler receives the standard <code>Request</code> and answers with a standard <code>Response</code>. What matches the requests underneath is a small adapter you can swap, and the runtime is a line you do not write.</p>
<ul class="cho-ticks">
<li>A router is built in, on the standard <code>URLPattern</code>.</li>
<li>Hono or Fastify with one option, and no change to a controller.</li>
<li><code>serve(app.handler)</code> picks the server of the runtime it runs on.</li>
</ul>
<a class="cho-more" :href="withBase('/guide/runtimes')">Runtimes and adapters <span>→</span></a>
</div>
<div class="cho-stack">
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

<section class="cho-sec tint cho-step">
<div class="cho-wrap cho-split">
<div class="cho-copy" data-r="left">
<span class="cho-eyebrow">03 · Standard decorators</span>
<h2>No reflection. No compiler plugin. <span class="cho-grad">Still type-checked.</span></h2>
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

<section class="cho-sec cho-step">
<div class="cho-wrap cho-split flip">
<div class="cho-copy" data-r="right">
<span class="cho-eyebrow">04 · Dependency injection</span>
<h2>It fails <span class="cho-grad">before it starts</span>, or it does not fail.</h2>
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

<section class="cho-sec tint cho-step">
<div class="cho-wrap">
<div class="cho-head" data-r>
<span class="cho-eyebrow">And the rest</span>
<h2>Small, and <span class="cho-grad">complete</span>.</h2>
<p>What an application needs every day is in the box, and behaves the same on every adapter.</p>
</div>
<div class="cho-bento">
<a class="wide" :href="withBase('/web/middlewares')" data-r style="--d: 0"><small>@Middlewares · @Catch</small><h3>Middlewares and error handlers, at every level</h3><p>On a module, a controller or one method. As a function, or as a class the injector creates, with dependencies of its own.</p></a>
<a class="wide" :href="withBase('/web/testing')" data-r style="--d: 1"><small>app.handler(new Request(…))</small><h3>Tests with no server, and no broker</h3><p>A request is a function call, and so is a message. Replace any provider with a fake, anywhere in the graph, with <code>overrides</code>.</p></a>
<a :href="withBase('/web/arguments')" data-r style="--d: 0"><small>@Args · validate()</small><h3>Typed arguments, validated</h3><p>Declare what a handler reads from the request. A Zod schema, or any object with a <code>parse</code> method, checks it.</p></a>
<a :href="withBase('/web/sse')" data-r style="--d: 1"><small>@Sse</small><h3>Server-sent events</h3><p>A handler is an async generator. Each <code>yield</code> is an event, and a client that leaves ends the loop.</p></a>
<a :href="withBase('/command/quick-start')" data-r style="--d: 2"><small>@Main · @Action</small><h3>Command lines that explain themselves</h3><p><code>--help</code> is generated from the flags each command declares. <code>run()</code> returns the exit code.</p></a>
<a :href="withBase('/message/handlers')" data-r style="--d: 0"><small>@Subscribe</small><h3>No message lost silently</h3><p>A message is acknowledged after its handler returns. An error handler that only logs leaves it failed.</p></a>
<a :href="withBase('/message/with-web')" data-r style="--d: 1"><small>ChoMessage.from(web.injector)</small><h3>HTTP and messages, one set of instances</h3><p>One database pool, one cache, for the requests and for the messages of the same process.</p></a>
<a :href="withBase('/recipes/')" data-r style="--d: 2"><small>Recipes</small><h3>The everyday tasks, worked out</h3><p>Streaming, downloads, uploads, forwarding a request and shutting down gracefully, checked on three runtimes.</p></a>
</div>
</div>
</section>

<section class="cho-end">
<div class="cho-wrap">
<img :src="withBase('/cho.svg')" alt="" width="64" height="64" data-r="zoom">
<h2 data-r style="--d: 1">Start with <span class="cho-grad">one package</span>.</h2>
<p data-r style="--d: 2">It brings everything an application needs. A first HTTP application takes one file, and runs the same on every runtime.</p>
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
