# Behavior Boundaries

All actions are classified into three levels. This applies regardless of YOLO mode.

## 🟢 Green (Autonomous) — Execute without confirmation
- Variable naming, code style, type annotations
- Bug fixes where the fix is obvious
- Adding/updating tests
- Refactoring within the same module (no API change)
- Updating memory files and documentation
- Installing dev dependencies

## 🟡 Yellow (Confirm First) — Must get user approval before proceeding
- Adding or removing external dependencies
- Changing database schema or migration
- Modifying core business logic or data flow
- Changing project configuration (tsconfig, build config, env structure)
- Adding new pages or routes not in DEV-PLAN.md
- Changing component API (props, interface) used by other modules

## 🔴 Red (Forbidden Without Explicit Approval) — Must get explicit approval every time
- Deleting data or database tables
- Modifying production configuration or secrets
- Force pushing or destructive git operations
- Releasing or deploying to production
- Removing features that exist in Product-Spec.md
- Changing authentication or authorization logic

## YOLO Mode
In YOLO mode, 🟢 and 🟡 actions proceed automatically. 🔴 Red actions ALWAYS require confirmation, even in YOLO mode. There is no override for red boundaries.