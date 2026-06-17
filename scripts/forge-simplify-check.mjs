#!/usr/bin/env node
/**
 * forge-simplify-check.mjs — Over-engineering review.
 *
 * Scans git diff (or working tree) for signs of over-engineering:
 * - Unnecessary abstractions (single-use interface/class/factory)
 * - Dead code (unused exports, commented-out blocks)
 * - Bloated files relative to function
 * - Speculative generics/patterns
 *
 * Lighter than /code-review — focuses only on "could this be simpler?"
 *
 * Usage:
 *   node scripts/forge-simplify-check.mjs              # Check git diff
 *   node scripts/forge-simplify-check.mjs --full       # Scan entire working tree
 *   node scripts/forge-simplify-check.mjs --help
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, extname, basename } from "path";
import { execSync } from "child_process";

// ---------------------------------------------------------------------------
// Source file scanning
// ---------------------------------------------------------------------------

/** List all source files, optionally filtered to git diff only */
function getSourceFiles(fullScan) {
  const srcDirs = ["src", "lib", "app", "core", "scripts"].filter(d =>
    existsSync(join(process.cwd(), d))
  );

  let files = [];
  if (fullScan) {
    for (const dir of srcDirs) {
      walkDir(join(process.cwd(), dir), files);
    }
  } else {
    // Get changed files from git diff (staged + unstaged)
    try {
      const diff = execSync("git diff --name-only HEAD", {
        cwd: process.cwd(), encoding: "utf-8", timeout: 10000,
      }).trim();
      const staged = execSync("git diff --cached --name-only", {
        cwd: process.cwd(), encoding: "utf-8", timeout: 10000,
      }).trim();
      const changed = new Set([
        ...diff.split("\n").filter(Boolean),
        ...staged.split("\n").filter(Boolean),
      ]);
      // Only check source files that exist on disk
      for (const f of changed) {
        const full = join(process.cwd(), f);
        if (existsSync(full) && isSourceFile(f)) files.push(full);
      }
    } catch {
      // Not a git repo or no changes — fall through to working tree scan
      for (const dir of srcDirs) {
        walkDir(join(process.cwd(), dir), files);
      }
    }
  }
  return files;
}

function isSourceFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  return [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs", ".java"].includes(ext);
}

function walkDir(dir, acc) {
  try {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (name.startsWith(".") || name === "node_modules") continue;
      if (statSync(full).isDirectory()) {
        if (!name.startsWith("_") && name !== "__pycache__" && name !== "target") {
          walkDir(full, acc);
        }
      } else if (isSourceFile(full)) {
        acc.push(full);
      }
    }
  } catch { /* skip unreadable */ }
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

/** Single-use interface: interface with only one implementation */
function checkSingleUseInterface(filePath, content, lines) {
  const findings = [];
  const ifacePattern = /^(export\s+)?interface\s+(\w+)/m;
  let match;
  while ((match = ifacePattern.exec(content)) !== null) {
    const ifaceName = match[2];
    // Check if this file has a class implementing it
    const implPattern = new RegExp(`implements\\s+.*\\b${ifaceName}\\b`);
    const hasImpl = implPattern.test(content);
    if (hasImpl) {
      // Count implementations
      const implCount = (content.match(implPattern) || []).length;
      if (implCount === 1 && !ifaceName.endsWith("Props")) {
        const lineNum = content.slice(0, match.index).split("\n").length;
        findings.push({
          file: basename(filePath),
          line: lineNum,
          severity: "warning",
          message: `Interface "${ifaceName}" has only 1 implementation — replace with concrete type`,
        });
      }
    }
  }
  return findings;
}

/** Single-method class: class with 1 method (should be a function) */
function checkSingleMethodClass(filePath, content) {
  const findings = [];
  const classPattern = /^(export\s+)?class\s+(\w+)/gm;
  let match;
  while ((match = classPattern.exec(content)) !== null) {
    const className = match[2];
    // Check if it's a React component (extends Component or has JSX)
    if (className.endsWith("Component") || /extends\s+.*Component/.test(content)) continue;

    // Count methods (non-constructor, non-getter/setter)
    const methodPattern = /^\s*(async\s+)?\w+\s*\([^)]*\)\s*{/gm;
    const methods = [];
    let m;
    while ((m = methodPattern.exec(content)) !== null) {
      // Only count methods inside this class (rough heuristic: look for classMethod pattern)
      methods.push(m[0]);
    }
    if (methods.length === 1) {
      const lineNum = content.slice(0, match.index).split("\n").length;
      findings.push({
        file: basename(filePath),
        line: lineNum,
        severity: "info",
        message: `Class "${className}" has only 1 method — could be a plain function`,
      });
    }
  }
  return findings;
}

/** Speculative generic type parameter that's only used once */
function checkSingleUseGeneric(filePath, content) {
  const findings = [];
  const genericPattern = /<([A-Z]\w*)>/g;
  let match;
  while ((match = genericPattern.exec(content)) !== null) {
    const typeParam = match[1];
    if (["T", "K", "V", "E"].includes(typeParam)) continue; // conventional generics
    // Skip if it's a JSX tag (React)
    if (content[match.index - 1] === " ") continue;

    // Count uses of this type param in the file
    const usePattern = new RegExp(`\\b${typeParam}\\b`, "g");
    const uses = (content.match(usePattern) || []).length;
    if (uses <= 2) {
      const lineNum = content.slice(0, match.index).split("\n").length;
      findings.push({
        file: basename(filePath),
        line: lineNum,
        severity: "info",
        message: `Generic type "${typeParam}" barely used (${uses}x) — probably premature abstraction`,
      });
    }
  }
  return findings;
}

/** File too large (exceeds line limit) */
function checkFileSize(filePath, lines) {
  const MAX = 300;
  if (lines.length > MAX) {
    return [{
      file: basename(filePath),
      line: 1,
      severity: "warning",
      message: `File has ${lines.length} lines (max ${MAX}) — split into smaller modules`,
    }];
  }
  return [];
}

/** Commented-out code blocks */
function checkCommentedCode(filePath, content, lines) {
  const findings = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      /^\s*\/\/\s*(if|for|while|switch|function|class|const|let|var|import|export|return)\b/.test(line) &&
      !/\/\/\s*NOTE:/.test(line) &&  // skip simplification markers
      !/\/\/\s*TODO:/.test(line)     // skip todos
    ) {
      findings.push({
        file: basename(filePath),
        line: i + 1,
        severity: "info",
        message: `Commented-out code: "${line.trim()}"`,
      });
      break; // one per file is enough
    }
  }
  return findings;
}

/** Unused exports (exported only once and not imported elsewhere) */
function checkUnusedExport(filePath, content) {
  const findings = [];
  const exportPattern = /^(export\s+(default\s+)?(function|const|class|interface|type)\s+(\w+))/gm;
  const allExports = [];
  let match;
  while ((match = exportPattern.exec(content)) !== null) {
    allExports.push(match[4]);
  }
  // For now, just flag if a file exports many things but has few imports
  // (simplified — full unused-export detection needs cross-file scan)
  if (allExports.length >= 5) {
    const lineNum = content.slice(0, match?.index || 0).split("\n").length || 1;
    findings.push({
      file: basename(filePath),
      line: lineNum,
      severity: "info",
      message: `File exports ${allExports.length} symbols — consider if all are needed`,
    });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(`
forge-simplify-check — Over-engineering review

Scans your code for unnecessary abstractions, dead code, and bloated files.
Lighter than /code-review — focuses only on "could this be simpler?"

Usage:
  forge-simplify-check                Check git diff for over-engineering
  forge-simplify-check --full         Scan entire working tree
  forge-simplify-check --help         Show this help
`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  const fullScan = args[0] === "--full";

  const files = getSourceFiles(fullScan);
  if (files.length === 0) {
    console.log("No source files found. Run from a project with src/, lib/, or app/ directory.");
    process.exit(0);
  }

  const allFindings = [];

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      allFindings.push(...checkFileSize(filePath, lines));
      allFindings.push(...checkSingleUseInterface(filePath, content, lines));
      allFindings.push(...checkSingleMethodClass(filePath, content));
      allFindings.push(...checkSingleUseGeneric(filePath, content));
      allFindings.push(...checkCommentedCode(filePath, content, lines));
      allFindings.push(...checkUnusedExport(filePath, content));
    } catch { /* skip unreadable files */ }
  }

  // Deduplicate: same file + same line + similar message
  const seen = new Set();
  const unique = allFindings.filter(f => {
    const key = `${f.file}:${f.line}:${f.message.slice(0, 40)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by severity: warning > info
  unique.sort((a, b) => {
    const order = { warning: 0, info: 1 };
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
  });

  // Print report
  const warnings = unique.filter(f => f.severity === "warning");
  const infos = unique.filter(f => f.severity === "info");

  if (unique.length === 0) {
    console.log("✅ No over-engineering patterns detected.");
    process.exit(0);
  }

  console.log("=== Over-Engineering Review ===\n");

  if (warnings.length > 0) {
    console.log(`Warnings (${warnings.length}):`);
    for (const f of warnings) {
      console.log(`  ⚠️  ${f.file}:${f.line} — ${f.message}`);
    }
    console.log();
  }

  if (infos.length > 0) {
    console.log(`Info (${infos.length}):`);
    for (const f of infos) {
      console.log(`  💡 ${f.file}:${f.line} — ${f.message}`);
    }
    console.log();
  }

  console.log(`Total: ${unique.length} finding(s) (${warnings.length} warning, ${infos.length} info)`);
  if (warnings.length > 0) process.exit(1);
}

const isMain = process.argv[1] && basename(process.argv[1]) === "forge-simplify-check.mjs";
if (isMain) main();
