import fs from "fs/promises";
import path from "path";
import type { Plugin } from "vite";
import { optimize } from "svgo";
import { scanDirectory } from "../utils/file-scanner.js";

export interface SvgSpriteOptions {
  iconsDir?: string;
  outputPath?: string;
  publicPath?: string;
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

export function svgSpritePlugin(options: SvgSpriteOptions = {}): Plugin[] {
  const {
    iconsDir = "src/icons",
    outputPath = "public/images/sprite.svg",
    publicPath = "public/"
  } = options;

  return [
    // Development plugin
    {
      name: "svg-sprite-dev",
      apply: "serve",
      configureServer(server) {
        // Generate sprite on server start
        generateSvgSprite(iconsDir, outputPath);

        // Watch for changes in icons directory
        server.watcher.add(`${iconsDir}/**/*.svg`);

        const handleSpriteChange = async (file: string) => {
          console.log("📁 File change detected:", file);

          if (file.includes(iconsDir) && file.endsWith(".svg")) {
            console.log("🎨 SVG file changed, regenerating sprite...");
            await generateSvgSprite(iconsDir, outputPath);

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
    // Build plugin
    {
      name: "svg-sprite-build",
      apply: "build",
      buildStart() {
        // Generate sprite at build start
        const buildOutputPath = outputPath.replace("public/", `dist/${publicPath}`);
        return generateSvgSprite(iconsDir, buildOutputPath);
      },
    },
  ];
}
