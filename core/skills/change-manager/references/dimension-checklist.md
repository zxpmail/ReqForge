# Change-Manager Dimension Checklist

Evaluate every dimension before advancing through the change workflow (propose -> apply -> verify -> archive). Check off each item; log decisions in the change proposal and verification artifacts.

## Must-Have

- **Change scope boundaries**: explicitly define what is IN and OUT of this change. A scope statement must capture the feature boundary, affected files/modules, and explicitly excluded edge cases. Scope creep is the leading failure mode.
- **Backward compatibility**: does the change break existing consumers? Check API signatures (endpoints, method names, parameter shapes), database schemas (new columns must be nullable or have defaults), serialization formats, and save-file compatibility.
- **Testing coverage**: for every changed file, ensure there is a corresponding test update. New features need at least one happy-path and one error-path test. Verify that existing tests still pass before marking change complete. Aim for coverage of the delta, not the entire codebase.
- **Rollback plan**: define how to undo this change in production without data loss or downtime. Is it a simple revert, a feature-flag toggle, or a data migration rollback? The plan must be executable within minutes, not days.
- **Dependency impact**: trace the dependency graph of every changed module. A change in a low-level utility can ripple through the entire system. Use `dep-graph` if available.

## Recommended

- **Data migration needs**: if the change alters the data model, plan the migration (schema change, backfill, data transform) as a separate, reversible step. Test the migration against a copy of production data. Include a dry-run mode.
- **Config changes**: identify all configuration files, environment variables, and feature flags affected. Do not hardcode environment-specific values. Document each new config key with its type, default, and purpose.
- **API contract changes**: for public or inter-service APIs, check for breaking contract changes. Update OpenAPI/Swagger specs, GraphQL schemas, or protobuf definitions in the same change set. Version the API if the contract cannot be backward-compatible.
- **Monitoring / observability**: add or update metrics, logs, and alerts for the new behavior. A change without observability is a change you cannot debug. Define at least one success metric and one error metric.
- **Documentation needs**: update user-facing docs (README, help text, API docs) and internal docs (DEV-PLAN.md, architecture records, on-call runbooks) in the same PR. Outdated docs are worse than no docs.

## Optional

- **Security / auth implications**: does the change expose new attack surfaces? Review authentication, authorization, input sanitization, and rate limiting for any new endpoints or data flows.
- **Performance budget**: establish a baseline and measure. Does the change increase latency, memory, or bundle size? Set a budget and gate the change if exceeded.
- **SEO / accessibility (public web)**: for user-facing web changes, verify no regression in Lighthouse scores, semantic HTML structure, heading hierarchy, and keyboard navigation.
- **Localization / i18n**: if the change introduces new user-facing strings, ensure they go through the i18n pipeline. Do not hardcode display text. Plan for RTL layout if applicable.
- **Legal / compliance**: if the change touches PII, data retention, consent flows, or regulated logic (finance, healthcare), flag for legal review. Document compliance decisions in the change archive.
