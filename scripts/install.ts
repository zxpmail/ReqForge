/**
 * Forge install script
 *
 * Copies an adapter bundle from this repo into a user project directory.
 *
 * Usage:
 *   pnpm forge-install <client> [--target <dir>] [--force] [--windows]
 *   npx ts-node scripts/install.ts claude-code --target ../my-app
 *
 * Clients: claude-code | cursor | opencode
 */

import * as fs from "fs";
import * as path from "path";
import { installSkillEvalTemplate } from "./skill-eval";

const FORGE_ROOT = path.resolve(__dirname, "..");

export type InstallClient = "claude-code" | "cursor" | "opencode";

export interface InstallClientConfig {
  srcRelative: string;
  destRelative: string;
  settingsDir: string | null;
}

export const INSTALL_CLIENTS: Record<InstallClient, InstallClientConfig> = {
  "claude-code": {
    srcRelative: "adapters/claude-code/.claude",
    destRelative: ".claude",
    settingsDir: ".claude",
  },
  cursor: {
    srcRelative: "adapters/cursor/.cursor",
    destRelative: ".cursor",
    settingsDir: ".cursor",
  },
  opencode: {
    srcRelative: "adapters/opencode/.opencode",
    destRelative: ".opencode",
    settingsDir: null,
  },
};

/** Paths (relative to install root) never overwritten when merging with --force */
export const PRESERVE_IF_EXISTS = new Set(["settings.local.json"]);

export interface InstallOptions {
  force?: boolean;
  windows?: boolean;
  forgeRoot?: string;
  log?: (msg: string) => void;
}

export interface InstallResult {
  client: InstallClient;
  targetRoot: string;
  destPath: string;
  merged: boolean;
  windowsSettingsApplied: boolean;
}

export function isInstallClient(value: string): value is InstallClient {
  return value in INSTALL_CLIENTS;
}

export function resolvePaths(
  client: InstallClient,
  targetRoot: string,
  forgeRoot: string = FORGE_ROOT,
): { src: string; dest: string; config: InstallClientConfig } {
  const config = INSTALL_CLIENTS[client];
  const src = path.join(forgeRoot, config.srcRelative);
  const dest = path.join(path.resolve(targetRoot), config.destRelative);
  return { src, dest, config };
}

export function shouldSkipOverwrite(relativePath: string, destFile: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  if (PRESERVE_IF_EXISTS.has(normalized)) return true;
  if (normalized.startsWith("feedback/") && fs.existsSync(destFile)) return true;
  return false;
}

/**
 * Copy src tree into dest. Fresh dest: full copy. Existing dest: requires force; merges with preserve rules.
 */
export function copyInstallTree(
  srcDir: string,
  destDir: string,
  options: Pick<InstallOptions, "force"> = {},
): { merged: boolean } {
  if (!fs.existsSync(srcDir)) {
    throw new Error(`Adapter source not found: ${srcDir}`);
  }

  if (!fs.existsSync(destDir)) {
    fs.cpSync(srcDir, destDir, { recursive: true });
    return { merged: false };
  }

  if (!options.force) {
    throw new Error(
      `Destination already exists: ${destDir}\nUse --force to merge (preserves feedback/ and settings.local.json).`,
    );
  }

  const merge = (src: string, dest: string, relBase: string) => {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      for (const name of fs.readdirSync(src)) {
        merge(
          path.join(src, name),
          path.join(dest, name),
          relBase ? `${relBase}/${name}` : name,
        );
      }
      return;
    }

    if (shouldSkipOverwrite(relBase, dest)) return;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  };

  merge(srcDir, destDir, "");
  return { merged: true };
}

const QUICKREF_SRC = "core/templates/forge-quickref.md";
const DEVMAP_SRC = "core/templates/dev-map-template.md";
const SECURITY_GUIDANCE_SRC = "core/templates/security-guidance-template.md";
const PROJECT_TASTE_SRC = "core/templates/project-taste-template.md";
const AGENTS_TEMPLATE_SRC = "core/templates/agents-template.md";
const PREFLIGHT_CONFIG_SRC = "core/templates/preflight-config.template.json";
const PREFLIGHT_WECHAT_EXAMPLE_SRC = "core/templates/preflight-wechat.example.json";

/** Copy forge-quickref into user project `.forge/quickref.md` */
export function installForgeQuickref(
  targetRoot: string,
  forgeRoot: string,
  log: (msg: string) => void,
  force?: boolean,
): void {
  const src = path.join(forgeRoot, QUICKREF_SRC);
  const forgeDir = path.join(targetRoot, ".forge");
  const dest = path.join(forgeDir, "quickref.md");
  if (!fs.existsSync(src)) {
    log(`  ⚠️  Quickref template not found: ${src}`);
    return;
  }
  if (fs.existsSync(dest) && !force) {
    log(`  ⏭️  .forge/quickref.md exists (use --force to overwrite)`);
    return;
  }
  fs.mkdirSync(forgeDir, { recursive: true });
  fs.copyFileSync(src, dest);
  log(`  ✅ ${dest}`);
}

/** Copy dev-map template into user project `.forge/dev-map.md` */
export function installDevMap(
  targetRoot: string,
  forgeRoot: string,
  log: (msg: string) => void,
  force?: boolean,
): void {
  const src = path.join(forgeRoot, DEVMAP_SRC);
  const forgeDir = path.join(targetRoot, ".forge");
  const dest = path.join(forgeDir, "dev-map.md");
  if (!fs.existsSync(src)) {
    log(`  ⚠️  dev-map template not found: ${src}`);
    return;
  }
  if (fs.existsSync(dest) && !force) {
    log(`  ⏭️  .forge/dev-map.md exists (use --force to overwrite)`);
    return;
  }
  fs.mkdirSync(forgeDir, { recursive: true });
  fs.copyFileSync(src, dest);
  log(`  ✅ ${dest}`);
}

/** Copy security-guidance template into user project `.forge/security-guidance.md` */
export function installSecurityGuidance(
  targetRoot: string,
  forgeRoot: string,
  log: (msg: string) => void,
  force?: boolean,
): void {
  const src = path.join(forgeRoot, SECURITY_GUIDANCE_SRC);
  const forgeDir = path.join(targetRoot, ".forge");
  const dest = path.join(forgeDir, "security-guidance.md");
  if (!fs.existsSync(src)) {
    log(`  ⚠️  security-guidance template not found: ${src}`);
    return;
  }
  if (fs.existsSync(dest) && !force) {
    log(`  ⏭️  .forge/security-guidance.md exists (use --force to overwrite)`);
    return;
  }
  fs.mkdirSync(forgeDir, { recursive: true });
  fs.copyFileSync(src, dest);
  log(`  ✅ ${dest}`);
}

/** Copy project-taste template into user project `.forge/project-taste.md` */
export function installProjectTaste(
  targetRoot: string,
  forgeRoot: string,
  log: (msg: string) => void,
  force?: boolean,
): void {
  const src = path.join(forgeRoot, PROJECT_TASTE_SRC);
  const forgeDir = path.join(targetRoot, ".forge");
  const dest = path.join(forgeDir, "project-taste.md");
  if (!fs.existsSync(src)) {
    log(`  ⚠️  project-taste template not found: ${src}`);
    return;
  }
  if (fs.existsSync(dest) && !force) {
    log(`  ⏭️  .forge/project-taste.md exists (use --force to overwrite)`);
    return;
  }
  fs.mkdirSync(forgeDir, { recursive: true });
  fs.copyFileSync(src, dest);
  log(`  ✅ ${dest}`);
}

/** Copy agents-template.md → project root `AGENTS.md` */
export function installAgentsTemplate(
  targetRoot: string,
  forgeRoot: string,
  log: (msg: string) => void,
  force?: boolean,
): void {
  const src = path.join(forgeRoot, AGENTS_TEMPLATE_SRC);
  const dest = path.join(path.resolve(targetRoot), "AGENTS.md");
  if (!fs.existsSync(src)) {
    log(`  ⚠️  agents template not found: ${src}`);
    return;
  }
  if (fs.existsSync(dest) && !force) {
    log(`  ⏭️  AGENTS.md exists (use --force to overwrite)`);
    return;
  }
  fs.copyFileSync(src, dest);
  log(`  ✅ ${dest}`);
}

/** Copy preflight config template → `.forge/preflight.json` */
export function installPreflightConfig(
  targetRoot: string,
  forgeRoot: string,
  log: (msg: string) => void,
  force?: boolean,
): void {
  const forgeDir = path.join(targetRoot, ".forge");
  fs.mkdirSync(forgeDir, { recursive: true });

  const configSrc = path.join(forgeRoot, PREFLIGHT_CONFIG_SRC);
  const configDest = path.join(forgeDir, "preflight.json");
  if (!fs.existsSync(configSrc)) {
    log(`  ⚠️  preflight template not found: ${configSrc}`);
  } else if (fs.existsSync(configDest) && !force) {
    log(`  ⏭️  .forge/preflight.json exists (use --force to overwrite)`);
  } else {
    fs.copyFileSync(configSrc, configDest);
    log(`  ✅ ${configDest}`);
  }

  const exampleSrc = path.join(forgeRoot, PREFLIGHT_WECHAT_EXAMPLE_SRC);
  const exampleDest = path.join(forgeDir, "preflight-wechat.example.json");
  if (fs.existsSync(exampleSrc)) {
    if (!fs.existsSync(exampleDest) || force) {
      fs.copyFileSync(exampleSrc, exampleDest);
      log(`  ✅ ${exampleDest}`);
    }
  }
}

export function applyWindowsSettings(settingsDir: string, log: (msg: string) => void): boolean {
  const winSrc = path.join(settingsDir, "settings.windows.json");
  const dest = path.join(settingsDir, "settings.json");
  if (!fs.existsSync(winSrc)) return false;
  fs.copyFileSync(winSrc, dest);
  log(`  ✅ Windows hooks: ${dest}`);
  return true;
}

export function installForge(
  client: InstallClient,
  targetRoot: string,
  options: InstallOptions = {},
): InstallResult {
  const log = options.log ?? console.log;
  const forgeRoot = options.forgeRoot ?? FORGE_ROOT;
  const { src, dest, config } = resolvePaths(client, targetRoot, forgeRoot);

  log(`📦 Installing Forge for ${client}`);
  log(`   from: ${src}`);
  log(`   to:   ${dest}`);

  const { merged } = copyInstallTree(src, dest, { force: options.force });
  if (merged) log("   (merged into existing directory; user feedback preserved)");

  installForgeQuickref(path.resolve(targetRoot), forgeRoot, log, options.force);
  installDevMap(path.resolve(targetRoot), forgeRoot, log, options.force);
  installSecurityGuidance(path.resolve(targetRoot), forgeRoot, log, options.force);
  installProjectTaste(path.resolve(targetRoot), forgeRoot, log, options.force);
  installPreflightConfig(path.resolve(targetRoot), forgeRoot, log, options.force);
  installSkillEvalTemplate(path.resolve(targetRoot), forgeRoot, log, options.force);
  installAgentsTemplate(path.resolve(targetRoot), forgeRoot, log, options.force);

  let windowsSettingsApplied = false;
  const useWindows =
    options.windows ?? process.platform === "win32";
  if (useWindows && config.settingsDir) {
    const settingsDir = path.join(path.resolve(targetRoot), config.settingsDir);
    windowsSettingsApplied = applyWindowsSettings(settingsDir, log);
  }

  log("");
  log("✅ Install complete. Next steps:");
  log(`   1. Open ${path.resolve(targetRoot)} in your AI client`);
  log("   2. Start a chat — Forge detects project progress automatically");
  log("   3. Run /product-spec-builder or describe your product idea");

  return {
    client,
    targetRoot: path.resolve(targetRoot),
    destPath: dest,
    merged,
    windowsSettingsApplied,
  };
}

export interface ParsedInstallArgs {
  client: InstallClient | null;
  target: string;
  force: boolean;
  windows: boolean;
  help: boolean;
}

export function parseInstallArgs(argv: string[]): ParsedInstallArgs {
  const result: ParsedInstallArgs = {
    client: null,
    target: process.cwd(),
    force: false,
    windows: false,
    help: false,
  };

  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
      continue;
    }
    if (arg === "--force" || arg === "-f") {
      result.force = true;
      continue;
    }
    if (arg === "--windows" || arg === "-w") {
      result.windows = true;
      continue;
    }
    if (arg === "--target" || arg === "-t") {
      const next = argv[++i];
      if (!next) throw new Error("--target requires a directory path");
      result.target = next;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    positional.push(arg);
  }

  if (positional.length > 0) {
    const c = positional[0];
    if (!isInstallClient(c)) {
      throw new Error(`Unknown client "${c}". Use: claude-code | cursor | opencode`);
    }
    result.client = c;
  }
  if (positional.length > 1) {
    result.target = positional[1];
  }

  return result;
}

function printHelp(): void {
  console.log(`
Forge install — copy adapter files into your project

Usage:
  pnpm forge-install <client> [target-dir] [options]
  ./scripts/install.sh <client> [target-dir] [options]

Clients:
  claude-code    Copy to <target>/.claude/
  cursor         Copy to <target>/.cursor/
  opencode       Copy to <target>/.opencode/

Options:
  --target, -t <dir>   Project directory (default: current directory)
  --force, -f          Merge into existing adapter dir (preserves feedback/, settings.local.json)
  --windows, -w        Use settings.windows.json → settings.json (default on win32)
  --help, -h           Show this help

Examples:
  pnpm forge-install claude-code --target ../my-app
  pnpm forge-install cursor .
  ./scripts/install.ps1 opencode C:\\projects\\my-app --force
`);
}

function main(): void {
  let parsed: ParsedInstallArgs;
  try {
    parsed = parseInstallArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`❌ ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  if (parsed.help) {
    printHelp();
    return;
  }

  if (!parsed.client) {
    console.error("❌ Missing client. Use: claude-code | cursor | opencode");
    printHelp();
    process.exit(1);
  }

  const target = path.resolve(parsed.target);
  if (!fs.existsSync(target)) {
    console.error(`❌ Target directory not found: ${target}`);
    process.exit(1);
  }

  try {
    installForge(parsed.client, target, {
      force: parsed.force,
      windows: parsed.windows,
    });
  } catch (err) {
    console.error(`❌ ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
