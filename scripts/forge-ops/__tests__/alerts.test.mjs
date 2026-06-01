import { describe, it, expect } from "vitest";
import { sendAlert, formatError } from "../alerts.mjs";

describe("alerts", () => {
  it("sendAlert returns true", () => {
    expect(sendAlert("test", "info")).toBe(true);
  });

  it("sendAlert handles error level", () => {
    expect(sendAlert("critical", "error")).toBe(true);
  });

  it("formatError formats message", () => {
    const err = new Error("test error");
    expect(formatError("health check", err)).toContain("test error");
  });
});
