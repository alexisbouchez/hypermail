import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

export interface Config {
  apiKey?: string;
  defaultFrom?: string;
  signature?: string;
}

const CONFIG_DIR = join(homedir(), ".config", "hypermail");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): Config {
  ensureConfigDir();
  if (!existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    const content = readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function hasApiKey(): boolean {
  const config = loadConfig();
  return !!config.apiKey;
}

export function getApiKey(): string | undefined {
  return loadConfig().apiKey;
}

export function setApiKey(apiKey: string): void {
  const config = loadConfig();
  config.apiKey = apiKey;
  saveConfig(config);
}

export function getDefaultFrom(): string | undefined {
  return loadConfig().defaultFrom;
}

export function setDefaultFrom(from: string): void {
  const config = loadConfig();
  config.defaultFrom = from;
  saveConfig(config);
}

export function getSignature(): string | undefined {
  return loadConfig().signature;
}

export function setSignature(signature: string): void {
  const config = loadConfig();
  config.signature = signature;
  saveConfig(config);
}
