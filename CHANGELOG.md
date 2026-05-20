# Changelog

All notable changes to Forge are documented here.

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
