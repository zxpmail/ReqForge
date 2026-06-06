# YOLO Mode（bug-fixer）

When `FORGE_MODE=yolo`, 🟢 Green and 🟡 Yellow actions proceed automatically. 🔴 Red actions ALWAYS require user confirmation.

**Completion Phase** → Auto-commit with `fix:` prefix, write `changes/fix-report.md`:
Root cause, fix description, verification evidence, regression results.

Proceed unless fix involves 🔴 Red action (production config, auth logic, data deletion) — then user confirm still required.
