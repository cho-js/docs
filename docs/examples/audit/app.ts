import {
  ChoCommand, Controller, Main, Module, provider, token,
} from "@chojs/command";

export const READ_CATALOG = token<() => Promise<string[]>>("read catalog");

@Controller({ dependencies: [READ_CATALOG] })
class Audit {
  constructor(readonly read: () => Promise<string[]>) {}

  @Main()
  async check() {
    const ids = await this.read();
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) {
        console.error("Duplicate identifier: " + id);
        return 1;
      }
      seen.add(id);
    }
    console.log("Checked " + ids.length + " identifiers");
    return 0;
  }
}

@Module({
  providers: [
    provider({
      provide: READ_CATALOG,
      factory: () => async () => (await Deno.readTextFile("catalog.txt"))
        .split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
    }),
  ],
  controllers: [Audit],
})
export class AuditModule {}

export const createApp = () => ChoCommand.create(AuditModule, { name: "audit" });
