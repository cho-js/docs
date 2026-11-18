import { ChoWeb, Controller, Get, Module, Param, Args } from "@chojs/web";

@Controller({ route: "books" })
class Books {
  @Get(":id")
  @Args(Param("id"))
  find(id: string) {
    return { id, title: "The Odyssey" };
  }
}

@Module({ controllers: [Books] })
export class Library {}

export const createApp = () => ChoWeb.create(Library, { prefix: "api" });
