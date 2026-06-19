import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { adaptAgentContent, AGENT_DIR_SKIP, copyFile, SKIP_FILES, syncDir } from "../sync";

describe("SKIP_FILES", () => {
  it("includes ReqForge-only check-sync hooks", () => {
    expect(SKIP_FILES.has("check-sync.sh")).toBe(true);
    expect(SKIP_FILES.has("check-sync.bat")).toBe(true);
  });
});

describe("AGENT_DIR_SKIP", () => {
  it("includes AGENTS.md so it is not emitted as a bogus agent entry", () => {
    expect(AGENT_DIR_SKIP.has("AGENTS.md")).toBe(true);
  });

  it("inherits the ReqForge-only check-sync hooks from SKIP_FILES", () => {
    expect(AGENT_DIR_SKIP.has("check-sync.sh")).toBe(true);
    expect(AGENT_DIR_SKIP.has("check-sync.bat")).toBe(true);
  });
});

describe("adaptAgentContent", () => {
  it("normalizes opus/sonnet/haiku to `inherit` for every non-Claude adapter", () => {
    for (const adapter of ["cursor", "opencode", "gemini-cli"]) {
      for (const alias of ["opus", "sonnet", "haiku"]) {
        expect(adaptAgentContent(adapter, `model: ${alias}`)).toBe("model: inherit");
      }
    }
  });

  it("preserves leading/trailing whitespace around the model value", () => {
    expect(adaptAgentContent("cursor", "  model:  sonnet  ")).toBe("  model:  inherit  ");
  });

  it("leaves the claude-code adapter's model pinning untouched", () => {
    expect(adaptAgentContent("claude-code", "model: opus")).toBe("model: opus");
    expect(adaptAgentContent("claude-code", "model: sonnet")).toBe("model: sonnet");
    expect(adaptAgentContent("claude-code", "model: haiku")).toBe("model: haiku");
  });

  it("does not touch non-model lines (other frontmatter, prose, comments)", () => {
    const content = [
      "---",
      "name: implementer",
      "description: builds features",
      "# model: opus",
      "modelAlias: opus is configured elsewhere",
      "---",
      "Some prose mentioning model: opus is not at line start.",
    ].join("\n");
    expect(adaptAgentContent("cursor", content)).toBe(content);
  });

  it("transforms only the model line within a full frontmatter block", () => {
    const content = [
      "---",
      "name: implementer",
      "model: opus",
      "description: builds features",
      "---",
      "body",
    ].join("\n");
    const out = adaptAgentContent("cursor", content);
    expect(out).toContain("model: inherit");
    expect(out).not.toContain("model: opus");
    expect(out).toContain("name: implementer");
    expect(out).toContain("body");
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

  it("excludes AGENTS.md and applies the agent model transform", () => {
    const src = path.join(tmp, "agents");
    const dest = path.join(tmp, "dest");
    fs.mkdirSync(src);
    fs.writeFileSync(path.join(src, "AGENTS.md"), "# agent index doc");
    fs.writeFileSync(path.join(src, "implementer.md"), "model: opus\nbody");

    syncDir(src, dest, {
      skip: AGENT_DIR_SKIP,
      transform: (c) => adaptAgentContent("cursor", c),
    });

    // AGENTS.md skipped -> no bogus "AGENTS" agent emitted into the destination
    expect(fs.existsSync(path.join(dest, "AGENTS.md"))).toBe(false);
    // real agent kept, and its Claude model alias normalized to `inherit`
    expect(fs.existsSync(path.join(dest, "implementer.md"))).toBe(true);
    expect(fs.readFileSync(path.join(dest, "implementer.md"), "utf-8")).toBe(
      "model: inherit\nbody"
    );
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
