import { describe, it, expect, vi } from "vitest";
import { sendConsole, formatError, sendSlack, sendFeishu } from "../alerts.mjs";

describe("alerts", () => {
  it("sendConsole logs message", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    sendConsole("test message", "info");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("test message"));
    spy.mockRestore();
  });

  it("sendConsole handles error level", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    sendConsole("critical", "error");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("critical"));
    spy.mockRestore();
  });

  it("sendSlack returns false when webhook fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network error"));
    const result = await sendSlack("https://hooks.slack.com/test", "test", "info");
    expect(result).toBe(false);
    vi.restoreAllMocks();
  });

  it("sendFeishu returns false when webhook fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network error"));
    const result = await sendFeishu("https://open.feishu.cn/test", "test", "info");
    expect(result).toBe(false);
    vi.restoreAllMocks();
  });

  it("sendSlack returns true on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({ ok: true });
    const result = await sendSlack("https://hooks.slack.com/test", "test", "info");
    expect(result).toBe(true);
    vi.restoreAllMocks();
  });

  it("sendFeishu returns true on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({ ok: true });
    const result = await sendFeishu("https://open.feishu.cn/test", "test", "info");
    expect(result).toBe(true);
    vi.restoreAllMocks();
  });

  it("formatError formats message", () => {
    const err = new Error("test error");
    expect(formatError("health check", err)).toContain("test error");
  });

  it("formatError handles string error", () => {
    expect(formatError("ops", "string error")).toContain("string error");
  });
});
