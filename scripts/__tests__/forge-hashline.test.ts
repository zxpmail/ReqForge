import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

type HashlineMod = typeof import("../forge-hashline.mjs");

let computeHash: HashlineMod["computeHash"];
let computeFileHash: HashlineMod["computeFileHash"];
let computeBlockHash: HashlineMod["computeBlockHash"];
let hashMatches: HashlineMod["hashMatches"];
let safeReplaceFile: HashlineMod["safeReplaceFile"];
let safeReplaceBlock: HashlineMod["safeReplaceBlock"];
let generateManifest: HashlineMod["generateManifest"];
let parseBriefHashes: HashlineMod["parseBriefHashes"];
let verifyBrief: HashlineMod["verifyBrief"];
let applyBrief: HashlineMod["applyBrief"];

beforeAll(async () => {
  const mod = await import("../forge-hashline.mjs");
  ({
    computeHash,
    computeFileHash,
    computeBlockHash,
    hashMatches,
    safeReplaceFile,
    safeReplaceBlock,
    generateManifest,
    parseBriefHashes,
    verifyBrief,
    applyBrief,
  } = mod);
});

const TMP = join(tmpdir(), "forge-hashline-test");

describe("computeHash", () => {
  it("returns sha256: prefixed 64-char hex string", () => {
    const hash = computeHash("hello");
    expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("is deterministic for same input", () => {
    expect(computeHash("hello")).toBe(computeHash("hello"));
  });

  it("differs for different input", () => {
    expect(computeHash("hello")).not.toBe(computeHash("world"));
  });

  it("normalizes CRLF to LF", () => {
    expect(computeHash("a\r\nb")).toBe(computeHash("a\nb"));
  });
});

describe("hashMatches", () => {
  const full = "sha256:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2";

  it("exact full match", () => {
    const r = hashMatches(full, full);
    expect(r.match).toBe(true);
    expect(r.fuzzy).toBe(false);
  });

  it("8-char prefix match (fuzzy)", () => {
    const r = hashMatches("sha256:a1b2c3d4", full);
    expect(r.match).toBe(true);
    expect(r.fuzzy).toBe(true);
  });

  it("rejects prefix shorter than 8 chars", () => {
    expect(hashMatches("sha256:a1b2", full).match).toBe(false);
  });

  it("rejects wrong hash", () => {
    const bad = "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    expect(hashMatches(bad, full).match).toBe(false);
  });

  it("handles input without sha256: prefix", () => {
    const noPrefix = full.replace("sha256:", "");
    const r = hashMatches(noPrefix, full);
    expect(r.match).toBe(true);
    expect(r.fuzzy).toBe(false);
  });
});

describe("safeReplaceFile", () => {
  const testFile = join(TMP, "replace-test.txt");

  beforeAll(() => {
    mkdirSync(TMP, { recursive: true });
    writeFileSync(testFile, "original content", "utf-8");
  });

  afterAll(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it("replaces file when hash matches", () => {
    const hash = computeFileHash(testFile);
    const result = safeReplaceFile(testFile, hash, "new content");
    expect(result.ok).toBe(true);
    expect(result.newHash).toBe(computeFileHash(testFile));
    expect(readFileSync(testFile, "utf-8")).toBe("new content");
  });

  it("refuses when hash does not match (STALE_ANCHOR)", () => {
    const badHash = "sha256:0000000000000000000000000000000000000000000000000000000000000000";
    const result = safeReplaceFile(testFile, badHash, "data");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("STALE_ANCHOR");
  });

  it("refuses for nonexistent file (ENOENT)", () => {
    const result = safeReplaceFile("/nonexistent/file.txt", "sha256:abc", "data");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("ENOENT");
  });
});

describe("safeReplaceBlock", () => {
  const testFile = join(TMP, "block-test.txt");

  beforeAll(() => {
    mkdirSync(TMP, { recursive: true });
    const content = ["line 1", "line 2", "line 3", "line 4 to replace", "line 5 to replace"].join("\n");
    writeFileSync(testFile, content, "utf-8");
  });

  afterAll(() => {
    try { rmSync(TMP, { recursive: true, force: true }); } catch {}
  });

  it("replaces block when hash matches", () => {
    const blockHash = computeBlockHash(testFile, 4, 5);
    const result = safeReplaceBlock(testFile, 4, 5, blockHash, "new line 4\nnew line 5");
    expect(result.ok).toBe(true);
    const content = readFileSync(testFile, "utf-8");
    expect(content).toContain("new line 4");
    expect(content).toContain("new line 5");
  });

  it("refuses block when hash does not match", () => {
    const result = safeReplaceBlock(testFile, 4, 5, "sha256:bad", "x");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("STALE_ANCHOR");
  });
});

describe("generateManifest", () => {
  const testFile = join(TMP, "manifest-test.txt");

  beforeAll(() => {
    mkdirSync(TMP, { recursive: true });
    writeFileSync(testFile, "hello", "utf-8");
  });

  it("creates manifest with hashes", () => {
    const result = generateManifest([testFile], TMP);
    expect(result.manifest).toBeDefined();
    const key = Object.keys(result.manifest)[0];
    expect(key.endsWith("manifest-test.txt")).toBe(true);
    expect(result.manifest[key].hash).toMatch(/^sha256:/);
    expect(typeof result.manifest[key].size).toBe("number");
  });
});

describe("parseBriefHashes", () => {
  const briefFile = join(TMP, "fix-brief-test.md");

  beforeAll(() => {
    mkdirSync(TMP, { recursive: true });
  });

  it("returns ENOENT for missing file", () => {
    const r = parseBriefHashes("/nonexistent/brief.md");
    expect(r.error).toBe("ENOENT");
  });

  it("parses hashline entries from markdown brief", () => {
    const brief = [
      `# Fix Brief`,
      ``,
      `**Hashline**:`,
      `  \`src/file-a.ts\` → \`sha256:abc123def456abc123def456abc123def456abc123def456abc123def456\``,
      `  \`src/file-b.ts\` → (新文件)  # 创建后将生成哈希`,
      ``,
      `Some other content`,
    ].join("\n");
    writeFileSync(briefFile, brief, "utf-8");
    const r = parseBriefHashes(briefFile);
    expect(r.error).toBeUndefined();
    expect(r.entries).toHaveLength(2);
    expect(r.entries[0].file).toBe("src/file-a.ts");
    expect(r.entries[0].isNew).toBe(false);
    expect(r.entries[0].hash).toMatch(/^sha256:/);
    expect(r.entries[1].file).toBe("src/file-b.ts");
    expect(r.entries[1].isNew).toBe(true);
    expect(r.entries[1].hash).toBeNull();
  });

  it("stops hashline block at empty line", () => {
    const brief = [
      `**Hashline**:`,
      `  \`src/file-a.ts\` → \`sha256:abc123def456abc123def456abc123def456abc123def456abc123def456\``,
      ``,
      `**Other section**: not a hashline`,
    ].join("\n");
    writeFileSync(briefFile, brief, "utf-8");
    const r = parseBriefHashes(briefFile);
    expect(r.entries).toHaveLength(1);
  });

  it("returns empty array for brief without hashline", () => {
    writeFileSync(briefFile, "# No hashline here", "utf-8");
    const r = parseBriefHashes(briefFile);
    expect(r.entries).toHaveLength(0);
  });

  afterAll(() => {
    try { rmSync(TMP, { recursive: true, force: true }); } catch {}
  });
});

describe("verifyBrief", () => {
  const testDir = join(TMP, "verify-test");
  const briefFile = join(testDir, "brief.md");

  beforeAll(() => {
    mkdirSync(testDir, { recursive: true });
    writeFileSync(join(testDir, "existing-file.ts"), "hello world", "utf-8");
  });

  afterAll(() => {
    try { rmSync(TMP, { recursive: true, force: true }); } catch {}
  });

  it("before mode: returns OK for files with matching hash", () => {
    const hash = computeFileHash(join(testDir, "existing-file.ts"));
    const brief = `**Hashline**:\n  \`existing-file.ts\` → \`${hash}\`\n`;
    writeFileSync(briefFile, brief, "utf-8");
    const r = verifyBrief(briefFile, "before", testDir);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe("OK");
  });

  it("before mode: returns STALE for files with changed hash", () => {
    const badHash = "sha256:0000000000000000000000000000000000000000000000000000000000000000";
    const brief = `**Hashline**:\n  \`existing-file.ts\` → \`${badHash}\`\n`;
    writeFileSync(briefFile, brief, "utf-8");
    const r = verifyBrief(briefFile, "before", testDir);
    expect(r.ok).toBe(false);
    expect(r.results[0].status).toBe("STALE");
  });

  it("before mode: returns MISSING for nonexistent file", () => {
    const hash = "sha256:abc123def456abc123def456abc123def456abc123def456abc123def456abc1";
    const brief = `**Hashline**:\n  \`nonexistent.ts\` → \`${hash}\`\n`;
    writeFileSync(briefFile, brief, "utf-8");
    const r = verifyBrief(briefFile, "before", testDir);
    expect(r.ok).toBe(false);
    expect(r.results[0].status).toBe("MISSING");
  });

  it("before mode: returns ALREADY_EXISTS for new file that exists", () => {
    const brief = `**Hashline**:\n  \`existing-file.ts\` → (新文件)  # already exists\n`;
    writeFileSync(briefFile, brief, "utf-8");
    const r = verifyBrief(briefFile, "before", testDir);
    expect(r.ok).toBe(false);
    expect(r.results[0].status).toBe("ALREADY_EXISTS");
  });

  it("before mode: allows new file that does not exist", () => {
    const brief = `**Hashline**:\n  \`new-file.ts\` → (新文件)  # will create\n`;
    writeFileSync(briefFile, brief, "utf-8");
    const r = verifyBrief(briefFile, "before", testDir);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe("OK");
  });

  it("after mode: returns OK when existing file hash changed (was edited)", () => {
    const originalHash = computeFileHash(join(testDir, "existing-file.ts"));
    const brief = `**Hashline**:\n  \`existing-file.ts\` → \`${originalHash}\`\n`;
    writeFileSync(briefFile, brief, "utf-8");
    // Edit the file so hash changes
    writeFileSync(join(testDir, "existing-file.ts"), "modified content", "utf-8");
    const r = verifyBrief(briefFile, "after", testDir);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe("OK");
    expect(r.results[0].detail).toContain("Hash changed");
  });

  it("after mode: returns UNCHANGED when file hash still matches (was not edited)", () => {
    writeFileSync(join(testDir, "existing-file.ts"), "hello world", "utf-8");
    const originalHash = computeFileHash(join(testDir, "existing-file.ts"));
    const brief = `**Hashline**:\n  \`existing-file.ts\` → \`${originalHash}\`\n`;
    writeFileSync(briefFile, brief, "utf-8");
    // Do NOT edit the file
    const r = verifyBrief(briefFile, "after", testDir);
    expect(r.ok).toBe(false);
    expect(r.results[0].status).toBe("UNCHANGED");
  });

  it("after mode: returns MISSING when new file was not created", () => {
    const brief = `**Hashline**:\n  \`should-exist.ts\` → (新文件)\n`;
    writeFileSync(briefFile, brief, "utf-8");
    const r = verifyBrief(briefFile, "after", testDir);
    expect(r.ok).toBe(false);
    expect(r.results[0].status).toBe("MISSING");
  });

  it("after mode: returns OK when new file was created", () => {
    writeFileSync(join(testDir, "should-exist.ts"), "new content", "utf-8");
    const brief = `**Hashline**:\n  \`should-exist.ts\` → (新文件)\n`;
    writeFileSync(briefFile, brief, "utf-8");
    const r = verifyBrief(briefFile, "after", testDir);
    expect(r.ok).toBe(true);
    expect(r.results[0].status).toBe("OK");
    expect(r.results[0].detail).toContain("File created");
  });

  it("returns error for missing brief file", () => {
    const r = verifyBrief("/nonexistent/brief.md", "before");
    expect(r.error).toBe("ENOENT");
  });

  it("accepts 'pre' as alias for 'before'", () => {
    writeFileSync(join(testDir, "for-pre.ts"), "data", "utf-8");
    const hash = computeFileHash(join(testDir, "for-pre.ts"));
    const brief = `**Hashline**:\n  \`for-pre.ts\` → \`${hash}\`\n`;
    writeFileSync(briefFile, brief, "utf-8");
    const r = verifyBrief(briefFile, "pre", testDir);
    expect(r.ok).toBe(true);
  });
});

describe("applyBrief", () => {
  const testDir = join(TMP, "apply-test");
  const briefFile = join(testDir, "brief.md");

  beforeAll(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    try { rmSync(TMP, { recursive: true, force: true }); } catch {}
  });

  it("creates new files marked as (新文件)", () => {
    const brief = `**Hashline**:\n  \`new-file-a.ts\` → (新文件)\n  \`sub/new-file-b.ts\` → (新文件)\n`;
    writeFileSync(briefFile, brief, "utf-8");
    const r = applyBrief(briefFile, testDir);
    expect(r.ok).toBe(true);
    expect(r.created).toEqual(["new-file-a.ts", "sub/new-file-b.ts"]);
    expect(existsSync(join(testDir, "new-file-a.ts"))).toBe(true);
    expect(existsSync(join(testDir, "sub", "new-file-b.ts"))).toBe(true);
  });

  it("does not recreate existing files", () => {
    writeFileSync(join(testDir, "existing.ts"), "data", "utf-8");
    const brief = `**Hashline**:\n  \`existing.ts\` → (新文件)\n`;
    writeFileSync(briefFile, brief, "utf-8");
    const r = applyBrief(briefFile, testDir);
    expect(r.created).toHaveLength(0);
  });

  it("skips hash-anchored entries (not marked as new)", () => {
    const brief = `**Hashline**:\n  \`some-file.ts\` → \`sha256:abc123def456abc123def456abc123def456abc123def456abc123def456\`\n`;
    writeFileSync(briefFile, brief, "utf-8");
    const r = applyBrief(briefFile, testDir);
    expect(r.created).toHaveLength(0);
  });

  it("returns error for missing brief", () => {
    const r = applyBrief("/nonexistent/brief.md");
    expect(r.error).toBe("ENOENT");
  });
});
