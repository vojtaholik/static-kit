# Static Kit

A simple, no-bullshit static site framework with TypeScript, SCSS, and HTML imports.

## 🚀 Features

- **Simple HTML templates** with `<!-- @import: file.html -->` support
- **Component system** with dedicated `src/components/` directory
- **Enhanced HTML imports** with `@components/` prefix for clean component references
- **SCSS compilation** with autoprefixer into a single CSS file
- **Individual JavaScript files** (no bundling madness)
- **SVG sprite generation** with hot reload for icons
- **Nested directory support** for organized projects
- **Live preview** with auto-reload during development for pages AND components
- **Component preview** - view individual components in isolation
- **Static asset handling** via public directory

## 📁 Project Structure

```
src/
├── pages/           # HTML templates (supports nesting)
│   ├── index.html
│   └── blog/
│       └── post.html
├── components/      # Reusable HTML components
│   ├── primary-navigation.html
│   ├── footer.html
│   └── ui/
│       └── button.html
├── js/              # JavaScript/TypeScript files (supports nesting)
│   ├── index.ts
│   └── components/
│       └── modal.ts
├── styles/
│   └── main.scss    # Main stylesheet
└── icons/           # SVG icons (auto-generated sprite)
    ├── ui/
    └── social/

public/              # Static assets (copied to dist)
├── images/
├── fonts/
└── favicon.ico
```

## 🛠 Commands

- `pnpm dev` - Start development server with live preview
- `pnpm build` - Build static files to `dist/`
- `pnpm preview` - Preview built site

## 📄 HTML Imports & Components

Use HTML imports to compose templates and reuse components:

### Standard Relative Imports

```html
<!-- src/pages/index.html -->
<div>
  <!-- @import: ../components/header.html -->
  <main>Content here</main>
  <!-- @import: ../components/footer.html -->
</div>
```

### Clean Component Syntax (Recommended)

```html
<!-- src/pages/index.html -->
<div>
  <!-- @import: @components/primary-navigation.html -->
  <main>Content here</main>
  <!-- @import: @components/footer.html -->
</div>
```

The `@components/` prefix automatically resolves to `src/components/` from anywhere in your project, making imports cleaner and more maintainable.

## 🔍 Development Preview

During development (`pnpm dev`), navigate to the root URL to see a comprehensive preview page:

- **📄 Pages Section** - All pages from `src/pages/` with live links
- **🧩 Components Section** - All components from `src/components/` with live links
- **Organized by Directory** - Nested folders are clearly displayed
- **Live Reload** - Changes to any page or component trigger automatic browser refresh

### Preview URLs:

- `/` - Landing page with all pages and components listed
- `/pages/{page-name}` - Individual page preview
- `/components/{component-name}` - Individual component preview

This makes it easy to develop and test components in isolation while seeing the full project structure at a glance.

## 🎯 Build Output

```
dist/
├── index.html       # Clean HTML files
├── blog/
│   └── post.html
├── styles.css       # Single compiled CSS
├── js/
│   ├── index.js     # Individual JS files
│   └── components/
│       └── modal.js
└── assets/          # Static assets
    └── images/
```

## 🔥 Why This Framework?

Because sometimes you just want to build a fucking website without webpack configs, build steps from hell, or JavaScript frameworks for static content. This gives you modern tooling (TypeScript, SCSS, live reload, component system) while keeping the output simple and deployable anywhere.

### What You Get:

- **Component-driven development** without the React/Vue overhead
- **Clean HTML imports** that actually make sense
- **Live component preview** for rapid iteration
- **Zero configuration** - just start building
- **Modern developer experience** with classic web fundamentals
- **Deployable anywhere** - it's just HTML, CSS, and JS

Perfect for marketing sites, portfolios, documentation, or any project where you want modern tooling without the framework bloat.
