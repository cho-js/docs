# Share a message contract between services

A checkout service needs a shelf location from the catalog. Give both services the same contract so they agree on the subject, the request and the reply. The example uses a local sender first and then shows how to use the same client over NATS.

## Define the lookup

Put the contract and its validators in a file or package both services import. This lookup accepts a copy ID and returns a shelf label. Both are nonempty strings encoded as JSON, including the quotation marks on the wire.

<<< @/examples/message/contracts.ts#contract

A Standard Schema can describe different input and output types. For a parse-only validator, CHO infers both from the awaited result. For an event, omit `reply` and use `client.publish`. If you only need compile-time types, use `contract<Request, Reply>({ topic })`. Type parameters alone perform no runtime checks.

## Implement the subscriber

<<< @/examples/message/contracts.ts#service

`@Subscribe(LocateCopy)` supplies the decoded request, followed by an optional delivery context. It already declares how to read the payload, so adding [`@Args`](/api/message#symbol-Args) to the same method is an error. [`validate()`](/api/message#symbol-validate) runs the request validator on the receiving route. A client checks the reply validator when it reads the answer.

Use the whole topic in the contract. The declaring feature and controller topics must match its leading segments. If the application uses a deployment prefix such as `staging`, put that prefix in the application's options and the client's options. Both then address `staging.books.locate` using the same contract.

## Try both outcomes in memory

<<< @/examples/message/contracts.ts#caller

::: details Complete contracts.ts
<<< @/examples/message/contracts.ts
:::

Save the complete file as `examples/contracts.ts` in the [development checkout](/guide/getting-started#run-examples-against-the-development-version). Run `deno run examples/contracts.ts`. Expect `copy-17 B2` and `copy-99 404 Unknown copy`. The test goes through JSON encoding, validation, the handler and reply decoding. Local failures propagate directly from `app.handle`.

## Send through a broker

Keep the linker you pass to `ChoMessage.create`. After `await app.start()`, use its sender in place of `localSender(app)`. With a started [NATS linker](/message/nats), the request becomes:

```ts
const client = new ChoMessageClient(linker.sender, { timeout: 2000 });
const shelf = await client.request(LocateCopy, "copy-17", {
  headers: { "X-Branch": "central" },
});
```

Supply `prefix` and a default request timeout on the client. Individual calls accept `headers` and `key`, and requests can override `timeout` in milliseconds. Kafka preserves a key and supports `publish`. Core NATS supports both `publish` and `request` and ignores keys. For a storage acknowledgment on NATS, use the [JetStream publisher](/message/jetstream).

| What the requester observes | How to handle it |
| --- | --- |
| The service reports a domain failure | Match `isReplyError(error, 404)` or read its public `code` and `description` |
| No Core NATS subscriber or the request expires | Match `CHO_MESSAGE_NO_RESPONDERS` or `CHO_MESSAGE_REQUEST_TIMEOUT` with `isChoError` |
| The sender only supports publishing | `request` rejects with `CHO_MESSAGE_NO_REPLIES` |
| The answer is malformed JSON or the reply validator rejects it | Inspect `CHO_MESSAGE_UNEXPECTED_REPLY` and its cause |

An empty answer is decoded as `undefined` before the reply validator runs. For callers that need raw bytes or reply headers, use the [native NATS request](/message/nats).

## Move from an in-process client to NATS

Keep the contract and the subscriber unchanged. Replace the local sender with the started NATS linker's sender and set a request timeout. Compare a domain error returned by the service with a request sent when nobody is listening. A caller can handle these failures differently.

## Use different types on the wire and in the handler

For an RPC that accepts a decimal ID, use a schema whose input is a string and whose output is a number. Both sides import the same contract. Here the reply also crosses the wire as a string.

```ts
import { z } from "zod";
import { contract, Controller, Middlewares, Subscribe, validate } from "@chojs/message";

const Decimal = z.string().regex(/^\d+$/).transform(Number);
export const NextId = contract({ topic: "catalog.next", request: Decimal, reply: Decimal });

@Middlewares(validate())
@Controller({ topic: "catalog" })
class Numbers {
  @Subscribe(NextId)
  next(id: number): string { return String(id + 1); }
}

// In the caller, using a connected client or a local sender:
// const next = await client.request(NextId, "41"); // number: 42
```

The four contract parameters are `Contract<Request, Reply, Sent, Returned>`. Here they are `number, number, string, string`. The client serializes the sent value; the subscriber validates the decoded request. The handler returns the reply schema's input; the caller validates and transforms the decoded reply. A rejected reply value yields `CHO_MESSAGE_UNEXPECTED_REPLY`. An exception thrown inside Standard Schema's validation function propagates to the caller. For parse-only validators or an unspecified input type, contract inference uses the output as the wire type.
