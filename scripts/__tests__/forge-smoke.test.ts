import { describe, it, expect } from "vitest";
import { readdirSync } from "fs";
import { join } from "path";
import { SMOKES } from "../forge-smoke/lib.mjs";

const ROOT = join(__dirname, "..", "..");
const SMOKE_DIR = join(ROOT, "scripts", "forge-smoke");

/**
 * Registry only — does NOT re-execute each smoke (CI runs run-all.mjs once).
 * Keep SMOKES exported from lib.mjs as the single source of truth.
 */
describe("forge-smoke registry", () => {
  it("SMOKES list matches scripts on disk (no orphans, no missing)", () => {
    const files = readdirSync(SMOKE_DIR)
      .filter(
        (f) =>
          f.endsWith(".mjs") &&
          f !== "run-all.mjs" &&
          f !== "lib.mjs" &&
          !f.endsWith("-lib.mjs")
      )
      .sort();
    const expected = [...SMOKES].map((s) => `${s}.mjs`).sort();
    expect(SMOKES).toHaveLength(16);
    expect(files).toEqual(expected);
  });
});
