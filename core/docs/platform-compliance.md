# Platform Compliance — GitHub & OSS

> **Scope**: **Repository maintainer policy** — CI, fork, secrets. Not Harness architecture or user-project runtime design.
> ReqForge is a **local Agent Harness** — it does not run a central service, store user secrets, or proxy third-party LLM APIs. Transparent policies for contributors and platform reviewers (GitHub Trust & Safety, automated classifiers).

Related: [harness-maturity-checklist.md](./harness-maturity-checklist.md) · [forge-smoke CI](../../.github/workflows/forge-smoke.yml)

---

| Concern | ReqForge stance |
|---------|-----------------|
| Central server | **No.** Skills/hooks/adapters copy into **your** project; execution stays in your AI client + your repo. |
| Collect user API keys | **No.** Keys live in your client, `.env`, or CI secrets you configure — never uploaded to ReqForge maintainers. |
| Proxy LLM / IDE vendors | **No.** Unlike reverse-proxy tooling, ReqForge does not relay inference traffic or bypass vendor quotas/ToS. |
| Auto-push to git remotes | **Off by default** (removed from default hooks/loadouts v1.20.3). Enable only if you explicitly want it. |
| Background jobs after chat | **Out of scope.** Schedules belong in **your application** (cron, queue), documented in Product-Spec — not in Forge hooks. |

---

## 2 · Data & privacy model

| Data | Where it lives | Who sees it |
|------|----------------|-------------|
| Product-Spec, code, memory | Your project repo | You + your git remote |
| `feedback/` lessons | Your project (if copied) | You |
| Forge framework source | This GitHub repo | Public (MIT) |
| `GITHUB_TOKEN` for `set-github-metadata` | Your `.env.local` (gitignored) | You only |

**Principle:** *原汤化原食* — install the harness locally; nothing phones home to ReqForge.

---

## 3 · GitHub Actions policy

ReqForge uses Actions **only for repository quality gates**, not for user-facing automation or LLM workloads.

### Allowed triggers

| Trigger | Use |
|---------|-----|
| `push` (with `paths` filters) | Run static checks when framework files change |
| `pull_request` (with `paths` filters) | Same on PRs |
| `workflow_dispatch` | Manual maintainer runs when needed |

### Forbidden without maintainer review + doc update

| Pattern | Why |
|---------|-----|
| `schedule:` / cron | High-frequency workflows trigger GitHub anti-abuse classifiers; no user value for a harness repo |
| Cron more often than **daily** | Same — see industry remediation from high-frequency fleet keepalive patterns |
| `repository_dispatch` loops | Risk of self-triggering storms |
| Workflows that **fork** or **dispatch** other users' repos at scale | Spam signal; not ReqForge's model |

### Current workflows

| File | Triggers | Purpose |
|------|----------|---------|
| `.github/workflows/forge-smoke.yml` | `push` + `pull_request` (path-filtered) | `pnpm forge-smoke` — static release gate |

**Adding a workflow:** update this table and ensure `forge-smoke` **`workflows-compliance`** smoke still passes.

---

## 4 · Fork, template, and distribution

| Activity | Intent |
|----------|--------|
| **Clone / fork** | Copy Harness into your workflow — normal OSS use |
| **`pnpm forge-install`** | Install adapters into a **single target project** you own |
| **Template repos** (if offered) | Starter projects with Forge pre-installed — one repo per product, not bulk generation |

**Not intended:** mass fork spam, automated repo creation farms, or README copy that mimics phishing/automation spam keywords.

---

## 5 · Secrets & contributor hygiene

- **Never commit** `.env`, `.env.local`, PATs, or production credentials.
- Use `.env.local.example` patterns for optional maintainer scripts (`GITHUB_TOKEN` for metadata sync only).
- Skills must not instruct agents to exfiltrate keys or bypass auth.
- `hallucination-gate` / `pre-commit-check` help block destructive git and missing-path writes — not a substitute for secret scanning; use GitHub secret scanning on your fork.

---

## 6 · Evolution & feedback (no silent rule push)

- `evolution-engine` proposes changes to **local** rules/skills; human confirms before apply.
- Proposals require **predicted effect** + **verify-by** (v1.22.1+).
- Evolution does **not** auto-commit or auto-push to remotes.

---

## 7 · If this repo or account is flagged

If GitHub (or another platform) applies a false-positive **spam / abuse** label:

1. **Pause** any scheduled or high-frequency automation immediately.
2. **Publish** a short remediation log (what triggered suspicion, what was disabled/changed) — see transparent OSS practice (e.g. public `ABUSE_REMEDIATION`-style docs in other projects).
3. **Soften** README language that looks like bulk automation ("one-click fleet", "cron every N minutes") unless accurate and necessary.
4. **Contact** GitHub Support with links to this doc + workflow YAML showing push/PR-only CI.
5. **Re-run** `pnpm forge-smoke` and link CI green runs as evidence of legitimate OSS maintenance.

---

## 8 · Compliance checklist (maintainers)

Before merging framework changes that touch CI or distribution:

- [ ] No new `schedule:` cron without explicit exception documented in §3
- [ ] `pnpm forge-smoke` green (includes `workflows-compliance`)
- [ ] No secrets in diff
- [ ] README does not promise centralized storage of user tokens
- [ ] New automation is **path-filtered** and **repo-scoped**

---

## Related

- [loadout-scenarios.md](./loadout-scenarios.md) — user-facing skill bundles (local only)
- [behavior-boundaries.md](./behavior-boundaries.md) — agent red/yellow/green actions in user projects
- [file-structure.md](./file-structure.md) — what ships to end users vs `core/` maintainer-only hooks (`check-sync`)
