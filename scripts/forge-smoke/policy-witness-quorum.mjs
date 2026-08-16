#!/usr/bin/env node
/**
 * policy-witness-quorum — 政策版本须凑齐 3-of-4 见证收据才准入（发版守门）
 *
 * 对应 Peter 交点条件：f=1 → n=4,q=3。DEV HMAC 钥仅用于 CI 可复现，非生产信任。
 * 缺收据 / 验签失败 / 出现第二根收据 → exit 1（挡绿）。
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { ROOT, createRunner } from "./lib.mjs";

const r = createRunner("policy-witness-quorum");

const forgeDir = path.join(ROOT, ".forge");
const policyPath = path.join(forgeDir, "policy-version.json");
const setPath = path.join(forgeDir, "witness-set.json");
const keysPath = path.join(forgeDir, "witness-dev-keys.json");
const receiptDir = path.join(forgeDir, "witness-receipts");

r.assert(fs.existsSync(policyPath), ".forge/policy-version.json missing");
r.assert(fs.existsSync(setPath), ".forge/witness-set.json missing");
r.assert(fs.existsSync(keysPath), ".forge/witness-dev-keys.json missing");
r.assert(fs.existsSync(receiptDir), ".forge/witness-receipts/ missing");

let policy;
let witnessSet;
let keysDoc;
try {
  policy = JSON.parse(fs.readFileSync(policyPath, "utf8"));
  witnessSet = JSON.parse(fs.readFileSync(setPath, "utf8"));
  keysDoc = JSON.parse(fs.readFileSync(keysPath, "utf8"));
} catch (e) {
  r.fail(`policy/witness JSON parse error: ${e.message}`);
  r.finish();
}

r.assert(
  typeof policy.root === "string" && policy.root.length === 64,
  "policy.root must be 64-char hex"
);
r.assert(
  Number.isInteger(policy.tree_size) && policy.tree_size >= 1,
  "policy.tree_size must be positive int"
);
r.assert(
  Number.isInteger(policy.minimum) && policy.minimum >= 1,
  "policy.minimum must be positive int"
);

const expectedRoot = crypto
  .createHash("sha256")
  .update(`${policy.minimum}|${policy.artifact_digest}|${policy.tree_size}`)
  .digest("hex");
r.assert(
  policy.root === expectedRoot,
  `policy.root mismatch (got ${policy.root.slice(0, 12)}… want ${expectedRoot.slice(0, 12)}…)`
);

r.assert(witnessSet.n === 4 && witnessSet.q === 3, "witness-set must be n=4 q=3 (f=1)");
r.assert(
  Array.isArray(witnessSet.witnesses) && witnessSet.witnesses.length === 4,
  "witness-set.witnesses must list 4 ids"
);
r.assert(keysDoc.dev_only === true, "witness-dev-keys must set dev_only:true");

const keys = keysDoc.keys || {};
for (const id of witnessSet.witnesses) {
  r.assert(typeof keys[id] === "string" && keys[id].length > 0, `missing key for ${id}`);
}

const files = fs
  .readdirSync(receiptDir)
  .filter((f) => f.endsWith(".json"));
r.assert(files.length >= 1, "no witness receipts found");

const receipts = [];
for (const f of files) {
  try {
    receipts.push(JSON.parse(fs.readFileSync(path.join(receiptDir, f), "utf8")));
  } catch (e) {
    r.fail(`receipt ${f} invalid JSON: ${e.message}`);
  }
}

function verifyReceipt(receipt) {
  const key = keys[receipt.witness_id];
  if (!key) return false;
  if (typeof receipt.root !== "string" || typeof receipt.signature !== "string") {
    return false;
  }
  if (receipt.tree_size !== policy.tree_size) return false;
  const msg = `${receipt.root}|${receipt.tree_size}`;
  const expected = crypto.createHmac("sha256", key).update(msg).digest("hex");
  return expected === receipt.signature;
}

const roots = new Set();
const validForPolicy = [];
const seenWitness = new Set();

for (const receipt of receipts) {
  if (!verifyReceipt(receipt)) {
    r.fail(
      `invalid receipt from ${receipt.witness_id || "?"} (bad sig / unknown witness / size mismatch)`
    );
    continue;
  }
  roots.add(receipt.root);
  if (receipt.root !== policy.root) continue;
  if (seenWitness.has(receipt.witness_id)) {
    r.fail(`duplicate receipt for witness ${receipt.witness_id}`);
    continue;
  }
  if (!witnessSet.witnesses.includes(receipt.witness_id)) {
    r.fail(`receipt witness ${receipt.witness_id} not in witness-set`);
    continue;
  }
  seenWitness.add(receipt.witness_id);
  validForPolicy.push(receipt);
}

r.assert(
  roots.size <= 1,
  `equivocation evidence: ${roots.size} distinct roots in receipt dir (portable fork)`
);
r.assert(
  validForPolicy.length >= witnessSet.q,
  `witness quorum unmet: ${validForPolicy.length}/${witnessSet.q} valid receipts for policy root`
);

r.finish();
