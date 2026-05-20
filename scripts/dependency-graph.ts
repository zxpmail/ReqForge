/**
 * Forge Dependency Graph
 *
 * File-level dependency graph for blast-radius analysis.
 * Scans source files, extracts imports, builds a file-level DAG.
 *
 * Usage:
 *   pnpm dep-graph build               # Build or rebuild the graph
 *   pnpm dep-graph affected [files...] # Blast-radius query (git diff if no files given)
 *   pnpm dep-graph risk [files...]     # Risk score for changes
 *   pnpm dep-graph stats               # Graph statistics
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// --- Types ---

export interface GraphNode {
  imports: string[];
  importedBy: string[];
}

export interface DependencyGraph {
  version: number;
  root: string;
  nodes: Record<string, GraphNode>;
  stats: {
    totalFiles: number;
    totalEdges: number;
    languages: string[];
    buildTimeMs: number;
  };
}

// --- Constants ---

const GRAPH_FILE = ".forge/graph.json";

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", ".nuxt",
  "__pycache__", "target", "vendor", ".venv", "venv", "env",
  ".tox", "eggs", "wildcards",
]);

const EXT_TO_LANG: Record<string, string> = {
  ".ts": "typescript", ".tsx": "typescript",
  ".js": "javascript", ".jsx": "javascript", ".mjs": "javascript", ".cjs": "javascript",
  ".py": "python",
  ".go": "go",
  ".rs": "rust",
  ".java": "java",
  ".cs": "csharp",
  ".rb": "ruby",
  ".kt": "kotlin",
  ".swift": "swift",
  ".php": "php",
};

/** Ordered extensions to try when resolving a module path to a file */
const RESOLVE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs"];

// --- Import regex patterns per language ---

const IMPORT_PATTERNS: Record<string, RegExp[]> = {
  typescript: [
    /import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /export\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /(?:const|let|var)\s+\w+\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ],
  javascript: [
    /import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /export\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /(?:const|let|var)\s+\w+\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ],
  python: [
    /^from\s+([\w.]+)\s+import/gm,
    /^import\s+([\w.]+)/gm,
  ],
  go: [
    /import\s+\(([\s\S]*?)\)/g,
    /^import\s+(?:\w+\s+)?"([^"]+)"/gm,
  ],
};

// --- File discovery ---

function findSourceFiles(rootDir: string): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".")) walk(fullPath);
      } else if (entry.isFile()) {
        if (EXT_TO_LANG[path.extname(entry.name)]) files.push(fullPath);
      }
    }
  };
  walk(rootDir);
  return files;
}

// --- Import extraction and resolution ---

function readFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Resolve an import path to an actual file in the project.
 * Returns the resolved path or null if it's a bare import (npm package) or unresolvable.
 */
export function resolveImport(fromFile: string, importPath: string, rootDir: string, allFiles: Set<string>): string | null {
  if (!importPath.startsWith(".") && !path.isAbsolute(importPath)) return null; // bare import

  const resolved = path.isAbsolute(importPath)
    ? path.join(rootDir, importPath)
    : path.resolve(path.dirname(fromFile), importPath);

  // Try exact match
  if (allFiles.has(resolved)) return resolved;

  // Try with each extension
  for (const ext of RESOLVE_EXTENSIONS) {
    const candidate = resolved + ext;
    if (allFiles.has(candidate)) return candidate;
  }

  // Try /index.<ext>
  for (const ext of RESOLVE_EXTENSIONS) {
    const candidate = path.join(resolved, "index" + ext);
    if (allFiles.has(candidate)) return candidate;
  }

  return null;
}

function extractImports(filePath: string, content: string, rootDir: string, allFiles: Set<string>): string[] {
  const ext = path.extname(filePath);
  const lang = EXT_TO_LANG[ext];
  const patterns = IMPORT_PATTERNS[lang];
  if (!patterns) return [];

  const resolvedSet = new Set<string>();
  const seen = new Set<string>();

  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, pattern.flags);

    // Special handling for Go multi-import blocks
    if (lang === "go" && ext === ".go" && pattern.source.includes("import\\s+\\(([\\s\\S]*?)\\)")) {
      const blockMatch = re.exec(content);
      if (blockMatch?.[1]) {
        for (const line of blockMatch[1].split("\n")) {
          const m = line.match(/"([^"]+)"/);
          if (m && !seen.has(m[1])) {
            seen.add(m[1]);
            const r = resolveImport(filePath, m[1], rootDir, allFiles);
            if (r) resolvedSet.add(r);
          }
        }
      }
      continue;
    }

    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      const importStr = match[1];
      if (!importStr || seen.has(importStr)) continue;
      seen.add(importStr);
      const r = resolveImport(filePath, importStr, rootDir, allFiles);
      if (r) resolvedSet.add(r);
    }
  }

  return [...resolvedSet];
}

// --- Graph building ---

export function buildGraph(rootDir: string): DependencyGraph {
  const start = Date.now();

  const absFiles = findSourceFiles(rootDir);
  const fileSet = new Set(absFiles);
  const langSet = new Set<string>();

  // Normalise to relative paths from rootDir
  const nodes: Record<string, GraphNode> = {};
  for (const f of absFiles) {
    const rel = path.relative(rootDir, f);
    const lang = EXT_TO_LANG[path.extname(f)];
    if (lang) langSet.add(lang);
    nodes[rel] = { imports: [], importedBy: [] };
  }

  // Extract imports — first pass builds forward edges
  for (const f of absFiles) {
    const rel = path.relative(rootDir, f);
    const content = readFile(f);
    if (!content) continue;

    const deps = extractImports(f, content, rootDir, fileSet);
    nodes[rel].imports = deps.map(d => path.relative(rootDir, d));
  }

  // Second pass builds reverse edges
  for (const [rel, node] of Object.entries(nodes)) {
    for (const dep of node.imports) {
      if (nodes[dep]) nodes[dep].importedBy.push(rel);
    }
  }

  let edgeCount = 0;
  for (const n of Object.values(nodes)) edgeCount += n.imports.length;

  return {
    version: 1,
    root: rootDir,
    nodes,
    stats: {
      totalFiles: Object.keys(nodes).length,
      totalEdges: edgeCount,
      languages: [...langSet].sort(),
      buildTimeMs: Date.now() - start,
    },
  };
}

// --- Query ---

/**
 * BFS from changed files through reverse edges (importedBy) to find all
 * transitively affected files up to `maxDepth`.
 */
export function affectedFiles(graph: DependencyGraph, changed: string[], maxDepth = 3): string[] {
  const result = new Set<string>();
  const queue: Array<{ file: string; depth: number }> = changed.map(f => ({ file: f, depth: 0 }));

  while (queue.length > 0) {
    const { file, depth } = queue.shift()!;
    if (depth >= maxDepth) continue;

    const node = graph.nodes[file];
    if (!node) continue;

    for (const dep of node.importedBy) {
      if (result.has(dep)) continue;
      result.add(dep);
      queue.push({ file: dep, depth: depth + 1 });
    }
  }

  return [...result].sort();
}

export interface RiskResult {
  score: number;
  level: "low" | "medium" | "high";
  details: Record<string, { centrality: number; affected: number }>;
}

/**
 * Risk score = Σ centrality(importedBy) * affectedDescendants for each changed file.
 * Heuristic thresholds: low ≤ 5, medium ≤ 20, high > 20.
 */
export function riskScore(graph: DependencyGraph, changed: string[]): RiskResult {
  let total = 0;
  const details: RiskResult["details"] = {};

  for (const file of changed) {
    const node = graph.nodes[file];
    if (!node) continue;

    const centrality = node.importedBy.length;
    const aff = affectedFiles(graph, [file]).length;
    const score = centrality * Math.max(aff, 1);
    total += score;
    details[file] = { centrality, affected: aff };
  }

  const level = total > 20 ? "high" : total > 5 ? "medium" : "low";
  return { score: total, level, details };
}

// --- Persistence ---

function graphPath(rootDir: string) {
  return path.join(rootDir, GRAPH_FILE);
}

function saveGraph(g: DependencyGraph, rootDir: string): void {
  const fp = graphPath(rootDir);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, JSON.stringify(g, null, 2));
}

function loadGraph(rootDir: string): DependencyGraph | null {
  try {
    return JSON.parse(fs.readFileSync(graphPath(rootDir), "utf-8"));
  } catch {
    return null;
  }
}

// --- CLI helpers ---

function getGitChanged(rootDir: string): string[] {
  try {
    const out = execSync("git diff --name-only HEAD --diff-filter=ACMR", {
      cwd: rootDir,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return out ? out.split("\n").filter(Boolean) : [];
  } catch {
    return [];
  }
}

// --- CLI ---

function main(): void {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const cwd = process.cwd();

  switch (cmd) {
    case "build": {
      console.log("🔍 Building dependency graph...");
      const g = buildGraph(cwd);
      saveGraph(g, cwd);
      console.log(`   ${g.stats.totalFiles} files, ${g.stats.totalEdges} edges, ${g.stats.languages.join(", ")} (${g.stats.buildTimeMs}ms)`);
      break;
    }

    case "affected": {
      const g = loadGraph(cwd);
      if (!g) { console.error("No graph found — run 'pnpm dep-graph build' first"); process.exit(1); }

      const files = args[1] ? args.slice(1) : getGitChanged(cwd);
      if (!files.length) { console.log("No files specified and no uncommitted changes."); return; }

      const aff = affectedFiles(g, files);
      if (!aff.length) { console.log("No affected files."); return; }
      console.log(`Affected files (${aff.length}):`);
      aff.forEach(f => console.log(`  ${f}`));
      break;
    }

    case "risk": {
      const g = loadGraph(cwd);
      if (!g) { console.error("No graph found — run 'pnpm dep-graph build' first"); process.exit(1); }

      const files = args[1] ? args.slice(1) : getGitChanged(cwd);
      if (!files.length) { console.log("No files specified and no uncommitted changes."); return; }

      const r = riskScore(g, files);
      console.log(`Risk score: ${r.score} (${r.level})`);
      for (const [f, d] of Object.entries(r.details)) {
        console.log(`  ${f}: centrality=${d.centrality}, affected_descendants=${d.affected}`);
      }
      break;
    }

    case "stats": {
      const g = loadGraph(cwd);
      if (!g) { console.error("No graph found — run 'pnpm dep-graph build' first"); process.exit(1); }
      console.log(`Files:     ${g.stats.totalFiles}`);
      console.log(`Edges:     ${g.stats.totalEdges}`);
      console.log(`Languages: ${g.stats.languages.join(", ")}`);
      console.log(`Build:     ${g.stats.buildTimeMs}ms`);
      console.log(`Root:      ${g.root}`);
      break;
    }

    default:
      console.log(`
Usage:
  pnpm dep-graph build                Build dependency graph
  pnpm dep-graph affected [files...]  Blast-radius (git diff if no files given)
  pnpm dep-graph risk [files...]      Risk score
  pnpm dep-graph stats                Graph statistics
`);
  }
}

if (require.main === module) {
  main();
}
