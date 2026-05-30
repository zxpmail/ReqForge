/**
 * apply-loadout.ts — Validate and apply Forge loadout hook bundles to adapter settings
 *
 * Usage:
 *   pnpm apply-loadout full claude-code
 *   pnpm apply-loadout minimal cursor --dry-run
 *
 * Merges hook registrations from a loadout into the adapter settings.json.
 * For skills/agents filtering on install, use: pnpm forge-install <client> --loadout <name>
 */

import * as fs from "fs";
import * as path from "path";
import {
  applyLoadoutHooksToSettingsFile,
  ADAPTER_LAYOUT,
  loadLoadout,
  listLoadoutNames,
} from "./loadout";

const ROOT = path.resolve(__dirname, "..");

type Client = "claude-code" | "cursor" | "opencode";

const CLIENT_SETTINGS: Record<Client, string> = {
  "claude-code": "adapters/claude-code/.claude/settings.json",
  cursor: "adapters/cursor/.cursor/settings.json",
  opencode: "adapters/opencode/.opencode/settings.json",
};

function main(): void {
  const [loadoutName, clientArg, ...rest] = process.argv.slice(2);
  const dryRun = rest.includes("--dry-run");

  if (!loadoutName || !clientArg || !(clientArg in CLIENT_SETTINGS)) {
    const names = listLoadoutNames(ROOT).join(", ");
    console.log("Usage: pnpm apply-loadout <loadout> <claude-code|cursor|opencode> [--dry-run]");
    console.log(`Loadouts: ${names || "full, web-app, lite, cli-tool, minimal"}`);
    process.exit(1);
  }

  const client = clientArg as Client;
  const loadout = loadLoadout(loadoutName, ROOT);
  const settingsPath = path.join(ROOT, CLIENT_SETTINGS[client]);
  const layout = ADAPTER_LAYOUT[client];

  console.log(`📦 Loadout: ${loadout.name} v${loadout.version}`);
  console.log(`   ${loadout.description}`);
  console.log(`   Skills (${loadout.skills.length}): ${loadout.skills.join(", ")}`);
  console.log(`   Agents (${loadout.agents.length}): ${loadout.agents.join(", ")}`);
  console.log(`   Hooks (${loadout.hooks.length}): ${loadout.hooks.join(", ")}`);

  if (dryRun) {
    console.log("\n[DRY RUN] Would write hooks to:", settingsPath);
    return;
  }

  applyLoadoutHooksToSettingsFile(settingsPath, loadout, layout.hooksPrefix, false, console.warn);
  console.log(`\n✅ Updated ${settingsPath}`);

  const winPath = settingsPath.replace("settings.json", "settings.windows.json");
  if (fs.existsSync(winPath)) {
    applyLoadoutHooksToSettingsFile(winPath, loadout, layout.hooksPrefix, true, console.warn);
    console.log(`✅ Updated ${winPath}`);
  }
}

main();
