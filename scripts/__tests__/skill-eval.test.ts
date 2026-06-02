import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  initSkillEval,
  refLintSkillMd,
  runCaseAssertions,
  runSkillEval,
  validateTriggers,
} from "../skill-eval";

describe("validateTriggers", () => {
  it("requires min should / should-not cases", () => {
    const checks = validateTriggers({
      version: 1,
      cases: [
        { id: "a", prompt: "x", should_trigger: true },
        { id: "b", prompt: "y", should_trigger: false },
      ],
    });
    expect(checks.some((c) => c.id === "triggers-should-count" && !c.ok)).toBe(true);
    expect(checks.some((c) => c.id === "triggers-should-not-count" && !c.ok)).toBe(true);
  });

  it("warns on obvious negative prompts", () => {
    const checks = validateTriggers({
      version: 1,
      cases: [
        { id: "a", prompt: "need skill", should_trigger: true },
        { id: "b", prompt: "also need", should_trigger: true },
        { id: "c", prompt: "near miss publish", should_trigger: false },
        { id: "d", prompt: "写斐波那契", should_trigger: false },
      ],
    });
    expect(checks.some((c) => c.id === "triggers-obvious-negative-d" && !c.ok)).toBe(true);
  });
});

describe("runSkillEval", () => {
  let tmp: string;
  let forgeRoot: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reqforge-skill-eval-"));
    forgeRoot = path.resolve(__dirname, "../..");
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("init creates eval pack", () => {
    const dir = initSkillEval("demo-skill", { cwd: tmp, forgeRoot });
    expect(fs.existsSync(path.join(dir, "triggers.json"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "cases.json"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "rejected-edits.json"))).toBe(true);
  });

  it("passes when triggers valid and artifacts match", () => {
    initSkillEval("demo-skill", { cwd: tmp, forgeRoot });
    const evalDir = path.join(tmp, ".forge/skills/demo-skill/eval");
    const triggers = JSON.parse(fs.readFileSync(path.join(evalDir, "triggers.json"), "utf-8"));
    triggers.cases.push(
      { id: "extra-y", prompt: "another yes", should_trigger: true },
      { id: "extra-n", prompt: "near miss release only", should_trigger: false },
    );
    fs.writeFileSync(path.join(evalDir, "triggers.json"), JSON.stringify(triggers));

    const outDir = path.join(tmp, "eval-output", "happy-path");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "output.md"), "# Title\n\nbody\n");

    const { passed } = runSkillEval({ cwd: tmp, skillName: "demo-skill" });
    expect(passed).toBe(true);
  });

  it("fails fileExists when artifact missing", () => {
    initSkillEval("demo-skill", { cwd: tmp, forgeRoot });
    const { passed, errorCount } = runSkillEval({ cwd: tmp, skillName: "demo-skill" });
    expect(passed).toBe(false);
    expect(errorCount).toBeGreaterThan(0);
  });
});

describe("runCaseAssertions", () => {
  it("checks maxBytes", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reqforge-case-"));
    const base = path.join(tmp, "eval-output", "c1");
    fs.mkdirSync(base, { recursive: true });
    fs.writeFileSync(path.join(base, "out.txt"), "hi");
    const checks = runCaseAssertions(tmp, "eval-output", {
      id: "c1",
      assertions: { maxBytes: [{ file: "out.txt", max: 1 }] },
    });
    expect(checks.some((c) => !c.ok)).toBe(true);
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});

describe("refLintSkillMd", () => {
  it("flags mismatch between numeric reference and list length", () => {
    const md = [
      "## Rubric",
      "four dimensions:",
      "- Completeness",
      "- Correctness",
      "- Coherence",
    ].join("\n");
    const checks = refLintSkillMd(md);
    const fail = checks.find((c) => !c.ok);
    expect(fail).toBeDefined();
    expect(fail!.message).toContain("claims 4");
    expect(fail!.message).toContain("has 3");
  });

  it("passes when reference matches list length", () => {
    const md = [
      "三个步骤：",
      "- 第一步",
      "- 第二步",
      "- 第三步",
    ].join("\n");
    const checks = refLintSkillMd(md);
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it("handles Arabic numerals", () => {
    const md = [
      "5 个阶段",
      "- 阶段 1",
      "- 阶段 2",
      "- 阶段 3",
    ].join("\n");
    const checks = refLintSkillMd(md);
    const fail = checks.find((c) => !c.ok);
    expect(fail).toBeDefined();
    expect(fail!.message).toContain("claims 5");
  });

  it("ignores single-item references", () => {
    const md = "一个重要的事\n- 要注意";
    const checks = refLintSkillMd(md);
    expect(checks.length).toBe(0);
  });

  it("ignores references with no nearby list", () => {
    const md = "四个维度很重要。\n\n一些其他文本。";
    const checks = refLintSkillMd(md);
    expect(checks.length).toBe(0);
  });
});
