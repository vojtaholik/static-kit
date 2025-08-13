# Static Kit

A simple, no-bullshit static site framework with TypeScript, SCSS, and HTML imports.

## 🎯 Getting Started

### Prerequisites

Before you start, make sure you have these installed on your machine:

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **pnpm** - Install with: `npm install -g pnpm`

### Quick Setup

1. **Clone or download this project**

   ```bash
   git clone https://github.com/vojtaholik/static-kit.git
   cd static-kit
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start the development server**

   ```bash
   pnpm dev
   ```

4. **Open your browser** to `http://localhost:5173`

You should see a preview page showing all your pages and components. That's it - you're ready to build!

### Your First Page

1. Open `src/pages/index.html` in your editor
2. Make any change (add some text, modify HTML)
3. Save the file
4. Watch your browser automatically reload with the changes

### Your First Component

1. Create a new file: `src/components/my-button.html`
2. Add some HTML:
   ```html
   <button class="my-button">Click me!</button>
   ```
3. Use it in any page:
   ```html
   <!-- @import: @components/my-button.html -->
   ```
4. Save and see it appear in your page!

## 🛠 Essential Commands

- `pnpm dev` - Start development server with live preview
- `pnpm build` - Build static files to `dist/`
- `pnpm preview` - Preview built site

### What happens when you run `pnpm dev`?

- Starts a local server at `http://localhost:5173`
- Watches your files for changes and auto-reloads the browser
- Compiles your SCSS to CSS
- Processes your HTML imports
- Generates an SVG sprite from your icons
- Shows a handy preview page listing all your pages and components

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

## ⚙️ Configuration

Static Kit uses `static-kit.config.json` for build customization:

```json
{
  "build": {
    "base": "public/", // Where assets are served from in build output
    "output": "dist" // Build output directory
  },
  "templates": {
    "language": "en" // HTML lang attribute (defaults to "en")
  }
}
```

### Configuration Options

- **`build.base`** - Controls where assets are placed in the build output (default: `"public/"`)
- **`build.output`** - Build output directory (default: `"dist"`)
- **`templates.language`** - HTML lang attribute for generated pages (default: `"en"`)

You can also create `static-kit.local.json` for local-only config that won't be committed to git.

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
├── index.html           # Your HTML pages (clean, processed)
├── icons-test.html      # Additional pages from src/pages/
├── .htaccess           # Server configuration
└── public/             # All assets organized under public/
    ├── css/
    │   └── styles.css  # Compiled SCSS
    ├── js/
    │   ├── index.js    # Your TypeScript compiled to JS
    │   └── test.js
    ├── images/         # Static images from public/images/
    │   ├── hero.jpg
    │   └── sprite.svg
    ├── fonts/          # Font files from public/fonts/
    └── favicon.ico     # Static assets from public/
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

## 💡 Common Use Cases & Examples

### Building a Simple Landing Page

1. **Create your main page** (`src/pages/index.html`):

   ```html
   <!-- @import: @components/header.html -->
   <main>
     <h1>Welcome to my site!</h1>
     <p>This is built with Static Kit.</p>
   </main>
   <!-- @import: @components/footer.html -->
   ```

2. **Create a header component** (`src/components/header.html`):

   ```html
   <header>
     <nav>
       <a href="/">Home</a>
       <a href="/about">About</a>
       <a href="/contact">Contact</a>
     </nav>
   </header>
   ```

3. **Add some styles** (`src/styles/main.scss`):

   ```scss
   body {
     font-family: Arial, sans-serif;
     margin: 0;
     padding: 0;
   }

   header nav {
     display: flex;
     gap: 1rem;
     padding: 1rem;
     background: #f0f0f0;

     a {
       text-decoration: none;
       color: #333;

       &:hover {
         color: #666;
       }
     }
   }
   ```

### Adding JavaScript Functionality

1. **Create a script** (`src/js/contact-form.ts`):

   ```typescript
   document.addEventListener("DOMContentLoaded", () => {
     const form = document.querySelector("#contact-form") as HTMLFormElement;

     if (form) {
       form.addEventListener("submit", (e) => {
         e.preventDefault();
         alert("Form submitted! (This is just a demo)");
       });
     }
   });
   ```

2. **Import it in `src/js/index.ts`**:

   ```typescript
   import "./contact-form.ts";

   export function init() {}
   ```

   The `index.js` file is automatically included in every page - no manual script tags needed!

### Using SVG Icons

1. **Add SVG files** to `src/icons/ui/` (like `arrow.svg`, `menu.svg`)
2. **Use them in your HTML**:
   ```html
   <svg><use href="/sprite.svg#ui-arrow"></use></svg>
   <svg><use href="/sprite.svg#ui-menu"></use></svg>
   ```

Happy building! 🚀
