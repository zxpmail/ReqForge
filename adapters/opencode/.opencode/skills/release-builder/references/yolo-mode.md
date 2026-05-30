# YOLO Mode

When `FORGE_MODE=yolo`, all user confirmation gates use defaults and write reports:

**Step 1 (Requirements Gathering)** → Skip questions. Auto-detect project type and use defaults:
- Package only (no publish)
- Web: Vercel deploy (if vercel.json exists)
- CLI: package only, no npm publish
- Desktop: package all platforms

**Step 2 (Version Confirmation)** → Use current version, do not ask.

**Step 5 (Installation Test)** → Skip desktop installation wait. Proceed to smoke test.

**Step 7 (Release Confirmation)** → Write `changes/release-report.md` with build, privacy audit, smoke results. Confirm release automatically. Write tag info to report file.
