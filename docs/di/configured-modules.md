# Configure a library module for an application

A label printer used by several libraries needs a branch name. Let the library own the printer and its default settings, and let each application supply the settings for its deployment. The [`configure`](/api/core#symbol-configure) helper is included in CHO 3.6.0.

## Publish a default

```ts
import { Injectable, Module, provider, token } from "@chojs/web";

export const BRANCH = token<string>("branch");

@Injectable([BRANCH])
export class Labels {
  constructor(readonly branch: string) {}
  print(title: string) {
    return "[" + this.branch + "] " + title;
  }
}

@Module({
  providers: [provider({ provide: BRANCH, factory: () => "central" }), Labels],
  exports: [Labels],
})
export class LabelsModule {}
```

Save this as `labels.ts`. The module exports the printer. Its settings remain private to the module's injector scope, even though the TypeScript file exports the token so callers can configure it.

## Supply the branch and use the printer

```ts
import { ChoWeb, configure, Controller, Get, Module, provider } from "@chojs/web";
import { BRANCH, Labels, LabelsModule } from "./labels.ts";

export const EastLabels = configure(LabelsModule, {
  name: "EastLabels",
  providers: [provider({ provide: BRANCH, factory: () => "east" })],
});

@Controller({ dependencies: [Labels] })
class Desk {
  constructor(readonly labels: Labels) {}

  @Get("label")
  label() {
    return this.labels.print("Odyssey");
  }
}

@Module({ imports: [EastLabels], controllers: [Desk] })
class Library {}

const app = await ChoWeb.create(Library);
try {
  const response = await app.handler(new Request("http://library/label"));
  console.log(await response.text()); // [east] Odyssey
} finally {
  await app.close();
}
```

The replacement matches the original provider by token. The configured class inherits the module's controllers, exports, middleware and options. If the replacement factory needs a settings service, include its module in `imports` on the same `configure` call and put the service in the provider's `deps`. Its module must export that service.

## Decide which consumers share the instance

Import the same `EastLabels` constant wherever consumers should share the printer. Every call to `configure` creates a distinct module with its own providers. A feature that imports the original `LabelsModule` still receives the central branch. Give distinct configurations meaningful names so dependency diagnostics identify the relevant one.

For a test that substitutes a provider throughout an application graph, pass `overrides` at application creation. For production configuration that belongs to one module, import the configured module at its point of use. [Provider overrides and disposal](/di/lifecycle) · [Configuration API](/api/core#symbol-configure)
