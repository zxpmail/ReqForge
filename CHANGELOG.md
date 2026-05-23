# Changelog

All notable changes to Forge are documented here.

## [v1.19.1] - 2026-05-23
### Fixed
- **Hallucination Gate wired**: `PreToolUse` registered in all adapter `settings.json` / `settings.windows.json`; hook reads `tool_name` from stdin JSON (was `tool` only).
- **Parallel review docs aligned**: `code-review/SKILL.md`, `dev-builder/SKILL.md`, `bug-fixer/SKILL.md`, README workflow diagram, and `reqforge-dev-build.mdc` now match parallel agent review (removed stale two-stage Stage 1/2 language).
- **Confidence scale unified**: code-review SKILL uses 0.0–1.0 thresholds (≥0.6 confirmed, 0.3–0.6 suspected) matching agents/commands.
- **Missing commands layer**: Added `commands/*.md` for design-brief-builder, design-maker, evolution-engine, feedback-writer.
- **Loadout check-sync**: Removed `check-sync` from user-facing loadouts (ReqForge-repo-only hook).
- **Version alignment**: `package.json`, README badge, `DEV-PLAN.md` updated to v1.19.1; Product-Spec and `core/docs/` agent lists corrected (10 agents).
### Added
- **`scripts/validate-skill.mjs`**: Cross-platform SKILL.md validator (default `pnpm validate-skill`).
- **`scripts/apply-loadout.ts`**: Print/validate loadout bundles; merge hook registrations into adapter settings.
- **Windows hallucination-gate.bat**: Node-based JSON parsing (replaces broken string parsing).

## [v1.19] - 2026-05-23
### Added
- **Loadout mechanism**: `core/loadouts/` with `loadout.schema.json` and 4 built-in loadouts (`full`, `web-app`, `cli-tool`, `minimal`). Each loadout is a reusable bundle of skills, agents, hooks, and MCP server recommendations.
- **Sync support**: `core/loadouts/` added to sync map for all 3 adapters.
### Changed
- `scripts/sync.ts`: added `core/loadouts` → adapter loadouts mapping.

## [v1.18] - 2026-05-23
### Added
- **skill.json metadata**: All 11 skills ship with machine-readable `skill.json` (name, version, triggers, prerequisites, agents, hooks). JSON Schema at `core/skills/skill.schema.json`.
- **Commands layer**: 7 skills get `commands/<name>.md` with YAML frontmatter + phased workflows (Goal → Actions → Acceptance).
- **Parallel agent code review**: 4 specialized agents (design, bug, security, types) run concurrently with confidence-scored aggregation (≥0.6 confirmed, 0.3-0.6 suspected, <0.3 suppressed). Cross-agent boost for corroborated findings.
- **Hallucination Gate**: PreToolUse hook validates Write/Edit target directories exist before file creation.
- **Project state injection**: `check-evolution.sh` detects Spec/Plan/Code state on session start and injects routing guidance.
- **validate-skill.sh — skill.json validation**: Existence check + required fields (name, version, description, triggers.auto/manual/command).
### Changed
- Sub-Agent count 6→10 (4 new specialist code reviewers + existing planner/test-writer)
- code-review SKILL.md: serial two-stage review → parallel agent dispatch + confidence aggregation
- code-reviewer agent v2.0: parallel dispatch workflow, aggregation rules, cross-agent boost
- sub-agent-orchestration.md: documented parallel review pattern
- AGENTS.md (both core/agents/ and core/skills/): added skill.json + commands requirements
### Fixed
- validate-skill.sh python3/node fallback: Windows Store python3 shim no longer breaks validation

## [v1.17] - 2026-05-22
### Added
- **Decidable Activation — [Not For] section**: All 11 skills include `[Not For]` specifying when NOT to use the skill.
- **Three-Layer Diagnostic Model**: bug-fixer reports Symptom → Design Flaw → Principle Violation layers.
- **Numeric Quality Rubric**: skill-builder 16-item, 32-point scoring system (ship threshold ≥ 24).
- **create-skill.sh scaffold**: CLI tool to scaffold new skills from name.
### Changed
- validate-skill.sh: [Not For] is now a required section.
- skill-template.md: updated with [Not For] section.

## [v1.16] - 2026-05-21
### Added
- **Harness Engineering principles**: Tool AI-fication Priority, Substitute Don't Mock, Environment-First, Minimum Runnable Subset, Scripted Verification.
- **Machine Gates**: Hallucination Gate, Sloppiness Gate, Overstepping Gate — enforceable via lint/test/hook/CI.
- **Iron Rules**: 8 baseline non-negotiable rules (knowledge offloading, no prompt magic, real files, guardrails).
- **llms.txt**: AI-searchable project summary for LLM discoverability.
- **Per-directory AGENTS.md**: Local MUST/MUST NOT/SHOULD rules for each core/ subdirectory.
- **validate-skill.sh**: Formal SKILL.md spec validator (frontmatter, sections, naming, file size, placeholders).
- **Claude Code adapter rules migration**: AGENTS.md → `.claude/rules/*.md` with path-scoped `globs` frontmatter.
- **Gotchas in all 11 skills**: Domain-specific failure points documented.
- **CLI best practices in CLAUDE.md**: /model, /compact, /context, /sandbox usage guidance.
### Changed
- dev-builder: "SDK-First" → "Glue Code First" priority chain.
- evolution-engine: Generator/Optimizer recursion principle — the engine that evolves rules should itself be evolvable.
- `[Anti-Rationalization Checklist]` → `[Gotchas: Anti-Rationalization]` in dev-builder, code-review, bug-fixer.
- code-review: cross-session audit principle for complex reviews.
- feedback template: `prompt_remediation` field for reusable prevention prompts.
### Fixed
- All 11 skills validated: 11 missing-section errors and 19 warnings fixed across design-maker, evolution-engine, feedback-writer, bug-fixer, code-review, dev-builder, dev-planner.

## [v1.15] - 2026-05-20
### Added
- Dependency graph: `scripts/dependency-graph.ts` for file-level import analysis and blast-radius.
- Dedicated AGENTS.md template for OpenCode (constraint-focused: tech stack, behavior boundaries, hard constraints).
### Changed
- Exact version pinning: every dependency pinned to `major.minor.patch` — no ranges, no `latest`.
- dev-builder code review loop: passes `affected_files` from blast-radius to code-reviewer.
### Fixed
- OpenCode control file: now uses dedicated AGENTS.md template instead of CLAUDE.md clone.

## [v1.14.2] - 2026-05-20
### Added
- **forge-install**: `scripts/install.ts` copies adapter bundles into user projects (`pnpm forge-install <client> [--target dir] [--force]`)
- `scripts/install.sh` / `scripts/install.ps1` thin wrappers for one-command install
- Windows: auto-applies `settings.windows.json` → `settings.json` on win32 (or `--windows`)
- Merge mode (`--force`) preserves existing `feedback/` files and `settings.local.json`

## [v1.14.1] - 2026-05-20
### Added
- Vitest unit tests for `scripts/sync.ts` and `scripts/dependency-graph.ts` (`scripts/__tests__/`)
- `pnpm test` / `vitest.config.ts` in repo root
### Fixed
- `dependency-graph.ts`: TypeScript named imports (`import { x } from "./y"`) now resolve correctly

### Changed
- `package.json` version `1.14.1`; devDependencies pinned to exact patch versions (no `^`)
- `scripts/sync.ts` and `scripts/dependency-graph.ts` export testable functions; CLI guarded with `require.main === module`
- `DEV-PLAN.md`: progress table, Phase 10 tests, 6 agents, OpenCode AGENTS.md, sync script docs

## [v1.14] - 2026-05-19
### Added
- Exact version pinning rule in CLAUDE.md: every dependency must be exact patch, no ranges
- Dedicated AGENTS.md template (core/templates/agents-template.md): constraint-focused format with tech stack, behavior boundaries, hard constraints
- **Dependency graph** (scripts/dependency-graph.ts): file-level import graph for blast-radius analysis. `pnpm dep-graph build | affected | risk | stats`
### Changed
- OpenCode AGENTS.md now uses dedicated template instead of CLAUDE.md clone
- OpenCode CLAUDE.md removed (AGENTS.md is the only control file)
- sync.ts updated: AGENTS.md template for OpenCode, check-sync excluded from adapter sync
- dev-builder SKILL.md: Blast-Radar principle, dep-graph integration in review loop
- code-reviewer agent: accepts `affected_files` input from blast-radius analysis for focused review

## [v1.13] - 2026-05-19
### Added
- Planner sub-agent (core/agents/planner.md): dedicated agent for architecture design and Phase splitting, decoupled from implementer context
- Session handoff mechanism: handoff-template.md + check-handoff hook + dev-builder Step 5 to generate handoff before context reset, preventing lost progress across sessions
- Complexity gate for code-reviewer: change_complexity="simple" skips Stage 1, matching review depth to change scope
- Model version tracking in feedback-observer: records model version with feedback, enabling evolution engine to detect outdated rules
### Changed
- Sub-Agent count 5→6, Hook count 9→10

## [v1.12] - 2026-05-19
### Fixed
- Missing detect-feedback-signal and auto-push hooks in ReqForge's own .claude/settings.json
- ReqForge self-development settings now at parity with adapter config

## [v1.11] - 2026-05-19
### Changed
- README and Product-Spec updated for test-writer, check-sync, and self-wired settings

## [v1.10] - 2026-05-19
### Added
- test-writer sub-agent (core/agents/test-writer.md): Vitest-based test generator for sync.ts and core utilities
- check-sync hook (core/hooks/check-sync sh+bat): PostToolUse detection of core/ vs adapters/ divergence
- ReqForge self-wiring: .claude/settings.json + settings.windows.json with all 6 hooks
### Changed
- .claude/settings.local.json pruned from 65→32 lines, one-time commands replaced with wildcard patterns

## [v1.9] - 2026-05-19
### Added
- AI Only for Judgment Tasks: deterministic logic is plain code, not AI busywork
- Fail Loudly: uncertainty must be stated explicitly, never hidden
- Token Budget Awareness: check context headroom after each Task

## [v1.8] - 2026-05-18
### Added
- Feedback auto-scoring: failures automatically infer Skill scores (Precision/Coverage/Efficiency/Satisfaction)
- Hard-trigger evolution: `check-evolution` hook injects `additionalContext`, forcing evolution-runner dispatch on session init
- Structured failure context: dev-builder passes `trigger_reason` + `current_skill` + `ai_action` + `failure_detail`
### Fixed
- Ratchet idling: feedback had records but no score data, preventing evolution proposals — now every failure produces scored data

## [v1.7] - 2026-05-18
### Changed
- CLAUDE.md trimmed from 309 lines to 59 lines — dispatch map only, details in core/docs/
- Detailed docs moved to core/docs/: file-structure.md, behavior-boundaries.md, memory-system.md, sub-agent-orchestration.md
### Added
- Feedback auto-trigger on failure (compile errors, review failures, verification failures)
- Anti-Rationalization Checklist with "skip feedback recording" positive/negative examples

## [v1.6] - 2026-05-18
### Fixed
- Product-Spec.md cross-platform claim corrected — both .sh and .bat hooks provided
- .gitignore now excludes .claude/worktrees/
### Added
- context-compaction hook entry in README hook table

## [v1.5] - 2026-05-18
### Added
- Agent Harness engineering foundation (Addy Osmani reference)
- Context compaction hook: Post-Tool-Use auto-archive old task-history entries
- Progressive disclosure: CLAUDE.md as dispatch map, SKILL.md loaded on demand
- Tool-call offloading: outputs >2000 lines written to temp files
### Changed
- EVOLUTION.md: added Level 0 (Harness Foundation)
- Workflow section simplified — detailed flows live in SKILL.md

## [v1.4] - 2026-05-18
### Added
- Three-tier memory system: project-memory / decisions-log / task-history
- Traffic light behavior boundaries (green/yellow/red)
- Quick start mode: one-sentence project description
- memory-check hook: reminds to update memory after code changes

## [v1.3] - 2026-05-16
### Added
- Multi-role Sub-Agent isolation (OpenAI Symphony inspiration)
- Skill-as-prompt design (awesome-chatgpt-prompts inspiration)

## [v1.2] - 2026-05-16
### Changed
- File-first architecture: copy to project and use, no npm install required
- Simplified from monorepo to core + adapters directory structure

## [v1.1] - 2026-05-16
### Added
- Pluggable skill architecture with TDD discipline (superpowers inspiration)
- CLI initialization and incremental artifact management (OpenSpec inspiration)
- Multi-client adapter support

## [v1.0] - 2026-05-16
- Initial release: Forge product development framework with core + multi-adapter architecture
