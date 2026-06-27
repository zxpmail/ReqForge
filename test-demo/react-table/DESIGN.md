---
version: alpha
name: Sortable Users Table
description: Compact admin-style user list demo for ReqForge test-demo; light-first with system dark preference.
colors:
  background: "#ffffff"
  surface: "#f4f3ec"
  ink: "#08060d"
  muted: "#6b6375"
  border: "#e5e4e7"
  accent: "#aa3bff"
  accent-muted: "rgba(170, 59, 255, 0.1)"
typography:
  body:
    fontFamily: system-ui, Segoe UI, Roboto, sans-serif
    fontSize: 18px
    lineHeight: 1.45
  heading:
    fontFamily: system-ui, Segoe UI, Roboto, sans-serif
    fontSize: 56px
    fontWeight: 500
    lineHeight: 1.18
  table-header:
    fontFamily: system-ui, Segoe UI, Roboto, sans-serif
    fontSize: 14px
    fontWeight: 600
  mono:
    fontFamily: ui-monospace, Consolas, monospace
    fontSize: 15px
rounded:
  sm: 4px
spacing:
  sm: 8px
  md: 16px
  lg: 32px
components:
  table-header:
    textColor: "{colors.ink}"
    typography: "{typography.table-header}"
  table-row:
    textColor: "{colors.muted}"
    backgroundColor: "{colors.background}"
  table-row-hover:
    backgroundColor: "{colors.surface}"
  link-accent:
    textColor: "{colors.accent}"
---

## Overview

A **dense admin table** for scanning user records — closer to an internal ops panel than a marketing landing page. The demo lives in `test-demo/react-table/` as a **reference DESIGN.md** for the ReqForge design chain (Brief → mockup → token freeze → dev-builder).

Visual anchor: neutral chrome, purple accent used sparingly for focus states — not gradient heroes or glass cards.

## Colors

- **Background ({colors.background})**: Page canvas; full-width table sits on white in light mode.
- **Surface ({colors.surface})**: Code blocks and subtle row hover wash.
- **Ink ({colors.ink})**: Headlines and table headers — near-black, not pure `#000`.
- **Muted ({colors.muted})**: Body and cell text; keeps hierarchy without extra font sizes.
- **Border ({colors.border})**: `#root` side rules and table dividers.
- **Accent ({colors.accent})**: Interactive emphasis only; demo table is read-only so accent appears in template chrome, not every row.

Dark mode follows `prefers-color-scheme: dark` in `src/index.css` — tokens above are the **light baseline**; implementers mirror the CSS variable block when auditing.

## Typography

System UI stack throughout — no custom webfonts. Page title uses **heading** scale; table uses **table-header** vs **body** contrast. Monospace reserved for inline `code` samples in the Vite shell, not table cells.

## Layout

Max content width **1126px**, centered — table is full width inside. Information density: **moderate-compact** (admin list, not card grid). Padding rhythm: `{spacing.lg}` above title, `{spacing.md}` between sections.

## Elevation & Depth

Flat — borders and background shifts only. Shadow token exists in CSS for hero template elements; **table rows do not use drop shadows**.

## Shapes

**{rounded.sm}** on code chips; table itself is square-edged. No pill buttons in this demo.

## Components

- **table-header**: Uppercase optional; left-aligned columns Name / Email / Role / Active / Created.
- **table-row / table-row-hover**: Zebra optional; hover uses `{colors.surface}`.

## Do's and Don'ts

- **Do** keep the table scannable — five columns max for the demo dataset.
- **Do** use CSS variables or Tailwind theme exported from this file when extending the demo.
- **Don't** add purple gradient heroes or decorative illustrations — this is a harness regression sample, not a product landing page.
- **Don't** invent hex values in Brief-only mode; this file is the normative source for `react-table` styling.

---

<!-- ReqForge: 示例文件 — 运行 designmd lint 见 core/skills/design-maker/templates/design-md-template.md -->
