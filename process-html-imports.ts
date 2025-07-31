import fs from "fs/promises";
import path from "path";

// HTML import processing function
export async function processHtmlImports(
  html: string,
  dir: string
): Promise<string> {
  const importRegex = /<!--\s*@import:\s*([\w./-]+)\s*-->/g;

  // Collect all matches first to avoid issues with changing string length
  const matches = Array.from(html.matchAll(importRegex)) as RegExpMatchArray[];

  // Process matches in reverse order to maintain correct indices
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const filePath = path.resolve(dir, match[1]);
    const fileContent = await fs.readFile(filePath, "utf8");
    html =
      html.slice(0, match.index!) +
      fileContent +
      html.slice(match.index! + match[0].length);
  }

  return html;
}
