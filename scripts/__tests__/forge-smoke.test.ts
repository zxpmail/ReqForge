import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { join } from "path";
import { readdirSync } from "fs";

const ROOT = join(__dirname, "..", "..");
const SMOKE_DIR = join(ROOT, "scripts", "forge-smoke");

/** Keep in sync with scripts/forge-smoke/run-all.mjs SMOKES */
const SMOKES = [
  "workflows-compliance",
  "platform-compliance-doc",
  "machine-gates-doc",
  "package-integrity",
  "templates-present",
  "agents-complete",
  "hooks-wired",
  "stop-gate-wired",
  "skill-fixtures",
  "skill-bypass",
  "loadouts-valid",
  "adapters-sync",
  "skills-complete",
  "test-demo-golden-path",
  "grovel-baseline",
];

describe("forge-smoke integration", () => {
  it("all smoke scripts are present", () => {
    const files = readdirSync(SMOKE_DIR).filter(
      (f) => f.endsWith(".mjs") && f !== "run-all.mjs" && f !== "lib.mjs",
    );
    for (const smoke of SMOKES) {
      expect(files).toContain(`${smoke}.mjs`);
    }
    expect(SMOKES).toHaveLength(15);
  });

  for (const name of SMOKES) {
    it(
      `smoke: ${name}`,
      () => {
        const script = join(SMOKE_DIR, `${name}.mjs`);
        const result = execSync(`node "${script}"`, {
          cwd: ROOT,
          encoding: "utf-8",
          timeout: 60000,
        });
        expect(result).toBeTruthy();
      },
      60000,
    );
  }
});
