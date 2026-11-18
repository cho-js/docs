import {
  Action, ChoCommand, type ChoCommandContext, Controller, Help, Module,
} from "@chojs/command";

@Help("Library catalog")
@Controller()
class Catalog {
  @Help("Print a label for a book")
  @Action("label", {
    string: ["shelf"],
    alias: { s: "shelf" },
    default: { shelf: "general" },
    describe: { shelf: "Shelf printed on the label" },
  })
  label({ args }: ChoCommandContext) {
    const [title] = args._;
    if (title === undefined) {
      console.error("Supply a book title.");
      return 2;
    }
    console.log("[" + args.shelf + "] " + title);
  }
}

@Module({ controllers: [Catalog] })
class Library {}

export const createApp = () =>
  ChoCommand.create(Library, { name: "library", version: "1.0.0" });
