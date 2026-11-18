import {
  Catch,
  ChoMessage,
  type ChoMessageContext,
  Controller,
  Module,
  Subscribe,
} from "@chojs/message";

class UnknownCopy extends Error {}

@Controller({ topic: "books" })
class Shelves {
  private readonly shelves = new Map([["copy-17", "B2"]]);

  @Subscribe("locate")
  @Catch((error) => {
    if (error instanceof UnknownCopy) return { found: false };
    return false;
  })
  locate(ctx: ChoMessageContext) {
    const shelf = this.shelves.get(ctx.text());
    if (shelf === undefined) throw new UnknownCopy();
    return { found: true, shelf };
  }
}

@Module({ controllers: [Shelves] })
class Library {}

const app = await ChoMessage.create(Library);
try {
  for (const copy of ["copy-17", "copy-99"]) {
    const reply = await app.handle("books.locate", { value: copy });
    if (reply === undefined) throw new Error("Expected a shelf lookup reply");
    const result = JSON.parse(new TextDecoder().decode(reply.value));
    console.log(copy, result.found ? result.shelf : "unknown copy");
  }
} finally {
  await app.close();
}
