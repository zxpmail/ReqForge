#!/usr/bin/env node
/**
 * forge-debt.mjs — Technical debt ledger from simplification markers.
 *
 * Scans the repository for // NOTE: simplification markers (or custom pattern)
 * and compiles them into a structured debt ledger at .forge/debt-ledger.md.
 *
 * Usage:
 *   node scripts/forge-debt.mjs                    # Scan and report
 *   node scripts/forge-debt.mjs --report           # Write to .forge/debt-ledger.md
 *   node scripts/forge-debt.mjs --pattern "TODO"   # Custom comment pattern
 *   node scripts/forge-debt.mjs --help
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from "fs";
import { join, extname, basename } from "path";

const DEFAULT_PATTERN = /\/\/\s*NOTE:\s*(.+)/g;

/** Scan directory for all source files */
function walkDir(dir, acc) {
  try {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (name.startsWith(".") || name === "node_modules" || name === "target" || name === "__pycache__") continue;
      if (statSync(full).isDirectory()) {
        walkDir(full, acc);
      } else if (isSourceFile(name)) {
        acc.push(full);
      }
    }
  } catch { /* skip */ }
}

function isSourceFile(name) {
  const ext = extname(name).toLowerCase();
  return [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts",
          ".py", ".go", ".rs", ".java", ".rb", ".php", ".swift", ".kt"].includes(ext);
}

/** Extract simplification markers from a file */
function scanFile(filePath, pattern) {
  const findings = [];
  try {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    pattern.lastIndex = 0; // reset

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;
      // Reset per line
      const linePattern = new RegExp(pattern.source, "g");
      while ((match = linePattern.exec(line)) !== null) {
        const note = match[1].trim();
        // Check for upgrade path (after comma or --)
        const upgradeMatch = note.match(/，(.+)$/);
        const upgrade = upgradeMatch ? upgradeMatch[1].trim() : "";

        findings.push({
          file: filePath,
          line: i + 1,
          note: upgradeMatch ? note.slice(0, note.indexOf("，")).trim() : note,
          upgrade: upgrade,
        });
      }
    }
  } catch { /* skip */ }
  return findings;
}

function printHelp() {
  console.log(`
forge-debt — Technical debt ledger from simplification markers

Scans the repo for // NOTE: comments (or custom pattern) and compiles
them into a structured debt report.

Usage:
  forge-debt                         Print debt report to stdout
  forge-debt --report                Write .forge/debt-ledger.md
  forge-debt --pattern "FIXME"       Custom comment pattern to scan for
  forge-debt --help                  Show this help
`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  const writeReport = args.includes("--report");
  let customPattern = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--pattern" && args[i + 1]) {
      customPattern = new RegExp(`\\/\\/\\s*${args[++i]}:\\s*(.+)`, "g");
    }
  }

  const pattern = customPattern || DEFAULT_PATTERN;

  // Walk src/ lib/ app/ (or whole project if none of those)
  const root = process.cwd();
  const files = [];
  const searchDirs = ["src", "lib", "app", "core", "components", "pages"].filter(d =>
    existsSync(join(root, d))
  );
  if (searchDirs.length === 0) {
    walkDir(root, files);
  } else {
    for (const dir of searchDirs) {
      walkDir(join(root, dir), files);
    }
  }

  const allEntries = [];
  for (const f of files) {
    allEntries.push(...scanFile(f, pattern));
  }

  if (allEntries.length === 0) {
    console.log("No simplification markers found.");
    process.exit(0);
  }

  // Deduplicate
  const seen = new Set();
  const unique = allEntries.filter(e => {
    const key = `${e.file}:${e.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by upgrade status: entries with upgrade paths first, then by file
  unique.sort((a, b) => {
    const aHas = a.upgrade ? 0 : 1;
    const bHas = b.upgrade ? 0 : 1;
    if (aHas !== bHas) return aHas - bHas;
    return a.file.localeCompare(b.file) || a.line - b.line;
  });

  const withUpgrade = unique.filter(e => e.upgrade);
  const withoutUpgrade = unique.filter(e => !e.upgrade);

  // Format output
  const report = [
    "# Technical Debt Ledger",
    "",
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    `Pattern: ${customPattern ? `// ${args[args.indexOf("--pattern") + 1]}:` : "// NOTE:"}`,
    `Entries: ${unique.length} (${withUpgrade.length} with upgrade path, ${withoutUpgrade.length} without)`,
    "",
    "## Entries with Upgrade Path",
    "",
    ...(withUpgrade.length === 0 ? ["_(none)_", ""] : [
      "| File | Line | Note | Upgrade Path |",
      "|------|------|------|-------------|",
      ...withUpgrade.map(e =>
        `| ${e.file.replace(root + "/", "")} | ${e.line} | ${e.note} | ${e.upgrade} |`
      ),
    ]),
    "",
    "## Entries without Upgrade Path",
    "",
    ...(withoutUpgrade.length === 0 ? ["_(none)_", ""] : [
      "| File | Line | Note |",
      "|------|------|------|",
      ...withoutUpgrade.map(e =>
        `| ${e.file.replace(root + "/", "")} | ${e.line} | ${e.note} |`
      ),
    ]),
    "",
    "---",
    `_${unique.length} total simplification markers found. Run \`forge-debt --report\` to refresh this ledger._`,
    "",
  ].join("\n");

  if (writeReport) {
    const forgeDir = join(root, ".forge");
    mkdirSync(forgeDir, { recursive: true });
    const reportPath = join(forgeDir, "debt-ledger.md");
    writeFileSync(reportPath, report, "utf-8");
    console.log(`✅ Debt ledger written to ${reportPath}`);
    console.log(`   ${unique.length} entries (${withUpgrade.length} with upgrade path)`);
  } else {
    console.log(report);
  }
}

const isMain = process.argv[1] && basename(process.argv[1]) === "forge-debt.mjs";
if (isMain) main();
