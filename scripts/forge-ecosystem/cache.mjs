/**
 * cache.mjs — Global ecosystem cache read/write at ~/.forge/ecosystem/.
 *
 * Each language has its own JSON file: ~/.forge/ecosystem/<lang>.json.
 * Directory is created on first write.
 *
 * For testing, call setCacheDirForTest(path) to override the cache directory.
 */

import { join } from "path";
import { homedir } from "os";
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, statSync } from "fs";

/** @type {string|null} — Override for testing. When set, replaces the default ~/.forge/ecosystem path. */
let _testCacheDir = null;

/**
 * Override the cache directory for testing.
 * Pass null to reset to the default (~/.forge/ecosystem).
 * @param {string|null} dir
 */
export function setCacheDirForTest(dir) {
  _testCacheDir = dir;
}

/**
 * Returns the ecosystem cache directory path.
 * @returns {string}
 */
export function getCacheDir() {
  if (_testCacheDir) return join(_testCacheDir, "ecosystem");
  return join(homedir(), ".forge", "ecosystem");
}

/**
 * Ensures the cache directory exists.
 * Creates parent directories if needed.
 * @returns {boolean} true if directory exists or was created
 */
export function ensureCacheDir() {
  const dir = getCacheDir();
  try {
    mkdirSync(dir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the full path for a language cache file.
 * @param {string} lang
 * @returns {string}
 */
export function getCachePath(lang) {
  return join(getCacheDir(), `${lang}.json`);
}

/**
 * Reads and parses a language cache file.
 * @param {string} lang — lowercase language name
 * @returns {object|null} — parsed cache data, or null if missing/corrupted
 */
export function readCache(lang) {
  const filePath = getCachePath(lang);
  try {
    if (!existsSync(filePath)) return null;
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`⚠️  Corrupted cache file: ${filePath} — ${err.message}`);
    return null;
  }
}

/**
 * Writes cache data for a language.
 * @param {string} lang
 * @param {object} data
 * @returns {{ ok: boolean, path?: string, error?: string }}
 */
export function writeCache(lang, data) {
  try {
    ensureCacheDir();
    const filePath = getCachePath(lang);
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return { ok: true, path: filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Checks if a language cache is fresh (modified within maxAgeDays).
 * @param {string} lang
 * @param {number} [maxAgeDays=30]
 * @returns {boolean}
 */
export function isCacheFresh(lang, maxAgeDays = 30) {
  const filePath = getCachePath(lang);
  try {
    if (!existsSync(filePath)) return false;
    const mtime = statSync(filePath).mtimeMs;
    const ageMs = Date.now() - mtime;
    return ageMs < maxAgeDays * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Deletes a language cache file.
 * @param {string} lang
 * @returns {{ ok: boolean, error?: string }}
 */
export function clearCache(lang) {
  const filePath = getCachePath(lang);
  try {
    if (existsSync(filePath)) rmSync(filePath);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Returns aggregate cache statistics.
 * @returns {{ languages: string[], totalEntries: number, oldest: string|null, newest: string|null, sizeBytes: number }}
 */
export function getCacheStats() {
  const dir = getCacheDir();
  const stats = { languages: [], totalEntries: 0, oldest: null, newest: null, sizeBytes: 0 };

  try {
    if (!existsSync(dir)) return stats;

    const files = readdirSync(dir).filter(f => f.endsWith(".json"));
    let oldestMs = Infinity, newestMs = 0;

    for (const file of files) {
      const filePath = join(dir, file);
      const fstat = statSync(filePath);
      if (!fstat.isFile()) continue;

      const lang = file.replace(/\.json$/, "");
      stats.languages.push(lang);
      stats.sizeBytes += fstat.size;

      if (fstat.mtimeMs < oldestMs) { oldestMs = fstat.mtimeMs; stats.oldest = lang; }
      if (fstat.mtimeMs > newestMs) { newestMs = fstat.mtimeMs; stats.newest = lang; }

      // Count entries across all categories
      try {
        const data = JSON.parse(readFileSync(filePath, "utf-8"));
        if (data.entries) {
          for (const cat of Object.keys(data.entries)) {
            stats.totalEntries += data.entries[cat].length;
          }
        }
      } catch {
        // Skip corrupted files in stats
      }
    }
  } catch {
    // Return partial stats on error
  }

  return stats;
}
