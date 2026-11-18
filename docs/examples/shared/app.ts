import {
  Args, ChoWeb, Controller as HttpController, Get, Injectable, Module, Param,
} from "@chojs/web";
import {
  ChoMessage, type ChoMessageContext, Controller as MessageController, Subscribe,
} from "@chojs/message";

@Injectable()
class Inventory {
  readonly received = new Set<string>();
}

@MessageController({ topic: "books", dependencies: [Inventory] })
class Shipments {
  constructor(readonly inventory: Inventory) {}

  @Subscribe("received")
  receive(ctx: ChoMessageContext) {
    if (!ctx.key) throw new Error("Expected a shipment key");
    this.inventory.received.add(ctx.key);
  }
}

@HttpController({ route: "shipments", dependencies: [Inventory] })
class Status {
  constructor(readonly inventory: Inventory) {}

  @Get(":key")
  @Args(Param("key"))
  status(key: string) {
    return { received: this.inventory.received.has(key) };
  }
}

@Module({ providers: [Inventory], controllers: [Shipments, Status] })
class Library {}

const web = await ChoWeb.create(Library);
try {
  const messages = await ChoMessage.from(web.injector);
  try {
    await messages.handle("books.received", { key: "copy-17" });
    const result = await web.handler(new Request("http://library/shipments/copy-17"));
    console.log(await result.text());
  } finally {
    await messages.close();
  }
} finally {
  await web.close();
}
