#!/usr/bin/env node
/**
 * forge-coverage.mjs — Test coverage gap detection and stub generation
 *
 * Scans a project for test coverage gaps using vitest coverage output
 * or naming-convention fallback. Generates test stubs for uncovered files.
 * Cross-references with forge-step-capture traces to prioritize failure hotspots.
 *
 * CLI:
 *   node scripts/forge-coverage.mjs scan [--dir <project-dir>]
 *   node scripts/forge-coverage.mjs report [--dir <project-dir>] [--json]
 *   node scripts/forge-coverage.mjs generate-stubs [--dir <project-dir>] [--target <dir>]
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, dirname, basename, relative } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..");

// ─── Coverage Scanning ────────────────────────────────────────────

/**
 * Scan a project for test coverage data.
 * Tries vitest coverage JSON first, falls back to naming convention.
 *
 * @param {string} projectDir
 * @returns {{ files: object[], summary: object, method: string }}
 */
export function scan(projectDir) {
  const absDir = projectDir.startsWith("/") || projectDir.match(/^[A-Z]:\\/)
    ? projectDir
    : join(process.cwd(), projectDir);

  // Try 1: vitest coverage JSON
  const coveragePath = join(absDir, "coverage", "coverage-summary.json");
  if (existsSync(coveragePath)) {
    return parseCoverageJson(coveragePath, absDir);
  }

  // Try 2: Run vitest with coverage
  if (hasVitest(absDir)) {
    try {
      runVitestCoverage(absDir);
      if (existsSync(coveragePath)) {
        return parseCoverageJson(coveragePath, absDir);
      }
    } catch {
      // Coverage run failed — fall through
    }
  }

  // Try 3: Naming convention fallback
  return namingConventionScan(absDir);
}

function hasVitest(dir) {
  const pkgPath = join(dir, "package.json");
  if (!existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    return !!deps.vitest;
  } catch {
    return false;
  }
}

function runVitestCoverage(dir) {
  execSync(
    "npx vitest run --coverage.enabled --coverage.reporter=json-summary --coverage.reporter=json",
    { cwd: dir, encoding: "utf-8", timeout: 120000, stdio: "pipe" }
  );
}

function parseCoverageJson(coveragePath, projectDir) {
  const raw = JSON.parse(readFileSync(coveragePath, "utf-8"));
  const files = [];

  for (const [filePath, data] of Object.entries(raw)) {
    if (filePath === "total") continue;
    const relPath = relative(projectDir, filePath).replace(/\\/g, "/");
    files.push({
      path: relPath,
      statements: data.statements?.pct ?? 0,
      branches: data.branches?.pct ?? 0,
      functions: data.functions?.pct ?? 0,
      lines: data.lines?.pct ?? 0,
      uncoveredLines: extractUncoveredLines(data),
    });
  }

  const total = raw.total || {};
  return {
    files,
    summary: {
      statements: total.statements?.pct ?? 0,
      branches: total.branches?.pct ?? 0,
      functions: total.functions?.pct ?? 0,
      lines: total.lines?.pct ?? 0,
    },
    method: "vitest-coverage",
  };
}

function extractUncoveredLines(data) {
  // Istambul JSON stores line coverage as { "1": 1, "2": 0, "3": 1 }
  // Lines with 0 hits are uncovered
  const lineData = data.lines?.data || {};
  return Object.entries(lineData)
    .filter(([, hits]) => hits === 0)
    .map(([line]) => parseInt(line, 10))
    .filter(n => !isNaN(n));
}

function namingConventionScan(projectDir) {
  const srcDir = join(projectDir, "src");
  if (!existsSync(srcDir)) {
    return { files: [], summary: {}, method: "naming-convention" };
  }

  const srcFiles = listSourceFiles(srcDir, projectDir);
  const testFiles = listTestFiles(srcDir);

  const files = srcFiles.map(relPath => {
    const base = relPath.replace(/\.\w+$/, "");
    const fileName = basename(relPath).replace(/\.\w+$/, "");
    const hasTest = testFiles.some(t =>
      t.includes(fileName + ".test.") || t.includes(fileName + ".spec.") || t.includes("test_" + fileName) ||
      t.includes(base + ".test.") || t.includes(base + ".spec.")
    );
    return {
      path: relPath,
      hasTest,
      statements: hasTest ? -1 : 0, // -1 = has test but no coverage data
      branches: hasTest ? -1 : 0,
      functions: hasTest ? -1 : 0,
      lines: hasTest ? -1 : 0,
      uncoveredLines: [],
    };
  });

  const total = files.length;
  const withTests = files.filter(f => f.hasTest).length;

  return {
    files,
    summary: {
      total,
      withTests,
      withoutTests: total - withTests,
      estimatedCoverage: total > 0 ? Math.round((withTests / total) * 100) : 0,
    },
    method: "naming-convention",
  };
}

function listSourceFiles(dir, projectDir) {
  const results = [];
  function walk(d) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "__tests__" && entry.name !== "node_modules" && entry.name !== "dist") {
          walk(full);
        }
      } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name) && !entry.name.includes(".test.") && !entry.name.includes(".spec.")) {
        results.push(relative(projectDir, full).replace(/\\/g, "/"));
      }
    }
  }
  walk(dir);
  return results;
}

function listTestFiles(dir) {
  const results = [];
  function walk(d) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.includes(".test.") || entry.name.includes(".spec.") || entry.name.startsWith("test_")) {
        results.push(relative(dir, full).replace(/\\/g, "/"));
      }
    }
  }
  walk(dir);
  return results;
}

// ─── Coverage Report ──────────────────────────────────────────────

/**
 * Generate a coverage gap report, optionally cross-referencing with step traces.
 *
 * @param {string} projectDir
 * @param {object} [opts]
 * @param {string} [opts.tracesPath] - path to step-traces.jsonl for failure hotspot detection
 * @returns {{ wellCovered: object[], partial: object[], uncovered: object[], failureHotspots: object[] }}
 */
export function report(projectDir, opts = {}) {
  const scanResult = scan(projectDir);
  const wellCovered = [];
  const partial = [];
  const uncovered = [];
  const failureHotspots = [];

  // Load trace data for failure hotspot detection
  const failureFiles = opts.tracesPath ? getFailureFiles(opts.tracesPath) : new Map();

  for (const file of scanResult.files) {
    const isFailure = failureFiles.has(file.path);

    if (scanResult.method === "naming-convention") {
      if (!file.hasTest) {
        if (isFailure) {
          failureHotspots.push({ ...file, failureCount: failureFiles.get(file.path) });
        } else {
          uncovered.push(file);
        }
      } else {
        wellCovered.push(file);
      }
      continue;
    }

    // vitest coverage method
    const avg = (file.statements + file.branches + file.functions + file.lines) / 4;

    if (isFailure) {
      failureHotspots.push({ ...file, failureCount: failureFiles.get(file.path) });
    } else if (avg >= 80) {
      wellCovered.push(file);
    } else if (avg >= 50) {
      partial.push(file);
    } else {
      uncovered.push(file);
    }
  }

  return { wellCovered, partial, uncovered, failureHotspots, method: scanResult.method, summary: scanResult.summary };
}

function getFailureFiles(tracesPath) {
  if (!existsSync(tracesPath)) return new Map();

  const traces = readFileSync(tracesPath, "utf-8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(line => {
      try { return JSON.parse(line); }
      catch { return null; }
    })
    .filter(t => t && t.type === "step_record" && t.status === "fail" && t.step === "test");

  const fileCounts = new Map();
  for (const t of traces) {
    const files = t.failure?.filesChanged || t.context?.filesChanged || [];
    for (const f of files) {
      fileCounts.set(f, (fileCounts.get(f) || 0) + 1);
    }
  }
  // If no specific files, mark all as failure-associated
  if (fileCounts.size === 0 && traces.length > 0) {
    // Can't determine specific files from traces alone
  }
  return fileCounts;
}

// ─── Test Stub Generation ─────────────────────────────────────────

const EXPORT_RE = /export\s+(?:function|class|const|let|var|async\s+function)\s+(\w+)/g;

/**
 * Generate test file stubs for uncovered source files.
 *
 * @param {string} projectDir
 * @param {string} [targetDir] - where to write stubs (default: src/__tests__/)
 * @returns {{ generated: object[] }}
 */
export function generateStubs(projectDir, targetDir) {
  const absDir = projectDir.startsWith("/") || projectDir.match(/^[A-Z]:\\/)
    ? projectDir
    : join(process.cwd(), projectDir);

  const gapReport = report(absDir);
  const toGenerate = [...gapReport.uncovered, ...gapReport.failureHotspots];
  const generated = [];

  for (const file of toGenerate) {
    if (file.path.includes("__tests__") || file.path.includes(".test.") || file.path.includes(".spec.")) {
      continue;
    }

    const srcPath = join(absDir, file.path);
    if (!existsSync(srcPath)) continue;

    const content = readFileSync(srcPath, "utf-8");
    const exports = extractExports(content);
    if (exports.length === 0) continue;

    const stub = buildTestStub(file.path, exports);
    const testDir = targetDir || join(absDir, "src", "__tests__");
    const testFileName = basename(file.path).replace(/\.\w+$/, ".test.ts");
    const testPath = join(testDir, testFileName);

    generated.push({
      src: file.path,
      test: testPath,
      exports,
    });

    // Write the stub
    mkdirSync(testDir, { recursive: true });
    if (!existsSync(testPath)) {
      writeFileSync(testPath, stub, "utf-8");
    }
  }

  return { generated };
}

function extractExports(content) {
  const names = [];
  let match;
  EXPORT_RE.lastIndex = 0;
  while ((match = EXPORT_RE.exec(content)) !== null) {
    names.push(match[1]);
  }
  return names;
}

function buildTestStub(srcPath, exports) {
  const importPath = "../" + basename(srcPath).replace(/\.\w+$/, "");
  const lines = [
    `import { ${exports.join(", ")} } from "${importPath}";`,
    `import { describe, it, expect } from "vitest";`,
    "",
  ];

  for (const name of exports) {
    lines.push(`describe("${name}", () => {`);
    lines.push(`  it("should work", () => {`);
    lines.push(`    // TODO: implement test for ${name}`);
    lines.push(`    expect(true).toBe(true);`);
    lines.push(`  });`);
    lines.push("});");
    lines.push("");
  }

  return lines.join("\n");
}

// ─── CLI ──────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
forge-coverage — Test coverage gap detection and stub generation

Usage:
  scan [--dir <project-dir>]
    Scan project for test coverage data

  report [--dir <project-dir>] [--json] [--traces <path>]
    Generate coverage gap report with priority ordering

  generate-stubs [--dir <project-dir>] [--target <dir>]
    Generate test file stubs for uncovered source files

Options:
  --dir <dir>       Project directory (default: current)
  --target <dir>    Target directory for generated stubs
  --traces <path>   Step traces JSONL for failure hotspot detection
  --json            Output as JSON
  --root <dir>      Repo root (default: script parent)
  --help, -h        Show this help
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  const cmd = args[0];

  const kv = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      const val = (args[i + 1] && !args[i + 1].startsWith("--")) ? args[++i] : "true";
      kv[key] = val;
    }
  }

  const projectDir = kv.dir || ".";

  switch (cmd) {
    case "scan": {
      try {
        const result = scan(projectDir);
        if (kv.json === "true") {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`\n=== Coverage Scan (${result.method}) ===\n`);
          if (result.summary.statements !== undefined) {
            console.log(`Statements: ${result.summary.statements}%`);
            console.log(`Branches:   ${result.summary.branches}%`);
            console.log(`Functions:  ${result.summary.functions}%`);
            console.log(`Lines:      ${result.summary.lines}%`);
          } else if (result.summary.total !== undefined) {
            console.log(`Source files:  ${result.summary.total}`);
            console.log(`With tests:    ${result.summary.withTests}`);
            console.log(`Without tests: ${result.summary.withoutTests}`);
            console.log(`Est. coverage: ${result.summary.estimatedCoverage}%`);
          }
          console.log(`\nFiles (${result.files.length}):`);
          for (const f of result.files.slice(0, 20)) {
            const avg = f.statements >= 0
              ? `avg: ${Math.round((f.statements + f.branches + f.functions + f.lines) / 4)}%`
              : (f.hasTest ? "has test" : "NO TEST");
            console.log(`  ${f.path} — ${avg}`);
          }
          if (result.files.length > 20) {
            console.log(`  ... and ${result.files.length - 20} more`);
          }
        }
      } catch (e) {
        console.error(e.message);
        process.exit(1);
      }
      break;
    }
    case "report": {
      const opts = {};
      if (kv.traces) opts.tracesPath = kv.traces;
      try {
        const result = report(projectDir, opts);
        if (kv.json === "true") {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`\n=== Coverage Gap Report (${result.method}) ===\n`);
          if (result.failureHotspots.length > 0) {
            console.log(`Failure Hotspots (${result.failureHotspots.length}):`);
            for (const f of result.failureHotspots) {
              console.log(`  🔴 ${f.path} (failures: ${f.failureCount})`);
            }
            console.log();
          }
          if (result.uncovered.length > 0) {
            console.log(`Uncovered (${result.uncovered.length}):`);
            for (const f of result.uncovered) {
              console.log(`  ⬜ ${f.path}`);
            }
            console.log();
          }
          if (result.partial.length > 0) {
            console.log(`Partial (${result.partial.length}):`);
            for (const f of result.partial) {
              console.log(`  🟡 ${f.path}`);
            }
            console.log();
          }
          if (result.wellCovered.length > 0) {
            console.log(`Well-covered (${result.wellCovered.length}):`);
            for (const f of result.wellCovered) {
              console.log(`  🟢 ${f.path}`);
            }
          }
        }
      } catch (e) {
        console.error(e.message);
        process.exit(1);
      }
      break;
    }
    case "generate-stubs": {
      const targetDir = kv.target || null;
      try {
        const result = generateStubs(projectDir, targetDir);
        if (result.generated.length === 0) {
          console.log("No uncovered files with exports found. All source files have tests.");
        } else {
          console.log(`\nGenerated ${result.generated.length} test stub(s):\n`);
          for (const g of result.generated) {
            console.log(`  ${g.src} → ${g.test}`);
            console.log(`    exports: ${g.exports.join(", ")}`);
          }
        }
      } catch (e) {
        console.error(e.message);
        process.exit(1);
      }
      break;
    }
    default:
      console.error(`Unknown command: ${cmd}`);
      printHelp();
      process.exit(1);
  }
}

if (process.argv[1] && (process.argv[1].endsWith("forge-coverage.mjs") || process.argv[1].endsWith("forge-coverage"))) {
  main();
}
