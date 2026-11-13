# Writing an adapter

An adapter connects `@chojs/web` to a router. It does no plumbing: it receives
the application's routes, each ready to call, and registers them. An adapter
is a few lines.

## The contract

An adapter implements `Linker`, from `@chojs/web/linker`:

```ts
interface Linker<T> {
  link(routes: readonly Route[]): Linked<T>;
}

interface Linked<T> {
  readonly instance: T; // the router's own application object
  readonly handler: (req: Request) => Promise<Response>;
}
```

Each `Route` is ready to call:

| Property | Holds                                                                      |
| -------- | -------------------------------------------------------------------------- |
| `method` | The HTTP method, upper case (`"GET"`)                                      |
| `path`   | The full path, global prefix included (`"/api/users/:id"`)                 |
| `name`   | Where it is declared, for logs (`"UsersController.get"`)                   |
| `handle` | `(req, params?, native?) => Promise<Response>`: answers a matching request |

`handle` runs the route's middlewares, its handler and its error handler. The
adapter gives it:

- the `Request`;
- the **decoded** path parameters of the match;
- optionally, its own request context, which handlers see as `ctx.native`.

It rejects when the route fails without an error handler, or when its error
handler fails: the adapter answers `500`.

## A minimal adapter

```ts
import type { Linked, Linker, Route } from "@chojs/web/linker";

class MyLinker implements Linker<MyServer> {
  link(routes: readonly Route[]): Linked<MyServer> {
    const server = new MyServer();
    for (const route of routes) {
      server.on(
        route.method,
        route.path,
        (req, params) => route.handle(req, params),
      );
    }
    return { instance: server, handler: (req) => server.fetch(req) };
  }
}

const app = await ChoWeb.create(App, { linker: new MyLinker() });
```

## A complete one, without a library

A linker that matches the routes itself, in declaration order:

```ts
import type { Linked, Linker, Route } from "@chojs/web/linker";

type Table = readonly { route: Route; segments: string[] }[];

function match(
  segments: string[],
  path: string[],
): Record<string, string> | undefined {
  if (segments.length !== path.length) return undefined;
  const params: Record<string, string> = {};
  for (const [i, segment] of segments.entries()) {
    const value = path[i]!;
    if (segment.startsWith(":")) {
      params[segment.slice(1)] = decodeURIComponent(value);
    } else if (segment !== value) {
      return undefined;
    }
  }
  return params;
}

export class TableLinker implements Linker<Table> {
  link(routes: readonly Route[]): Linked<Table> {
    const table = routes.map((route) => ({
      route,
      segments: route.path.split("/"),
    }));

    const handler = async (req: Request): Promise<Response> => {
      const path = new URL(req.url).pathname.split("/");
      for (const { route, segments } of table) {
        if (route.method !== req.method) continue;
        const params = match(segments, path);
        if (!params) continue;
        try {
          return await route.handle(req, params);
        } catch (error) {
          console.error(error); // no error handler took it
          return new Response("Internal Server Error", { status: 500 });
        }
      }
      return new Response("Not Found", { status: 404 });
    };

    return { instance: table, handler };
  }
}
```

## What an adapter decides

`@chojs/web` guarantees the routes it hands over: they are valid, unique by
method and path, and in declaration order. The rest is the adapter's, and
worth documenting in a "Behavior" table like the built-in ones:

| Decision                | Notes                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| Path syntax             | A path is `/`-separated segments; `:name` matches one segment. Translate it if your router writes parameters differently |
| When two routes match   | First declared, or most specific                                         |
| `HEAD` without `@Head`  | The built-in adapters answer from `@Get`, without the body               |
| No route matches        | Your not-found answer. It never reaches CHO's error handlers             |
| A route rejects         | Answer `500`, and log                                                    |
| `ctx.native`            | What you pass as the third argument of `handle`, if anything             |
| Reuse                   | Whether one linker can link several applications                         |

## The graph

The tree behind the routes is on `app.graph` (types in `@chojs/web/graph`),
with every instance, middleware and error handler already created:

| Node            | Holds                                                                            |
| --------------- | -------------------------------------------------------------------------------- |
| `AppRef`        | `route` (the global prefix), `errorHandler` (the application's), `features`      |
| `FeatureRef`    | `route`, `middlewares`, `errorHandler`, `controllers`                            |
| `ControllerRef` | `route`, `middlewares`, `errorHandler`, `instance`, `methods`                    |
| `MethodRef`     | `route`, `middlewares`, `errorHandler`, `name`, `method` (`"GET"`, …), `handler` |

It is for introspection, such as generating a route listing or an API
description. An adapter only needs the routes.
