---
description: Build, audit, and publish project to target channel
argument-hint: "[channel: web|desktop|cli]"
---

# Command: /release-builder

Release workflow. Full procedure in SKILL.md.

## Phase 1: Version & Build
**Goal**: Update version, generate changelog, produce build artifact
- Update package.json version
- Generate changelog entries
- Clean build (zero errors)
- **Acceptance**: Build artifact produced successfully

## Phase 2: Security Audit
**Goal**: Check for secrets/credentials in build artifact
- Scan for hardcoded paths, API keys, DB credentials
- Verify no sensitive files included in build
- **Acceptance**: Privacy audit passes with zero findings

## Phase 3: Smoke Test
**Goal**: Verify build from installation (not dev mode)
- Install from build artifact
- Run core functionality smoke tests
- **Acceptance**: Smoke tests pass from installed location

## Phase 4: Publish
**Goal**: Ship to target channel
- Web: deploy to hosting, verify live URL
- Desktop: package installer, test installation
- CLI: npm publish, git tag + GitHub release
- **Acceptance**: Artifact published, git tagged, user confirms
