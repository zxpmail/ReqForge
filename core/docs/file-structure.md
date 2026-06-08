# File Structure

```
project/
├── Product-Spec.md                    # Product requirements document
├── Product-Spec-CHANGELOG.md          # Requirements change log
├── Design-Brief.md                    # Design brief document (optional)
├── DEV-PLAN.md                        # Phased development plan
├── memory/                            # Three-tier project memory
│   ├── project-memory.md             # Long-term: architecture, constraints, pitfalls
│   ├── decisions-log.md              # Mid-term: Architecture Decision Records
│   └── task-history.md               # Short-term: recent task summaries (max 30)
├── changes/                           # Change artifacts (/change-manager only; not product-spec-builder)
│   └── archive/                       # Archived implemented changes — see /change-manager
├── <project-name>/                    # Project code (subfolder named after project)
│   ├── src/
│   ├── package.json
│   └── ...
├── .gitignore
└── .claude/
    ├── CLAUDE.md                      # Control file (dispatch map)
    ├── settings.json                  # Hook registration (includes PreToolUse hallucination-gate)
    ├── agents/
    │   ├── implementer.md             # Implementer Sub-Agent
    │   ├── planner.md                 # Architecture + Phase splitting
    │   ├── code-reviewer.md           # Review aggregator (parallel dispatch)
    │   ├── code-reviewer-design.md    # Spec/UI compliance reviewer
    │   ├── code-reviewer-bug.md       # Bug pattern reviewer
    │   ├── code-reviewer-security.md  # Security reviewer
    │   ├── code-reviewer-types.md     # Type safety reviewer
    │   ├── feedback-observer.md       # Feedback observer Sub-Agent
    │   ├── evolution-runner.md        # Evolution engine Sub-Agent
    │   └── test-writer.md             # Test generation Sub-Agent
    ├── hooks/                         # Inspection layer scripts (.sh + .bat)
    ├── loadouts/                      # Reusable skill/agent/hook bundles — see loadout-scenarios.md
    ├── EVOLUTION.md                   # Evolution engine
    ├── feedback/                      # Lessons learned
    └── skills/
        ├── product-spec-builder/      # Requirements gathering
        │   └── commands/              # Phased command workflow (user-invokable skills)
        ├── change-manager/            # Brownfield change: propose → apply → verify → archive
        ├── design-brief-builder/      # Design brief
        ├── design-maker/              # Design mockups
        ├── dev-planner/               # Development planning
        ├── dev-builder/               # Implementation
        ├── bug-fixer/                 # Bug fixing
        ├── code-review/               # Code review
        ├── release-builder/           # Build & release
        ├── domain-mapper/             # Domain research → domain-map.md (orthogonal pipeline)
        ├── request-dispatcher/        # Ambiguous request routing
        ├── skill-builder/             # Create new Skill
        ├── feedback-writer/           # Record user feedback
        └── evolution-engine/          # Evolution engine scanning
```

**ReqForge self-development**: The framework repo also has `core/` (source of truth) and `adapters/` (client bundles). Run `pnpm sync` after editing `core/` to propagate to adapters. The `check-sync` hook exists only in `core/hooks/` for this workflow — it is not shipped to end-user projects.

**Loadout picker**: [loadout-scenarios.md](./loadout-scenarios.md) — which of `full` / `web-app` / `cli-tool` / `minimal` to use by scenario.

**Platform compliance**: [platform-compliance.md](./platform-compliance.md) — GitHub Actions (no cron), fork intent, no central user secrets.
