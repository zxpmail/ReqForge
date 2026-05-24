/**
 * lib.mjs — forge-smoke 共享工具
 * 各 smoke 子进程独立运行，通过 exit code 回报结果
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** ReqForge 仓库根目录 */
export const ROOT = path.resolve(__dirname, "..", "..");

/** 创建 smoke 运行器 */
export function createRunner(name) {
  const failures = [];
  let passes = 0;

  return {
    ok() {
      passes++;
    },
    fail(message) {
      failures.push(message);
    },
    assert(condition, message) {
      if (condition) passes++;
      else failures.push(message);
    },
    finish() {
      if (failures.length > 0) {
        console.error(`✗ ${name}: ${failures.length} failure(s)`);
        for (const f of failures) console.error(`  - ${f}`);
        process.exit(1);
      }
      console.log(`✓ ${name}: ${passes} checks passed`);
      process.exit(0);
    },
  };
}

/** 读取目录下含 SKILL.md 的技能名列表 */
export function listSkillNames(skillsDir) {
  if (!fs.existsSync(skillsDir)) return [];
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => fs.existsSync(path.join(skillsDir, name, "SKILL.md")))
    .sort();
}

/** 读取 core/agents 下的 agent 名（不含 .md） */
export function listAgentNames(agentsDir) {
  if (!fs.existsSync(agentsDir)) return [];
  return fs
    .readdirSync(agentsDir)
    .filter((f) => f.endsWith(".md") && f !== "AGENTS.md")
    .map((f) => f.replace(/\.md$/, ""))
    .sort();
}

/** hook 基名是否在 core/hooks 有实现（.sh / .bat / .ps1 任一） */
export function hookExists(hooksDir, hookName) {
  return [".sh", ".bat", ".ps1"].some((ext) =>
    fs.existsSync(path.join(hooksDir, `${hookName}${ext}`)),
  );
}

/** 读取 loadout JSON（跳过 schema 文件） */
export function listLoadoutFiles(loadoutsDir) {
  return fs
    .readdirSync(loadoutsDir)
    .filter((f) => f.endsWith(".json") && !f.includes("schema"))
    .map((f) => path.join(loadoutsDir, f));
}

/** adapter 技能目录映射（与 sync.ts 一致） */
export const ADAPTER_SKILL_PATHS = {
  "claude-code": "adapters/claude-code/.claude/skills",
  cursor: "adapters/cursor/.cursor/rules/skills",
  opencode: "adapters/opencode/.opencode/skills",
};
