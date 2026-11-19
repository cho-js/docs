# Name and inspect subscriptions

Topics are exact, case-sensitive names. Choose names that producer and consumer can agree on independently. For example, the full topic `prod.library.books.received` can be assembled from four optional pieces:

| Part | Declared in | Example |
| --- | --- | --- |
| Deployment namespace | `ChoMessage.create` or `from` option `prefix` | `prod` |
| Feature namespace | Declaring module's `topic` | `library` |
| Controller namespace | Controller's `topic` | `books` |
| Event | `@Subscribe` argument | `received` |

CHO joins nonempty parts with a dot. A module that imports a feature contributes no additional namespace to that feature's subscriptions. `@Subscribe("")` inherits the surrounding parts, provided the final topic has at least one segment.

## Check the producer's contract

A [message contract](/message/contracts) names the whole application topic before the deployment prefix. For example, a contract for `library.books.received` can be handled under module `library` and controller `books`. A client and server configured with `prefix: "prod"` then address `prod.library.books.received`.

```ts
const app = await ChoMessage.create(Library, { prefix: "prod" });
console.table(app.routes.map(({ topic, name }) => ({ topic, name })));
```

Use the full topic from this table for `app.handle` or your producer. The delivery key can identify a book or shipment. It plays no part in selecting the method.

## Resolve declaration errors

A segment accepts ASCII letters, digits, underscore and hyphen. Use dots between segments. Empty segments, a leading or trailing dot, wildcards and parameters are invalid. CHO accepts one handler per fully assembled topic. A duplicate at creation often means a controller was registered by two modules or two features supplied the same prefix.

When several independent systems need the same events, configure their broker subscriptions or consumer groups. CHO's route table within one application still maps each topic to one method.

## Compare the published and subscribed names

Log the full topic from `app.routes` and use that exact string with `app.handle`. Then change the application's prefix. A producer must address the new full topic too. For typed clients set the deployment prefix on the client while keeping the shared contract stable.
