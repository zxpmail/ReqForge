/**
 * forge-ops alerts — notification channels
 *
 * Supports: console (default), with extension points for Feishu/Slack/Email.
 */
export function sendAlert(message, level = "warn") {
  const prefix = { error: "❌", warn: "⚠️", info: "ℹ️" }[level] || "ℹ️";
  console.log(`[${prefix}][forge-ops] ${message}`);
  return true;
}

export function formatError(context, err) {
  return `${context}: ${err?.message || String(err)}`;
}
