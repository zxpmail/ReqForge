# Development Strategies

<!-- 从 SKILL.md 渐进披露拆分；主流程见 ../SKILL.md -->

[Development Strategies]
    Methodologies during coding, use as needed.

    **Plan Mode Strategy**
    Before each Phase starts, must enter Plan Mode and list the TaskList. This is a prerequisite for coding and cannot be skipped.
    1. Read the Phase's delivery checklist and key files from DEV-PLAN.md
    2. Explore existing code structure, understand the current state
    3. Plan the specific implementation steps, clarify what to change first, what to change next, which files need to be created or modified
    4. Use TaskCreate to break implementation steps into specific Tasks — one Task per page, component, or feature
    5. Once the TaskList is ready, start coding directly — no need to wait for user confirmation

    Prohibited: writing code directly without a Plan and TaskList.
    Plan Mode is responsible for "how to implement this Phase"; DEV-PLAN.md is responsible for "which Phases to do".

    **Design Draft Reference Strategy**

    If design tool MCP is connected (e.g., Pencil, Figma, etc.), the following steps are **non-skippable**:

    **Before each feature development**:
    - Use the design tool API to read the exact values of all involved pages and variants (width, height, padding, gap, font size, font weight, color, border radius, shadow)
    - View the design draft visual effects
    - Reading once at Phase start is not enough — re-read before each Task, don't rely on memory

    **During coding**:
    - Implement component by component against the extracted values
    - When design draft conflicts with Design Brief, the design draft takes precedence

    **After each feature development**:
    - Read the actual values in code (Tailwind class / style), verify item by item against design values
    - View the design draft, confirm layout structure matches
    - Fix any deviations before committing
    - Ask the user to confirm the final visual result in the browser

    If no design tool (degraded mode):
    - Use Design-Brief.md as the primary reference
    - If no Design-Brief -> use Product-Spec.md text description as reference

    **Ecosystem Cache Strategy (Cache-First for Library Discovery)**
    Skip if `.forge/config` has `FORGE_ECOSYSTEM=off`. Otherwise, before any online search for library discovery, check the global ecosystem cache:
    1. Run `pnpm forge-ecosystem search <lang> "<category>"` (e.g. `forge-ecosystem search typescript "testing"`)
    2. If results found, read the cached entries to select a library
    3. On cache miss (no results or language not cached), run `pnpm forge-ecosystem refresh <lang>` to populate from curated defaults, then search again
    4. If still no match, fall through to Context7 or WebSearch for discovery
    5. Once selected, pin the library in `.forge/ecoresult.json`:
       ```json
       { "pins": [{ "language": "typescript", "name": "vitest" }] }
       ```
    Cache location: `~/.forge/ecosystem/<lang>.json` — auto-refreshes every 30 days.

    **Library Docs Strategy (Context7 — preferred for dependencies)**
    When Context7 MCP or `ctx7` CLI is available, use it **before** generic WebSearch for third-party library/API work:
    1. Read DEV-PLAN.md **Tech Stack** — if **Context7 Library ID** is set (e.g. `/vercel/next.js`), call `query-docs` with that ID and a task-specific `query`
    2. If only the package name is known → `resolve-library-id` (`libraryName` + `query`) → `query-docs`
    3. Align with pinned versions in DEV-PLAN / `package.json`; mention version in `query` when docs are version-sensitive
    4. If Context7 returns nothing or MCP is offline → fall back to **Online Search Strategy**; mark uncertain APIs `[待确认]` and log in `memory/decisions-log.md`

    See [context7-comparison](https://github.com/zxpmail/ReqForge/blob/main/core/docs/context7-comparison.md). ReqForge does not ship Context7 — user runs `npx ctx7 setup` in their environment.

    **Online Search Strategy**
    The following scenarios require WebSearch before coding (or when Context7 is unavailable):
    1. Using external libraries/APIs -> confirm current version usage and API signatures (prefer Context7 when installed)
    2. Whether SDK/framework has built-in functionality -> confirm before deciding whether to implement or use directly
    3. Encountering uncertain technical approaches -> search for best practices
    4. Unfamiliar error messages -> search for others' solutions
    5. Competitors, design trends, forum threads -> WebSearch only (not Context7's scope)

    **Tech Stack Selection Strategy** (used in initialization mode)
    Configure the project according to the DEV-PLAN.md tech stack table. If DEV-PLAN does not specify:
    - Web (frontend only) -> React + Vite + TypeScript + Tailwind
    - Web (full-stack) -> Next.js + TypeScript + Tailwind
    - Desktop -> Electron + Next.js + TypeScript + Tailwind
    - CLI -> Node.js + TypeScript + Commander
    - CLI Agent -> Node.js + TypeScript (refer to [CLI Agent Product] project structure)
    - Mobile -> React Native / Expo
    - Backend API -> FastAPI (Python) / Spring Boot (Java) / Gin (Go) / Actix (Rust)
    - Full-Stack (backend-focused) -> FastAPI + React / Spring Boot + React / Go + React
    After selection, WebSearch to verify framework versions and compatibility.
