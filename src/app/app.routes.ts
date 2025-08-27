import {Routes} from "@angular/router";

export default [
  {
    path: "home",
    loadComponent: () => import("./home/home"),
  },
  {
    path: "doc/:id",
    loadComponent: () => import("./doc/doc"),
  },
  {
    path: "",
    redirectTo: "home",
    pathMatch: "full",
  },
] as Routes;
