#!/usr/bin/env node
/**
 * spec-before-code-gate.mjs — PreToolUse 应用代码写入链式机器门
 * 1) Product-Spec.md 存在
 * 2) .forge/spec-confirmed.json（用户已确认 Spec）
 * 3) DEV-PLAN.md 存在
 * 4) .forge/plan-confirmed.json（用户已确认 Plan）
 * 5) .forge/implementer-session.json（implementer 子 Agent 活跃会话）
 */
import fs from "fs";
import path from "path";

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

const MARKERS = {
  specConfirmed: path.join(projectDir, ".forge", "spec-confirmed.json"),
  planConfirmed: path.join(projectDir, ".forge", "plan-confirmed.json"),
  implementerSession: path.join(projectDir, ".forge", "implementer-session.json"),
};

const ALLOW_PREFIXES = [
  "core/",
  "adapters/",
  "scripts/",
  "tests/",
  "test-demo/",
  "docs/",
  "memory/",
  "changes/",
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

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => {
      data += c;
    });
    process.stdin.on("end", () => resolve(data));
  });
}

function normalizeRel(filePath) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(projectDir, filePath);
  let rel = path.relative(projectDir, abs).replace(/\\/g, "/");
  if (rel.startsWith("../")) return filePath.replace(/\\/g, "/");
  return rel.replace(/^\.\//, "");
}

function isFrameworkPath(rel) {
  if (rel.startsWith(".forge/")) return true;
  for (const prefix of ALLOW_PREFIXES) {
    if (rel === prefix.slice(0, -1) || rel.startsWith(prefix)) return true;
  }
  if (rel.startsWith(".claude/") && !WORKTREE_APP_RE.test(rel) && !rel.includes("/worktrees/")) {
    return true;
  }
  return false;
}

function isArtifactPath(rel) {
  const base = path.basename(rel);
  if (/^Product-Spec\.md$/i.test(base) || /^DEV-PLAN\.md$/i.test(base) || /^Design-Brief\.md$/i.test(base)) {
    return true;
  }
  return false;
}

function isApplicationPath(rel) {
  return APP_DIR_RE.test(rel) || WORKTREE_APP_RE.test(rel);
}

function block(tool, rel, reason) {
  console.log(JSON.stringify({ decision: "block", reason: `${reason} Cannot ${tool} '${rel}'.` }));
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

  const rel = normalizeRel(filePath);
  if (isFrameworkPath(rel) || isArtifactPath(rel)) return;
  if (!isApplicationPath(rel)) return;

  const specFile = path.join(projectDir, "Product-Spec.md");
  const planFile = path.join(projectDir, "DEV-PLAN.md");

  if (!fs.existsSync(specFile)) {
    block(tool, rel, "Spec-Before-Code Gate: Product-Spec.md is missing. Run /product-spec-builder first.");
    return;
  }
  if (!fs.existsSync(MARKERS.specConfirmed)) {
    block(
      tool,
      rel,
      "Spec-Before-Code Gate: Spec not confirmed. Save Product-Spec.md and complete user confirm (writes .forge/spec-confirmed.json).",
    );
    return;
  }
  if (!fs.existsSync(planFile)) {
    block(tool, rel, "Plan-Before-Build Gate: DEV-PLAN.md is missing. Run /dev-planner first.");
    return;
  }
  if (!fs.existsSync(MARKERS.planConfirmed)) {
    block(
      tool,
      rel,
      "Plan-Before-Build Gate: Plan not confirmed. Save DEV-PLAN.md and complete user confirm (writes .forge/plan-confirmed.json).",
    );
    return;
  }
  if (!fs.existsSync(MARKERS.implementerSession)) {
    block(
      tool,
      rel,
      "Implementer Gate: No active implementer session (.forge/implementer-session.json). Dispatch implementer sub-agent per dev-builder Task; implementer creates marker at task start.",
    );
    return;
  }
}

main().catch(() => process.exit(0));
