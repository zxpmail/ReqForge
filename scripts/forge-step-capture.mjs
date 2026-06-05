#!/usr/bin/env node
/**
 * forge-step-capture.mjs — Step-level failure capture + attribution
 *
 * Dual-mode: importable functions + CLI.
 * Records each forge-loop step execution to .forge/trace/step-traces.jsonl (append-only JSONL).
 * Provides rule-based failure attribution and automatic feedback generation.
 *
 * CLI:
 *   node scripts/forge-step-capture.mjs record <phase> --step <name> --status <pass|fail> [options]
 *   node scripts/forge-step-capture.mjs generate-feedback <phase> [--min-occurrences 3] [--dry-run]
 *   node scripts/forge-step-capture.mjs summary <phase> [--json]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..");
export const TRACE_DIR = join(ROOT, ".forge", "trace");
export const TRACE_FILE = join(TRACE_DIR, "step-traces.jsonl");

// ─── Step Recording ────────────────────────────────────────────────

/**
 * Record one step execution result.
 * Appends to .forge/trace/step-traces.jsonl.
 *
 * @param {object} params
 * @param {number} params.phase
 * @param {number} [params.iteration]
 * @param {number} [params.maxIterations]
 * @param {string} params.step - checklist | ui-check | test | auto-fix | verify-brief
 * @param {string} params.status - pass | fail | skip | error
 * @param {number} [params.durationMs]
 * @param {string} [params.sessionId] - optional session link
 * @param {object} [params.context]
 * @param {object|null} [params.failure] - structured failure detail (null when status=pass)
 * @returns {{ traceId: string }}
 */
export function recordStep(params) {
  const traceId = randomUUID();
  const record = {
    type: "step_record",
    version: 1,
    traceId,
    sessionId: params.sessionId || null,
    phase: params.phase,
    iteration: params.iteration ?? 0,
    maxIterations: params.maxIterations ?? 5,
    timestamp: new Date().toISOString(),
    step: params.step,
    status: params.status,
    durationMs: params.durationMs ?? 0,
    context: params.context ?? {},
    failure: params.failure ?? null,
    attribution: computeAttribution(params),
  };

  mkdirSync(TRACE_DIR, { recursive: true });
  appendFileSync(TRACE_FILE, JSON.stringify(record) + "\n", "utf-8");
  return { traceId };
}

function computeAttribution(params) {
  if (params.status === "pass" || params.status === "skip") return null;
  return attributeFailure(params.failure ?? {}, params.context ?? {}, params.iteration ?? 0);
}

// ─── Attribution Engine ────────────────────────────────────────────

/**
 * Rule-based failure attribution (training-free).
 *
 * @param {object} failure
 * @param {object} context
 * @param {number} iteration
 * @returns {{ failureClass: string, reasoning: string, sourceSkill: string }}
 */
export function attributeFailure(failure, context, iteration) {
  const step = context._step || "";
  const hasFilesChanged = (failure.filesChanged && failure.filesChanged.length > 0);

  // verify-brief STALE anchors → execution-lapse
  if (failure.type === "verify_stale") {
    return {
      failureClass: "execution-lapse",
      reasoning: "AI did not correctly apply the fix-brief instructions (stale content anchors)",
      sourceSkill: context._sourceSkill || "dev-builder",
    };
  }

  // verify-brief MISSING files → skill-defect
  if (failure.type === "verify_missing") {
    return {
      failureClass: "skill-defect",
      reasoning: "Brief listed files that should exist but were not created",
      sourceSkill: context._sourceSkill || "dev-builder",
    };
  }

  // checklist omission
  if (step === "checklist" || failure.type === "checklist_omission") {
    const omittedSections = (failure.omittedItems || []).map(i => i.section || "");
    if (omittedSections.includes("keyfiles") || omittedSections.includes("deliverables")) {
      return {
        failureClass: "skill-defect",
        reasoning: `Checklist omitted ${omittedSections.filter(s => s === "keyfiles" || s === "deliverables").join(", ")} — skill guidance likely incomplete`,
        sourceSkill: context._sourceSkill || "dev-builder",
      };
    }
    if (omittedSections.every(s => s === "acceptance")) {
      return {
        failureClass: "execution-lapse",
        reasoning: "Acceptance criteria are process checks, not skill gaps",
        sourceSkill: context._sourceSkill || "dev-builder",
      };
    }
  }

  // test failure
  if (failure.type === "test_failure" || step === "test") {
    if (iteration > 1) {
      return {
        failureClass: "skill-defect",
        reasoning: `Test failed repeatedly (iteration ${iteration}) — skill guidance likely incomplete for test requirements`,
        sourceSkill: context._sourceSkill || "dev-builder",
      };
    }
    if (hasFilesChanged) {
      return {
        failureClass: "execution-lapse",
        reasoning: "Implementation has a bug; skill may cover the scenario but execution missed it",
        sourceSkill: context._sourceSkill || "dev-builder",
      };
    }
  }

  // ui-check failure
  if (failure.type === "ui_failure" || step === "ui-check") {
    const uiFilesExist = (failure.filesChanged || []).some(f => /\.(html|css|tsx|jsx|vue|svelte)$/i.test(f));
    if (!uiFilesExist) {
      return {
        failureClass: "skill-defect",
        reasoning: "No UI files exist — skill did not guide UI creation",
        sourceSkill: context._sourceSkill || "dev-builder",
      };
    }
    return {
      failureClass: "execution-lapse",
      reasoning: "UI files exist but failed check — likely implementation issue",
      sourceSkill: context._sourceSkill || "dev-builder",
    };
  }

  // Default: unset
  return {
    failureClass: "unset",
    reasoning: "Insufficient information for automatic attribution",
    sourceSkill: context._sourceSkill || "dev-builder",
  };
}

// ─── Trace Query ───────────────────────────────────────────────────

// ─── Session Management ───────────────────────────────────────────

/**
 * Start a forge-loop session.
 * @param {number} phase
 * @param {object} [context]
 * @returns {{ sessionId: string }}
 */
export function startSession(phase, context = {}) {
  const sessionId = randomUUID();
  const record = {
    type: "session_record",
    version: 1,
    sessionId,
    phase,
    event: "start",
    timestamp: new Date().toISOString(),
    context,
  };
  mkdirSync(TRACE_DIR, { recursive: true });
  appendFileSync(TRACE_FILE, JSON.stringify(record) + "\n", "utf-8");
  return { sessionId };
}

/**
 * End a forge-loop session.
 * @param {string} sessionId
 */
export function endSession(sessionId) {
  const record = {
    type: "session_record",
    version: 1,
    sessionId,
    event: "end",
    timestamp: new Date().toISOString(),
  };
  appendFileSync(TRACE_FILE, JSON.stringify(record) + "\n", "utf-8");
}

/**
 * Record a decision point during execution.
 * @param {object} params
 * @param {string} params.sessionId
 * @param {number} params.phase
 * @param {number} [params.iteration]
 * @param {string} params.step
 * @param {object} params.decision - { question, options, chosen, reason, abandoned }
 * @param {object} [params.context]
 * @returns {{ traceId: string }}
 */
export function recordDecision(params) {
  const traceId = randomUUID();
  const record = {
    type: "decision_record",
    version: 1,
    sessionId: params.sessionId,
    parentTraceId: traceId,
    timestamp: new Date().toISOString(),
    phase: params.phase,
    iteration: params.iteration ?? 0,
    step: params.step,
    decision: {
      question: params.decision.question,
      options: params.decision.options || [],
      chosen: params.decision.chosen,
      reason: params.decision.reason || "",
      abandoned: params.decision.abandoned || [],
    },
    context: params.context || {},
  };
  appendFileSync(TRACE_FILE, JSON.stringify(record) + "\n", "utf-8");
  return { traceId };
}

// ─── Trajectory Query ─────────────────────────────────────────────

/**
 * Get all trace records for a specific session.
 * @param {string} sessionId
 * @returns {object[]}
 */
export function getSessionTraces(sessionId) {
  return readAllTraces().filter(t => t.sessionId === sessionId);
}

/**
 * Get all trace records for a specific phase+iteration (trajectory).
 * @param {number} phase
 * @param {number} iteration
 * @returns {object[]}
 */
export function getTrajectory(phase, iteration) {
  return readAllTraces().filter(t => t.phase === phase && t.iteration === iteration);
}

/**
 * Read all step traces from the JSONL file.
 * @returns {object[]}
 */
export function readAllTraces() {
  if (!existsSync(TRACE_FILE)) return [];
  const text = readFileSync(TRACE_FILE, "utf-8").trim();
  if (!text) return [];
  return text.split("\n").filter(Boolean).map(line => {
    try { return JSON.parse(line); }
    catch { return null; }
  }).filter(Boolean);
}

/**
 * Get step traces for a specific phase.
 * @param {number} phase
 * @param {object} [opts]
 * @param {number} [opts.sinceIteration]
 * @param {string} [opts.after] - ISO timestamp
 * @param {string} [opts.status] - pass | fail
 * @returns {object[]}
 */
export function getPhaseTraces(phase, opts = {}) {
  let traces = readAllTraces().filter(t => t.phase === phase);
  if (opts.sinceIteration !== undefined) {
    traces = traces.filter(t => t.iteration >= opts.sinceIteration);
  }
  if (opts.after) {
    traces = traces.filter(t => t.timestamp >= opts.after);
  }
  if (opts.status) {
    traces = traces.filter(t => t.status === opts.status);
  }
  return traces;
}

// ─── Pattern Detection ─────────────────────────────────────────────

/**
 * Detect failure patterns from accumulated traces.
 *
 * @param {number} phase
 * @param {object[]} traces - raw trace objects
 * @param {number} [minOccurrences=3]
 * @returns {object[]} pattern objects
 */
export function detectFailurePatterns(phase, traces, minOccurrences = 3) {
  const patterns = [];
  const failedTraces = traces.filter(t => t.status === "fail" || t.status === "error");

  // Pattern 1: Repeated failures on same step
  const stepGroups = {};
  for (const t of failedTraces) {
    const key = `${t.step}::${t.attribution?.failureClass || "unset"}`;
    if (!stepGroups[key]) stepGroups[key] = [];
    stepGroups[key].push(t);
  }
  for (const [key, entries] of Object.entries(stepGroups)) {
    if (entries.length >= minOccurrences) {
      const [step, failureClass] = key.split("::");
      patterns.push({
        pattern: "repeated_failure",
        occurrences: entries.length,
        firstSeen: entries[0].timestamp,
        lastSeen: entries[entries.length - 1].timestamp,
        step,
        failureClass,
        sourceSkill: entries[0].attribution?.sourceSkill || "dev-builder",
        redObservation: `Without adequate guidance in step '${step}', the forge-loop failed ${entries.length} times during phase ${phase}`,
        entries,
      });
    }
  }

  // Pattern 2: Persistent omission (same omission text appearing across iterations)
  const omissionMap = {};
  for (const t of failedTraces) {
    const items = t.failure?.omittedItems || [];
    for (const item of items) {
      const text = typeof item === "string" ? item : item.text;
      if (!text) continue;
      if (!omissionMap[text]) omissionMap[text] = [];
      omissionMap[text].push(t);
    }
  }
  for (const [text, entries] of Object.entries(omissionMap)) {
    if (entries.length >= minOccurrences) {
      patterns.push({
        pattern: "repeated_omission",
        occurrences: entries.length,
        firstSeen: entries[0].timestamp,
        lastSeen: entries[entries.length - 1].timestamp,
        step: entries[0].step,
        detail: text,
        failureClass: "skill-defect",
        sourceSkill: entries[0].attribution?.sourceSkill || "dev-builder",
        redObservation: `Checklist item "${text}" omitted ${entries.length} times — skill guidance does not cover this requirement`,
        entries,
      });
    }
  }

  // Pattern 3: Persistent test failure
  const testFailures = failedTraces.filter(t => t.step === "test");
  if (testFailures.length >= minOccurrences) {
    patterns.push({
      pattern: "persistent_test_failure",
      occurrences: testFailures.length,
      firstSeen: testFailures[0].timestamp,
      lastSeen: testFailures[testFailures.length - 1].timestamp,
      step: "test",
      failureClass: testFailures.some(t => t.iteration > 1) ? "skill-defect" : "execution-lapse",
      sourceSkill: "dev-builder",
      redObservation: `Tests failed ${testFailures.length} out of ${traces.filter(t => t.step === "test").length} test runs during phase ${phase}`,
      entries: testFailures,
    });
  }

  return patterns;
}

// ─── Feedback Generation ───────────────────────────────────────────

/**
 * Generate a feedback file from a detected pattern.
 * Uses existing feedback-topic-template.md format.
 *
 * @param {number} phase
 * @param {object} pattern - result from detectFailurePatterns
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun]
 * @returns {{ written: boolean, path: string|null, action: string }}
 */
export function generateFeedback(phase, pattern, opts = {}) {
  const topic = `forge-loop-phase-${phase}-${pattern.pattern}`;
  const feedbackDir = join(ROOT, ".claude", "feedback");
  const indexPath = join(feedbackDir, "FEEDBACK-INDEX.md");
  const feedbackPath = join(feedbackDir, `${topic}.md`);

  // Determine scores
  const scores = autoScore(pattern);

  const description = pattern.pattern === "repeated_failure"
    ? `Forge-loop phase ${phase} step "${pattern.step}" failed ${pattern.occurrences} times`
    : pattern.pattern === "repeated_omission"
      ? `Forge-loop phase ${phase} item "${pattern.detail}" omitted ${pattern.occurrences} times`
      : `Forge-loop phase ${phase} tests failed ${pattern.occurrences} times`;

  const body = [
    "---",
    "type: feedback",
    `description: ${description}`,
    `created: ${new Date().toISOString().slice(0, 10)}`,
    `updated: ${new Date().toISOString().slice(0, 10)}`,
    `occurrences: ${pattern.occurrences}`,
    "graduated: false",
    `source_skill: ${pattern.sourceSkill}`,
    `failure_class: ${pattern.failureClass}`,
    "scores:",
    `  accuracy: ${scores.accuracy}`,
    `  coverage: ${scores.coverage}`,
    `  efficiency: ${scores.efficiency}`,
    `  satisfaction: ${scores.satisfaction}`,
    `  evidence: "Auto-inferred from forge-loop step traces (phase ${phase}, ${pattern.occurrences} failures)"`,
    'prompt_remediation: ""',
    "---",
    "",
    `# ${description}`,
    "",
    `**Problem**: The forge-loop ${pattern.step} step failed ${pattern.occurrences} out of ${pattern.entries.length} recorded executions for phase ${phase}.`,
    "",
    `**Context**: Automated execution via forge-loop phase ${phase}. `,
    `Pattern: ${pattern.pattern}. `,
    `First seen: ${pattern.firstSeen}. Last seen: ${pattern.lastSeen}.`,
    "",
    `**Lesson / Recommendation**: Review the phase delivery checklist and ensure the dev-builder skill guidance covers the missing items. Refer to the step traces in .forge/trace/step-traces.jsonl for detailed records.`,
    "",
    `**RED (for Skill TDD / evolution)**: ${pattern.redObservation}`,
    "",
  ].join("\n");

  // Check for existing entry (dedup)
  let action = "created";
  if (existsSync(indexPath)) {
    const index = readFileSync(indexPath, "utf-8");
    if (index.includes(`${topic}.md`)) {
      action = "updated";
    }
  }

  if (opts.dryRun) {
    console.log(`\n[Dry Run] Would create feedback: ${feedbackPath}`);
    console.log(body);
    return { written: false, path: feedbackPath, action: "dry-run" };
  }

  mkdirSync(feedbackDir, { recursive: true });

  if (action === "updated") {
    // Read existing, bump occurrences
    const existing = readFileSync(feedbackPath, "utf-8");
    const updated = existing.replace(/occurrences: \d+/, `occurrences: ${pattern.occurrences}`);
    writeFileSync(feedbackPath, updated, "utf-8");
  } else {
    writeFileSync(feedbackPath, body, "utf-8");
    // Update index
    const indexEntry = `- [${description}](${topic}.md) -- Auto-generated from forge-loop step traces\n`;
    if (existsSync(indexPath)) {
      const index = readFileSync(indexPath, "utf-8");
      if (!index.includes(`${topic}.md`)) {
        writeFileSync(indexPath, index.trimEnd() + "\n" + indexEntry, "utf-8");
      }
    } else {
      writeFileSync(indexPath, "# Feedback Index\n\n> Index of lessons learned.\n\n" + indexEntry, "utf-8");
    }
  }

  return { written: true, path: feedbackPath, action };
}

function autoScore(pattern) {
  // Map failure_class → scores per existing feedback-observer Auto-Scoring on Failure rules
  if (pattern.failureClass === "skill-defect") {
    return { accuracy: 2, coverage: 2, efficiency: 3, satisfaction: 3 };
  }
  if (pattern.failureClass === "execution-lapse") {
    return { accuracy: 3, coverage: 3, efficiency: 3, satisfaction: 3 };
  }
  return { accuracy: 3, coverage: 3, efficiency: 3, satisfaction: 3 };
}

// ─── Evolution Proposal Loop ────────────────────────────────────────

/**
 * Map a detected pattern to an evolution proposal (matching evolution-engine [Proposal Format]).
 *
 * @param {object} pattern - from detectFailurePatterns
 * @param {number} phase
 * @returns {object} proposal - { type, summary, redObservation, greenChange, predictedEffect, verifyBy, targetFile, targetSection, suggestedText }
 */
export function proposeEvolution(pattern, phase) {
  const targetFile = "core/skills/dev-builder/SKILL.md";
  const step = pattern.step || "checklist";
  const detail = pattern.detail || `phase ${phase} ${step} step`;

  // Map pattern type to evolution proposal
  if (pattern.pattern === "repeated_omission") {
    return {
      type: "skill-optimization",
      summary: `dev-builder: "${detail}" omitted ${pattern.occurrences} times — should be in delivery checklist`,
      redObservation: pattern.redObservation,
      greenChange: {
        target: targetFile,
        section: "[Gotchas]",
        text: `**Phase ${phase} ${step} omission**: "${detail}" was omitted ${pattern.occurrences} times during forge-loop execution. Ensure this item is included in the Phase delivery checklist for this phase.`,
      },
      predictedEffect: `Checklist omissions for "${detail}" should decrease or disappear in future phase ${phase} runs`,
      verifyBy: `Re-run pnpm forge-loop ${phase} --max 5 — the omitted item should appear in the delivery checklist`,
    };
  }

  if (pattern.pattern === "persistent_test_failure") {
    return {
      type: "skill-optimization",
      summary: `dev-builder: tests failed ${pattern.occurrences} times for phase ${phase} — add test verification guidance`,
      redObservation: pattern.redObservation,
      greenChange: {
        target: targetFile,
        section: "[Gotchas]",
        text: `**Phase ${phase} test verification**: Tests failed ${pattern.occurrences} times during automated execution. Before marking phase ${phase} complete, verify that all existing tests pass AND new tests cover the phase deliverables.`,
      },
      predictedEffect: `Test failures during phase ${phase} execution should decrease as guidance is followed`,
      verifyBy: `Re-run pnpm forge-loop ${phase} --max 5 — test step should pass within fewer iterations`,
    };
  }

  if (pattern.pattern === "repeated_failure") {
    return {
      type: "skill-optimization",
      summary: `dev-builder: ${step} step failed ${pattern.occurrences} times for phase ${phase}`,
      redObservation: pattern.redObservation,
      greenChange: {
        target: targetFile,
        section: "[Gotchas]",
        text: `**Phase ${phase} ${step} step**: The ${step} verification step failed ${pattern.occurrences} times during forge-loop execution. Pay special attention to ${step} requirements when implementing phase ${phase}.`,
      },
      predictedEffect: `Failure rate for ${step} step in phase ${phase} should decrease`,
      verifyBy: `Re-run pnpm forge-loop ${phase} --max 5 — ${step} step should pass`,
    };
  }

  // Fallback
  return {
    type: "skill-optimization",
    summary: `dev-builder: ${pattern.pattern} detected for phase ${phase}`,
    redObservation: pattern.redObservation,
    greenChange: {
      target: targetFile,
      section: "[Gotchas]",
      text: `**Phase ${phase}**: ${pattern.pattern} detected ${pattern.occurrences} times. Review phase requirements carefully.`,
    },
    predictedEffect: "Failure pattern should decrease",
    verifyBy: `Re-run pnpm forge-loop ${phase} --max 5`,
  };
}

/**
 * Apply an evolution proposal's GREEN change to the target SKILL.md.
 * Appends the suggested text to the specified section.
 *
 * @param {object} proposal - from proposeEvolution
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun]
 * @returns {{ applied: boolean, target: string, section: string, linesAdded: number }}
 */
export function applyEvolution(proposal, opts = {}) {
  const targetPath = join(ROOT, proposal.greenChange.target);
  const section = proposal.greenChange.section;
  const text = proposal.greenChange.text;

  if (!existsSync(targetPath)) {
    return { applied: false, target: proposal.greenChange.target, section, linesAdded: 0, error: "FILE_NOT_FOUND" };
  }

  if (opts.dryRun) {
    console.log(`\n[Dry Run] Would append to ${proposal.greenChange.target} [${section}]:`);
    console.log(`  ${text}`);
    return { applied: false, target: proposal.greenChange.target, section, linesAdded: 0, dryRun: true };
  }

  const content = readFileSync(targetPath, "utf-8");
  const sectionRegex = new RegExp(`(\\[${section}\\][^\\n]*)`);
  const match = content.match(sectionRegex);

  if (!match) {
    return { applied: false, target: proposal.greenChange.target, section, linesAdded: 0, error: "SECTION_NOT_FOUND" };
  }

  // Check if similar text already exists to avoid duplicates
  const checkText = text.replace(/^[\s\S]*?\*\*/, "**").slice(0, 40);
  if (content.includes(checkText)) {
    return { applied: false, target: proposal.greenChange.target, section, linesAdded: 0, error: "ALREADY_EXISTS" };
  }

  // Append after the section header line
  const linesAdded = text.split("\n").length;
  const newContent = content.replace(
    match[0],
    match[0] + "\n" + text
  );
  writeFileSync(targetPath, newContent, "utf-8");

  return { applied: true, target: proposal.greenChange.target, section, linesAdded };
}

/**
 * One-click: detect patterns → propose evolution → apply.
 *
 * @param {number} phase
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun]
 * @param {boolean} [opts.autoApply]
 * @returns {{ patterns: object[], proposals: object[], applied: number }}
 */
export function proposeAndApply(phase, opts = {}) {
  const result = processPhase(phase, 3, true); // dry-run feedback gen
  const proposals = [];

  for (const pattern of result.patterns) {
    const proposal = proposeEvolution(pattern, phase);
    proposals.push(proposal);

    if (opts.dryRun) {
      console.log(`\n**Skill Optimization** (1 item)`);
      console.log(`1. ${proposal.summary}`);
      console.log(`   RED observation: ${proposal.redObservation}`);
      console.log(`   GREEN change: ${proposal.greenChange.target} → [${proposal.greenChange.section}]`);
      console.log(`   Predicted effect: ${proposal.predictedEffect}`);
      console.log(`   Verify by: ${proposal.verifyBy}`);
      console.log(`   Text: ${proposal.greenChange.text}`);
      continue;
    }

    if (opts.autoApply) {
      const appResult = applyEvolution(proposal, { dryRun: false });
      if (appResult.applied) {
        console.log(`  ✅ Applied: ${proposal.greenChange.target} [${proposal.greenChange.section}] (${appResult.linesAdded} lines)`);
      } else if (appResult.error === "ALREADY_EXISTS") {
        console.log(`  ⏭️ Already applied: ${proposal.greenChange.target} [${proposal.greenChange.section}]`);
      } else {
        console.log(`  ❌ Failed: ${appResult.error}`);
      }
    }
  }

  return { patterns: result.patterns, proposals, applied: proposals.length };
}

// ─── High-Level API ────────────────────────────────────────────────

/**
 * Process all traces for a phase and generate feedback for patterns meeting threshold.
 *
 * @param {number} phase
 * @param {number} [minOccurrences=3]
 * @param {boolean} [dryRun=false]
 * @returns {{ patterns: object[], feedbackWritten: number }}
 */
export function processPhase(phase, minOccurrences = 3, dryRun = false) {
  const traces = getPhaseTraces(phase);
  if (traces.length === 0) return { patterns: [], feedbackWritten: 0 };

  const patterns = detectFailurePatterns(phase, traces, minOccurrences);
  let feedbackWritten = 0;

  for (const pattern of patterns) {
    const result = generateFeedback(phase, pattern, { dryRun });
    if (result.written) feedbackWritten++;
    if (result.action === "updated") feedbackWritten++;
  }

  return { patterns, feedbackWritten };
}

// ─── CLI ───────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
forge-step-capture — Step-level failure capture + attribution

Usage:
  record <phase> --step <name> --status <pass|fail> [options]
    --iteration <N>
    --max-iterations <N>
    --context <json>
    --failure <json>
    --duration <ms>

  session start <phase> [--context <json>]
  session end <sessionId>

  decision <phase> --session <sessionId> --step <name>
    --question "<text>" --chosen "<text>"
    [--options "a,b,c"] [--reason "<text>"] [--abandoned "x,y"]

  trajectory <phase> [--iteration <N>] [--session <sessionId>]

  generate-feedback <phase> [options]
    --min-occurrences <N>  (default: 3)
    --dry-run

  generate-feedback <phase> [options]
    --min-occurrences <N>  (default: 3)
    --dry-run

  propose-evolution <phase> [options]
    --auto-apply
    --dry-run

  summary <phase> [options]
    --json

Options:
  --root <dir>   Project root (default: repo root)
  --help, -h     Show this help
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  const cmd = args[0];
  let phase = null;
  let subCmd = null;

  // Handle special commands with different argument structures
  if (cmd === "session") {
    subCmd = args[1];
    if (subCmd === "start") phase = args[2] ? parseInt(args[2], 10) : null;
  } else {
    phase = args[1] ? parseInt(args[1], 10) : null;
    if (!phase && cmd !== "trajectory") {
      console.error("Missing phase number");
      printHelp();
      process.exit(1);
    }
  }

  const kv = {};
  // Determine where kv args start based on command
  let kvStart = 2;
  if (cmd === "session") kvStart = subCmd === "start" ? 3 : 3;
  else if (cmd === "decision") kvStart = 2;
  // For session end, args[2] is the sessionId, kv start at 3
  if (cmd === "session" && subCmd === "end") kvStart = 3;

  for (let i = kvStart; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      const val = (args[i + 1] && !args[i + 1].startsWith("--")) ? args[++i] : "true";
      kv[key] = val;
    }
  }

  switch (cmd) {
    case "record": {
      const failure = kv.failure ? JSON.parse(kv.failure) : null;
      const context = kv.context ? JSON.parse(kv.context) : {};
      context._step = kv.step;
      context._sourceSkill = kv["source-skill"] || "dev-builder";
      const result = recordStep({
        phase,
        iteration: parseInt(kv.iteration || "0", 10),
        maxIterations: parseInt(kv["max-iterations"] || "5", 10),
        step: kv.step || "unknown",
        status: kv.status || "pass",
        durationMs: parseInt(kv.duration || "0", 10),
        context,
        failure,
      });
      console.log(JSON.stringify(result));
      break;
    }
    case "generate-feedback": {
      const minOccurrences = parseInt(kv["min-occurrences"] || "3", 10);
      const dryRun = kv["dry-run"] === "true";
      const result = processPhase(phase, minOccurrences, dryRun);
      if (result.patterns.length === 0) {
        console.log("No failure patterns meeting threshold.");
      } else {
        console.log(`${result.patterns.length} pattern(s) detected, ${result.feedbackWritten} feedback written.`);
        if (dryRun) {
          for (const p of result.patterns) {
            console.log(`  [${p.pattern}] ${p.step}: ${p.occurrences} occurrences, failureClass=${p.failureClass}`);
          }
        }
      }
      break;
    }
    case "session": {
      if (subCmd === "start") {
        const context = kv.context ? JSON.parse(kv.context) : {};
        const result = startSession(phase, context);
        console.log(JSON.stringify(result));
      } else if (subCmd === "end") {
        const sessionId = args[2];
        if (!sessionId) { console.error("Missing sessionId"); process.exit(1); }
        endSession(sessionId);
        console.log(`Session ${sessionId} ended.`);
      } else {
        console.error(`Unknown session subcommand: ${subCmd}`);
        printHelp();
        process.exit(1);
      }
      break;
    }
    case "decision": {
      const decision = {
        question: kv.question || "",
        options: kv.options ? kv.options.split(",").map(s => s.trim()) : [],
        chosen: kv.chosen || "",
        reason: kv.reason || "",
        abandoned: kv.abandoned ? kv.abandoned.split(",").map(s => s.trim()) : [],
      };
      const result = recordDecision({
        sessionId: kv.session,
        phase,
        iteration: parseInt(kv.iteration || "0", 10),
        step: kv.step || "unknown",
        decision,
        context: kv.context ? JSON.parse(kv.context) : {},
      });
      console.log(JSON.stringify(result));
      break;
    }
    case "trajectory": {
      const allTraces = readAllTraces();
      let filtered = kv.session
        ? getSessionTraces(kv.session)
        : kv.iteration
          ? getTrajectory(phase, parseInt(kv.iteration, 10))
          : allTraces.filter(t => t.phase === phase);
      if (kv.json === "true") {
        console.log(JSON.stringify(filtered, null, 2));
      } else {
        console.log(`\n=== Phase ${phase} Trajectory ===`);
        if (kv.session) console.log(`Session: ${kv.session}`);
        if (kv.iteration) console.log(`Iteration: ${kv.iteration}`);
        const sessions = filtered.filter(r => r.type === "session_record");
        const decisions = filtered.filter(r => r.type === "decision_record");
        const steps = filtered.filter(r => r.type === "step_record");
        console.log(`Sessions: ${sessions.length}, Decisions: ${decisions.length}, Steps: ${steps.length}`);
        console.log(`\nTimeline:`);
        filtered.sort((a, b) => a.timestamp < b.timestamp ? -1 : 1);
        for (const r of filtered) {
          const time = r.timestamp.slice(11, 19);
          if (r.type === "session_record") {
            console.log(`  ${time} [session] ${r.event}${r.context?.mode ? ` (${r.context.mode})` : ""}`);
          } else if (r.type === "decision_record") {
            console.log(`  ${time} [decision] ${r.step}: ${(r.decision?.chosen || "?").slice(0, 50)}`);
          } else if (r.type === "step_record") {
            console.log(`  ${time} [step] ${r.step}: ${r.status}${r.attribution ? ` (${r.attribution.failureClass})` : ""}`);
          }
        }
      }
      break;
    }
    case "summary": {
      const allTraces = readAllTraces();
      const phaseTraces = allTraces.filter(t => t.phase === phase);
      const failed = phaseTraces.filter(t => t.status === "fail" || t.status === "error");
      const passed = phaseTraces.filter(t => t.status === "pass");
      const sessions = phaseTraces.filter(t => t.type === "session_record");
      const decisions = phaseTraces.filter(t => t.type === "decision_record");
      const sessionsStarted = sessions.filter(s => s.event === "start").length;
      if (kv.json === "true") {
        console.log(JSON.stringify({ phase, totalTraces: phaseTraces.length, passed: passed.length, failed: failed.length, sessions: sessionsStarted, decisions: decisions.length }, null, 2));
      } else {
        console.log(`\n=== Phase ${phase} Traces ===`);
        console.log(`Total records: ${phaseTraces.length} (Sessions: ${sessionsStarted}, Decisions: ${decisions.length}, Steps: ${passed.length + failed.length})`);
        console.log(`Passed: ${passed.length}, Failed: ${failed.length}`);
        if (failed.length > 0) {
          console.log(`\nFailures by step:`);
          const byStep = {};
          for (const t of failed) {
            if (!byStep[t.step]) byStep[t.step] = [];
            byStep[t.step].push(t);
          }
          for (const [step, entries] of Object.entries(byStep)) {
            console.log(`  ${step}: ${entries.length} failures`);
            for (const e of entries.slice(0, 3)) {
              console.log(`    [it${e.iteration}] ${e.attribution?.failureClass || "?"}: ${e.attribution?.reasoning?.slice(0, 80) || "no attribution"}`);
            }
          }
        }
      }
      break;
    }
    case "propose-evolution": {
      const dryRun = kv["dry-run"] === "true";
      const autoApply = kv["auto-apply"] === "true";
      const result = proposeAndApply(phase, { dryRun, autoApply });
      if (result.patterns.length === 0) {
        console.log("No failure patterns meeting threshold.");
      } else {
        console.log(`\n${result.proposals.length} evolution proposal(s) generated.`);
        if (autoApply) console.log(`${result.applied} proposal(s) applied.`);
      }
      break;
    }
    default:
      console.error(`Unknown command: ${cmd}`);
      printHelp();
      process.exit(1);
  }
}

if (process.argv[1] && (process.argv[1].endsWith("forge-step-capture.mjs") || process.argv[1].endsWith("forge-step-capture"))) {
  main();
}
