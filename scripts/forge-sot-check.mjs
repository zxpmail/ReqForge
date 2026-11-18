#!/usr/bin/env node
/**
 * forge-sot-check.mjs — SoT 注册表检查（Source of Truth / Non-Negotiable Layer）
 *
 * memory/sot-registry.md 记录每个业务概念的权威实现位置与语义契约。
 * 模型生成新函数前必须查询本表：已有实现 → 复用，或显式提出
 * 「为什么现有实现不满足」；重复实现必须是 .forge/sot-exceptions.json
 * 中人类批准的例外。新增/修改注册表条目 = 人类批准的 PR（模型只能提议）。
 *
 * 检查项：
 *   1. 条目形状 — id 唯一、canonical/contract/signal/lastVerified/status 齐全、signal 可编译
 *   2. canonical 存在 — active 条目必须指向真实文件/目录（注册表不得撒谎）
 *   3. 陈旧 — lastVerified 超过 staleDays（默认 180）→ 需人类重新核验
 *   4. 重复实现 — 代码中出现某 active 条目的 signal，且不在其 canonical、
 *      不在人类批准的例外中 → FAIL
 *   5. 例外完整性 — sot-exceptions.json 条目必须带 approvedBy（人类批准）
 *
 * 残差（诚实声明）：例外与注册表同仓可写 —— 同信任域内 approvedBy 可被伪造。
 * 生产防线是 branch protection / required check（见 .forge/POLICY-WITNESS.md）。
 *
 * 用法：
 *   node scripts/forge-sot-check.mjs check [--root <dir>] [--stale-days N] [--json]
 *   node scripts/forge-sot-check.mjs list  [--root <dir>]
 */

import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { pathToFileURL } from "url";

export const REGISTRY_REL = "memory/sot-registry.md";
export const EXCEPTIONS_REL = ".forge/sot-exceptions.json";
export const DEFAULT_STALE_DAYS = 180;

const CODE_EXTS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".mts", ".cts",
  ".py", ".rb", ".go", ".java", ".rs", ".php", ".cs", ".kt", ".swift", ".scala",
]);
const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "coverage", "out",
  ".next", ".nuxt", ".turbo", ".cache", ".forge", ".svelte-kit", "vendor",
]);
const TEST_FILE_RE = /\.(test|spec|e2e)\.[^.]+$/;

/**
 * 解析注册表 markdown。
 * 条目格式：
 *   ### SOT-001 · 标题
 *   - **canonical**: `path/to/file.ts`
 *   - **contract**: 语义契约……
 *   - **signal**: 实现指纹正则
 *   - **lastVerified**: 2026-11-18
 *   - **status**: active | superseded | deprecated
 * HTML 注释（含模板示例）整体剥离。
 */
export function parseRegistry(markdown) {
  const text = markdown.replace(/<!--[\s\S]*?-->/g, "");
  const entries = [];
  const issues = [];
  let current = null;
  let order = 0;
  const FIELD_MAP = {
    canonical: "canonical",
    contract: "contract",
    signal: "signal",
    lastverified: "lastVerified",
    status: "status",
  };

  const flush = () => {
    if (!current) return;
    const e = current;
    const missing = ["canonical", "contract", "signal", "lastVerified", "status"]
      .filter((f) => !e[f]);
    if (missing.length > 0) {
      issues.push(`${e.id || `entry#${order}`}: missing field(s) ${missing.join(", ")}`);
    }
    entries.push(e);
    current = null;
  };

  for (const line of text.split("\n")) {
    const h = line.match(/^###\s+(SOT-\d+)\s*[·:：—–-]\s*(.+?)\s*$/);
    if (h) {
      flush();
      order++;
      current = { id: h[1], title: h[2], canonical: "", contract: "", signal: "", lastVerified: "", status: "" };
      continue;
    }
    if (/^##\s+/.test(line)) { flush(); continue; }
    if (!current) continue;
    const f = line.match(/^-\s*\*\*([A-Za-z]+)\*\*:\s*(.+?)\s*$/);
    if (f) {
      const key = FIELD_MAP[f[1].toLowerCase()];
      if (key) current[key] = f[2].replace(/`/g, "").trim();
    }
  }
  flush();
  return { entries, issues };
}

/** 条目形状 + 陈旧 + canonical 存在性（纯函数，注入 exists/now） */
export function validateEntries(entries, { exists = () => true, now = new Date(), staleDays = DEFAULT_STALE_DAYS } = {}) {
  const issues = [];
  const seen = new Set();
  const STATUSES = new Set(["active", "superseded", "deprecated"]);

  for (const e of entries) {
    const id = (e.id || "").toLowerCase();
    if (seen.has(id)) issues.push(`${e.id}: duplicate id`);
    seen.add(id);

    if (e.status && !STATUSES.has(e.status)) {
      issues.push(`${e.id}: invalid status '${e.status}' (active|superseded|deprecated)`);
    }
    if (e.status !== "active") continue;

    if (e.canonical && !exists(e.canonical)) {
      issues.push(`${e.id}: canonical '${e.canonical}' does not exist (registry must point at a real implementation)`);
    }
    if (e.contract && e.contract.length < 10) {
      issues.push(`${e.id}: contract too short — state the semantic contract, not a label`);
    }
    if (e.signal) {
      try { new RegExp(e.signal); }
      catch (err) { issues.push(`${e.id}: signal is not a valid regex: ${err.message}`); }
    }
    const d = Date.parse(e.lastVerified || "");
    if (Number.isNaN(d)) {
      issues.push(`${e.id}: lastVerified is not a parseable date (YYYY-MM-DD)`);
    } else {
      const ageDays = (now.getTime() - d) / 86400000;
      if (ageDays > staleDays) {
        issues.push(`${e.id}: lastVerified is ${Math.floor(ageDays)} days old (> ${staleDays}) — human re-verification required`);
      }
      if (ageDays < -1) {
        issues.push(`${e.id}: lastVerified is in the future`);
      }
    }
  }
  return issues;
}

/**
 * 重复实现检测（纯函数）。
 * @param {Array<{path: string, content: string}>} files 扫描到的源文件
 * @param {Array} entries 注册表条目
 * @param {Array} exceptions 人类批准的例外
 */
export function findSuspects(files, entries, exceptions = []) {
  const suspects = [];
  const active = entries.filter((e) => e.status === "active" && e.signal);

  for (const entry of active) {
    let re;
    try { re = new RegExp(entry.signal); } catch { continue; }
    for (const f of files) {
      if (f.path === entry.canonical) continue;
      if (!re.test(f.content)) continue;
      const approved = exceptions.find(
        (x) => x.file === f.path && x.sot === entry.id && x.approvedBy,
      );
      if (approved) continue;
      suspects.push({ file: f.path, sot: entry.id, title: entry.title });
    }
  }
  // 去重（同一文件命中多条 signal 只报一次/条目）
  const seen = new Set();
  return suspects.filter((s) => {
    const k = `${s.sot}::${s.file}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** 扫描源文件（跳过依赖/产物/测试文件） */
export function scanSourceFiles(root) {
  const files = [];
  const walk = (dir) => {
    let names;
    try { names = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const ent of names) {
      if (ent.name.startsWith(".") && ent.name !== ".") continue;
      const abs = join(dir, ent.name);
      if (ent.isDirectory()) {
        if (SKIP_DIRS.has(ent.name)) continue;
        walk(abs);
      } else if (ent.isFile()) {
        const dot = ent.name.lastIndexOf(".");
        const ext = dot >= 0 ? ent.name.slice(dot).toLowerCase() : "";
        if (!CODE_EXTS.has(ext)) continue;
        if (TEST_FILE_RE.test(ent.name)) continue;
        const rel = relative(root, abs).replace(/\\/g, "/");
        try {
          const stat = statSync(abs);
          if (stat.size > 1024 * 1024) continue; // >1MB 跳过
          files.push({ path: rel, content: readFileSync(abs, "utf-8") });
        } catch { /* unreadable → skip */ }
      }
    }
  };
  walk(root);
  return files;
}

/** 人类批准的例外；文件缺失 → []；损坏 → throw（例外坏了不能静默放行） */
export function loadExceptions(root) {
  const file = join(root, EXCEPTIONS_REL);
  if (!existsSync(file)) return [];
  try {
    const data = JSON.parse(readFileSync(file, "utf-8"));
    return Array.isArray(data) ? data : (data.exceptions || []);
  } catch (e) {
    throw new Error(`${EXCEPTIONS_REL} unparseable: ${e.message}`);
  }
}

/** 条目摘要（forge-loop 启动强制加载用） */
export function summarize(entries) {
  return entries.map((e) => `  ${e.id} · ${e.title} → ${e.canonical || "(no canonical)"}`);
}

/** 结果化检查 */
export function runCheck(root, { now = new Date(), staleDays = DEFAULT_STALE_DAYS } = {}) {
  const file = join(root, REGISTRY_REL);
  if (!existsSync(file)) {
    return { status: "skip", detail: `skip (no ${REGISTRY_REL})`, issues: [], suspects: [], entries: [] };
  }

  const { entries, issues: parseIssues } = parseRegistry(readFileSync(file, "utf-8"));
  const issues = [...parseIssues];

  if (entries.length === 0) {
    issues.push(`${REGISTRY_REL} has no entries — add SoT entries or delete the file (an empty registry is not a gate)`);
  }

  issues.push(
    ...validateEntries(entries, {
      exists: (rel) => existsSync(join(root, rel)),
      now,
      staleDays,
    }),
  );

  let exceptions = [];
  try {
    exceptions = loadExceptions(root);
  } catch (e) {
    issues.push(e.message);
  }
  for (const x of exceptions) {
    if (!x.approvedBy) {
      issues.push(`exception '${x.file}' (${x.sot || "?"}) missing approvedBy — exceptions require human approval`);
    }
  }

  const suspects = findSuspects(scanSourceFiles(root), entries, exceptions);

  if (issues.length > 0 || suspects.length > 0) {
    const parts = [];
    if (issues.length > 0) parts.push(`${issues.length} registry issue(s): ${issues.slice(0, 3).join("; ")}`);
    if (suspects.length > 0) {
      parts.push(
        `${suspects.length} possible duplicate implementation(s): ` +
        suspects.slice(0, 5).map((s) => `${s.file} [${s.sot}]`).join(", "),
      );
    }
    return { status: "fail", detail: parts.join(" | "), issues, suspects, entries };
  }

  return {
    status: "pass",
    detail: `${entries.length} SoT entr${entries.length === 1 ? "y" : "ies"}, no duplicates, all verified`,
    issues: [],
    suspects: [],
    entries,
  };
}

/** forge-verify 契约：违规 throw，否则返回 detail */
export function check(root, opts) {
  const r = runCheck(root, opts);
  if (r.status === "fail") throw new Error(r.detail);
  return r.detail;
}

// --- CLI ---
function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] === "list" ? "list" : "check";
  let root = process.cwd();
  let staleDays = DEFAULT_STALE_DAYS;
  let json = false;
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--root" && args[i + 1]) { root = args[++i]; continue; }
    if (args[i] === "--stale-days" && args[i + 1]) { staleDays = parseInt(args[++i], 10); continue; }
    if (args[i] === "--json") { json = true; continue; }
  }

  if (cmd === "list") {
    const file = join(root, REGISTRY_REL);
    if (!existsSync(file)) {
      console.log(`No ${REGISTRY_REL} — SoT gate inactive.`);
      process.exit(0);
    }
    const { entries } = parseRegistry(readFileSync(file, "utf-8"));
    console.log(`\n=== SoT Registry (${entries.length}) — 查询后方可生成新函数 ===`);
    for (const line of summarize(entries)) console.log(line);
    console.log("");
    process.exit(0);
  }

  const r = runCheck(root, { staleDays });
  if (json) {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.status === "fail" ? 1 : 0);
  }
  if (r.status === "fail") {
    console.error(`✗ sot-check: ${r.detail}`);
    if (r.issues.length > 0) {
      for (const i of r.issues) console.error(`    · ${i}`);
    }
    if (r.suspects.length > 0) {
      console.error("  重复实现处置：复用 canonical 实现；确实不满足 → 提出「为什么不满足」并经人类批准登记到 " + EXCEPTIONS_REL);
      console.error("  注册表条目的新增/修改 = 人类批准的 PR（模型只能提议）。");
    }
    process.exit(1);
  }
  console.log(`✓ sot-check: ${r.detail}`);
  process.exit(0);
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) main();
