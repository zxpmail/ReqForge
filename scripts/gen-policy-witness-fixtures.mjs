#!/usr/bin/env node
/**
 * 一次性生成 .forge/policy-version.json 的 root 与 3/4 见证收据夹具。
 * 用法: node scripts/gen-policy-witness-fixtures.mjs
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const forgeDir = path.join(ROOT, ".forge");

const policyPath = path.join(forgeDir, "policy-version.json");
const keysPath = path.join(forgeDir, "witness-dev-keys.json");
const receiptDir = path.join(forgeDir, "witness-receipts");

const policy = JSON.parse(fs.readFileSync(policyPath, "utf8"));
const keysDoc = JSON.parse(fs.readFileSync(keysPath, "utf8"));

const root = crypto
  .createHash("sha256")
  .update(`${policy.minimum}|${policy.artifact_digest}|${policy.tree_size}`)
  .digest("hex");
policy.root = root;
fs.writeFileSync(policyPath, JSON.stringify(policy, null, 2) + "\n");

fs.mkdirSync(receiptDir, { recursive: true });
for (const id of ["W1", "W2", "W3"]) {
  const msg = `${root}|${policy.tree_size}`;
  const signature = crypto
    .createHmac("sha256", keysDoc.keys[id])
    .update(msg)
    .digest("hex");
  const receipt = {
    witness_id: id,
    root,
    tree_size: policy.tree_size,
    signature,
  };
  fs.writeFileSync(
    path.join(receiptDir, `${id}.json`),
    JSON.stringify(receipt, null, 2) + "\n"
  );
}

console.log(`root=${root}`);
console.log(`wrote ${receiptDir} (W1 W2 W3; W4 unused → 3-of-4)`);

