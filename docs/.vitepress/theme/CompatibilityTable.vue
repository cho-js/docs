<!-- Table, legend and notes from CHO's compatibility.html at 45bb787. -->
<template>
  <section class="compatibility" aria-label="CHO runtime support">
      <p class="lead">
        Which part of CHO runs on which runtime. A number next to a mark
        leads to a note under the table. The marks say what the tests of the
        repository show, not what should work.
      </p>

      <ul class="legend">
        <li>
          <span class="mark yes" aria-hidden="true">✓</span>Supported, and
          tested
        </li>
        <li>
          <span class="mark part" aria-hidden="true">~</span>Passes the tests,
          not promised
        </li>
        <li>
          <span class="mark no" aria-hidden="true">✕</span>Not supported, or
          not tested
        </li>
      </ul>

      <div class="scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Component</th>
              <th scope="col">Deno</th>
              <th scope="col">Node.js</th>
              <th scope="col">Bun</th>
              <th scope="col">Cloudflare Workers</th>
            </tr>
          </thead>
          <tbody>
            <tr class="group">
              <th colspan="5" scope="colgroup">The core</th>
            </tr>
            <tr>
              <th scope="row">
                <a href="https://github.com/cho-js/cho/blob/45bb7873ab669f452a80e94f11a4c5fc7b561043/core/README.md"><code>@chojs/core</code></a>
                <small>Dependency injection, modules, errors</small>
              </th>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-1"
                    aria-label="Note 1"
                  >1</a></sup>
              </td>
            </tr>
            <tr>
              <th scope="row">
                Decorator syntax
                <small>Standard (TC39) and legacy decorators</small>
              </th>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-2"
                    aria-label="Note 2"
                  >2</a></sup>
              </td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-3"
                    aria-label="Note 3"
                  >3</a></sup>
              </td>
            </tr>

            <tr class="group">
              <th colspan="5" scope="colgroup">HTTP</th>
            </tr>
            <tr>
              <th scope="row">
                <a href="https://github.com/cho-js/cho/blob/45bb7873ab669f452a80e94f11a4c5fc7b561043/web/README.md"><code>@chojs/web</code></a>
                <small>Controllers, routes, middlewares, validation</small>
              </th>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
            </tr>
            <tr>
              <th scope="row">
                The built-in router
                <small><code>ChoLinker</code>, on the URL Pattern API</small>
              </th>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-4"
                    aria-label="Note 4"
                  >4</a></sup>
              </td>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-4"
                    aria-label="Note 4"
                  >4</a></sup>
              </td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
            </tr>
            <tr>
              <th scope="row">
                <code>serve()</code>
                <small>The server of the runtime, from
                  <code>@chojs/web/serve</code></small>
              </th>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td>
                <span class="mark no" role="img" aria-label="No">✕</span><sup><a
                    href="#note-5"
                    aria-label="Note 5"
                  >5</a></sup>
              </td>
            </tr>
            <tr>
              <th scope="row">
                Server-sent events
                <small><code>@Sse</code></small>
              </th>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
            </tr>
            <tr>
              <th scope="row">
                WebSockets
                <small><code>@Ws</code>, <code>@WsOpen</code>,
                  <code>@WsMessage</code>, <code>@WsClose</code></small>
              </th>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-6"
                    aria-label="Note 6"
                  >6</a></sup>
              </td>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-7"
                    aria-label="Note 7"
                  >7</a></sup>
              </td>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-8"
                    aria-label="Note 8"
                  >8</a></sup>
              </td>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-9"
                    aria-label="Note 9"
                  >9</a></sup>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <a href="https://github.com/cho-js/cho/blob/45bb7873ab669f452a80e94f11a4c5fc7b561043/vendor/cho/README.md"><code
                  >@chojs/vendor-cho</code></a>
                <small>Middlewares: CORS, auth, compression, …</small>
              </th>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
            </tr>
            <tr>
              <th scope="row">
                <a href="https://github.com/cho-js/cho/blob/45bb7873ab669f452a80e94f11a4c5fc7b561043/extras/openapi/README.md"><code
                  >@chojs/openapi</code></a>
                <small>The OpenAPI document, and its page</small>
              </th>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-3"
                    aria-label="Note 3"
                  >3</a></sup>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <a href="https://github.com/cho-js/cho/blob/45bb7873ab669f452a80e94f11a4c5fc7b561043/extras/dev/README.md"><code
                  >@chojs/dev</code></a>
                <small>The endpoints of an application, and its graph</small>
              </th>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-3"
                    aria-label="Note 3"
                  >3</a></sup>
              </td>
            </tr>

            <tr class="group">
              <th colspan="5" scope="colgroup">HTTP adapters</th>
            </tr>
            <tr>
              <th scope="row">
                <a href="https://github.com/cho-js/cho/blob/45bb7873ab669f452a80e94f11a4c5fc7b561043/vendor/hono/README.md"><code
                  >@chojs/vendor-hono</code></a>
                <small>Routes on Hono</small>
              </th>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
            </tr>
            <tr>
              <th scope="row">
                <a href="https://github.com/cho-js/cho/blob/45bb7873ab669f452a80e94f11a4c5fc7b561043/vendor/fastify/README.md"><code
                  >@chojs/vendor-fastify</code></a>
                <small>Routes on Fastify</small>
              </th>
              <td>
                <span class="mark no" role="img" aria-label="No">✕</span><sup><a
                    href="#note-10"
                    aria-label="Note 10"
                  >10</a></sup>
              </td>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-11"
                    aria-label="Note 11"
                  >11</a></sup>
              </td>
              <td>
                <span class="mark no" role="img" aria-label="No">✕</span><sup><a
                    href="#note-10"
                    aria-label="Note 10"
                  >10</a></sup>
              </td>
              <td>
                <span class="mark no" role="img" aria-label="No">✕</span><sup><a
                    href="#note-10"
                    aria-label="Note 10"
                  >10</a></sup>
              </td>
            </tr>

            <tr class="group">
              <th colspan="5" scope="colgroup">The command line</th>
            </tr>
            <tr>
              <th scope="row">
                <a href="https://github.com/cho-js/cho/blob/45bb7873ab669f452a80e94f11a4c5fc7b561043/command/README.md"><code>@chojs/command</code></a>
                <small>Command-line applications</small>
              </th>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td>
                <span class="mark no" role="img" aria-label="No">✕</span><sup><a
                    href="#note-12"
                    aria-label="Note 12"
                  >12</a></sup>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <a href="https://github.com/cho-js/cho/blob/45bb7873ab669f452a80e94f11a4c5fc7b561043/cli/README.md"><code>@chojs/cli</code></a>
                <small><code>cho</code>, the tool of the framework</small>
              </th>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td>
                <span class="mark no" role="img" aria-label="No">✕</span><sup><a
                    href="#note-12"
                    aria-label="Note 12"
                  >12</a></sup>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <a href="https://github.com/cho-js/cho/blob/45bb7873ab669f452a80e94f11a4c5fc7b561043/extras/prompt/README.md"><code
                  >@chojs/prompt</code></a>
                <small>Questions in a terminal</small>
              </th>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td>
                <span class="mark no" role="img" aria-label="No">✕</span><sup><a
                    href="#note-12"
                    aria-label="Note 12"
                  >12</a></sup>
              </td>
            </tr>

            <tr class="group">
              <th colspan="5" scope="colgroup">Messages</th>
            </tr>
            <tr>
              <th scope="row">
                <a href="https://github.com/cho-js/cho/blob/45bb7873ab669f452a80e94f11a4c5fc7b561043/message/README.md"><code>@chojs/message</code></a>
                <small>Handlers of messages, contracts, the client</small>
              </th>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td><span class="mark yes" role="img" aria-label="Yes">✓</span></td>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-13"
                    aria-label="Note 13"
                  >13</a></sup>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <a href="https://github.com/cho-js/cho/blob/45bb7873ab669f452a80e94f11a4c5fc7b561043/vendor/nats/README.md"><code
                  >@chojs/vendor-nats</code></a>
                <small>NATS, with JetStream</small>
              </th>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-14"
                    aria-label="Note 14"
                  >14</a></sup>
              </td>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-14"
                    aria-label="Note 14"
                  >14</a></sup>
              </td>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-14"
                    aria-label="Note 14"
                  >14</a></sup>
              </td>
              <td>
                <span class="mark no" role="img" aria-label="No">✕</span><sup><a
                    href="#note-15"
                    aria-label="Note 15"
                  >15</a></sup>
              </td>
            </tr>
            <tr>
              <th scope="row">
                <a href="https://github.com/cho-js/cho/blob/45bb7873ab669f452a80e94f11a4c5fc7b561043/vendor/kafka/README.md"><code
                  >@chojs/vendor-kafka</code></a>
                <small>Kafka</small>
              </th>
              <td>
                <span
                  class="mark part"
                  role="img"
                  aria-label="Passes the tests, not promised"
                >~</span><sup><a href="#note-16" aria-label="Note 16">16</a></sup>
              </td>
              <td>
                <span class="mark yes" role="img" aria-label="Yes">✓</span><sup><a
                    href="#note-17"
                    aria-label="Note 17"
                  >17</a></sup>
              </td>
              <td>
                <span
                  class="mark part"
                  role="img"
                  aria-label="Passes the tests, not promised"
                >~</span><sup><a href="#note-16" aria-label="Note 16">16</a></sup>
              </td>
              <td>
                <span class="mark no" role="img" aria-label="No">✕</span><sup><a
                    href="#note-15"
                    aria-label="Note 15"
                  >15</a></sup>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="notes">Notes</h2>
      <ol class="notes">
        <li id="note-1">
          <strong>The environment on a Worker.</strong> A Worker has no
          <code>process</code>: give the environment to CHO with
          <code>set_env()</code> of <code>@chojs/core/utils</code>, as debug
          logging reads it.
        </li>
        <li id="note-2">
          <strong>Decorators on Node.js.</strong> Node.js does not run
          decorator syntax itself: compile the application with TypeScript 5,
          or run it with a tool such as <code>tsx</code>. Deno and Bun run it
          directly.
        </li>
        <li id="note-3">
          <strong>A bundle keeps the names.</strong> A Worker is bundled, and
          the bundler compiles the decorators. CHO puts the names of classes
          and functions in error messages, in logs, in the tags of an
          OpenAPI document and in the graph of <code>@chojs/dev</code>: a
          bundle that renames them changes those.
        </li>
        <li id="note-4">
          <strong>The built-in router needs the global
            <code>URLPattern</code>.</strong> Node.js has it from version 24,
          and Bun from 1.3.4. On an older one, use
          <code>@chojs/vendor-hono</code>.
        </li>
        <li id="note-5">
          <strong>No <code>serve()</code> on a Worker.</strong> The runtime
          calls the handler itself: the entry point is
          <code>export default { fetch: app.handler }</code>.
        </li>
        <li id="note-6">
          <strong>WebSockets on Deno.</strong> Upgraded by
          <code>serve(app)</code>, or by <code>app.handler</code> with
          <code>Deno.serve</code>. The protocol is Deno's. There is no limit
          of the size of a message to set (<code>maxPayload</code>). In the
          Autobahn test suite one case of 301 fails, <code>7.3.6</code>, and a
          plain <code>Deno.serve</code> fails it the same way.
        </li>
        <li id="note-7">
          <strong>WebSockets on Node.js.</strong> Upgraded by
          <code>serve(app)</code>, or by <code>nodeUpgrade(app)</code> on a
          <code>node:http</code> server of your own. Node.js has no WebSocket
          server: the protocol is part of <code>@chojs/web</code>, with no
          dependency. Messages are not compressed, and there are no
          subprotocols. It passes the Autobahn test suite: 301 cases, none
          failed.
        </li>
        <li id="note-8">
          <strong>WebSockets on Bun.</strong> Upgraded by
          <code>serve(app)</code>, or by
          <code>Bun.serve({ ...bunOptions(app) })</code>. The protocol is
          Bun's. <code>Bun.serve({ fetch: app.handler })</code> alone does not
          upgrade: Bun takes the callbacks of its sockets when the server is
          made.
        </li>
        <li id="note-9">
          <strong>WebSockets on a Worker.</strong> Upgraded by
          <code>app.handler</code>, with a <code>WebSocketPair</code>. Durable
          Objects, and their sockets that hibernate, are not covered.
        </li>
        <li id="note-10">
          <strong>Fastify is built on the HTTP server of Node.js.</strong> On
          the other runtimes use the built-in router, or
          <code>@chojs/vendor-hono</code>.
        </li>
        <li id="note-11">
          <strong>No WebSockets through Fastify.</strong> Fastify holds the
          server, and the adapter does not upgrade its connections: a route
          marked with <code>@Ws</code> is refused when the application is
          created. Every other adapter upgrades.
        </li>
        <li id="note-12">
          <strong>A Worker has no command line.</strong> The tests of
          <code>@chojs/command</code> and of <code>@chojs/cli</code> do not run
          there. <code>@chojs/prompt</code> loads there, and has no
          terminal to ask on: a question is refused.
        </li>
        <li id="note-13">
          <strong>Messages on a Worker.</strong> The package itself runs
          there, and its tests pass. No broker adapter does: an application
          delivers its messages with <code>app.handle</code>.
        </li>
        <li id="note-14">
          <strong>The transport of NATS is the runtime's.</strong> The
          application gives the connection:
          <code>@nats-io/transport-node</code> on Node.js and on Bun,
          <code>@nats-io/transport-deno</code> on Deno.
        </li>
        <li id="note-15">
          <strong>Not tested on a Worker.</strong> The adapters run where the
          client library of their broker does. The client of NATS can connect
          through WebSockets, which a Worker has, but nothing here checks it.
        </li>
        <li id="note-16">
          <strong>Kafka on Deno and Bun: tested, not promised.</strong> The
          tests of the adapter pass on Deno 2.9 and on Bun 1.4, against a
          broker. Its client library is written for Node.js alone, so a
          release of it can change that. The CI runs these tests on Node.js
          only. On Deno the application needs <code>--allow-read</code>.
        </li>
        <li id="note-17">
          <strong>Kafka on Node.js</strong> needs Node.js 22.22, or 24.6 and
          later.
        </li>
      </ol>

      <h2>How this is known</h2>
      <ul class="plain">
        <li>
          <strong>The CI</strong> runs the tests on Deno 2, Node.js 24, Bun,
          and workerd, the runtime of Cloudflare Workers, at the compatibility
          date <code>2025-09-01</code>.
        </li>
        <li>
          <strong>Brokers.</strong> The tests of NATS run against a real
          server on Deno, Node.js and Bun; those of Kafka against a real
          broker, on Node.js.
        </li>
        <li>
          <strong>Workers</strong> are tested in workerd, on a machine. A
          deployment to Cloudflare is not covered.
        </li>
        <li>
          <strong>The Autobahn test suite</strong> is run by hand:
          <a href="https://github.com/cho-js/cho/blob/45bb7873ab669f452a80e94f11a4c5fc7b561043/tools/autobahn/README.md"><code>tools/autobahn</code></a>.
        </li>
        <li>
          Each package says more in the "Runtime support" section of its
          README.
        </li>
      </ul>

      <p>Last checked on 2026-11-19.</p>
  </section>
</template>

<style scoped>
.scroll { overflow-x: auto; }
table { display: table; min-width: 36rem; width: 100%; }
th small { display: block; color: var(--vp-c-text-2); font-weight: normal; }
td { text-align: center; }
th[scope="row"], .group th { text-align: left; }
.legend { display: flex; flex-wrap: wrap; gap: 8px 20px; padding: 0; list-style: none; }
.legend li { margin: 0; }
.mark { display: inline-grid; place-items: center; width: 1.6rem; height: 1.6rem; border-radius: 50%; font-weight: bold; }
.legend .mark { margin-right: 6px; }
.yes { background: var(--vp-c-tip-soft); color: var(--vp-c-tip-1); }
.part { background: var(--vp-c-warning-soft); color: var(--vp-c-warning-1); }
.no { background: var(--vp-c-danger-soft); color: var(--vp-c-danger-1); }
sup { margin-left: 3px; }
.notes li { scroll-margin-top: calc(var(--vp-nav-height) + 4rem); }
.notes li:target { background: var(--vp-c-warning-soft); }
</style>
