import {
  Args, Body, ChoWeb, Controller, Get, Middlewares, Module, Param, Post, validate,
} from "@chojs/web";
import { Catalog } from "./catalog.ts";

const title = {
  parse(value: unknown): string {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error("Supply a non-empty title");
    }
    return value.trim();
  },
};

@Middlewares(validate())
@Controller({ route: "books", dependencies: [Catalog] })
class Books {
  constructor(readonly catalog: Catalog) {}

  @Post("")
  @Args(Body("title", title))
  create(title: string) {
    const book = this.catalog.add(title);
    return Response.json(book, {
      status: 201,
      headers: { location: "/api/books/" + book.id },
    });
  }

  @Get(":id")
  @Args(Param("id"))
  find(id: string) {
    return this.catalog.find(id) ??
      Response.json({ error: "Book not found" }, { status: 404 });
  }
}

@Module({ providers: [Catalog], controllers: [Books] })
export class Library {}

export const createApp = () => ChoWeb.create(Library, { prefix: "api" });
