/**
 * forge-scaffold-gitignore.test.ts — the scaffolded .gitignore must not ignore the scaffold's own files.
 *
 * The node-ts / next-ts presets write tsconfig.json and a .gitignore containing `*.json`
 * with only `!package.json` re-included, so tsconfig.json was git-ignored: the first commit
 * of a freshly scaffolded project left it out and a clean clone could not build.
 */
import { describe, it, expect } from "vitest";
import { spawnSync } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { initTemplate, listTemplates } from "../forge-scaffold.mjs";

function ignoredFiles(dir: string, files: string[]): string[] {
  const init = spawnSync("git", ["init", "-q"], { cwd: dir, encoding: "utf-8" });
  if (init.status !== 0) throw new Error(`git init failed: ${init.stderr}`);
  // `git check-ignore` prints each path that is ignored; exit 1 means none are.
  const r = spawnSync("git", ["check-ignore", "--", ...files], { cwd: dir, encoding: "utf-8" });
  if (r.status !== 0 && r.status !== 1) throw new Error(`git check-ignore failed: ${r.stderr}`);
  return r.stdout.split("\n").map(s => s.trim()).filter(Boolean);
}

describe("forge-scaffold .gitignore", () => {
  const templates = (listTemplates() as Array<{ name: string }>).map(t => t.name);

  it("has templates to check", () => {
    expect(templates.length).toBeGreaterThan(0);
  });

  for (const name of templates) {
    it(`${name}: no generated file is git-ignored`, () => {
      const dir = mkdtempSync(join(tmpdir(), "forge-scaffold-gitignore-"));
      try {
        const { filesCreated } = initTemplate(name, dir) as { filesCreated: string[] };
        expect(ignoredFiles(dir, filesCreated)).toEqual([]);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }
});
