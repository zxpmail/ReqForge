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
 *
 * Options:
 *   --lines N:M     Line range (1-based, inclusive)
 *   --new-string    New content (inline)
 *   --from <file>   New content (from file)
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

Options:
  --lines N:M     Line range (1-based, inclusive)
  --new-string    New content (inline)
  --from <file>   New content (from file)
  --root <dir>    Project root (default: repo root)
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

  console.error(`Unknown command: ${cmd}`);
  printHelp();
  process.exit(1);
}

const isMain = process.argv[1] && (
  basename(process.argv[1]) === "forge-hashline.mjs"
);
if (isMain) main();
