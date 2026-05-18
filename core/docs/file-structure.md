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
├── changes/                           # Change artifacts (proposal/specs/design/tasks per iteration)
│   └── archive/                       # Archived implemented changes
├── <project-name>/                    # Project code (subfolder named after project)
│   ├── src/
│   ├── package.json
│   └── ...
├── .gitignore
└── .claude/
    ├── CLAUDE.md                      # Control file (this file)
    ├── agents/
    │   ├── implementer.md             # Implementer Sub-Agent
    │   ├── code-reviewer.md           # Reviewer Sub-Agent
    │   ├── feedback-observer.md       # Feedback observer Sub-Agent
    │   └── evolution-runner.md        # Evolution engine Sub-Agent
    ├── EVOLUTION.md                   # Evolution engine
    ├── feedback/                      # Lessons learned
    └── skills/
        ├── product-spec-builder/      # Requirements gathering
        ├── design-brief-builder/      # Design brief
        ├── design-maker/              # Design mockups
        ├── dev-planner/               # Development planning
        ├── dev-builder/               # Implementation
        ├── bug-fixer/                 # Bug fixing
        ├── code-review/               # Code review
        ├── release-builder/           # Build & release
        ├── skill-builder/             # Create new Skill
        ├── feedback-writer/           # Record user feedback
        └── evolution-engine/          # Evolution engine scanning
```