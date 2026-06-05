/**
 * forge-ops alerts — notification channels
 *
 * Supports: console (always), Slack webhook, Feishu/Lark webhook.
 * Reads notification config from .forge/ops/config.json.
 */

import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

let _config = null;

function loadConfig() {
  if (_config) return _config;
  const cfgPath = join(ROOT, ".forge", "ops", "config.json");
  if (!existsSync(cfgPath)) return null;
  try {
    _config = JSON.parse(readFileSync(cfgPath, "utf-8"));
    return _config;
  } catch {
    return null;
  }
}

function getLevelPrefix(level) {
  return { error: "❌", warn: "⚠️", info: "ℹ️", success: "✅" }[level] || "ℹ️";
}

/**
 * Send a console alert.
 * @param {string} message
 * @param {string} level - error | warn | info | success
 */
export function sendConsole(message, level = "warn") {
  const prefix = getLevelPrefix(level);
  console.log(`[${prefix}][forge-ops] ${message}`);
}

/**
 * Send a Slack webhook message.
 * Uses Slack Block Kit for structured messages.
 *
 * @param {string} webhookUrl
 * @param {string} message
 * @param {string} level
 * @returns {Promise<boolean>}
 */
export async function sendSlack(webhookUrl, message, level = "warn") {
  const colors = { error: "#FF0000", warn: "#FFA500", info: "#1E90FF", success: "#008000" };
  try {
    const body = {
      attachments: [{
        color: colors[level] || "#CCCCCC",
        blocks: [
          {
            type: "section",
            text: { type: "mrkdwn", text: `*${getLevelPrefix(level)} forge-ops alert*` },
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: message },
          },
          {
            type: "context",
            elements: [{
              type: "mrkdwn",
              text: `Timestamp: ${new Date().toISOString()}`,
            }],
          },
        ],
      }],
    };
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * Send a Feishu/Lark webhook message.
 * Uses Feishu interactive card format.
 *
 * @param {string} webhookUrl
 * @param {string} message
 * @param {string} level
 * @returns {Promise<boolean>}
 */
export async function sendFeishu(webhookUrl, message, level = "warn") {
  const colors = { error: "red", warn: "orange", info: "blue", success: "green" };
  try {
    const body = {
      msg_type: "interactive",
      card: {
        header: {
          title: { tag: "plain_text", content: `${getLevelPrefix(level)} forge-ops alert` },
          template: colors[level] || "grey",
        },
        elements: [
          { tag: "markdown", content: message },
          { tag: "note", elements: [{ tag: "plain_text", content: `Timestamp: ${new Date().toISOString()}` }] },
        ],
      },
    };
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * Send an alert through all configured channels.
 * Reads notification config from config.json.
 * Falls back to console only if no channels configured.
 *
 * @param {string} message
 * @param {string} level
 * @param {object} [opts] - optional override { slackWebhook, feishuWebhook }
 * @returns {Promise<{ console: boolean, slack: boolean|null, feishu: boolean|null }>}
 */
export async function sendAlert(message, level = "warn", opts = {}) {
  const result = { console: false, slack: null, feishu: null };

  // Always console
  sendConsole(message, level);
  result.console = true;

  const config = loadConfig();
  const slackWebhook = opts?.slackWebhook || config?.notifications?.slack?.webhook;
  const feishuWebhook = opts?.feishuWebhook || config?.notifications?.feishu?.webhook;

  if (slackWebhook) {
    result.slack = await sendSlack(slackWebhook, message, level);
  }
  if (feishuWebhook) {
    result.feishu = await sendFeishu(feishuWebhook, message, level);
  }

  return result;
}

/**
 * Format an error for alert consumption.
 * @param {string} context
 * @param {Error|string} err
 * @returns {string}
 */
export function formatError(context, err) {
  return `${context}: ${err?.message || String(err)}`;
}
