# Analysis Strategies

[Analysis Strategy]
    **Dependency Graph Construction**
    Starting from the Spec's feature list, build dependency relationships between features:
    1. List all feature points
    2. For each feature ask: can it run independently? What other features or infrastructure does it depend on?
    3. Build a directed acyclic graph (DAG)
    4. Topological sort to get Phase order
    Infrastructure (project skeleton, database initialization, routing framework) is always the root node of the DAG.

    **Onion Peeling Method (Inside Out)**
    If features have no strong dependency relationships, sort by "user-perceived value":
    1. Core features (product would not exist without it) -> build first
    2. Important features (makes it good to have) -> build in the middle
    3. Auxiliary features (icing on the cake) -> build last
    4. Finishing touches (i18n, packaging, deployment) -> build last

    **Granularity Calibration**
    Check whether each Phase's granularity is reasonable:
    - Too large signals: delivery checklist exceeds 5 items, key files exceed 10, involves 3+ unrelated features
    - Too small signals: delivery checklist has only 1 very simple item, key files are only 1-2
    - Appropriate signals: delivery checklist 2-4 items, key files 3-8, features have internal cohesion
    - **Task time test**: Estimate the coding time for the largest single Task in this Phase. If it exceeds 15 minutes, the Phase is too coarse — split the oversized Task into its own Phase or break it into smaller Tasks

    **Risk-First Method**
    Identify the highest technical risk parts of the project (new frameworks, complex integrations, uncertain APIs), schedule them in early Phases:
    - Unused framework -> validate in the skeleton Phase
    - Critical third-party API -> do integration validation in early Phase
    - Performance-sensitive features -> consider during implementation, don't leave optimization for last

    **WebSearch Validation**
    For each key decision in technology selection, perform a search validation:
    1. Framework + "latest stable version" + year
    2. Framework A + Framework B + "compatibility" or "integration"
    3. Specific package name + "known issues" or "breaking changes"
    4. Project type + "recommended stack" + year
    Validation results affect the tech stack table and Phase arrangement.

    **Context7 Library IDs** (when user has Context7 MCP or `ctx7` CLI):
    - For each major third-party dependency in the Tech Stack table, resolve and record **Context7 Library ID** (`/org/project`) in DEV-PLAN.md
    - Use `resolve-library-id` with the planned version in the query when version-specific docs matter
    - If Context7 is unavailable, leave ID as `—` and rely on WebSearch; see [context7-comparison](https://github.com/zxpmail/ReqForge/blob/main/core/docs/context7-comparison.md)

    **Confirmation Strategy**
    dev-planner does not require extensive conversation like product-spec-builder. Only confirm with the user in the following situations:
    - When there are multiple reasonable tech stack options -> present 2-3 options for the user to choose
    - Phase granularity preference -> "Do you prefer coarse-grained (6-8 Phases) or fine-grained (10-15 Phases)?"
    - When feature priority is ambiguous -> "Should we do A first or B first?"
    - Beyond these cases, the Spec is clear enough — no need to keep questioning the user

    **Parallel Codebase Exploration** (when existing code is present):
    When scanning existing code in iteration mode or when the project already has code, use parallel exploration for efficiency:

    1. **Split exploration scope** into independent dimensions:
       - Routes/Pages: map all pages and API routes
       - Data layer: schemas, models, migrations, storage
       - Components: UI component tree, shared components
       - Services: external API integrations, business logic modules
       - Configuration: project config, dependency versions, build setup

    2. **Dispatch parallel sub-agents** (one per dimension) each with:
       - A focused prompt: "Explore [dimension] in [project]. List all files, their responsibilities, and key patterns."
       - A strict output format: file path → responsibility → key exports/interfaces

    3. **Merge results**: Combine all exploration outputs into a unified code map
    4. **Annotate constraints**: Flag patterns that the plan must respect (existing conventions, architectural decisions)

    This avoids the slow sequential "read one file at a time" approach and provides a comprehensive codebase picture in a single parallel pass.
