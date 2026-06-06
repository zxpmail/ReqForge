<!-- forge: evolution-engine v1.0 -->
---
name: evolution-engine
description: Auto-triggers on session init, or manually triggered when the user says "check if there are any rules to upgrade" or "check evolution suggestions". Called by the evolution-runner sub-agent.
version: 1.0.0
updated: 2026-05-26
requires: []
---

<!-- begin: task -->
[Task]
    Scan the accumulated data in ../../feedback/ and identify three types of evolution signals:
    1. Rule graduation: feedback repeats 3+ times -> propose upgrading to an official rule
    2. Skill optimization: feedback scores for a particular Skill are consistently low -> propose adjusting the Skill
    3. New Skill proposal: an operation pattern keeps recurring but no Skill covers it -> propose creating a new Skill

    Signals found -> Generate proposals and return to the main Agent; execute after user confirmation.
    No signals -> Return "no evolution suggestions".

<!-- end: task -->
<!-- begin: not-for -->
[Not For]
    - Recording individual feedback entries -> use /feedback-writer instead
    - Creating new Skills -> use /skill-builder instead
    - Fixing bugs or code issues -> use /bug-fixer or /code-review instead

<!-- end: not-for -->
<!-- begin: dependency-check -->
[Dependency Check]
    Automatically executed as the first step when the Skill starts.

    Required:
    - ../../feedback/FEEDBACK-INDEX.md → If missing, no feedback data exists; return "no evolution suggestions"
    - At least one feedback file with occurrences >= 1 → If no feedback files exist, there is nothing to evolve

    Optional:
    - memory/ files → cross-reference task-history.md to validate whether pattern is real or coincidence

<!-- end: dependency-check -->
<!-- begin: first-principles -->
[First Principles]
    **Data-Driven Evolution**: No change without data. A single feedback entry is an anecdote, not a signal. Wait for the 3-occurrence threshold before proposing rule graduation. Let the data speak, not your intuition.
    **Generator/Optimizer Recursion**: The evolution engine is itself subject to evolution. The feedback-observer generates data (α), the evolution-engine optimizes rules (Ω). This cycle should recursively improve itself — the engine that proposes rule changes should also be evaluable and improvable through the same feedback loop.
    **Minimum Lift**: Prefer rule graduation (changing existing rules) over creating new Skills. A 3-line rule addition to an existing SKILL.md is faster to deploy and easier to maintain than a new Skill directory. Only propose new Skills when the pattern genuinely doesn't fit existing ones.
    **Web-First**: When proposing a new Skill or rule, WebSearch for existing best practices and community patterns. Don't invent from scratch what already has a well-known solution.
    **Skill TDD Gate**: Every proposal MUST include RED observation (what the Agent did without the rule), GREEN change (exact target file/section), Predicted effect, and Verify by. Proposals missing RED or Verify by are **incomplete** — do not present them to the user.

<!-- end: first-principles -->
<!-- begin: proposal-quality-checklist -->
[Proposal Quality Checklist]
    Before presenting an evolution proposal to the user, verify each criterion:

    | Dimension | Must-Have | Recommended |
    |-----------|-----------|-------------|
    | **Data Support** | ≥3 feedback entries supporting the pattern | Cross-referenced against task-history.md to rule out false correlation |
    | **Root Cause** | failure_class identified (skill-defect / execution-lapse / unset) | Skill score trend (Precision/Coverage) attached |
    | **Proposed Change** | Specific SKILL.md section or rule text to add/change | Before/after diff example in proposal |
    | **Verify-By** | Observable, time-bounded criterion to confirm fix | Suggested timeout for re-evaluation |
    | **Priority** | RED (blocking) / GREEN (improvement) | Effort estimate (small/medium/large) |

    Reference: see [First Principles] Skill TDD Gate for minimum proposal completeness.

<!-- end: proposal-quality-checklist -->
<!-- begin: gotchas -->
[Gotchas]
    **Premature graduation**: One feedback entry does not make a pattern. The 3-occurrence threshold exists for a reason — graduating too early means bloating the main control file (CLAUDE.md / AGENTS.md / reqforge.mdc) with one-off issues. Wait for the data.
    **False correlation**: "Skill X has low scores AND the user complained about Y" → these may be unrelated. Check if the feedback actually names Skill X before proposing changes to it.
    **Ignoring sample size**: A skill used 100 times with 80% satisfaction is fine. A skill used 5 times with 60% satisfaction is noise. Always check the denominator before acting on a score.
    **Circular evolution**: Rule A graduates from feedback, then generates more feedback, then graduates again as Rule A'. This is the ratchet spinning without progress. After graduating a rule, skip that pattern for N cycles.

<!-- end: gotchas -->
<!-- begin: anti-rationalization-checklist -->
[Anti-Rationalization Checklist]
    → `references/anti-rationalization.md`
    遇 premature graduation / skipping cross-reference / skipping Verify-by 时读取。

<!-- end: anti-rationalization-checklist -->
<!-- begin: dimension-checklist -->
[Dimension Checklist]
    See [references/dimension-checklist.md](references/dimension-checklist.md) for the full dimension checklist.

    Must-have dimensions:
    - **Data Support**: ≥3 feedback entries supporting the pattern
    - **RED Observation**: specific Agent behavior cited
    - **GREEN Change**: exact target file + section named
    - **Verify-By**: observable, time-bounded criterion
    - **Failure Classification**: skill-defect / execution-lapse / unset

<!-- end: dimension-checklist -->
<!-- begin: quality-rubric -->
[Quality Rubric]
    8-item, 16-point scoring system. Ship threshold: **≥ 12** with no critical item scoring 0.

    | # | Dimension | Pts | Critical | Scoring |
    |---|-----------|-----|----------|---------|
    | 1 | Signal accuracy | 2 | YES | 2 = ≥3 occurrences threshold respected, no premature graduation; 1 = Threshold applied but edge case slipped; 0 = Proposal based on single entry |
    | 2 | RED observation quality | 2 | YES | 2 = Cites specific behavior with feedback excerpt; 1 = Generic description; 0 = Missing or "obvious problem" |
    | 3 | GREEN change specificity | 2 | — | 2 = Exact target file + section + text to add/change; 1 = Target file named but section vague; 0 = "Update the Skill" |
    | 4 | Verify-by criterion | 2 | YES | 2 = Observable, time-bounded, falsifiable; 1 = Vague ("should improve"); 0 = Missing |
    | 5 | False correlation check | 2 | — | 2 = Cross-referenced task-history to validate pattern; 1 = Checked but conflicting data; 0 = No cross-reference |
    | 6 | Denominator awareness | 2 | — | 2 = Usage count checked before acting on scores; 1 = Checked but ignored; 0 = Raw scores without context |
    | 7 | WebSearch integration | 2 | — | 2 = Searched for best practices before proposing; 1 = Relevant known patterns used; 0 = Invented from scratch |
    | 8 | Failure-class routing | 2 | — | 2 = skill-defect vs execution-lapse distinguished, proposal matches; 1 = Tagged but routing wrong; 0 = No routing |

    **Scoring**: Run `pnpm validate-skill --score core/skills/evolution-engine` to compute.
<!-- end: quality-rubric -->
<!-- begin: file-structure -->
[File Structure]
    ```
    evolution-engine/
    ├── SKILL.md                           # Main Skill definition (this file)
    └── references/
        ├── anti-rationalization.md
        └── dimension-checklist.md
    ```

<!-- end: file-structure -->
<!-- begin: output-style -->
[Output Style]
    **Tone**: Scientific analyst reporting pattern signals — data-driven, conservative, actionable. Proposals are suggestions, not commands.
    **Principles**:
    - V Every proposal cites occurrence count + source — no data, no proposal
    - V A single feedback entry is an anecdote, not a signal
    - V Always check denominator (total skill uses) before acting on scores
    - X No premature graduation — wait for 3+ occurrences

<!-- end: output-style -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - **Evolution proposals** (screen output) — three types: Rule Graduation / Skill Optimization / New Skill. Each proposal includes confirm/skip options.

<!-- end: output-artifacts -->
<!-- begin: workflow -->
[Workflow]

    Step 1: Scan Graduation Candidates
        Read ../../feedback/FEEDBACK-INDEX.md to locate all feedback files
        Read the frontmatter of each file
        Filter: occurrences >= 3 and graduated == false and skipped != true
        Determine graduation target:
        - source_skill is clear -> graduate to the corresponding SKILL.md
        - Involves multiple Skills or is global -> graduate to the main control file [General Rules]
        Cross-reference [Proposal Quality Checklist] Data Support dimension before proceeding.

        In addition to .claude/feedback/ files, also scan:
        - `.forge/trace/step-traces.jsonl` — step-level execution records from
          forge-loop runs. Look for entries where `attribution.failureClass` is set
          and the same failure pattern repeats across iterations. Treat repeated
          failure patterns (≥3 occurrences of same `step` + `failureClass`) as
          implicit feedback — they indicate Skill gaps exposed during automated
          execution.
        - When a feedback file exists AND step traces support the same pattern,
          cross-reference the trace's `attribution.reasoning` as additional evidence
          in the proposal's RED observation field.
        - If step traces reveal a failure pattern that has no corresponding feedback
          file, note this as "auto-detected from forge-loop traces" in the proposal.

    Step 2: Check Skill Optimization Signals
        Scan scores fields in feedback/, grouped by source_skill
        Trigger conditions (any one met):
        - A Skill has the same dimension scored <= 2 for 3 consecutive times
        - A Skill's average score on some dimension over the last 5 entries <= 3
        - Total feedback occurrences for a Skill >= 5

    Step 3: Check New Skill Signals
        Filter: occurrences >= 5 and not covered by any existing Skill
        -> Mark as "New Skill Candidate"

    Step 4: Generate Proposals
        Signals found -> Generate structured proposals (see [Proposal Format])
        For each candidate: read linked feedback `failure_class` (if set) to choose routing (see [Failure-Class Routing])
        Drop any candidate missing **RED observation** or **Verify by** — log internally as "incomplete signal", do not show to user
        No signals -> Return "no evolution suggestions"

<!-- end: workflow -->
<!-- begin: proposal-format -->
[Proposal Format]
    Each proposal MUST include the **Skill TDD quartet** plus falsifiable verification (AHE-style — see [agent-harness-seven-layer-map](https://github.com/zxpmail/ReqForge/blob/main/core/docs/agent-harness-seven-layer-map.md)):

    - **RED observation**: what the Agent did (or skipped) when the rule/skill was absent or ignored — cite feedback excerpt or session behavior, not intuition
    - **GREEN change**: exact target (`SKILL.md` section, hook, `forge-bootstrap.md`, `CLAUDE.md` rule) and the text to add or change
    - **Predicted effect**: which failure class should decrease (e.g. hallucinated paths, skipped tests, spec-before-code violations)
    - **Verify by**: how to check after applying (e.g. "re-run scenario X", "zero feedback with tag `skill-defect:spec-before-code` in next 5 runs", `pnpm test`, `grep SKILL for new rule`)

    "**Evolution Suggestions** (N total)

     **Rule Graduation** (X items)
     1. [feedback title]: occurred [N] times (source: [source_skill]; failure_class: [skill-defect | execution-lapse | unset])
        Suggest writing to: [target file] at [target location]
        Summary: [one sentence]
        RED observation: [...]
        GREEN change: [...]
        Predicted effect: [...]
        Verify by: [...]
        -- Confirm / Skip

     **Skill Optimization** (X items)
     1. [Skill name]: [N] related feedback entries accumulated
        Optimization suggestion: [specific suggestion]
        RED observation: [...]
        GREEN change: [...]
        Predicted effect: [...]
        Verify by: [...]
        -- Confirm / Skip

     **New Skill Proposal** (X items)
     1. [operation pattern description]: occurred [N] times
        RED observation: [...]
        GREEN change: [create skill via skill-builder — outline]
        Predicted effect: [...]
        Verify by: [...]
        -- Confirm Create / Skip"

<!-- end: proposal-format -->
<!-- begin: bounded-skill-edits -->
[Bounded Skill Edits] (SkillOpt-inspired — Skill Optimization proposals only)
    When **GREEN change** targets a user-project `SKILL.md` (not hooks / `CLAUDE.md` / bootstrap):

    1. **At most 3** structured edits per proposal; each op is exactly one of: `add` | `delete` | `replace`
    2. Each edit MUST state **which failure class** it fixes (link `failure_class` or RED observation)
    3. **Verify by** MUST include held-out or regression check — e.g. `pnpm skill-eval <skill-name>` on `split: held-out` cases, or a named Phase scenario
    4. If Verify by **fails** after user applied the edit → append to `.forge/skills/<name>/eval/rejected-edits.json` (do not re-propose the same edit without new evidence)
    5. Before presenting, answer: (a) which failure? (b) harm to existing behavior? (c) measurable improvement on held-out?

    Template: [evolution-bounded-edit-template.md](../../templates/evolution-bounded-edit-template.md) · Background: [skillopt-comparison.md](../../docs/skillopt-comparison.md)

<!-- end: bounded-skill-edits -->
<!-- begin: failure-class-routing -->
[Failure-Class Routing]
    Read `failure_class` from source feedback frontmatter when present:

    | Tag | Meaning | Prefer changing |
    |-----|---------|-----------------|
    | `skill-defect` | Skill text missing, wrong, or outdated | Target `SKILL.md`, `references/`, or rule graduation |
    | `execution-lapse` | Skill already covers behavior; Agent skipped or hooks failed | Bootstrap (`forge-bootstrap.md`), hook wiring, `CLAUDE.md` dispatch — **not** bloating Skill prose |
    | `unset` | Unknown — infer from feedback body; if ambiguous, ask user before Confirm |

    Mixed tags on one topic → split into two proposals if fixes differ (Skill vs hook).

<!-- end: failure-class-routing -->
<!-- begin: post-confirmation-execution -->
[Post-Confirmation Execution]
    User confirms or skips each item:
    - Rule graduation -> Write feedback content into the target SKILL.md or main control file, mark graduated: true
    - Skill optimization -> Modify the corresponding SKILL.md
    - New Skill -> Invoke skill-builder to create
    - Skip -> Mark skipped: true, do not propose again

    After apply: run the proposal's **Verify by** step and note pass/fail in the feedback topic or `memory/decisions-log.md`.
    If `failure_class` was `execution-lapse` and fix was hook/bootstrap-only, do **not** duplicate the same rule inside multiple Skills.

<!-- end: post-confirmation-execution -->
<!-- begin: yolo-mode -->
[YOLO Mode]
    When FORGE_MODE=yolo, proposals are written to file instead of waiting for confirm/skip:

    **Proposal Output** -> Write `changes/proposals.md`:
        Same fields as [Proposal Format] for every item: RED observation, GREEN change, Predicted effect, Verify by, failure_class when known.
        Omit proposals missing RED or Verify by. Skip per-item confirm/skip. Return to main Agent as:
        "N evolution proposals pending (see changes/proposals.md)"

<!-- end: yolo-mode -->
<!-- begin: return-format -->
[Return Format]
    Return to the main Agent:
    - Proposals exist: "N evolution suggestions pending" + full proposal content
    - No proposals: "No evolution suggestions"

<!-- end: return-format -->
<!-- begin: initialization -->
[Initialization]
    Step 1: Execute [Dependency Check]
    Step 2: Execute [Workflow]

<!-- end: initialization -->