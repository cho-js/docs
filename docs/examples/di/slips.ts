import {
  ChoWeb, type ChoWebContext, type ChoWebNext, Controller, Get,
  Injectable, Middlewares, Module, provider, token,
} from "@chojs/web";

// #region creator
class Slip {
  readonly id = crypto.randomUUID();
}

const NEW_SLIP = token<() => Slip>("new checkout slip");
const slipProvider = provider({
  provide: NEW_SLIP,
  factory: () => () => new Slip(),
});
// #endregion creator

// #region request
const CURRENT_SLIP = Symbol("current checkout slip");

@Injectable([NEW_SLIP])
class OpenSlip {
  constructor(readonly newSlip: () => Slip) {}

  async handle(ctx: ChoWebContext, next: ChoWebNext) {
    const slip = this.newSlip();
    ctx.state.set(CURRENT_SLIP, slip);
    const response = await next();
    response.headers.set("X-Slip-Id", slip.id);
    return response;
  }
}

@Middlewares(OpenSlip)
@Controller()
class Checkout {
  @Get("slip")
  read(ctx: ChoWebContext) {
    const slip = ctx.state.get(CURRENT_SLIP);
    if (!(slip instanceof Slip)) throw new Error("Missing checkout slip");
    return { id: slip.id };
  }
}
// #endregion request

@Module({ providers: [slipProvider, OpenSlip], controllers: [Checkout] })
class Library {}

export const createApp = () => ChoWeb.create(Library);
