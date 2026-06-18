## Critique Gate Summary (Group A — full disclosure)

### Hidden Assumptions
| ID | Assumption | Category | Confidence | Impact if wrong | Evidence |
|----|------------|----------|------------|-----------------|----------|
| CA1 | Users will call LLM APIs directly from the frontend without a backend proxy | tech | low | Browser CORS will block direct calls to OpenAI/Claude APIs; entire core workflow breaks | §架构决定: "用户在前端输入 API Key → 直接调用 LLM API（OpenAI / Claude）" |
| CA2 | Users possess and are willing to provide their own API keys | user | medium | Non-technical authors may not have API keys or know how to get them; adoption barrier undermines value proposition | §未解决假设: "用户输入自己的 API Key（OpenAI/Claude），不经过后端" |
| CA3 | AI can reliably generate coherent chapter outlines from character cards + genre tags | tech | medium | LLMs often generate inconsistent or generic outlines without detailed worldbuilding/plot constraints; users may need more iterations than expected | §核心功能: "AI 生成章节大纲 — 根据人物+题材生成" |
| CA4 | IndexedDB is adequate as primary storage for novel-length content (potentially hundreds of thousands of characters) | tech | medium | IndexedDB has size limits (browser-dependent), and no built-in export/recovery mechanism; data loss risk is high | §架构决定: "IndexedDB（结构化数据）+ localStorage（配置项）" |

### Unchallenged Decisions
| ID | Decision | Alternative | Risk if wrong | Evidence |
|----|----------|-------------|---------------|----------|
| CD1 | Pure frontend, no backend | (a) lightweight backend as API proxy + file storage; (b) Electron desktop app | High — CORS blocks direct browser calls to LLM APIs; without backend, API keys are exposed in client-side JS | §架构决定: "后端: 无。纯前端应用" |
| CD2 | Character relationships as table in v1 | (a) simple SVG/Canvas relationship graph (not D3); (b) relationship list inline with character card | Low-Medium — table may not adequately convey relationship structure, weakening the "AI generates relationship network" core value proposition | §架构决定: "v1 用表格 → v2 用 D3.js" |
| CD3 | JSON/Markdown export as sole backup mechanism in v1 | (a) automatic export to local filesystem; (b) cloud sync (Google Drive/网盘) | Medium — manual export means users will forget; data loss is a primary cause of novel project abandonment | §核心功能: "JSON/Markdown 导出；备份恢复" |

### Scope Cut Suggestions
| ID | Feature | Reason to cut | v1 impact | v2 path | Evidence |
|----|---------|---------------|-----------|---------|----------|
| CS1 | Data import (restore) | Import requires schema validation, conflict resolution, and migration logic — high risk/low value for v1; users can reconstruct from JSON manually | Low — v1 users unlikely to have existing data to import | Add schema versioning + import validation | §核心功能: "JSON/Markdown 导出；备份恢复" — "恢复" is bundled with "导出" but restore complexity is much higher |
| CS2 | Project deletion | Deletion is a destructive operation requiring confirmation UX, cascade delete of all characters/chapters, and potential undo logic — disproportionate risk/effort for a single-user tool | Very Low — users can ignore old projects; archiving is safer | Add archive with soft-delete | §核心功能: "创建/切换/删除作品" |
| CS3 | Multi-format export (Markdown + JSON) | Two formats means two serialization paths to maintain; JSON suffices for backup, Markdown for human reading — pick one for v1 | Low — one format covers primary use case (backup) | Add second format | §核心功能: "JSON/Markdown 导出" |

### Verdict
blocked

### Items requiring resolution
1. CA1/CD1 — CORS blocks pure-frontend LLM calls → must resolve before Spec generation. OpenAI and Claude APIs do not allow direct browser invocation. Options: (a) add minimal backend proxy, (b) build as Electron app, (c) use a CORS-supporting proxy service. Without this, the core workflow cannot run.
2. CA2 — API key availability → decide: is the target user limited to technically-savvy authors who already have API keys? If so, state explicitly in target users. If not, v1 needs an onboarding flow or alternative.
3. CA4 — IndexedDB for novel-length content → decide: verify IndexedDB size limits in target browsers, or confirm that manual JSON export is an acceptable data safety net. Mark as [TBD] in Spec or document the accepted tradeoff.
4. CS1 — Import vs Export → decide: does v1 need both import and export, or is export alone sufficient? Resolve in core features table.
