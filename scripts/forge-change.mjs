#!/usr/bin/env node
/**
 * forge-change.mjs — 变更管理自动化
 *
 * change-manager Skill 的机械辅助脚本：scaffold、list、archive、check。
 * AI 负责 propose/apply/verify 的内容生成，本脚本处理文件操作。
 *
 * 用法：
 *   pnpm forge-change init <name>     # 用模板搭建变更目录
 *   pnpm forge-change list            # 列出活跃/已归档变更
 *   pnpm forge-change check           # 检查孤儿变更、未归档变更等
 *   pnpm forge-change archive <name>  # 归档指定变更
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, renameSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CHANGES_DIR = join(ROOT, "changes");
const TEMPLATES_DIR = join(ROOT, "core", "skills", "change-manager", "templates");

const args = process.argv.slice(2);
const cmd = args[0];

function usage() {
  console.log(`Usage:
  pnpm forge-change init <name>     Scaffold a new change directory
  pnpm forge-change list            List active and archived changes
  pnpm forge-change check           Check for issues (orphans, unarchived)
  pnpm forge-change archive <name>  Archive a completed change`);
  process.exit(1);
}

if (!cmd) usage();

// ─── Helpers ──────────────────────────────────────────────────────

function kebabCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function listChanges(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith(".") && d.name !== "archive")
    .map(d => d.name);
}

function getTemplateFiles() {
  if (!existsSync(TEMPLATES_DIR)) return [];
  return readdirSync(TEMPLATES_DIR).filter(f => f.endsWith(".md"));
}

// ─── Init ─────────────────────────────────────────────────────────

function cmdInit(name) {
  if (!name) { console.error("Usage: pnpm forge-change init <change-name>"); process.exit(1); }

  const changeName = kebabCase(name);
  const changeDir = join(CHANGES_DIR, changeName);

  if (existsSync(changeDir)) {
    console.error(`Change "${changeName}" already exists at ${changeDir}`);
    process.exit(1);
  }

  mkdirSync(changeDir, { recursive: true });

  const templates = getTemplateFiles();
  if (templates.length === 0) {
    console.warn("Warning: No templates found at", TEMPLATES_DIR);
  }

  for (const tmpl of templates) {
    const src = join(TEMPLATES_DIR, tmpl);
    const content = readFileSync(src, "utf-8");
    // Map template to output filename
    let outName = tmpl
      .replace("change-proposal-template", "proposal")
      .replace("change-specs-template", "specs")
      .replace("change-design-template", "design")
      .replace("change-tasks-template", "tasks")
      .replace("change-verify-template", "verify");
    const dest = join(changeDir, outName);
    writeFileSync(dest, content.replace(/<!-- change-name -->/g, changeName), "utf-8");
    console.log(`  Created: ${join("changes", changeName, outName)}`);
  }

  console.log(`\nChange "${changeName}" initialized. Next: fill proposal.md + specs.md, then apply.`);
}

// ─── List ─────────────────────────────────────────────────────────

function cmdList() {
  const active = listChanges(CHANGES_DIR);
  const archived = listChanges(join(CHANGES_DIR, "archive"));

  console.log("\n=== Active Changes ===\n");
  if (active.length === 0) {
    console.log("  (none)");
  } else {
    for (const d of active) {
      const files = readdirSync(join(CHANGES_DIR, d)).filter(f => f.endsWith(".md"));
      console.log(`  ${d}/`);
      for (const f of files) console.log(`    ${f}`);
    }
  }

  console.log("\n=== Archived Changes ===\n");
  if (archived.length === 0) {
    console.log("  (none)");
  } else {
    for (const d of archived) {
      console.log(`  archive/${d}/`);
    }
  }
  console.log("");
}

// ─── Check ────────────────────────────────────────────────────────

function cmdCheck() {
  const active = listChanges(CHANGES_DIR);
  const changesDir = CHANGES_DIR;

  let issues = 0;

  // Check for orphan changes (no proposal.md)
  for (const d of active) {
    const changeDir = join(changesDir, d);
    const files = readdirSync(changeDir);
    if (!files.some(f => f === "proposal.md" || f === "specs.md")) {
      console.warn(`  [WARN] "${d}" has no proposal.md or specs.md — appears to be an empty scaffold`);
      issues++;
    }
  }

  // Check for unarchived changes with verify.md present (ready to archive)
  for (const d of active) {
    const changeDir = join(changesDir, d);
    const files = readdirSync(changeDir);
    if (files.includes("verify.md")) {
      console.log(`  [INFO] "${d}" has verify.md — ready for archive`);
    }
  }

  // Check for in-progress conflicts
  if (active.length > 1) {
    console.warn(`  [WARN] ${active.length} active changes found — consider archiving completed ones`);
    issues++;
  }

  if (issues === 0) {
    console.log("No issues found.");
  }
}

// ─── Archive ──────────────────────────────────────────────────────

function cmdArchive(name) {
  if (!name) { console.error("Usage: pnpm forge-change archive <change-name>"); process.exit(1); }

  const changeName = kebabCase(name);
  const srcDir = join(CHANGES_DIR, changeName);
  const archiveDir = join(CHANGES_DIR, "archive", changeName);

  if (!existsSync(srcDir)) {
    console.error(`Change "${changeName}" not found at ${srcDir}`);
    process.exit(1);
  }

  mkdirSync(join(CHANGES_DIR, "archive"), { recursive: true });
  renameSync(srcDir, archiveDir);
  console.log(`Archived: changes/${changeName}/ → changes/archive/${changeName}/`);
}

// ─── Dispatch ─────────────────────────────────────────────────────

try {
  if (cmd === "init") cmdInit(args[1]);
  else if (cmd === "list") cmdList();
  else if (cmd === "check") cmdCheck();
  else if (cmd === "archive") cmdArchive(args[1]);
  else usage();
} catch (e) {
  console.error(`forge-change error: ${e.message}`);
  process.exit(1);
}
