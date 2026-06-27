import { describe, it, expect } from "vitest";

// 解析逻辑与 CLI 同文件，供单测
import { parseRemoteToWikiUrl } from "../forge-wiki-sync.mjs";

describe("forge-wiki-sync", () => {
  it("parseRemoteToWikiUrl — HTTPS", () => {
    expect(parseRemoteToWikiUrl("https://github.com/zxpmail/ReqForge.git")).toBe(
      "https://github.com/zxpmail/ReqForge.wiki.git",
    );
  });

  it("parseRemoteToWikiUrl — SSH", () => {
    expect(parseRemoteToWikiUrl("git@github.com:zxpmail/ReqForge.git")).toBe(
      "https://github.com/zxpmail/ReqForge.wiki.git",
    );
  });

  it("parseRemoteToWikiUrl — rejects invalid remote", () => {
    expect(() => parseRemoteToWikiUrl("not-a-url")).toThrow(/无法解析/);
  });
});
