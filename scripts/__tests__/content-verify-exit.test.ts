/**
 * content-verify-exit.test.ts — CLI exit code must agree with the printed verdict.
 *
 * A file that does not exist is FILE_NOT_FOUND (failure_class execution-lapse). The run prints
 * "❌ 存在未通过的检查", so the process must exit non-zero — otherwise a CI step or caller that
 * only reads the exit status treats a missing deliverable as a pass.
 */
import { describe, it, expect } from "vitest";
import { spawnSync } from "child_process";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const SCRIPT = join(__dirname, "..", "forge-verify", "content-verify.mjs");

function runContentVerify(files: string[]) {
  return spawnSync(process.execPath, [SCRIPT, "--task", "exit-code test", "--files", files.join(",")], {
    encoding: "utf-8",
    // The FILE_NOT_FOUND / L0 paths never reach the LLM; an unroutable base URL keeps it that way.
    env: { ...process.env, ANTHROPIC_AUTH_TOKEN: "test-token", ANTHROPIC_BASE_URL: "http://127.0.0.1:9" },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

describe("content-verify CLI exit code", () => {
  it("exits 1 when a file to verify does not exist (FILE_NOT_FOUND)", () => {
    const dir = mkdtempSync(join(tmpdir(), "content-verify-exit-"));
    try {
      const r = runContentVerify([join(dir, "missing-deliverable.ts")]);
      expect(r.stdout).toContain("FILE_NOT_FOUND");
      expect(r.stdout).toContain("❌ 存在未通过的检查");
      expect(r.status).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("still exits 1 when a file is rejected at L0 (empty file)", () => {
    const dir = mkdtempSync(join(tmpdir(), "content-verify-exit-"));
    try {
      const empty = join(dir, "empty.ts");
      writeFileSync(empty, "", "utf-8");
      const r = runContentVerify([empty]);
      expect(r.stdout).toContain("REJECT");
      expect(r.status).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
