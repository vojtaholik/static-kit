#!/usr/bin/env node

import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

function getPackageVersion(packagePath) {
  const packageJsonPath = path.join(packagePath, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  return packageJson.version;
}

const coreVersion = getPackageVersion(
  path.join(rootDir, "packages/static-kit-core")
);
const cliVersion = getPackageVersion(
  path.join(rootDir, "packages/create-static-kit")
);

console.log(`Current versions:`);
console.log(`  @vojtaholik/static-kit-core: ${coreVersion}`);
console.log(`  @vojtaholik/create-static-kit: ${cliVersion}`);

if (coreVersion !== cliVersion) {
  console.log(`⚠️  Version mismatch detected!`);
  process.exit(1);
} else {
  console.log(`✅ Versions are in sync`);
}
