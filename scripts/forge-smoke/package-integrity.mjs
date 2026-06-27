#!/usr/bin/env node
/**
 * package-integrity — 验证 package.json 结构 + files/bin 白名单存在 + scripts 引用有效
 * 无需 npm registry，不产生网络请求。
 */
import fs from "fs";
import path from "path";
import { ROOT, createRunner } from "./lib.mjs";

const r = createRunner("package-integrity");

// ── 1. package.json 结构 ──

const pkgPath = path.join(ROOT, "package.json");
r.assert(fs.existsSync(pkgPath), "package.json missing");

let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
} catch (e) {
  r.fail(`package.json invalid JSON: ${e.message}`);
  process.exit(1);
}

r.assert(typeof pkg.name === "string" && pkg.name.length > 0, "package.json missing name");
r.assert(typeof pkg.version === "string" && /^\d+\.\d+\.\d+$/.test(pkg.version), "package.json version must be semver");
r.assert(typeof pkg.description === "string" && pkg.description.length > 0, "package.json missing description");
r.assert(typeof pkg.license === "string", "package.json missing license");
r.assert(typeof pkg.scripts === "object" && !Array.isArray(pkg.scripts), "package.json scripts must be an object");
r.assert(Object.keys(pkg.scripts).length > 0, "package.json scripts is empty");

// ── 2. scripts 引用真实文件（node scripts/... 模式） ──

let scriptChecks = 0;
for (const [name, script] of Object.entries(pkg.scripts)) {
  const match = typeof script === "string" ? script.match(/^node (scripts\/\S+)/) : null;
  if (match) {
    const scriptPath = path.join(ROOT, match[1]);
    r.assert(fs.existsSync(scriptPath), `script '${name}' target '${match[1]}' not found`);
    scriptChecks++;
  }
}
// ${scriptChecks} script file references verified

// ── 3. forge-hooks 引用真实文件 ──

let hookChecks = 0;
if (pkg["forge-hooks"]) {
  for (const [event, hookPaths] of Object.entries(pkg["forge-hooks"])) {
    const paths = Array.isArray(hookPaths) ? hookPaths : [hookPaths];
    for (const hp of paths) {
      const abs = path.join(ROOT, hp);
      r.assert(fs.existsSync(abs), `forge-hooks.${event}: '${hp}' not found`);
      hookChecks++;
    }
  }
}
// ${hookChecks} forge-hooks references verified

// ── 4. bin 入口存在 ──

let binChecks = 0;
if (pkg.bin) {
  if (typeof pkg.bin === "string") {
    r.assert(fs.existsSync(path.join(ROOT, pkg.bin)), `bin entry '${pkg.bin}' not found`);
    binChecks++;
  } else if (typeof pkg.bin === "object") {
    for (const [name, binPath] of Object.entries(pkg.bin)) {
      r.assert(fs.existsSync(path.join(ROOT, binPath)), `bin.${name}: '${binPath}' not found`);
      binChecks++;
    }
  }
}
// ${binChecks} bin entries verified

// ── 5. files 白名单目录/文件存在 ──

let filesChecks = 0;
if (Array.isArray(pkg.files)) {
  for (const entry of pkg.files) {
    const abs = path.join(ROOT, entry);
    r.assert(fs.existsSync(abs), `files entry '${entry}' not found`);
    filesChecks++;
  }
}
// ${filesChecks} files whitelist entries verified

r.finish();
