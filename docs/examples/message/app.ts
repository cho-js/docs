import {
  ChoMessage, type ChoMessageContext, Controller, Module, Subscribe,
} from "@chojs/message";

@Controller({ topic: "books" })
class Inventory {
  @Subscribe("received")
  receive(ctx: ChoMessageContext) {
    const value = ctx.json<unknown>();
    if (typeof value !== "object" || value === null ||
        !("isbn" in value) || typeof value.isbn !== "string") {
      throw new TypeError("Expected a string isbn");
    }
    console.log("Received " + value.isbn + " on " + ctx.topic);
  }
}

@Module({ controllers: [Inventory] })
export class Library {}

export const createApp = () => ChoMessage.create(Library);
