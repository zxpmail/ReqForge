import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyWindowsSettings,
  copyInstallTree,
  installForge,
  installForgeQuickref,
  installPreflightConfig,
  installSecurityGuidance,
  parseInstallArgs,
  resolvePaths,
  shouldSkipOverwrite,
} from "../install";

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

  it("installForgeQuickref skips existing without force", () => {
    const quickrefSrc = path.join(forgeRoot, "core/templates");
    fs.mkdirSync(quickrefSrc, { recursive: true });
    fs.writeFileSync(path.join(quickrefSrc, "forge-quickref.md"), "# new");
    fs.mkdirSync(path.join(target, ".forge"), { recursive: true });
    fs.writeFileSync(path.join(target, ".forge/quickref.md"), "# old");

    installForgeQuickref(target, forgeRoot, () => {}, false);

    expect(fs.readFileSync(path.join(target, ".forge/quickref.md"), "utf-8")).toBe("# old");
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
});
