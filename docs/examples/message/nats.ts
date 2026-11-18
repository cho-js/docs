import { connect } from "@nats-io/transport-deno";
import {
  ChoMessage,
  type ChoMessageContext,
  ChoMessageReply,
  Controller,
  Module,
  Subscribe,
} from "@chojs/message";
import { ERROR_HEADERS, NatsLinker } from "@chojs/vendor-nats";

class UnknownCopy extends Error {}

@Controller({ topic: "books" })
class Shelves {
  private readonly shelves = new Map([["copy-17", "B2"]]);

  @Subscribe("locate")
  locate(ctx: ChoMessageContext) {
    const copy = ctx.text();
    const shelf = this.shelves.get(copy);
    if (shelf === undefined) throw new UnknownCopy(copy);
    return new ChoMessageReply({ copy, shelf }, {
      headers: { "Content-Type": "application/json" },
    });
  }
}

@Module({ controllers: [Shelves] })
class Library {}

const app = await ChoMessage.create(Library, {
  linker: new NatsLinker({
    connect: () => connect({ servers: "127.0.0.1:4222" }),
    queue: "library",
    errorReply: (error) =>
      error instanceof UnknownCopy
        ? { code: 404, description: "Unknown copy" }
        : undefined,
  }),
});

try {
  await app.start();
  const nc = app.linked.instance;
  for (const copy of ["copy-17", "copy-99"]) {
    const reply = await nc.request("books.locate", copy, { timeout: 2000 });
    const code = reply.headers?.get(ERROR_HEADERS.code);
    if (code) {
      console.log(copy, code, reply.headers?.get(ERROR_HEADERS.description));
    } else {
      const { shelf } = reply.json<{ shelf: string }>();
      console.log(copy, shelf, reply.headers?.get("Content-Type"));
    }
  }
} finally {
  await app.close();
}
