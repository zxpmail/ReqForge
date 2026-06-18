# Workflow (Quick Mode)

<!-- Quick 路径专用 — 勿加载 workflow-0-to-1 / pm-frameworks / conversation-strategy 全文 -->

**Trigger**: User gives a one-sentence description or says they want to start fast.

**Goal**: Generate a minimal usable Product Spec in one round, with uncertain items marked `[待确认]` / `[TBD]`.

## Step 1: Capture

User provides a one-sentence project description (e.g., "A habit tracker app with AI coaching").

If the sentence is too vague to infer anything, ask **ONE** clarifying question. No more.

## Step 2: Infer everything

From the single sentence, infer:

- Product type (Web / Desktop / CLI / Mobile)
- Target users
- Core features (3-5 max, based on the description)
- User flow (one primary path)
- AI capability needs (if any)
- Recommended tech stack
- Integrations / notifications / scheduled jobs / observability (default "none at MVP" or `[待确认]` unless obvious from description)

WebSearch for similar products and typical tech stacks before inferring.

For anything uncertain, choose the simpler option and mark it `[待确认]`.

## Step 3: Generate minimal Spec

Load `templates/product-spec-template.md` for format.

Fill every section. Mark inferred items as `[待确认]` with a brief note on why it's uncertain.

Uncertain items default to the simpler option:

- Platform: default to Web
- Tech stack: default to Next.js + TypeScript + Tailwind
- AI: default to text generation (most common)
- Layout: provide a simple recommended layout

**Idea Stage Exit Criteria**: Fill all three questions — Quick Mode may use brief bullets + `[待确认]` on evidence; user must confirm before HARD-GATE lifts.

**Quick Mode Density Check** (lightweight): Before presenting the Spec, verify at least 1 substantive concern was identified during inference — something the model questioned or flagged as risky. If zero concerns found, force one re-examination: "What could go wrong with the inferred defaults?" This prevents the model from rubber-stamping its own assumptions without any critical scrutiny. Mark the concern in the Spec under `## Key Assumptions & Validation`.

## Step 4: Present and confirm

Present the Spec to the user with:

```
⚡ **Quick Spec generated!**

Items marked [待确认] are my best guesses — confirm or correct them.
You can invoke /product-spec-builder anytime to refine details through deep-dive questioning.
```

User confirms → save as `Product-Spec.md`.

**Machine gate marker (MANDATORY)**: Create `.forge/` if needed. Write `.forge/spec-confirmed.json` (`confirmed_at` ISO-8601, `spec_path`: `Product-Spec.md`). PreToolUse blocks app code until this file exists.

**Product size detection** (after Spec is confirmed):
Run `node scripts/forge-size-detect.mjs Product-Spec.md --write-gate-config`
This detects product scope and writes a recommended gate level to `.forge/gate-config.json`.
User may override by editing the file manually.

**HARD-GATE**: Only after this explicit confirm may `/dev-planner` or `/dev-builder` be invoked and app code under `src/`/`app/`/`lib/`/`packages/` be edited.

User wants changes → switch to 0-to-1 Mode questioning for the specific areas, not the whole thing.

## Step 5: Record decision

Create `memory/` directory if not exists. Create `memory/decisions-log.md` from template. Record ADR-000: "Quick mode — tech stack and architecture inferred from one-sentence description, defaults chosen for uncertain items."

Note: This creates only the decisions log. Full memory initialization (including `project-memory.md` and `task-history.md`) happens during the first `/dev-builder` invocation, when tech stack details are confirmed.
