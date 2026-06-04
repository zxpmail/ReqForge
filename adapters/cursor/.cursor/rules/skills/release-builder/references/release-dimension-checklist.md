# Release Dimension Checklist

## Must-Have

- **Build Artifact Integrity**: Verify that the build output is complete and uncorrupted. Compare checksums if available. Confirm the artifact installs or deploys without errors. No leftover source maps or debug symbols in production artifacts. Ensure build is reproducible from a clean checkout.

- **Environment Parity**: Confirm that the target environment (staging/production) matches the tested configuration. OS version, runtime version (Node, Python, Go, etc.), and system dependencies are aligned. No environment-specific conditionals that skip critical logic. Feature flags are set to production values.

- **Configuration/Secrets Management**: All secrets (API keys, tokens, passwords) are injected at deploy time — not baked into the artifact or image. Config validation runs at startup; missing config causes immediate failure with a clear message. Secrets are rotated per release cycle if they have expiry. Access to production secrets is audited and restricted.

- **Database Migration Readiness**: All pending migrations are reviewed and ordered. Migrations are backward-compatible (no destructive changes without dual-write phase). Rollback scripts exist and are tested. Migration execution is idempotent (safe to re-run). A dry-run or plan mode was executed against a staging DB copy.

- **Dependency Vulnerability Scan**: All runtime dependencies are scanned against known vulnerability databases (Snyk, npm audit, pip audit, trivy, etc.). No critical or high-severity unfixable vulnerabilities in production dependencies. Dev dependencies are excluded from the production artifact. Lockfiles (package-lock.json, yarn.lock, Poetry.lock, etc.) are up to date and committed.

- **Rollback Strategy**: The previous known-good version is deployable within minutes. A one-command rollback procedure is documented and tested. Database rollback scripts are verified. The rollback preserves data integrity — no data loss on revert. The rollback trigger (who decides, how they signal) is documented.

- **Smoke Test Plan**: The primary user flow works end-to-end (sign-up, login, core action, logout). Health check endpoints respond 200. Key API endpoints return expected status codes. The homepage or landing page renders without console errors. A quick data integrity check confirms no data corruption.

## Recommended

- **Changelog/Version Bump**: CHANGELOG.md is updated with the new release notes following keepachangelog format. The version in package.json (or equivalent) follows semver and matches the git tag. A git tag (vX.Y.Z) is created and pushed. Breaking changes are called out prominently in release notes.

- **API Backward Compatibility**: No removed or renamed fields in API responses without a deprecation cycle. Existing client contracts (OpenAPI spec, GraphQL schema, protobuf) remain valid. Deprecated fields still return data with a deprecation warning header. API version in the URL or header has not been incremented without coordination.

- **Monitoring/Alerting Setup**: Key metrics (request rate, error rate, p50/p99 latency) are being collected for this release. Alerts are configured for error rate spikes and service degradation. Dashboards reflect the new service versions and endpoints. Log aggregation is ingesting logs from the new deployment.

- **SSL/Certificate**: TLS certificates are valid and not expiring within 30 days. Certificate chain is complete and trusted by major browsers. HTTPS redirect is enforced at the load balancer or reverse proxy. HSTS headers are set appropriately. Certificate automation (Let's Encrypt / cert-manager) is operational.

## Optional

- **DNS/CDN**: DNS TTLs were lowered before deployment for quick rollover. CDN cache is purged or invalidated for updated assets. Custom domain / CNAME records point to the correct target. DNSSEC is enabled if applicable. Global propagation time is accounted for in the release window.

- **Load Testing Results**: A load test was executed against a staging environment at or above expected peak traffic. P99 latency stays under the SLO threshold under load. No memory leaks or OOM kills under sustained load. Auto-scaling rules trigger correctly at the expected threshold. Database connection pool does not saturate under peak load.
