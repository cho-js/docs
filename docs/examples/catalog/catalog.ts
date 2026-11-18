import { Injectable } from "@chojs/web";

export type Book = { id: string; title: string };

@Injectable()
export class Catalog {
  readonly #books = new Map<string, Book>();

  add(title: string): Book {
    const book = { id: crypto.randomUUID(), title };
    this.#books.set(book.id, book);
    return book;
  }

  find(id: string): Book | undefined {
    return this.#books.get(id);
  }
}
