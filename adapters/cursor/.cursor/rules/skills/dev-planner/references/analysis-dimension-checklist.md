# Analysis Dimension Checklist

[Analysis Dimension Checklist]
    When analyzing the Product Spec, the following dimensions must be covered (not necessarily in order, adjust flexibly based on project characteristics):

    **Must Analyze** (without these, DEV-PLAN is a castle in the air):

    - Technology stack determination: Extract the recommended tech stack from the Spec's Technical Direction section, WebSearch to verify framework versions, compatibility, and known issues. If the Spec only indicates a direction (e.g., "Web application") without a specific stack, recommend based on project type and confirm.
      - Confirm items: Framework + version number, UI solution, database solution, package manager, deployment target
      - WebSearch focus: Framework latest stable version, key dependency compatibility, community-recommended pairings
      - If multiple reasonable options exist -> present 2-3 options with pros/cons comparison, let the user choose

    - Phase breakdown: Decompose the Spec's functional requirements into an ordered sequence of Phases based on dependency relationships and complexity. Each Phase is an independently verifiable functional unit.
      - Breakdown basis: Feature dependency relationships (A depends on B -> B first), technical infrastructure first, core features before auxiliary features
      - Granularity standard: One Phase typically contains 1-3 core deliverables

    - Each Phase's delivery checklist: Each Phase must clearly define what is being delivered. Start with verbs, describe user-perceptible features.
      - Format: "User can do X -> System does Y" or "Complete X infrastructure setup"

    - Each Phase's key files: Each Phase must list the specific file paths to be created or modified.
      - For new projects: Infer directory structure from tech stack conventions (e.g., Next.js's src/app/api/, src/components/, etc.)
      - For existing projects: Scan existing code structure as the foundation

    - Feature dependency graph: Identify dependency relationships between features, ensure Phase ordering does not violate dependencies.
      - E.g.: Chat UI depends on message database -> database must come before chat UI
      - E.g.: IM Bridge depends on Agent engine -> Agent engine must come before IM

    **Try to Analyze** (with these, the Plan is more grounded):

    - Database design: If the project requires a database, list all data tables, their owning Phase, and purpose.
      - Format: Table name + Phase of first creation + purpose description

    - Each Phase's acceptance criteria: How to verify when each Phase is complete.
      - Minimum standard: Compiles, starts up, new features are usable
      - Recommended standard: Compiles + starts up + new features usable + existing features not broken

    - Known risks and limitations: Annotate expected technical risks or known limitations in specific Phases.
      - E.g.: "Phase 4 only implements the UI configuration interface; the actual IM connection engine is in Phase 10"

    **No Need to Analyze** (left for dev-builder to decide):
    - Specific code implementation details (function signatures, class interfaces)
    - Specific CSS styling approach
    - Test case design
    - Git branch strategy
