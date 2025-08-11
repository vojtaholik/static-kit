import { defineConfig } from "vite";
import fs from "fs/promises";
import path from "path";
import { processHtmlImports } from "./process-html-imports.ts";
import pagesPreview from "./vite-plugin-pages-preview.ts";
import { optimize } from "svgo";
import fg from "fast-glob";

// Lightweight config shape for future parity with legacy gulp-config.json
interface StaticKitConfig {
  build?: {
    base?: string; // e.g. "public/" or "assets/" - where built assets are served from
    output?: string; // e.g. "dist"
  };
  templates?: {
    language?: string;
  };
}

function timeStamp() {
  return Date.now().toString().slice(0, 10);
}

async function loadStaticKitConfig(): Promise<StaticKitConfig> {
  const root = process.cwd();
  const baseConfigPath = path.join(root, "static-kit.config.json");
  const localConfigPath = path.join(root, "static-kit.local.json");
  const result: StaticKitConfig = {};
  try {
    const raw = await fs.readFile(baseConfigPath, "utf8");
    Object.assign(result, JSON.parse(raw));
  } catch {}
  try {
    const rawLocal = await fs.readFile(localConfigPath, "utf8");
    Object.assign(result, JSON.parse(rawLocal));
  } catch {}
  return result;
}

async function createHtaccessFile(distPath: string) {
  await fs.writeFile(
    path.join(distPath, ".htaccess"),
    "DirectoryIndex index.html\nRewriteEngine On\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^([^.]+)$ $1.html [L]"
  );
}

function normalizeBase(input?: string): string {
  if (!input) return "public/";
  let base = input.trim();
  if (!base.endsWith("/")) base = base + "/";
  return base;
}

async function scanDirectory(
  dir: string,
  extensions: string[]
): Promise<string[]> {
  try {
    const patterns = extensions.map((ext) => `**/*${ext}`);
    const files = await fg(patterns, {
      cwd: dir,
      onlyFiles: true,
      ignore: ["node_modules/**"],
    });
    return files;
  } catch (error) {
    // Directory doesn't exist or can't be read
    return [];
  }
}

async function generateSvgSprite(iconsDir: string, outputPath: string) {
  const svgFiles = await scanDirectory(iconsDir, [".svg"]);

  if (svgFiles.length === 0) {
    return;
  }

  const symbols: string[] = [];

  for (const file of svgFiles) {
    try {
      const filePath = path.join(iconsDir, file);
      const svgContent = await fs.readFile(filePath, "utf-8");

      // Optimize with SVGO
      const result = optimize(svgContent, {
        plugins: [
          {
            name: "removeAttrs",
            params: { attrs: "data-name" },
          },
        ],
      });

      // Extract the inner content of the SVG and create a symbol
      const optimizedSvg = result.data;
      const svgMatch = optimizedSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);

      if (svgMatch) {
        const iconName = path.basename(file, ".svg");
        const innerContent = svgMatch[1];

        // Extract viewBox from the original SVG
        const viewBoxMatch = optimizedSvg.match(/viewBox="([^"]*)"/);
        const viewBox = viewBoxMatch ? ` viewBox="${viewBoxMatch[1]}"` : "";

        const symbol = `<symbol id="${iconName}"${viewBox}>${innerContent}</symbol>`;
        symbols.push(symbol);
      }
    } catch (error) {
      console.warn(`Failed to process ${file}:`, error);
    }
  }

  if (symbols.length > 0) {
    const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
${symbols.join("\n")}
</svg>`;

    // Ensure the output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, sprite);
    console.log(
      `📦 Generated sprite with ${symbols.length} icons at ${outputPath}`
    );
  }
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
  const userConfig = await loadStaticKitConfig();
  const normalizedBase = normalizeBase(userConfig.build?.base);

  if (command === "serve") {
    return {
      plugins: [
        pagesPreview(),
        {
          name: "svg-sprite-dev",
          configureServer(server) {
            // Generate sprite on server start
            generateSvgSprite("src/icons", "public/images/sprite.svg");

            // Watch for changes in icons directory
            server.watcher.add("src/icons/**/*.svg");

            const handleSpriteChange = async (file: string) => {
              console.log("📁 File change detected:", file);

              if (file.includes("src/icons") && file.endsWith(".svg")) {
                console.log("🎨 SVG file changed, regenerating sprite...");
                await generateSvgSprite("src/icons", "public/sprite.svg");

                const timestamp = Date.now();
                console.log("📡 Sending HMR event with timestamp:", timestamp);

                // Send a custom HMR update to invalidate SVG references
                server.ws.send({
                  type: "custom",
                  event: "svg-sprite-updated",
                  data: { timestamp },
                });

                console.log("✅ SVG sprite updated and HMR event sent");
              } else {
                console.log("⏭️  Not an SVG file, skipping");
              }
            };

            server.watcher.on("change", handleSpriteChange);
            server.watcher.on("add", handleSpriteChange);
            server.watcher.on("unlink", handleSpriteChange);
          },
        },
      ],
      publicDir: "public", // Static assets during dev
    };
  }

  // Build configuration with dynamic inputs
  const inputEntries = await getInputEntries();
  console.log("📦 Building with entries:", Object.keys(inputEntries));

  return {
    build: {
      outDir: userConfig.build?.output || "dist",
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
              return "public/css/styles.css";
            }
            if (assetInfo.name === "sprite.svg") {
              // Ensure sprite lands under public if emitted by Rollup
              return "public/images/sprite.svg";
            }
            return "public/assets/[name]-[hash][extname]";
          },
        },
      },
    },
    publicDir: "", // Disable default public dir copying
    plugins: [
      {
        name: "svg-sprite-build",
        buildStart() {
          // Generate sprite at build start
          return generateSvgSprite(
            "src/icons",
            `dist/${normalizedBase}images/sprite.svg`
          );
        },
      },
      {
        name: "create-htaccess-file",
        writeBundle: async () => {
          await createHtaccessFile("dist");
        },
      },
      {
        name: "copy-static-assets",
        writeBundle: async () => {
          try {
            const srcPublicPath = path.resolve("public");
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
          }
        },
      },
      {
        name: "html-processor",
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
<html lang="${userConfig.templates?.language || "en"}">
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
