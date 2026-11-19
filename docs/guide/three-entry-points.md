# Expose one catalog through HTTP, a CLI and messages

A help desk needs three ways to look up a shelf. A browser sends a book ID in a path, a librarian passes it on the command line, and a second service sends a request with a JSON payload. Build the lookup once, then translate each input at its own controller. This walkthrough runs in memory so you can see exactly what each application contributes.

## Give the catalog a module

Install `@chojs/web`, `@chojs/command`, `@chojs/message` and `@chojs/core` using the [project setup instructions](/guide/getting-started). Save this shared code as `catalog.ts`.

```ts
import { Injectable, Module } from "@chojs/core";

@Injectable()
export class Catalog {
  private readonly shelves = new Map([["42", "B2"]]);

  shelf(id: string) {
    return this.shelves.get(id);
  }
}

@Module({ providers: [Catalog], exports: [Catalog] })
export class CatalogModule {}
```

Each root below imports the module and declares its own controller. You can deploy them independently. Each application you create this way owns its instances. To share mutable state across processes, use an external store. For two entry points inside one process, see [sharing an injector](/message/with-web).

## Return a resource to a browser

Save as `http.ts`. A missing ID is an HTTP concern here. The catalog does not need to construct an HTTP error.

```ts
import { Args, ChoWeb, Controller, Get, HttpError, Module, Param } from "@chojs/web";
import { Catalog, CatalogModule } from "./catalog.ts";

@Controller({ route: "books", dependencies: [Catalog] })
class Books {
  constructor(readonly catalog: Catalog) {}

  @Get(":id")
  @Args(Param("id"))
  find(id: string) {
    const shelf = this.catalog.shelf(id);
    if (shelf === undefined) throw new HttpError(404, "Unknown book");
    return { id, shelf };
  }
}

@Module({ imports: [CatalogModule], controllers: [Books] })
class HttpRoot {}

const web = await ChoWeb.create(HttpRoot);
try {
  const response = await web.handler(new Request("http://library/books/42"));
  console.log(response.status, await response.json()); // 200, { id: "42", shelf: "B2" }
} finally {
  await web.close();
}
```

Replace `42` in the URL with `99` to receive a 404. To expose the same handler over a socket or Fetch event, continue with [runtime setup](/guide/runtimes).

## Report a result to the shell

Save as `cli.ts`. The caller needs a line of text and an exit status. Use a named string flag to preserve identifiers such as `0042` exactly.

```ts
import { Action, ChoCommand, type ChoCommandContext, Controller, Module } from "@chojs/command";
import { Catalog, CatalogModule } from "./catalog.ts";

@Controller({ dependencies: [Catalog] })
class Desk {
  constructor(readonly catalog: Catalog) {}

  @Action("locate", { string: ["id"], describe: { id: "Book identifier" } })
  locate({ args }: ChoCommandContext) {
    const shelf = typeof args.id === "string" ? this.catalog.shelf(args.id) : undefined;
    if (shelf === undefined) {
      console.error("Unknown book");
      return 1;
    }
    console.log(shelf);
    return 0;
  }
}

@Module({ imports: [CatalogModule], controllers: [Desk] })
class CommandRoot {}

const cli = ChoCommand.create(CommandRoot, { name: "library" });
try {
  console.log(await cli.run(["locate", "--id", "42"])); // prints B2, then 0
} finally {
  await cli.close();
}
```

Pass `["locate", "--help"]` to see the interface built from the declaration. For a distributed executable, the launcher passes the process arguments to `run` and forwards the exit status. [Connect the launcher](/command/quick-start)

## Answer another service

Save as `subscriber.ts`. Put the topic and request/reply types in a contract that can also be imported by the calling service. A missing book is a domain error the requester can identify by code.

```ts
import {
  ChoMessage, ChoMessageClient, contract, Controller, localSender,
  Module, ReplyError, Subscribe,
} from "@chojs/message";
import { Catalog, CatalogModule } from "./catalog.ts";

const Locate = contract<string, string>({ topic: "books.locate" });

@Controller({ dependencies: [Catalog] })
class Lookups {
  constructor(readonly catalog: Catalog) {}

  @Subscribe(Locate)
  locate(id: string) {
    const shelf = this.catalog.shelf(id);
    if (shelf === undefined) throw new ReplyError(404, "Unknown book");
    return shelf;
  }
}

@Module({ imports: [CatalogModule], controllers: [Lookups] })
class MessageRoot {}

const messages = await ChoMessage.create(MessageRoot);
try {
  const client = new ChoMessageClient(localSender(messages));
  console.log(await client.request(Locate, "42")); // B2
} finally {
  await messages.close();
}
```

Run each file with your [TypeScript runner](/guide/runtimes). Change the client request to `"99"` and observe the rejected reply. When the caller becomes a separate process, use a [NATS sender](/message/nats). For an event with no reply, define an event contract and publish it through [Kafka](/message/kafka) or [JetStream](/message/jetstream). To accept untrusted payloads, add runtime validators to the [shared contract](/message/contracts).
