#!/usr/bin/env node
/**
 * forge-hashline.mjs — Hash-anchored content editing
 *
 * Hashline edits use SHA256 content hashes instead of brittle string matching.
 * The caller provides a hash anchor; the tool verifies the file content still
 * matches before applying. Stale anchors are rejected to prevent corruption.
 *
 * Usage:
 *   node scripts/forge-hashline.mjs hash <file>              # Print SHA256
 *   node scripts/forge-hashline.mjs hash <file> --lines N:M  # Print block hash
 *   node scripts/forge-hashline.mjs verify <file> <hash>     # Check hash (exit 0/1)
 *   node scripts/forge-hashline.mjs edit <file> <hash> --new-string "..."
 *                                                             # Verify + replace
 *   node scripts/forge-hashline.mjs edit <file> <hash> --from <content-file>
 *                                                             # Replace from file
 *   node scripts/forge-hashline.mjs verify-brief <brief-path>  # Check hashes before fix
 *   node scripts/forge-hashline.mjs verify-brief <brief-path> --after-fix
 *                                                             # Check hashes after fix
 *   node scripts/forge-hashline.mjs apply-brief <brief-path>   # Auto-create new files from brief
 *
 * Options:
 *   --lines N:M     Line range (1-based, inclusive)
 *   --new-string    New content (inline)
 *   --from <file>   New content (from file)
 *   --root <dir>    Project root (default: repo root)
 *   --after-fix     Verify mode: check files were actually modified
 *   --json          Output machine-readable JSON (verify-brief only)
 *   --help, -h      Show help
 */

import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// === Constants ===
const HASH_PREFIX = "sha256:";
const MIN_PREFIX_LEN = 8;

// === Core Hashing ===

export function computeHash(content) {
  const normalized = content.replace(/\r\n/g, "\n");
  return HASH_PREFIX + createHash("sha256").update(normalized, "utf-8").digest("hex");
}

export function computeFileHash(filePath) {
  const content = readFileSync(filePath, "utf-8");
  return computeHash(content);
}

export function computeBlockHash(filePath, startLine, endLine) {
  const lines = readFileSync(filePath, "utf-8").replace(/\r\n/g, "\n").split("\n");
  const block = lines.slice(startLine - 1, endLine).join("\n");
  return computeHash(block);
}

// === Hash Matching ===

export function hashMatches(claimed, actual) {
  const clean = (s) => s.replace(/^sha256:/, "").toLowerCase();
  const c = clean(claimed);
  const a = clean(actual);
  if (c === a) return { match: true, fuzzy: false };
  if (c.length >= MIN_PREFIX_LEN && a.startsWith(c)) return { match: true, fuzzy: true };
  return { match: false, fuzzy: false };
}

// === Edit Operations ===

export function safeReplaceFile(filePath, claimedHash, newContent) {
  if (!existsSync(filePath)) {
    return { ok: false, error: "ENOENT", message: `File not found: ${filePath}` };
  }
  const currentHash = computeFileHash(filePath);
  const { match, fuzzy } = hashMatches(claimedHash, currentHash);
  if (!match) {
    return {
      ok: false,
      error: "STALE_ANCHOR",
      claimed: claimedHash,
      actual: currentHash,
      message: `Hash mismatch for ${basename(filePath)}:\n  claimed: ${claimedHash}\n  actual:  ${currentHash}\n  → file has changed since anchor was recorded`,
    };
  }
  const tmpPath = filePath + ".hashline.tmp";
  writeFileSync(tmpPath, newContent, "utf-8");
  renameSync(tmpPath, filePath);
  const newHash = computeFileHash(filePath);
  return { ok: true, fuzzy, oldHash: currentHash, newHash };
}

export function safeReplaceBlock(filePath, startLine, endLine, claimedHash, newBlockContent) {
  if (!existsSync(filePath)) {
    return { ok: false, error: "ENOENT", message: `File not found: ${filePath}` };
  }
  const currentLines = readFileSync(filePath, "utf-8").replace(/\r\n/g, "\n").split("\n");
  const block = currentLines.slice(startLine - 1, endLine).join("\n");
  const blockHash = computeHash(block);
  const { match, fuzzy } = hashMatches(claimedHash, blockHash);
  if (!match) {
    return {
      ok: false,
      error: "STALE_ANCHOR",
      claimed: claimedHash,
      actual: blockHash,
      message: `Block hash mismatch at lines ${startLine}-${endLine} in ${basename(filePath)}`,
    };
  }
  const newLines = [
    ...currentLines.slice(0, startLine - 1),
    ...newBlockContent.split("\n"),
    ...currentLines.slice(endLine),
  ];
  const tmpPath = filePath + ".hashline.tmp";
  writeFileSync(tmpPath, newLines.join("\n"), "utf-8");
  renameSync(tmpPath, filePath);
  return { ok: true, fuzzy };
}

// === Brief Parsing & Verification ===

/**
 * Parse hashline entries from a fix-brief.md file.
 * Each hashline block starts with `**Hashline**:` and contains lines like:
 *   `path/to/file` → `sha256:abc...`
 *   `path/to/file` → (新文件)  # 创建后将生成哈希
 */
export function parseBriefHashes(briefPath) {
  if (!existsSync(briefPath)) return { entries: [], error: "ENOENT" };
  const content = readFileSync(briefPath, "utf-8");
  const lines = content.split("\n");
  const entries = [];
  let inHashline = false;

  for (const line of lines) {
    if (line.includes("**Hashline**:")) {
      inHashline = true;
      continue;
    }
    if (!inHashline) continue;

    // Line: `path/to/file` → `sha256:abc...`
    const match = line.match(/^\s*`([^`]+)`\s*→\s*`(sha256:[a-f0-9]+)`/);
    if (match) {
      entries.push({ file: match[1], hash: match[2], isNew: false });
      continue;
    }

    // Line: `path/to/file` → (新文件)
    const newFileMatch = line.match(/^\s*`([^`]+)`\s*→\s*\(新文件\)/);
    if (newFileMatch) {
      entries.push({ file: newFileMatch[1], hash: null, isNew: true });
      continue;
    }

    // Empty line or non-hashline content → end of block
    if (line.trim() === "" || !line.startsWith("  `")) {
      inHashline = false;
    }
  }

  return { entries };
}

/**
 * Verify brief hashline entries against current file state.
 *
 * @param {string} briefPath - Path to fix-brief.md
 * @param {string} mode - "before" (pre-fix check) or "after" (post-fix check)
 * @param {string} [rootDir] - Project root for resolving relative paths
 * @returns {{ ok: boolean, results: Array, summary: object }}
 */
export function verifyBrief(briefPath, mode, rootDir) {
  rootDir = rootDir || ROOT;
  const { entries, error } = parseBriefHashes(briefPath);
  if (error === "ENOENT") return { ok: false, error: "ENOENT", message: `Brief not found: ${briefPath}` };

  const results = [];
  let ok = true;

  for (const entry of entries) {
    const absPath = join(rootDir, entry.file);
    const r = { file: entry.file };

    if (mode === "before" || mode === "pre") {
      // Pre-fix: verify brief is still fresh
      if (entry.isNew) {
        if (existsSync(absPath)) {
          r.status = "ALREADY_EXISTS";
          r.detail = "File already exists";
          ok = false;
        } else {
          r.status = "OK";
          r.detail = "Ready to create";
        }
      } else {
        if (!existsSync(absPath)) {
          r.status = "MISSING";
          r.detail = "Expected file not found";
          ok = false;
        } else {
          const actualHash = computeFileHash(absPath);
          const { match } = hashMatches(entry.hash, actualHash);
          if (match) {
            r.status = "OK";
            r.detail = "Hash matches";
          } else {
            r.status = "STALE";
            r.claimed = entry.hash;
            r.actual = actualHash;
            r.detail = "Hash mismatch — file changed since brief was generated";
            ok = false;
          }
        }
      }
    } else {
      // After-fix: verify edits were actually applied
      if (entry.isNew) {
        if (existsSync(absPath)) {
          r.status = "OK";
          r.detail = "File created";
        } else {
          r.status = "MISSING";
          r.detail = "File was not created";
          ok = false;
        }
      } else {
        if (!existsSync(absPath)) {
          r.status = "MISSING";
          r.detail = "File was deleted";
          ok = false;
        } else {
          const actualHash = computeFileHash(absPath);
          const { match } = hashMatches(entry.hash, actualHash);
          if (!match) {
            r.status = "OK";
            r.detail = "Hash changed — file was edited";
          } else {
            r.status = "UNCHANGED";
            r.claimed = entry.hash;
            r.actual = actualHash;
            r.detail = "Hash still matches — file was NOT edited";
            ok = false;
          }
        }
      }
    }

    results.push(r);
  }

  const summary = {
    total: results.length,
    ok: results.filter(r => r.status === "OK").length,
    stale: results.filter(r => r.status === "STALE" || r.status === "UNCHANGED").length,
    missing: results.filter(r => r.status === "MISSING").length,
    other: results.filter(r => r.status !== "OK" && r.status !== "STALE" && r.status !== "UNCHANGED" && r.status !== "MISSING").length,
  };

  return { ok, results, summary };
}

/**
 * Apply a fix-brief: auto-create (新文件) entries.
 * For hash-anchored edits, only verifies — actual editing is done by the AI.
 *
 * @param {string} briefPath - Path to fix-brief.md
 * @param {string} [rootDir] - Project root
 * @returns {{ ok: boolean, created: string[], errors: string[] }}
 */
export function applyBrief(briefPath, rootDir) {
  rootDir = rootDir || ROOT;
  const { entries, error } = parseBriefHashes(briefPath);
  if (error === "ENOENT") return { ok: false, error: "ENOENT", message: `Brief not found: ${briefPath}` };

  const created = [];
  const errors = [];

  for (const entry of entries) {
    if (!entry.isNew) continue;
    const absPath = join(rootDir, entry.file);
    if (existsSync(absPath)) {
      // Already exists, skip
      continue;
    }
    try {
      const dir = dirname(absPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(absPath, "", "utf-8");
      created.push(entry.file);
    } catch (e) {
      errors.push(`${entry.file}: ${e.message}`);
    }
  }

  return { ok: errors.length === 0, created, errors };
}

// === Manifest ===

export function generateManifest(files, rootDir) {
  const BINARY_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff2", ".ttf", ".eot", ".otf", ".pdf", ".zip", ".tar", ".gz"]);
  const manifest = {};
  for (const absPath of files) {
    const relPath = absPath.startsWith(rootDir) ? absPath.slice(rootDir.length + 1).replace(/\\/g, "/") : absPath;
    const ext = relPath.slice(relPath.lastIndexOf(".")).toLowerCase();
    if (BINARY_EXT.has(ext)) {
      manifest[relPath] = { skipped: true, reason: "binary" };
      continue;
    }
    try {
      const hash = computeFileHash(absPath);
      const stat = existsSync(absPath) ? readFileSync(absPath, "utf-8").length : 0;
      manifest[relPath] = { hash, size: stat };
    } catch {
      manifest[relPath] = { skipped: true, reason: "unreadable" };
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    manifest,
  };
}

// === CLI ===

function printHelp() {
  console.log(`forge-hashline.mjs — Hash-anchored content editing

Usage:
  node scripts/forge-hashline.mjs hash <file>               Print file SHA256
  node scripts/forge-hashline.mjs hash <file> --lines N:M   Print block SHA256
  node scripts/forge-hashline.mjs verify <file> <hash>      Verify hash (exit 0/1)
  node scripts/forge-hashline.mjs edit <file> <hash> --new-string "..."   Verify + replace
  node scripts/forge-hashline.mjs edit <file> <hash> --from <content-file>  Replace from file
  node scripts/forge-hashline.mjs verify-brief <brief-path>            Check all brief hashes
  node scripts/forge-hashline.mjs verify-brief <brief-path> --after-fix Check edits applied
  node scripts/forge-hashline.mjs apply-brief <brief-path>             Auto-create new files

Options:
  --lines N:M     Line range (1-based, inclusive)
  --new-string    New content (inline)
  --from <file>   New content (from file)
  --root <dir>    Project root (default: repo root)
  --after-fix     Verify mode: check files were actually modified
  --json          Output machine-readable JSON (verify-brief only)
  -h, --help      Show help
`);
}

function parseLineRange(str) {
  const m = str.match(/^(\d+):(\d+)$/);
  if (!m) throw new Error(`Invalid line range: "${str}". Use N:M (e.g. 42:58)`);
  return [parseInt(m[1], 10), parseInt(m[2], 10)];
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  const cmd = args[0];
  const rest = args.slice(1);

  if (cmd === "hash") {
    if (!rest[0]) { console.error("Missing: <file>"); process.exit(1); }
    const filePath = rest[0];
    if (!existsSync(filePath)) { console.error(`ENOENT: ${filePath}`); process.exit(1); }

    const lineIdx = rest.indexOf("--lines");
    if (lineIdx !== -1 && rest[lineIdx + 1]) {
      const [start, end] = parseLineRange(rest[lineIdx + 1]);
      console.log(computeBlockHash(filePath, start, end));
    } else {
      console.log(computeFileHash(filePath));
    }
    process.exit(0);
  }

  if (cmd === "verify") {
    if (!rest[0] || !rest[1]) { console.error("Missing: <file> <hash>"); process.exit(1); }
    const filePath = rest[0];
    const claimedHash = rest[1];
    if (!existsSync(filePath)) { console.error(`ENOENT: ${filePath}`); process.exit(1); }

    const lineIdx = rest.indexOf("--lines");
    if (lineIdx !== -1 && rest[lineIdx + 1]) {
      const [start, end] = parseLineRange(rest[lineIdx + 1]);
      const actual = computeBlockHash(filePath, start, end);
      const { match, fuzzy } = hashMatches(claimedHash, actual);
      if (match) {
        console.log(fuzzy ? "OK (fuzzy)" : "OK (exact)");
        process.exit(0);
      }
      console.error(`STALE_ANCHOR: ${filePath}\n  claimed: ${claimedHash}\n  actual:  ${actual}`);
      process.exit(1);
    }

    const actual = computeFileHash(filePath);
    const { match, fuzzy } = hashMatches(claimedHash, actual);
    if (match) {
      console.log(fuzzy ? "OK (fuzzy)" : "OK (exact)");
      process.exit(0);
    }
    console.error(`STALE_ANCHOR: ${filePath}\n  claimed: ${claimedHash}\n  actual:  ${actual}`);
    process.exit(1);
  }

  if (cmd === "edit") {
    if (!rest[0] || !rest[1]) { console.error("Missing: <file> <hash>"); process.exit(1); }
    const filePath = rest[0];
    const claimedHash = rest[1];
    if (!existsSync(filePath)) { console.error(`ENOENT: ${filePath}`); process.exit(1); }

    // Get new content
    let newContent;
    const newStringIdx = rest.indexOf("--new-string");
    const fromIdx = rest.indexOf("--from");
    if (newStringIdx !== -1 && rest[newStringIdx + 1]) {
      newContent = rest[newStringIdx + 1];
    } else if (fromIdx !== -1 && rest[fromIdx + 1]) {
      newContent = readFileSync(rest[fromIdx + 1], "utf-8");
    } else {
      console.error("Missing: --new-string or --from");
      process.exit(1);
    }

    const lineIdx = rest.indexOf("--lines");
    let result;
    if (lineIdx !== -1 && rest[lineIdx + 1]) {
      const [start, end] = parseLineRange(rest[lineIdx + 1]);
      result = safeReplaceBlock(filePath, start, end, claimedHash, newContent);
    } else {
      result = safeReplaceFile(filePath, claimedHash, newContent);
    }

    if (result.ok) {
      console.log(`EDITED ${filePath}`);
      if (result.newHash) console.log(`New hash: ${result.newHash}`);
      if (result.fuzzy) console.error("(warning: fuzzy match)");
      process.exit(0);
    }
    console.error(result.message || result.error);
    process.exit(1);
  }

  if (cmd === "verify-brief") {
    if (!rest[0]) { console.error("Missing: <brief-path>"); process.exit(1); }
    const briefPath = rest[0];
    const mode = rest.includes("--after-fix") ? "after" : "before";
    const jsonMode = rest.includes("--json");
    const rootIdx = rest.indexOf("--root");

    const result = verifyBrief(briefPath, mode, rootIdx !== -1 && rest[rootIdx + 1] ? rest[rootIdx + 1] : undefined);

    if (result.error === "ENOENT") {
      console.error(`ENOENT: ${briefPath}`);
      process.exit(1);
    }

    if (jsonMode) {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.ok ? 0 : 1);
    }

    const label = mode === "after" ? "After-fix" : "Before-fix";
    console.log(`${label} verify — ${briefPath}`);
    console.log("─".repeat(50));
    for (const r of result.results) {
      const icon = r.status === "OK" ? "✅" : r.status === "STALE" || r.status === "UNCHANGED" ? "⚠️" : r.status === "MISSING" ? "❌" : "❓";
      console.log(` ${icon} \`${r.file}\` — ${r.detail}`);
      if (r.claimed && r.actual && r.status !== "OK") {
        console.log(`    claimed: ${r.claimed}`);
        console.log(`    actual:  ${r.actual}`);
      }
    }
    console.log("─".repeat(50));
    console.log(`Summary: ${result.summary.ok} OK · ${result.summary.stale} stale · ${result.summary.missing} missing`);
    process.exit(result.ok ? 0 : 1);
  }

  if (cmd === "apply-brief") {
    if (!rest[0]) { console.error("Missing: <brief-path>"); process.exit(1); }
    const briefPath = rest[0];
    const rootIdx = rest.indexOf("--root");

    const result = applyBrief(briefPath, rootIdx !== -1 && rest[rootIdx + 1] ? rest[rootIdx + 1] : undefined);

    if (result.error === "ENOENT") {
      console.error(`ENOENT: ${briefPath}`);
      process.exit(1);
    }

    if (result.created.length > 0) {
      console.log(`Created ${result.created.length} file(s):`);
      for (const f of result.created) console.log(`  ✅ ${f}`);
    } else {
      console.log("No new files to create (all exist or none marked as new).");
    }
    if (result.errors.length > 0) {
      for (const e of result.errors) console.error(`  ❌ ${e}`);
      process.exit(1);
    }
    process.exit(0);
  }

  console.error(`Unknown command: ${cmd}`);
  printHelp();
  process.exit(1);
}

const isMain = process.argv[1] && (
  basename(process.argv[1]) === "forge-hashline.mjs"
);
if (isMain) main();
