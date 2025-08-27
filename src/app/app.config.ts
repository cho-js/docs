import {ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection,} from "@angular/core";
import {provideRouter, withViewTransitions} from "@angular/router";
import Routes from "./app.routes";
import {provideHttpClient, withFetch} from "@angular/common/http";

export default {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(Routes, withViewTransitions()),
    provideHttpClient(withFetch()),
  ],
} as ApplicationConfig;
