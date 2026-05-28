import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  collectFiles,
  formatReport,
  globMatch,
  loadPreflightConfig,
  runPreflight,
} from "../preflight";

describe("globMatch", () => {
  it("matches glob patterns", () => {
    expect(globMatch("draft/**/*.html", "draft/a.html")).toBe(true);
    expect(globMatch("draft/**/*.html", "other/a.html")).toBe(false);
  });
});

describe("runPreflight", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reqforge-preflight-"));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("passes maxBytes check", () => {
    fs.mkdirSync(path.join(tmp, "draft"), { recursive: true });
    fs.mkdirSync(path.join(tmp, ".forge"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "draft", "title.txt"), "short");
    fs.writeFileSync(
      path.join(tmp, ".forge", "preflight.json"),
      JSON.stringify({
        version: 1,
        maxBytes: [{ file: "draft/title.txt", max: 64 }],
      }),
    );

    const { passed, results } = runPreflight({ cwd: tmp });
    expect(passed).toBe(true);
    expect(results.find((r) => r.id.startsWith("max-bytes"))?.ok).toBe(true);
  });

  it("fails mustNotMatch regex", () => {
    fs.mkdirSync(path.join(tmp, "draft"), { recursive: true });
    fs.mkdirSync(path.join(tmp, ".forge"), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, "draft", "article.html"),
      '<img src="https://example.com/x.png">',
    );
    fs.writeFileSync(
      path.join(tmp, ".forge", "preflight.json"),
      JSON.stringify({
        version: 1,
        regexChecks: [
          {
            id: "no-external",
            glob: "draft/**/*.html",
            mustNotMatch: 'src=["\']https?://',
          },
        ],
      }),
    );

    const { passed, errorCount } = runPreflight({ cwd: tmp, allowDirtyGit: true });
    expect(passed).toBe(false);
    expect(errorCount).toBeGreaterThan(0);
  });

  it("scans build dir for api keys", () => {
    const dist = path.join(tmp, "dist");
    fs.mkdirSync(dist, { recursive: true });
    fs.writeFileSync(path.join(dist, "app.js"), "const k = 'sk-ant-abc';");

    const { passed } = runPreflight({ cwd: tmp, buildDir: dist, allowDirtyGit: true });
    expect(passed).toBe(false);
  });
});

describe("loadPreflightConfig", () => {
  it("returns null when missing", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reqforge-pf-cfg-"));
    expect(loadPreflightConfig(tmp)).toBeNull();
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});

describe("formatReport", () => {
  it("includes blocked message", () => {
    const text = formatReport(
      [{ id: "x", severity: "error", ok: false, message: "fail" }],
      false,
      1,
      0,
    );
    expect(text).toContain("BLOCKED");
    expect(text).toContain("❌");
  });
});

describe("collectFiles", () => {
  it("finds nested html", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reqforge-pf-collect-"));
    fs.mkdirSync(path.join(tmp, "draft"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "draft", "a.html"), "");
    const files = collectFiles(tmp, "draft/**/*.html");
    expect(files.some((f) => f.endsWith("a.html"))).toBe(true);
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
