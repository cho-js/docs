import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "cho-root",
  imports: [RouterOutlet],
  template: "<router-outlet />",
  styles: [],
})
export default class App {
}
