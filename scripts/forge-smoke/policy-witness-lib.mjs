/**
 * policy-witness-lib.mjs — 政策见证验签/铸造共用（smoke + 自签旁路夹具）
 *
 * DEV HMAC 仅可复现。密钥与验证器同仓时，PR 可自铸法定人数——见
 * scripts/__tests__/policy-witness-self-authorship.test.ts
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..", "..");
export const FORGE_DIR = path.join(ROOT, ".forge");

export function computeRoot(policy) {
  return crypto
    .createHash("sha256")
    .update(`${policy.minimum}|${policy.artifact_digest}|${policy.tree_size}`)
    .digest("hex");
}

export function mintReceipt(witnessId, key, root, treeSize) {
  const msg = `${root}|${treeSize}`;
  const signature = crypto.createHmac("sha256", key).update(msg).digest("hex");
  return { witness_id: witnessId, root, tree_size: treeSize, signature };
}

export function verifyReceipt(receipt, keys, treeSize) {
  const key = keys[receipt.witness_id];
  if (!key) return false;
  if (receipt.tree_size !== treeSize) return false;
  const msg = `${receipt.root}|${receipt.tree_size}`;
  const expected = crypto.createHmac("sha256", key).update(msg).digest("hex");
  return expected === receipt.signature;
}

/**
 * 与 smoke 相同的法定人数判定：钉住 policy.root 的有效收据数 ≥ q
 */
export function quorumMet(policy, witnessSet, keys, receipts) {
  const expectedRoot = computeRoot(policy);
  if (policy.root !== expectedRoot) return { ok: false, reason: "root_mismatch", count: 0 };

  const seen = new Set();
  let count = 0;
  const roots = new Set();
  for (const receipt of receipts) {
    if (!verifyReceipt(receipt, keys, policy.tree_size)) continue;
    roots.add(receipt.root);
    if (receipt.root !== policy.root) continue;
    if (seen.has(receipt.witness_id)) continue;
    if (!witnessSet.witnesses.includes(receipt.witness_id)) continue;
    seen.add(receipt.witness_id);
    count++;
  }
  if (roots.size > 1) return { ok: false, reason: "equivocation", count, roots: [...roots] };
  return {
    ok: count >= witnessSet.q,
    reason: count >= witnessSet.q ? "quorum_met" : "quorum_unmet",
    count,
    q: witnessSet.q,
  };
}

export function loadLiveFixtures() {
  const policy = JSON.parse(
    fs.readFileSync(path.join(FORGE_DIR, "policy-version.json"), "utf8")
  );
  const witnessSet = JSON.parse(
    fs.readFileSync(path.join(FORGE_DIR, "witness-set.json"), "utf8")
  );
  const keysDoc = JSON.parse(
    fs.readFileSync(path.join(FORGE_DIR, "witness-dev-keys.json"), "utf8")
  );
  return { policy, witnessSet, keys: keysDoc.keys };
}
