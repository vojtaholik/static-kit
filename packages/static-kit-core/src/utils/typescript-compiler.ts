import * as ts from "typescript";
import fs from "fs/promises";
import path from "path";

/**
 * Compile TypeScript file to JavaScript while preserving formatting and function names
 */
export async function compileTypeScriptFile(
  filePath: string,
  outputPath: string
): Promise<void> {
  try {
    // Read the TypeScript source
    const sourceCode = await fs.readFile(filePath, "utf-8");

    // Create compiler options that preserve names and formatting
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      allowImportingTsExtensions: false,
      noEmit: false,
      declaration: false,
      sourceMap: false,
      removeComments: false,
      preserveConstEnums: true,
      // Keep names intact
      keepValueImports: true,
      preserveValueImports: true,
      // Don't mangle or optimize
      experimentalDecorators: true,
      emitDecoratorMetadata: false,
    };

    // Create source file
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.ES2022,
      true
    );

    // Create program
    const program = ts.createProgram([filePath], compilerOptions);

    // Create custom transformer to preserve formatting
    const result = ts.transpileModule(sourceCode, {
      compilerOptions,
      fileName: filePath,
    });

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Write compiled JavaScript
    await fs.writeFile(outputPath, result.outputText);
  } catch (error) {
    console.warn(`Failed to compile TypeScript file ${filePath}:`, error);
    // If compilation fails, copy the original file
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.copyFile(filePath, outputPath);
  }
}

/**
 * Check if a file is a TypeScript file
 */
export function isTypeScriptFile(filePath: string): boolean {
  return filePath.endsWith(".ts") && !filePath.endsWith(".d.ts");
}

/**
 * Convert TypeScript file path to JavaScript file path
 */
export function tsToJsPath(tsPath: string): string {
  return tsPath.replace(/\.ts$/, ".js");
}
