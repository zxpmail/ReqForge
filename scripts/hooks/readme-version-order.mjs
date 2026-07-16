#!/usr/bin/env node
/**
 * README version descending-order check (shared by pre-commit-check.sh/.bat).
 *
 * Scans README.md / README.zh-CN.md for `### vX.Y.Z` headings (first 10).
 * Fails (exit 2) if a newer version appears after an older one (must be newest-first).
 *
 * Root: CLAUDE_PROJECT_DIR or cwd.
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let fail = 0;

function parseVer(s) {
  return s.split(".").map((n) => parseInt(n, 10));
}

/** true if a > b (semver major.minor.patch) */
function greater(a, b) {
  const A = parseVer(a);
  const B = parseVer(b);
  for (let i = 0; i < 3; i++) {
    if ((A[i] || 0) > (B[i] || 0)) return true;
    if ((A[i] || 0) < (B[i] || 0)) return false;
  }
  return false;
}

for (const name of ["README.md", "README.zh-CN.md"]) {
  const file = join(root, name);
  if (!existsSync(file)) continue;
  const text = readFileSync(file, "utf-8");
  const versions = [...text.matchAll(/^### v(\d+\.\d+\.\d+)/gm)].map((m) => m[1]).slice(0, 10);
  if (versions.length === 0) continue;
  let prev = "";
  for (const v of versions) {
    if (prev && greater(v, prev)) {
      console.error(
        `ERROR: README version order wrong in ${name}: ${v} comes before ${prev} (should be newest first)`,
      );
      fail = 1;
    }
    prev = v;
  }
}

process.exit(fail ? 2 : 0);
