#!/usr/bin/env node
/**
 * forge-scaffold.mjs — Project scaffolding from Product-Spec.md + template marketplace
 *
 * Reads Product-Spec.md → extracts Technical Direction → detects stack
 * → generates project skeleton (package.json, tsconfig, src/, tests, .gitignore).
 *
 * Template marketplace: curated project starters in core/templates/project-starters/
 * with skeleton files + metadata. One-command init.
 *
 * CLI:
 *   node scripts/forge-scaffold.mjs detect-stack <spec-path>
 *   node scripts/forge-scaffold.mjs generate [project-dir] --spec <path> [--dry-run]
 *   node scripts/forge-scaffold.mjs list-stacks
 *   node scripts/forge-scaffold.mjs list-templates
 *   node scripts/forge-scaffold.mjs init <template> [project-dir] [--dry-run]
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..");

// ─── Template Marketplace ────────────────────────────────────────────

export const TEMPLATES_DIR = join(ROOT, "core", "templates", "project-starters");

/**
 * Load metadata for a single template.
 * @param {string} name
 * @returns {object|null}
 */
export function loadTemplateMetadata(name) {
  const metaPath = join(TEMPLATES_DIR, name, "template.json");
  if (!existsSync(metaPath)) return null;
  return JSON.parse(readFileSync(metaPath, "utf-8"));
}

/**
 * List all available templates with metadata.
 * @returns {Array<{name: string, label: string, description: string, tags: string[]}>}
 */
export function listTemplates() {
  if (!existsSync(TEMPLATES_DIR)) return [];
  const entries = readdirSync(TEMPLATES_DIR, { withFileTypes: true });
  const templates = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const meta = loadTemplateMetadata(entry.name);
    if (meta) {
      templates.push({
        name: meta.name,
        label: meta.label,
        description: meta.description,
        tags: meta.tags || [],
        loadout: meta.loadout || "",
      });
    }
  }
  return templates.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Replace {{placeholder}} patterns in file content.
 * @param {string} content
 * @param {object} vars
 * @returns {string}
 */
function replacePlaceholders(content, vars) {
  let result = content;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replaceAll(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
  }
  return result;
}

/**
 * Copy skeleton files from a template directory, replacing placeholders.
 * @param {string} templateDir
 * @param {string} targetDir
 * @param {object} vars
 */
function copySkeleton(templateDir, targetDir, vars) {
  const skeletonDir = join(templateDir, "skeleton");
  if (!existsSync(skeletonDir)) return;

  const entries = readdirSync(skeletonDir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    const relPath = entry.parentPath
      ? join(entry.parentPath.replace(skeletonDir + "/", "").replace(skeletonDir, ""), entry.name)
      : entry.name;
    const srcContent = readFileSync(join(entry.parentPath || skeletonDir, entry.name), "utf-8");
    const destPath = join(targetDir, relPath);
    mkdirSync(dirname(destPath), { recursive: true });
    writeFileSync(destPath, replacePlaceholders(srcContent, vars), "utf-8");
  }
}

/**
 * Scaffold a project from a named template.
 *
 * @param {string} templateName - name in project-starters/
 * @param {string} targetDir - output directory
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun]
 * @returns {{ filesCreated: string[], postCommands: string[], template: object }}
 */
export function initTemplate(templateName, targetDir, opts = {}) {
  const meta = loadTemplateMetadata(templateName);
  if (!meta) {
    throw new Error(`Unknown template: "${templateName}". Run list-templates to see available templates.`);
  }

  const vars = { projectName: basename(targetDir) };
  const filesCreated = [];

  // Step 1: generate base files from preset (package.json, tsconfig, etc.)
  if (meta.preset && FILE_GENERATORS[meta.preset]) {
    const spec = {
      projectName: vars.projectName,
      techStack: meta.techStack || "",
      productType: meta.productType || "",
      dataStorage: "",
      deployment: "",
    };
    const generator = FILE_GENERATORS[meta.preset];
    const generatedFiles = generator(spec);
    for (const [relPath, content] of Object.entries(generatedFiles)) {
      if (opts.dryRun) {
        filesCreated.push(relPath);
        continue;
      }
      const fullPath = join(targetDir, relPath);
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, replacePlaceholders(content, vars), "utf-8");
      filesCreated.push(relPath);
    }
  }

  // Step 2: copy skeleton files (if any)
  const templateDir = join(TEMPLATES_DIR, templateName);
  const skeletonDir = join(templateDir, "skeleton");
  if (existsSync(skeletonDir)) {
    const skeletonEntries = readdirSync(skeletonDir, { recursive: true, withFileTypes: true });
    for (const entry of skeletonEntries) {
      if (entry.isDirectory()) continue;
      const parent = entry.parentPath || "";
      const relPath = parent
        ? join(parent.replace(skeletonDir.replace(/\\/g, "/") + "/", "").replace(/\\/g, "/"), entry.name)
        : entry.name;
      if (opts.dryRun && !filesCreated.includes(relPath)) filesCreated.push(relPath);
    }
    if (!opts.dryRun) copySkeleton(templateDir, targetDir, vars);
  }

  // Write README
  if (meta.readme && !opts.dryRun) {
    const readmePath = join(targetDir, "README.md");
    writeFileSync(readmePath, replacePlaceholders(meta.readme, vars), "utf-8");
  }
  if (!filesCreated.includes("README.md")) filesCreated.push("README.md");

  return {
    filesCreated,
    projectDir: targetDir,
    template: meta,
    postCommands: meta.postInit || [],
    loadout: meta.loadout || "",
  };
}

// ─── Spec Parsing ─────────────────────────────────────────────────

/**
 * Parse Product-Spec.md to extract project metadata.
 *
 * @param {string} specPath
 * @returns {{ projectName: string, techStack: string, productType: string, dataStorage: string, deployment: string }}
 */
export function parseSpec(specPath) {
  if (!existsSync(specPath)) {
    throw new Error(`Spec file not found: ${specPath}`);
  }
  const content = readFileSync(specPath, "utf-8");

  // Extract project name from H1
  const nameMatch = content.match(/^#\s+Product Spec:\s+(.+)$/m);
  const projectName = nameMatch
    ? nameMatch[1].trim().toLowerCase().replace(/\s+/g, "-")
    : basename(dirname(specPath)).toLowerCase();

  // Extract Technical Direction table
  const techSection = content.match(/## Technical Direction[\s\S]*?(?=\n## |$)/)?.[0] || "";

  const techStack = extractTableCell(techSection, "Recommended Tech Stack");
  const productType = extractTableCell(techSection, "Product Type");
  const dataStorage = extractTableCell(techSection, "Data Storage");
  const deployment = extractTableCell(techSection, "Deployment");

  return { projectName, techStack, productType, dataStorage, deployment };
}

function extractTableCell(table, rowLabel) {
  const re = new RegExp(`\\|\\s*${rowLabel}\\s*\\|\\s*(.+?)\\s*\\|`, "i");
  return table.match(re)?.[1]?.trim() || "";
}

// ─── Stack Detection ──────────────────────────────────────────────

const PRESETS = {
  "node-ts": {
    detect: /node\.?js.*typescript|typescript.*node\.?js/i,
    label: "Node.js + TypeScript",
  },
  "next-ts": {
    detect: /next\.?js.*typescript|typescript.*next\.?js/i,
    label: "Next.js + TypeScript",
  },
  "python-fastapi": {
    detect: /python.*fastapi|fastapi.*python/i,
    label: "Python + FastAPI",
  },
  "go": {
    detect: /\bgo\b(?!lang)/i,
    label: "Go",
  },
  "rust": {
    detect: /\brust\b/i,
    label: "Rust",
  },
};

/**
 * Detect the tech stack preset from a Product-Spec.md.
 *
 * @param {string} specPath
 * @returns {{ preset: string, label: string, techStack: string }}
 */
export function detectStack(specPath) {
  const { techStack } = parseSpec(specPath);

  // Check presets in priority order (more specific first)
  const order = ["next-ts", "python-fastapi", "node-ts", "go", "rust"];
  for (const key of order) {
    if (PRESETS[key].detect.test(techStack)) {
      return { preset: key, label: PRESETS[key].label, techStack };
    }
  }

  return { preset: "unknown", label: "Unknown", techStack };
}

// ─── File Templates ───────────────────────────────────────────────

function nodeTsFiles(ctx) {
  const pkg = {
    name: ctx.projectName,
    version: "0.1.0",
    type: "module",
    main: "dist/index.js",
    scripts: {
      build: "tsc",
      test: "vitest run",
      "test:watch": "vitest",
      start: "node dist/index.js",
    },
    devDependencies: {
      typescript: "^5.5.0",
      vitest: "^3.0.0",
      "@types/node": "^22.0.0",
    },
  };

  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      module: "Node16",
      moduleResolution: "Node16",
      outDir: "dist",
      rootDir: "src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      declaration: true,
    },
    include: ["src"],
    exclude: ["node_modules", "dist", "src/__tests__"],
  };

  return {
    "package.json": JSON.stringify(pkg, null, 2),
    "tsconfig.json": JSON.stringify(tsconfig, null, 2),
    ".gitignore": [
      "node_modules/",
      "dist/",
      "*.json",
      "!package.json",
      ".env",
      ".env.local",
      "*.log",
    ].join("\n") + "\n",
    "src/index.ts": `console.log("Hello from ${ctx.projectName}!");\n`,
    "vitest.config.ts": [
      "import { defineConfig } from 'vitest/config';",
      "export default defineConfig({});",
    ].join("\n") + "\n",
    "src/__tests__/hello.test.ts": [
      "import { describe, it, expect } from 'vitest';",
      "",
      `describe('${ctx.projectName}', () => {`,
      "  it('works', () => expect(1).toBe(1));",
      "});",
    ].join("\n") + "\n",
    "README.md": `# ${ctx.projectName}\n\nGenerated by forge-scaffold.\n`,
  };
}

function nextTsFiles(ctx) {
  const pkg = {
    name: ctx.projectName,
    version: "0.1.0",
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      test: "vitest run",
      "test:watch": "vitest",
    },
    dependencies: {
      next: "^15.0.0",
      react: "^19.0.0",
      "react-dom": "^19.0.0",
    },
    devDependencies: {
      typescript: "^5.5.0",
      "@types/react": "^19.0.0",
      "@types/node": "^22.0.0",
      tailwindcss: "^4.0.0",
      vitest: "^3.0.0",
    },
  };

  const tsconfig = {
    compilerOptions: {
      target: "ES2017",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: { "@/*": ["./src/*"] },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  };

  return {
    "package.json": JSON.stringify(pkg, null, 2),
    "tsconfig.json": JSON.stringify(tsconfig, null, 2),
    "next.config.ts": "import type { NextConfig } from 'next';\nconst config: NextConfig = {};\nexport default config;\n",
    "tailwind.config.ts": 'import type { Config } from "tailwindcss";\nconst config: Config = { content: ["./src/**/*.{ts,tsx}"] };\nexport default config;\n',
    "postcss.config.mjs": 'export default { plugins: { "@tailwindcss/postcss": {} } };\n',
    ".gitignore": [
      "node_modules/",
      ".next/",
      "out/",
      "*.json",
      "!package.json",
      ".env",
      ".env.local",
      "*.log",
    ].join("\n") + "\n",
    "src/app/layout.tsx": [
      'export default function RootLayout({ children }: { children: React.ReactNode }) {',
      "  return <html><body>{children}</body></html>;",
      "}",
    ].join("\n") + "\n",
    "src/app/page.tsx": [
      'export default function Home() {',
      "  return <h1>Hello from " + ctx.projectName + "</h1>;",
      "}",
    ].join("\n") + "\n",
    "src/app/globals.css": '@import "tailwindcss";\n',
    "vitest.config.ts": "import { defineConfig } from 'vitest/config';\nexport default defineConfig({});\n",
    "src/__tests__/hello.test.ts": [
      "import { describe, it, expect } from 'vitest';",
      `describe('${ctx.projectName}', () => { it('works', () => expect(1).toBe(1)); });`,
    ].join("\n") + "\n",
    "README.md": `# ${ctx.projectName}\n\nGenerated by forge-scaffold.\n`,
  };
}

function pythonFastapiFiles(ctx) {
  return {
    "pyproject.toml": [
      "[project]",
      `name = "${ctx.projectName}"`,
      'version = "0.1.0"',
      'requires-python = ">=3.11"',
      "dependencies = [",
      '  "fastapi>=0.115.0",',
      '  "uvicorn>=0.30.0",',
      "]",
      "",
      "[project.optional-dependencies]",
      "dev = [",
      '  "pytest>=8.0",',
      '  "httpx>=0.27",',
      "]",
    ].join("\n") + "\n",
    "app/__init__.py": "",
    "app/main.py": [
      "from fastapi import FastAPI",
      "",
      "app = FastAPI()",
      "",
      "@app.get('/')",
      "def root():",
      "    return {'hello': 'world'}",
    ].join("\n") + "\n",
    "tests/__init__.py": "",
    "tests/test_main.py": [
      "from fastapi.testclient import TestClient",
      "from app.main import app",
      "",
      "client = TestClient(app)",
      "",
      "def test_root():",
      "    response = client.get('/')",
      "    assert response.status_code == 200",
      "    assert response.json() == {'hello': 'world'}",
    ].join("\n") + "\n",
    ".gitignore": [
      "__pycache__/",
      "*.pyc",
      ".venv/",
      "*.egg-info/",
      ".env",
    ].join("\n") + "\n",
    "README.md": `# ${ctx.projectName}\n\nGenerated by forge-scaffold.\n`,
  };
}

function goFiles(ctx) {
  return {
    "go.mod": `module ${ctx.projectName}\n\ngo 1.22\n`,
    "main.go": [
      "package main",
      "",
      'import "fmt"',
      "",
      "func main() {",
      `    fmt.Println("Hello from ${ctx.projectName}")`,
      "}",
    ].join("\n") + "\n",
    "main_test.go": [
      "package main",
      "",
      'import "testing"',
      "",
      "func TestHello(t *testing.T) {",
      "    if 1 != 1 {",
      `        t.Error("fail")`,
      "    }",
      "}",
    ].join("\n") + "\n",
    ".gitignore": [
      "*.exe",
      "*.test",
      "*.out",
      "vendor/",
    ].join("\n") + "\n",
    "README.md": `# ${ctx.projectName}\n\nGenerated by forge-scaffold.\n`,
  };
}

function rustFiles(ctx) {
  return {
    "Cargo.toml": [
      "[package]",
      `name = "${ctx.projectName}"`,
      'version = "0.1.0"',
      'edition = "2021"',
      "",
      "[dependencies]",
    ].join("\n") + "\n",
    "src/main.rs": [
      "fn main() {",
      `    println!("Hello from ${ctx.projectName}!");`,
      "}",
    ].join("\n") + "\n",
    ".gitignore": [
      "/target",
    ].join("\n") + "\n",
    "README.md": `# ${ctx.projectName}\n\nGenerated by forge-scaffold.\n`,
  };
}

const FILE_GENERATORS = {
  "node-ts": nodeTsFiles,
  "next-ts": nextTsFiles,
  "python-fastapi": pythonFastapiFiles,
  "go": goFiles,
  "rust": rustFiles,
};

const POST_COMMANDS = {
  "node-ts": ["pnpm install"],
  "next-ts": ["pnpm install"],
  "python-fastapi": ["pip install -e '.[dev]'"],
  "go": ["go mod tidy"],
  "rust": ["cargo build"],
};

// ─── Generate ─────────────────────────────────────────────────────

/**
 * Generate a project skeleton from Product-Spec.md.
 *
 * @param {string} projectDir - target directory
 * @param {string} specPath - path to Product-Spec.md
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun]
 * @returns {{ preset: string, filesCreated: string[], projectDir: string, postCommands: string[] }}
 */
export function generate(projectDir, specPath, opts = {}) {
  const spec = parseSpec(specPath);
  const { preset } = detectStack(specPath);

  if (preset === "unknown") {
    throw new Error(`Cannot detect stack from spec. Tech stack: "${spec.techStack}". Use --preset to override.`);
  }

  const generator = FILE_GENERATORS[preset];
  if (!generator) {
    throw new Error(`No generator for preset: ${preset}`);
  }

  const files = generator(spec);
  const filesCreated = [];

  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = join(projectDir, relPath);
    const dir = dirname(fullPath);

    if (opts.dryRun) {
      filesCreated.push(relPath);
      continue;
    }

    mkdirSync(dir, { recursive: true });
    writeFileSync(fullPath, content, "utf-8");
    filesCreated.push(relPath);
  }

  return {
    preset,
    filesCreated,
    projectDir,
    postCommands: POST_COMMANDS[preset] || [],
  };
}

// ─── CLI ──────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
forge-scaffold — Project scaffolding from Product-Spec.md

Usage:
  detect-stack <spec-path>
    Detect tech stack from Product-Spec.md

  generate [project-dir] --spec <path> [--dry-run] [--preset <name>]
    Generate project skeleton. If project-dir omitted, uses spec directory.

  list-stacks
    List available stack presets

  list-templates
    List available project starter templates (marketplace)

  init <template> [project-dir] [--dry-run]
    Scaffold a full project from a named template. If project-dir omitted,
    uses template name as directory (e.g. init my-app creates ./my-app).
    Templates: next-fullstack, cli-tool, express-api, electron-app

Options:
  --preset <name>   Override detected stack (node-ts, next-ts, python-fastapi, go, rust)
  --dry-run         Print files that would be created without writing
  --root <dir>      Project root (default: repo root)
  --help, -h        Show this help
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  const cmd = args[0];

  const kv = {};
  let positional = [];
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      const val = (args[i + 1] && !args[i + 1].startsWith("--")) ? args[++i] : "true";
      kv[key] = val;
    } else {
      positional.push(args[i]);
    }
  }

  switch (cmd) {
    case "detect-stack": {
      const specPath = positional[0];
      if (!specPath) {
        console.error("Missing spec path");
        process.exit(1);
      }
      try {
        const result = detectStack(specPath);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) {
        console.error(e.message);
        process.exit(1);
      }
      break;
    }
    case "generate": {
      const specPath = kv.spec;
      if (!specPath) {
        console.error("Missing --spec <path>");
        process.exit(1);
      }
      const projectDir = positional[0] || dirname(specPath);
      const dryRun = kv["dry-run"] === "true";
      const presetOverride = kv.preset;

      try {
        if (presetOverride) {
          // Override: skip detection, use specified preset
          const spec = parseSpec(specPath);
          const generator = FILE_GENERATORS[presetOverride];
          if (!generator) {
            console.error(`Unknown preset: ${presetOverride}`);
            process.exit(1);
          }
          const files = generator(spec);
          const filesCreated = [];
          for (const [relPath, content] of Object.entries(files)) {
            if (dryRun) {
              filesCreated.push(relPath);
              continue;
            }
            const fullPath = join(projectDir, relPath);
            mkdirSync(dirname(fullPath), { recursive: true });
            writeFileSync(fullPath, content, "utf-8");
            filesCreated.push(relPath);
          }
          console.log(JSON.stringify({
            preset: presetOverride,
            filesCreated,
            projectDir,
            postCommands: POST_COMMANDS[presetOverride] || [],
          }, null, 2));
        } else {
          const result = generate(projectDir, specPath, { dryRun });
          console.log(JSON.stringify(result, null, 2));
        }
      } catch (e) {
        console.error(e.message);
        process.exit(1);
      }
      break;
    }
    case "list-stacks": {
      console.log("\nAvailable stack presets:\n");
      for (const [key, val] of Object.entries(PRESETS)) {
        console.log(`  ${key.padEnd(18)} ${val.label}`);
      }
      console.log();
      break;
    }
    case "list-templates": {
      const templates = listTemplates();
      if (templates.length === 0) {
        console.log("\nNo templates found.\n");
        break;
      }
      console.log(`\nAvailable project starters (${templates.length}):\n`);
      for (const t of templates) {
        const tags = t.tags.length ? ` [${t.tags.join(", ")}]` : "";
        const loadout = t.loadout ? `  loadout: ${t.loadout}` : "";
        console.log(`  ${t.name.padEnd(18)} ${t.label}`);
        console.log(`  ${"".padEnd(18)} ${t.description}${loadout ? " · " + loadout : ""}${tags}`);
        console.log();
      }
      console.log("Use: node scripts/forge-scaffold.mjs init <name> [project-dir]\n");
      break;
    }
    case "init": {
      const templateName = positional[0];
      if (!templateName) {
        console.error("Missing template name. Usage: forge-scaffold init <template> [project-dir]");
        process.exit(1);
      }
      const projectDir = positional[1] || join(process.cwd(), templateName);
      const dryRun = kv["dry-run"] === "true";

      try {
        const result = initTemplate(templateName, projectDir, { dryRun });
        if (dryRun) {
          console.log(`\nWould create project "${templateName}" at ${projectDir}:`);
          for (const f of result.filesCreated) console.log(`  ${f}`);
        } else {
          console.log(`\n✅ Project "${templateName}" scaffolded at ${projectDir}`);
          console.log(`   Files created: ${result.filesCreated.length}`);
          if (result.loadout) console.log(`   Recommended loadout: ${result.loadout}`);
          if (result.postCommands.length) {
            console.log(`\n   Post-init steps:`);
            for (const cmd of result.postCommands) console.log(`     cd ${basename(projectDir)} && ${cmd}`);
          }
        }
      } catch (e) {
        console.error(e.message);
        process.exit(1);
      }
      break;
    }
    default:
      console.error(`Unknown command: ${cmd}`);
      printHelp();
      process.exit(1);
  }
}

if (process.argv[1] && (process.argv[1].endsWith("forge-scaffold.mjs") || process.argv[1].endsWith("forge-scaffold"))) {
  main();
}
