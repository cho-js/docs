import {
  ChoMessage, ChoMessageClient, contract, Controller, isReplyError,
  localSender, Middlewares, Module, ReplyError, Subscribe, validate,
} from "@chojs/message";

// #region contract
const nonemptyText = {
  parse(value: unknown): string {
    if (typeof value !== "string" || !value.trim()) throw new Error("Expected text");
    return value.trim();
  },
};

export const LocateCopy = contract({
  topic: "books.locate",
  request: nonemptyText,
  reply: nonemptyText,
});
// #endregion contract

// #region service
@Middlewares(validate())
@Controller({ topic: "books" })
class Shelves {
  private readonly shelves = new Map([["copy-17", "B2"]]);

  @Subscribe(LocateCopy)
  locate(copy: string): string {
    const shelf = this.shelves.get(copy);
    if (shelf === undefined) throw new ReplyError(404, "Unknown copy");
    return shelf;
  }
}

@Module({ controllers: [Shelves] })
class Library {}
// #endregion service

// #region caller
const app = await ChoMessage.create(Library);
try {
  const client = new ChoMessageClient(localSender(app));
  for (const copy of ["copy-17", "copy-99"]) {
    try {
      console.log(copy, await client.request(LocateCopy, copy));
    } catch (error) {
      if (!isReplyError(error, 404)) throw error;
      console.log(copy, error.code, error.description);
    }
  }
} finally {
  await app.close();
}
// #endregion caller
