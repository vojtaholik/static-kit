#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import prompts from "prompts";
import { cyan, green, red, yellow, bold } from "kleur/colors";
import fg from "fast-glob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface TemplateConfig {
  name: string;
  description: string;
  features: string[];
}

interface CreateOptions {
  projectName: string;
  template: string;
  cssReset: boolean;
  designTokens: boolean;
  initGit: boolean;
  includeCursorRules: boolean;
}

const TEMPLATES: Record<string, TemplateConfig> = {
  minimal: {
    name: "Minimal",
    description: "Just the basics - perfect starting point",
    features: [
      "Basic HTML/SCSS structure",
      "Component system",
      "Build pipeline",
    ],
  },
  default: {
    name: "Default",
    description: "Starter with examples and components",
    features: [
      "Multiple page examples",
      "Component library",
      "SVG sprite system",
      "Basic styling",
    ],
  },
  styled: {
    name: "Styled",
    description: "Pre-styled with design system",
    features: [
      "Modern CSS reset",
      "Design tokens",
      "Typography scale",
      "Component showcase",
    ],
  },
};

function showHelp() {
  console.log(`${cyan("create-static-kit")} ${green("v1.0.0")}`);
  console.log();
  console.log("Usage:");
  console.log("  npx @vojtaholik/create-static-kit <project-name> [options]");
  console.log();
  console.log("Options:");
  console.log("  --template=<name>      Template to use (minimal, default)");
  console.log("  --interactive          Force interactive mode");
  console.log("  --no-cursor-rules      Skip including Cursor rules");
  console.log("  --help, -h             Show this help message");
  console.log();
  console.log("Examples:");
  console.log("  npx @vojtaholik/create-static-kit my-site");
  console.log("  npx @vojtaholik/create-static-kit my-site --template=minimal");
  console.log("  npx @vojtaholik/create-static-kit my-site --no-cursor-rules");
  console.log("  npx @vojtaholik/create-static-kit my-site --interactive");
  console.log();
}

async function main() {
  const args = process.argv.slice(2);

  // Check for help flag first (before showing header)
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  console.log();
  console.log(`${cyan("create-static-kit")} ${green("v1.0.0")}`);
  console.log();

  let projectName = args[0];
  let template = args
    .find((arg) => arg.startsWith("--template="))
    ?.split("=")[1];
  const noCursorRules = args.includes("--no-cursor-rules");
  const interactive =
    args.includes("--interactive") || !projectName || !template;

  if (interactive) {
    const response = await prompts([
      {
        type: "text",
        name: "projectName",
        message: "Project name:",
        initial: projectName || "my-static-kit-site",
        validate: (value: string) => {
          if (!value.trim()) return "Project name is required";
          if (!/^[a-zA-Z0-9-_]+$/.test(value))
            return "Project name can only contain letters, numbers, hyphens, and underscores";
          return true;
        },
      },
      {
        type: "select",
        name: "template",
        message: "Choose a template:",
        choices: Object.entries(TEMPLATES).map(([key, config]) => ({
          title: `${config.name} - ${config.description}`,
          description: config.features.join(" • "),
          value: key,
        })),
        initial: 0,
      },
      {
        type: "confirm",
        name: "cssReset",
        message: "Include CSS reset?",
        initial: true,
      },
      {
        type: "confirm",
        name: "designTokens",
        message: "Include design tokens?",
        initial: false,
      },
      {
        type: "confirm",
        name: "includeCursorRules",
        message: "Include Cursor rules for better dev experience?",
        initial: true,
      },
      {
        type: "confirm",
        name: "initGit",
        message: "Initialize git repository?",
        initial: true,
      },
    ]);

    if (!response.projectName) {
      console.log(red("✖") + " Operation cancelled");
      process.exit(1);
    }

    const options: CreateOptions = {
      projectName: response.projectName,
      template: response.template,
      cssReset: response.cssReset,
      designTokens: response.designTokens,
      includeCursorRules: response.includeCursorRules,
      initGit: response.initGit,
    };

    await createProject(options);
  } else {
    // Non-interactive mode
    const options: CreateOptions = {
      projectName,
      template: template || "default",
      cssReset: true,
      designTokens: false,
      includeCursorRules: !noCursorRules,
      initGit: true,
    };

    await createProject(options);
  }
}

async function createProject(options: CreateOptions) {
  const {
    projectName,
    template,
    cssReset,
    designTokens,
    includeCursorRules,
    initGit,
  } = options;

  console.log();
  console.log(`${cyan("✨")} Creating ${bold(projectName)}...`);
  console.log();

  // Check if directory exists
  const projectPath = path.resolve(projectName);
  try {
    await fs.access(projectPath);
    console.log(red("✖") + ` Directory ${projectName} already exists`);
    process.exit(1);
  } catch {
    // Directory doesn't exist, which is what we want
  }

  try {
    // Create project directory
    await fs.mkdir(projectPath, { recursive: true });

    // Copy template files
    await copyTemplate(template, projectPath);

    // Generate package.json
    await generatePackageJson(projectName, projectPath);

    // Generate vite.config.ts
    await generateViteConfig(projectPath);

    // Generate static-kit.config.json
    await generateStaticKitConfig(projectPath);

    // Conditionally add features
    if (cssReset) {
      await addCssReset(projectPath);
    }

    if (designTokens) {
      await addDesignTokens(projectPath);
    }

    // Remove Cursor rules if not wanted
    if (!includeCursorRules) {
      await removeCursorRules(projectPath);
    }

    // Initialize git
    if (initGit) {
      await initializeGit(projectPath);
    }

    console.log();
    console.log(`${green("✅")} Successfully created ${bold(projectName)}`);
    console.log();
    console.log("Next steps:");
    console.log(`  ${cyan("cd")} ${projectName}`);
    console.log(`  ${cyan("npm install")} or ${cyan("pnpm install")}`);
    console.log(`  ${cyan("npm run dev")} or ${cyan("pnpm dev")}`);
    console.log();
    console.log("Happy building! 🚀");
    console.log();
  } catch (error) {
    console.log();
    console.log(red("✖") + " Failed to create project:");
    console.log(red(String(error)));
    process.exit(1);
  }
}

async function copyTemplate(templateName: string, projectPath: string) {
  const templatesDir = path.join(__dirname, "..", "templates");
  const templatePath = path.join(templatesDir, templateName);

  try {
    // Check if template exists
    await fs.access(templatePath);
  } catch {
    console.log(red("✖") + ` Template "${templateName}" not found`);
    process.exit(1);
  }

  // Copy all files from template
  const files = await fg("**/*", {
    cwd: templatePath,
    onlyFiles: true,
    dot: true,
  });

  for (const file of files) {
    const srcPath = path.join(templatePath, file);
    const destPath = path.join(projectPath, file);

    // Ensure destination directory exists
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.copyFile(srcPath, destPath);
  }
}

async function generatePackageJson(projectName: string, projectPath: string) {
  const packageJson = {
    name: projectName,
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc && vite build",
      preview: "vite preview",
    },
    devDependencies: {
      "@vojtaholik/static-kit-core": "^1.0.0",
      "@types/node": "^24.2.1",
      autoprefixer: "^10.4.21",
      postcss: "^8.5.6",
      "sass-embedded": "^1.90.0",
      typescript: "~5.9.2",
      vite: "^7.1.1",
    },
  };

  await fs.writeFile(
    path.join(projectPath, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );
}

async function generateViteConfig(projectPath: string) {
  const viteConfig = `import { createStaticKitConfig } from "@vojtaholik/static-kit-core/vite";

export default createStaticKitConfig();`;

  await fs.writeFile(path.join(projectPath, "vite.config.ts"), viteConfig);
}

async function generateStaticKitConfig(projectPath: string) {
  const config = {
    build: {
      base: "public/",
      output: "dist",
    },
    templates: {
      language: "en",
    },
  };

  await fs.writeFile(
    path.join(projectPath, "static-kit.config.json"),
    JSON.stringify(config, null, 2)
  );
}

async function addCssReset(projectPath: string) {
  const resetCss = `/* Modern CSS Reset */
*, *::before, *::after {
  box-sizing: border-box;
}

* {
  margin: 0;
}

body {
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}

input, button, textarea, select {
  font: inherit;
}

p, h1, h2, h3, h4, h5, h6 {
  overflow-wrap: break-word;
}

#root, #__next {
  isolation: isolate;
}`;

  await fs.writeFile(
    path.join(projectPath, "src", "styles", "_reset.scss"),
    resetCss
  );

  // Add import to main.scss
  const mainScssPath = path.join(projectPath, "src", "styles", "main.scss");
  try {
    const mainScss = await fs.readFile(mainScssPath, "utf-8");
    const updatedScss = `@use "reset";\n\n${mainScss}`;
    await fs.writeFile(mainScssPath, updatedScss);
  } catch {
    // main.scss doesn't exist or can't be read
  }
}

async function addDesignTokens(projectPath: string) {
  const tokensScss = `:root {
  /* Colors */
  --color-primary: #0066cc;
  --color-primary-dark: #0052a3;
  --color-secondary: #6b7280;
  --color-accent: #f59e0b;
  
  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-background: #ffffff;
  --color-surface: #f9fafb;
  --color-border: #e5e7eb;
  
  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  --space-3xl: 4rem;
  
  /* Borders */
  --border-radius-sm: 0.25rem;
  --border-radius-md: 0.375rem;
  --border-radius-lg: 0.5rem;
  --border-radius-xl: 0.75rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}`;

  await fs.writeFile(
    path.join(projectPath, "src", "styles", "_tokens.scss"),
    tokensScss
  );

  // Add import to main.scss
  const mainScssPath = path.join(projectPath, "src", "styles", "main.scss");
  try {
    const mainScss = await fs.readFile(mainScssPath, "utf-8");
    const updatedScss = `@use "tokens";\n\n${mainScss}`;
    await fs.writeFile(mainScssPath, updatedScss);
  } catch {
    // main.scss doesn't exist or can't be read
  }
}

async function removeCursorRules(projectPath: string) {
  try {
    const cursorDir = path.join(projectPath, ".cursor");
    await fs.rm(cursorDir, { recursive: true, force: true });
  } catch {
    // Directory doesn't exist or can't be removed, which is fine
  }
}

async function initializeGit(projectPath: string) {
  const gitignore = `# Dependencies
node_modules/
.pnpm-debug.log*

# Build output
dist/

# Local config
static-kit.local.json

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*`;

  await fs.writeFile(path.join(projectPath, ".gitignore"), gitignore);
}

main().catch(console.error);
