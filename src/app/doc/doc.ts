import {ApplicationRef, Component, effect, inject} from "@angular/core";
import {toSignal} from "@angular/core/rxjs-interop";
import {ActivatedRoute, RouterLink} from "@angular/router";
import {map} from "rxjs";
import {Markdown} from "@xprng/markdown";
import {httpResource} from '@angular/common/http';
import pop from '../pop/pop';

export type DocItem = {
  id: string;
  title: string;
  path: string;
};

export type DocCategory = {
  id: string;
  title: string;
  items: DocItem[];
};

@Component({
  selector: "cho-doc",
  imports: [
    Markdown,
    RouterLink,
  ],
  styles: `
    :host {
      display: flex;
      width: 100%;
      flex-wrap: wrap;
    }

    main {
      padding: 1em 0;
    }

    aside {
      padding: 1em;
    }

    @media screen and (min-width: 576px) {
      aside {
        nav {
          position: sticky;
          top: 1em;
        }
      }
    }
  `,
  template: `
    <aside>
      <nav>
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
      </nav>
    </aside>
    <main class="container">
      <xpr-markdown [src]="src()"/>
    </main>
  `,
})
export default class Doc {
  app = inject(ApplicationRef);
  docs = httpResource<DocCategory[]>(() => "/docs.json", {defaultValue: []});

  src = toSignal(
    inject(ActivatedRoute).params.pipe(
      map((p) => p["id"] ? p["id"] + ".md" : undefined),
    ),
  );

  constructor() {
  }
}
