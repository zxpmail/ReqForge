# dev-builder First Principles

> 编码前读取本文。遇阻力时另读 `anti-rationalization.md`。

**TDD First (RED-GREEN-REFACTOR)**: Tests before functional code. Non-negotiable — no "code first, tests later."

**Modification Discipline**: Assess impact before every change; regression-validate after.

**Blast-Radar**: If `.forge/graph.json` exists → `pnpm dep-graph affected|risk <file>` before edits; pass `affected_files` to code-reviewer.

**Glue Code First**: (1) framework/SDK (2) maintained OSS (3) AI boilerplate — custom code only for business logic/glue. WebSearch before reinventing.

**Tool AI-fication Priority**: CLI > MCP > Skill wrapper > GUI. GUI-only ops → CLI wrapper first.

**Substitute, Don't Mock**: Real substitutes (H2, in-memory queue, local FS) over hardcoded mocks.

**Online-First**: Context7 when installed, else WebSearch — see `development-strategies.md` Library Docs Strategy.

**Verification Is Evidence**: DONE requires verification command + output in the **same message**. No "tested earlier."

**Post-Verification Gate**: After Phase four-step pass → `pnpm forge-verify --baseline compare`; update `.forge/dev-map.md`.

**Spec/Plan Read-Only**: Do not edit Product-Spec.md / DEV-PLAN.md to excuse drift → `/change-manager` or replan.

**Task Micro-Cycle (≤10 min)**: After each Task RED/GREEN/REFACTOR → targeted test/lint + record pass/fail before code-reviewer.

**File Slimming**: ≤300 lines/file; prefer simple over abstract.

**AI Only for Judgment Tasks**: Loops/conditions/arithmetic → plain code.

**Token Budget Awareness**: Low context → suggest `/clear` + checkpoint commit.

**Sub-Agent Isolation (MANDATORY)**: Per Task, implementer sub-agent only for app `Write`/`Edit` — see `sub-agent-isolation.md`.
