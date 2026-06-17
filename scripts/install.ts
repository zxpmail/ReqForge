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
import {
  ADAPTER_LAYOUT,
  applyLoadoutHooksInDest,
  installLoadoutMarker,
  loadLoadout,
  listLoadoutNames,
  shouldIncludeForLoadout,
  type Loadout,
} from "./loadout";

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
  /** When set, copy only loadout skills/agents and apply loadout hooks */
  loadout?: string;
}

export interface InstallResult {
  client: InstallClient;
  targetRoot: string;
  destPath: string;
  merged: boolean;
  windowsSettingsApplied: boolean;
  loadout?: string;
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
 * Optional include(relPath) skips paths where include returns false (loadout filtering).
 */
export function copyInstallTree(
  srcDir: string,
  destDir: string,
  options: Pick<InstallOptions, "force"> & { include?: (rel: string) => boolean } = {},
): { merged: boolean } {
  if (!fs.existsSync(srcDir)) {
    throw new Error(`Adapter source not found: ${srcDir}`);
  }

  const include = options.include;

  const merge = (src: string, dest: string, relBase: string) => {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      if (include && relBase && !include(relBase)) {
        const hasChild = fs.readdirSync(src).some((name) => {
          const childRel = relBase ? `${relBase}/${name}` : name;
          return include(childRel) || subtreeIncluded(src, name, childRel, include);
        });
        if (!hasChild) return;
      }
      fs.mkdirSync(dest, { recursive: true });
      for (const name of fs.readdirSync(src)) {
        const childRel = relBase ? `${relBase}/${name}` : name;
        if (include && !include(childRel) && !subtreeIncluded(src, name, childRel, include)) {
          continue;
        }
        merge(path.join(src, name), path.join(dest, name), childRel);
      }
      return;
    }

    if (include && relBase && !include(relBase)) return;
    if (shouldSkipOverwrite(relBase, dest)) return;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  };

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    merge(srcDir, destDir, "");
    return { merged: false };
  }

  if (!options.force) {
    throw new Error(
      `Destination already exists: ${destDir}\nUse --force to merge (preserves feedback/ and settings.local.json).`,
    );
  }

  merge(srcDir, destDir, "");
  return { merged: true };
}

/** True if any descendant path would pass include() */
function subtreeIncluded(
  parentSrc: string,
  name: string,
  childRel: string,
  include: (rel: string) => boolean,
): boolean {
  if (include(childRel)) return true;
  const full = path.join(parentSrc, name);
  if (!fs.statSync(full).isDirectory()) return false;
  for (const sub of fs.readdirSync(full)) {
    const subRel = `${childRel}/${sub}`;
    if (include(subRel) || subtreeIncluded(full, sub, subRel, include)) return true;
  }
  return false;
}

/** Hook destination relative to target root, per adapter client */
const HOOK_DEST: Record<InstallClient, string> = {
  "claude-code": ".claude/hooks",
  cursor: ".cursor/rules/hooks",
  opencode: ".opencode/hooks",
};

const QUICKREF_SRC = "core/templates/forge-quickref.md";
const DEVMAP_SRC = "core/templates/dev-map-template.md";
const SECURITY_GUIDANCE_SRC = "core/templates/security-guidance-template.md";
const PROJECT_TASTE_SRC = "core/templates/project-taste-template.md";
const AGENTS_TEMPLATE_SRC = "core/templates/agents-template.md";
const PLAYWRIGHT_CONFIG_SRC = "core/templates/playwright-config.template.ts";
const PLAYWRIGHT_AUTH_SETUP_SRC = "core/templates/tests/auth-setup.template.ts";
const PLAYWRIGHT_VERIFY_SPEC_SRC = "core/templates/tests/verify-phase.template.spec.ts";
const PREFLIGHT_CONFIG_SRC = "core/templates/preflight-config.template.json";
const PREFLIGHT_WECHAT_EXAMPLE_SRC = "core/templates/preflight-wechat.example.json";
const ECORESULT_SRC = "core/templates/ecoresult-template.json";

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

/** Copy agents-template.md → project root (CLAUDE.md for claude-code, AGENTS.md for others) */
export function installAgentsTemplate(
  targetRoot: string,
  forgeRoot: string,
  log: (msg: string) => void,
  force?: boolean,
  client?: InstallClient,
): void {
  const src = path.join(forgeRoot, AGENTS_TEMPLATE_SRC);
  const filename = client === "claude-code" ? "CLAUDE.md" : "AGENTS.md";
  const dest = path.join(path.resolve(targetRoot), filename);
  if (!fs.existsSync(src)) {
    log(`  ⚠️  agents template not found: ${src}`);
    return;
  }
  if (fs.existsSync(dest) && !force) {
    log(`  ⏭️  ${filename} exists (use --force to overwrite)`);
    return;
  }
  let content = fs.readFileSync(src, "utf-8");
  if (client === "claude-code") {
    // Replace AGENTS.md references with CLAUDE.md for claude-code client
    content = content.replace(/AGENTS\.md/g, "CLAUDE.md");
  }
  fs.writeFileSync(dest, content, "utf-8");
  log(`  ✅ ${dest}`);
}

const PLAYWRIGHT_DEST_DIR = ".forge/tests";

/** Copy Playwright E2E templates → `.forge/tests/` */
export function installPlaywrightTemplates(
  targetRoot: string,
  forgeRoot: string,
  log: (msg: string) => void,
  force?: boolean,
): void {
  const entries = [
    { srcRel: PLAYWRIGHT_CONFIG_SRC, destName: "playwright.config.template.ts" },
    { srcRel: PLAYWRIGHT_AUTH_SETUP_SRC, destName: "auth-setup.template.ts" },
    { srcRel: PLAYWRIGHT_VERIFY_SPEC_SRC, destName: "verify-phase.template.spec.ts" },
  ];
  const destDir = path.join(path.resolve(targetRoot), PLAYWRIGHT_DEST_DIR);
  fs.mkdirSync(destDir, { recursive: true });

  for (const entry of entries) {
    const src = path.join(forgeRoot, entry.srcRel);
    const dest = path.join(destDir, entry.destName);
    if (!fs.existsSync(src)) {
      log(`  ⚠️  Playwright template not found: ${src}`);
      continue;
    }
    if (fs.existsSync(dest) && !force) {
      log(`  ⏭️  ${PLAYWRIGHT_DEST_DIR}/${entry.destName} exists (use --force to overwrite)`);
      continue;
    }
    fs.copyFileSync(src, dest);
    log(`  ✅ ${dest}`);
  }
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

/** Copy ecoresult template → `.forge/ecoresult.json` */
export function installEcoreSult(
  targetRoot: string,
  forgeRoot: string,
  log: (msg: string) => void,
  force?: boolean,
): void {
  const forgeDir = path.join(targetRoot, ".forge");
  fs.mkdirSync(forgeDir, { recursive: true });

  const src = path.join(forgeRoot, ECORESULT_SRC);
  const dest = path.join(forgeDir, "ecoresult.json");
  if (!fs.existsSync(src)) {
    log(`  ⚠️  ecoresult template not found: ${src}`);
  } else if (fs.existsSync(dest) && !force) {
    log(`  ⏭️  .forge/ecoresult.json exists (use --force to overwrite)`);
  } else {
    fs.copyFileSync(src, dest);
    log(`  ✅ ${dest}`);
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

/** Copy hook scripts from core/hooks/ to the target project's hook directory */
export function installHooks(
  client: InstallClient,
  targetRoot: string,
  forgeRoot: string,
  log: (msg: string) => void,
  force?: boolean,
  windows?: boolean,
): void {
  const hookRelDir = HOOK_DEST[client];
  if (!hookRelDir) {
    log(`  ⚠️  No hook destination defined for ${client}`);
    return;
  }
  const srcDir = path.join(forgeRoot, "core/hooks");
  const destDir = path.join(path.resolve(targetRoot), hookRelDir.replace(/\//g, path.sep));

  if (!fs.existsSync(srcDir)) {
    log(`  ⚠️  Hook source not found: ${srcDir}`);
    return;
  }

  const isWindows = windows ?? process.platform === "win32";

  fs.mkdirSync(destDir, { recursive: true });

  // Remove stale cross-platform files that don't match current platform
  const keepExt = isWindows ? ".bat" : ".sh";
  for (const name of fs.readdirSync(destDir)) {
    if (name === "AGENTS.md" || name.endsWith(".md")) continue;
    const ext = name.slice(name.lastIndexOf("."));
    if (ext !== keepExt && (ext === ".sh" || ext === ".bat" || ext === ".ps1")) {
      try { fs.rmSync(path.join(destDir, name)); } catch {}
    }
  }

  let copied = 0;
  for (const name of fs.readdirSync(srcDir)) {
    if (name === "AGENTS.md") continue;
    if (name.endsWith(".md")) continue;

    // Platform filtering: Windows → .bat only, Unix → .sh only
    if (isWindows && (name.endsWith(".sh") || name.endsWith(".ps1"))) continue;
    if (!isWindows && (name.endsWith(".bat") || name.endsWith(".ps1"))) continue;

    const srcFile = path.join(srcDir, name);
    if (!fs.statSync(srcFile).isFile()) continue;
    const destFile = path.join(destDir, name);
    if (fs.existsSync(destFile) && !force) continue;
    fs.copyFileSync(srcFile, destFile);
    copied++;
  }

  log(`  ✅ ${copied} hook scripts → ${destDir}`);
}

export function installForge(
  client: InstallClient,
  targetRoot: string,
  options: InstallOptions = {},
): InstallResult {
  const log = options.log ?? console.log;
  const forgeRoot = options.forgeRoot ?? FORGE_ROOT;
  const { src, dest, config } = resolvePaths(client, targetRoot, forgeRoot);

  let loadout: Loadout | undefined;
  let include: ((rel: string) => boolean) | undefined;
  if (options.loadout) {
    loadout = loadLoadout(options.loadout, forgeRoot);
    const layout = ADAPTER_LAYOUT[client];
    include = (rel) => shouldIncludeForLoadout(rel, loadout!, layout);
  }

  log(`📦 Installing Forge for ${client}`);
  if (loadout) {
    log(`   loadout: ${loadout.name} (${loadout.skills.length} skills, ${loadout.agents.length} agents, ${loadout.hooks.length} hooks)`);
  }
  log(`   from: ${src}`);
  log(`   to:   ${dest}`);

  const { merged } = copyInstallTree(src, dest, { force: options.force, include });
  if (merged) log("   (merged into existing directory; user feedback preserved)");
  if (loadout) {
    log(`   (skills filtered to loadout "${loadout.name}"; _shared always included)`);
  }

  // Copy hook scripts from core/hooks/ to the target project's hooks directory
  installHooks(client, targetRoot, forgeRoot, log, options.force, options.windows);

  if (loadout) {
    applyLoadoutHooksInDest(client, dest, loadout, log);
    installLoadoutMarker(path.resolve(targetRoot), loadout, log, options.force);
  }

  installForgeQuickref(path.resolve(targetRoot), forgeRoot, log, options.force);
  installDevMap(path.resolve(targetRoot), forgeRoot, log, options.force);
  installSecurityGuidance(path.resolve(targetRoot), forgeRoot, log, options.force);
  installProjectTaste(path.resolve(targetRoot), forgeRoot, log, options.force);
  installPreflightConfig(path.resolve(targetRoot), forgeRoot, log, options.force);
  installEcoreSult(path.resolve(targetRoot), forgeRoot, log, options.force);
  installSkillEvalTemplate(path.resolve(targetRoot), forgeRoot, log, options.force);
  installAgentsTemplate(path.resolve(targetRoot), forgeRoot, log, options.force, client);
  installPlaywrightTemplates(path.resolve(targetRoot), forgeRoot, log, options.force);

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
  if (loadout) {
    log(`   3. Loadout "${loadout.name}" active — see .forge/loadout-active.json`);
    log("   4. Run /product-spec-builder or describe your product idea");
  } else {
    log("   3. Run /product-spec-builder or describe your product idea");
  }

  return {
    client,
    targetRoot: path.resolve(targetRoot),
    destPath: dest,
    merged,
    windowsSettingsApplied,
    loadout: loadout?.name,
  };
}

export interface ParsedInstallArgs {
  client: InstallClient | null;
  target: string;
  force: boolean;
  windows: boolean;
  help: boolean;
  loadout?: string;
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
    if (arg === "--loadout" || arg === "-l") {
      const next = argv[++i];
      if (!next) throw new Error("--loadout requires a name (full, lite, minimal, web-app, cli-tool)");
      result.loadout = next;
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
  --loadout, -l <name> Install only skills/agents from loadout + apply its hooks
                       (full, web-app, lite, cli-tool, minimal)
  --force, -f          Merge into existing adapter dir (preserves feedback/, settings.local.json)
  --windows, -w        Use settings.windows.json → settings.json (default on win32)
  --help, -h           Show this help

Examples:
  pnpm forge-install claude-code --target ../my-app
  pnpm forge-install cursor . --loadout lite
  pnpm forge-install claude-code --target ../my-app --loadout minimal --force
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
      loadout: parsed.loadout,
    });
  } catch (err) {
    console.error(`❌ ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
