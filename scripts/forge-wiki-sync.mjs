#!/usr/bin/env node
/**
 * forge-wiki-sync.mjs — 将 docs/github-wiki/ 源稿同步到 GitHub Wiki 独立 git 仓库
 *
 * 用法：
 *   pnpm forge-wiki-sync              # 复制 Home.md 等并 push 到 origin Wiki 仓库
 *   pnpm forge-wiki-sync --dry-run    # 仅预览 diff，不 commit/push
 *   pnpm forge-wiki-sync --no-push    # 本地 wiki clone 内 commit，不 push
 *
 * 源稿目录：docs/github-wiki/（跳过 README.md — 仅维护者说明）
 * 本地 clone：.forge/wiki-clone/（已 gitignore）
 */

import { execSync } from "child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SOURCE_DIR = join(ROOT, "docs", "github-wiki");
const CLONE_DIR = join(ROOT, ".forge", "wiki-clone");
const SKIP_FILES = new Set(["README.md"]);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const noPush = args.includes("--no-push");

/** @param {string} remote */
export function parseRemoteToWikiUrl(remote) {
  const trimmed = remote.trim();
  let owner;
  let repo;

  const ssh = trimmed.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
  if (ssh) {
    owner = ssh[1];
    repo = ssh[2];
  } else {
    const https = trimmed.match(/^https?:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?\/?$/);
    if (!https) throw new Error(`无法解析 git remote: ${remote}`);
    owner = https[1];
    repo = https[2];
  }

  if (repo.endsWith(".wiki")) repo = repo.slice(0, -5);
  return `https://github.com/${owner}/${repo}.wiki.git`;
}

function run(cmd, cwd = ROOT) {
  return execSync(cmd, { cwd, encoding: "utf-8", timeout: 120000, stdio: dryRun ? "pipe" : "inherit" });
}

function runCapture(cmd, cwd = ROOT) {
  return execSync(cmd, { cwd, encoding: "utf-8", timeout: 120000, stdio: "pipe" }).trim();
}

function getWikiUrl() {
  const idx = args.indexOf("--wiki-url");
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];

  let remote;
  try {
    remote = runCapture("git remote get-url origin");
  } catch {
    throw new Error("未找到 origin remote；请在本仓库根目录运行，或传入 --wiki-url");
  }
  return parseRemoteToWikiUrl(remote);
}

function listSourcePages() {
  if (!existsSync(SOURCE_DIR)) throw new Error(`源稿目录不存在: ${SOURCE_DIR}`);
  return readdirSync(SOURCE_DIR).filter((f) => f.endsWith(".md") && !SKIP_FILES.has(f));
}

function ensureClone(wikiUrl) {
  mkdirSync(join(ROOT, ".forge"), { recursive: true });
  if (!existsSync(CLONE_DIR)) {
    console.log(`▸ clone ${wikiUrl}`);
    if (dryRun) {
      console.log("  (dry-run: 跳过 clone)");
      return false;
    }
    run(`git clone "${wikiUrl}" "${CLONE_DIR}"`);
    return true;
  }

  console.log("▸ pull wiki clone");
  if (dryRun) {
    console.log("  (dry-run: 跳过 pull)");
    return true;
  }
  run("git pull --ff-only", CLONE_DIR);
  return true;
}

function copySources() {
  const pages = listSourcePages();
  if (pages.length === 0) throw new Error("docs/github-wiki/ 下没有可同步的 .md 页面");

  console.log(`▸ 复制 ${pages.length} 个页面 → .forge/wiki-clone/`);
  for (const name of pages) {
    const src = join(SOURCE_DIR, name);
    const dest = join(CLONE_DIR, name);
    if (dryRun && !existsSync(CLONE_DIR)) {
      console.log(`  ${name} (dry-run: clone 不存在，跳过写入)`);
      continue;
    }
    if (dryRun) {
      const wouldChange =
        !existsSync(dest) || readFileSync(dest, "utf-8") !== readFileSync(src, "utf-8");
      console.log(`  ${name} ${wouldChange ? "(有变更)" : "(无变更)"}`);
      if (wouldChange && existsSync(dest)) {
        try {
          const diff = runCapture(`git diff --no-index -- "${dest}" "${src}"`, CLONE_DIR);
          if (diff) console.log(diff.split("\n").slice(0, 40).join("\n"));
        } catch {
          console.log(`  (新文件)`);
        }
      }
      continue;
    }
    copyFileSync(src, dest);
    console.log(`  ${name}`);
  }
  return pages;
}

function commitAndPush(pages) {
  if (dryRun) {
    console.log("\n✓ dry-run 完成（未 commit/push）");
    return;
  }

  const status = runCapture("git status --porcelain", CLONE_DIR);
  if (!status) {
    console.log("\n✓ Wiki 已是最新，无需提交");
    return;
  }

  const version = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")).version;
  const msgIdx = args.indexOf("--message");
  const message =
    msgIdx !== -1 && args[msgIdx + 1]
      ? args[msgIdx + 1]
      : `sync wiki from docs/github-wiki @ v${version}`;

  run("git add -A", CLONE_DIR);
  run(`git commit -m ${JSON.stringify(message)}`, CLONE_DIR);

  if (noPush) {
    console.log("\n✓ 已 commit（--no-push，未 push）");
    return;
  }

  run("git push origin HEAD", CLONE_DIR);
  console.log("\n✓ Wiki 已 push");
  console.log(`  页面: ${pages.join(", ")}`);
}

function main() {
  const wikiUrl = getWikiUrl();
  console.log(`forge-wiki-sync → ${wikiUrl}\n`);

  ensureClone(wikiUrl);
  const pages = copySources();
  commitAndPush(pages);
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  try {
    main();
  } catch (e) {
    console.error(`forge-wiki-sync error: ${e.message}`);
    process.exit(1);
  }
}
