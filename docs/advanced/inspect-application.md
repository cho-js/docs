# Inspect an application

Use `@chojs/dev` to answer two questions during development: which operations does the application expose, and which modules and providers implement them? Starting from a root module reads the decorator metadata without opening a listener, connecting to a broker or running provider factories.

Add the package to the project you want to inspect: `deno add jsr:@chojs/dev`, `npx jsr add @chojs/dev` (Node.js), or `bunx jsr add @chojs/dev`.

## Find the handler for an endpoint

In a [generated web project](/guide/create-workspace), import the root module from `app.ts`. The endpoint table puts the HTTP method and path alongside the controller handler and declaring module.

```ts
import { endpoints, formatEndpoints, printEndpoints } from "@chojs/dev";
import { AppModule } from "./app.ts";

printEndpoints(AppModule);
const http = formatEndpoints(AppModule, { types: ["http"] });
const sockets = endpoints(AppModule).filter(endpoint => endpoint.type === "ws");
console.log(http, sockets.map(endpoint => endpoint.path));
```

Use `endpoints` for structured records, `formatEndpoints` to get a string, or `printEndpoints` to write the table to the console. The two table functions take `FormatEndpointsOptions`. Filter by any `ChoDevEndpointType`: `http`, `sse`, `ws`, `message` or `command`. Inspect a Web or Message application instance to include its configured prefix and, for Web, routes already added with `app.mount`. For command discovery, pass the root module.

## Trace a dependency

```ts
import { filterGraph, inspect, toDot, toMermaid } from "@chojs/dev";
import { AppModule } from "./app.ts";

const graph = inspect(AppModule);
if (graph.error) console.error(graph.error.code, graph.error.message);

const controller = graph.nodes.find(node => node.kind === "controller");
if (controller) {
  const nearby = filterGraph(graph, { around: controller.id, depth: 1 });
  console.log(toMermaid(nearby));
}
console.log(toDot(graph, { kinds: ["module"] }));
```

`inspect` takes a `ChoDevTarget` (a root module, injector, supported application or existing graph) and returns a serializable `ChoDevGraph`. The graph holds the root ID, nodes, edges and an optional diagnostic in `error`. A missing or ambiguous dependency leaves a partial graph with a diagnostic. Look for a node of kind `missing` and follow its incoming edges to see who requested it. Invalid module metadata, including circular imports, can throw before a model is available.

`filterGraph` takes a `ChoDevFilter`. Combine `kinds` with a case-insensitive `search` for a name, route, topic or command. For a neighborhood, use an actual node ID in `around`. The default `depth` is one step. Matching endpoints retain their controller and module for context. `toMermaid` and `toDot` accept the same filter and return diagram source suitable for Mermaid or Graphviz.

| Model type | What to read |
| --- | --- |
| `ChoDevNode`, `ChoDevNodeKind` | Narrow by `kind`. Every node has an ID, a display name and an owning module. |
| `ChoDevModule`, `ChoDevController` | Read middleware names and the assigned error handler. A module also identifies whether it is the root. |
| `ChoDevProvider`, `ChoDevMissing` | Identify a declared token or a dependency the graph could not resolve. |
| `ChoDevEndpoint`, `ChoDevSocketEvent` | Read the handler and its path, topic or command. Socket endpoints also list handled events. |
| `ChoDevEdge` | Follow `from` and `to` for an `imports`, `exports` or `injects` relation. |
| `ChoDevInjector`, `ChoDevApplication` | Structural interfaces for inspecting an existing injector or application. |
| `ChoDevErrorCode` | Distinguish invalid targets, invalid option values and unknown node IDs. |

## Open the graph in a browser

Mount the developer routes after creating the web application and adding the routes you want to inspect. This example uses the generated web project's `AppModule` and is intended for local development.

```ts
import { devRoutes } from "@chojs/dev";
import { ChoWeb } from "@chojs/web";
import { serve } from "@chojs/web/serve";
import { AppModule } from "./app.ts";

const app = await ChoWeb.create(AppModule);
devRoutes(app, { title: "Library application" });
await serve(app, { port: 3000 });
```

Open `http://localhost:3000/__cho` for the interactive diagram or `/__cho/graph.json` for the snapshot. Both routes sit outside the application's global prefix. The snapshot captures routes registered before `devRoutes`. To restrict access, supply authentication middleware in `DevRoutesOptions.middlewares` for both endpoints. Application-wide middleware does not run on these mounted routes. Set `route` to change their common base. The accepted web application interface is `ChoDevWebApplication`.

For a standalone report, save the HTML string returned by `graphPage(AppModule, { title: "Library" })`. The page embeds the model and loads the viewer libraries from a CDN. To host them yourself, set `assets` in `GraphPageOptions` or `DevRoutesOptions` to a directory containing `cytoscape.min.js`, `elk.bundled.js` and `cytoscape-elk.js`. The exported `PAGE_VERSIONS` lists the versions used by the viewer.
