/**
 * search.mjs — Search ecosystem cache and merge project-level overrides.
 *
 * Depends on: cache.mjs, cold-start.mjs
 */

import { readFileSync, existsSync } from "fs";
import { join, isAbsolute, resolve } from "path";
import { readCache, isCacheFresh, writeCache } from "./cache.mjs";
import { getColdStart, getAllColdStart } from "./cold-start.mjs";

/**
 * Searches a language's cached entries for matches against a query string.
 * Matches name or description (case-insensitive, substring).
 * If query matches a category key exactly, that category's results sort first.
 *
 * @param {object} data — parsed cache data (must have .entries)
 * @param {string} query — search string
 * @returns {{ results: Array<{category: string, name: string, description: string, npm?: string, homepage?: string}>, count: number }}
 */
export function searchCache(data, query) {
  if (!data || !data.entries || !query) {
    return { results: [], count: 0 };
  }

  const q = query.toLowerCase().trim();
  const isCategoryMatch = Object.keys(data.entries).some(k => k.toLowerCase() === q);

  /** @type {Array<{category: string, name: string, description: string, npm?: string, homepage?: string, _catMatchesFirst: boolean, _matchScore: number}>} */
  const results = [];

  for (const [category, entries] of Object.entries(data.entries)) {
    const catLower = category.toLowerCase();
    const catExact = catLower === q;
    const catPartial = catLower.includes(q);

    for (const entry of entries) {
      const nameLower = entry.name.toLowerCase();
      const descLower = (entry.description || "").toLowerCase();

      const nameMatch = nameLower.includes(q);
      const descMatch = descLower.includes(q);

      if (!nameMatch && !descMatch && !catPartial) continue;

      // Score: exact category match > name match > category partial > description match
      let matchScore = 0;
      if (catExact && nameMatch) matchScore = 4;
      else if (nameMatch) matchScore = 3;
      else if (catExact) matchScore = 2;
      else if (catPartial) matchScore = 1;
      else matchScore = 0; // desc match

      results.push({
        category,
        name: entry.name,
        description: entry.description || "",
        npm: entry.npm || entry.name,
        homepage: entry.homepage || "",
        _catMatchesFirst: isCategoryMatch,
        _matchScore: matchScore,
      });
    }
  }

  // Sort: higher score first, then alphabetically by name
  results.sort((a, b) => {
    if (b._matchScore !== a._matchScore) return b._matchScore - a._matchScore;
    return a.name.localeCompare(b.name);
  });

  // Strip internal sort fields before returning
  const clean = results.map(({ _catMatchesFirst, _matchScore, ...rest }) => rest);

  return { results: clean, count: clean.length };
}

/**
 * Gets cached or cold-start language data.
 * Returns cache if fresh, otherwise falls back to cold-start defaults.
 *
 * @param {string} lang — lowercase language name
 * @returns {{ entries: Record<string, Array<object>>, source: "cache"|"cold-start"|"empty" }}
 */
export function getLanguageData(lang) {
  const cache = readCache(lang);

  // Use cache if it exists and is fresh
  if (cache && cache.entries) {
    return { entries: cache.entries, source: "cache" };
  }

  // Fallback to cold-start defaults
  const cold = getColdStart(lang);
  if (cold && cold.entries) {
    return { entries: cold.entries, source: "cold-start" };
  }

  return { entries: {}, source: "empty" };
}

/**
 * Reads project-level overrides from .forge/ecoresult.json.
 *
 * @param {string} [rootDir=process.cwd()] — project root directory
 * @returns {{ pins: Array<{language: string, name: string}>, bans: Array<{language: string, name: string}> }}
 */
export function loadProjectOverrides(rootDir) {
  const cwd = rootDir || process.cwd();
  const filePath = join(cwd, ".forge", "ecoresult.json");

  try {
    if (!existsSync(filePath)) {
      return { pins: [], bans: [] };
    }
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return {
      pins: Array.isArray(data.pins) ? data.pins : [],
      bans: Array.isArray(data.bans) ? data.bans : [],
    };
  } catch {
    return { pins: [], bans: [] };
  }
}

/**
 * Applies project overrides (pins and bans) to a language's entries.
 * Bans remove matching entries. Pins ensure named entries are present
 * (adding from cold-start if not already in results).
 *
 * @param {Record<string, Array<object>>} entries — keyed by category
 * @param {{ pins: Array<{language: string, name: string}>, bans: Array<{language: string, name: string}> }} overrides
 * @param {string} lang — current language context
 * @returns {Record<string, Array<object>>} — filtered entries
 */
export function applyOverrides(entries, overrides, lang) {
  if (!entries) return entries;

  const langLower = lang ? lang.toLowerCase() : "";
  const bans = (overrides.bans || []).filter(b => b.language?.toLowerCase() === langLower).map(b => b.name);
  const pins = (overrides.pins || []).filter(p => p.language?.toLowerCase() === langLower).map(p => p.name);

  let result = {};

  // Apply bans: remove banned entries from each category
  for (const [category, list] of Object.entries(entries)) {
    result[category] = list.filter(entry => !bans.includes(entry.name));
  }

  // Remove empty categories
  for (const cat of Object.keys(result)) {
    if (result[cat].length === 0) delete result[cat];
  }

  // Apply pins: if a pinned entry is not in result, add from cold-start
  if (pins.length > 0) {
    const cold = getColdStart(langLower);
    for (const pinName of pins) {
      let found = false;
      for (const list of Object.values(result)) {
        if (list.some(e => e.name === pinName)) { found = true; break; }
      }
      if (!found && cold) {
        // Find the entry in cold-start data and add it
        for (const [cat, catList] of Object.entries(cold.entries)) {
          const match = catList.find(e => e.name === pinName);
          if (match) {
            if (!result[cat]) result[cat] = [];
            result[cat].push({ ...match });
            found = true;
            break;
          }
        }
      }
      // If still not found and it doesn't exist in cold-start either, skip silently
    }
  }

  return result;
}
