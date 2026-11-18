import {
  Args, ChoMessage, Controller, Header, isChoError, Key, Middlewares,
  Module, Subscribe, validate, Value,
} from "@chojs/message";

const isbn = {
  parse(value: unknown): string {
    if (typeof value !== "string" || !value.trim()) throw new Error("Missing ISBN");
    return value.trim();
  },
};

@Middlewares(validate())
@Controller({ topic: "books" })
class Inventory {
  @Subscribe("received")
  @Args(Value("isbn", isbn), Key(), Header("branch"))
  receive(isbn: string, copy: string | undefined, branch: string | undefined) {
    console.log(isbn, copy, branch);
  }
}

@Module({ controllers: [Inventory] })
class Library {}

const app = await ChoMessage.create(Library);
try {
  await app.handle("books.received", {
    value: '{"isbn":" 9780140268867 "}', key: "copy-17", headers: { branch: "central" },
  });
  try {
    await app.handle("books.received", { value: '{"isbn":17}' });
  } catch (error) {
    if (!isChoError(error, "CHO_MESSAGE_INVALID_MESSAGE")) throw error;
    console.log(error.code);
  }
} finally {
  await app.close();
}
