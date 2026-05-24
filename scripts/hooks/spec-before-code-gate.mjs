#!/usr/bin/env node
/**
 * spec-before-code-gate.mjs — PreToolUse：无 Product-Spec.md 时禁止写入应用代码目录
 * 由 core/hooks/hallucination-gate.sh|.bat 调用；stdin 为工具 JSON，阻塞时 stdout 输出 decision JSON
 */
import fs from "fs";
import path from "path";

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
  });
}

/** 框架/元数据路径，无 Spec 也允许写 */
const ALLOW_PREFIXES = [
  "core/",
  "adapters/",
  "scripts/",
  "tests/",
  "test-demo/",
  "docs/",
  "memory/",
  "changes/",
  ".forge/",
  ".github/",
  "node_modules/",
  "feedback/",
  ".claude/feedback/",
  ".claude/templates/",
  ".claude/hooks/",
  ".claude/skills/",
  ".claude/agents/",
  ".claude/loadouts/",
  ".cursor/",
  ".opencode/",
];

const APP_DIR_RE = /^(src|app|lib|packages)(\/|$)/;
const WORKTREE_APP_RE = /(?:^|\/)(?:\.claude\/worktrees|worktrees)\/[^/]+\/(src|app|lib|packages)(\/|$)/;

function normalizeRel(filePath) {
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.join(projectDir, filePath);
  let rel = path.relative(projectDir, abs).replace(/\\/g, "/");
  if (rel.startsWith("../")) return filePath.replace(/\\/g, "/");
  return rel.replace(/^\.\//, "");
}

function isAllowedWithoutSpec(rel) {
  const base = path.basename(rel);
  if (/^Product-Spec\.md$/i.test(base) || /^DEV-PLAN\.md$/i.test(base) || /^Design-Brief\.md$/i.test(base)) {
    return true;
  }
  if (/\.(md|json|yaml|yml|txt)$/i.test(base) && !APP_DIR_RE.test(rel) && !WORKTREE_APP_RE.test(rel)) {
    if (!rel.includes("/worktrees/")) return true;
  }
  for (const prefix of ALLOW_PREFIXES) {
    if (rel === prefix.slice(0, -1) || rel.startsWith(prefix)) return true;
  }
  if (rel.startsWith(".claude/") && !WORKTREE_APP_RE.test(rel)) {
    if (!rel.includes("/worktrees/")) return true;
  }
  return false;
}

function isApplicationPath(rel) {
  if (APP_DIR_RE.test(rel)) return true;
  if (WORKTREE_APP_RE.test(rel)) return true;
  return false;
}

async function main() {
  const raw = await readStdin();
  if (!raw.trim()) return;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }

  const tool = payload.tool_name || payload.tool || "";
  if (tool !== "Write" && tool !== "Edit") return;

  const filePath = payload.tool_input?.file_path || payload.tool_input?.path || "";
  if (!filePath) return;

  const specFile = path.join(projectDir, "Product-Spec.md");
  if (fs.existsSync(specFile)) return;

  const rel = normalizeRel(filePath);
  if (isAllowedWithoutSpec(rel)) return;
  if (!isApplicationPath(rel)) return;

  const reason =
    `Spec-Before-Code Gate: Product-Spec.md is missing. Cannot ${tool} application code at '${rel}'. ` +
    "Run /product-spec-builder and save a confirmed Product-Spec.md first.";

  console.log(JSON.stringify({ decision: "block", reason }));
}

main().catch(() => process.exit(0));
