# Workflow (Iteration Mode)

<!-- 从 SKILL.md 渐进披露拆分 -->

[Workflow (Iteration Mode)]

    **Trigger Condition**: User proposes new features, requirement changes, or iterative ideas during development

    **Core Principle**: Seamless integration, don't interrupt the user's workflow. No opening statements needed, just catch the user's requirement and start questioning.

    [Change Identification Phase]
        Goal: Understand what the user wants to change

        Step 1: Catch the requirement
            User says "I think there should also be a one-click AI recommendation feature"
            First WebSearch for related implementation approaches and best practices
            Then question directly: "One-click AI recommend what? Recommend to whom? Which page does this button go on? What happens when clicked?"

        Step 2: Determine change type
            According to [Iteration Mode - Questioning Depth Criteria], determine if this is a major, moderate, or minor change
            Decide questioning depth

    [Questioning and Refinement Phase]
        Goal: Keep asking until the Spec can be directly modified

        Step 1: Question according to depth
            Major change: ask until "how will this change affect the existing product" can be answered
            Moderate change: ask until "what specifically will it look like" can be answered
            Minor change: just confirm understanding is correct
            For uncertain technical solutions, WebSearch to confirm before giving advice

        Step 2: Give solutions when user is stuck
            User doesn't know how → WebSearch for approaches used by similar products
            Then give 2-3 options with pros/cons and reference cases
            After giving options, continue pressing them to choose, after choosing, continue pressing the next detail

        Step 3: Conflict detection
            Load the existing Product-Spec.md
            Check if the new requirement conflicts with existing content
            If conflict found → directly point out the conflict point + provide solutions + let the user choose

        **Criteria for Stopping Questioning**:
        - Can directly modify the Product Spec without needing to guess or assume
        - After modification, the user won't say "that's not what I meant"

    [Document Update Phase]
        Goal: Update Product Spec and record changes — route scoped work to change-manager

        Step 1: Route by change type (do not create `changes/` here)
            | Change type | Action |
            |-------------|--------|
            | **Major** (core flow, layout, new AI capability) | Edit Product-Spec.md in place + CHANGELOG |
            | **Moderate** (one scoped feature, single deliverable) | Invoke `/change-manager propose <kebab-name>` with interview answers; stop — change-manager owns `changes/` |
            | **Minor** (copy, options, style) | Small direct edits to Product-Spec.md + CHANGELOG |

        Step 2: Understand existing document structure
            Load the existing Spec file
            Identify its section structure (may differ from the template)
            Base subsequent modifications on the existing structure, don't force-fit the template

        Step 3: Directly modify the source file
            Modify the existing Spec directly
            Keep the overall document structure unchanged
            Only modify the parts that need changing

        Step 4: Update AI capability requirements
            If new AI features are involved:
            - Add new capability types in the "AI Capability Requirements" section
            - Describe the purpose of the new capabilities

        Step 5: Automatically append changelog
            Append this change to Product-Spec-CHANGELOG.md
            If the CHANGELOG file doesn't exist, create one
            When recording Product Spec iteration changes, load templates/changelog-template.md for the complete changelog format and examples
            Automatically generate change descriptions based on conversation content

        Step 6: Final Validation
            Goal: Verify the updated spec is clean and consistent.
            **Must run at least 3 full scan→fix cycles** — iteration mode also suffers from single-pass blind spots.

            Iterative cleanup loop (minimum 3 cycles):
            1. **Full Spec re-read**: Re-read the complete Product Spec from scratch each cycle.
               Do not rely on incremental diffs — they accumulate blind spots, especially for cross-section conflicts introduced by the update.

            2. **Scan**: Perform a focused review of the updated Product Spec
               - Check that new requirements don't conflict with existing requirements
               - Find redundant descriptions carried over from original
               - Verify all new changes are clearly articulated without vagueness
               - Confirm the overall structure remains coherent

            3. **Auto-fix**:
               - Redundancy: Automatically remove duplicates
               - Simple contradictions: Auto-resolve if obvious
               - Structural issues: Auto-adjust to maintain coherence
               - Do not auto-fix vagueness or scope changes — these require user input

            4. **Cycle counter**: Track explicit cycle number (1/3, 2/3, 3/3).
               - If cycle < 3 AND any auto-fix was applied → go to Step 1 (next cycle)
               - If cycle >= 3 AND no more auto-fixes possible → proceed to Present
               - If cycle >= 3 but still finding auto-fixable issues → continue until clean

            5. **Present**: When done with auto-cleanup (minimum 3 cycles completed), present remaining issues to user
               Only after user confirms all issues are resolved can you conclude.
               On confirm: update `Product-Spec.md` and refresh `.forge/spec-confirmed.json` (same format as [Machine Gate Markers]).

        Step 7: Archive
            If this iteration used `/change-manager`, archive is `/change-manager archive <name>` — not dev-builder.
            If only Product-Spec.md was edited in place (major/minor), no `changes/` folder — skip archive.

    [Iteration Mode - Questioning Depth Criteria]
        **Change Type Determination Logic** (check in order):
        1. Involves new AI capability? -> Major
        2. Involves core user path changes? -> Major
        3. Involves layout structure (columns, area divisions)? -> Major
        4. Adds major feature module? -> Major
        5. Involves new feature but doesn't change core flow? -> Moderate
        6. Involves logic adjustment of existing features? -> Moderate
        7. Local layout adjustment? -> Moderate
        8. Just text, options, or style changes? -> Minor

        **Questioning Standards by Type**:

        | Change Type | Conditions for Stopping Questioning | Must Clarify |
        |------------|-------------------------------------|--------------|
        | **Major** | Stop when "how will this change affect the existing product" can be answered | Why is it needed? Which existing features are affected? How does the user flow change? What new AI capabilities are needed? |
        | **Moderate** | Stop when "what exactly will it look like" can be answered | What to change? Change to what? How does it integrate with existing features? |
        | **Minor** | Stop when understanding is confirmed correct | What to change? Change to what? |
