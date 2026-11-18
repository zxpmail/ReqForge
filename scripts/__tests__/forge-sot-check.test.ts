/**
 * forge-sot-check.test.ts — SoT 注册表（权威实现注册 + 重复实现检测）
 *
 * 核心断言：
 * 1) 注册表条目必须指向真实实现（canonical 存在）、契约非空、日期可核验；
 * 2) 陈旧条目（>180 天未核验）→ 需人类重新核验；
 * 3) 代码里出现 signal 但不在 canonical → 疑似重复实现 → FAIL；
 * 4) 例外必须带 approvedBy（人类批准）才生效 —— 模型自签无效。
 */
import { describe, it, expect } from "vitest";
import {
  parseRegistry,
  validateEntries,
  findSuspects,
  summarize,
  runCheck,
} from "../forge-sot-check.mjs";

const VALID_DATE = "2026-11-18";

function entry(overrides: Record<string, string> = {}) {
  return {
    id: "SOT-001",
    title: "货币舍入",
    canonical: "src/domain/money/round.ts",
    contract: "四舍五入到货币最小单位；JPY 无小数位",
    signal: "roundHalfUp|toFixed\\(2\\)",
    lastVerified: VALID_DATE,
    status: "active",
    ...overrides,
  };
}

describe("parseRegistry", () => {
  const md = [
    "# SoT 注册表",
    "",
    "### SOT-001 · 货币舍入",
    "- **canonical**: `src/domain/money/round.ts`",
    "- **contract**: 四舍五入到货币最小单位",
    "- **signal**: `roundHalfUp`",
    `- **lastVerified**: ${VALID_DATE}`,
    "- **status**: active",
    "",
    "### SOT-002 · ID 生成",
    "- **canonical**: `src/domain/id.ts`",
    "- **contract**: ULID，单调递增，全局唯一",
    "- **signal**: `newUlid`",
    `- **lastVerified**: ${VALID_DATE}`,
    "- **status**: active",
    "",
    "<!--",
    "### SOT-999 · 模板示例（注释内，不应被解析）",
    "- **canonical**: `example.ts`",
    "- **contract**: placeholder placeholder",
    "- **signal**: `example`",
    `- **lastVerified**: ${VALID_DATE}`,
    "- **status**: active",
    "-->",
  ].join("\n");

  it("parses entries with fields stripped of backticks", () => {
    const { entries, issues } = parseRegistry(md);
    expect(issues).toHaveLength(0);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      id: "SOT-001",
      title: "货币舍入",
      canonical: "src/domain/money/round.ts",
      signal: "roundHalfUp",
      status: "active",
    });
  });

  it("skips HTML-commented template examples", () => {
    const { entries } = parseRegistry(md);
    expect(entries.find((e) => e.id === "SOT-999")).toBeUndefined();
  });

  it("reports missing fields", () => {
    const { issues } = parseRegistry("### SOT-001 · 残缺\n- **canonical**: `a.ts`\n");
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain("missing field(s)");
    expect(issues[0]).toContain("contract");
  });
});

describe("validateEntries", () => {
  it("passes a healthy active entry", () => {
    const issues = validateEntries([entry()], {
      exists: (p) => p === "src/domain/money/round.ts",
      now: new Date("2026-11-18T00:00:00Z"),
      staleDays: 180,
    });
    expect(issues).toHaveLength(0);
  });

  it("FAILS when canonical does not exist — registry must not lie", () => {
    const issues = validateEntries([entry()], { exists: () => false });
    expect(issues.some((i) => i.includes("does not exist"))).toBe(true);
  });

  it("FAILS when entry is stale (>180 days without human re-verification)", () => {
    const issues = validateEntries([entry({ lastVerified: "2026-01-01" })], {
      exists: () => true,
      now: new Date("2026-11-18T00:00:00Z"),
      staleDays: 180,
    });
    expect(issues.some((i) => i.includes("human re-verification required"))).toBe(true);
  });

  it("FAILS on duplicate ids, bad status, bad regex, future date, short contract", () => {
    const issues = validateEntries(
      [
        entry(),
        entry({ id: "SOT-001", title: "重复" }),
        entry({ id: "SOT-002", status: "locked" }),
        entry({ id: "SOT-003", signal: "([unclosed" }),
        entry({ id: "SOT-004", lastVerified: "2027-01-01" }),
        entry({ id: "SOT-005", contract: "标签" }),
      ],
      { exists: () => true, now: new Date("2026-11-18T00:00:00Z") },
    );
    expect(issues.some((i) => i.includes("duplicate id"))).toBe(true);
    expect(issues.some((i) => i.includes("invalid status"))).toBe(true);
    expect(issues.some((i) => i.includes("not a valid regex"))).toBe(true);
    expect(issues.some((i) => i.includes("in the future"))).toBe(true);
    expect(issues.some((i) => i.includes("contract too short"))).toBe(true);
  });

  it("skips existence/staleness requirements for non-active entries", () => {
    const issues = validateEntries([entry({ status: "superseded", canonical: "gone.ts" })], {
      exists: () => false,
      now: new Date("2030-01-01"),
    });
    expect(issues).toHaveLength(0);
  });
});

describe("findSuspects — duplicate implementation detection", () => {
  const files = [
    { path: "src/domain/money/round.ts", content: "function roundHalfUp(n) {}" }, // canonical
    { path: "src/legacy/price.ts", content: "const x = roundHalfUp(1.5);" }, // 重复
    { path: "src/unrelated.ts", content: "nothing here" },
  ];

  it("flags files matching a signal outside the canonical implementation", () => {
    const suspects = findSuspects(files, [entry()], []);
    expect(suspects).toEqual([
      { file: "src/legacy/price.ts", sot: "SOT-001", title: "货币舍入" },
    ]);
  });

  it("honors exceptions only when approvedBy is present (human approval)", () => {
    const approved = [{ file: "src/legacy/price.ts", sot: "SOT-001", reason: "legacy frozen", approvedBy: "human" }];
    expect(findSuspects(files, [entry()], approved)).toHaveLength(0);

    const selfSigned = [{ file: "src/legacy/price.ts", sot: "SOT-001", approvedBy: "" }];
    expect(findSuspects(files, [entry()], selfSigned)).toHaveLength(1);
  });

  it("ignores non-active entries and invalid signals", () => {
    expect(findSuspects(files, [entry({ status: "deprecated" })], [])).toHaveLength(0);
    expect(findSuspects(files, [entry({ signal: "([bad" })], [])).toHaveLength(0);
  });
});

describe("summarize + runCheck", () => {
  it("summarize produces forced-load lines for forge-loop startup", () => {
    const lines = summarize([entry()]);
    expect(lines[0]).toContain("SOT-001");
    expect(lines[0]).toContain("src/domain/money/round.ts");
  });

  it("runCheck skips when no registry exists", () => {
    const r = runCheck("Z:/definitely-not-a-real-root-xyz");
    expect(r.status).toBe("skip");
    expect(r.detail).toContain("skip");
  });
});
