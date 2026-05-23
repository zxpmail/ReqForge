#!/usr/bin/env node
/**
 * set-github-metadata.mjs — 将 .github/repo-metadata.json 同步到 GitHub 仓库 About
 *
 * 需要环境变量 GITHUB_TOKEN 或 GH_TOKEN（repo 权限）。
 *
 * Usage:
 *   node scripts/set-github-metadata.mjs
 *   node scripts/set-github-metadata.mjs --dry-run
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = process.env.GITHUB_REPOSITORY || "zxpmail/ReqForge";
const dryRun = process.argv.includes("--dry-run");

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
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

  if (!token) {
    console.error(
      "\n缺少 GITHUB_TOKEN 或 GH_TOKEN。请在 GitHub → Settings → Developer settings 创建 PAT，然后："
    );
    console.error('  $env:GITHUB_TOKEN="ghp_..."; node scripts/set-github-metadata.mjs');
    console.error("\n或手动在仓库 About 填写 .github/repo-metadata.json 中的 description 与 topics。");
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
    console.error(`PATCH repo failed: ${res.status} ${await res.text()}`);
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
    console.error(`PUT topics failed: ${topicRes.status} ${await topicRes.text()}`);
    process.exit(1);
  }
  console.log("✅ Topics updated.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
