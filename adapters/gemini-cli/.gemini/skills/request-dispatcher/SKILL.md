<!-- forge: request-dispatcher v1.0 -->
---
name: request-dispatcher
description: Used when the user's request is ambiguous and doesn't clearly match a single Skill's trigger criteria. Analyzes intent + project state to route to the correct Skill. Not a replacement for CLAUDE.md Skill Dispatch rules — only for edge cases where dispatch is uncertain.
version: 1.0.0
updated: 2026-05-26
requires: []
---

<!-- begin: task -->
[Task]
    Analyze ambiguous user requests and route them to the correct ReqForge Skill. When the main Agent's static dispatch rules (from CLAUDE.md [Skill Dispatch]) cannot uniquely determine the target Skill, this Skill provides a structured decision framework: classify intent → cross-reference project state → disambiguate → recommend Skill.

<!-- end: task -->
<!-- begin: not-for -->
[Not For]
    - Clear-cut requests that match a single Skill trigger -> use the target Skill directly
    - Writing code -> use /dev-builder instead
    - Bug fixing -> use /bug-fixer instead
    - Requirements gathering -> use /product-spec-builder instead

<!-- end: not-for -->
<!-- begin: dependency-check -->
[Dependency Check]
    Required:
    - User's natural language request -> the ambiguous message text
    - Project state awareness -> which artifacts exist (Product-Spec.md, DEV-PLAN.md, code, active changes/)

    Optional:
    - git log -> recent changes for context
    - memory/ files -> known pitfalls and recent task history

<!-- end: dependency-check -->
<!-- begin: first-principles -->
[First Principles]
    → `references/first-principles.md`
    核心：Minimum Dispatch / State Before Intent / Ask Don't Guess。

<!-- end: first-principles -->
<!-- begin: output-style -->
[Output Style]
    → `references/output-style.md`
    Tone: neutral, analytical, decisive. One recommendation, not a menu.

<!-- end: output-style -->
<!-- begin: file-structure -->
[File Structure]
    ```
    request-dispatcher/
    ├── SKILL.md
    └── references/
        ├── first-principles.md
        ├── output-style.md
        ├── workflow.md
        ├── dimension-checklist.md
        └── anti-rationalization.md
    ```

<!-- end: file-structure -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - **Dispatch recommendation** (screen output) — one-line Skill name + one-sentence justification

<!-- end: output-artifacts -->
<!-- begin: dispatch-dimension-checklist -->
[Dispatch Dimension Checklist]
    Before recommending a Skill, verify:

    | Dimension | Must-Have | Recommended |
    |-----------|-----------|-------------|
    | **Intent Match** | User's message maps to a Skill's trigger description in CLAUDE.md | User's message is NOT already covered by a static rule (would be unnecessary dispatch) |
    | **Prerequisite Check** | Target Skill's Dependency Check would pass | Target Skill's Not For section doesn't exclude the request |
    | **Project State** | Required artifacts exist for the target Skill | No active changes/ folder conflict |
    | **Ambiguity Resolved** | Recommendation resolves the ambiguity | User would not be surprised by the routing |

<!-- end: dispatch-dimension-checklist -->
<!-- begin: dispatch-decision-strategy -->
[Dispatch Decision Strategy]

    | User says... | Product-Spec.md exists? | Active changes/? | Code exists? | Route to |
    |---|---|---|---|---|
    | "I have an idea / build something" | No | — | — | /product-spec-builder |
    | "Add a feature / change something" | Yes | No | — | /change-manager propose |
    | "Add a feature / change something" | Yes | Yes | — | /change-manager (resume active) |
    | "This is broken / error / bug" | — | — | Yes | /bug-fixer |
    | "Review / check quality" | Yes | — | Yes | /code-review |
    | "Plan / how to build" | Yes | — | — | /dev-planner |
    | "Build / implement / code" | Yes | — | No | /dev-builder |
    | "Build / implement more" | Yes | — | Yes | /dev-builder |
    | "Design / make it look good" | Yes | — | — | /design-brief-builder → /design-maker |
    | "Release / deploy / ship" | — | — | Yes | /release-builder |
    | "Grill me / stress-test plan / 烤问" | — | — | — | /product-spec-builder → Light Grill Mode |
    | "Zoom out / explain this module" | — | — | Yes | /dev-builder → [Zoom-Out Pass] (read-only) |
    | "Architecture health / ball of mud" | — | — | Yes | /dev-planner → architecture-health-pass |
    | "Break into GitHub issues" | Yes | — | — | /dev-planner → optional issue slices (after plan confirm) |

    **Ambiguity patterns**:
    - "Improve this" (no target specified) -> ask: "Improve functionality (bug-fixer), quality (code-review), or UI (design skills)?"
    - "I don't like how this works" -> ask: "Is it a bug (wrong behavior) or a feature request (missing capability)?"
    - "Make it production-ready" -> ask: "Bug fixes first (bug-fixer), code quality (code-review), or release pipeline (release-builder)?"
    - User mentions both a bug and a feature -> route to the dominant intent first; fix bug before adding features

<!-- end: dispatch-decision-strategy -->
<!-- begin: gotchas -->
[Gotchas]
    **Premature dispatch**: "This looks like X, let me dispatch immediately." — Without completing the three-step analysis (intent → state → disambiguate), you may route to the wrong Skill. Always complete all three steps.
    **Prerequisite blindness**: Dispatching to /dev-planner without Product-Spec.md, or /code-review without code. — Always verify the target Skill's prerequisites before recommending. A recommendation that bounces is worse than a clarifying question.
    **Over-routing**: Using request-dispatcher for every request instead of just the ambiguous 10%. — The static rules in CLAUDE.md [Skill Dispatch] handle 90% of cases. Only invoke this Skill when the static rules don't clearly match.
    **Ignoring active changes/**: User asks for a new feature while changes/ folder is active. — Active changes/ must be resolved (verify + archive) before starting new work. Route to /change-manager for the active change, not a new Skill.

<!-- end: gotchas -->
<!-- begin: anti-rationalization-checklist -->
[Anti-Rationalization Checklist]
    → `references/anti-rationalization.md`
    遇 premature dispatch / prerequisite blindness 时读取。

<!-- end: anti-rationalization-checklist -->
<!-- begin: dimension-checklist -->
[Dimension Checklist]
    See [references/dimension-checklist.md](references/dimension-checklist.md) for the full dimension checklist.

    Must-have dimensions:
    - **Intent Match**: user message maps to a Skill's trigger description
    - **Prerequisite Check**: target Skill's Dependency Check would pass
    - **Project State**: required artifacts exist for the target Skill
    - **Ambiguity Resolved**: recommendation resolves the ambiguity

<!-- end: dimension-checklist -->
<!-- begin: quality-rubric -->
[Quality Rubric]
    8-item, 16-point scoring system. Ship threshold: **≥ 12** with no critical item scoring 0.

    | # | Dimension | Pts | Critical | Scoring |
    |---|-----------|-----|----------|---------|
    | 1 | Intent classification | 2 | YES | 2 = Correctly maps user message to intent type via matrix; 1 = Ambiguous but close; 0 = Wrong classification |
    | 2 | State cross-reference | 2 | YES | 2 = Checks artifact existence before recommending; 1 = Partial check; 0 = Skips state check |
    | 3 | Prerequisite verification | 2 | — | 2 = Target Skill's Dependency Check would pass; 1 = Prerequisite exists but unmet; 0 = Blind dispatch |
    | 4 | Ambiguity resolution | 2 | — | 2 = Disambiguates before dispatching when uncertain; 1 = Asks but with bias; 0 = Guesses without asking |
    | 5 | Dispatch minimality | 2 | YES | 2 = Only used for ambiguous 10%, not overriding static rules; 1 = Used when static rule sufficed; 0 = Routine over-routing |
    | 6 | Active change awareness | 2 | — | 2 = Checks active changes/ before recommending; 1 = Checks but ignores; 0 = No check |
    | 7 | Recommendation clarity | 2 | — | 2 = One Skill name + one-sentence justification; 1 = Multiple options without clarity; 0 = No clear recommendation |
    | 8 | Decision matrix usage | 2 | — | 2 = Cites matrix row when matched; 1 = Matrix used but not cited; 0 = Ignores decision matrix |

    **Scoring**: Run `pnpm validate-skill --score core/skills/request-dispatcher` to compute.
<!-- end: quality-rubric -->
<!-- begin: workflow -->
[Workflow]
    → `references/workflow.md`
    4 步流程：Classify → Cross-reference → Disambiguate → Recommend。

<!-- end: workflow -->
<!-- begin: initialization -->
[Initialization]
    Step 1: Execute [Workflow]
<!-- end: initialization -->
