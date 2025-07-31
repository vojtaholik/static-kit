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
              return "public/[name].js";
            }
            return "public/[name].js";
          },
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith(".css")) {
              return "public/styles.css";
            }
            return "public/assets/[name]-[hash][extname]";
          },
        },
      },
    },
    publicDir: "", // Disable default public dir copying
    plugins: [
      {
        name: "copy-static-assets",
        writeBundle: async () => {
          try {
            const srcPublicPath = path.resolve("public");
            const destPublicPath = path.resolve("dist/public");

            // Create dist/public directory
            await fs.mkdir(destPublicPath, { recursive: true });

            // Copy files from public/ to dist/public/
            const copyRecursive = async (src: string, dest: string) => {
              const items = await fs.readdir(src, { withFileTypes: true });
              for (const item of items) {
                const srcPath = path.join(src, item.name);
                const destPath = path.join(dest, item.name);
                if (item.isDirectory()) {
                  await fs.mkdir(destPath, { recursive: true });
                  await copyRecursive(srcPath, destPath);
                } else {
                  await fs.copyFile(srcPath, destPath);
                }
              }
            };

            await copyRecursive(srcPublicPath, destPublicPath);
          } catch (error) {
            // Public directory doesn't exist or can't be copied
          }
        },
      },
      {
        name: "html-processor",
        writeBundle: async () => {
          const distPath = path.resolve("dist");

          // Find all HTML files in the dist directory
          const findHtmlFiles = async (
            dir: string,
            basePath = ""
          ): Promise<string[]> => {
            const files: string[] = [];
            const items = await fs.readdir(dir, { withFileTypes: true });

            for (const item of items) {
              const fullPath = path.join(dir, item.name);
              const relativePath = path.join(basePath, item.name);

              if (item.isDirectory()) {
                const subFiles = await findHtmlFiles(fullPath, relativePath);
                files.push(...subFiles);
              } else if (item.name.endsWith(".html")) {
                files.push(relativePath);
              }
            }
            return files;
          };

          try {
            const htmlFiles = await findHtmlFiles(distPath);

            for (const htmlFile of htmlFiles) {
              const fullPath = path.join(distPath, htmlFile);

              // Check if this is a file that should be moved (in src/pages structure)
              if (htmlFile.startsWith("src/pages/")) {
                const cleanFileName = htmlFile.replace(/^src\/pages\//, "");
                const newPath = path.join(distPath, cleanFileName);

                // Read the file, process it, and write to new location
                const content = await fs.readFile(fullPath, "utf-8");
                const sourceDir = path.dirname(
                  path.resolve("src/pages", cleanFileName)
                );

                const processedContent = await processHtmlImports(
                  content,
                  sourceDir
                );

                // Remove any existing CSS and JS links that Vite injected
                const cleanedContent = processedContent
                  .replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/g, "")
                  .replace(/<script[^>]*src=[^>]*><\/script>/g, "")
                  .trim();

                // Calculate relative path to public/ directory based on directory depth
                const pathSegments = cleanFileName.split("/");
                const depth = pathSegments.length - 1;
                const publicPrefix =
                  depth > 0 ? "../".repeat(depth) + "public" : "public";
                const stylesPath = `${publicPrefix}/styles.css`;
                const jsPath = `${publicPrefix}/js/index.js`;

                // Create full HTML with correct paths
                const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanFileName.replace(".html", "")}</title>
  <link rel="stylesheet" href="${stylesPath}">
</head>
<body>
${cleanedContent}
<script type="module" src="${jsPath}"></script>
</body>
</html>`;

                // Create directory if needed
                await fs.mkdir(path.dirname(newPath), { recursive: true });

                // Write to new location
                await fs.writeFile(newPath, fullHtml);

                // Remove old file
                await fs.unlink(fullPath);

                // Remove empty directories
                let dirToCheck = path.dirname(fullPath);
                while (dirToCheck !== distPath) {
                  try {
                    const items = await fs.readdir(dirToCheck);
                    if (items.length === 0) {
                      await fs.rmdir(dirToCheck);
                      dirToCheck = path.dirname(dirToCheck);
                    } else {
                      break;
                    }
                  } catch {
                    break;
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error processing HTML files:", error);
          }
        },
      },
    ],
  };
});
