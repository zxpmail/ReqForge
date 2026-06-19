# Startup Check（模式路由）

<!-- 从 SKILL.md 渐进披露拆分 — Skill 启动时按序执行 -->

When the Skill starts, first execute the following checks:

## Step 1: Dependency Check

Execute [Dependency Check] in SKILL.md.

## Step 2: Scan project directory

Search for product requirements documents by priority:

- Priority 1 (exact match): `Product-Spec.md`
- Priority 2 (broad match): `*spec*.md`, `*prd*.md`, `*PRD*.md`, `*requirements*.md`, `*product*.md`

Matching rules:

- Found 1 file → use it directly
- Found multiple candidate files → list filenames and ask "which one do you want to modify?"
- Not found → enter 0-to-1 Mode

## Step 3: Determine Mode

| Trigger | Mode | Next read |
|---------|------|-----------|
| **distill** / **蒸馏** / **infer what I need** / **我不确定我想要什么** | **Distillation** | `references/distillation-mode.md` only |
| **grill me** / **stress-test** / **烤问** / **对齐计划** | **Light Grill** | `references/light-grill-mode.md` only |
| Product requirements document found | **Iteration** | `references/workflow-iteration.md` |
| Not found → ask: "Full deep-dive or quick start?" | | |
| User says quick / fast / just get going / one-sentence description | **Quick** | **`references/workflow-quick-mode.md` only** — do NOT load 0-to-1 interview chain |
| Otherwise | **0-to-1** | `references/workflow-0-to-1.md` + `references/conversation-strategy.md` as needed |

## Step 4: Execute corresponding workflow

- Distillation → [Workflow (Distillation Mode)]
- Light Grill → [Workflow (Light Grill Mode)]
- Quick → [Workflow (Quick Mode)]
- 0-to-1 → [Workflow (0-to-1 Mode)]
- Iteration → [Workflow (Iteration Mode)]
