# Static Kit

A simple, no-bullshit static site framework with TypeScript, SCSS, and HTML imports.

## 🚀 Quick Start

Create a new Static Kit project in seconds:

```bash
npx @vojtaholik/create-static-kit my-site
```

Then:

```bash
cd my-site
npm install
npm run dev
```

Open `http://localhost:5173` and start building!

## 📦 Package Overview

Static Kit is distributed as npm packages:

- **[@vojtaholik/create-static-kit](https://npmjs.com/package/@vojtaholik/create-static-kit)** - CLI tool for scaffolding new projects
- **[@vojtaholik/static-kit-core](https://npmjs.com/package/@vojtaholik/static-kit-core)** - Core framework library

## 🎯 CLI Usage

### Interactive Mode (Recommended)

```bash
npx @vojtaholik/create-static-kit my-site --interactive
```

Choose from:

- **Template**: `minimal` (basics only) or `default` (with examples)
- **CSS Reset**: Modern CSS reset for consistent styling
- **Design Tokens**: CSS custom properties for design systems
- **Cursor Rules**: AI-powered development assistance
- **Git Repository**: Automatic git initialization

### Quick Commands

```bash
# Default template with best practices
npx @vojtaholik/create-static-kit my-site

# Minimal template
npx @vojtaholik/create-static-kit my-site --template=minimal

# Skip Cursor rules (if you prefer your own setup)
npx @vojtaholik/create-static-kit my-site --no-cursor-rules

# Show all options
npx @vojtaholik/create-static-kit --help
```

## 🔧 Prerequisites

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **pnpm** for package management

## 🚀 Framework Features

- **🧩 Component System** - HTML imports with `@components/` prefix
- **⚡ Live Development** - Hot reload for pages, components, and styles
- **🎨 SCSS Compilation** - Modern CSS with autoprefixer
- **📱 TypeScript Support** - Type-safe JavaScript development
- **🖼️ SVG Sprite Generation** - Automatic icon optimization
- **📦 Zero Configuration** - Works out of the box
- **🔍 Component Preview** - Develop components in isolation
- **🚀 Static Output** - Deployable anywhere

## 📁 Project Structure

Every Static Kit project follows this structure:

```
my-site/
├── src/
│   ├── pages/           # HTML templates (supports nesting)
│   │   ├── index.html
│   │   └── about.html
│   ├── components/      # Reusable HTML components
│   │   ├── header.html
│   │   ├── footer.html
│   │   └── ui/
│   │       └── button.html
│   ├── js/              # JavaScript/TypeScript files
│   │   └── index.ts
│   ├── styles/          # SCSS stylesheets
│   │   └── main.scss
│   └── icons/           # SVG icons (auto-sprite)
│       ├── ui/
│       └── social/
├── public/              # Static assets
│   ├── images/
│   ├── fonts/
│   └── favicon.ico
├── .cursor/             # AI development rules (optional)
│   └── rules/
├── static-kit.config.json
├── vite.config.ts
└── package.json
```

## 🧩 HTML Components

Use HTML imports to build with components:

```html
<!-- src/pages/index.html -->
<!-- @import: @components/header.html -->
<main>
  <h1>Welcome to my site!</h1>
  <!-- @import: @components/ui/button.html -->
</main>
<!-- @import: @components/footer.html -->
```

The `@components/` prefix automatically resolves to `src/components/` from anywhere in your project.

## 🎨 Styling with SCSS

```scss
// src/styles/main.scss
body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 0;
}

.button {
  background: #0066cc;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;

  &:hover {
    background: #0052a3;
  }
}
```

## ⚡ JavaScript & TypeScript

```typescript
// src/js/index.ts - Automatically included in every page
document.addEventListener("DOMContentLoaded", () => {
  console.log("Static Kit is ready! 🚀");

  // Your app logic here
});
```

## 🖼️ SVG Icons

1. Add SVG files to `src/icons/ui/` or `src/icons/social/`
2. Use them in your HTML:

```html
<svg><use href="/sprite.svg#ui-arrow"></use></svg>
<svg><use href="/sprite.svg#social-twitter"></use></svg>
```

Icons are automatically optimized and combined into a sprite.

## ⚙️ Configuration

Customize your build in `static-kit.config.json`:

```json
{
  "build": {
    "base": "public/",
    "output": "dist"
  },
  "templates": {
    "language": "en"
  }
}
```

## 🔍 Development Experience

### Live Preview System

When you run `npm run dev`:

- **`/`** - Shows all pages and components with live links
- **`/pages/about`** - Preview individual pages
- **`/components/header`** - Test components in isolation

### Cursor AI Integration

Projects include comprehensive AI rules for:

- Project conventions and best practices
- Component development patterns
- TypeScript and SCSS guidelines
- Asset organization
- Git workflow recommendations

## 🎯 Build & Deploy

```bash
# Build for production
npm run build

# Preview built site
npm run preview
```

Output is optimized, static HTML/CSS/JS that deploys anywhere:

```
dist/
├── index.html
├── about.html
├── .htaccess           # Server config
└── public/
    ├── css/styles.css
    ├── js/index.js
    ├── images/sprite.svg
    └── ...
```

## 🔥 Why Static Kit?

Perfect for when you want:

- **Modern tooling** without the complexity
- **Component-driven development** without React/Vue overhead
- **Type safety** without build configuration hell
- **Fast development** with instant feedback
- **Simple deployment** - just HTML, CSS, and JS

Great for marketing sites, portfolios, documentation, landing pages, or any project where you want modern DX with classic web fundamentals.

## 🛠 Development

This repository contains the Static Kit framework source:

```bash
git clone https://github.com/vojtaholik/static-kit.git
cd static-kit
pnpm install

# Build packages
pnpm build

# Release new version
pnpm release:patch
```

## 📝 License

MIT

---

**Happy building!** 🚀

Need help? Check the generated project files - they include examples and documentation to get you started.
