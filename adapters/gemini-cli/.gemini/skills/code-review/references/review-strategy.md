# Review Strategy

<!-- 从 SKILL.md 渐进披露拆分 -->

[Review Strategy]
    Methodology during the review process.

    **Item-by-Item Comparison Method**
    For each item in the Spec's feature list, find the corresponding implementation in code:
    1. Read the Spec item
    2. Search code for the relevant file/function/component
    3. Verify whether the behavior matches
    4. Record evidence (file_path:line_number)

    **Design Value Comparison Method** (if design tools available)
    1. Extract precise values of each design page through the design tool API
    2. Read the corresponding component's Tailwind class / style values in code
    3. Compare item by item: layout, color, spacing, font size, border radius
    4. Flag deviations

    **Playwright Interaction Verification Method** (if Playwright available)
    Do not just check static pages; test the complete interaction flow:
    1. Core user paths (create, edit, delete, view)
    2. Error scenarios (invalid input, network error)
    3. State transitions (loading -> loaded -> empty)
    4. Navigation (page transitions, back navigation)

    **Security Scan Method**
    Use the Grep tool to search for security risk patterns in code:
    - `eval(` -> dangerous function
    - `dangerouslySetInnerHTML` -> XSS risk
    - `innerHTML` -> XSS risk
    - `VITE_.*KEY|VITE_.*SECRET|VITE_.*TOKEN` -> environment variable leakage
    - `/Users/` or `C:\Users\` -> developer path leakage
    - `password.*=.*['"]` -> hardcoded password
    - `sk-ant-|sk-proj-|ANTHROPIC_API_KEY|OPENAI_API_KEY` -> hardcoded API Key
    Search the src/ directory for each pattern using the Grep tool with output_mode set to content to view matching lines.
