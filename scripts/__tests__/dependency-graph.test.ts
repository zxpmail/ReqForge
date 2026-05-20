import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  affectedFiles,
  buildGraph,
  type DependencyGraph,
  resolveImport,
  riskScore,
} from "../dependency-graph";

function node(graph: DependencyGraph, posixPath: string) {
  const key = Object.keys(graph.nodes).find(
    (k) => k.replace(/\\/g, "/") === posixPath,
  );
  if (!key) {
    throw new Error(`missing node ${posixPath}, got: ${Object.keys(graph.nodes).join(", ")}`);
  }
  return graph.nodes[key];
}

function writeProject(root: string, files: Record<string, string>): void {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
}

describe("resolveImport", () => {
  it("resolves relative imports with extensions", () => {
    const root = path.join(os.tmpdir(), "reqforge-resolve");
    const a = path.join(root, "a.ts");
    const b = path.join(root, "b.ts");
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(a, "");
    fs.writeFileSync(b, "");
    const all = new Set([a, b]);

    expect(resolveImport(a, "./b", root, all)).toBe(b);
    expect(resolveImport(a, "lodash", root, all)).toBeNull();
  });
});

describe("buildGraph", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reqforge-graph-"));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("builds import and reverse edges", () => {
    writeProject(tmp, {
      "lib/b.ts": "export const b = 1;\n",
      "lib/a.ts": 'import { b } from "./b";\nexport const a = b;\n',
      "app/c.ts": 'import { a } from "../lib/a";\nexport const c = a;\n',
    });

    const graph = buildGraph(tmp);

    expect(node(graph, "lib/a.ts").imports.map((p) => p.replace(/\\/g, "/"))).toContain("lib/b.ts");
    expect(node(graph, "lib/b.ts").importedBy.map((p) => p.replace(/\\/g, "/"))).toContain("lib/a.ts");
    expect(node(graph, "app/c.ts").imports.map((p) => p.replace(/\\/g, "/"))).toContain("lib/a.ts");
    expect(node(graph, "lib/a.ts").importedBy.map((p) => p.replace(/\\/g, "/"))).toContain("app/c.ts");
    expect(graph.stats.totalFiles).toBe(3);
    expect(graph.stats.languages).toContain("typescript");
  });
});

describe("affectedFiles", () => {
  it("returns transitive dependents via importedBy", () => {
    const graph = {
      version: 1,
      root: "/tmp",
      nodes: {
        "a.ts": { imports: [], importedBy: ["b.ts", "c.ts"] },
        "b.ts": { imports: ["a.ts"], importedBy: ["c.ts"] },
        "c.ts": { imports: ["a.ts", "b.ts"], importedBy: [] },
        "d.ts": { imports: [], importedBy: [] },
      },
      stats: { totalFiles: 4, totalEdges: 2, languages: ["typescript"], buildTimeMs: 0 },
    };

    expect(affectedFiles(graph, ["a.ts"])).toEqual(["b.ts", "c.ts"]);
    expect(affectedFiles(graph, ["d.ts"])).toEqual([]);
  });

  it("respects maxDepth", () => {
    const graph = {
      version: 1,
      root: "/tmp",
      nodes: {
        "a.ts": { imports: [], importedBy: ["b.ts"] },
        "b.ts": { imports: ["a.ts"], importedBy: ["c.ts"] },
        "c.ts": { imports: ["b.ts"], importedBy: [] },
      },
      stats: { totalFiles: 3, totalEdges: 2, languages: ["typescript"], buildTimeMs: 0 },
    };

    expect(affectedFiles(graph, ["a.ts"], 1)).toEqual(["b.ts"]);
  });
});

describe("riskScore", () => {
  it("scores higher when more files depend on a change", () => {
    const graph = {
      version: 1,
      root: "/tmp",
      nodes: {
        "core.ts": { imports: [], importedBy: ["a.ts", "b.ts", "c.ts"] },
        "a.ts": { imports: ["core.ts"], importedBy: [] },
        "b.ts": { imports: ["core.ts"], importedBy: [] },
        "c.ts": { imports: ["core.ts"], importedBy: [] },
        "leaf.ts": { imports: [], importedBy: [] },
      },
      stats: { totalFiles: 5, totalEdges: 3, languages: ["typescript"], buildTimeMs: 0 },
    };

    const high = riskScore(graph, ["core.ts"]);
    const low = riskScore(graph, ["leaf.ts"]);

    expect(high.score).toBeGreaterThan(low.score);
    expect(high.level).not.toBe("low");
    expect(low.level).toBe("low");
  });
});
