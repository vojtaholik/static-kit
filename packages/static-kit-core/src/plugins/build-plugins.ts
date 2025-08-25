import fs from "fs/promises";
import path from "path";
import type { Plugin } from "vite";
import fg from "fast-glob";
import { processHtmlImports } from "../utils/html-imports.js";
import { normalizeBase, timeStamp } from "../utils/config.js";
import {
  compileTypeScriptFile,
  isTypeScriptFile,
  tsToJsPath,
} from "../utils/typescript-compiler.js";
import type { StaticKitConfig } from "../types.js";

export interface BuildPluginsOptions {
  config: StaticKitConfig;
  publicDir?: string;
  jsDir?: string;
}

async function createHtaccessFile(distPath: string) {
  await fs.writeFile(
    path.join(distPath, ".htaccess"),
    "DirectoryIndex index.html\nRewriteEngine On\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^([^.]+)$ $1.html [L]"
  );
}

export function buildPlugins(options: BuildPluginsOptions): Plugin[] {
  const { config, publicDir = "public", jsDir = "src/js" } = options;
  const normalizedBase = normalizeBase(config.build?.base);

  return [
    // Create .htaccess file
    {
      name: "create-htaccess-file",
      apply: "build",
      writeBundle: async () => {
        await createHtaccessFile("dist");
      },
    },
    // Copy static assets
    {
      name: "copy-static-assets",
      apply: "build",
      writeBundle: async () => {
        try {
          const srcPublicPath = path.resolve(publicDir);
          const destPublicPath = path.resolve(`dist/${normalizedBase}`);

          // Create dist/public directory
          await fs.mkdir(destPublicPath, { recursive: true });

          // Copy files from public/ to dist/public/ using fast-glob
          const allFiles = await fg("**/*", {
            cwd: srcPublicPath,
            onlyFiles: true,
            dot: true,
          });

          for (const file of allFiles) {
            const srcPath = path.join(srcPublicPath, file);
            const destPath = path.join(destPublicPath, file);

            // Ensure destination directory exists
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            await fs.copyFile(srcPath, destPath);
          }
        } catch (error) {
          // Public directory doesn't exist or can't be copied
          console.warn("Could not copy public directory:", error);
        }
      },
    },
    // Copy and compile JS/TS files without bundling
    {
      name: "copy-compile-js-files",
      apply: "build",
      writeBundle: async () => {
        try {
          const srcJsPath = path.resolve(jsDir);
          const destJsPath = path.resolve(`dist/${normalizedBase}js`);

          // Create dist/js directory
          await fs.mkdir(destJsPath, { recursive: true });

          // Find all JS and TS files
          const jsFiles = await fg("**/*.{js,ts}", {
            cwd: srcJsPath,
            onlyFiles: true,
          });

          let compiledCount = 0;
          let copiedCount = 0;

          for (const file of jsFiles) {
            const srcPath = path.join(srcJsPath, file);

            if (isTypeScriptFile(file)) {
              // Compile TypeScript to JavaScript
              const jsFileName = tsToJsPath(file);
              const destPath = path.join(destJsPath, jsFileName);
              await compileTypeScriptFile(srcPath, destPath);
              compiledCount++;
            } else {
              // Copy JavaScript files as-is
              const destPath = path.join(destJsPath, file);
              await fs.mkdir(path.dirname(destPath), { recursive: true });
              await fs.copyFile(srcPath, destPath);
              copiedCount++;
            }
          }

          console.log(
            `📄 Compiled ${compiledCount} TS files, copied ${copiedCount} JS files without bundling`
          );
        } catch (error) {
          // JS directory doesn't exist or can't be copied
          console.warn("Could not copy JS directory:", error);
        }
      },
    },
    // Process HTML files
    {
      name: "html-processor",
      apply: "build",
      writeBundle: async () => {
        const distPath = path.resolve("dist");

        // Find all HTML files in the dist directory using fast-glob
        const findHtmlFiles = async (dir: string): Promise<string[]> => {
          try {
            return await fg("**/*.html", {
              cwd: dir,
              onlyFiles: true,
            });
          } catch (error) {
            return [];
          }
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
                .replace(/<use href=\"\/sprite.svg/g, () => {
                  return `<use href=\"${normalizedBase}images/sprite.svg\?v=${timeStamp()}`;
                })
                // Normalize asset paths: Convert absolute paths to use configured base
                // Transform /public/images/... → public/images/... (based on normalizedBase)
                // Transform /images/... → public/images/... (shorthand syntax)
                // This ensures all asset references work with the custom build structure
                .replace(/src="\/public\//g, `src="${normalizedBase}`)
                .replace(/href="\/public\//g, `href="${normalizedBase}`)
                .replace(/src="\/images\//g, `src="${normalizedBase}images/`)
                .replace(/href="\/images\//g, `href="${normalizedBase}images/`)
                .trim();

              // Calculate asset paths based on page depth and base config
              const pathSegments = cleanFileName.split("/");
              const depth = pathSegments.length - 1;

              // For relative paths, go up directories then into configured base
              const relativePath = depth > 0 ? "../".repeat(depth) : "";

              const stylesPath = `${normalizedBase}css/styles.css?v=${timeStamp()}`;
              const jsPath = `${normalizedBase}js/index.js?v=${timeStamp()}`;

              // Create full HTML with correct paths
              const fullHtml = `<!DOCTYPE html>
<html lang="${config.templates?.language || "en"}">
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
  ];
}
