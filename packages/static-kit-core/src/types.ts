import type { Plugin } from "vite";

export interface StaticKitConfig {
  build?: {
    base?: string; // e.g. "public/" or "assets/" - where built assets are served from
    output?: string; // e.g. "dist"
  };
  templates?: {
    language?: string;
  };
}

export interface StaticKitOptions {
  config?: StaticKitConfig;
  pagesDir?: string;
  componentsDir?: string;
  iconsDir?: string;
  stylesEntry?: string;
  jsEntry?: string;
  publicDir?: string;
  useTailwind?: boolean;
}

export interface PagesPreviewOptions {
  pagesDir?: string;
  componentsDir?: string;
  routePrefix?: string;
  componentsRoutePrefix?: string;
  stylesEntry?: string;
}
