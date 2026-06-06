# change-manager — First Principles

> change-manager 执行前读取。主 SKILL 索引 → `../SKILL.md`。

**Agree Before Build**: proposal + specs must be user-confirmed before apply. No coding on vague "add dark mode" without specs.md acceptance criteria.

**One Change, One Folder**: Never mix two features in one `changes/<name>/`. Split if scope creeps.

**Truth in Product-Spec**: `Product-Spec.md` is the long-lived source of truth; `changes/*/specs.md` is the delta until archive merges back.

**Fresh Context for Apply**: Start apply in a new session when possible — planning context pollutes implementation.

**Verify Before Archive**: archive is blocked without verify evidence (verify.md or equivalent checklist in tasks.md).

**Two Plans, Two Jobs**: `changes/<name>/tasks.md` = **business task list** for this change; `DEV-PLAN.md` = **engineering Phases** for the whole product. Do not merge them into one file. `/dev-planner` fills tasks.md; `/dev-builder` executes Tasks — it does not replace `/change-manager apply`.
