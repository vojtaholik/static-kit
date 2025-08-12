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
   git clone <your-repo-url>
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

## 💡 Common Use Cases & Examples

### Building a Simple Landing Page

1. **Create your main page** (`src/pages/index.html`):

   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>My Awesome Site</title>
       <link rel="stylesheet" href="/styles.css" />
     </head>
     <body>
       <!-- @import: @components/header.html -->
       <main>
         <h1>Welcome to my site!</h1>
         <p>This is built with Static Kit.</p>
       </main>
       <!-- @import: @components/footer.html -->
     </body>
   </html>
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

2. **Include it in your page**:
   ```html
   <script src="/js/contact-form.js"></script>
   ```

### Using SVG Icons

1. **Add SVG files** to `src/icons/ui/` (like `arrow.svg`, `menu.svg`)
2. **Use them in your HTML**:
   ```html
   <svg><use href="/sprite.svg#ui-arrow"></use></svg>
   <svg><use href="/sprite.svg#ui-menu"></use></svg>
   ```

## 🔧 Troubleshooting

### Common Issues for Beginners

**"I can't see my changes"**

- Make sure the dev server is running (`pnpm dev`)
- Check the browser console for errors
- Try refreshing the page manually

**"My import isn't working"**

- Check the file path in your import comment
- Make sure the file exists in `src/components/`
- Use `@components/filename.html` for cleaner imports

**"My styles aren't applying"**

- Ensure you're editing `src/styles/main.scss`
- Check that `<link rel="stylesheet" href="/styles.css">` is in your HTML `<head>`
- Look for SCSS syntax errors in the terminal

**"Port 5173 is already in use"**

- Kill other processes using that port, or
- Vite will automatically try the next available port (5174, 5175, etc.)

**"pnpm command not found"**

- Install pnpm globally: `npm install -g pnpm`
- Or use npm instead: `npm install` and `npm run dev`

### Getting Help

- Check the terminal output for error messages
- Look at the browser's developer console (F12)
- Most issues are simple typos in file paths or missing files

### Development Tips

- Use your browser's developer tools to inspect elements and test CSS
- The preview page at `http://localhost:5173` shows all your pages and components
- Changes save automatically, but you might need to refresh for some changes
- Keep the terminal open to see build errors and warnings

## 🎓 What's Next?

Now that you have the basics down, here's how to level up:

### 1. Learn the File Structure

- Explore `src/pages/` - Each HTML file becomes a page
- Check out `src/components/` - Reusable pieces of HTML
- Look at `src/styles/main.scss` - Your main stylesheet
- Peek at `src/js/` - Where your TypeScript/JavaScript lives

### 2. Master HTML Imports

- Start with simple components (buttons, headers, footers)
- Use `@components/` prefix for cleaner imports
- Create nested component folders for organization

### 3. Style Your Site

- Edit `src/styles/main.scss` for global styles
- Learn basic SCSS syntax (variables, nesting, mixins)
- Use your browser's developer tools to experiment

### 4. Add Interactivity

- Create `.ts` files in `src/js/` for functionality
- Import them in your HTML with `<script>` tags
- Start simple: form validation, button clicks, animations

### 5. Deploy Your Site

- Run `pnpm build` to create the `dist/` folder
- Upload the `dist/` folder to any web host
- Works with Netlify, Vercel, GitHub Pages, or any static host

### Learning Resources

- [MDN Web Docs](https://developer.mozilla.org) - HTML, CSS, JavaScript reference
- [SCSS Guide](https://sass-lang.com/guide) - Learn SCSS syntax
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - If you want to use TypeScript features

Happy building! 🚀
