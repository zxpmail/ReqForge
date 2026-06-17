/**
 * cold-start.mjs — Curated default library recommendations per language.
 *
 * Used when no cache file exists yet (first-time / search-on-miss).
 * Each language has ~10-12 entries across common categories.
 *
 * This module is imported by search.mjs and forge-ecosystem.mjs.
 * It does NOT depend on any other module in this package.
 */

/**
 * @typedef {Object} LibEntry
 * @property {string} name — Library name (npm/crate/pip package)
 * @property {string} description — One-line what it does
 * @property {string} [npm] — npm/pip/crate package name (defaults to name)
 * @property {string} [homepage] — URL
 */

/**
 * @typedef {Object} LanguageData
 * @property {string} language
 * @property {Record<string, LibEntry[]>} entries — keyed by category
 */

/** @type {Record<string, LanguageData>} */
const COLD_START = {
  typescript: {
    language: "typescript",
    entries: {
      testing: [
        { name: "vitest", description: "Next-gen testing framework (Jest-compatible API, faster)", npm: "vitest", homepage: "https://vitest.dev" },
        { name: "playwright", description: "Cross-browser E2E testing", npm: "playwright", homepage: "https://playwright.dev" },
      ],
      http: [
        { name: "ofetch", description: "Better fetch API with timeout/retry/interceptors", npm: "ofetch", homepage: "https://github.com/unjs/ofetch" },
        { name: "hono", description: "Ultralight web framework (Edge/Fastly/Cloudflare)", npm: "hono", homepage: "https://hono.dev" },
      ],
      cli: [
        { name: "commander", description: "CLI argument parsing framework", npm: "commander", homepage: "https://github.com/tj/commander.js" },
        { name: "clack", description: "Interactive CLI prompts (spinners, selects, confirms)", npm: "@clack/prompts", homepage: "https://clack.cc" },
        { name: "consola", description: "Elegant CLI logger with multiple reporters", npm: "consola", homepage: "https://github.com/unjs/consola" },
      ],
      date: [
        { name: "date-fns", description: "Modern date utility library (tree-shakeable)", npm: "date-fns", homepage: "https://date-fns.org" },
      ],
      validation: [
        { name: "zod", description: "TypeScript-first schema validation with inferred types", npm: "zod", homepage: "https://zod.dev" },
      ],
      db: [
        { name: "drizzle-orm", description: "Lightweight TypeScript ORM with SQL-like syntax", npm: "drizzle-orm", homepage: "https://orm.drizzle.team" },
        { name: "prisma", description: "Next-gen ORM with migrations and type-safe queries", npm: "prisma", homepage: "https://www.prisma.io" },
      ],
      config: [
        { name: "c12", description: "Universal config loader (file/env/CLI merge)", npm: "c12", homepage: "https://github.com/unjs/c12" },
      ],
    },
  },

  python: {
    language: "python",
    entries: {
      testing: [
        { name: "pytest", description: "Mature testing framework with fixtures and plugins", npm: "pytest", homepage: "https://docs.pytest.org" },
      ],
      http: [
        { name: "httpx", description: "Modern HTTP client with async support", npm: "httpx", homepage: "https://www.python-httpx.org" },
        { name: "fastapi", description: "High-performance web framework with auto OpenAPI docs", npm: "fastapi", homepage: "https://fastapi.tiangolo.com" },
      ],
      cli: [
        { name: "click", description: "CLI framework with composable commands", npm: "click", homepage: "https://click.palletsprojects.com" },
        { name: "typer", description: "CLI builder based on Python type hints (wraps click)", npm: "typer", homepage: "https://typer.tiangolo.com" },
      ],
      validation: [
        { name: "pydantic", description: "Data validation using Python type hints", npm: "pydantic", homepage: "https://docs.pydantic.dev" },
      ],
      db: [
        { name: "sqlalchemy", description: "SQL toolkit and ORM", npm: "sqlalchemy", homepage: "https://www.sqlalchemy.org" },
        { name: "alembic", description: "Database migration tool (works with SQLAlchemy)", npm: "alembic", homepage: "https://alembic.sqlalchemy.org" },
      ],
      logging: [
        { name: "structlog", description: "Structured logging with JSON output", npm: "structlog", homepage: "https://www.structlog.org" },
      ],
      config: [
        { name: "pydantic-settings", description: "Settings management with .env support", npm: "pydantic-settings", homepage: "https://docs.pydantic.dev/latest/concepts/pydantic_settings" },
      ],
    },
  },

  go: {
    language: "go",
    entries: {
      testing: [
        { name: "testing", description: "Go standard library testing package", npm: "std", homepage: "https://pkg.go.dev/testing" },
        { name: "httptest", description: "Go standard library HTTP testing utilities", npm: "std", homepage: "https://pkg.go.dev/net/http/httptest" },
      ],
      http: [
        { name: "chi", description: "Lightweight, idiomatic HTTP router", npm: "github.com/go-chi/chi/v5", homepage: "https://github.com/go-chi/chi" },
        { name: "gin", description: "High-performance HTTP web framework", npm: "github.com/gin-gonic/gin", homepage: "https://gin-gonic.com" },
      ],
      cli: [
        { name: "cobra", description: "CLI framework with subcommands and flags", npm: "github.com/spf13/cobra", homepage: "https://github.com/spf13/cobra" },
      ],
      db: [
        { name: "sqlx", description: "Database/sql extension with struct scanning", npm: "github.com/jmoiron/sqlx", homepage: "https://github.com/jmoiron/sqlx" },
        { name: "pgx", description: "PostgreSQL driver and toolkit", npm: "github.com/jackc/pgx/v5", homepage: "https://github.com/jackc/pgx" },
      ],
      logging: [
        { name: "zap", description: "Blazing fast structured logger", npm: "go.uber.org/zap", homepage: "https://github.com/uber-go/zap" },
      ],
      config: [
        { name: "viper", description: "Configuration solution with env/file/remote support", npm: "github.com/spf13/viper", homepage: "https://github.com/spf13/viper" },
      ],
    },
  },

  rust: {
    language: "rust",
    entries: {
      testing: [
        { name: "cargo-test", description: "Rust's built-in test framework with cargo integration", npm: "std", homepage: "https://doc.rust-lang.org/cargo/commands/cargo-test.html" },
      ],
      http: [
        { name: "axum", description: "Ergonomic web framework built on tokio/tower", npm: "axum", homepage: "https://github.com/tokio-rs/axum" },
        { name: "actix-web", description: "High-performance actor-based web framework", npm: "actix-web", homepage: "https://actix.rs" },
        { name: "reqwest", description: "Ergonomic HTTP client with async support", npm: "reqwest", homepage: "https://github.com/seanmonstar/reqwest" },
      ],
      cli: [
        { name: "clap", description: "CLI argument parser with derive macro support", npm: "clap", homepage: "https://github.com/clap-rs/clap" },
      ],
      serialization: [
        { name: "serde", description: "Serialization/deserialization framework (JSON, YAML, etc.)", npm: "serde", homepage: "https://serde.rs" },
      ],
      runtime: [
        { name: "tokio", description: "Async runtime for networking and I/O", npm: "tokio", homepage: "https://tokio.rs" },
      ],
      db: [
        { name: "sqlx", description: "Type-safe SQL toolkit with compile-time query checking", npm: "sqlx", homepage: "https://github.com/launchbadge/sqlx" },
      ],
      logging: [
        { name: "tracing", description: "Structured diagnostics and logging framework", npm: "tracing", homepage: "https://github.com/tokio-rs/tracing" },
      ],
    },
  },

  java: {
    language: "java",
    entries: {
      testing: [
        { name: "junit5", description: "Standard testing framework (JUnit 5 / Jupiter)", npm: "org.junit.jupiter:junit-jupiter", homepage: "https://junit.org/junit5" },
        { name: "mockito", description: "Mocking framework for unit tests", npm: "org.mockito:mockito-core", homepage: "https://site.mockito.org" },
      ],
      http: [
        { name: "spring-boot", description: "Full-stack web framework with auto-configuration", npm: "org.springframework.boot:spring-boot-starter-web", homepage: "https://spring.io/projects/spring-boot" },
      ],
      db: [
        { name: "hibernate", description: "ORM with JPA implementation", npm: "org.hibernate.orm:hibernate-core", homepage: "https://hibernate.org" },
      ],
      build: [
        { name: "maven", description: "Build automation with declarative POM config", npm: "org.apache.maven:maven-core", homepage: "https://maven.apache.org" },
        { name: "gradle", description: "Build automation with Groovy/Kotlin DSL", npm: "org.gradle:gradle-core", homepage: "https://gradle.org" },
      ],
      logging: [
        { name: "logback", description: "Logging framework (SLF4J implementation)", npm: "ch.qos.logback:logback-classic", homepage: "https://logback.qos.ch" },
        { name: "slf4j", description: "Simple logging facade for Java", npm: "org.slf4j:slf4j-api", homepage: "https://www.slf4j.org" },
      ],
    },
  },
};

/**
 * Returns cold-start data for a given language.
 * @param {string} lang — lowercase language name (e.g. "typescript")
 * @returns {LanguageData|null}
 */
export function getColdStart(lang) {
  return COLD_START[lang] || null;
}

/**
 * Lists all languages that have cold-start data.
 * @returns {string[]}
 */
export function listSupportedLanguages() {
  return Object.keys(COLD_START);
}

/**
 * Returns the full cold-start data map.
 * Used by refresh to re-populate cache from scratch.
 * @returns {Record<string, LanguageData>}
 */
export function getAllColdStart() {
  return COLD_START;
}
