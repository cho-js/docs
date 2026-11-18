import {
  Args, Body, ChoWeb, Controller, Doc, Get, Middlewares, Module, Param, Post, validate,
} from "@chojs/web";
import { Catalog } from "./catalog.ts";

export const bookTitle = {
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

  @Doc({
    operationId: "createBook",
    summary: "Add a book to the catalog",
    responses: { 201: { description: "Book created", contentType: "application/json" } },
  })
  @Post("")
  @Args(Body("title", bookTitle))
  create(title: string) {
    const book = this.catalog.add(title);
    return Response.json(book, {
      status: 201,
      headers: { location: "/api/books/" + book.id },
    });
  }

  @Doc({
    operationId: "findBook",
    summary: "Find a book by ID",
    responses: { 404: { description: "Book not found" } },
  })
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
