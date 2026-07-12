// C3 argument-space 集成测试 — 验证 argumentSpaceCheck（content-verify.mjs）
// 4 fixtures: S0/S3 → PASS (real invalidation), S1/S2 → REJECT (no invalidation)
import { argumentSpaceCheck } from "../content-verify.mjs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIX = join(HERE, "fixtures");

const req = (impl) => ({
  id: "REQ-3",
  desc: "write-invalidation on cache writes",
  type: "argument-space",
  verify_command: `node ${join(FIX, "verify-write-invalidation.js")} ${join(FIX, impl)}`,
});

const cases = [
  { name: "S0-honest",    impl: "s0-honest.js",    expect: "PASS"   },
  { name: "S1-ttl",       impl: "s1-ttl.js",       expect: "REJECT" },
  { name: "S2-coherency", impl: "s2-coherency.js", expect: "REJECT" },
  { name: "S3-purge",     impl: "s3-purge.js",     expect: "PASS"   },
];

let pass = 0;
console.log("C3 argument-space integration test (4 fixtures × argumentSpaceCheck)\n");
for (const c of cases) {
  const r = argumentSpaceCheck([req(c.impl)], HERE);
  const ok = r.verdict === c.expect;
  console.log(`  ${ok ? "✓ PASS" : "✗ FAIL"}  ${c.name.padEnd(14)} verdict=${r.verdict.padEnd(6)} (expect ${c.expect}) — ${r.reason}`);
  if (ok) pass++;
}
console.log(`\n${pass}/${cases.length} correct`);
process.exit(pass === cases.length ? 0 : 1);
