import { defineConfig } from "vite";
import fs from "fs/promises";
import path from "path";
import { processHtmlImports } from "./process-html-imports.ts";
import pagesPreview from "./vite-plugin-pages-preview.ts";

async function scanDirectory(
  dir: string,
  extensions: string[]
): Promise<string[]> {
  const files: string[] = [];

  async function walkDir(currentDir: string, relativePath = "") {
    try {
      const items = await fs.readdir(currentDir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(currentDir, item.name);
        const relativeFilePath = path.join(relativePath, item.name);

        if (item.isDirectory()) {
          await walkDir(fullPath, relativeFilePath);
        } else if (
          item.isFile() &&
          extensions.some((ext) => item.name.endsWith(ext))
        ) {
          files.push(relativeFilePath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
  }

  await walkDir(dir);
  return files;
}

async function getInputEntries() {
  const entries: Record<string, string> = {};

  // Always include main SCSS
  entries.main = "src/styles/main.scss";

  // Dynamically scan for JS/TS files (including nested)
  const jsFiles = await scanDirectory("src/js", [".ts", ".js"]);
  for (const file of jsFiles) {
    const name = file.replace(/\.(ts|js)$/, "");
    entries[`js/${name}`] = `src/js/${file}`;
  }

  // Dynamically scan for HTML pages (including nested)
  const pageFiles = await scanDirectory("src/pages", [".html"]);
  for (const file of pageFiles) {
    const name = file.replace(".html", "");
    entries[name] = `src/pages/${file}`;
  }

  return entries;
}

export default defineConfig(async ({ command }) => {
  if (command === "serve") {
    return {
      plugins: [pagesPreview()],
      publicDir: "public", // Static assets during dev
    };
  }

  // Build configuration with dynamic inputs
  const inputEntries = await getInputEntries();
  console.log("📦 Building with entries:", Object.keys(inputEntries));

  return {
    build: {
      outDir: "dist",
      emptyOutDir: true,
      cssCodeSplit: false, // Single CSS file
      rollupOptions: {
        input: inputEntries,
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name?.startsWith("js/")) {
              return "[name].js";
            }
            return "[name].js";
          },
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith(".css")) {
              return "styles.css";
            }
            return "assets/[name]-[hash][extname]";
          },
        },
      },
    },
    publicDir: "public", // Copy public assets to dist
    plugins: [
      {
        name: "html-processor",
        generateBundle: async (options, bundle) => {
          for (const [fileName, chunk] of Object.entries(bundle)) {
            if (fileName.endsWith(".html") && (chunk as any).type === "asset") {
              const assetChunk = chunk as any;
              if (typeof assetChunk.source === "string") {
                const dir = path.dirname(path.resolve("src/pages", fileName));
                const processedContent = await processHtmlImports(
                  assetChunk.source,
                  dir
                );

                // Create clean output path (remove src/pages/ prefix)
                const cleanFileName = fileName.replace(/^src\/pages\//, "");

                // Wrap in full HTML structure
                const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanFileName.replace(".html", "")}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
${processedContent}
<script type="module" src="js/index.js"></script>
</body>
</html>`;

                // Remove the old entry and add with clean path
                delete bundle[fileName];
                bundle[cleanFileName] = {
                  type: "asset",
                  source: fullHtml,
                  fileName: cleanFileName,
                } as any;
              }
            }
          }
        },
      },
    ],
  };
});
