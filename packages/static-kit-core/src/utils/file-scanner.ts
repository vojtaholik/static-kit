import fg from "fast-glob";

/**
 * Scan directory for files with specified extensions using fast-glob
 */
export async function scanDirectory(
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

/**
 * Get input entries for Vite build
 */
export async function getInputEntries(
  pagesDir: string = "src/pages",
  jsDir: string = "src/js",
  stylesEntry: string = "src/styles/main.scss"
) {
  const entries: Record<string, string> = {};

  // Always include main SCSS
  entries.main = stylesEntry;

  // NOTE: JS files are now copied as static assets, not bundled through Vite
  // This preserves their original formatting and function names

  // Dynamically scan for HTML pages (including nested)
  const pageFiles = await scanDirectory(pagesDir, [".html"]);
  for (const file of pageFiles) {
    const name = file.replace(".html", "");
    entries[name] = `${pagesDir}/${file}`;
  }

  return entries;
}
