# Release Checklist

Items common to all project types.

## Version Management

- Confirm package.json version field is updated (semver)
- Confirm CHANGELOG is updated (if it exists)
- Working directory is clean (git status has no uncommitted changes)

## Build Verification

- Build command completes with zero errors
- Artifact files exist and are of reasonable size; investigate if suspiciously large

## Privacy Audit (absolute baseline)

First determine the build output directory (varies by project):
- Next.js → `.next/` or `out/`
- Vite → `dist/`
- Electron → `release/` or `out/` or `dist/mac/`
- CLI → `dist/` or `build/`

Then execute checks on the build output directory:
- No personal paths (macOS/Windows/Linux developer paths)
- No database files: `find [BUILD_DIR]/ -name "*.db" -o -name "*.db-shm" -o -name "*.db-wal"`
- No environment variable files: `find [BUILD_DIR]/ -name ".env*"`
- No credential files: `find [BUILD_DIR]/ -name "credentials*" -o -name "*.pem" -o -name "*.key"`
- No user data: `find [BUILD_DIR]/ -name ".forge-data" -o -name "workspaces"`
- No hardcoded credentials: `grep -rn "sk-ant-\|sk-proj-\|ANTHROPIC_API_KEY\|OPENAI_API_KEY\|password.*=.*['\"]" [BUILD_DIR]/`

If any item is found → stop immediately, fix, then rebuild.

Developer paths:
- macOS/Linux → `grep -rn "/Users/" [BUILD_DIR]/`
- Windows → `grep -rn "C:\\Users\\" [BUILD_DIR]/`

## Dependency Integrity

- npm audit has no critical vulnerabilities
- Build process has no MODULE_NOT_FOUND errors

## Git Check

- git author does not expose personal information
- .gitignore covers all data files (.env*, *.db, .forge-data/)
