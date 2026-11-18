import { ChoWeb, Controller, Get, Injectable, Module } from "@chojs/web";
import { env } from "cloudflare:workers";

@Injectable()
class BranchConfig {
  readonly name = (env as { BRANCH: string }).BRANCH;
}

@Controller({ dependencies: [BranchConfig] })
class Branch {
  constructor(readonly config: BranchConfig) {}

  @Get("branch")
  read() {
    return { branch: this.config.name };
  }
}

@Module({ providers: [BranchConfig], controllers: [Branch] })
class Library {}

const app = await ChoWeb.create(Library);
export default { fetch: app.handler };
