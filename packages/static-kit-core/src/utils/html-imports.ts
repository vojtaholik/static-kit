import fs from "fs/promises";
import path from "path";

/**
 * Process HTML imports in the given HTML string recursively
 * Supports both relative paths and @components/ prefix
 * Handles nested imports within components
 */
export async function processHtmlImports(
  html: string,
  dir: string,
  processedFiles: Set<string> = new Set()
): Promise<string> {
  const importRegex = /<!--\s*@import:\s*([\w./@-]+)\s*-->/g;

  // Collect all matches first to avoid issues with changing string length
  const matches = Array.from(html.matchAll(importRegex)) as RegExpMatchArray[];

  // Process matches in reverse order to maintain correct indices
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    let importPath = match[1];

    // Handle @components/ prefix for cleaner component imports
    if (importPath.startsWith("@components/")) {
      // Find the project root (go up from current dir until we find src/)
      let currentDir = dir;
      while (
        !currentDir.endsWith("src") &&
        currentDir !== path.dirname(currentDir)
      ) {
        currentDir = path.dirname(currentDir);
      }
      if (currentDir.endsWith("src") || currentDir.includes("src")) {
        const srcDir = currentDir.endsWith("src")
          ? currentDir
          : path.join(currentDir, "src");
        importPath = importPath.replace("@components/", "components/");
        const filePath = path.resolve(srcDir, importPath);

        try {
          // Check for circular imports
          if (processedFiles.has(filePath)) {
            const errorMessage = `<!-- Import Error: Circular import detected for "${match[1]}" 
                   File: ${filePath}
                   This file is already being processed in the import chain -->`;
            html =
              html.slice(0, match.index!) +
              errorMessage +
              html.slice(match.index! + match[0].length);
            continue;
          }

          const fileContent = await fs.readFile(filePath, "utf8");

          // Add this file to the processed set and recursively process its imports
          const newProcessedFiles = new Set(processedFiles);
          newProcessedFiles.add(filePath);

          const processedFileContent = await processHtmlImports(
            fileContent,
            path.dirname(filePath),
            newProcessedFiles
          );

          html =
            html.slice(0, match.index!) +
            processedFileContent +
            html.slice(match.index! + match[0].length);
          continue;
        } catch (error) {
          const errorMessage = `<!-- Import Error: Could not find component "${match[1]}" 
                 Looked for: ${filePath}
                 Check the path and make sure the file exists -->`;
          html =
            html.slice(0, match.index!) +
            errorMessage +
            html.slice(match.index! + match[0].length);
          continue;
        }
      }
    }

    // Standard relative path resolution
    const filePath = path.resolve(dir, importPath);
    try {
      // Check for circular imports
      if (processedFiles.has(filePath)) {
        const errorMessage = `<!-- Import Error: Circular import detected for "${match[1]}" 
               File: ${filePath}
               This file is already being processed in the import chain -->`;
        html =
          html.slice(0, match.index!) +
          errorMessage +
          html.slice(match.index! + match[0].length);
        continue;
      }

      const fileContent = await fs.readFile(filePath, "utf8");

      // Add this file to the processed set and recursively process its imports
      const newProcessedFiles = new Set(processedFiles);
      newProcessedFiles.add(filePath);

      const processedFileContent = await processHtmlImports(
        fileContent,
        path.dirname(filePath),
        newProcessedFiles
      );

      html =
        html.slice(0, match.index!) +
        processedFileContent +
        html.slice(match.index! + match[0].length);
    } catch (error) {
      const errorMessage = `<!-- Import Error: Could not find file "${match[1]}" 
             Looked for: ${filePath}
             Check the path and make sure the file exists -->`;
      html =
        html.slice(0, match.index!) +
        errorMessage +
        html.slice(match.index! + match[0].length);
    }
  }

  return html;
}
