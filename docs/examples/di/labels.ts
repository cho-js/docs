import { Injectable, Injector, Module, provider, token } from "@chojs/core";

// #region value
const BRANCH = token<string>("library branch");
const branchProvider = provider({ provide: BRANCH, factory: () => "Central" });
// #endregion value

// #region class
interface LabelPrinter {
  print(title: string): string;
}

class ShelfPrinter implements LabelPrinter {
  constructor(readonly branch: string) {}

  print(title: string) {
    return `${this.branch} | ${title}`;
  }
}

const PRINTER = token<LabelPrinter>("label printer");
const printerProvider = provider({
  provide: PRINTER,
  deps: [BRANCH],
  factory: (branch) => new ShelfPrinter(branch),
});
// #endregion class

// #region alias
const RETURNS_PRINTER = token<LabelPrinter>("returns desk printer");
const returnsPrinterProvider = provider({
  provide: RETURNS_PRINTER,
  deps: [PRINTER],
  factory: (printer) => printer,
});
// #endregion alias

// #region factory
const PRINT_BATCH = token<(titles: readonly string[]) => string[]>("print batch");
const batchProvider = provider({
  provide: PRINT_BATCH,
  deps: [PRINTER],
  factory: (printer) => (titles) => titles.map((title) => printer.print(title)),
});
// #endregion factory

// #region consumer
@Injectable([PRINT_BATCH])
class ReturnsDesk {
  constructor(readonly labelsFor: (titles: readonly string[]) => string[]) {}
}

@Module({
  providers: [branchProvider, printerProvider, returnsPrinterProvider, batchProvider, ReturnsDesk],
})
class Library {}

const injector = new Injector(Library);
try {
  const desk = await injector.resolve(ReturnsDesk);
  console.log(desk.labelsFor(["The Odyssey"])[0]);
  const printer = await injector.resolve(PRINTER);
  console.log(printer === await injector.resolve(RETURNS_PRINTER));
} finally {
  await injector.dispose();
}
// #endregion consumer
