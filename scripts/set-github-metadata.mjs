#!/usr/bin/env node
/**
 * set-github-metadata.mjs — 将 .github/repo-metadata.json 同步到 GitHub 仓库 About
 *
 * 需要环境变量 GITHUB_TOKEN 或 GH_TOKEN（repo 权限）。
 *
 * Usage:
 *   node scripts/set-github-metadata.mjs
 *   node scripts/set-github-metadata.mjs --dry-run
 *   node scripts/set-github-metadata.mjs --token-file .env.local
 *
 * Token（任选其一，推荐 .env.local）:
 *   - 环境变量 GITHUB_TOKEN 或 GH_TOKEN
 *   - 项目根目录 .env.local 一行: GITHUB_TOKEN=ghp_...
 *   - --token-file <path>  文件内为 token 或 GITHUB_TOKEN=...
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = process.env.GITHUB_REPOSITORY || "zxpmail/ReqForge";
const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");

function readTokenFromFile(filePath) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
  if (!fs.existsSync(abs)) return null;
  const raw = fs.readFileSync(abs, "utf-8").trim();
  const line = raw.split(/\r?\n/).find((l) => l.trim() && !l.trim().startsWith("#"));
  if (!line) return null;
  const m = line.match(/^(?:GITHUB_TOKEN|GH_TOKEN)\s*=\s*(.+)$/i);
  if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  return line.replace(/^["']|["']$/g, "");
}

function readTokenFromEnvLocal() {
  return readTokenFromFile(".env.local");
}

function resolveToken() {
  const envTok = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (envTok) return envTok;

  const tfIdx = argv.indexOf("--token-file");
  if (tfIdx !== -1 && argv[tfIdx + 1]) {
    const fromFile = readTokenFromFile(argv[tfIdx + 1]);
    if (fromFile) return fromFile;
  }

  const tIdx = argv.indexOf("--token");
  if (tIdx !== -1 && argv[tIdx + 1]) return argv[tIdx + 1];

  return readTokenFromEnvLocal();
}

let token = resolveToken();
if (token) {
  token = token.trim().replace(/\s+/g, "");
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    token = token.slice(1, -1);
  }
}

function validateTokenShape(tok) {
  if (!tok || tok.length < 20) return "令牌过短或为空，请检查 .env.local";
  if (/^ghp_/i.test(tok) || /^github_pat_/i.test(tok) || /^gho_/i.test(tok)) return null;
  return "令牌格式不像 GitHub PAT（应以 ghp_ 或 github_pat_ 开头）";
}

const metaPath = path.join(ROOT, ".github", "repo-metadata.json");
const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

async function main() {
  console.log(`Repository: ${REPO}`);
  console.log(`Description: ${meta.description}`);
  console.log(`Topics (${meta.topics.length}): ${meta.topics.join(", ")}`);
  if (meta.homepage) console.log(`Homepage: ${meta.homepage}`);

  if (dryRun) {
    console.log("\n[DRY RUN] No API call.");
    return;
  }

  const shapeErr = token ? validateTokenShape(token) : null;
  if (!token) {
    console.error("\n缺少 GitHub Token。任选一种方式：\n");
    console.error("【推荐】在项目根目录创建 .env.local（已 gitignore），仅一行：");
    console.error("  GITHUB_TOKEN=ghp_你的令牌");
    console.error("然后执行: pnpm set-github-metadata\n");
    console.error("【CMD】当前窗口临时设置：");
    console.error("  set GITHUB_TOKEN=ghp_你的令牌");
    console.error("  node scripts\\set-github-metadata.mjs\n");
    console.error("【PowerShell】一行执行（注意用英文引号）：");
    console.error('  $env:GITHUB_TOKEN="ghp_你的令牌"; node scripts/set-github-metadata.mjs\n');
    console.error("或手动在 GitHub 仓库 Settings → 填写 About（见 .github/repo-metadata.json）。");
    process.exit(1);
  }
  if (shapeErr) {
    console.error(`\n${shapeErr}\n`);
    process.exit(1);
  }

  const body = {
    description: meta.description,
    homepage: meta.homepage || undefined,
  };

  const res = await fetch(`https://api.github.com/repos/${REPO}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`PATCH repo failed: ${res.status} ${errBody}`);
    if (res.status === 401) {
      console.error(`
401 Bad credentials — 常见原因：
  1. .env.local 里令牌错误或已过期（到 GitHub → Settings → Developer settings 重新生成）
  2. 行首多了引号/空格，应为：GITHUB_TOKEN=ghp_xxxx（不要包一层引号，除非整个值用英文引号）
  3. Fine-grained 令牌未勾选仓库 zxpmail/ReqForge，或未给 Metadata: Read and write
  4. Classic 令牌未勾选 repo（或 public_repo，若仓库为公开可试 public_repo）
  5. 复制时多了换行 — 确保 .env.local 只有一行 GITHUB_TOKEN=
`);
    }
    process.exit(1);
  }
  console.log("\n✅ Description / homepage updated.");

  const topicRes = await fetch(`https://api.github.com/repos/${REPO}/topics`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ names: meta.topics }),
  });

  if (!topicRes.ok) {
    const errBody = await topicRes.text();
    console.error(`PUT topics failed: ${topicRes.status} ${errBody}`);
    if (topicRes.status === 403 && errBody.includes("topic")) {
      console.error("Topics 可能需要 Classic PAT 的 repo 权限，或 Fine-grained 的 Administration 写权限。");
    }
    process.exit(1);
  }
  console.log("✅ Topics updated.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
