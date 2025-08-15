// Main exports
export { createStaticKitConfig, staticKitConfig } from "./vite-config.js";

// Plugins
export {
  svgSpritePlugin,
  pagesPreviewPlugin,
  buildPlugins
} from "./plugins/index.js";

// Utilities
export { 
  loadStaticKitConfig,
  normalizeBase,
  timeStamp
} from "./utils/config.js";

export { 
  processHtmlImports 
} from "./utils/html-imports.js";

export { 
  scanDirectory,
  getInputEntries
} from "./utils/file-scanner.js";

// Types
export type {
  StaticKitConfig,
  StaticKitOptions,
  PagesPreviewOptions
} from "./types.js";

export type {
  SvgSpriteOptions,
  BuildPluginsOptions
} from "./plugins/index.js";
