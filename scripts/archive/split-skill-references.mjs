#!/usr/bin/env node
/**
 * split-skill-references.mjs — 将超大 SKILL.md 章节拆到 references/
 * 一次性脚本；v1.20.4 使用后可保留供后续技能拆分。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function extractSection(content, marker) {
  const start = content.indexOf(marker);
  if (start === -1) throw new Error(`Marker not found: ${marker}`);
  const nextBracket = content.indexOf("\n[", start + marker.length);
  const end = nextBracket === -1 ? content.length : nextBracket;
  return { start, end, section: content.slice(start, end).trimEnd() };
}

function sectionBody(section) {
  const nl = section.indexOf("\n");
  if (nl === -1) return section.trim();
  return section.slice(nl + 1).trim();
}

function extractSkill(skillDir, extractions, replacements) {
  const skillPath = path.join(ROOT, "core/skills", skillDir, "SKILL.md");
  let content = fs.readFileSync(skillPath, "utf8");
  const refDir = path.join(ROOT, "core/skills", skillDir, "references");
  fs.mkdirSync(refDir, { recursive: true });

  for (const { marker, file, title } of extractions) {
    const { section } = extractSection(content, marker);
    const out =
      `# ${title}\n\n` +
      `<!-- 从 SKILL.md 渐进披露拆分；主流程见 ../SKILL.md -->\n\n` +
      section +
      "\n";
    fs.writeFileSync(path.join(refDir, file), out, "utf8");
    console.log(`Wrote ${skillDir}/references/${file}`);
  }

  for (const { marker, pointer } of replacements) {
    const { start, end } = extractSection(content, marker);
    content = content.slice(0, start) + pointer.trimEnd() + "\n\n" + content.slice(end);
  }

  fs.writeFileSync(skillPath, content, "utf8");
  console.log(`Updated ${skillPath} -> ${content.split("\n").length} lines`);
}

extractSkill(
  "dev-builder",
  [
    {
      marker: "[Development Rules Checklist]",
      file: "development-rules-checklist.md",
      title: "Development Rules Checklist",
    },
    {
      marker: "[Development Strategies]",
      file: "development-strategies.md",
      title: "Development Strategies",
    },
    {
      marker: "[Anti-Rationalization Checklist]",
      file: "anti-rationalization.md",
      title: "Anti-Rationalization Checklist",
    },
    {
      marker: "[Phase Completion Assessment]",
      file: "phase-completion-assessment.md",
      title: "Phase Completion Assessment",
    },
  ],
  [
    {
      marker: "[Development Rules Checklist]",
      pointer: `[Development Rules Checklist]
    编码期必须遵守的规范（代码标准、目录结构、数据库、Git、进程管理等）。
    **执行前读取** references/development-rules-checklist.md；Continuous Development Mode Step 2 引用此清单。`,
    },
    {
      marker: "[Development Strategies]",
      pointer: `[Development Strategies]
    Plan Mode、设计稿对照、在线搜索、技术栈选择等策略。
    **按需读取** references/development-strategies.md。`,
    },
    {
      marker: "[Anti-Rationalization Checklist]",
      pointer: `[Anti-Rationalization Checklist]
    常见「合理借口」与正确回应。
    **遇阻力时读取** references/anti-rationalization.md。`,
    },
    {
      marker: "[Phase Completion Assessment]",
      pointer: `[Phase Completion Assessment]
    Phase 结束四步验证 + 迭代循环 + Phase Summary 模板。
    **Step 3 必须按此文执行** references/phase-completion-assessment.md。`,
    },
  ]
);

// product-spec: merge Information Sufficiency into requirements file via two-step extract
const psbPath = path.join(ROOT, "core/skills/product-spec-builder/SKILL.md");
let psb = fs.readFileSync(psbPath, "utf8");

const reqExt = extractSection(psb, "[Requirements Dimension Checklist]");
const convExt = extractSection(psb, "[Conversation Strategy]");
const infoExt = extractSection(psb, "[Information Sufficiency Criteria]");
const w01Ext = extractSection(psb, "[Workflow (0-to-1 Mode)]");
const witExt = extractSection(psb, "[Workflow (Iteration Mode)]");

const psbRefDir = path.join(ROOT, "core/skills/product-spec-builder/references");
fs.mkdirSync(psbRefDir, { recursive: true });

const reqCombined =
  `# Requirements Dimension & Information Sufficiency\n\n` +
  `<!-- 从 SKILL.md 渐进披露拆分；主流程见 ../SKILL.md -->\n\n` +
  reqExt.section +
  "\n\n" +
  infoExt.section +
  "\n";
fs.writeFileSync(path.join(psbRefDir, "requirements-dimensions.md"), reqCombined, "utf8");

fs.writeFileSync(
  path.join(psbRefDir, "conversation-strategy.md"),
  `# Conversation Strategy\n\n<!-- 从 SKILL.md 渐进披露拆分 -->\n\n${convExt.section}\n`,
  "utf8"
);
fs.writeFileSync(
  path.join(psbRefDir, "workflow-0-to-1.md"),
  `# Workflow (0-to-1 Mode)\n\n<!-- 从 SKILL.md 渐进披露拆分 -->\n\n${w01Ext.section}\n`,
  "utf8"
);
fs.writeFileSync(
  path.join(psbRefDir, "workflow-iteration.md"),
  `# Workflow (Iteration Mode)\n\n<!-- 从 SKILL.md 渐进披露拆分 -->\n\n${witExt.section}\n`,
  "utf8"
);

// Remove sections bottom-up so indices stay valid
const cuts = [witExt, w01Ext, infoExt, convExt, reqExt].sort((a, b) => b.start - a.start);
for (const { start, end } of cuts) {
  psb = psb.slice(0, start) + psb.slice(end);
}

const startupIdx = psb.indexOf("[Startup Check]");
const insert =
  `[Requirements Dimension Checklist]
    访谈需收集的维度 + 信息充分性判定。
    **0-to-1 / Iteration 提问时读取** references/requirements-dimensions.md。

[Conversation Strategy]
    开场、提问、方案与 AI/平台/技术引导、搜索与确认。
    **对话阶段读取** references/conversation-strategy.md。

[Workflow (0-to-1 Mode)]
    从零到一完整阶段（探索 → 澄清 → 细化 → 生成 Spec）。
    **进入 0-to-1 后按步执行** references/workflow-0-to-1.md。

[Workflow (Iteration Mode)]
    存量 Spec 迭代与 change-manager 路由。
    **Iteration Mode 完整步骤** references/workflow-iteration.md。

`;
psb = psb.slice(0, startupIdx) + insert + psb.slice(startupIdx);
fs.writeFileSync(psbPath, psb, "utf8");
console.log(`Updated ${psbPath} -> ${psb.split("\n").length} lines`);
