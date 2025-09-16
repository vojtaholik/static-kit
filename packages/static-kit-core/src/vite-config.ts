import { defineConfig } from "vite";
import type { UserConfig, UserConfigFnPromise, Plugin } from "vite";
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
    useTailwind = false,
  } = options;

  return defineConfig(async ({ command }) => {
    // Load config from file system if not provided
    const config = userProvidedConfig || (await loadStaticKitConfig());
    const normalizedBase = normalizeBase(config.build?.base);

    // Conditionally load Tailwind plugin
    const tailwindPlugins: Plugin[] = [];
    if (useTailwind) {
      try {
        // @ts-ignore - Dynamic import for optional dependency
        const { default: tailwindPlugin } = await import("@tailwindcss/vite");
        tailwindPlugins.push(tailwindPlugin());
      } catch (e) {
        console.warn(
          "⚠️  @tailwindcss/vite not found. Make sure to install it if you want to use Tailwind CSS."
        );
      }
    }

    if (command === "serve") {
      return {
        plugins: [
          ...tailwindPlugins,
          pagesPreviewPlugin({
            pagesDir,
            componentsDir,
            stylesEntry,
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
      base: "./",
      build: {
        outDir: config.build?.output || "dist",
        emptyOutDir: true,
        minify: false, // Disable minification for all assets
        cssCodeSplit: true, // Allow CSS in entries (needed for plain CSS files)
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
              // Handle font files - put them in fonts/ directory without hash
              if (assetInfo.name?.match(/\.(woff2?|ttf|otf|eot)$/i)) {
                return `${normalizedBase}fonts/[name][extname]`;
              }
              // Handle image files - put them in images/ directory without hash
              if (assetInfo.name?.match(/\.(png|jpe?g|gif|webp|avif|svg)$/i)) {
                return `${normalizedBase}images/[name][extname]`;
              }
              return `${normalizedBase}assets/[name]-[hash][extname]`;
            },
          },
        },
      },
      publicDir: "", // Disable default public dir copying
      plugins: [
        ...tailwindPlugins,
        ...svgSpritePlugin({
          iconsDir,
          outputPath: `dist/${normalizedBase}images/sprite.svg`,
          publicPath: normalizedBase,
        }),
        ...buildPlugins({
          config,
          publicDir,
          jsDir: jsEntry,
        }),
      ],
    };
  });
}

// Convenience function that matches the current API
export function staticKitConfig(options: StaticKitOptions = {}) {
  return createStaticKitConfig(options);
}
