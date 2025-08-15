import fs from "fs/promises";
import path from "path";
import type { StaticKitConfig } from "../types.js";

export async function loadStaticKitConfig(root?: string): Promise<StaticKitConfig> {
  const projectRoot = root || process.cwd();
  const baseConfigPath = path.join(projectRoot, "static-kit.config.json");
  const localConfigPath = path.join(projectRoot, "static-kit.local.json");
  const result: StaticKitConfig = {};
  
  try {
    const raw = await fs.readFile(baseConfigPath, "utf8");
    Object.assign(result, JSON.parse(raw));
  } catch {
    // Config file doesn't exist or can't be read
  }
  
  try {
    const rawLocal = await fs.readFile(localConfigPath, "utf8");
    Object.assign(result, JSON.parse(rawLocal));
  } catch {
    // Local config file doesn't exist or can't be read
  }
  
  return result;
}

export function normalizeBase(input?: string): string {
  if (!input) return "public/";
  let base = input.trim();
  if (!base.endsWith("/")) base = base + "/";
  return base;
}

export function timeStamp(): string {
  return Date.now().toString().slice(0, 10);
}
