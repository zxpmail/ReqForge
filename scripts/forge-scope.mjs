#!/usr/bin/env node
/**
 * forge-scope.mjs — Active Scope Filter (巽)
 *
 * 声明 Phase 的改动范围，在 forge-verify 中检查是否越界。
 *
 * 用法：
 *   node scripts/forge-scope.mjs init <N> --modify "src/a.ts,src/b/" --readonly "src/lib/" [--forge-root <dir>]
 *   node scripts/forge-scope.mjs check [--forge-root <dir>]
 *   node scripts/forge-scope.mjs show [--forge-root <dir>]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname, relative, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function scopeFile(root) {
  return join(root, ".forge", "active-scope.json");
}

function loadScope(root) {
  const file = scopeFile(root);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf-8"));
}

function saveScope(root, data) {
  const file = scopeFile(root);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2));
}

function normalizePaths(root, paths) {
  return paths.map(p => {
    // relative path → resolve then re-relativize for consistent format
    const abs = resolve(root, p.trim());
    return relative(root, abs).replace(/\\/g, "/");
  });
}

function cmdInit(root, phase, modify, readonly) {
  const data = {
    phase,
    createdAt: new Date().toISOString(),
    modify: normalizePaths(root, modify),
    readonly: normalizePaths(root, readonly),
    outOfScope: [],  // populated by check after detecting violations
  };
  saveScope(root, data);
  console.log(`  ✅ .forge/active-scope.json (Phase ${phase})`);
  console.log(`     Modify: ${data.modify.join(", ") || "(none)"}`);
  console.log(`     Read-only: ${data.readonly.join(", ") || "(none)"}`);
}

function gitDiffFiles(root) {
  const { execSync } = require("child_process");
  try {
    const out = execSync(
      `git diff --name-only HEAD`,
      { cwd: root, encoding: "utf-8", timeout: 15000, stdio: "pipe" }
    ).trim();
    if (!out) return [];
    return out.split("\n").filter(Boolean);
  } catch {
    // Not a git repo or no changes
    return [];
  }
}

function cmdCheck(root) {
  const scope = loadScope(root);
  if (!scope) {
    console.log("  – scope-check: SKIP (no .forge/active-scope.json)");
    return { status: "skip" };
  }

  const changed = gitDiffFiles(root);
  if (changed.length === 0) {
    console.log("  ✓ scope-check: PASS (no uncommitted changes)");
    return { status: "pass" };
  }

  const modifySet = new Set(scope.modify);
  const readonlySet = new Set(scope.readonly);

  const inScope = (file) => {
    for (const p of modifySet) {
      if (file === p || file.startsWith(p + "/")) return "modify";
    }
    for (const p of readonlySet) {
      if (file === p || file.startsWith(p + "/")) return "readonly";
    }
    return null;
  };

  const violations = [];
  for (const file of changed) {
    const hit = inScope(file);
    if (!hit && !file.startsWith(".forge/") && !file.startsWith(".git")) {
      violations.push(file);
    }
  }

  if (violations.length > 0) {
    console.log(`  ✗ scope-check: FAIL — ${violations.length} files outside scope`);
    for (const v of violations.slice(0, 10)) {
      console.log(`       ${v}`);
    }
    scope.outOfScope = [...new Set([...(scope.outOfScope || []), ...violations])];
    saveScope(root, scope);
    return { status: "fail", detail: violations };
  }

  console.log("  ✓ scope-check: PASS (all changes in-scope)");
  return { status: "pass" };
}

function cmdShow(root) {
  const scope = loadScope(root);
  if (!scope) {
    console.log("No active scope (.forge/active-scope.json not found)");
    return;
  }
  console.log(`\n=== Active Scope (Phase ${scope.phase}) ===`);
  console.log(`Created: ${scope.createdAt}`);
  console.log(`\nModify:`);
  for (const p of scope.modify) console.log(`  ✎ ${p}`);
  console.log(`\nRead-only:`);
  for (const p of scope.readonly) console.log(`  👁 ${p}`);
  if (scope.outOfScope?.length) {
    console.log(`\nOut-of-scope violations:`);
    for (const p of scope.outOfScope) console.log(`  ⚠ ${p}`);
  }
  console.log();
}

function printHelp() {
  console.log(`
forge-scope — Active Scope Filter (巽)

Usage:
  node scripts/forge-scope.mjs init <N> --modify "path1,path2" [--readonly "path3,path4"]
  node scripts/forge-scope.mjs check
  node scripts/forge-scope.mjs show

Options:
  --modify <paths>     Comma-separated files/dirs this Phase will edit
  --readonly <paths>   Comma-separated files/dirs this Phase will read only
  --forge-root <dir>   Project root (default: repo root)
  --help, -h           Show this help
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  const cmd = args[0];
  const phase = cmd === "init" && args[1] ? parseInt(args[1], 10) : null;

  const kv = { modify: [], readonly: [] };
  let root = ROOT;
  for (let i = phase !== null ? 2 : 1; i < args.length; i++) {
    if (args[i] === "--forge-root" && args[i + 1]) { root = args[++i]; continue; }
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "";
      if (key === "modify" || key === "readonly") {
        kv[key] = val.split(",").map(s => s.trim()).filter(Boolean);
      }
    }
  }

  switch (cmd) {
    case "init":
      if (!phase) { console.error("Missing phase number"); printHelp(); process.exit(1); }
      cmdInit(root, phase, kv.modify, kv.readonly);
      break;
    case "check":
      const result = cmdCheck(root);
      if (result.status === "fail") process.exit(1);
      break;
    case "show":
      cmdShow(root);
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      printHelp();
      process.exit(1);
  }
}

main();
