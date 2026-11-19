<script setup lang="ts">
import { withBase } from "vitepress";
</script>

<template>
  <footer class="site-footer">
    <nav class="footer-links" aria-label="Footer">
      <div class="identity">
        <a :href="withBase('/')" aria-label="CHO home"><img :src="withBase('/cho.svg')" alt="" width="38" height="38"> CHO</a>
        <a href="https://github.com/cho-js/cho/blob/main/LICENSE">MIT License</a>
      </div>
      <div>
        <strong>Documentation</strong>
        <a :href="withBase('/guide/introduction')">Guides</a>
        <a :href="withBase('/api/')">API reference</a>
        <a :href="withBase('/reference/compatibility')">Runtime compatibility</a>
      </div>
      <div>
        <strong>Project</strong>
        <a :href="withBase('/about')">About CHO</a>
        <a :href="withBase('/blog/')">Blog</a>
        <a :href="withBase('/support')">Support</a>
        <a :href="withBase('/contact')">Contact</a>
      </div>
      <div>
        <strong>Community</strong>
        <a href="https://github.com/cho-js/cho">GitHub</a>
        <a href="https://x.com/cho_framework">X / @cho_framework</a>
        <a href="https://github.com/sponsors/ziv">GitHub Sponsors</a>
      </div>
    </nav>
  </footer>
</template>

<style scoped>
.site-footer { background: var(--vp-c-bg-soft); border-top: 1px solid var(--vp-c-divider); }
.footer-links { max-width: 1120px; margin: auto; padding: 36px 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 28px; }
.footer-links > div { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.footer-links strong { font-size: 14px; margin-bottom: 4px; }
.footer-links a { color: var(--vp-c-text-2); font-size: 14px; }
.footer-links a:hover, .footer-links a:focus-visible { color: var(--vp-c-brand-1); text-decoration: underline; }
.identity a:first-child { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 650; color: var(--vp-c-text-1); }
</style>

<style>
@media (min-width: 960px) {
  .VPContent.has-sidebar ~ .site-footer { padding-left: var(--vp-sidebar-width); }
}
@media (min-width: 1440px) {
  .VPContent.has-sidebar ~ .site-footer { padding-left: calc((100vw - var(--vp-layout-max-width)) / 2 + var(--vp-sidebar-width)); }
}
</style>
