import fs from "fs/promises";
import path from "path";
import type { Plugin } from "vite";
import fg from "fast-glob";
import { processHtmlImports } from "../utils/html-imports.js";
import type { PagesPreviewOptions } from "../types.js";

async function scanPagesDirectory(pagesDir: string): Promise<string[]> {
  try {
    const htmlFiles = await fg("**/*.html", {
      cwd: pagesDir,
      onlyFiles: true,
      ignore: ["node_modules/**"],
    });

    const pages = htmlFiles.map((file) => file.replace(".html", ""));
    return pages.sort();
  } catch (error) {
    // Directory doesn't exist or can't be read
    return [];
  }
}

function generatePagesIndex(
  pages: string[],
  components: string[],
  routePrefix: string,
  componentsRoutePrefix: string
): string {
  // Group pages by directory
  const pagesByDir: Record<string, string[]> = {};
  const componentsByDir: Record<string, string[]> = {};

  for (const page of pages) {
    const parts = page.split(path.sep);
    if (parts.length === 1) {
      // Root level page
      if (!pagesByDir[""]) pagesByDir[""] = [];
      pagesByDir[""].push(page);
    } else {
      // Nested page
      const dir = parts.slice(0, -1).join("/");
      if (!pagesByDir[dir]) pagesByDir[dir] = [];
      pagesByDir[dir].push(page);
    }
  }

  for (const component of components) {
    const parts = component.split(path.sep);
    if (parts.length === 1) {
      // Root level component
      if (!componentsByDir[""]) componentsByDir[""] = [];
      componentsByDir[""].push(component);
    } else {
      // Nested component
      const dir = parts.slice(0, -1).join("/");
      if (!componentsByDir[dir]) componentsByDir[dir] = [];
      componentsByDir[dir].push(component);
    }
  }

  // Generate HTML sections
  let sectionsHtml = "";

  // Root pages first
  if (pagesByDir[""]) {
    sectionsHtml += `
  <section>
    <h2>📄 Pages</h2>
    <ul>
      ${pagesByDir[""]
        .map((page) => `<li><a href="${routePrefix}/${page}">${page}</a></li>`)
        .join("\n      ")}
    </ul>
  </section>`;
  }

  // Then subdirectory pages
  const sortedPageDirs = Object.keys(pagesByDir)
    .filter((dir) => dir !== "")
    .sort();
  for (const dir of sortedPageDirs) {
    sectionsHtml += `
  <section>
    <h2>📁 pages/${dir}/</h2>
    <ul>
      ${pagesByDir[dir]
        .map((page) => {
          const fileName = page.split("/").pop();
          return `<li><a href="${routePrefix}/${page}">${fileName}</a></li>`;
        })
        .join("\n      ")}
    </ul>
  </section>`;
  }

  // Root components
  if (componentsByDir[""]) {
    sectionsHtml += `
  <section>
    <h2>🧩 Components</h2>
    <ul>
      ${componentsByDir[""]
        .map(
          (component) =>
            `<li><a href="${componentsRoutePrefix}/${component}">${component}</a></li>`
        )
        .join("\n      ")}
    </ul>
  </section>`;
  }

  // Then subdirectory components
  const sortedComponentDirs = Object.keys(componentsByDir)
    .filter((dir) => dir !== "")
    .sort();
  for (const dir of sortedComponentDirs) {
    sectionsHtml += `
  <section>
    <h2>📁 components/${dir}/</h2>
    <ul>
      ${componentsByDir[dir]
        .map((component) => {
          const fileName = component.split("/").pop();
          return `<li><a href="${componentsRoutePrefix}/${component}">${fileName}</a></li>`;
        })
        .join("\n      ")}
    </ul>
  </section>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pages & Components Preview</title>
  <script type="module" src="/@vite/client"></script>
  <link rel="stylesheet" href="/style.css">
  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1rem;
      line-height: 1.6;
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #eee;
      padding-bottom: 0.5rem;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    li {
      margin: 0.5rem 0;
    }
    a {
      display: block;
      padding: 0.75rem 1rem;
      text-decoration: none;
      color: #0066cc;
      border: 1px solid #ddd;
      border-radius: 4px;
      transition: all 0.2s;
    }
    a:hover {
      background: #f5f5f5;
      border-color: #0066cc;
    }
  </style>
</head>
<body>
  <h1>📄 Pages & Components Preview</h1>
  <p>Available pages and components in your file system:</p>
  ${sectionsHtml}
</body>
</html>`;
}

function generateFullPage(
  pageName: string,
  pageContent: string,
  stylesEntry: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageName}</title>
  <script type="module" src="/@vite/client"></script>
  <link rel="icon" href="/favicon.ico">
  <link rel="stylesheet" href="/${stylesEntry}">
  <script type="module" src="/src/js/index.ts"></script>
  <script type="module" src="/svg-sprite-hmr.ts"></script>

</head>
<body>
 
    ${pageContent}
 
  <!-- <a href="/" class="back-link">← Back to all pages</a> -->
</body>
</html>`;
}

export function pagesPreviewPlugin(options: PagesPreviewOptions = {}): Plugin {
  const {
    pagesDir = "src/pages",
    componentsDir = "src/components",
    routePrefix = "/pages",
    componentsRoutePrefix = "/components",
    stylesEntry = "src/styles/main.scss",
  } = options;

  return {
    name: "vite-pages-preview",
    apply: "serve",
    configureServer(server) {
      // Watch the pages and components directories for changes and force browser reload
      const pagesPath = path.resolve(pagesDir);
      const componentsPath = path.resolve(componentsDir);
      server.watcher.add(pagesPath);
      server.watcher.add(componentsPath);

      const reloadBrowser = () => {
        // Force a hard refresh of the browser
        server.ws.send({
          type: "full-reload",
        });
        // Also send update message for good measure
        server.ws.send({
          type: "update",
          updates: [],
        });
      };

      server.watcher.on("change", (filePath) => {
        const resolvedPath = path.resolve(filePath);
        if (
          resolvedPath.startsWith(pagesPath) ||
          resolvedPath.startsWith(componentsPath)
        ) {
          console.log(`[pages-preview] File changed: ${filePath}`);
          reloadBrowser();
        }
      });

      server.watcher.on("add", (filePath) => {
        const resolvedPath = path.resolve(filePath);
        if (
          (resolvedPath.startsWith(pagesPath) ||
            resolvedPath.startsWith(componentsPath)) &&
          filePath.endsWith(".html")
        ) {
          console.log(`[pages-preview] File added: ${filePath}`);
          reloadBrowser();
        }
      });

      server.watcher.on("unlink", (filePath) => {
        const resolvedPath = path.resolve(filePath);
        if (
          (resolvedPath.startsWith(pagesPath) ||
            resolvedPath.startsWith(componentsPath)) &&
          filePath.endsWith(".html")
        ) {
          console.log(`[pages-preview] File deleted: ${filePath}`);
          reloadBrowser();
        }
      });

      server.middlewares.use(async (req, res, next) => {
        const url = req.url;

        // Handle preview index route
        if (url === `/`) {
          const pages = await scanPagesDirectory(pagesDir);
          const components = await scanPagesDirectory(componentsDir);
          const indexHtml = generatePagesIndex(
            pages,
            components,
            routePrefix,
            componentsRoutePrefix
          );

          res.setHeader("Content-Type", "text/html");
          res.end(indexHtml);
          return;
        }

        // Handle individual page routes
        if (url?.startsWith(`${routePrefix}/`) && url !== `${routePrefix}/`) {
          const pageName = url
            .replace(`${routePrefix}/`, "")
            .replace(/\/$/, "");
          const pageFile = path.join(pagesDir, `${pageName}.html`);

          try {
            const rawPageContent = await fs.readFile(pageFile, "utf-8");
            // Process HTML imports before generating full page
            const processedPageContent = await processHtmlImports(
              rawPageContent,
              path.dirname(pageFile)
            );
            const fullPageHtml = generateFullPage(
              pageName,
              processedPageContent,
              stylesEntry
            );

            res.setHeader("Content-Type", "text/html");
            res.end(fullPageHtml);
            return;
          } catch (error) {
            // Page not found, continue to next middleware
          }
        }

        // Handle individual component routes
        if (
          url?.startsWith(`${componentsRoutePrefix}/`) &&
          url !== `${componentsRoutePrefix}/`
        ) {
          const componentName = url
            .replace(`${componentsRoutePrefix}/`, "")
            .replace(/\/$/, "");
          const componentFile = path.join(
            componentsDir,
            `${componentName}.html`
          );

          try {
            const rawComponentContent = await fs.readFile(
              componentFile,
              "utf-8"
            );
            // Process HTML imports before generating full page
            const processedComponentContent = await processHtmlImports(
              rawComponentContent,
              path.dirname(componentFile)
            );
            const fullPageHtml = generateFullPage(
              `component: ${componentName}`,
              processedComponentContent,
              stylesEntry
            );

            res.setHeader("Content-Type", "text/html");
            res.end(fullPageHtml);
            return;
          } catch (error) {
            // Component not found, continue to next middleware
          }
        }

        next();
      });
    },
  };
}
