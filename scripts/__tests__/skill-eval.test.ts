import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  initSkillEval,
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
