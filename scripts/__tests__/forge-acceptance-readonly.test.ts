/**
 * forge-acceptance-readonly.test.ts — 验收断言只读区（测试意图独立）
 *
 * 核心断言：模型改动人类拥有的验收/契约断言 → FAIL；
 * 配置自身未提交的改动 → FAIL（提交 = 人类批准激活）；
 * 普通单元测试（模型可写区）→ 不受影响。
 */
import { describe, it, expect } from "vitest";
import { evaluateAcceptance, loadConfig, CONFIG_REL } from "../forge-acceptance-readonly.mjs";

const CFG = {
  version: 1,
  owner: "human",
  description: "human-owned acceptance assertions",
  paths: ["tests/acceptance/", "tests/contract"],
};

describe("evaluateAcceptance", () => {
  it("skips when config is null (gate not adopted)", () => {
    const r = evaluateAcceptance(null, ["tests/contract/api.test.ts"]);
    expect(r.status).toBe("skip");
    expect(r.detail).toContain("skip");
  });

  it("skips when paths are empty", () => {
    const r = evaluateAcceptance({ paths: [] }, ["anything.ts"]);
    expect(r.status).toBe("skip");
  });

  it("passes when no protected file changed", () => {
    const r = evaluateAcceptance(CFG, ["src/implement.ts", "src/__tests__/unit.test.ts"]);
    expect(r.status).toBe("pass");
    expect(r.violations).toHaveLength(0);
  });

  it("FAILS when a contract test is modified — model may not redefine acceptance", () => {
    const r = evaluateAcceptance(CFG, ["tests/contract/payment.test.ts"]);
    expect(r.status).toBe("fail");
    expect(r.violations).toEqual([{ file: "tests/contract/payment.test.ts", kind: "path" }]);
    expect(r.detail).toContain("payment.test.ts");
  });

  it("FAILS when an acceptance file under a directory prefix is touched", () => {
    const r = evaluateAcceptance(CFG, ["tests/acceptance/checkout.spec.ts"]);
    expect(r.status).toBe("fail");
    expect(r.violations[0].kind).toBe("path");
  });

  it("normalizes trailing slashes and exact-file paths", () => {
    const cfg = { paths: ["tests/contract", "specs/golden.json"] };
    expect(evaluateAcceptance(cfg, ["tests/contract/x.test.ts"]).status).toBe("fail");
    expect(evaluateAcceptance(cfg, ["specs/golden.json"]).status).toBe("fail");
    // tests/contract 作为文件名前缀但非路径成员 → 不误伤
    expect(evaluateAcceptance(cfg, ["tests/contractx/a.test.ts"]).status).toBe("pass");
  });

  it("FAILS when the config itself is touched uncommitted (self-protection)", () => {
    const r = evaluateAcceptance(CFG, [CONFIG_REL]);
    expect(r.status).toBe("fail");
    expect(r.violations[0].kind).toBe("config");
    expect(r.detail).toContain("commit human-approved changes");
  });

  it("does not flag unrelated .forge state files", () => {
    const r = evaluateAcceptance(CFG, [".forge/active-scope.json", ".forge/trace/phase-1.json"]);
    expect(r.status).toBe("pass");
  });
});

describe("loadConfig", () => {
  it("returns null when config file does not exist", () => {
    expect(loadConfig("Z:/definitely-not-a-real-root-xyz")).toBeNull();
  });
});
