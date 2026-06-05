/**
 * forge-ops deploy — deployment execution + health wait + logging
 *
 * Executes a deploy command, waits for the service to become healthy,
 * and records the result to .forge/ops/deploy-log.json.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const OPS_DIR = join(process.cwd(), ".forge", "ops");
const DEPLOY_LOG = join(OPS_DIR, "deploy-log.json");

/**
 * Check if deploy cooldown period has elapsed since last deploy.
 * @param {number} cooldownMs - minimum milliseconds between deploys
 * @returns {boolean}
 */
export function isCooldownActive(cooldownMs = 300000) {
  if (!existsSync(DEPLOY_LOG)) return false;
  try {
    const log = JSON.parse(readFileSync(DEPLOY_LOG, "utf-8"));
    if (!Array.isArray(log) || log.length === 0) return false;
    const lastDeploy = log[log.length - 1];
    const elapsed = Date.now() - new Date(lastDeploy.timestamp).getTime();
    return elapsed < cooldownMs;
  } catch {
    return false;
  }
}

/**
 * Execute the deploy command.
 *
 * @param {object} config - deploy config from config.json
 * @param {string} config.command - shell command to execute
 * @returns {{ success: boolean, exitCode: number|null, durationMs: number, error: string|null }}
 */
export function triggerDeploy(config) {
  const command = config?.command;
  if (!command) {
    return { success: false, exitCode: null, durationMs: 0, error: "No deploy command configured" };
  }

  const start = Date.now();
  try {
    execSync(command, { cwd: process.cwd(), encoding: "utf-8", timeout: 300000, stdio: "pipe" });
    const durationMs = Date.now() - start;
    const result = { success: true, exitCode: 0, durationMs, error: null };
    recordDeploy(result);
    return result;
  } catch (e) {
    const durationMs = Date.now() - start;
    const result = { success: false, exitCode: e.status || 1, durationMs, error: e.message?.split("\n")[0] || "deploy failed" };
    recordDeploy(result);
    return result;
  }
}

/**
 * Wait for a URL to return healthy (2xx).
 * Polls at the given interval until timeout.
 *
 * @param {string} url
 * @param {number} [timeoutMs=300000]
 * @param {number} [intervalMs=10000]
 * @returns {Promise<{ ok: boolean, elapsedMs: number, attempts: number }>}
 */
export async function waitForHealthy(url, timeoutMs = 300000, intervalMs = 10000) {
  const start = Date.now();
  let attempts = 0;

  while (Date.now() - start < timeoutMs) {
    attempts++;
    try {
      const resp = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10000) });
      if (resp.ok) {
        return { ok: true, elapsedMs: Date.now() - start, attempts };
      }
    } catch {
      // Not healthy yet
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }

  return { ok: false, elapsedMs: Date.now() - start, attempts };
}

/**
 * Record a deploy result to deploy-log.json.
 *
 * @param {{ success: boolean, exitCode: number|null, durationMs: number, error: string|null }} result
 */
export function recordDeploy(result) {
  const entry = {
    timestamp: new Date().toISOString(),
    ...result,
  };

  mkdirSync(OPS_DIR, { recursive: true });

  let log = [];
  if (existsSync(DEPLOY_LOG)) {
    try {
      log = JSON.parse(readFileSync(DEPLOY_LOG, "utf-8"));
    } catch {
      log = [];
    }
  }

  log.push(entry);
  writeFileSync(DEPLOY_LOG, JSON.stringify(log, null, 2), "utf-8");
}

/**
 * Read recent deploy history.
 *
 * @param {number} [limit=10]
 * @returns {object[]}
 */
export function readDeployLog(limit = 10) {
  if (!existsSync(DEPLOY_LOG)) return [];
  try {
    const log = JSON.parse(readFileSync(DEPLOY_LOG, "utf-8"));
    return Array.isArray(log) ? log.slice(-limit) : [];
  } catch {
    return [];
  }
}
