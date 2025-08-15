import { defineConfig } from "vite";
import type { UserConfig, UserConfigFnPromise } from "vite";
import { loadStaticKitConfig, normalizeBase } from "./utils/config.js";
import { getInputEntries } from "./utils/file-scanner.js";
import {
  svgSpritePlugin,
  pagesPreviewPlugin,
  buildPlugins,
} from "./plugins/index.js";
import type { StaticKitOptions } from "./types.js";

export function createStaticKitConfig(
  options: StaticKitOptions = {}
): UserConfigFnPromise {
  const {
    config: userProvidedConfig,
    pagesDir = "src/pages",
    componentsDir = "src/components",
    iconsDir = "src/icons",
    stylesEntry = "src/styles/main.scss",
    jsEntry = "src/js",
    publicDir = "public",
  } = options;

  return defineConfig(async ({ command }) => {
    // Load config from file system if not provided
    const config = userProvidedConfig || (await loadStaticKitConfig());
    const normalizedBase = normalizeBase(config.build?.base);

    if (command === "serve") {
      return {
        plugins: [
          pagesPreviewPlugin({
            pagesDir,
            componentsDir,
          }),
          ...svgSpritePlugin({
            iconsDir,
            outputPath: `${publicDir}/images/sprite.svg`,
            publicPath: normalizedBase,
          }),
        ],
        publicDir, // Static assets during dev
      };
    }

    // Build configuration with dynamic inputs
    const inputEntries = await getInputEntries(pagesDir, jsEntry, stylesEntry);
    console.log("📦 Building with entries:", Object.keys(inputEntries));

    return {
      build: {
        outDir: config.build?.output || "dist",
        emptyOutDir: true,
        cssCodeSplit: false, // Single CSS file
        rollupOptions: {
          input: inputEntries,
          output: {
            entryFileNames: (chunkInfo: any) => {
              if (chunkInfo.name?.startsWith("js/")) {
                return `${normalizedBase}[name].js`;
              }
              return `${normalizedBase}[name].js`;
            },
            assetFileNames: (assetInfo: any) => {
              if (assetInfo.name?.endsWith(".css")) {
                return `${normalizedBase}css/styles.css`;
              }
              if (assetInfo.name === "sprite.svg") {
                // Ensure sprite lands under public if emitted by Rollup
                return `${normalizedBase}images/sprite.svg`;
              }
              return `${normalizedBase}assets/[name]-[hash][extname]`;
            },
          },
        },
      },
      publicDir: "", // Disable default public dir copying
      plugins: [
        ...svgSpritePlugin({
          iconsDir,
          outputPath: `dist/${normalizedBase}images/sprite.svg`,
          publicPath: normalizedBase,
        }),
        ...buildPlugins({
          config,
          publicDir,
        }),
      ],
    };
  });
}

// Convenience function that matches the current API
export function staticKitConfig(options: StaticKitOptions = {}) {
  return createStaticKitConfig(options);
}
