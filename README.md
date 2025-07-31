# Static Kit

A simple, no-bullshit static site framework with TypeScript, SCSS, and HTML imports.

## 🚀 Features

- **Simple HTML templates** with `<!-- @import: file.html -->` support
- **SCSS compilation** with autoprefixer into a single CSS file
- **Individual JavaScript files** (no bundling madness)
- **Nested directory support** for organized projects
- **Live preview** with auto-reload during development
- **Static asset handling** via public directory

## 📁 Project Structure

```
src/
├── pages/           # HTML templates (supports nesting)
│   ├── index.html
│   └── blog/
│       └── post.html
├── js/              # JavaScript/TypeScript files (supports nesting)
│   ├── index.ts
│   └── components/
│       └── modal.ts
└── styles/
    └── main.scss    # Main stylesheet

public/              # Static assets (copied to dist)
├── images/
├── fonts/
└── favicon.ico
```

## 🛠 Commands

- `pnpm dev` - Start development server with live preview
- `pnpm build` - Build static files to `dist/`
- `pnpm preview` - Preview built site

## 📄 HTML Imports

Use HTML imports to compose templates:

```html
<!-- src/pages/index.html -->
<div>
  <!-- @import: header.html -->
  <main>Content here</main>
  <!-- @import: footer.html -->
</div>
```

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

Because sometimes you just want to build a fucking website without webpack configs, build steps from hell, or JavaScript frameworks for static content. This gives you modern tooling (TypeScript, SCSS, live reload) while keeping the output simple and deployable anywhere.
