import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { existsSync, mkdirSync, rmSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ROOT = join(__dirname, "..", "..");
const CHANGES = join(ROOT, "changes");
const CLI = "node " + join(ROOT, "scripts", "forge-change.mjs");

function run(...args: string[]) {
  return execSync(`${CLI} ${args.join(" ")}`, { cwd: ROOT, encoding: "utf-8", timeout: 10000 });
}

describe("forge-change CLI", () => {
  const testChange = "vitest-e2e-test";

  beforeAll(() => {
    // Ensure clean state
    for (const dir of [join(CHANGES, testChange), join(CHANGES, "archive", testChange)]) {
      if (existsSync(dir)) rmSync(dir, { recursive: true });
    }
    mkdirSync(CHANGES, { recursive: true });
  });

  afterAll(() => {
    for (const dir of [join(CHANGES, testChange), join(CHANGES, "archive", testChange)]) {
      if (existsSync(dir)) rmSync(dir, { recursive: true });
    }
  });

  it("init creates a change directory with template files", () => {
    const out = run("init", testChange);
    expect(out).toContain("Created:");
    const dir = join(CHANGES, testChange);
    expect(existsSync(dir)).toBe(true);
    const files = readdirSync(dir);
    expect(files).toContain("proposal.md");
    expect(files).toContain("specs.md");
    expect(files).toContain("design.md");
    expect(files).toContain("tasks.md");
    expect(files).toContain("verify.md");
  });

  it("init fails on duplicate", () => {
    expect(() => run("init", testChange)).toThrow();
  });

  it("list shows the new change", () => {
    const out = run("list");
    expect(out).toContain(testChange);
  });

  it("check detects the active change", () => {
    const out = run("check");
    expect(out).toContain("verify.md");
  });

  it("archive moves to archive/", () => {
    const out = run("archive", testChange);
    expect(out).toContain("Archived:");
    expect(existsSync(join(CHANGES, testChange))).toBe(false);
    expect(existsSync(join(CHANGES, "archive", testChange))).toBe(true);
  });

  it("list no longer shows archived in active", () => {
    const out = run("list");
    const activeSection = out.split("=== Archived Changes ===")[0];
    expect(activeSection).not.toContain(testChange);
  });

  it("check after archive finds no issues", () => {
    const out = run("check");
    expect(out).toContain("No issues found.");
  });

  it("archive on non-existent fails", () => {
    expect(() => run("archive", "nonexistent-change")).toThrow();
  });
});
