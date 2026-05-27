# Debugging Rule Checklist

<!-- 从 SKILL.md 渐进披露拆分 -->

[Debugging Rule Checklist]

    [Evidence Collection Rules]
        - Full error message (do not truncate or omit stack trace)
        - Reproduction steps (user operation path, or trigger conditions)
        - Environment information (Node version, browser, OS — where relevant)
        - Recent code changes (git log, git diff — which commits may have introduced the problem)
        - Relevant logs (console output, network requests, database queries)
        - **Blast-radius** (if dep-graph is available): run `pnpm dep-graph affected <bug-file>` to find all files that depend on the buggy module — these are also at risk

    [Hypothesis Rules]
        - Maximum 3 hypotheses at a time, sorted by likelihood
        - Each hypothesis must have a corresponding verification method
        - Validate the most likely hypothesis first
        - Record the reason when a hypothesis is refuted; do not re-validate the same hypothesis

    [Fix Rules]
        - Change only one file / one logical point at a time
        - Assess impact scope before changing: if dep-graph is available, run `pnpm dep-graph affected <file>` and `pnpm dep-graph risk <file>` for data-driven impact assessment
        - Compile-verify after change (tsc --noEmit)
        - Function-verify after change (reproduction steps no longer trigger the bug)
        - Regression-verify after change (related existing functionality still works normally)

    [Process Management Rules]
        If the bug involves a running service (server, port occupation), first ensure the process environment is clean.
        Multiple instances are the root cause of many spooky bugs. Eliminate this possibility first, then debug.

        **Core Principle: Kill by port, not by process name**
        Regardless of language (Node / Java / Python / Go / C / Rust / .NET), kill whoever occupies the port.
        First determine the dev server port number based on project type (default 3000), then:

        **macOS / Linux**:
        ```bash
        kill -9 $(lsof -ti:3000) 2>/dev/null; sleep 2
        ```

        **Windows**:
        ```bash
        powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process \$_.OwningProcess -Force }" 2>/dev/null; sleep 2
        ```

        **Fallback when port kill fails**:
        If killing by port fails (port is free or `lsof`/`Get-NetTCPConnection` is unavailable), fall back to killing by process name based on project type:

        - Node.js project -> `taskkill /F /IM node.exe` / `pkill -f "node"`
        - Java project -> `taskkill /F /IM java.exe` / `pkill -f "java"`
        - Python project -> `taskkill /F /IM python.exe` / `pkill -f "python"`
        - Go project -> `taskkill /F /IM "go"` / `pkill -f "go"`
        - Hard to determine -> use `ps` / `tasklist` to list suspicious processes, ask user to confirm

    [Search Rules]
        The following scenarios require WebSearch:
        - Unfamiliar error message -> search the error message + framework name
        - Suspected third-party library bug -> search library name + version + known issues
        - Suspected framework version compatibility -> search framework + version + breaking changes
        - Fixed 3 times and still not working -> search with broader keywords; someone may have encountered the same pitfall
