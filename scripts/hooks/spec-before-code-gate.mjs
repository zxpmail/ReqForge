#!/usr/bin/env node
/**
 * spec-before-code-gate.mjs — PreToolUse 应用代码写入链式机器门
 * 1) Product-Spec.md 存在
 * 1b) Product-Spec.md 含完整 Idea Stage Exit Criteria（构思验证门）
 * 2) .forge/spec-confirmed.json（用户已确认 Spec）
 * 3) DEV-PLAN.md 存在
 * 4) .forge/plan-confirmed.json（用户已确认 Plan）
 * 5) .forge/implementer-session.json（implementer 子 Agent 活跃会话）
 */
import fs from "fs";
import path from "path";

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

/** Load gate degradation level: "full" (default) | "light" | "none" */
function loadGateLevel(root) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(root, ".forge", "gate-config.json"), "utf8"));
    if (data && (data.level === "light" || data.level === "none")) return data.level;
  } catch {}
  return "full";
}

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

/** Founder's Playbook: problem-solution fit evidence before app code */
function hasIdeaStageExitCriteria(specPath) {
  let content;
  try {
    content = fs.readFileSync(specPath, "utf8");
  } catch {
    return false;
  }
  if (!/##\s+Idea Stage Exit Criteria/i.test(content)) return false;
  const sections = [
    /###\s+1\.\s+Problem real and specific/i,
    /###\s+2\.\s+Solution addresses the validated problem/i,
    /###\s+3\.\s+Enough signal to justify building/i,
  ];
  if (!sections.every((re) => re.test(content))) return false;
  // Reject placeholder-only tables (all cells empty or TBD)
  const block = content.split(/##\s+Idea Stage Exit Criteria/i)[1]?.split(/^##\s+/m)[0] || "";
  if (/\|\s*\[TBD\]\s*\|/i.test(block) && !/\|\s*[^|\s][^|]+\s*\|/.test(block.replace(/\|[\s\-:]+\|/g, ""))) {
    return false;
  }
  const cells = [...block.matchAll(/\|\s*([^|]+?)\s*\|/g)].map((m) => m[1].trim());
  const answers = cells.filter((c) => !/^(field|who exactly|how often|validated problem|evidence type|answer)$/i.test(c));
  const filled = answers.filter((c) => c.length > 2 && !/^\[TBD\]$/i.test(c));
  return filled.length >= 3;
}

function block(tool, rel, reason) {
  console.log(JSON.stringify({ decision: "block", reason: `${reason} Cannot ${tool} '${rel}'.` }));
}

function blockWithRecovery(tool, rel, reason, recovery) {
  console.log(
    JSON.stringify({
      decision: "block",
      reason: `${reason} Cannot ${tool} '${rel}'.\n\n─── Recovery Options ───\n${recovery}`,
    }),
  );
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

  const gateLevel = loadGateLevel(projectDir);
  if (gateLevel === "none") return;

  const specFile = path.join(projectDir, "Product-Spec.md");
  const planFile = path.join(projectDir, "DEV-PLAN.md");

  if (!fs.existsSync(specFile)) {
    blockWithRecovery(
      tool,
      rel,
      "Spec-Before-Code Gate: Product-Spec.md is missing.",
      "1. Run /product-spec-builder to generate Product-Spec.md\n2. Confirm spec with user → writes .forge/spec-confirmed.json\n3. Then retry this write.\n\nTo skip all gates, set .forge/gate-config.json: {\"level\":\"light\"} or {\"level\":\"none\"}",
    );
    return;
  }
  if (gateLevel === "light") return;

  if (!hasIdeaStageExitCriteria(specFile)) {
    blockWithRecovery(
      tool,
      rel,
      "Idea Validation Gate: Product-Spec.md must include completed § Idea Stage Exit Criteria (all three questions with real answers, not [TBD]).",
      "1. Update Product-Spec.md § Idea Stage Exit Criteria:\n   - 1. Problem real and specific (who, how often)\n   - 2. Solution addresses the validated problem (how it fixes)\n   - 3. Enough signal to justify building (evidence type)\n2. Confirm spec with user → writes .forge/spec-confirmed.json\n3. Then retry this write.",
    );
    return;
  }
  if (!fs.existsSync(MARKERS.specConfirmed)) {
    blockWithRecovery(
      tool,
      rel,
      "Spec-Before-Code Gate: Spec not confirmed.",
      "1. Present Product-Spec.md to user for review\n2. User confirms → writes .forge/spec-confirmed.json\n   (content: {\"confirmed\":true,\"confirmedAt\":\"<ISO>\"})\n3. Then retry this write.",
    );
    return;
  }
  if (!fs.existsSync(planFile)) {
    blockWithRecovery(
      tool,
      rel,
      "Plan-Before-Build Gate: DEV-PLAN.md is missing.",
      "1. Run /dev-planner to generate DEV-PLAN.md with MVP Scope\n2. Confirm plan with user → writes .forge/plan-confirmed.json\n3. Then retry this write.",
    );
    return;
  }
  if (!fs.existsSync(MARKERS.planConfirmed)) {
    blockWithRecovery(
      tool,
      rel,
      "Plan-Before-Build Gate: Plan not confirmed.",
      "1. Present DEV-PLAN.md to user for review\n2. User confirms → writes .forge/plan-confirmed.json\n   (content: {\"confirmed\":true,\"confirmedAt\":\"<ISO>\"})\n3. Then retry this write.",
    );
    return;
  }
  if (!fs.existsSync(MARKERS.implementerSession)) {
    blockWithRecovery(
      tool,
      rel,
      "Implementer Gate: No active implementer session (.forge/implementer-session.json).",
      "1. Dispatch implementer sub-agent per dev-builder Task workflow\n2. Implementer creates .forge/implementer-session.json at task start\n3. Then retry this write from within the implementer session.",
    );
    return;
  }
}

main().catch(() => process.exit(0));
