# Rollback Strategy

## Web

- Vercel: `vercel rollback` or dashboard previous deployment
- Netlify: restore previous deployment in dashboard
- Other: re-deploy previous build artifacts

## Desktop

- Cannot remotely roll back distributed installers
- Fix → repackage → bump version → re-release
- GitHub Release: delete bad release, upload new version

## CLI

- `npm deprecate [package]@[version] "known issue, please use [new-version]"`
- Severe: `npm unpublish [package]@[version]` (within 72 hours)
- After fix, bump version and re-publish
