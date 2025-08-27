import {ApplicationRef, Component, computed, createComponent, input, inputBinding, signal} from '@angular/core';

@Component({
  selector: 'cho-pop',
  host: {
    '[style.transform]': 'transform()',
    '[style.width]': 'show() ? "auto" : "2em"',
  },
  imports: [],
  styles: `
    :host {
      display: block;
      text-wrap: wrap;
      max-width: 20em;
      color: var(--pico-secondary-inverse) !important;
      background: var(--pico-secondary-background);
      padding: 0.5em;
      border-radius: 0.25em;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      z-index: 1000;
    }

    span.none {

    }
  `,
  template: `
    @if (show()) {
      <span style="float: right;color:red;cursor: pointer" (click)="show.set(!show())">*</span>
      <span [class]="type()">{{ content() }}</span>
    } @else {
      <div style="color:red;cursor: pointer;text-align: center" (click)="show.set(!show())">*</div>
    }
  `
})
export class Pop {
  readonly content = input.required<string>();
  readonly type = input.required<string>();
  readonly x = input.required<string>();
  readonly y = input.required<string>();

  protected readonly show = signal(true);
  protected readonly transform = computed(() => `translateY(${this.y()}em) translateX(${this.x()}em)`);
}


export default function pop(ref: ApplicationRef, root?: HTMLElement) {
  for (const line of (root ?? document).querySelectorAll<HTMLElement>('.line')) {
    if (!line.innerHTML.includes("////")) {
      continue;
    }
    const [command, ...args] = line.innerText.replace("////", "").trim().split(
      "|",
    );

    switch (command) {
      case "pop": {
        const [type = "none", x, y, text] = args;
        const comp = createComponent(Pop, {
          hostElement: line.firstElementChild as HTMLElement,
          environmentInjector: ref.injector,
          bindings: [
            inputBinding("type", () => type),
            inputBinding("content", () => text),
            inputBinding("x", () => x === "" ? "0" : x),
            inputBinding("y", () => y === "" ? "0" : y),
          ],
        });
        ref.attachView(comp.hostView);
        comp.changeDetectorRef.detectChanges();
        break;
      }
    }
  }
}
