# Anti-Rationalization Checklist（release-builder）

| Rationalization | Reality |
|---|---|
| "Compilation succeeded, so it's ready to ship" | Compilation ≠ functionality. Smoke test the core user flow before calling it shippable. |
| "No need for smoke test, the build passed" | Build passing means the build tool ran without errors. It says nothing about whether the product works. Run the binary or hit the URL. |
| "Skip privacy audit, it's a small project" | Small projects are the most likely to leak API keys, local paths, or credentials. Grep before packaging. |
| "Skip rollback plan, we won't need it" | The release you're most confident about is the one that will fail. Rollback plan is insurance, not pessimism. |
| "Skip dependency vulnerability scan, we just installed everything" | Fresh installs can pull vulnerable transitive dependencies. Scan regardless of install time. |
| "Works on my machine, no need to check environment parity" | "Works on my machine" is the leading cause of production incidents. Verify environment parity explicitly. |
| "Version bump is minor, no need for changelog or tag" | Every release needs an auditable version trail. Changelog + git tag + package.json must match. |
