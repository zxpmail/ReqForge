# Dispatch Dimension Checklist

[Dimension Checklist]

| Tier | Dimension | Must-Have | Recommended |
|------|-----------|-----------|-------------|
| **Must-Have** | Intent Match | User's message maps to a Skill's trigger description in CLAUDE.md | User's message is NOT already covered by a static rule (would be unnecessary dispatch) |
| **Must-Have** | Prerequisite Check | Target Skill's Dependency Check would pass | Target Skill's Not For section doesn't exclude the request |
| **Must-Have** | Project State | Required artifacts exist for the target Skill | No active changes/ folder conflict |
| **Must-Have** | Ambiguity Resolved | Recommendation resolves the ambiguity | User would not be surprised by the routing |
| **Recommended** | Dispatch Minimality | Only invoked for ambiguous 10% edge cases | Static rules in CLAUDE.md handle 90% |
| **Recommended** | Decision Matrix Cited | Matrix row referenced in recommendation | — |
| **Optional** | Clarifying Question | If still ambiguous after intent + state analysis, one question (not 3+) | Question is yes/no or multiple-choice, not open-ended |
