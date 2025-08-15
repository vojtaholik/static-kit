#!/usr/bin/env node

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

// Colors for output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  log(`$ ${command}`, colors.cyan);
  return execSync(command, { stdio: "inherit", cwd: rootDir, ...options });
}

function updatePackageVersion(packagePath, newVersion) {
  const packageJsonPath = path.join(packagePath, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  packageJson.version = newVersion;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
  log(`Updated ${path.basename(packagePath)} to v${newVersion}`, colors.green);
}

function getCurrentVersion() {
  const corePackagePath = path.join(
    rootDir,
    "packages/static-kit-core/package.json"
  );
  const packageJson = JSON.parse(readFileSync(corePackagePath, "utf8"));
  return packageJson.version;
}

function validateVersion(version) {
  const versionRegex = /^\d+\.\d+\.\d+$/;
  if (!versionRegex.test(version)) {
    log(
      "❌ Invalid version format. Use semantic versioning (e.g., 1.0.1)",
      colors.red
    );
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const versionType = args[0];

  if (!versionType) {
    log("Usage: npm run release [patch|minor|major|x.x.x]", colors.yellow);
    log("Examples:", colors.yellow);
    log("  npm run release patch   # 1.0.0 -> 1.0.1", colors.yellow);
    log("  npm run release minor   # 1.0.0 -> 1.1.0", colors.yellow);
    log("  npm run release major   # 1.0.0 -> 2.0.0", colors.yellow);
    log("  npm run release 1.2.3   # Set specific version", colors.yellow);
    process.exit(1);
  }

  const currentVersion = getCurrentVersion();
  log(`Current version: ${currentVersion}`, colors.blue);

  let newVersion;

  if (
    versionType === "patch" ||
    versionType === "minor" ||
    versionType === "major"
  ) {
    const [major, minor, patch] = currentVersion.split(".").map(Number);

    switch (versionType) {
      case "patch":
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
      case "minor":
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case "major":
        newVersion = `${major + 1}.0.0`;
        break;
    }
  } else {
    newVersion = versionType;
    validateVersion(newVersion);
  }

  log(`🚀 Releasing version ${newVersion}`, colors.bright + colors.magenta);

  try {
    // 1. Check git status
    log("\n📋 Checking git status...", colors.bright);
    try {
      execSync("git diff-index --quiet HEAD --", { cwd: rootDir });
    } catch (error) {
      log(
        "⚠️  You have uncommitted changes. Commit them first.",
        colors.yellow
      );
      exec("git status --porcelain");
      process.exit(1);
    }

    // 2. Update package versions
    log("\n📦 Updating package versions...", colors.bright);
    updatePackageVersion(
      path.join(rootDir, "packages/static-kit-core"),
      newVersion
    );
    updatePackageVersion(
      path.join(rootDir, "packages/create-static-kit"),
      newVersion
    );

    // 3. Build packages
    log("\n🔨 Building packages...", colors.bright);
    exec("pnpm --filter @vojtaholik/static-kit-core build");
    exec("pnpm --filter @vojtaholik/create-static-kit build");

    // 4. Run tests (if any)
    log("\n🧪 Running tests...", colors.bright);
    // exec('pnpm test'); // Uncomment when you have tests

    // 5. Commit version changes
    log("\n📝 Committing version changes...", colors.bright);
    exec("git add .");
    exec(`git commit -m "chore: release v${newVersion}"`);

    // 6. Create git tag
    log("\n🏷️  Creating git tag...", colors.bright);
    exec(`git tag v${newVersion}`);

    // 7. Publish packages
    log("\n📤 Publishing packages...", colors.bright);

    // Publish core first (CLI depends on it)
    log("Publishing @vojtaholik/static-kit-core...", colors.blue);
    exec("npm publish --access public", {
      cwd: path.join(rootDir, "packages/static-kit-core"),
    });

    // Wait a bit for npm to propagate
    log("Waiting for npm propagation...", colors.yellow);
    execSync("sleep 5");

    log("Publishing @vojtaholik/create-static-kit...", colors.blue);
    exec("npm publish --access public", {
      cwd: path.join(rootDir, "packages/create-static-kit"),
    });

    // 8. Push to git
    log("\n🚀 Pushing to git...", colors.bright);
    exec("git push");
    exec("git push --tags");

    log(
      `\n✅ Successfully released v${newVersion}!`,
      colors.bright + colors.green
    );
    log(`\nTest the release:`, colors.cyan);
    log(
      `npx @vojtaholik/create-static-kit@${newVersion} my-test-site`,
      colors.cyan
    );
  } catch (error) {
    log(`\n❌ Release failed: ${error.message}`, colors.red);
    log("\nRolling back version changes...", colors.yellow);

    // Rollback version changes
    updatePackageVersion(
      path.join(rootDir, "packages/static-kit-core"),
      currentVersion
    );
    updatePackageVersion(
      path.join(rootDir, "packages/create-static-kit"),
      currentVersion
    );

    process.exit(1);
  }
}

// Handle async operations
async function asyncMain() {
  await main();
}

asyncMain().catch(console.error);
