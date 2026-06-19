# Changelog

All notable changes to Forge are documented here.

## [v1.48.1] - 2026-06-19

### Fixed
- **Cross-platform agent dispatch (Mode A) fully delivered.** The platform→Mode A/B mapping had overstated delivered state: Cursor/Gemini CLI were classed Mode B against pre-subagent versions, and the Cursor adapter shipped agents to the wrong path. Re-verified against current versions — all four target platforms (Claude Code, OpenCode, Cursor 2.4+, Gemini CLI v0.38.1+) support native isolated subagents. Cursor adapter now ships to `.cursor/agents/`; the 4 code-review reviewers gained cross-platform frontmatter (`model: inherit`). (`core/skills/code-review/references/multi-perspective-dispatch.md`, `core/skills/dev-builder/references/sub-agent-isolation.md`, `core/agents/code-reviewer-*.md`)
- **Per-platform sub-agent model normalization.** Claude-specific model aliases (`opus`/`sonnet`/`haiku`) are invalid on Cursor/Gemini/OpenCode and could fail validation or fall back silently. `scripts/sync.ts` (`adaptAgentContent`) normalizes them to `inherit` for non-Claude adapters while preserving the opus pinning on Claude Code. `syncDir` and `fileHash` are both transform-aware, so `sync:discover` stays 0-drift.
- **AGENTS.md index no longer shipped into sub-agent scan dirs** (`.cursor/agents/`, `.gemini/agents/`, ...) where it would surface as a bogus agent entry. New `AGENT_DIR_SKIP`. (`scripts/sync.ts`)

### Changed
- `code-review/SKILL.md` review-checklist summary reworded to platform-neutral "4-dimension parallel review (Mode A dispatch)".

## [v1.48.0] - 2026-06-18

### Added
- **Critique Gate hardening**: Density quota (3 evidence-backed findings required, below → re-scan), Evidence schema (all three signal tables now require spec citation column), critique-of-critique mode (`forge-spec-critique.mjs --critique` detects fake-critique patterns). (`core/skills/product-spec-builder/references/critique-gate.md`, `scripts/forge-spec-critique.mjs`)
- **Plan Critique Check**: Anti-sycophancy gate for dev-planner — challenges Phase Order, MVP Scope, and Tech Stack decisions before writing DEV-PLAN.md. Generation Mode only. (`core/skills/dev-planner/references/plan-critique-check.md`)
- **Product size detection**: `pnpm forge-size-detect` reads Product-Spec.md and auto-recommends gate level — small products (CLI, ≤4 features, no auth/DB) get `light`, medium/large get `full`. Writes to `.forge/gate-config.json` with `--write-gate-config`. Runs after Spec confirmation in both 0-to-1 and Quick Mode. (`scripts/forge-size-detect.mjs`)
- **TBD overflow gate**: Hook blocks app code writes when Product-Spec.md has >5 `[TBD]`/`[待确认]` markers outside Idea Stage Exit Criteria. Excessive TBD markers indicate key decisions being deferred — a sycophancy pattern. (`scripts/hooks/spec-before-code-gate.mjs`)
- **Quick Mode density check**: Quick Mode now requires at least 1 substantive concern before presenting the Spec. Zero concerns triggers re-examination. (`core/skills/product-spec-builder/references/workflow-quick-mode.md`)
- **SKILL.md inline evidence rules**: Critique Gate evidence format (`§section` or `"spec quote"`) and verdict thresholds now inlined in product-spec-builder SKILL.md, ensuring anti-sycophancy mechanism works even if references/ aren't read. Based on progressive disclosure experiment.
- **Pre-commit sync hook**: `.git/hooks/pre-commit` runs `pnpm sync:discover` to detect core↔adapter drift. Blocks commit if drift found. (`scripts/sync.ts`)

### Changed
- **Gate downgrade risk warning**: The recovery message for missing Spec now presents `light`/`none` as a risk-bearing option with ⚠️ warning, not a neutral skip instruction. (`scripts/hooks/spec-before-code-gate.mjs`)
- **dev-planner workflow.md**: Analysis Phase Step 4 now routes through Plan Critique Check before Output Phase.
- **dev-planner SKILL.md**: Added Plan Critique Check section with skip conditions.

### Fixed
- **Skill eval**: 14/14 skills now pass eval (0 errors, 0 warnings). Previously: change-manager (missing archive dir), domain-mapper (missing artifacts), bug-fixer (ref-lint "四阶段" warning).
- **Adapter drift**: plan-hard-gate-rationalization.md was out of sync across adapters. Fixed by `pnpm sync`.

## [v1.47.0] - 2026-06-18

### Added
- **Simplification intensity dial**: `FORGE_SIMPLIFY=off|lite|full|ultra` in `.forge/config` controls how aggressively the agent applies YAGNI and simplification. Safety boundaries documented — input validation, data-loss prevention, security, accessibility never simplified. (`core/skills/dev-builder/references/first-principles.md`, `.forge/config.example`)
- **forge-simplify-check**: `pnpm forge-simplify-check` — light over-engineering review (git diff or `--full` scan). Detects single-use interfaces, single-method classes, speculative generics, bloated files, commented-out code. Lighter than `/code-review`. (`scripts/forge-simplify-check.mjs`)
- **forge-debt**: `pnpm forge-debt` — harvests `// NOTE:` simplification markers into a structured debt ledger at `.forge/debt-ledger.md`. Supports custom pattern via `--pattern`. (`scripts/forge-debt.mjs`)

### Changed
- **first-principles.md**: YAGNI check in action summary now conditioned on `FORGE_SIMPLIFY` level. New Safety Boundaries section. (`core/skills/dev-builder/references/first-principles.md`)

## [v1.46.0] - 2026-06-18

### Added
- **forge-ecosystem — Ecosystem library cache**: New `pnpm forge-ecosystem` CLI managing a global, per-language cache of curated library recommendations at `~/.forge/ecosystem/<lang>.json`. Subcommands: `search` (search cache by query), `add` (manually add entries), `refresh` (populate from cold-start defaults), `get` (dump language data), `status` (cache summary). Search-on-miss pattern — check cache before Context7/WebSearch. (`scripts/forge-ecosystem.mjs`, `scripts/forge-ecosystem/`)
- **Cold-start defaults for 5 languages**: TypeScript (12 entries across 7 categories), Python (10/7), Go (9/6), Rust (8/6), Java (7/5) — curated library recommendations for testing, HTTP, CLI, DB, validation, logging, and config categories. (`scripts/forge-ecosystem/cold-start.mjs`)
- **Ecosystem Cache First principle**: dev-builder first-principles.md now guides agents to run `pnpm forge-ecosystem search` before any online library lookup. Pinned selections go to `.forge/ecoresult.json`. (`core/skills/dev-builder/references/first-principles.md`, `core/skills/dev-builder/references/development-strategies.md`)
- **Project-level overrides**: `.forge/ecoresult.json` supports `pins` (force-include a library) and `bans` (block a library). Template installed by forge-install. (`core/templates/ecoresult-template.json`, `scripts/install.ts`)

### Docs
- **forge-quickref.md**: Added ecosystem command to Skill reference table. (`core/templates/forge-quickref.md`)

### Technical
- **Forge scripts**: New `pnpm forge-ecosystem` registered in package.json. All new scripts follow existing .mjs convention with exported functions and test isolation via `setCacheDirForTest()`. (`package.json`, `scripts/forge-ecosystem/`)

## [v1.45.0] - 2026-06-14

### Added
- **forge-bug-fix diagnose --scenario**: Three new scenario-specific diagnostic modes — `compile` (tsc+imports+tsconfig), `config` (git+env+deps+ports), `data` (encoding+JSON+CRLF+large files). (`scripts/forge-bug-fix.mjs`)
- **ReqForge-specific debugging strategies**: debugging-strategy.md enriched beyond generic 4-stage methodology — Stage 1 now leverages dep-graph blast radius, trace history matching, project-memory known pitfalls, and scenario-specific diagnose; Stage 2 uses forge-bug-fix classify/bisect; Stage 3 adds trace capture and three-strikes stall; Stage 4 adds verify automation and three-layer diagnosis reporting. (`core/skills/bug-fixer/references/debugging-strategy.md`)

### Changed
- **bug-fixer workflow.md**: During Stage 1, Agent now guided to run scenario-specific diagnose by problem type. (`core/skills/bug-fixer/references/workflow.md`)
- **bug-fixer SKILL.md**: forge-bug-fix diagnose reference updated with --scenario flag. (`core/skills/bug-fixer/SKILL.md`)
- **README / README.zh-CN**: forge-bug-fix entries updated to include diagnose --scenario.

### Technical
- **Cross-platform findFiles()**: New portable recursive file finder replaces `execSync("find ...")` calls — resolves `find` command unavailability in execSync on Windows (cmd.exe default shell). (`scripts/forge-bug-fix.mjs`)

## [v1.44.0] - 2026-06-09

### Added
- **Critique Gate phase**: New pre-Spec adversarial review in product-spec-builder 0-to-1 workflow, after Multi-Stakeholder Review and before Document Generation. Three structural signals (Hidden Assumptions, Unchallenged Decisions, Scope That Should Be Cut) counteract LLM sycophancy bias. Validated by three-round experiment: 5:0 blind eval preference, +5.2 risk visibility, +4.2 rework resistance. Default on for 0-to-1, skipped in Quick/Iteration, user may opt out. (`core/skills/product-spec-builder/references/critique-gate.md`)
- **forge-spec-critique**: `pnpm forge-spec-critique` — automated spec critique scoring tool measuring assumption count, challenge count, and scope decisions. (`scripts/forge-spec-critique.mjs`)
- **forge-spec-blind-eval**: `pnpm forge-spec-blind-eval` — automated A/B blind evaluation experiment for validating spec quality differences. Randomized order, independent LLM session evaluation on 5 dimensions. Supports DeepSeek, OpenAI, and Anthropic providers. (`scripts/forge-spec-blind-eval.mjs`)

### Changed
- **Multi-Stakeholder Review stop rule**: "Proceed" now transitions to Critique Gate (was directly to Document Generation). (`core/skills/product-spec-builder/references/multi-stakeholder-review.md`)
- **product-spec-builder workflow**: 0-to-1 now runs Discovery → Exploration → Clarifying → Refinement → MS Review → **Critique Gate** → Document Generation. (`references/workflow-0-to-1.md`)

### Docs
- **Spec Critique Gate experiment report**: `forge-spec-experiment/result.md` — three-round experiment with manual A/B, dogfood (novel-writing app), and automated blind evaluation.
- **Architecture & usage sync**: README, README.zh-CN, CHANGELOG, Skill table updated for Critique Gate + three-gate relationship (MS Review / Critique Gate / Step 7 Council).

### Sync
- **Adapter sync**: Propagated critique-gate.md, workflow changes, MS Review stop rule update, SKILL.md gotchas, commands phase index, and product-spec-template Critique Gate Summary section to all 4 adapters.

### Added (measurement infrastructure)
- **Grovel Index baseline**: First-ever run of Position-Swap test across 5 scenarios. Avg GI=0.21 (moderate catering). Key finding: catering is asymmetrical — model pushes back on "don't want" more than it follows "want". (`.forge/skills/product-spec-builder/eval/grovel/baseline-2026-06-09.json`)
- **Conversational Catering Test (CCT v2)**: Free-form dialogue sycophancy measurement across 3 interventions. Baseline sycophancy 0.8/5 → 0 with anti-cater. Blind spot detection 33% → 67%. (`cct-v2-baseline-2026-06-09.json`)
- **Structured review ceiling test**: Structured review format achieves 93% blind spot detection unaided — Critique Gate value is in conversational phase. (`catering-baseline-2026-06-09.json`)
- **Cross-provider validation**: Claude Sonnet/Opus match DeepSeek pattern: sycophancy is scenario-specific, not model-specific. "Don't cater" works universally. (`cross-provider-2026-06-09.json`)
- **forge-smoke #13 grovel-baseline**: Structural integrity check for measurement framework (no LLM calls). (`scripts/forge-smoke/grovel-baseline.mjs`)

### Docs (supplementary evidence)
- **Spec Critique Gate technical report**: Added §6.4 with Grovel Index, conversational catering, structural ceiling data; §6.4.7 cross-provider validation. (`docs/spec-critique-gate-technical-report.md`)

## [v1.43.0] - 2026-06-08

### Added
- **Multi-Stakeholder Review phase**: New pre-Spec structured review in product-spec-builder 0-to-1 workflow. Four perspectives (Business, Technical, Experience, Scope/Risk) each return verdict (ok/clarify/blocked). Hard cap at 1 re-scan. Default on for 0-to-1, skipped in Quick/Iteration, user may opt out. (`core/skills/product-spec-builder/references/multi-stakeholder-review.md`)
- **forge-bug-fix bisect + classify**: Auto git bisect to locate first bad commit; error classification by pattern matching (compile/runtime/logic/data categories) with severity detection and fix recommendations. (`scripts/forge-bug-fix.mjs`)
- **forge-bug-fix wired into bug-fixer workflow**: Dependency Check + Workflow now reference forge-bug-fix diagnose/trace/bisect/classify/verify.

### Fixed
- **package.json version alignment**: Bumped to v1.43.0 to match README/CHANGELOG (was `1.42.0`).
- **forge-change.test.ts**: Added execSync timeout, DRY cleanup logic.
- **forge-bug-fix.test.ts**: Fixed vitest timeout shorter than execSync timeout (Windows ETIMEDOUT).

### Docs
- **Architecture & usage sync**: Mermaid diagram, 14-Skill tables, four-client install guide, domain-mapper / Multi-Stakeholder Review workflow across README (EN/ZH), Product-Spec, llms.txt, file-structure, dev-map.
- **GitHub Wiki source**: `docs/github-wiki/Home.md` updated to v1.43 (14 Skills, Gemini CLI, forge-install quick start).

### Sync
- **Adapter sync**: Propagated bug-fixer workflow changes, forge-bug-fix references, and multi-stakeholder-review to all 4 adapters (claude-code, cursor, gemini-cli, opencode).

## [v1.42.0] - 2026-06-08

### Added
- **/domain-mapper skill**: New Interactive-tier skill for transforming unstructured domain knowledge into a structured Markdown database (domain-map.md). 5-step guided pipeline: scope definition → domain snapshot → competitor deep-dive → social analysis → synthesis. Depth levels L1 (snapshot) / L2 (standard) / L3 (deep). Platform-agnostic — maps industries, technologies, codebases, and markets equally. (`core/skills/domain-mapper/`)

### Sync
- **gc-audit-routing.md + first-principles.md updates**: `pnpm sync` propagated Build Speed principle, GC audit routing, and all first-principles changes across 4 adapters (claude-code, cursor, gemini-cli, opencode).

## [v1.41.0] - 2026-06-07

### Added
- **Workflow cookbook**: `core/docs/workflow-cookbook.md` — 7 recipes (熔断循环/分头扫/对抗验证/Judge Panel/Pipeline/完整性审查/重试Guard) + 3 assembly examples (review→fix, spec→ship, feedback→evolve). Platform compatibility table included.
- **GC audit routing**: `core/skills/dev-builder/references/gc-audit-routing.md` — platform-agnostic decision table for audit depth allocation (Minor/Major/Full GC based on change impact). Change tracking card (Card Table) and assumption registry formats defined.
- **dev-builder first-principles.md**: Step 5 added to 行动摘要 — Phase complete → read gc-audit-routing.md → execute audit per decision table.

### Docs
- **Agent dispatch platform-agnostic proposal**: Issue #6 — moving hardcoded code-review agent dispatch (code-reviewer-bug/security/types/design) from workflow.md to platform-agnostic reference docs.
- **Published dev.to**: "Smarter Resource Allocation Beats Stronger Models" — English article on attention allocation (GC audit) + sample allocation (2.5 layer anchors).
- **Zhihu drafts**: 3 Chinese articles prepared (2.5-layer manifesto, triple allocation, benchmark).

## [v1.40.0] - 2026-06-07

### Added
- **UI-Spec.md — model-to-model 2.5 layer**: design-maker auto-generates a structured UI spec (component hierarchy, states, responsive rules, reusable components) during verification. dev-builder reads it at startup, skipping the guess-from-pixels trap. Ephemeral (regenerated each design cycle), not committed. (`core/templates/ui-spec-template.md`, `core/skills/design-maker/SKILL.md`, `core/skills/dev-builder/references/first-principles.md`)
- **Machine gate recovery options**: When spec-before-code, plan-before-build, idea-validation, implementer, or hallucination gates block a write, the block message now includes numbered recovery steps ("1. Run /product-spec-builder → 2. Fill criteria → 3. Confirm → 4. Retry"). (`scripts/hooks/spec-before-code-gate.mjs`, `core/hooks/hallucination-gate.sh`, `core/hooks/hallucination-gate.bat`)
- **Attention summaries across skills**: 7 skills (bug-fixer, code-review, change-manager, release-builder, dev-planner, product-spec-builder, design-brief-builder) now have `⚠️ 当前 Task 行动摘要` in their first-principles.md, leveraging recency/primacy bias. (`core/skills/*/references/first-principles.md`)
- **Self-review step for bug-fixer and release-builder**: Hot-context self-review between fix generation and verification (bug-fixer) / between smoke test and release confirmation (release-builder). (`core/skills/bug-fixer/references/workflow.md`, `core/skills/release-builder/references/workflow.md`)
- **design-maker first-principles.md**: New file with 出图前行动摘要 covering component hierarchy, state coverage, responsive rules, priority labeling, and UI-Spec generation. (`core/skills/design-maker/references/first-principles.md`)

### Changed
- **Anti-ai-slop-checklist guardrails restored**: 7 removed check items restored across change-manager, code-review, bug-fixer, release-builder, and design-brief-builder. (`core/skills/*/references/anti-ai-slop-checklist.md`)
- **bug-fixer anti-ai-slop-checklist**: Added "跳过复现" check. (`core/skills/bug-fixer/references/anti-ai-slop-checklist.md`)
- **design-maker SKILL.md**: Fixed typo "Anti-ai-slip" → "Anti-ai-slop". (`core/skills/design-maker/SKILL.md`)

### Docs
- **2.5-layer-manifesto extension**: New §5.6 "Model-to-Model 2.5 Layer" added to both Chinese and English versions, explaining how the 2.5-layer principle extends from person→model anchors to model→model intermediate representations. (`docs/2.5-layer-manifesto.md`, `docs/2.5-layer-manifesto.en.md`)

## [v1.39.0] - 2026-06-06

### Added
- **Spec difficulty markers**: Product-Spec.md now has `## Known Difficult Spots` section with 🔴/🟡/🟢 levels. dev-planner propagates difficulty to DEV-PLAN phases. dev-builder adjusts execution speed accordingly (🔴 = 怵然为戒, slow down + self-review; 🟢 = fast pass). New difficulties discovered during a Phase are auto-appended via 善刀而藏之. (`core/templates/product-spec-template.md`, `core/templates/dev-plan-template.md`, `core/skills/dev-planner/references/workflow.md`, `core/skills/dev-builder/SKILL.md`)
- **Anti-slop anchor reform**: Replaced 9 "don't" rules in dev-builder anti-slop checklist with 3 perfect code anchors (error handling / API endpoint / test patterns). Old checklist demoted to pre-delivery safety net. Based on the insight that LLMs are pattern matchers, not rule followers. (`core/skills/dev-builder/references/anti-ai-slop-checklist.md`)
- **放下骨架 (Phase 1 catalyst)**: Phase 1 explicitly lays down domain models, types, interfaces, and conventions as the project's structural anchor. All subsequent Phases naturally continue this anchor. (`core/skills/dev-builder/references/first-principles.md`, `core/skills/dev-builder/SKILL.md`, `core/skills/dev-builder/references/workflow.md`)
- **善刀而藏之 closing ritual**: Mandatory 5-step Phase completion: review → celebrate → append hidden difficulties to Spec → log decisions → clear context. Inspired by Zhuangzi's butcher who sharpens his knife by sheathing it after use. (`core/skills/dev-builder/references/phase-completion-assessment.md`)
- **Change-manager auto-rollback**: On verify failure, `pnpm forge-change restore <name>` reverts files from pre-apply snapshot. New `snapshot` and `restore` commands. (`core/skills/change-manager/references/workflow.md`, `scripts/forge-change.mjs`)
- **Security rules template**: `core/templates/security-rules-template.md` — 3 hard rules (no hardcoded secrets, always validate inputs, audit logs for sensitive operations) + PII-in-logs constraint. Installable as `.claude/rules/security.md`. (`core/templates/security-rules-template.md`)
- **Benchmark suite**: `benchmark/` directory with side-by-side comparison of old anti-slop (9 rules) vs new approach (3 anchors) on todo-cli. Results: both pass all tests; new approach produces 15% shorter code. (`benchmark/RESULTS.md`)
- **Design-maker multi-alternative + gradual refinement**: `--alternatives N` mode generates N design variants with cross-comparison table. Gradual refinement mode delivers in 3 tiers (structure → interaction → edge cases). (`core/skills/design-maker/SKILL.md`)

### Changed
- **No dashboard Web UI**: Decision made not to build it — Forge users live in CLI, not web.
- **Skill evolution P1/P2**: Deferred until feedback data accumulates to justify the work.

### Docs
- **2.5层设计文章**: `docs/2.5-layer-manifesto.md` (Chinese) and `.en.md` (English) — full article explaining the design philosophy shift from shackles to anchors, with benchmark results, anchor selection guide, and troubleshooting.

## [v1.38.0] - 2026-06-06

### Added
- **Template marketplace**: `core/templates/project-starters/` — curated project starters with metadata + skeleton files. 4 starter templates: next-fullstack, cli-tool, express-api, electron-app. `forge-scaffold init <template> [dir]` — one-command init with placeholder replacement, post-init steps, and loadout recommendations. `forge-scaffold list-templates` — browse available starters.
- **Gemini CLI adapter**: `adapters/gemini-cli/` — 4th AI client adapter. Uses `.gemini/` directory with `GEMINI.md` as control file, `agents/` for subagent definitions, `skills/` for Forge skills. Synced from core via `pnpm sync`. All 944 files in sync across all 4 adapters.

## [v1.35.12] - 2026-06-01

### Added
- **forge-ops**: new `pnpm forge-ops <url>` — production monitoring loop: health check → verify suite → baseline comparison → regression detection → fix brief → report. Supports `--interval <sec>`, `--baseline save|compare`, `--fix`. Output: `.forge/ops/report.md`. (Phase 16 candidate)
- **forge-loop --fde**: Forward Deployed Engineer mode — reads Product-Spec.md + DEV-PLAN.md context before execution, generates structured evidence report (`.forge/evidence/phase-N-report.md`) on completion. `pnpm forge-fde` convenience alias.
- **Evidence chain**: `forge-loop --fde` outputs machine-readable evidence report with test pass rate, delivery checklist completion, UI check results, file change list, and pass/fail verdict per deliverable.
- **skill-eval judge v2 rubric**: expanded from 5 to 6 dimensions — added "工作流质量与可重复性" (workflow quality & repeatability, 30% weight) focusing on result consistency, verification loops, and real-project usability. Baseline comparison dimension added. judge-config template bumped to version 2.

### Fixed
- **forge-ui-check**: phases with progress-table entry but no detailed `## Phase N:` section no longer cause false-positive failures (exit 0 instead of 1, so forge-loop doesn't get stuck in dead loop).
- **forge-loop checkUi**: catches "Phase not found"/"无 UI" errors and treats them as pass, preventing iteration deadlock on non-UI phases.

## [v1.36.0] - 2026-06-04

### Added
- **Quality Rubric for all 13 skills**: every Skill now has a domain-specific 8-16 item scoring rubric with ship threshold and critical-item-zero rule. Run `pnpm validate-skill --score core/skills/<name>` to compute.
- **Dimension checklists for 9 skills**: formal `references/dimension-checklist.md` with Must-Have / Recommended / Optional tiers. New: bug-fixer, change-manager, dev-builder, release-builder, design-maker, evolution-engine, feedback-writer, request-dispatcher, skill-builder.
- **Anti-rationalization for 6 skills**: change-manager, design-brief-builder, design-maker, evolution-engine, feedback-writer, release-builder — each with domain-specific Rationalization|Reality tables to prevent AI from skipping critical steps.
- **Anti-ai-slop checklists for 5 skills**: bug-fixer, change-manager, dev-builder, code-review, release-builder — 7-9 item Chinese pass/fail checklists for pre-delivery self-check. Wired into all workflows.
- **references/ filled for request-dispatcher and skill-builder**: request-dispatcher gained first-principles, output-style, workflow, anti-rationalization files. skill-builder gained first-principles, output-style (new), workflow, anti-rationalization (new) — previously these sections were inline-only or absent.
- **Eval pack verification**: all 13 skills pass `pnpm skill-eval <name>` static checks (triggers.json + cases.json).

### Changed
- **request-dispatcher SKILL.md** -66 lines: extracted inline content to references/ files.
- **skill-builder SKILL.md** -104 lines: extracted inline content to references/ files; added Output Style section (previously absent).

## [v1.35.14] - 2026-06-04

### Added
- **Skill eval packs for all 13 core skills**: every framework Skill now has `.forge/skills/<name>/eval/` with `triggers.json` (2 positive + 2 near-miss negative trigger cases) and `cases.json` (output assertions: fileExists + maxBytes + regexChecks). `pnpm skill-eval <name>` static check passes on all skills. Enables regression detection and trigger accuracy verification.

## [v1.35.13] - 2026-06-03

### Added
- **forge-hashline verify-brief**: `pnpm forge-hashline verify-brief <brief-path>` — parses fix-brief.md hashline entries, verifies all hash anchors match current files (before-fix) or detects whether files were actually modified (after-fix with `--after-fix`). Reports OK/STALE/UNCHANGED/MISSING per entry. `--json` for machine-readable output.
- **forge-hashline apply-brief**: `pnpm forge-hashline apply-brief <brief-path>` — auto-creates files marked as `(新文件)` in fix-brief.md.
- **Hashline verification loop**: forge-loop and forge-phase-loop now run `verify-brief` on brief generation (freshness check) and on next iteration (application check), plus `apply-brief` for auto-creating new files. Breaks the string-matching retry deadlock in fix→verify cycles.
- **forge-hashline**: `pnpm forge-hashline hash|verify|edit <file>` — SHA256 content-hash anchored editing. Atomic write via tmp+rename, CRLF→LF normalization, block hashing with `--lines N:M`. Integrated into forge-loop/forge-phase-loop fix-brief.md as `**Hashline**:` anchor entries.
- **sync --discover**: `pnpm sync:discover` — drift detection between core/ and adapters/. Reports drifted (hash mismatch), orphan (adapter-only), missing (core-only).
- **forge-loop --strict/--linear**: `--strict` stops on first test failure with review.md; `--linear` runs single pass without iteration.
- **skill-eval trigger**: auto-generates 20 diverse queries from SKILL.md, runs static checker, logs results. Judge pipeline: `judge-prep` → `judge` → `judge-record`.

## [v1.37.0] - 2026-06-05

### Added
- **forge-coverage**: `pnpm forge-coverage <specifier>` — test coverage gap detection and auto-stub generation. Scans vitest/luma coverage JSON, maps uncovered functions, generates stub files. Naming-convention fallback when coverage JSON unavailable.
- **forge-scaffold**: `pnpm forge-scaffold <specifier>` — project scaffolding from Product-Spec.md. Generates DEV-PLAN.md stubs, directory structure, and package.json from feature descriptions.
- **forge-step-capture**: trajectory capture and evolution proposal loop for forge-step-capture. Records step-level execution traces for failure attribution.
- **forge-skill-retrieve**: skill dynamic retrieval engine — context-aware section selection from skill references based on user intent matching.
- **forge-evidence**: `pnpm forge-evidence generate|aggregate|list` — three-tier evidence grading reports: dev (coverage, git diff, traces), lead (gate pass rates, trends), client (deliverables, acceptance criteria). Wired into forge-loop as always-on.
- **forge-ops 完整化**: `pnpm forge-ops <url>` — production monitoring loop. Added sendSlack/sendFeishu webhook notifications, auto-deploy mode, baseline comparison. forge-loop sends ops alerts on completion paths.
- **forge-release**: `pnpm forge-release version|changelog|tag|check|all` — release automation. Version bump, auto-changelog entry, git tag, pre-release checklist.
- **forge-evolve**: `pnpm forge-evolve status|scan|propose|apply` — evolution engine loop closure. Scans .claude/feedback/ entries, identifies Level 2/3 candidates, generates evolution proposals.
- **forge-change**: `pnpm forge-change init|list|check|archive` — change management CLI. Scaffolds change directories from templates, tracks active/archived status. 8 E2E tests.
- **forge-skill-eval**: `pnpm forge-skill-eval status` — centralized eval dashboard across all 13 skills. Shows triggers/cases/judge-config/judge-history per skill.
- **skill-eval judge-all**: batch judge-config.json deployment to all `.forge/skills/` packages. All 13 skills now have judge-config.json deployed.

### Changed
- **forge-loop**: coverage scan after auto-fix, ops alerts at allOk/max-reached, evidence always-on (no longer FDE-only), forge-evolve scan on completion paths.
- **Feedback backfill**: 3 feedback entries backfilled with failure_class and scores for evolution engine processing.

## [v1.36.0] - 2026-06-04

### Changed
- **Prompt slimming**: `change-manager` SKILL.md index-only (~11k→~4.7k); propose/apply/verify/archive workflow → `references/`; must read `references/workflow.md`.

## [v1.35.7] - 2026-05-26

### Changed
- **Prompt slimming (P6)**: `CLAUDE.md` General Rules 指针化（~7.9k→~5.5k）；tool-call / web-first / pin / forge-install / preflight / skill-eval / CLI / loadout → `forge-quickref` §通用规则；移除重复的 `[Available Skills]` 段（保留 `[Skill Dispatch]`）。
- **forge-quickref**: 新增 §通用规则（CLAUDE.md 指针目标），含 `--loadout` 安装说明。
- **skill-builder**: 新 Skill 注册步骤改为只更新 `[Skill Dispatch]`。

## [v1.35.6] - 2026-05-26

### Added
- **`forge-install --loadout <name>`** (`-l`): install only skills/agents from a loadout (+ `_shared`), merge loadout hooks into adapter settings, write `.forge/loadout-active.json`. Shared logic in `scripts/loadout.ts`; `apply-loadout` refactored to use it.

### Changed
- **loadout-scenarios.md**: document `--loadout` install path; skills are filtered on install when loadout is specified.

## [v1.35.5] - 2026-05-30

### Changed
- **Prompt slimming (P4)**: `bug-fixer` SKILL.md index-only (~5.2k chars); four-stage debugging, CoT, three-layer model → `references/`; must read `references/workflow.md`; retry-gate unchanged.
- **Prompt slimming (P4)**: `code-review` SKILL.md index-only (~4.5k chars); principles/judgment-spectrum/anti-rationalization → `references/`; parallel reviewer workflow unchanged in `references/workflow.md`.

## [v1.35.4] - 2026-05-30

### Changed
- **Prompt slimming (P3)**: `design-brief-builder` SKILL.md index-only (~3.8k chars); interview/workflow → `references/`; must read `references/workflow.md`.
- **Prompt slimming (P3)**: `release-builder` SKILL.md index-only (~4.8k chars); checklist/strategy/8-step workflow → `references/`; privacy audit steps unchanged.

## [v1.35.3] - 2026-05-30

### Changed
- **Prompt slimming (P2)**: `product-spec-builder` SKILL.md index-only (~7k chars); principles/output-style/judgment-spectrum/startup routing → `references/`; **Quick Mode** isolated in `references/workflow-quick-mode.md` (do not load full 0-to-1 interview chain); Karpathy → `_shared/karpathy-discipline.md`.

## [v1.35.2] - 2026-05-30

### Added
- **`lite` loadout** (`core/loadouts/lite.json`): 8 skills (spec, change-manager, plan, build, bug, review, feedback, dispatcher) + 8 hooks — token-conscious greenfield/brownfield without design/release/evolution/skill-builder.

### Changed
- **Prompt slimming (P1)**: `dev-planner` SKILL.md index-only (~5k chars); workflow/analysis → `references/`; must read `references/workflow.md` before planning.
- **CLAUDE.md volatile trim**: Project State Detection → `forge-quickref.md` §项目状态路由; bootstrap points to quickref for session routing.

## [v1.35.1] - 2026-05-30

### Added
- **Cross-client handoff**: `forge-quickref` and `agents-template` — fixed file read-order when switching AI clients (Claude Code ↔ Cursor ↔ OpenCode); update `memory/handoff.md` before leaving.

### Changed
- **Prompt slimming (P0)**: `dev-builder` SKILL.md index-only (~7k chars); full workflow → `references/workflow.md`; principles → `references/first-principles.md`; shared pointers in `core/skills/_shared/` (karpathy, hard-gate, output-style). Compressed `forge-bootstrap.md`; deduped `bug-fixer` / `code-review` Karpathy blocks.

## [v1.35.0] - 2026-05-29

### Added
- **AGENTS.md template** (`core/templates/agents-template.md`): enhanced with parallel worktree workflow — branch naming convention (`Type/user/short-task`), dependency sharing scripts, multi-agent coordination rules, and integration checklist. Written by `pnpm forge-install` as project root `AGENTS.md`.
- **Structured exploration trace** (`scripts/forge-trace.mjs`): `init`, `decision`, `dead-end`, `evidence`, `summary` commands for recording Phase decisions, abandoned approaches, and claim-to-evidence bindings. Stored in `.forge/trace/phase-<N>.json`. Hooked into dev-builder Loading Phase (init) and Phase Completion Assessment (record). New `trace-fresh` check in `forge-verify`.
- **Scope filter (巽)** (`scripts/forge-scope.mjs`): `init`, `check`, `show` commands for declaring Phase file boundaries (modify/readonly/outOfScope). Creates `.forge/active-scope.json`. Enforced by `forge-verify scope-check` against `git diff --name-only HEAD`. Inspired by 八卦信息论 protocol audit.
- **Evolution proposals (兌)**: dev-builder Phase Completion After All Pass triggers evolution-engine scan for actionable patterns. Presents Y/N proposals to user before proceeding. Logs deferred proposals to `.forge/evolution-proposals.md`. Closes the feedback→evolution loop proactively.
- **Skill quality judge** (`pnpm skill-eval judge`): independent sub-agent evaluates Skill against 5-dim rubric (structure/specificity/failure-mode/anti-patterns/effectiveness). Commands: `judge-prep`, `judge` (prints briefing), `judge-record`. Results append to `judge-history.json`. Inspired by darwin-skill's autonomous evaluation loop.
- **Skill authoring patterns** (`core/docs/skill-authoring-patterns.md`): practical reference synthesizing 300 prompts patterns, darwin-skill rubric, and ReqForge Harness experience — workflow design, failure-mode encoding, actionable specificity, anti-pattern blacklists, evaluation checkpoints, multi-agent collaboration, and rubric self-check table.

### Changed
- **dev-builder**: Loading Phase Step 5 initializes trace; Phase Completion Assessment After All Pass records decisions/dead-ends/evidence.
- **forge-verify**: new `trace-fresh` check — validates trace files have content (decisions or dead-ends); new `scope-check` — enforces `.forge/active-scope.json` boundaries against `git diff`.
- **forge-quickref**: index rows for AGENTS.md and `.forge/trace/`; trace command quick reference.
- **phase-exit-guard**: now checks both `.forge/phase-exit-block` and `.forge/.verify-block` (written by forge-verify on baseline regression).

## [v1.34.0] - 2026-05-28

### Added
- **Matt Pocock Skills 对照**：[mattpocock-skills-comparison.md](core/docs/mattpocock-skills-comparison.md) — 与 skills-main 能力映射；并行安装建议
- **P1 Light Grill**：`product-spec-builder` Light Grill Mode + [light-grill-mode.md](core/skills/product-spec-builder/references/light-grill-mode.md)
- **P2 Zoom-out / 架构保健**：[zoom-out-pass.md](core/skills/dev-builder/references/zoom-out-pass.md)、[architecture-health-pass.md](core/skills/dev-planner/references/architecture-health-pass.md)
- **P3 GitHub slices**：[github-issues-slices-template.md](core/templates/github-issues-slices-template.md) + dev-planner optional export
- **request-dispatcher** routing for grill / zoom-out / architecture health / issue slices

## [v1.33.0] - 2026-05-28

### Added
- **腾讯 Harness 镜子对照**：[tencent-harness-mirror-comparison.md](core/docs/tencent-harness-mirror-comparison.md) — 显形/三块石碑/不可能三角 ↔ Forge
- **`.forge/project-taste.md`**：团队口味模板（`installProjectTaste` + `forge-install`）
- **Judgment Spectrum (S1–S5)**：`product-spec-builder`、`code-review`；`dev-builder` Loading Phase 读 project-taste

## [v1.32.0] - 2026-05-28

### Added
- **SkillOpt 对照**：[skillopt-comparison.md](core/docs/skillopt-comparison.md) — rollout/反思/有预算编辑/验证门/rejected buffer ↔ Forge
- **skill-eval**：`rejected-edits.json` 模板；cases 文档化 `split: train | held-out`
- **evolution-engine**：Bounded Skill Edits（≤3 条 add/delete/replace + 失败写入 rejected-edits）
- Template [evolution-bounded-edit-template.md](core/templates/evolution-bounded-edit-template.md)

## [v1.31.0] - 2026-05-28

### Added
- **Skill eval** for user-project custom Skills: `pnpm skill-eval init <name>` + `pnpm skill-eval <name>`; templates in `core/templates/skill-eval/`; doc [skill-eval.md](core/docs/skill-eval.md)
- **skill-builder**: deliver `eval/` pack (triggers + output assertions); **forge-install** writes `.forge/skills/_template/eval/`
- README / DEV-PLAN / CLAUDE.md / quickref documentation for skill-eval

## [v1.30.0] - 2026-05-28

### Added
- **Release preflight**: `scripts/preflight.ts` + `pnpm preflight` — git/version/build privacy + `.forge/preflight.json` rules
- Templates: `preflight-config.template.json`, `preflight-wechat.example.json`; doc [external-publish-preflight.md](core/docs/external-publish-preflight.md)
- **release-builder** Step 3b Preflight Gate; `forge-install` writes `.forge/preflight.json` + `preflight-wechat.example.json`
- README / quickref / DEV-PLAN / CLAUDE.md documentation for preflight

## [v1.29.0] - 2026-05-28

### Added
- **`.forge/security-guidance.md`**: team-versioned security rules template; `pnpm forge-install` (`installSecurityGuidance`); [security-guidance-comparison.md](core/docs/security-guidance-comparison.md).
- **forge-verify** `security-patterns`: lightweight `eval` / `new Function` scan when `.forge/security-guidance.md` exists.

### Changed
- **code-review** / **release-builder** / **dev-builder**: read `.forge/security-guidance.md` for security-sensitive work.
- **forge-quickref**: index row for security-guidance.
- **founders-playbook-comparison**: Security Gate links to security-guidance doc.

## [v1.28.0] - 2026-05-27

### Added
- **dev-map**: project-level navigation index at `.forge/dev-map.md` — AI explores module structure, existing patterns, and change impact chains before coding. Template at `core/templates/dev-map-template.md`; written by `pnpm forge-install` (`installDevMap`). Maintained by dev-builder (who changes code updates the map).
- **forge-verify**: unified post-verification entry point `pnpm forge-verify` with 5 checks (skill-quality, compile, test, no-placeholders, dev-map-fresh) and baseline comparison (`--baseline save|compare|check`). Scripts at `scripts/forge-verify.mjs` + `scripts/forge-verify/baseline.mjs`.
- **request-dispatcher**: added missing `skill.json` metadata and `commands/request-dispatcher.md`.

### Changed
- **dev-builder**: Loading Phase now runs `pnpm forge-verify --baseline save` before coding; Phase Completion Assessment runs `pnpm forge-verify --baseline compare` after four-step verification and updates `.forge/dev-map.md`. New First Principle: Post-Verification Gate.
- **check-evolution hook**: Part 2 project state detection now includes `dev-map` status.
- **Smoke tests**: `adapters-sync` and `skills-complete` updated from 12→13 skills to reflect request-dispatcher count.

## [v1.27.0] - 2026-05-27

### Added
- **CLAUDE.md zone partitioning**: [Immutable/Stable/Volatile](CLAUDE.md#L1) zones — session-varying content at end of prompt preserves prefix for caching.

### Changed
- **Settings hook format**: PreToolUse/PostToolUse now arrays (was objects); removed invalid events (PreCommit, BeforeCommand, AfterCommand, PostCommit, OnInit); merged BeforeCommand/AfterCommand into PreToolUse/PostToolUse arrays.
- **Skill quality**: 13/13 PASS, 0 FAIL (4 at perfect 33/33). Fixed Gotchas/step-counting cross-contamination, Strategy vs Strategies regex mismatch, TBD text matching `\[.*\]` sed pattern.
- **Feedback cleanup**: Converted stray JSON files to standard `.md` frontmatter format; fixed FEEDBACK-INDEX.md missing entries.

## [v1.26.0] - 2026-05-27

### Added
- **`.forge/quickref.md`**: human one-pager (gates, 4 principles, 8 rules summary, anti-patterns, Skill commands); template `core/templates/forge-quickref.md`; written by `pnpm forge-install` (`installForgeQuickref`).
- **Idea Validation Gate**: `Product-Spec.md` § Idea Stage Exit Criteria (3 questions) required before app code (`spec-before-code-gate.mjs`); template + product-spec-builder devil's advocate step.
- **MVP Scope block** in `DEV-PLAN.md` template (in scope / out of scope / scope amendment criteria); dev-planner + dev-builder enforcement.
- [founders-playbook-comparison.md](core/docs/founders-playbook-comparison.md) — Playbook ↔ Forge mapping.
- [shuge-openspec-superpowers-comparison.md](core/docs/shuge-openspec-superpowers-comparison.md) — OpenSpec + Superpowers article ↔ Forge; change-manager ↔ dev-builder handoff.
- **`request-dispatcher`** meta-skill — routes ambiguous user requests to the correct Forge Skill.
- **HTML knowledge boundaries** (`<!-- begin/end -->`) on all 12 skills for progressive disclosure / validator cross-refs.

### Changed
- **Agent execution discipline**: rule 8 is now an explicit **verify loop** (fix → re-run checks until green; last-run output required); anti-patterns + framework test-placement table in [session-execution-discipline.md](core/docs/session-execution-discipline.md).
- **behavior-rules.md**: violation signals link to feedback case IDs; `何时可简化` exemption table (prior).
- **forge-bootstrap** / **implementer**: verify-loop summary aligned with discipline doc.
- **README** / **README.zh-CN** / **docs/github-wiki/Home.md** / **llms.txt**: verify loop + quickref on install.
- **Audit alignment**: root + `test-demo` Spec/Plan examples; `core/templates/product-spec-template.md`; repo `.forge/quickref.md`; `change-proposal` scope discipline; `machine-gates-doc` + `core/hooks/AGENTS.md` six-step gate docs.
- **change-manager** / **dev-builder**: Change-Scoped Mode; Delta Spec + G/W/T in change-specs-template; two-tier Task review (spec compliance → code quality).
- **Skills**: version metadata standardization; Anti-Rationalization tables unified; progressive disclosure for product-spec-builder, bug-fixer, code-review.

### Fixed
- **validate-skill**: broaden Strategy pattern in cross-reference check; validator score fixes (change-manager, evolution-engine, feedback-writer, design-maker).

## [v1.25.0] - 2026-05-25

### Added
- **Harness hardening (Superpowers-aligned)**: `forge-bootstrap` session iron laws; `product-spec-builder` / `dev-planner` HARD-GATE; evolution Skill TDD quartet + `failure_class`; `tests/skill-fixtures` + forge-smoke **12** smokes; mandatory implementer + worktree; `.forge/*-confirmed.json` + `implementer-session.json` PreToolUse chain; `drift-map-template.md`; forge-smoke `skill-bypass` (P2); `validate-skill` requires `[HARD-GATE]` on spec/plan/build skills.
- **product-spec-builder PM frameworks** (MIT-adapted from [pm-skills](https://github.com/phuryn/pm-skills)): optional OST, JTBD value prop, assumptions, competitive briefs + Spec template sections.
- **Chain-of-Thought (CoT)**: `conversation-strategy` templates; implementer step 0b + `reasoning_summary`; `bug-fixer` diagnostic checklist; forge-bootstrap Iron Law 9 (no user magic phrase required).
- **Agent execution discipline (8 rules)**: [session-execution-discipline.md](core/docs/session-execution-discipline.md); bootstrap summary; full copy in [agents-template.md](core/templates/agents-template.md); README **Agent execution discipline** section.
- **release-builder**: Finishing Branch Checklist (merge / PR / keep / discard). **bug-fixer**: Phase-1-before-fix cross-ref to systematic debugging.

### Changed
- `hallucination-gate` now runs full `spec-before-code-gate.mjs` (Spec, confirmations, Plan, implementer session). `feedback-observer` auto `failure_class` heuristics (P1-lite).
- README / README.zh-CN / `llms.txt` / GitHub Wiki source: PM frameworks + CoT + **Agent execution discipline (8 rules)**; **Requirements depth** section; Workflow spec-confirmation steps; version **v1.25.0**.
- DEV-PLAN / test-demo README: `pnpm forge-smoke` documented as **12** smokes (~15–30s).

## [v1.24.0] - 2026-05-24
### Added
- Comparison docs: [autoresearch](core/docs/autoresearch-comparison.md), [llm-council](core/docs/llm-council-comparison.md), [jobs](core/docs/jobs-comparison.md), [llm-wiki gist](core/docs/llm-wiki-comparison.md).
- **Primary metric** per DEV-PLAN Phase; dev-builder Spec/Plan read-only + Task micro-cycle; code-review **risk_rank** (S×I×C); **PROJECT-HEALTH-template.md**; product-spec **LLM-as-Judge** subsection; Spec Step 7 quality council.

### Fixed
- **OpenCode adapter**: `pnpm sync` now copies root `CLAUDE.md` → `.opencode/AGENTS.md` (was empty `agents-template.md`, breaking Forge dispatch).
- **forge-smoke** `machine-gates-doc`: asserts OpenCode AGENTS.md mirrors Machine Gates + Skill Dispatch.

### Changed
- `memory-system.md`: LLM Wiki pattern cross-reference; query filing → ADR rule.

## [v1.23.0] - 2026-05-24
### Added
- **forge-smoke** release gate: `pnpm forge-smoke` runs 9 static smokes (skills, loadouts, adapter sync, hooks, templates, machine gates, platform compliance, workflows); CI workflow `.github/workflows/forge-smoke.yml` on push/PR (no cron).
- **loadout-scenarios.md**: scenario → loadout → Skill path picker; `scenarios[]` tags on each built-in loadout JSON (required in schema).
- **platform-compliance.md**: GitHub/OSS policies (no cron CI, no central secrets, fork intent); forge-smoke checks workflows + doc presence.

## [v1.22.2] - 2026-05-23
### Added
- **retry-gate** in all loadouts and `apply-loadout` registry (was in `settings.json` since prior commit).
### Changed
- **settings.windows.json** (repo + claude-code + cursor): align with Unix — `phase-exit-guard`, `retry-gate`; remove default `PostCommit` auto-push.
- README / README.zh-CN / `llms.txt`: **10** default hooks; document `retry-gate`; note `core/docs/` on GitHub for adapter-only installs.
- Skill doc links to `core/docs/*` use GitHub URLs (work when only adapter bundle is copied).

## [v1.22.1] - 2026-05-23
### Added
- **agent-harness-seven-layer-map.md**: AGENT魔方「七层 Harness」↔ ReqForge mapping (teaching skeleton vs product pipeline).
- **phase-exit-guard** hook: blocks agent stop while `.forge/phase-exit-block` exists (Ralph-style Phase completion); wired in all loadouts + adapter settings.
- **retry-gate** (shipped in `b9f5dfc`): `.forge/.retry-counter.json` escalation blocks proceed; dev-builder / bug-fixer retry limits.
### Changed
- **dev-builder** `phase-completion-assessment`: when/how to write/remove `.forge/phase-exit-block`.
- **evolution-engine**: proposals require **Predicted effect** + **Verify by** (observability-driven evolution).

## [v1.22.0] - 2026-05-23
### Added
- **context7-comparison.md**: vs [upstash/context7](https://github.com/upstash/context7) — stack with ReqForge; optional CLAUDE.md rule snippet.
- **Library Docs Strategy** in `dev-builder/references/development-strategies.md` (Context7 before WebSearch for dependencies).
- **Context7 Library ID** column in Product-Spec Technical Direction and DEV-PLAN Tech Stack templates.
### Changed
- `dev-planner` SKILL: resolve Context7 IDs when MCP/CLI available.
- `web-app` loadout: optional Context7 MCP entry.
- README / README.zh-CN: Context7 callout + link.

## [v1.21.0] - 2026-05-23
### Added
- **harness-maturity-checklist.md**: P0/P1/P2 self-assessment for harness readiness; positioning vs consumer scheduled-automation products.
- **Product-Spec**: `Integrations, Operations & Scheduling` section (integrations, notifications, jobs, observability); Quick Mode infers defaults.
### Changed
- README / README.zh-CN: Harness OS analogy + scope boundary (shippable product vs post-chat life automation).
- **product-spec-builder**: Fix broken 0-to-1 workflow reference in SKILL.md.

## [v1.20.9] - 2026-05-23
### Added
- **open-design-comparison.md**: vs [nexu-io/open-design](https://github.com/nexu-io/open-design); when to use OD vs ReqForge design skills.
- **Design P0 from OD**: `design-discovery-questionnaire`, `visual-direction-presets`, `anti-ai-slop-checklist`, `design-self-critique`; Design-Brief template sections.
### Changed
- `design-brief-builder` / `design-maker` workflows reference new `references/` files.

## [v1.20.8] - 2026-05-23
### Added
- **superpowers-comparison.md**: ReqForge vs [obra/superpowers](https://github.com/obra/superpowers) — workflow mapping, TDD/subagent alignment, when to combine or pick one.
### Changed
- README / README.zh-CN: Superpowers callout + reference table row; cross-links in openspec/openhuman comparison docs.

## [v1.20.7] - 2026-05-23
### Changed
- **Brand messaging**: README/README.zh-CN lead with「需求→产品」, subtitle **Agent Harness**; product name unified as **ReqForge** in hero (repo name unchanged).
- `repo-metadata.json` description aligned; re-run `pnpm set-github-metadata` to refresh GitHub About.

## [v1.20.6] - 2026-05-23
### Added
- **GitHub discoverability**: README top — OpenSpec one-liner + architecture mermaid; `.github/repo-metadata.json` + `scripts/set-github-metadata.mjs` for About description/topics.
### Changed
- `package.json`: repository/homepage/keywords aligned with repo metadata.

## [v1.20.5] - 2026-05-23
### Changed
- **memory-guard hook**: `PostToolUse` runs `memory-guard` (wraps `context-compaction` + `check-handoff`). `memory-check` stays on `AfterCommand`. Default hook count 9→8. Legacy scripts retained for direct invoke.

## [v1.20.4] - 2026-05-23
### Changed
- **SKILL progressive disclosure**: `dev-builder` and `product-spec-builder` oversized sections moved to `references/`; main SKILL.md under 500 lines (validate-skill warning cleared).
- **`scripts/split-skill-references.mjs`**: Utility to repeat the split pattern for other skills.

## [v1.20.3] - 2026-05-23
### Changed
- **Commands layer**: All 12 skills' `commands/*.md` are index-only pointers to SKILL.md.
- **auto-push**: Removed from default adapter `settings.json` and from full/web-app/cli-tool loadout hook lists (optional manual enable documented in README).

## [v1.20.2] - 2026-05-23
### Changed
- **P0 — Spec vs change-manager**: product-spec-builder iteration no longer creates `changes/`; moderate scoped features route to `/change-manager`. Sole owner of `changes/` documented in both skills.
- **P1 — Review default simple**: code-review / code-reviewer / dev-builder default `change_complexity=simple`; parallel 4-agent review only when escalated.
- **P1 — Thin commands**: product-spec-builder, change-manager, code-review, dev-builder `commands/*.md` are index-only (details in SKILL.md).
- **Product-Spec.md**: Template market and Dashboard moved to Roadmap (not shipped).

## [v1.20.1] - 2026-05-23
### Added
- **openhuman-comparison.md**: Forge vs OpenHuman positioning; optional memory backends documented in `memory-system.md`.
- **change-verify-template.md**: Template for `changes/<name>/verify.md` in change-manager.
### Changed
- **CLAUDE.md**: Mission step for brownfield `/change-manager`; Project State Detection routes active `changes/` folders.
- **Loadout docs**: `cli-tool` / `minimal` explicitly omit change-manager (use `full` or `web-app` for brownfield).
- **behavior-boundaries.md**: Cross-links to comparison docs; README architecture diagram 12 Skills.

## [v1.20.0] - 2026-05-23
### Added
- **change-manager Skill**: Brownfield workflow for existing projects with `Product-Spec.md` — `changes/<name>/` with propose → apply → verify → archive; templates for proposal, specs, design, tasks; command `/change-manager`.
- **openspec-comparison.md**: Forge vs [OpenSpec](https://github.com/Fission-AI/OpenSpec) positioning, artifact mapping, and when to use `/change-manager`.
### Changed
- **12 Skills** (was 11): `change-manager` included in `full` and `web-app` loadouts; `CLAUDE.md` dispatch updated.
- README / README.zh-CN: What's New, workflow, install tree, repo structure, version badge; `llms.txt`, `DEV-PLAN.md`, `file-structure.md` aligned.

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
