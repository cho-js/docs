import { Component } from "@angular/core";
import { httpResource } from "@angular/common/http";
import { RouterLink } from "@angular/router";

type DocItem = {
  id: string;
  title: string;
  path: string;
};

type DocCategory = {
  id: string;
  title: string;
  items: DocItem[];
};

@Component({
  selector: "cho-home",
  imports: [
    RouterLink,
  ],
  styles: ``,
  template: `
    <h1>home</h1>
    <ul>
      @for (category of docs.value(); track category.id) {
        <li>
          <span>{{ category.title }}</span>
          <ul>
            @for (item of category.items; track item.id) {
              <li>
                <a [routerLink]="['/doc', item.path]">{{ item.title }}</a>
              </li>
            }
          </ul>
        </li>
      }
    </ul>
  `,
})
export default class Home {
  docs = httpResource<DocCategory[]>(() => "/docs.json", { defaultValue: [] });
}
