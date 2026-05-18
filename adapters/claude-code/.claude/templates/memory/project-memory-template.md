---
name: project-memory-template
description: Long-term project memory. Stores architecture facts, technical constraints, known pitfalls, and dev environment details. Updated when facts change or new constraints are discovered.
---

# Project Memory

> Long-term memory — persists permanently. Updated when architecture facts change or new constraints are discovered.

## Architecture

- **Product type**: [Web / Desktop / CLI / Mobile]
- **Tech stack**: [framework + language + key dependencies]
- **Project structure**: [key directory layout, entry points]
- **Database**: [type + schema highlights, if any]

## Technical Constraints

- [Constraint 1 — e.g., "API calls must go server-side, no browser-exposed keys"]
- [Constraint 2 — e.g., "SQLite for local-only, no network database"]

## Known Pitfalls

- [Pitfall 1 — e.g., "Vite VITE_ vars are exposed to browser, never put API keys there"]
- [Pitfall 2 — e.g., "Tailwind purge removes unused classes — dynamic class names must use full strings"]

## Dev Environment

- **Node version**: [e.g., 20.x]
- **Package manager**: [pnpm / npm / yarn]
- **Build command**: [e.g., pnpm build]
- **Dev command**: [e.g., pnpm dev]
- **Test command**: [e.g., pnpm test]

## Key Dependencies

- [e.g., React 19.x]
- [e.g., Next.js 15.x]
- [e.g., Tailwind 4.x]

## Deployment

- **Target**: [e.g., Vercel / AWS / Docker / static export]
- **CI/CD**: [e.g., GitHub Actions]
- **Environment URLs**: [e.g., staging: xxx, production: xxx]

## Conventions

- **Naming**: [e.g., components PascalCase, files kebab-case]
- **Styling**: [e.g., Tailwind preferred, no custom CSS unless necessary]
- **State management**: [e.g., React Context + useReducer]
