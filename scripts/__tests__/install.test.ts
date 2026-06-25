import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { installSkillEvalTemplate } from "../skill-eval";
import {
  applyWindowsSettings,
  copyInstallTree,
  installForge,
  installForgeQuickref,
  installPreflightConfig,
  installSecurityGuidance,
  installProjectTaste,
  parseInstallArgs,
  resolvePaths,
  shouldSkipOverwrite,
} from "../install";
import { loadLoadout, shouldIncludeForLoadout, ADAPTER_LAYOUT } from "../loadout";

const REPO_ROOT = path.resolve(__dirname, "../..");

describe("parseInstallArgs", () => {
  it("parses client and target", () => {
    expect(parseInstallArgs(["claude-code", "/tmp/app", "--force"])).toMatchObject({
      client: "claude-code",
      target: "/tmp/app",
      force: true,
    });
  });

  it("parses --target flag", () => {
    expect(parseInstallArgs(["cursor", "--target", "../app"])).toMatchObject({
      client: "cursor",
      target: "../app",
    });
  });

  it("parses --loadout flag", () => {
    expect(parseInstallArgs(["claude-code", ".", "--loadout", "minimal"])).toMatchObject({
      client: "claude-code",
      loadout: "minimal",
    });
    expect(parseInstallArgs(["cursor", "-l", "lite"])).toMatchObject({
      client: "cursor",
      loadout: "lite",
    });
  });

  it("defaults windows to process.platform === win32 when --windows is omitted", () => {
    const parsed = parseInstallArgs(["claude-code", "."]);
    expect(parsed.windows).toBe(process.platform === "win32");
  });

  it("forces windows true with --windows flag", () => {
    expect(parseInstallArgs(["claude-code", ".", "--windows"]).windows).toBe(true);
    expect(parseInstallArgs(["claude-code", ".", "-w"]).windows).toBe(true);
  });
});

describe("copyInstallTree", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reqforge-install-"));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("copies fresh destination", () => {
    const src = path.join(tmp, "src");
    const dest = path.join(tmp, "dest");
    fs.mkdirSync(src);
    fs.writeFileSync(path.join(src, "a.txt"), "a");

    copyInstallTree(src, dest);

    expect(fs.readFileSync(path.join(dest, "a.txt"), "utf-8")).toBe("a");
  });

  it("throws when dest exists without force", () => {
    const src = path.join(tmp, "src");
    const dest = path.join(tmp, "dest");
    fs.mkdirSync(src);
    fs.mkdirSync(dest);
    expect(() => copyInstallTree(src, dest)).toThrow(/already exists/);
  });

  it("merges with force and preserves existing feedback files", () => {
    const src = path.join(tmp, "src");
    const dest = path.join(tmp, "dest");
    fs.mkdirSync(path.join(src, "feedback"), { recursive: true });
    fs.writeFileSync(path.join(src, "feedback", "new.md"), "new");
    fs.writeFileSync(path.join(src, "skills.txt"), "skills");

    fs.mkdirSync(path.join(dest, "feedback"), { recursive: true });
    fs.writeFileSync(path.join(dest, "feedback", "user.md"), "keep me");
    fs.writeFileSync(path.join(dest, "old.txt"), "old");

    copyInstallTree(src, dest, { force: true });

    expect(fs.readFileSync(path.join(dest, "feedback", "user.md"), "utf-8")).toBe("keep me");
    expect(fs.existsSync(path.join(dest, "feedback", "new.md"))).toBe(true);
    expect(fs.readFileSync(path.join(dest, "skills.txt"), "utf-8")).toBe("skills");
  });

  it("preserves settings.local.json on merge", () => {
    const src = path.join(tmp, "src");
    const dest = path.join(tmp, "dest");
    fs.mkdirSync(src);
    fs.writeFileSync(path.join(src, "settings.local.json"), '{"from":"src"}');
    fs.mkdirSync(dest);
    fs.writeFileSync(path.join(dest, "settings.local.json"), '{"from":"user"}');

    copyInstallTree(src, dest, { force: true });

    expect(fs.readFileSync(path.join(dest, "settings.local.json"), "utf-8")).toContain("user");
  });
});

describe("shouldSkipOverwrite", () => {
  it("skips feedback when dest file exists", () => {
    const file = path.join(os.tmpdir(), "skip-test.md");
    fs.writeFileSync(file, "x");
    expect(shouldSkipOverwrite("feedback/user.md", file)).toBe(true);
    fs.rmSync(file, { force: true });
  });
});

describe("applyWindowsSettings", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reqforge-win-settings-"));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("copies settings.windows.json to settings.json", () => {
    fs.writeFileSync(path.join(tmp, "settings.windows.json"), '{"windows":true}');
    fs.writeFileSync(path.join(tmp, "settings.json"), '{"default":true}');

    const applied = applyWindowsSettings(tmp, () => {});

    expect(applied).toBe(true);
    expect(fs.readFileSync(path.join(tmp, "settings.json"), "utf-8")).toContain("windows");
  });
});

describe("installForge", () => {
  let forgeRoot: string;
  let target: string;

  beforeEach(() => {
    forgeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "reqforge-forge-root-"));
    target = fs.mkdtempSync(path.join(os.tmpdir(), "reqforge-target-"));

    const quickrefSrc = path.join(forgeRoot, "core/templates");
    fs.mkdirSync(quickrefSrc, { recursive: true });
    fs.writeFileSync(path.join(quickrefSrc, "forge-quickref.md"), "# quickref");

    const adapterSrc = path.join(forgeRoot, "adapters/claude-code/.claude");
    fs.mkdirSync(adapterSrc, { recursive: true });
    fs.writeFileSync(path.join(adapterSrc, "CLAUDE.md"), "# test");
    fs.writeFileSync(path.join(adapterSrc, "settings.windows.json"), '{"hooks":"bat"}');
    fs.writeFileSync(path.join(adapterSrc, "settings.json"), '{"hooks":"sh"}');
  });

  afterEach(() => {
    fs.rmSync(forgeRoot, { recursive: true, force: true });
    fs.rmSync(target, { recursive: true, force: true });
  });

  it("installs claude-code adapter into target", () => {
    const result = installForge("claude-code", target, {
      forgeRoot,
      log: () => {},
      windows: true,
    });

    expect(result.destPath).toBe(path.join(target, ".claude"));
    expect(fs.existsSync(path.join(result.destPath, "CLAUDE.md"))).toBe(true);
    expect(result.windowsSettingsApplied).toBe(true);
    expect(fs.readFileSync(path.join(target, ".forge/quickref.md"), "utf-8")).toBe("# quickref");
  });

  it("installSecurityGuidance writes .forge/security-guidance.md", () => {
    const tplDir = path.join(forgeRoot, "core/templates");
    fs.mkdirSync(tplDir, { recursive: true });
    fs.writeFileSync(
      path.join(tplDir, "security-guidance-template.md"),
      "# security rules",
    );

    installSecurityGuidance(target, forgeRoot, () => {}, false);

    expect(
      fs.readFileSync(path.join(target, ".forge/security-guidance.md"), "utf-8"),
    ).toBe("# security rules");
  });

  it("installProjectTaste writes .forge/project-taste.md", () => {
    const tplDir = path.join(forgeRoot, "core/templates");
    fs.mkdirSync(tplDir, { recursive: true });
    fs.writeFileSync(
      path.join(tplDir, "project-taste-template.md"),
      "# project taste",
    );

    installProjectTaste(target, forgeRoot, () => {}, false);

    expect(
      fs.readFileSync(path.join(target, ".forge/project-taste.md"), "utf-8"),
    ).toBe("# project taste");
  });

  it("installForgeQuickref skips existing without force", () => {
    const quickrefSrc = path.join(forgeRoot, "core/templates");
    fs.mkdirSync(quickrefSrc, { recursive: true });
    fs.writeFileSync(path.join(quickrefSrc, "forge-quickref.md"), "# new");
    fs.mkdirSync(path.join(target, ".forge"), { recursive: true });
    fs.writeFileSync(path.join(target, ".forge/quickref.md"), "# old");

    installForgeQuickref(target, forgeRoot, () => {}, false);

    expect(fs.readFileSync(path.join(target, ".forge/quickref.md"), "utf-8")).toBe("# old");
  });

  it("installSkillEvalTemplate writes _template/eval", () => {
    const tplDir = path.join(forgeRoot, "core/templates/skill-eval");
    fs.mkdirSync(tplDir, { recursive: true });
    fs.writeFileSync(path.join(tplDir, "triggers.template.json"), "{}");
    fs.writeFileSync(path.join(tplDir, "cases.template.json"), "{}");

    installSkillEvalTemplate(target, forgeRoot, () => {}, false);

    expect(
      fs.existsSync(path.join(target, ".forge/skills/_template/eval/triggers.template.json")),
    ).toBe(true);
  });

  it("installPreflightConfig writes preflight.json", () => {
    const forgeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "reqforge-forge-pf-"));
    const target = fs.mkdtempSync(path.join(os.tmpdir(), "reqforge-target-pf-"));
    fs.mkdirSync(path.join(forgeRoot, "core", "templates"), { recursive: true });
    fs.writeFileSync(
      path.join(forgeRoot, "core", "templates", "preflight-config.template.json"),
      '{"version":1}',
    );
    fs.writeFileSync(
      path.join(forgeRoot, "core", "templates", "preflight-wechat.example.json"),
      '{"version":1,"description":"ex"}',
    );

    installPreflightConfig(target, forgeRoot, () => {});

    expect(fs.existsSync(path.join(target, ".forge", "preflight.json"))).toBe(true);
    expect(fs.existsSync(path.join(target, ".forge", "preflight-wechat.example.json"))).toBe(true);

    fs.rmSync(forgeRoot, { recursive: true, force: true });
    fs.rmSync(target, { recursive: true, force: true });
  });

  it("resolvePaths uses forge root", () => {
    const { src, dest } = resolvePaths("claude-code", target, forgeRoot);
    expect(src).toBe(path.join(forgeRoot, "adapters/claude-code/.claude"));
    expect(dest).toBe(path.join(target, ".claude"));
  });

  it("installs minimal loadout — filters skills/agents and writes marker", () => {
    const adapterRoot = path.join(forgeRoot, "adapters/claude-code/.claude");
    const skillsRoot = path.join(adapterRoot, "skills");
    for (const name of [
      "product-spec-builder",
      "dev-builder",
      "bug-fixer",
      "code-review",
      "feedback-writer",
      "change-manager",
      "dev-planner",
    ]) {
      fs.mkdirSync(path.join(skillsRoot, name), { recursive: true });
      fs.writeFileSync(path.join(skillsRoot, name, "SKILL.md"), `# ${name}`);
    }
    fs.mkdirSync(path.join(skillsRoot, "_shared"), { recursive: true });
    fs.writeFileSync(path.join(skillsRoot, "_shared", "karpathy-discipline.md"), "# shared");
    fs.writeFileSync(path.join(skillsRoot, "AGENTS.md"), "# agents");
    fs.mkdirSync(path.join(adapterRoot, "agents"), { recursive: true });
    fs.writeFileSync(path.join(adapterRoot, "agents/implementer.md"), "# impl");
    fs.writeFileSync(path.join(adapterRoot, "agents/planner.md"), "# plan");

    fs.mkdirSync(path.join(forgeRoot, "core/loadouts"), { recursive: true });
    fs.copyFileSync(
      path.join(REPO_ROOT, "core/loadouts/minimal.json"),
      path.join(forgeRoot, "core/loadouts/minimal.json"),
    );

    const result = installForge("claude-code", target, {
      forgeRoot,
      log: () => {},
      loadout: "minimal",
    });

    expect(result.loadout).toBe("minimal");
    const destSkills = path.join(result.destPath, "skills");
    expect(fs.existsSync(path.join(destSkills, "dev-builder/SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(destSkills, "_shared/karpathy-discipline.md"))).toBe(true);
    expect(fs.existsSync(path.join(destSkills, "change-manager/SKILL.md"))).toBe(false);
    expect(fs.existsSync(path.join(destSkills, "dev-planner/SKILL.md"))).toBe(false);
    expect(fs.existsSync(path.join(result.destPath, "agents/implementer.md"))).toBe(true);
    expect(fs.existsSync(path.join(result.destPath, "agents/planner.md"))).toBe(false);

    const marker = JSON.parse(
      fs.readFileSync(path.join(target, ".forge/loadout-active.json"), "utf-8"),
    ) as { name: string; skills: string[] };
    expect(marker.name).toBe("minimal");
    expect(marker.skills).toHaveLength(5);

    const settings = JSON.parse(
      fs.readFileSync(path.join(result.destPath, "settings.json"), "utf-8"),
    ) as { hooks?: Record<string, unknown> };
    expect(settings.hooks?.PreCommit).toBeDefined();
  });
});

describe("shouldIncludeForLoadout", () => {
  it("includes only loadout skills plus _shared", () => {
    const loadout = loadLoadout("minimal", REPO_ROOT);
    const layout = ADAPTER_LAYOUT["claude-code"];

    expect(shouldIncludeForLoadout("skills/dev-builder/SKILL.md", loadout, layout)).toBe(true);
    expect(shouldIncludeForLoadout("skills/_shared/foo.md", loadout, layout)).toBe(true);
    expect(shouldIncludeForLoadout("skills/change-manager/SKILL.md", loadout, layout)).toBe(false);
    expect(shouldIncludeForLoadout("agents/implementer.md", loadout, layout)).toBe(true);
    expect(shouldIncludeForLoadout("agents/planner.md", loadout, layout)).toBe(false);
    expect(shouldIncludeForLoadout("CLAUDE.md", loadout, layout)).toBe(true);
  });
});
