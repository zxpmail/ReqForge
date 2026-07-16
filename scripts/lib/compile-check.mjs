/**
 * Language-aware compile / typecheck probe shared by forge-verify and forge-bug-fix.
 *
 * Order: .forge/dev-map.md Build|Compile|Typecheck → package.json scripts
 *        (typecheck|tsc|compile) → tsconfig / go.mod / python fallbacks.
 *
 * @param {string} root project root
 * @param {{ execSync?: typeof import("child_process").execSync }} [opts]
 * @returns {string} human detail ("… clean" or "skip …")
 * @throws {Error} when a detected compile command fails
 */
import { execSync as defaultExecSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export function checkCompile(root, opts = {}) {
  const execSync = opts.execSync ?? defaultExecSync;

  const runCmd = (cmd, label) => {
    execSync(cmd, {
      cwd: root,
      encoding: "utf-8",
      timeout: 120000,
      stdio: "pipe",
      shell: true,
    });
    return `${label} clean`;
  };

  const devMapPath = join(root, ".forge/dev-map.md");
  if (existsSync(devMapPath)) {
    const text = readFileSync(devMapPath, "utf-8");
    const m = text.match(
      /(?:^|\n)\s*(?:Build|Compile|Typecheck|构建|编译)\s*[:|：]\s*`?([^\n`]+)`?/i,
    );
    if (m) {
      const cmd = m[1].trim();
      if (cmd && !/^tbd/i.test(cmd) && cmd.length < 200) {
        return runCmd(cmd, cmd);
      }
    }
  }

  const pkgPath = join(root, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      for (const key of ["typecheck", "tsc", "compile"]) {
        if (pkg.scripts?.[key]) {
          return runCmd(`pnpm run ${key}`, `pnpm run ${key}`);
        }
      }
    } catch {
      /* fall through */
    }
  }

  if (existsSync(join(root, "tsconfig.json"))) {
    return runCmd("npx tsc --noEmit", "tsc --noEmit");
  }
  if (existsSync(join(root, "go.mod"))) {
    return runCmd("go build ./...", "go build ./...");
  }
  if (existsSync(join(root, "pyproject.toml")) || existsSync(join(root, "setup.py"))) {
    return runCmd("python -m compileall -q .", "python -m compileall");
  }
  return "skip (no compile command detected)";
}

/**
 * Best-effort: never throws. Returns { ok, detail, skipped, output }.
 * `output` is stderr/stdout when failed.
 */
export function tryCompile(root, opts = {}) {
  const execSync = opts.execSync ?? defaultExecSync;
  try {
    const detail = checkCompile(root, { execSync });
    const skipped = detail.startsWith("skip");
    return { ok: true, detail, skipped, output: "" };
  } catch (e) {
    const output = [e.stdout, e.stderr, e.message].filter(Boolean).join("\n").trim();
    return { ok: false, detail: "compile failed", skipped: false, output };
  }
}
