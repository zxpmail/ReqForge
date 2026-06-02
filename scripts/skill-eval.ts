/**
 * Skill eval — static checks for user-project custom Skill evaluation packs.
 *
 * Usage:
 *   pnpm skill-eval init <skill-name>
 *   pnpm skill-eval <skill-name> [--cwd <dir>] [--eval-dir <path>]
 */

import * as fs from "fs";
import * as path from "path";

export type Severity = "error" | "warn";

export interface EvalCheck {
  id: string;
  severity: Severity;
  ok: boolean;
  message: string;
}

export interface TriggerCase {
  id: string;
  prompt: string;
  should_trigger: boolean;
  note?: string;
}

export interface TriggersFile {
  version: number;
  skill?: string;
  description?: string;
  cases: TriggerCase[];
}

export interface CaseAssertion {
  fileExists?: string[];
  maxBytes?: { file: string; max: number; id?: string }[];
  regexChecks?: {
    id?: string;
    file?: string;
    glob?: string;
    mustMatch?: string;
    mustNotMatch?: string;
    flags?: string;
  }[];
}

export interface OutputCase {
  id: string;
  prompt?: string;
  artifacts_subdir?: string;
  assertions?: CaseAssertion;
}

export interface CasesFile {
  version: number;
  skill?: string;
  description?: string;
  artifacts_root?: string;
  cases: OutputCase[];
}

export const SKILL_EVAL_TEMPLATE_REL = "core/templates/skill-eval";
export const DEFAULT_FORGE_SKILLS = ".forge/skills";

export function resolveEvalDir(cwd: string, skillName: string, evalDir?: string): string {
  if (evalDir) return path.resolve(cwd, evalDir);
  return path.join(cwd, DEFAULT_FORGE_SKILLS, skillName, "eval");
}

export function loadJsonFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

const OBVIOUS_NEGATIVE = /斐波那契|fibonacci|hello\s*world/i;

export function validateTriggers(data: TriggersFile): EvalCheck[] {
  const checks: EvalCheck[] = [];

  if (data.version !== 1) {
    checks.push({
      id: "triggers-version",
      severity: "error",
      ok: false,
      message: `triggers.json version must be 1, got ${data.version}`,
    });
  }

  if (!Array.isArray(data.cases) || data.cases.length === 0) {
    checks.push({
      id: "triggers-cases",
      severity: "error",
      ok: false,
      message: "triggers.json must have a non-empty cases array",
    });
    return checks;
  }

  const should = data.cases.filter((c) => c.should_trigger === true);
  const shouldNot = data.cases.filter((c) => c.should_trigger === false);

  checks.push({
    id: "triggers-should-count",
    severity: "error",
    ok: should.length >= 2,
    message: `need >= 2 should_trigger:true cases (have ${should.length})`,
  });
  checks.push({
    id: "triggers-should-not-count",
    severity: "error",
    ok: shouldNot.length >= 2,
    message: `need >= 2 should_trigger:false cases (have ${shouldNot.length})`,
  });

  for (const c of data.cases) {
    if (!c.id || !c.prompt || typeof c.should_trigger !== "boolean") {
      checks.push({
        id: `triggers-field-${c.id || "?"}`,
        severity: "error",
        ok: false,
        message: "each trigger case needs id, prompt, should_trigger",
      });
    }
    if (c.should_trigger === false && OBVIOUS_NEGATIVE.test(c.prompt)) {
      checks.push({
        id: `triggers-obvious-negative-${c.id}`,
        severity: "warn",
        ok: false,
        message:
          "negative case looks too obvious (e.g. fibonacci); use a near-miss that could wrongly trigger",
      });
    }
  }

  return checks;
}

export function validateCasesSchema(data: CasesFile): EvalCheck[] {
  const checks: EvalCheck[] = [];

  if (data.version !== 1) {
    checks.push({
      id: "cases-version",
      severity: "error",
      ok: false,
      message: `cases.json version must be 1, got ${data.version}`,
    });
  }

  if (!Array.isArray(data.cases) || data.cases.length === 0) {
    checks.push({
      id: "cases-nonempty",
      severity: "error",
      ok: false,
      message: "cases.json must have at least one output case",
    });
    return checks;
  }

  for (const c of data.cases) {
    if (!c.id) {
      checks.push({
        id: "cases-id",
        severity: "error",
        ok: false,
        message: "each output case needs id",
      });
    }
    if (!c.assertions || Object.keys(c.assertions).length === 0) {
      checks.push({
        id: `cases-assertions-${c.id}`,
        severity: "warn",
        ok: false,
        message: `case ${c.id}: no assertions yet (add fileExists / regexChecks after first agent run)`,
      });
    }
  }

  return checks;
}

function globMatch(pattern: string, filePath: string): boolean {
  const re = new RegExp(
    "^" +
      pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*\*/g, "{{GLOBSTAR}}")
        .replace(/\*/g, "[^/]*")
        .replace(/{{GLOBSTAR}}/g, ".*") +
      "$",
  );
  return re.test(filePath.replace(/\\/g, "/"));
}

function runRegexOnFile(
  filePath: string,
  check: NonNullable<CaseAssertion["regexChecks"]>[0],
): EvalCheck[] {
  const checks: EvalCheck[] = [];
  const id = check.id || "regex";
  if (!fs.existsSync(filePath)) {
    checks.push({
      id,
      severity: "error",
      ok: false,
      message: `missing file for regex: ${filePath}`,
    });
    return checks;
  }
  const content = fs.readFileSync(filePath, "utf-8");
  const flags = check.flags || "";
  if (check.mustMatch) {
    const re = new RegExp(check.mustMatch, flags);
    checks.push({
      id: `${id}-must-match`,
      severity: "error",
      ok: re.test(content),
      message: re.test(content)
        ? `mustMatch ok: ${check.mustMatch}`
        : `mustMatch failed on ${filePath}: ${check.mustMatch}`,
    });
  }
  if (check.mustNotMatch) {
    const re = new RegExp(check.mustNotMatch, flags);
    const hit = re.test(content);
    checks.push({
      id: `${id}-must-not`,
      severity: "error",
      ok: !hit,
      message: hit
        ? `mustNotMatch failed on ${filePath}: ${check.mustNotMatch}`
        : `mustNotMatch ok`,
    });
  }
  return checks;
}

export function runCaseAssertions(
  cwd: string,
  artifactsRoot: string,
  outputCase: OutputCase,
): EvalCheck[] {
  const checks: EvalCheck[] = [];
  const assertions = outputCase.assertions;
  if (!assertions) return checks;

  const sub = outputCase.artifacts_subdir || outputCase.id;
  const base = path.join(cwd, artifactsRoot, sub);

  if (!fs.existsSync(base)) {
    const hasFileAssertions = (assertions.fileExists?.length ?? 0) > 0;
    checks.push({
      id: `artifacts-${outputCase.id}`,
      severity: hasFileAssertions ? "error" : "warn",
      ok: false,
      message: hasFileAssertions
        ? `artifacts dir missing (required for fileExists): ${base}`
        : `artifacts dir missing (skip assertions): ${base}`,
    });
    if (hasFileAssertions) {
      for (const rel of assertions.fileExists || []) {
        checks.push({
          id: `file-exists-${outputCase.id}-${rel}`,
          severity: "error",
          ok: false,
          message: `missing: ${path.join(sub, rel)} (no artifacts dir)`,
        });
      }
    }
    return checks;
  }

  for (const rel of assertions.fileExists || []) {
    const fp = path.join(base, rel);
    checks.push({
      id: `file-exists-${outputCase.id}-${rel}`,
      severity: "error",
      ok: fs.existsSync(fp),
      message: fs.existsSync(fp) ? `exists: ${rel}` : `missing: ${path.join(sub, rel)}`,
    });
  }

  for (const mb of assertions.maxBytes || []) {
    const fp = path.join(base, mb.file);
    if (!fs.existsSync(fp)) {
      checks.push({
        id: `max-bytes-${outputCase.id}-${mb.file}`,
        severity: "error",
        ok: false,
        message: `missing for maxBytes: ${mb.file}`,
      });
      continue;
    }
    const size = fs.statSync(fp).size;
    checks.push({
      id: `max-bytes-${outputCase.id}-${mb.file}`,
      severity: "error",
      ok: size <= mb.max,
      message:
        size <= mb.max
          ? `${mb.file}: ${size} <= ${mb.max}`
          : `${mb.file}: ${size} bytes exceeds max ${mb.max}`,
    });
  }

  for (const rc of assertions.regexChecks || []) {
    if (rc.file) {
      checks.push(...runRegexOnFile(path.join(base, rc.file), rc));
    } else if (rc.glob) {
      const walk = (dir: string, prefix = ""): string[] => {
        const out: string[] = [];
        for (const name of fs.readdirSync(dir)) {
          const full = path.join(dir, name);
          const rel = prefix ? `${prefix}/${name}` : name;
          if (fs.statSync(full).isDirectory()) out.push(...walk(full, rel));
          else if (globMatch(rc.glob!, rel)) out.push(rel);
        }
        return out;
      };
      const matched = walk(base);
      if (matched.length === 0) {
        checks.push({
          id: `glob-${outputCase.id}-${rc.id || "?"}`,
          severity: "error",
          ok: false,
          message: `glob matched no files: ${rc.glob}`,
        });
      } else {
        for (const rel of matched) {
          checks.push(...runRegexOnFile(path.join(base, rel), rc));
        }
      }
    }
  }

  return checks;
}

export interface SkillEvalOptions {
  cwd?: string;
  skillName: string;
  evalDir?: string;
  strict?: boolean;
}

export interface SkillEvalResult {
  passed: boolean;
  errorCount: number;
  warnCount: number;
  checks: EvalCheck[];
}

export function runSkillEval(options: SkillEvalOptions): SkillEvalResult {
  const cwd = path.resolve(options.cwd || process.cwd());
  const evalDir = resolveEvalDir(cwd, options.skillName, options.evalDir);
  const checks: EvalCheck[] = [];

  const triggersPath = path.join(evalDir, "triggers.json");
  const casesPath = path.join(evalDir, "cases.json");

  if (!fs.existsSync(evalDir)) {
    checks.push({
      id: "eval-dir",
      severity: "error",
      ok: false,
      message: `eval dir missing: ${evalDir} (run: pnpm skill-eval init ${options.skillName})`,
    });
    return finalize(checks, options.strict);
  }

  if (!fs.existsSync(triggersPath)) {
    checks.push({
      id: "triggers-file",
      severity: "error",
      ok: false,
      message: `missing ${triggersPath}`,
    });
  } else {
    const triggers = loadJsonFile<TriggersFile>(triggersPath);
    checks.push(...validateTriggers(triggers));
  }

  if (!fs.existsSync(casesPath)) {
    checks.push({
      id: "cases-file",
      severity: "error",
      ok: false,
      message: `missing ${casesPath}`,
    });
  } else {
    const casesFile = loadJsonFile<CasesFile>(casesPath);
    checks.push(...validateCasesSchema(casesFile));
    const root = casesFile.artifacts_root || "eval-output";
    for (const c of casesFile.cases) {
      checks.push(...runCaseAssertions(cwd, root, c));
    }
  }

  // Ref-lint: numeric reference consistency check on SKILL.md
  const skillPath = findSkillMd(cwd, options.skillName);
  if (skillPath) {
    checks.push(...refLintSkillMd(fs.readFileSync(skillPath, "utf-8")));
  }

  return finalize(checks, options.strict);
}

function finalize(checks: EvalCheck[], strict?: boolean): SkillEvalResult {
  let errorCount = 0;
  let warnCount = 0;
  for (const c of checks) {
    if (c.ok) continue;
    if (c.severity === "error") errorCount++;
    else warnCount++;
  }
  const passed = errorCount === 0 && (!strict || warnCount === 0);
  return { passed, errorCount, warnCount, checks };
}

export function formatSkillEvalReport(result: SkillEvalResult): string {
  const lines: string[] = [];
  for (const c of result.checks) {
    const icon = c.ok ? "✅" : c.severity === "error" ? "❌" : "⚠️";
    lines.push(`${icon} [${c.id}] ${c.message}`);
  }
  lines.push("");
  lines.push(
    result.passed
      ? "Skill eval PASSED"
      : `Skill eval FAILED (${result.errorCount} errors, ${result.warnCount} warnings)`,
  );
  return lines.join("\n");
}

export function initSkillEval(
  skillName: string,
  options: { cwd?: string; forgeRoot?: string; force?: boolean } = {},
): string {
  const cwd = path.resolve(options.cwd || process.cwd());
  const forgeRoot = options.forgeRoot || path.resolve(__dirname, "..");
  const templateDir = path.join(forgeRoot, SKILL_EVAL_TEMPLATE_REL);
  const evalDir = resolveEvalDir(cwd, skillName);

  if (fs.existsSync(evalDir) && !options.force) {
    throw new Error(`Eval dir already exists: ${evalDir}\nUse --force to overwrite templates.`);
  }

  fs.mkdirSync(evalDir, { recursive: true });

  const copies: [string, string][] = [
    ["triggers.template.json", "triggers.json"],
    ["cases.template.json", "cases.json"],
    ["rejected-edits.template.json", "rejected-edits.json"],
  ];

  for (const [srcName, destName] of copies) {
    const src = path.join(templateDir, srcName);
    const dest = path.join(evalDir, destName);
    if (!fs.existsSync(src)) throw new Error(`Template missing: ${src}`);
    let text = fs.readFileSync(src, "utf-8");
    text = text.replace(/my-custom-skill/g, skillName);
    fs.writeFileSync(dest, text, "utf-8");
  }

  const readmeSrc = path.join(templateDir, "README.md");
  if (fs.existsSync(readmeSrc)) {
    fs.copyFileSync(readmeSrc, path.join(evalDir, "README.md"));
  }

  return evalDir;
}

// --- Ref-lint: numeric reference consistency ---

const CN_NUM: Record<string, number> = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
};

function parseCnNum(s: string): number | null {
  if (s.length === 1 && CN_NUM[s] !== undefined) return CN_NUM[s];
  if (s === "十") return 10;
  if (s.startsWith("十") && s.length === 2) return 10 + (CN_NUM[s[1]] ?? 0);
  if (s.endsWith("十") && s.length === 2) return (CN_NUM[s[0]] ?? 0) * 10;
  return null;
}

const EN_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12,
};

const REF_PATTERN = /(?:([一二三四五六七八九十]{1,2})|(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)|(\d+))\s*(?:个|项|维[度量表]|步[骤]|层|阶[段级]|条|点|处|行|部分|章节|dimensions?|steps?|layers?|phases?|stages?|items?|points?|rules?|principles?|tasks?|checks?)/gi;

interface RefMatch {
  line: number;
  text: string;
  claimed: number;
  listLine: number;
  actual: number;
}

export function refLintSkillMd(content: string): EvalCheck[] {
  const checks: EvalCheck[] = [];
  const lines = content.split("\n");

  const matches: RefMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpExecArray | null;
    const localRef = REF_PATTERN;
    localRef.lastIndex = 0;
    while ((m = localRef.exec(line)) !== null) {
      const claimed = m[1] ? parseCnNum(m[1]) : (m[2] ? (EN_NUM[m[2].toLowerCase()] ?? null) : parseInt(m[3], 10));
      if (claimed === null || claimed < 2 || claimed > 20) continue;

      // Look ahead for the nearest markdown list (within 5 lines)
      let listStart = -1;
      for (let j = i + 1; j <= Math.min(i + 5, lines.length - 1); j++) {
        if (/^\s*[-*+]\s/.test(lines[j]) || /^\s*\d+[.)]\s/.test(lines[j])) {
          listStart = j;
          break;
        }
      }
      if (listStart === -1) continue;

      // Count consecutive list items
      let actual = 0;
      for (let j = listStart; j < lines.length; j++) {
        if (/^\s*[-*+]\s/.test(lines[j]) || /^\s*\d+[.)]\s/.test(lines[j])) {
          actual++;
        } else if (lines[j].trim() === "") {
          break;
        } else if (actual > 0) {
          break;
        }
      }
      if (actual === 0) continue;

      matches.push({
        line: i + 1,
        text: m[0],
        claimed,
        listLine: listStart + 1,
        actual,
      });
    }
  }

  // Deduplicate: keep only the first match per list region
  const seen = new Set<number>();
  for (const m of matches) {
    if (seen.has(m.listLine)) continue;
    seen.add(m.listLine);

    if (m.claimed !== m.actual) {
      checks.push({
        id: `ref-lint-L${m.line}`,
        severity: "warn",
        ok: false,
        message: `L${m.line} "${m.text}" claims ${m.claimed} but list at L${m.listLine} has ${m.actual} items`,
      });
    } else {
      checks.push({
        id: `ref-lint-L${m.line}`,
        severity: "warn",
        ok: true,
        message: `"${m.text}" matches list (${m.claimed} items)`,
      });
    }
  }

  return checks;
}

// --- Judge interfaces ---

export interface JudgeDimension {
  id: string;
  name: string;
  weight: number;
  scoring: string;
  description: string;
}

export interface JudgeConfig {
  version: number;
  skill: string;
  description: string;
  rubric: { dimensions: JudgeDimension[] };
  judge_count: number;
  test_prompt_source: string;
}

export interface JudgeScore {
  dimension_id: string;
  score: number;
  evidence: string;
}

export interface JudgeReport {
  version: number;
  skill: string;
  judged_at: string;
  judge_id: string;
  scores: JudgeScore[];
  total_score: number;
  summary: string;
  test_prompt_results: { prompt: string; result: string }[];
}

export function initJudgeConfig(
  skillName: string,
  options: { cwd?: string; forgeRoot?: string; force?: boolean } = {},
): string {
  const cwd = path.resolve(options.cwd || process.cwd());
  const forgeRoot = options.forgeRoot || path.resolve(__dirname, "..");
  const evalDir = resolveEvalDir(cwd, skillName);
  const destPath = path.join(evalDir, "judge-config.json");

  if (fs.existsSync(destPath) && !options.force) {
    throw new Error(`judge-config.json already exists: ${destPath}\nUse --force to overwrite.`);
  }

  const src = path.join(forgeRoot, "core/templates/skill-eval/judge-config.template.json");
  if (!fs.existsSync(src)) throw new Error(`Judge config template missing: ${src}`);

  fs.mkdirSync(evalDir, { recursive: true });
  let text = fs.readFileSync(src, "utf-8");
  text = text.replace(/my-custom-skill/g, skillName);
  fs.writeFileSync(destPath, text, "utf-8");
  return destPath;
}

export function findSkillMd(cwd: string, skillName: string): string | null {
  const candidates = [
    path.join(cwd, "core", "skills", skillName, "SKILL.md"),
    path.join(cwd, ".claude", "skills", skillName, "SKILL.md"),
    path.join(cwd, ".cursor", "rules", "skills", skillName, "SKILL.md"),
    path.join(cwd, ".opencode", "skills", skillName, "SKILL.md"),
    path.join(cwd, ".forge", "skills", skillName, "SKILL.md"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

export function generateJudgeBriefing(options: {
  cwd?: string;
  skillName: string;
  evalDir?: string;
}): string {
  const cwd = path.resolve(options.cwd || process.cwd());
  const evalDir = resolveEvalDir(cwd, options.skillName, options.evalDir);
  const cfgPath = path.join(evalDir, "judge-config.json");
  const casesPath = path.join(evalDir, "cases.json");

  // Load judge config
  if (!fs.existsSync(cfgPath)) {
    return `Error: judge-config.json not found at ${cfgPath}\nRun: pnpm skill-eval judge-prep ${options.skillName}`;
  }
  const config: JudgeConfig = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));

  // Find SKILL.md
  const skillPath = findSkillMd(cwd, options.skillName);
  if (!skillPath) {
    return `Error: SKILL.md not found for skill "${options.skillName}"`;
  }

  // Load test prompts from cases.json
  const testPrompts: { id: string; prompt: string }[] = [];
  if (fs.existsSync(casesPath)) {
    const casesFile = JSON.parse(fs.readFileSync(casesPath, "utf-8"));
    if (casesFile.cases) {
      for (const c of casesFile.cases) {
        if (c.prompt) testPrompts.push({ id: c.id, prompt: c.prompt });
      }
    }
  }
  if (testPrompts.length === 0) {
    testPrompts.push({ id: "default", prompt: "(no test prompts found in cases.json)" });
  }

  // Build briefing sections
  const dims = config.rubric.dimensions;
  const totalWeight = dims.reduce((s, d) => s + d.weight, 0);
  const maxTotal = dims.reduce((s, d) => s + d.weight * 10, 0);
  const scaleFactor = 100 / maxTotal;

  const rubricLines = dims.map(
    (d, i) =>
      `  ${i + 1}. [${d.id}] ${d.name} (权重 ${d.weight}%，满分 ${Math.round(d.weight * 10 * scaleFactor)} 分)
     ${d.description}
     评分 1-10 → 加权后 ×${scaleFactor.toFixed(2)}`,
  );

  const promptLines = testPrompts.map(
    (tp) => `  - [${tp.id}] ${tp.prompt}`,
  );

  return `# Judge Briefing: ${options.skillName}

You are an independent judge evaluating the quality of an AI agent Skill.
Your task: read the SKILL.md, run test prompts, and score against the rubric below.

## SKILL.md location
${skillPath}

## Test prompts
${promptLines.join("\n")}

## Rubric (${config.rubric.dimensions.length} dimensions, max 100 points)

${rubricLines.join("\n\n")}

## Instructions

1. Read the SKILL.md file fully — understand the workflow, not just individual steps
2. For each test prompt: execute it with the Skill loaded, and note the output quality
3. Also consider: if you ran the same prompt WITHOUT the Skill, would the output be worse?
4. Score each dimension 1-10 with specific evidence (quote from SKILL.md or test run)
5. **Workflow reproducibility assessment**: For the "工作流质量与可重复性" dimension, consider:
   - Does the Skill produce a complete working result (not just a fragment)?
   - Would the same prompt produce similar quality if run again?
   - Does the workflow include verification/fix loops?
   - Could a developer use the output in a real project without major rework?
6. Calculate total: Σ(score × weight) × ${scaleFactor.toFixed(2)} (capped at 100)
7. Write a judge-report.json with the following schema:
   {
     "version": 1,
     "skill": "${options.skillName}",
     "judged_at": "(ISO datetime)",
     "judge_id": "(your agent name)",
     "scores": [
       { "dimension_id": "structure", "score": <1-10>, "evidence": "..." },
       ...
     ],
     "total_score": <calculated total>,
     "summary": "Overall assessment",
     "test_prompt_results": [
       { "prompt": "...", "result": "quality assessment" }
     ]
   }

You are an independent evaluator. Do not consult the skill author or other judges.
`;
}

export function recordJudgeReport(options: {
  cwd?: string;
  skillName: string;
  evalDir?: string;
  reportPath: string;
}): string {
  const cwd = path.resolve(options.cwd || process.cwd());
  const evalDir = resolveEvalDir(cwd, options.skillName, options.evalDir);
  const cfgPath = path.join(evalDir, "judge-config.json");

  // Validate config exists
  if (!fs.existsSync(cfgPath)) {
    throw new Error(`judge-config.json not found. Run: pnpm skill-eval judge-prep ${options.skillName}`);
  }

  // Read and validate report
  const reportPath = path.resolve(cwd, options.reportPath);
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Report not found: ${reportPath}`);
  }

  let report: JudgeReport;
  try {
    report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
  } catch {
    throw new Error("Invalid JSON in judge report");
  }

  // Schema validation
  const errors: string[] = [];
  if (!report.version || report.version !== 1) errors.push("version must be 1");
  if (!report.skill) errors.push("skill is required");
  if (!report.judged_at) errors.push("judged_at is required");
  if (!Array.isArray(report.scores) || report.scores.length === 0) errors.push("scores required");
  if (typeof report.total_score !== "number") errors.push("total_score is required");

  if (errors.length > 0) {
    throw new Error(`Report validation failed:\n  - ${errors.join("\n  - ")}`);
  }

  // Append to history
  const historyPath = path.join(evalDir, "judge-history.json");
  let history: JudgeReport[] = [];
  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
    } catch { /* ignore corrupt history */ }
  }
  if (!Array.isArray(history)) history = [];
  history.push(report);
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2) + "\n", "utf-8");

  // Print summary
  const dimLabels: Record<string, string> = {};
  const cfg: JudgeConfig = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
  for (const d of cfg.rubric.dimensions) {
    dimLabels[d.id] = d.name;
  }

  const lines = report.scores.map(
    (s) => `  ${dimLabels[s.dimension_id] || s.dimension_id}: ${s.score}/10`,
  );

  return `Judge report recorded for "${report.skill}"
Judge: ${report.judge_id || "anonymous"}
Date: ${report.judged_at}
Total: ${report.total_score}/100

Scores:
${lines.join("\n")}

Summary: ${report.summary || "(none)"}
History: ${historyPath} (${history.length} entries)`;
}

export function installSkillEvalTemplate(
  targetRoot: string,
  forgeRoot: string,
  log: (msg: string) => void,
  force?: boolean,
): void {
  const templateSrc = path.join(forgeRoot, SKILL_EVAL_TEMPLATE_REL);
  const dest = path.join(targetRoot, DEFAULT_FORGE_SKILLS, "_template", "eval");
  if (!fs.existsSync(templateSrc)) {
    log(`  ⚠️  skill-eval template not found: ${templateSrc}`);
    return;
  }
  if (fs.existsSync(dest) && !force) {
    log(`  ⏭️  .forge/skills/_template/eval exists (use --force to overwrite)`);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(templateSrc, dest, { recursive: true, force: true });
  log(`  ✅ ${dest}`);
}

// === Trigger Rate Evaluation ===

export interface TriggerEvalCase {
  id: string;
  prompt: string;
  should_trigger: boolean;
  predicted: boolean | null;
  correct: boolean | null;
}

export interface TriggerEvalResult {
  skillName: string;
  description: string;
  totalCases: number;
  positiveCases: number;
  negativeCases: number;
  correct: number;
  wrong: number;
  triggerRate: number;
  cases: TriggerEvalCase[];
  passed: boolean;
}

/**
 * Extract frontmatter `description` from a SKILL.md file.
 */
function extractDescriptionFromSkillMd(filePath: string): string | null {
  const text = fs.readFileSync(filePath, "utf-8");
  const match = text.match(/^description:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Extract keywords from a description for matching.
 * Strips common words, splits on punctuation/spaces.
 */
function extractKeywords(desc: string): string[] {
  const cleaned = desc
    .toLowerCase()
    .replace(/["'()]/g, "")
    .replace(/[，。、；：]/g, " ");
  const words = cleaned.split(/[\s,]+/).filter(w => w.length >= 2);
  const stopWords = new Set([
    "use", "when", "the", "for", "and", "that", "this", "with", "from",
    "your", "not", "are", "you", "all", "has", "have", "been", "will",
    "can", "its", "say", "says", "said", "report", "reports",
    "getting", "something", "doing", "does", "done",
    "used", "user", "feature", "right", "through", "stage",
    "locates", "cause", "process", "systematic", "debugging",
    "what", "where", "which", "who", "whom", "why", "how",
    "about", "after", "also", "before", "each", "every", "more",
    "must", "need", "needs", "other", "over", "same", "should",
    "some", "such", "than", "their", "them", "then", "there",
    "these", "they", "into", "could", "would", "might",
  ]);
  // Only keep meaningful keywords: Chinese chars (2+) or specific English terms
  const meaningful = words.filter(w => {
    if (stopWords.has(w)) return false;
    if (w.length <= 2) return false;
    // Keep if contains Chinese characters or is a domain-specific English term
    const hasChinese = /[一-鿿]/.test(w);
    return hasChinese || w.length >= 4;
  });
  return [...new Set(meaningful)];
}

function generateTriggerTestQueries(
  skillName: string,
  description: string,
): TriggerEvalCase[] {
  const keywords = extractKeywords(description);
  const cases: TriggerEvalCase[] = [];

  // --- Positive cases (should trigger) ---
  // Derive from description keywords — pick meaningful ones
  const posTriggers = keywords.filter(k => {
    // Filter out negative exclusions like "不适用于"
    if (k.includes("不") || k === "not_" || k.startsWith("not")) return false;
    // Filter out short or generic terms
    if (k.length <= 2) return false;
    // Filter out bigrams that are clearly negative
    if (k.includes("不适用") || k.includes("不应用")) return false;
    return true;
  }).slice(0, 8);

  // Use unique positive triggers
  const posQueries = new Set<string>();
  posQueries.add(`请帮我${skillName.replace(/-/g, "")}`);
  for (const kw of posTriggers.slice(0, 6)) {
    const query = kw.includes("_")
      ? kw.replace("_", " ")
      : `我需要${kw}一下`;
    if (query.length >= 4) posQueries.add(query);
  }
  // Fill remaining with template queries
  const fillQuery = `执行${skillName.replace(/-/g, "")}任务`;
  let fillAttempts = 0;
  while (posQueries.size < 10 && posQueries.size < posTriggers.length + 2 && fillAttempts < 5) {
    posQueries.add(fillQuery);
    fillAttempts++;
  }

  for (const q of posQueries) {
    cases.push({
      id: `pos-${cases.length}`,
      prompt: q,
      should_trigger: true,
      predicted: null,
      correct: null,
    });
  }

  // --- Negative cases (should NOT trigger) ---
  const negQueries: string[] = [
    `写一个fibonacci函数`,
    `解释一下什么是REST API`,
    `帮我算一下1+1等于多少`,
    `hello world`,
    `今天天气怎么样`,
    `帮我推荐一本技术书`,
    `什么是微服务架构`,
    `这段代码的时间复杂度是多少`,
    `帮我理解一下这个算法`,
    `给我讲个笑话`,
  ];

  // Add near-miss negatives based on description keywords
  if (keywords.some(k => k.includes("bug") || k.includes("fix") || k.includes("error") || k.includes("broken"))) {
    negQueries[5] = "帮我review一下这段代码";
    negQueries[6] = "这个功能设计文档写好了吗";
  }
  if (keywords.some(k => k.includes("commit") || k.includes("git"))) {
    negQueries[5] = "帮我写PR描述";
    negQueries[6] = "帮我看看这个branch的提交历史";
  }
  if (keywords.some(k => k.includes("review") || k.includes("代码"))) {
    negQueries[5] = "帮我写一个新功能";
    negQueries[6] = "这个项目的架构设计文档在哪里";
  }
  if (keywords.some(k => k.includes("test") || k.includes("测试"))) {
    negQueries[5] = "帮我部署到生产环境";
    negQueries[6] = "这个API的性能优化方案";
  }

  for (const q of negQueries) {
    if (cases.length >= 20) break;
    cases.push({
      id: `neg-${cases.length}`,
      prompt: q,
      should_trigger: false,
      predicted: null,
      correct: null,
    });
  }

  return cases.slice(0, 20);
}

/**
 * Predict whether a prompt should trigger the skill based on description keyword matching.
 */
function predictTrigger(prompt: string, description: string): boolean {
  const descKeywords = extractKeywords(description);
  const promptLower = prompt.toLowerCase();

  // Check negative exclusion patterns in description
  const negPatterns = description.match(/不适用于[^。.]+/g) || [];
  for (const np of negPatterns) {
    const terms = extractKeywords(np);
    for (const t of terms) {
      if (t.includes("不")) continue; // skip "不" itself
      if (promptLower.includes(t)) return false;
    }
  }

  // Return true if prompt contains any positive keyword from description
  for (const kw of descKeywords) {
    const searchTerm = kw.includes("_") ? kw.replace("_", " ") : kw;
    if (searchTerm.length <= 2) continue;
    if (promptLower.includes(searchTerm)) return true;
    // Check Chinese character overlap
    const chineseChars = searchTerm.match(/[一-鿿]/g);
    if (chineseChars && chineseChars.length >= 2) {
      const allPresent = chineseChars.every(c => promptLower.includes(c));
      if (allPresent) return true;
    }
  }

  return false;
}

export function runTriggerEval(options: {
  cwd?: string;
  skillName: string;
}): TriggerEvalResult {
  const cwd = path.resolve(options.cwd || process.cwd());
  const skillPath = findSkillMd(cwd, options.skillName);

  if (!skillPath) {
    throw new Error(
      `SKILL.md not found for skill "${options.skillName}"\n` +
      `Searched: core/skills/, .claude/skills/, .cursor/rules/skills/, .opencode/skills/, .forge/skills/`,
    );
  }

  const description = extractDescriptionFromSkillMd(skillPath);
  if (!description) {
    throw new Error(`No "description:" field found in SKILL.md frontmatter`);
  }

  const cases = generateTriggerTestQueries(options.skillName, description);
  let correct = 0;
  let wrong = 0;

  for (const c of cases) {
    c.predicted = predictTrigger(c.prompt, description);
    c.correct = c.predicted === c.should_trigger;
    if (c.correct) correct++;
    else wrong++;
  }

  const posCases = cases.filter(c => c.should_trigger).length;
  const negCases = cases.filter(c => !c.should_trigger).length;
  const totalCases = cases.length;
  const triggerRate = totalCases > 0 ? correct / totalCases : 0;

  return {
    skillName: options.skillName,
    description,
    totalCases,
    positiveCases: posCases,
    negativeCases: negCases,
    correct,
    wrong,
    triggerRate,
    cases,
    passed: triggerRate >= 0.8,
  };
}

export function formatTriggerReport(result: TriggerEvalResult): string {
  const lines: string[] = [];
  const pct = Math.round(result.triggerRate * 100);

  lines.push(`# Trigger Rate Report — ${result.skillName}`);
  lines.push(``);
  lines.push(`**Description**: ${result.description}`);
  lines.push(``);
  lines.push(`## Summary`);
  lines.push(``);
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Cases | ${result.totalCases} |`);
  lines.push(`| Positive (should trigger) | ${result.positiveCases} |`);
  lines.push(`| Negative (should NOT trigger) | ${result.negativeCases} |`);
  lines.push(`| Correct | ${result.correct} |`);
  lines.push(`| Wrong | ${result.wrong} |`);
  lines.push(`| Trigger Rate | ${pct}% |`);
  lines.push(``);

  // Progress bar
  const barLen = 20;
  const done = Math.round((pct / 100) * barLen);
  lines.push(`[${"#".repeat(done)}${"-".repeat(barLen - done)}] ${pct}%`);
  lines.push(``);

  // Verdict
  if (pct >= 90) {
    lines.push(`**Verdict**: ✅ Excellent (≥90%)`);
  } else if (pct >= 80) {
    lines.push(`**Verdict**: 👍 Good (≥80%) — consider tightening description for near-misses`);
  } else if (pct >= 60) {
    lines.push(`**Verdict**: ⚠️ Needs improvement (<80%) — review misclassified cases below`);
  } else {
    lines.push(`**Verdict**: ❌ Poor (<60%) — description needs rewrite`);
  }
  lines.push(``);

  // Misclassified cases
  const misclassified = result.cases.filter(c => !c.correct);
  if (misclassified.length > 0) {
    lines.push(`## Misclassified Cases (${misclassified.length})`);
    lines.push(``);
    for (const c of misclassified) {
      const expected = c.should_trigger ? "✅ should trigger" : "❌ should NOT trigger";
      const got = c.predicted ? "→ predicted YES" : "→ predicted NO";
      lines.push(`- **${c.id}**: "${c.prompt}"`);
      lines.push(`  ${expected} ${got}`);
    }
    lines.push(``);

    // Grouped analysis
    const falsePositives = misclassified.filter(c => !c.should_trigger && c.predicted);
    const falseNegatives = misclassified.filter(c => c.should_trigger && !c.predicted);
    if (falsePositives.length > 0) {
      lines.push(`### False Positives (${falsePositives.length}) — description too broad`);
      lines.push(`These prompts triggered but shouldn't have. Add exclusion terms to description:`);
      lines.push(`\`不适用于：${falsePositives.map(c => c.prompt).join("、")}\``);
      lines.push(``);
    }
    if (falseNegatives.length > 0) {
      lines.push(`### False Negatives (${falseNegatives.length}) — description too narrow`);
      lines.push(`These prompts didn't trigger but should have. Add trigger terms to description:`);
      lines.push(`\`触发词补充：${falseNegatives.map(c => c.prompt).join("、")}\``);
      lines.push(``);
    }
  }

  // Correct cases sample
  const correct = result.cases.filter(c => c.correct).slice(0, 5);
  if (correct.length > 0) {
    lines.push(`## Correct Cases (sample ${correct.length}/${result.correct})`);
    for (const c of correct) {
      lines.push(`- ✅ "${c.prompt}" → ${c.should_trigger ? "trigger" : "no trigger"}`);
    }
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(`Recommendation: ${misclassified.length === 0 ? "Description is well-tuned." : `Fix ${misclassified.length} misclassification(s) and re-run.`}`);

  return lines.join("\n");
}

function printHelp(): void {
  console.log(`Usage:
  pnpm skill-eval init <skill-name> [--force]
  pnpm skill-eval <skill-name> [--cwd <dir>] [--eval-dir <path>] [--strict]
  pnpm skill-eval judge-prep <skill-name> [--force]
  pnpm skill-eval judge <skill-name> [--cwd <dir>] [--eval-dir <path>]
  pnpm skill-eval judge-record <skill-name> --report <file> [--cwd <dir>] [--eval-dir <path>]

Static checks: triggers.json + cases.json schema and assertions.
Judge: independent sub-agent evaluation of Skill quality (5-dim rubric).
  judge-prep        Init judge-config.json
  judge             Print structured judge briefing for AI agent
  judge-record      Validate and record completed judge report
Trigger: test description accuracy with auto-generated queries.
  trigger           Generate 20 test queries, test description matching, report rate

Docs: core/docs/skill-eval.md
`);
}

export function parseSkillEvalArgs(argv: string[]): {
  command: "init" | "run" | "judge-prep" | "judge" | "judge-record" | "trigger" | "help";
  skillName: string | null;
  cwd: string;
  evalDir?: string;
  reportPath?: string;
  strict: boolean;
  force: boolean;
} {
  const out = {
    command: "help" as "init" | "run" | "judge-prep" | "judge" | "judge-record" | "trigger" | "help",
    skillName: null as string | null,
    cwd: process.cwd(),
    evalDir: undefined as string | undefined,
    reportPath: undefined as string | undefined,
    strict: false,
    force: false,
  };

  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") return { ...out, command: "help" };
    if (a === "--strict") {
      out.strict = true;
      continue;
    }
    if (a === "--force") {
      out.force = true;
      continue;
    }
    if (a === "--cwd" && argv[i + 1]) {
      out.cwd = argv[++i];
      continue;
    }
    if (a === "--eval-dir" && argv[i + 1]) {
      out.evalDir = argv[++i];
      continue;
    }
    if (a === "--report" && argv[i + 1]) {
      out.reportPath = argv[++i];
      continue;
    }
    rest.push(a);
  }

  if (rest[0] === "init" && rest[1]) {
    out.command = "init";
    out.skillName = rest[1];
  } else if (rest[0] === "judge-prep" && rest[1]) {
    out.command = "judge-prep";
    out.skillName = rest[1];
  } else if (rest[0] === "judge" && rest[1]) {
    out.command = "judge";
    out.skillName = rest[1];
  } else if (rest[0] === "judge-record" && rest[1]) {
    out.command = "judge-record";
    out.skillName = rest[1];
  } else if (rest[0] === "trigger" && rest[1]) {
    out.command = "trigger";
    out.skillName = rest[1];
  } else if (rest[0] && rest[0] !== "init" && !["judge-prep", "judge", "judge-record", "trigger"].includes(rest[0])) {
    out.command = "run";
    out.skillName = rest[0];
  }

  return out;
}

function main(): void {
  const args = parseSkillEvalArgs(process.argv.slice(2));
  if (args.command === "help" || !args.skillName) {
    printHelp();
    process.exit(args.command === "help" ? 0 : 1);
  }

  if (args.command === "init") {
    const dir = initSkillEval(args.skillName, {
      cwd: args.cwd,
      force: args.force,
    });
    console.log(`✅ Skill eval initialized: ${dir}`);
    console.log(`   Edit triggers.json & cases.json, then: pnpm skill-eval ${args.skillName}`);
    return;
  }

  if (args.command === "judge-prep") {
    const dest = initJudgeConfig(args.skillName, {
      cwd: args.cwd,
      force: args.force,
    });
    console.log(`✅ Judge config initialized: ${dest}`);
    console.log(`   Then: pnpm skill-eval judge ${args.skillName}`);
    return;
  }

  if (args.command === "judge") {
    const briefing = generateJudgeBriefing({
      cwd: args.cwd,
      skillName: args.skillName,
      evalDir: args.evalDir,
    });
    console.log(briefing);
    return;
  }

  if (args.command === "judge-record") {
    if (!args.reportPath) {
      console.error("Error: --report <file> is required for judge-record");
      process.exit(1);
    }
    try {
      const result = recordJudgeReport({
        cwd: args.cwd,
        skillName: args.skillName,
        evalDir: args.evalDir,
        reportPath: args.reportPath,
      });
      console.log(result);
    } catch (e: any) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
    return;
  }

  if (args.command === "trigger") {
    const result = runTriggerEval({
      cwd: args.cwd,
      skillName: args.skillName,
    });
    console.log(formatTriggerReport(result));
    process.exit(result.passed ? 0 : 1);
  }

  const result = runSkillEval({
    cwd: args.cwd,
    skillName: args.skillName,
    evalDir: args.evalDir,
    strict: args.strict,
  });
  console.log(formatSkillEvalReport(result));
  process.exit(result.passed ? 0 : 1);
}

if (require.main === module) {
  main();
}
