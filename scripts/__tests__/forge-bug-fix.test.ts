import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { existsSync, mkdirSync, rmSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ROOT = join(__dirname, "..", "..");
const CLI = "node " + join(ROOT, "scripts", "forge-bug-fix.mjs");
const TRACE_DIR = join(ROOT, ".forge", "trace");

function run(...args: string[]) {
  return execSync(`${CLI} ${args.join(" ")}`, {
    cwd: ROOT,
    encoding: "utf-8",
    timeout: 30000,
    env: { ...process.env, FORGE_QUICK: "1" },
  });
}

describe("forge-bug-fix CLI", () => {
  beforeAll(() => {
    mkdirSync(TRACE_DIR, { recursive: true });
    if (existsSync(TRACE_DIR)) {
      for (const f of readdirSync(TRACE_DIR)) {
        if (f.startsWith("bug-test-")) rmSync(join(TRACE_DIR, f));
      }
    }
  });

  afterAll(() => {
    if (existsSync(TRACE_DIR)) {
      for (const f of readdirSync(TRACE_DIR)) {
        if (f.startsWith("bug-test-")) rmSync(join(TRACE_DIR, f));
      }
    }
  });

  it("diagnose runs without error", { timeout: 60000 }, () => {
    const out = run("diagnose");
    expect(out).toContain("=== Bug Diagnose ===");
  });

  it("trace captures a bug context", { timeout: 15000 }, () => {
    const out = run("trace", "test-error");
    expect(out).toContain("Trace captured:");
    expect(out).toMatch(/\.forge[/\\]trace[/\\]/);
    // Verify trace file was written directly
    const traceFiles = readdirSync(TRACE_DIR).filter(f => f.startsWith("bug-test-error-"));
    expect(traceFiles.length).toBeGreaterThanOrEqual(1);
  });

  it("trace without name exits with error", { timeout: 10000 }, () => {
    expect(() => run("trace")).toThrow();
  });

  it("unknown command exits with error", { timeout: 10000 }, () => {
    expect(() => run("invalid-command")).toThrow();
  });
});
