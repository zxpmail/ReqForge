import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// Dynamic import of .mjs module
const mod = await import("../forge-hashline.mjs");
const {
  computeHash,
  computeFileHash,
  computeBlockHash,
  hashMatches,
  safeReplaceFile,
  safeReplaceBlock,
  generateManifest,
} = mod;

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
