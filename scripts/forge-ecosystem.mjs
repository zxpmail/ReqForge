#!/usr/bin/env node
/**
 * forge-ecosystem.mjs — Ecosystem library cache management.
 *
 * Manages a global, per-language cache of curated library recommendations
 * at ~/.forge/ecosystem/<lang>.json.
 *
 * Usage:
 *   node scripts/forge-ecosystem.mjs search <lang> <query>
 *   node scripts/forge-ecosystem.mjs get <lang>
 *   node scripts/forge-ecosystem.mjs add <lang> <name> [--desc <text>] [--npm <pkg>] [--cat <category>]
 *   node scripts/forge-ecosystem.mjs refresh <lang>
 *   node scripts/forge-ecosystem.mjs status
 *   node scripts/forge-ecosystem.mjs --help
 */

import { basename } from "path";
import { readCache, writeCache, clearCache, getCacheStats, isCacheFresh, setCacheDirForTest } from "./forge-ecosystem/cache.mjs";
import { getColdStart, listSupportedLanguages, getAllColdStart } from "./forge-ecosystem/cold-start.mjs";
import { searchCache, getLanguageData, loadProjectOverrides, applyOverrides } from "./forge-ecosystem/search.mjs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(`
forge-ecosystem — Ecosystem library cache management

Manages a global, per-language cache of curated library recommendations
in ~/.forge/ecosystem/<lang>.json.

Usage:
  forge-ecosystem search <lang> <query>   Search cached entries for a library
  forge-ecosystem get <lang>              Dump full cache for a language
  forge-ecosystem add <lang> <name>        Add a library to cache
    [--desc <text>]                       Description (required on first add)
    [--npm <pkg>]                         Package name (defaults to library name)
    [--cat <category>]                    Category (default: "general")
  forge-ecosystem refresh <lang>          Regenerate cache from curated defaults
  forge-ecosystem status                  Show cache statistics
  forge-ecosystem --help                  Show this help

Languages with defaults: ${listSupportedLanguages().join(", ")}
`);
}

function normalizeLang(lang) {
  return lang ? lang.toLowerCase().trim() : "";
}

/**
 * Parses --desc, --npm, --cat flags from an arg list.
 * @param {string[]} args
 * @returns {{ desc: string, npm: string, cat: string }}
 */
export function parseAddArgs(args) {
  let desc = "", npm = "", cat = "general";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--desc" && args[i + 1]) { desc = args[++i]; continue; }
    if (args[i] === "--npm" && args[i + 1]) { npm = args[++i]; continue; }
    if (args[i] === "--cat" && args[i + 1]) { cat = args[++i]; continue; }
  }
  return { desc, npm, cat };
}

// ---------------------------------------------------------------------------
// Command handlers (exported for testing)
// ---------------------------------------------------------------------------

/**
 * search <lang> <query>
 * @param {string} lang
 * @param {string} query
 * @param {string} [projectRoot]
 */
export function cmdSearch(lang, query, projectRoot) {
  lang = normalizeLang(lang);
  if (!lang || !query) {
    console.error("Usage: forge-ecosystem search <lang> <query>");
    process.exit(1);
  }

  const data = getLanguageData(lang);
  if (data.source === "empty") {
    console.log(`No data for language "${lang}". Run "forge-ecosystem refresh ${lang}" to seed it.`);
    return;
  }

  // Apply project overrides if available
  const overrides = loadProjectOverrides(projectRoot);
  const filtered = applyOverrides(data.entries, overrides, lang);
  const result = searchCache({ entries: filtered }, query);

  if (result.count === 0) {
    console.log(`No results for "${query}" in ${lang}.`);
    return;
  }

  console.log(`Results for "${query}" in ${lang}:\n`);
  const header = `${"Name".padEnd(22)} ${"Category".padEnd(16)} Description`;
  console.log(header);
  console.log("─".repeat(header.length));
  for (const r of result.results) {
    const npmPkg = r.npm && r.npm !== r.name ? ` (${r.npm})` : "";
    console.log(`${(r.name + npmPkg).padEnd(22)} ${r.category.padEnd(16)} ${r.description}`);
  }
  console.log(`\n${result.count} result(s)`);

  // First-time-extract hint
  if (result.count > 0 && result.results[0]) {
    console.log(`\n↑ Pin "${result.results[0].name}" in .forge/ecoresult.json to lock it for this project.`);
  }
}

/**
 * get <lang>
 * @param {string} lang
 * @param {string} [projectRoot]
 */
export function cmdGet(lang, projectRoot) {
  lang = normalizeLang(lang);
  if (!lang) {
    console.error("Usage: forge-ecosystem get <lang>");
    process.exit(1);
  }

  const data = getLanguageData(lang);
  if (data.source === "empty") {
    console.error(`No data for language "${lang}".`);
    process.exit(1);
  }

  const overrides = loadProjectOverrides(projectRoot);
  const filtered = applyOverrides(data.entries, overrides, lang);

  console.log(JSON.stringify({ language: lang, entries: filtered, source: data.source }, null, 2));
}

/**
 * add <lang> <name> [--desc <text>] [--npm <pkg>] [--cat <category>]
 * @param {string} lang
 * @param {string} name
 * @param {{ desc: string, npm: string, cat: string }} opts
 */
export function cmdAdd(lang, name, opts) {
  lang = normalizeLang(lang);
  if (!lang || !name) {
    console.error("Usage: forge-ecosystem add <lang> <name> [--desc <text>] [--npm <pkg>] [--cat <category>]");
    process.exit(1);
  }

  const { desc, npm: pkg, cat } = opts;
  const category = cat || "general";

  // Load or initialize cache data
  let data = readCache(lang);
  if (!data) {
    data = {
      language: lang,
      updated: new Date().toISOString(),
      entries: {},
    };
  }

  if (!data.entries) data.entries = {};
  if (!data.entries[category]) data.entries[category] = [];

  // Check for duplicate
  const exists = data.entries[category].some(e => e.name === name);
  if (exists) {
    console.log(`⏭️  "${name}" already exists in ${lang}/${category}.`);
    return;
  }

  data.entries[category].push({
    name,
    description: desc || "",
    npm: pkg || name,
    added: new Date().toISOString().slice(0, 10),
  });
  data.updated = new Date().toISOString();

  const result = writeCache(lang, data);
  if (result.ok) {
    console.log(`✅ Added "${name}" to ${lang}/${category}.`);
  } else {
    console.error(`❌ Failed to write cache: ${result.error}`);
    process.exit(1);
  }
}

/**
 * refresh <lang>
 * @param {string} lang
 */
export function cmdRefresh(lang) {
  lang = normalizeLang(lang);
  if (!lang) {
    console.error("Usage: forge-ecosystem refresh <lang>");
    process.exit(1);
  }

  const cold = getColdStart(lang);
  if (!cold) {
    // Unknown language: create empty cache
    const empty = {
      language: lang,
      updated: new Date().toISOString(),
      entries: {},
    };
    const result = writeCache(lang, empty);
    if (result.ok) {
      console.log(`Created empty cache for "${lang}".`);
    } else {
      console.error(`❌ Failed: ${result.error}`);
      process.exit(1);
    }
    return;
  }

  // Write cold-start defaults to cache
  const data = {
    language: lang,
    updated: new Date().toISOString(),
    entries: cold.entries,
  };
  const result = writeCache(lang, data);
  if (!result.ok) {
    console.error(`❌ Failed: ${result.error}`);
    process.exit(1);
  }

  // Count entries
  let total = 0;
  const cats = Object.keys(cold.entries);
  for (const cat of cats) total += cold.entries[cat].length;
  console.log(`Refreshed "${lang}" cache (${cats.length} categories, ${total} entries).`);
}

/**
 * status
 * @param {string} [projectRoot]
 */
export function cmdStatus(projectRoot) {
  const stats = getCacheStats();

  if (stats.languages.length === 0) {
    console.log("No cached languages yet.\nRun \"forge-ecosystem refresh <lang>\" to seed one.");
  } else {
    const totalLabel = `Total: ${stats.languages.length} language(s), ${stats.totalEntries} entries, ${(stats.sizeBytes / 1024).toFixed(1)} KB`;
    console.log("─".repeat(totalLabel.length));
    console.log(totalLabel);
    console.log("─".repeat(totalLabel.length));
  }

  // Check for project overrides
  const overrides = loadProjectOverrides(projectRoot);
  const totalPins = overrides.pins.length;
  const totalBans = overrides.bans.length;
  if (totalPins > 0 || totalBans > 0) {
    console.log(`\nProject overrides: ${totalPins} pin(s), ${totalBans} ban(s).`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  const cmd = args[0];
  const rest = args.slice(1);

  try {
    switch (cmd) {
      case "search": {
        if (rest.length < 2) {
          console.error("Usage: forge-ecosystem search <lang> <query>");
          process.exit(1);
        }
        cmdSearch(rest[0], rest.slice(1).join(" "));
        break;
      }
      case "get": {
        if (rest.length < 1) {
          console.error("Usage: forge-ecosystem get <lang>");
          process.exit(1);
        }
        cmdGet(rest[0]);
        break;
      }
      case "add": {
        if (rest.length < 2) {
          console.error("Usage: forge-ecosystem add <lang> <name> [--desc <text>] [--npm <pkg>] [--cat <category>]");
          process.exit(1);
        }
        const lang = rest[0];
        const name = rest[1];
        const opts = parseAddArgs(rest.slice(2));
        cmdAdd(lang, name, opts);
        break;
      }
      case "refresh": {
        if (rest.length < 1) {
          console.error("Usage: forge-ecosystem refresh <lang>");
          process.exit(1);
        }
        cmdRefresh(rest[0]);
        break;
      }
      case "status": {
        cmdStatus();
        break;
      }
      default:
        console.error(`Unknown command: "${cmd}".`);
        printHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error(`forge-ecosystem error: ${err.message}`);
    process.exit(1);
  }
}

// Guard: only run when invoked directly (not when imported by tests)
const isMain = process.argv[1] && basename(process.argv[1]) === "forge-ecosystem.mjs";
if (isMain) main();
