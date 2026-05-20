import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { copyFile, SKIP_FILES, syncDir } from "../sync";

describe("SKIP_FILES", () => {
  it("includes ReqForge-only check-sync hooks", () => {
    expect(SKIP_FILES.has("check-sync.sh")).toBe(true);
    expect(SKIP_FILES.has("check-sync.bat")).toBe(true);
  });
});

describe("syncDir", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reqforge-sync-"));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("copies files and subdirectories", () => {
    const src = path.join(tmp, "src");
    const dest = path.join(tmp, "dest");
    fs.mkdirSync(path.join(src, "nested"), { recursive: true });
    fs.writeFileSync(path.join(src, "root.txt"), "root");
    fs.writeFileSync(path.join(src, "nested", "child.txt"), "child");

    syncDir(src, dest);

    expect(fs.readFileSync(path.join(dest, "root.txt"), "utf-8")).toBe("root");
    expect(fs.readFileSync(path.join(dest, "nested", "child.txt"), "utf-8")).toBe("child");
  });

  it("skips check-sync hook files", () => {
    const src = path.join(tmp, "src");
    const dest = path.join(tmp, "dest");
    fs.mkdirSync(src);
    fs.writeFileSync(path.join(src, "check-sync.sh"), "#!/bin/sh");
    fs.writeFileSync(path.join(src, "check-sync.bat"), "@echo off");
    fs.writeFileSync(path.join(src, "keep.txt"), "ok");

    syncDir(src, dest);

    expect(fs.existsSync(path.join(dest, "check-sync.sh"))).toBe(false);
    expect(fs.existsSync(path.join(dest, "check-sync.bat"))).toBe(false);
    expect(fs.readFileSync(path.join(dest, "keep.txt"), "utf-8")).toBe("ok");
  });

  it("replaces existing destination directory", () => {
    const src = path.join(tmp, "src");
    const dest = path.join(tmp, "dest");
    fs.mkdirSync(src);
    fs.mkdirSync(dest, { recursive: true });
    fs.writeFileSync(path.join(src, "new.txt"), "new");
    fs.writeFileSync(path.join(dest, "stale.txt"), "stale");

    syncDir(src, dest);

    expect(fs.existsSync(path.join(dest, "stale.txt"))).toBe(false);
    expect(fs.readFileSync(path.join(dest, "new.txt"), "utf-8")).toBe("new");
  });

  it("does not create destination when source is missing", () => {
    const dest = path.join(tmp, "dest");
    syncDir(path.join(tmp, "missing"), dest);
    expect(fs.existsSync(dest)).toBe(false);
  });
});

describe("copyFile", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reqforge-copy-"));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("copies a file and creates parent directories", () => {
    const src = path.join(tmp, "src.txt");
    const dest = path.join(tmp, "nested", "dest.txt");
    fs.writeFileSync(src, "payload");

    copyFile(src, dest);

    expect(fs.readFileSync(dest, "utf-8")).toBe("payload");
  });

  it("does nothing when source is missing", () => {
    const dest = path.join(tmp, "dest.txt");
    copyFile(path.join(tmp, "missing.txt"), dest);
    expect(fs.existsSync(dest)).toBe(false);
  });
});
