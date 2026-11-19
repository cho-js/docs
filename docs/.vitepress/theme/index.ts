// The default VitePress theme, with the CHO colors, and the styles of the
// home page (docs/index.md).
import DefaultTheme from "vitepress/theme-without-fonts";
import { h } from "vue";
import SiteFooter from "./SiteFooter.vue";
// @ts-ignore
import "./custom.css";
// @ts-ignore
import "./home.css";

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { "layout-bottom": () => h(SiteFooter) }),
};
