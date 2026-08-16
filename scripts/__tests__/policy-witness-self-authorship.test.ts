/**
 * policy-witness-self-authorship.test.ts — Peter 三旁路负对照（当前同信任域可自签）
 *
 * 断言攻击在「钥 + 验证器 + 名单 + 被测代码」同仓可写时成功。
 * 这是残差文档夹具，不是生产门：生产要把钥/验证挪到候选 job 外，
 * 并使删门 / 伪造法定人数 / 换见证集在 required check 锚定下仍挡合并。
 */
import { describe, it, expect } from "vitest";
import {
  computeRoot,
  mintReceipt,
  quorumMet,
  loadLiveFixtures,
} from "../forge-smoke/policy-witness-lib.mjs";
import { SMOKES } from "../forge-smoke/lib.mjs";

describe("policy-witness self-authorship residual (Peter bypass fixtures)", () => {
  it("Bypass A — fabricate quorum: in-repo keys mint 3 receipts for a forged head", () => {
    const { keys, witnessSet } = loadLiveFixtures();
    // 恶意 PR：改政策头 + 用仓库里的 DEV 钥自铸三份收据
    const forgedPolicy = {
      minimum: 99,
      artifact_digest: "f".repeat(64),
      tree_size: 2,
      root: "",
    };
    forgedPolicy.root = computeRoot(forgedPolicy);

    const receipts = ["W1", "W2", "W3"].map((id) =>
      mintReceipt(id, keys[id], forgedPolicy.root, forgedPolicy.tree_size)
    );
    const result = quorumMet(forgedPolicy, witnessSet, keys, receipts);
    expect(result.ok).toBe(true);
    expect(result.count).toBeGreaterThanOrEqual(3);
    // 证明：法定人数「绿」完全可由 PR 信任域内自产
  });

  it("Bypass B — shrink/replace witness set: lower q or swap keys → forged head still greens", () => {
    const { keys } = loadLiveFixtures();
    const forgedPolicy = {
      minimum: 7,
      artifact_digest: "a".repeat(64),
      tree_size: 1,
      root: "",
    };
    forgedPolicy.root = computeRoot(forgedPolicy);

    // 缩集：q=1，只需一枚自签收据
    const shrunkSet = { n: 1, q: 1, witnesses: ["W1"] };
    const one = [mintReceipt("W1", keys.W1, forgedPolicy.root, forgedPolicy.tree_size)];
    expect(quorumMet(forgedPolicy, shrunkSet, keys, one).ok).toBe(true);

    // 换钥：攻击者自备密钥写入「见证集」
    const attackerKeys = { ATT: "attacker-controlled-hmac-secret" };
    const replacedSet = { n: 3, q: 2, witnesses: ["ATT", "ATT2", "ATT3"] };
    // 只注册 ATT 且 q=1 的极端缩集（换名单）
    const replacedTiny = { n: 1, q: 1, witnesses: ["ATT"] };
    const forged = [
      mintReceipt("ATT", attackerKeys.ATT, forgedPolicy.root, forgedPolicy.tree_size),
    ];
    expect(quorumMet(forgedPolicy, replacedTiny, attackerKeys, forged).ok).toBe(true);
    expect(replacedSet.witnesses).toContain("ATT"); // 名单已不在原治理集
  });

  it("Bypass C — delete the gate: SMOKES membership is the only in-suite latch", () => {
    // 当前门在名单里（有用）
    expect(SMOKES).toContain("policy-witness-quorum");

    // 恶意 PR 形：从 SMOKES 拷贝里删掉该项 → 套件不再跑该门
    const sabotaged = SMOKES.filter((s) => s !== "policy-witness-quorum");
    expect(sabotaged).not.toContain("policy-witness-quorum");
    expect(sabotaged.length).toBe(SMOKES.length - 1);
    // 若无 branch protection / required check 锚定，PR 内测试可全绿且门已消失
  });
});
