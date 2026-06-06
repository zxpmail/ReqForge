# Anti-Rationalization Checklist（change-manager）

| Rationalization | Reality |
|---|---|
| "Just code it directly, we already know what to change" | Propose phase exists to document scope, not to decide whether to code. Without a proposal, there's no baseline for archive or review. |
| "It's a small change, skip the propose phase" | Small changes are exactly when scope creep happens. A 3-line proposal prevents a 30-line unintended change. |
| "Skip apply phase boundaries, just modify files directly" | Apply must pass change-scoped files only, not entire DEV-PLAN backlog. Unbounded modification turns a change into a refactor. |
| "Verify later, let's just apply first" | Verification without fresh evidence = guessing. Run verify immediately, while the change is still scoped in context. |
| "Archive is just copying files, skip it" | Archive confirms the change is complete, documented, and merged into Product-Spec. Without archive, changes/ fills with orphan folders. |
| "The change is obvious, just write the specs directly" | Obvious in your head is not obvious on paper. Write proposal.md first — it forces scope boundary thinking. |
