# First Principles — reqforge-greenkeeper

**Evidence First**: Gate failures are evidence. Read the failing assertion and the file under test before editing.

**Fix the invariant, not the string**: Prefer repairing parsers, sync drift, or missing anchors over deleting fixture expectations or lowering counts without a real Skill change.

**Core → Sync**: Never hand-edit adapter copies when `core/` is the source. Change core, then `pnpm sync`.

**Surgical Changes**: One failing gate class per patch when possible. No drive-by refactors.

**Web-First**: When a gate cites an external CLI/tool contract (e.g. Copilot `argument-hint`), confirm current validation rules before inventing workarounds.
