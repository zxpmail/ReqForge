---
name: agents-template
description: Template for generating project AGENTS.md constraint files
---

<!-- forge: AGENTS.md template v1.0 -->
# Project Rules

> This file defines how AI agents behave in this project. It is a constraint file, not a prompt collection.

## Tech Stack

Pin all versions to exact patch. AI must use these versions — no guessing, no `latest`, no ranges.

```
<!-- Fill in your project's actual versions -->
Runtime: [language] [exact-version]
Framework: [framework] [exact-version]
Package Manager: [manager] [exact-version]
Database: [database] [exact-version]
```

## Behavior Boundaries

### Green (execute without confirmation)
- Variable naming, code style, tests, obvious bug fixes
- Documentation updates, dev dependency changes

### Yellow (confirm before proceeding)
- External dependencies, database schema changes
- Core business logic, new routes, API changes

### Red (always require explicit approval)
- Deleting data, force push, production configuration
- Authentication/authorization changes

## Project Structure

```
[Fill in your project structure]
```

Rule: AI-generated code must follow the above structure. Do not place files outside these directories without asking.

## Agent 执行纪律（任务级）

> 与 Forge 注入的 Iron Laws / HARD-GATE 叠加，不替代 Spec·Plan 确认与 Hook。完整说明：[session-execution-discipline.md](https://github.com/zxpmail/ReqForge/blob/main/core/docs/session-execution-discipline.md)

1. **先列计划，批准再动手** — 非琐碎任务先列步骤，用户明确批准后再改文件或跑破坏性命令。
2. **改之前先读** — 编辑任何文件前必须先读取该文件（及直接依赖）。
3. **别重复造轮子** — 尽量缩小改动范围；优先复用已有抽象与函数；禁止穿透重实现同一逻辑。
4. **不确定先说，不要猜** — 无先例则停下询问；不要自行发明需求。
5. **中途转向，先问再动** — 影响用户的改动前先确认；范围变化则重新制定计划。
6. **计划外的问题先报告** — 与当前任务无关的废弃代码或可疑行为只报告，不顺手修。
7. **改了什么必须汇报** — 提交前展示完整 diff（大改动用 stat + 关键摘要），获批准后再 commit。
8. **没跑过测试不算完成** — 宣布就绪前对改动相关包跑 lint、类型检查、能覆盖本次变更的测试。

## Hard Constraints

- Never delete code without asking
- Never restore deleted content without asking
- Never run force push
- Never hardcode secrets, API keys, or tokens in code
- Always use the specified package manager
- Always confirm the current branch before committing

## Context Preservation

Three memory files are maintained in `memory/`:
- `project-memory.md` — Architecture, constraints, known pitfalls
- `decisions-log.md` — ADR-format architectural decisions
- `task-history.md` — Recent task summaries (last 30)

Read all three at session start. Update after each task.

## Cross-Platform Hooks

This project may include platform-specific hook scripts:
- `.sh` — Linux/Mac
- `.bat` — Windows cmd
- `.ps1` — Windows PowerShell

Hooks fire automatically at key events (commit, edit, startup).
