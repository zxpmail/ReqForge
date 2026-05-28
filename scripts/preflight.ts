/**
 * Forge preflight — release gate checks before publish/deploy.
 *
 * Usage:
 *   pnpm preflight
 *   pnpm preflight --build-dir dist
 *   pnpm preflight --strict
 *
 * Config: .forge/preflight.json (optional; see core/templates/preflight-config.template.json)
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export type Severity = "error" | "warn";

export interface CheckResult {
  id: string;
  severity: Severity;
  ok: boolean;
  message: string;
}

export interface MaxBytesCheck {
  id?: string;
  description?: string;
  file: string;
  max: number;
}

export interface RegexCheck {
  id?: string;
  description?: string;
  file?: string;
  glob?: string;
  mustNotMatch?: string;
  mustMatch?: string;
  flags?: string;
}

export interface PreflightConfig {
  version: 1;
  description?: string;
  envRequired?: string[];
  fileExists?: string[];
  maxBytes?: MaxBytesCheck[];
  regexChecks?: RegexCheck[];
}

export interface PreflightOptions {
  cwd?: string;
  buildDir?: string;
  strict?: boolean;
  allowDirtyGit?: boolean;
  configPath?: string;
}

export const PREFLIGHT_CONFIG_REL = ".forge/preflight.json";

const PRIVACY_PATTERNS: Array<{ id: string; pattern: RegExp; hint: string }> = [
  { id: "privacy-sk-ant", pattern: /sk-ant-/g, hint: "Anthropic API key fragment" },
  { id: "privacy-sk-proj", pattern: /sk-proj-/g, hint: "OpenAI project key fragment" },
  { id: "privacy-env-key", pattern: /ANTHROPIC_API_KEY|OPENAI_API_KEY/g, hint: "API key env name in bundle" },
];

const SENSITIVE_FILENAMES = [".env", ".env.local", ".env.production", "credentials.json"];

export function loadPreflightConfig(cwd: string, configPath?: string): PreflightConfig | null {
  const fp = configPath ?? path.join(cwd, PREFLIGHT_CONFIG_REL);
  if (!fs.existsSync(fp)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(fp, "utf-8")) as PreflightConfig;
    if (raw.version !== 1) {
      throw new Error(`Unsupported preflight config version: ${(raw as PreflightConfig).version}`);
    }
    return raw;
  } catch (err) {
    throw new Error(`Invalid ${fp}: ${err instanceof Error ? err.message : err}`);
  }
}

export function globToRegex(glob: string): RegExp {
  let g = glob.replace(/\\/g, "/");
  g = g.replace(/\*\*\//g, "<<DS>>");
  g = g.replace(/\*\*/g, "<<SS>>");
  g = g.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  g = g.replace(/\*/g, "[^/]+");
  g = g.replace(/<<DS>>/g, "(?:[^/]+/)*");
  g = g.replace(/<<SS>>/g, ".*");
  return new RegExp(`^${g}$`);
}

export function globMatch(glob: string, relPath: string): boolean {
  return globToRegex(glob).test(relPath.replace(/\\/g, "/"));
}

function listAllFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const files: string[] = [];
  const walk = (dir: string, rel: string) => {
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      const relPath = rel ? `${rel}/${name.name}` : name.name;
      const full = path.join(dir, name.name);
      if (name.isDirectory()) {
        if (name.name !== "node_modules" && name.name !== ".git") walk(full, relPath);
      } else {
        files.push(full);
      }
    }
  };
  walk(root, "");
  return files;
}

export function collectFiles(root: string, glob?: string): string[] {
  if (!glob) return listAllFiles(root);
  if (!glob.includes("*") && !glob.includes("?")) {
    const single = path.join(root, glob);
    return fs.existsSync(single) ? [single] : [];
  }
  return listAllFiles(root).filter((f) =>
    globMatch(glob, path.relative(root, f).replace(/\\/g, "/")),
  );
}

function checkGitClean(cwd: string, allowDirty: boolean): CheckResult {
  const id = "git-clean";
  try {
    const out = execSync("git status --porcelain", { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (!out) return { id, severity: "error", ok: true, message: "Working tree clean" };
    const msg = `Uncommitted changes:\n${out.split("\n").slice(0, 8).join("\n")}${out.split("\n").length > 8 ? "\n..." : ""}`;
    if (allowDirty) return { id, severity: "warn", ok: true, message: msg };
    return { id, severity: "error", ok: false, message: msg };
  } catch {
    return { id, severity: "warn", ok: true, message: "Not a git repo — skipped" };
  }
}

function checkPackageVersion(cwd: string): CheckResult {
  const id = "package-version";
  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return { id, severity: "warn", ok: true, message: "No package.json — skipped" };
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as { version?: string };
  if (!pkg.version) {
    return { id, severity: "error", ok: false, message: "package.json missing version field" };
  }
  return { id, severity: "error", ok: true, message: `version=${pkg.version}` };
}

function scanBuildDirPrivacy(buildDir: string): CheckResult[] {
  const results: CheckResult[] = [];
  if (!fs.existsSync(buildDir)) {
    return [{ id: "build-dir", severity: "error", ok: false, message: `Build dir not found: ${buildDir}` }];
  }

  for (const name of SENSITIVE_FILENAMES) {
    const hits = collectFiles(buildDir).filter((f) => path.basename(f) === name || f.endsWith(name));
    results.push({
      id: `no-${name.replace(/\./g, "-")}`,
      severity: "error",
      ok: hits.length === 0,
      message: hits.length === 0 ? `No ${name} in build output` : `Found ${name}: ${hits[0]}`,
    });
  }

  const textFiles = collectFiles(buildDir).filter((f) => /\.(js|mjs|cjs|html|json|css)$/i.test(f));
  for (const { id, pattern, hint } of PRIVACY_PATTERNS) {
    let found = false;
    let where = "";
    for (const file of textFiles) {
      const content = fs.readFileSync(file, "utf-8");
      if (pattern.test(content)) {
        found = true;
        where = path.relative(buildDir, file);
        break;
      }
      pattern.lastIndex = 0;
    }
    results.push({
      id,
      severity: "error",
      ok: !found,
      message: found ? `${hint} in ${where}` : `No ${hint} in build output`,
    });
  }

  const userPathPattern = process.platform === "win32" ? /C:\\Users\\/i : /\/Users\//;
  let pathLeak = false;
  let pathFile = "";
  for (const file of textFiles) {
    if (userPathPattern.test(fs.readFileSync(file, "utf-8"))) {
      pathLeak = true;
      pathFile = path.relative(buildDir, file);
      break;
    }
  }
  results.push({
    id: "privacy-dev-path",
    severity: "error",
    ok: !pathLeak,
    message: pathLeak ? `Developer path in ${pathFile}` : "No developer home paths in build output",
  });

  return results;
}

function runConfigChecks(cwd: string, config: PreflightConfig): CheckResult[] {
  const results: CheckResult[] = [];

  for (const envName of config.envRequired ?? []) {
    const id = `env-${envName}`;
    const val = process.env[envName];
    results.push({
      id,
      severity: "error",
      ok: Boolean(val && val.length > 0),
      message: val ? `${envName} is set` : `Missing env: ${envName}`,
    });
  }

  for (const rel of config.fileExists ?? []) {
    const id = `file-exists-${rel}`;
    const fp = path.join(cwd, rel);
    results.push({
      id,
      severity: "error",
      ok: fs.existsSync(fp),
      message: fs.existsSync(fp) ? `Found ${rel}` : `Missing file: ${rel}`,
    });
  }

  for (const check of config.maxBytes ?? []) {
    const id = check.id ?? `max-bytes-${check.file}`;
    const fp = path.join(cwd, check.file);
    if (!fs.existsSync(fp)) {
      results.push({ id, severity: "error", ok: false, message: `File not found: ${check.file}` });
      continue;
    }
    const buf = fs.readFileSync(fp);
    const size = Buffer.byteLength(buf);
    const ok = size <= check.max;
    results.push({
      id,
      severity: "error",
      ok,
      message: ok
        ? `${check.file}: ${size} bytes (max ${check.max})`
        : `${check.description ?? check.file}: ${size} bytes exceeds max ${check.max}`,
    });
  }

  for (const check of config.regexChecks ?? []) {
    const id = check.id ?? `regex-${check.file ?? check.glob}`;
    const targets = check.file
      ? [path.join(cwd, check.file)]
      : collectFiles(cwd, check.glob);
    if (targets.length === 0) {
      results.push({ id, severity: "warn", ok: true, message: `No files matched: ${check.file ?? check.glob}` });
      continue;
    }
    const reNot = check.mustNotMatch ? new RegExp(check.mustNotMatch, check.flags ?? "m") : null;
    const reMust = check.mustMatch ? new RegExp(check.mustMatch, check.flags ?? "m") : null;
    let failed = false;
    let detail = "";
    for (const fp of targets) {
      const content = fs.readFileSync(fp, "utf-8");
      const rel = path.relative(cwd, fp);
      if (reNot && reNot.test(content)) {
        failed = true;
        detail = `${rel} matches forbidden pattern`;
        break;
      }
      if (reMust && !reMust.test(content)) {
        failed = true;
        detail = `${rel} missing required pattern`;
        break;
      }
    }
    results.push({
      id,
      severity: "error",
      ok: !failed,
      message: failed ? detail : check.description ?? `Regex OK (${targets.length} file(s))`,
    });
  }

  return results;
}

export function runPreflight(options: PreflightOptions = {}): {
  results: CheckResult[];
  passed: boolean;
  errorCount: number;
  warnCount: number;
} {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const results: CheckResult[] = [];

  results.push(checkGitClean(cwd, options.allowDirtyGit ?? false));
  results.push(checkPackageVersion(cwd));

  if (options.buildDir) {
    const buildAbs = path.isAbsolute(options.buildDir)
      ? options.buildDir
      : path.join(cwd, options.buildDir);
    results.push(...scanBuildDirPrivacy(buildAbs));
  }

  const config = loadPreflightConfig(cwd, options.configPath);
  if (config) {
    results.push(...runConfigChecks(cwd, config));
  } else {
    results.push({
      id: "preflight-config",
      severity: "warn",
      ok: true,
      message: `No ${PREFLIGHT_CONFIG_REL} — built-in checks only`,
    });
  }

  let errorCount = 0;
  let warnCount = 0;
  for (const r of results) {
    if (r.ok) continue;
    if (r.severity === "warn" && !options.strict) {
      warnCount++;
      continue;
    }
    errorCount++;
  }

  const passed = errorCount === 0;
  return { results, passed, errorCount, warnCount };
}

export function formatReport(results: CheckResult[], passed: boolean, errorCount: number, warnCount: number): string {
  const lines = ["Preflight Report", "================", ""];
  for (const r of results) {
    const icon = r.ok ? "✅" : r.severity === "warn" ? "⚠️" : "❌";
    lines.push(`${icon} ${r.id}: ${r.message}`);
  }
  lines.push("");
  lines.push(
    passed
      ? `Result: PASSED${warnCount ? ` (${warnCount} warning(s))` : ""}`
      : `Result: BLOCKED (${errorCount} error(s), ${warnCount} warning(s))`,
  );
  return lines.join("\n");
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage:
  pnpm preflight [options]

Options:
  --build-dir <dir>   Scan build output for secrets/paths (privacy gate)
  --strict            Treat warnings as errors
  --allow-dirty-git   Do not fail on uncommitted changes (warn only)
  --cwd <dir>         Project root (default: process.cwd())
  --config <path>     Override preflight.json path

Config:
  Copy core/templates/preflight-config.template.json → .forge/preflight.json
  WeChat example: core/templates/preflight-wechat.example.json
`);
    return;
  }

  const opts: PreflightOptions = { cwd: process.cwd() };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--strict") opts.strict = true;
    else if (a === "--allow-dirty-git") opts.allowDirtyGit = true;
    else if (a === "--build-dir") opts.buildDir = args[++i];
    else if (a === "--cwd") opts.cwd = args[++i];
    else if (a === "--config") opts.configPath = args[++i];
    else throw new Error(`Unknown option: ${a}`);
  }

  try {
    const { results, passed, errorCount, warnCount } = runPreflight(opts);
    console.log(formatReport(results, passed, errorCount, warnCount));
    process.exit(passed ? 0 : 1);
  } catch (err) {
    console.error(`❌ ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
