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

function printHelp(): void {
  console.log(`Usage:
  pnpm skill-eval init <skill-name> [--force]
  pnpm skill-eval <skill-name> [--cwd <dir>] [--eval-dir <path>] [--strict]

Static checks for .forge/skills/<name>/eval/ (triggers.json + cases.json).
Trigger accuracy still requires manual runs in your AI client.

Docs: core/docs/skill-eval.md
`);
}

export function parseSkillEvalArgs(argv: string[]): {
  command: "init" | "run" | "help";
  skillName: string | null;
  cwd: string;
  evalDir?: string;
  strict: boolean;
  force: boolean;
} {
  const out = {
    command: "help" as "init" | "run" | "help",
    skillName: null as string | null,
    cwd: process.cwd(),
    evalDir: undefined as string | undefined,
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
    rest.push(a);
  }

  if (rest[0] === "init" && rest[1]) {
    out.command = "init";
    out.skillName = rest[1];
  } else if (rest[0] && rest[0] !== "init") {
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
