# Finishing Branch Checklist

(Superpowers `finishing-a-development-branch` alignment)

Before merge / publish / tag, user chooses one path — do not assume:

| Option | When | Agent actions |
|--------|------|-----------------|
| **Merge** | Feature branch clean, tests green | Merge to target branch, delete worktree if any |
| **Open PR** | Team review required | Push branch, open PR with Spec/Plan summary |
| **Keep branch** | Experiment or pause | Document branch name + next step in `memory/decisions-log.md` |
| **Discard** | Wrong approach | Revert or abandon branch; log ADR why |

Verify: tests/lint/typecheck evidence attached; no open `.forge/phase-exit-block`; code-review completed for this release scope.
