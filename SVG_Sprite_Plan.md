# SVG Handling & Sprite Generation Plan

## 1. Objectives

- Centralize all SVG assets in a single folder structure.
- Automatically generate an optimized SVG sprite **in both development and production builds**.
- Support Hot-Module Reload (HMR) so changes to any SVG instantly reflect in the browser during dev.
- Keep the sprite path predictable (e.g. `/sprite.svg`) so it works seamlessly in both dev and production without extra directory prefixes.
- Minimize footprint with SVGO optimization while preserving accessibility attributes (`viewBox`, `aria-*`, `role`).
- Provide a straightforward API for using icons in HTML/SCSS.

---

## 2. Directory Structure

```
static-kit/
└─ src/
   └─ icons/          # ← NEW root for raw SVG files
      ├─ ui/
      │  ├─ chevron-left.svg
      │  └─ chevron-right.svg
      └─ social/
         ├─ github.svg
         └─ twitter.svg
```

_All SVGs placed anywhere under `src/icons/` will be picked up automatically._

---

## 3. Tooling Choice

| Requirement                          | Candidate Plugins                                                             | Notes                                      |
| ------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------ |
| Dev-time sprite w/ HMR               | [`vite-plugin-svg-sprite`](https://github.com/solidjs/vite-plugin-svg-sprite) | Built-in watcher, Rollup & Vite compatible |
| Production sprite generation         | Same plugin (Rollup phase)                                                    | Consistent config                          |
| Minification                         | [`svgo`](https://github.com/svg/svgo)                                         | Supported via plugin’s `svgoOptions`       |
| Low maintenance / community activity | ★ Active                                                                      | As of 2024                                 |

**Decision:** Adopt `vite-plugin-svg-sprite` + built-in SVGO. This keeps our Vite config simple and avoids separate build scripts.

---

## 4. Development Workflow

1. Start dev server (`pnpm dev`).
2. Plugin watches `src/icons/**/*`.
3. On any SVG change:
   - Sprite is regenerated in memory.
   - HMR pushes update; pages referencing icons reload.
4. Sprite served at `/sprite.svg` via Vite’s internal server.

No manual steps required—just add or modify SVG files.

---

## 5. Production Build Workflow

1. `vite build` triggers Rollup phase of the plugin.
2. All SVGs are optimized with SVGO and bundled into a single `sprite.svg`.
3. The sprite is emitted to `dist/public/sprite.svg`.
4. Existing `copy-static-assets` plugin already copies everything under `public/`; this keeps paths identical between dev & prod.

---

## 6. Usage in HTML

```html
<!-- Reference an icon -->
<svg class="icon icon--chevron-left" aria-hidden="true">
  <use href="/sprite.svg#chevron-left" />
</svg>
```

- In dev, Vite serves everything in `public/` from the _root_ (`/`), so `/sprite.svg` resolves correctly.
- In production, we’ll configure the sprite to emit as a top-level file (`dist/sprite.svg`) so the same path continues to work.
- Accessibility: Provide `role="img"` and `<title>`/`<desc>` inside the `<use>` wrapper when needed.

---

## 7. SCSS Helper

```scss
// src/styles/_icons.scss
.icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  fill: currentColor;

  &--small {
    width: 0.875rem;
    height: 0.875rem;
  }
  &--medium {
    width: 1.25rem;
    height: 1.25rem;
  }
  &--large {
    width: 1.5rem;
    height: 1.5rem;
  }
  &--xl {
    width: 2rem;
    height: 2rem;
  }
}
```

Usage:

```html
<svg class="icon icon--large" aria-hidden="true">
  <use href="/sprite.svg#chevron-left" />
</svg>
```

---

## 8. Implementation Steps

1. **Install dependencies**
   ```bash
   pnpm add -D vite-plugin-svg-sprite svgo
   ```
2. **Add plugin to `vite.config.ts`**
   ```ts
   import viteSvgSprite from "vite-plugin-svg-sprite";
   // ... existing code ...
   export default defineConfig(async ({ command }) => {
     // inside both dev & build configs
     return {
       plugins: [
         viteSvgSprite({
           include: ["src/icons/**/*.svg"],
           symbolId: (filePath) => {
             // e.g. src/icons/ui/chevron-left.svg → chevron-left
             return filePath
               .split("/")
               .pop()
               .replace(/\.svg$/, "");
           },
           // SVGO options
           svgoOptions: {
             plugins: [
               {
                 name: "removeAttrs",
                 params: { attrs: "data-name" },
               },
             ],
           },
         }),
         // ...existing plugins (pagesPreview, copy-static-assets, etc.)
         // Ensure consistent filename so we can reference /sprite.svg in prod
         ,
         build: {
           rollupOptions: {
             output: {
               assetFileNames: (assetInfo) =>
                 assetInfo.name === "sprite.svg" ? "sprite.svg" : assetInfo.name,
             },
           },
         }
       ],
     };
   });
   ```
3. **(Optional) Create SCSS helper** if mask-based icons are desired.
4. **Document icon naming conventions** (`kebab-case` recommended).
5. **Run `pnpm dev`** and verify sprite generation. Check built output with `pnpm build`.

---

## 9. Future Enhancements

- **Automatic Accessibility Titles:** Generate `<title>` from filename and inject into each `<symbol>`.
- **Per-page Sub-Sprites:** If bundle size becomes an issue, consider per-route sprites via dynamic imports.
- **Type-safe Icon Registry:** Export a TS enum derived from filenames for autocomplete.
- **Linting:** Add a pre-commit check ensuring all SVGs pass SVGO.

---

### 📌 Summary

This plan introduces a zero-config, watch-enabled SVG sprite pipeline fully integrated into the existing Vite build, requiring only a single plugin addition and placing raw SVGs in `src/icons/`. Usage remains consistent between development and production, and future enhancements are outlined for scalability.
