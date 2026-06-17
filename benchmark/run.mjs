#!/usr/bin/env node
// Multi-task benchmark harness: generates code via LLM for a given task,
// evaluates against the extended test suite, collects metrics.
//
// Usage:
//   node benchmark/run.mjs --task express-api-stats --variant V1 --n 10
//   node benchmark/run.mjs --task react-sortable-table --variant V2 --n 10
//   node benchmark/run.mjs --smoke   # one-shot connectivity check

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const __dirname = new URL('.', import.meta.url).pathname.slice(1);
const ROOT = resolve(__dirname, '..');
const BENCH = join(ROOT, 'benchmark');

// ---- Provider config ----
const PROVIDER = process.env.BENCH_PROVIDER || 'glm';
const USE_ANTHROPIC_API = PROVIDER === 'xfyun';
const API_BASE = PROVIDER === 'minmax'
  ? 'https://api.minimaxi.com/v1/chat/completions'
  : PROVIDER === 'deepseek'
    ? 'https://api.deepseek.com/v1/chat/completions'
    : PROVIDER === 'xfyun'
      ? (process.env.XFYUN_BASE_URL || 'https://maas-coding-api.cn-huabei-1.xf-yun.com/anthropic')
      : (process.env.GLMBENCH_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions');
const MODEL = PROVIDER === 'minmax'
  ? (process.env.MINMAX_MODEL || 'MiniMax-M3')
  : PROVIDER === 'deepseek'
    ? (process.env.DEEPSEEK_MODEL || 'deepseek-chat')
    : PROVIDER === 'xfyun'
      ? (process.env.XFYUN_MODEL || 'xopglm51')
      : (process.env.GLMBENCH_MODEL || 'glm-5.2');
const TEMPERATURE = 0.3;
const API_KEY = PROVIDER === 'minmax'
  ? (process.env.MINMAX_API_KEY || '')
  : PROVIDER === 'deepseek'
    ? (process.env.GNEX_DEEPSEEK_KEY || process.env.DEEPSEEK_API_KEY || '')
    : PROVIDER === 'xfyun'
      ? (process.env.XFYUN_API_KEY || '')
      : (process.env['zhipuai-api-key'] || process.env.ZHIPU_API_KEY);

// ---- Task registry ----
const TASKS = {
  'todo-cli': {
    label: 'Todo-CLI search command',
    projectDir: join(ROOT, 'test-demo', 'todo-cli'),
    taskDef: join(BENCH, 'task-definition.md'),
    contextFiles: {
      V1: join(BENCH, 'context-ANCHORS.md'),
      V2: join(BENCH, 'context-RULES.md'),
      V3: null, // built dynamically: V1 + V2
    },
    extendedTests: join(BENCH, 'extended-test-suite', 'search.test.ts'),
    outputFiles: [
      { dest: 'src/commands/search.ts', indicator: 'handleSearch', label: '搜索命令', lang: 'typescript' },
      { dest: 'src/__tests__/search.test.ts', isTest: true, label: '测试', lang: 'typescript' },
    ],
    buildOutputInstructions(taskName) {
      return [
        '请基于上述上下文和任务，输出两个文件：',
        '1. `src/commands/search.ts` — 搜索命令的实现',
        '2. `src/__tests__/search.test.ts` — 对应的 Vitest 测试',
        '',
        '输出格式：每个文件用一个 ```typescript 代码块包裹。代码块前一行用注释标明文件路径，例如：',
        '// src/commands/search.ts',
        '```typescript',
        '... code ...',
        '```',
      ].join('\n');
    },
    extractFiles(blocks) {
      let search = null, test = null;
      for (const b of blocks) {
        if (b.includes("from 'vitest'") || b.includes('describe(')) {
          if (!test) test = b;
        } else if (b.includes('handleSearch') || b.includes('export function')) {
          if (!search) search = b;
        }
      }
      return { files: { 'src/commands/search.ts': search, 'src/__tests__/search.test.ts': test }, generatedTest: test };
    },
    collectStaticMetrics(searchCode, testCode) {
      const lines = countMeaningfulLines(searchCode);
      const minLines = 25;
      return {
        code_lines: lines,
        test_lines: countMeaningfulLines(testCode),
        test_it_count: (testCode?.match(/\bit\(/g) || []).length,
        slop_ratio: lines / minLines,
        import_count: (searchCode?.match(/^import\s/gm) || []).length,
        naming_lower_keyword_extracted_once: /const\s+lowerKeyword\s*=/.test(searchCode || ''),
        typed_category_order: /TodoCategory\[\]/.test(searchCode || ''),
        category_filter_single_pass: /&&\s*t\.category\s*===\s*category/.test(searchCode || '')
          || /if\s*\(!category\)\s*return\s+matchesKeyword/.test(searchCode || ''),
        handles_invalid_category: /Invalid category/.test(searchCode || '') ? 'error' : 'silent',
        has_category_map_grouping: /grouped\[/.test(searchCode || '')
          || /Record<string,\s*typeof\s+todos>/.test(searchCode || ''),
        style_local_category_labels: /const\s+CATEGORY_LABELS/.test(searchCode || ''),
        imports_todo_category_type: /import.*TodoCategory.*from/.test(searchCode || ''),
        has_invalid_category_branch: /Invalid category/.test(searchCode || ''),
        has_early_return_on_empty_filtered: /No matching todos found/.test(searchCode || ''),
        has_early_return_on_empty_keyword: /Please provide a search keyword/.test(searchCode || ''),
      };
    },
    runTypeCheck(projectDir, files) {
      // Only run TS type check for the main source file, not the test
      const searchPath = 'src/commands/search.ts';
      const searchCode = files[searchPath];
      if (!searchCode) return false;
      const searchDest = join(projectDir, searchPath);
      writeFileSync(searchDest, searchCode);
      const result = spawnSync('npx', ['tsc', '--noEmit'], {
        cwd: projectDir,
        shell: true,
        encoding: 'utf-8',
        timeout: 30000,
      });
      rmSync(searchDest, { force: true });
      return result.status === 0;
    },
  },

  'express-api-stats': {
    label: 'Express API report system (3 files)',
    projectDir: join(ROOT, 'test-demo', 'express-api'),
    taskDef: join(BENCH, 'tasks', 'express-api-stats', 'task-definition.md'),
    contextFiles: {
      V1: join(BENCH, 'tasks', 'express-api-stats', 'context-anchors.md'),
      V2: join(BENCH, 'context-RULES.md'),
      V3: null,
    },
    extendedTests: join(BENCH, 'tasks', 'express-api-stats', 'extended-test-suite', 'report.test.ts'),
    outputFiles: [
      { dest: 'src/services/reportService.ts', indicator: 'buildReport', label: 'report 服务', lang: 'typescript' },
      { dest: 'src/routes/report.ts', indicator: 'Router', label: 'report 路由', lang: 'typescript' },
    ],
    buildOutputInstructions(taskName) {
      return [
        '请基于上述上下文和任务，输出以下两个文件：',
        '1. `src/services/reportService.ts` — 异步 buildReport 函数（用 setTimeout+Promise 模拟异步）',
        '2. `src/routes/report.ts` — 报告路由（遵循已有 Router 模式，解析 query 参数后调用 buildReport）',
        '',
        '输出格式：每个文件用一个 ```typescript 代码块包裹。代码块前一行用注释标明文件路径，例如：',
        '// src/services/reportService.ts',
        '```typescript',
        '... code ...',
        '```',
      ].join('\n');
    },
    extractFiles(blocks) {
      const files = {};
      for (const b of blocks) {
        if (b.includes('buildReport') && b.includes('export')) {
          if (!files['src/services/reportService.ts']) files['src/services/reportService.ts'] = b;
        } else if (b.includes('Router()') || b.includes('router.get')) {
          files['src/routes/report.ts'] = b;
        }
      }
      // reorder: service first so mainCode picks it for static metrics
      const reordered = {};
      if (files['src/services/reportService.ts']) reordered['src/services/reportService.ts'] = files['src/services/reportService.ts'];
      if (files['src/routes/report.ts']) reordered['src/routes/report.ts'] = files['src/routes/report.ts'];
      return { files: reordered, generatedTest: null };
    },
    collectStaticMetrics(code, _testCode) {
      const lines = countMeaningfulLines(code);
      const minLines = 30;
      return {
        code_lines: lines,
        slop_ratio: lines / minLines,
        import_count: (code?.match(/^import\s/gm) || []).length,
        has_build_report: /buildReport/.test(code || ''),
        has_async: /async/.test(code || ''),
        has_date_filtering: /startDate|endDate/.test(code || ''),
        has_group_by: /groupBy/.test(code || ''),
        groups_have_items: /items/.test(code || ''),
        includes_zero_count: /0\s*[=\s]/.test(code || '') && /count/.test(code || ''),
        uses_settimeout: /setTimeout/.test(code || ''),
        handles_empty: /0\]|=== 0|\.length === 0/.test(code || ''),
      };
    },
    runTypeCheck(projectDir, files) {
      // Tests catch type errors — no separate type check needed
      return true;
    },
  },

  'express-export': {
    label: 'Express API data export (async, JSON/CSV, validation)',
    projectDir: join(ROOT, 'test-demo', 'express-api'),
    taskDef: join(BENCH, 'tasks', 'express-export', 'task-definition.md'),
    contextFiles: {
      V1: join(BENCH, 'tasks', 'express-export', 'context-anchors.md'),
      V2: join(BENCH, 'context-RULES.md'),
      V3: null,
    },
    extendedTests: join(BENCH, 'tasks', 'express-export', 'extended-test-suite', 'export.test.ts'),
    outputFiles: [
      { dest: 'src/services/exportService.ts', indicator: 'submitExport', label: 'export 服务', lang: 'typescript' },
      { dest: 'src/routes/export.ts', indicator: 'Router', label: 'export 路由', lang: 'typescript' },
    ],
    buildOutputInstructions(taskName) {
      return [
        '请基于上述上下文和任务，输出以下两个文件：',
        '1. `src/services/exportService.ts` — 导出服务（包含 submitExport, getExportStatus, validateExportConfig, formatAsJson, formatAsCsv）',
        '2. `src/routes/export.ts` — 导出路由（POST /api/exports + GET /api/exports/:id）',
        '',
        '所有函数签名必须与 task-definition.md 中的接口定义完全一致，测试按名称导入。',
        '',
        '输出格式：每个文件用一个 ```typescript 代码块包裹。代码块前一行用注释标明文件路径，例如：',
        '// src/services/exportService.ts',
        '```typescript',
        '... code ...',
        '```',
      ].join('\n');
    },
    extractFiles(blocks) {
      const files = {};
      for (const b of blocks) {
        const hasExportFn = b.includes('submitExport') || b.includes('getExportStatus')
          || (b.includes('validateExport') && b.includes('formatAs'));
        if (hasExportFn && b.includes('export')) {
          if (!files['src/services/exportService.ts']) files['src/services/exportService.ts'] = b;
        } else if (b.includes('Router()') || b.includes('router.post') || b.includes('router.get')) {
          if (!files['src/routes/export.ts']) files['src/routes/export.ts'] = b;
        }
      }
      // service first so mainCode picks it for static metrics
      const reordered = {};
      if (files['src/services/exportService.ts']) reordered['src/services/exportService.ts'] = files['src/services/exportService.ts'];
      if (files['src/routes/export.ts']) reordered['src/routes/export.ts'] = files['src/routes/export.ts'];
      return { files: reordered, generatedTest: null };
    },
    collectStaticMetrics(code, _testCode) {
      const lines = countMeaningfulLines(code);
      const minLines = 60;
      return {
        code_lines: lines,
        slop_ratio: lines / minLines,
        import_count: (code?.match(/^import\s/gm) || []).length,
        has_submit_export: /submitExport/.test(code || ''),
        has_get_export_status: /getExportStatus/.test(code || ''),
        has_validate_export_config: /validateExportConfig/.test(code || ''),
        has_format_as_json: /formatAsJson/.test(code || ''),
        has_format_as_csv: /formatAsCsv/.test(code || ''),
        uses_settimeout: /setTimeout/.test(code || ''),
        uses_uuid_or_crypto: /crypto\.randomUUID|uuid\(|Date\.now\(\)/.test(code || ''),
        csv_has_escaping: /replace|escape|"\\"/.test(code || ''),
        filters_applied: /filter|status.*===|category.*===/.test(code || ''),
      };
    },
    runTypeCheck(projectDir, files) {
      return true;
    },
  },

  'react-sortable-table': {
    label: 'React interactive table (3 features)',
    projectDir: join(ROOT, 'test-demo', 'react-table'),
    taskDef: join(BENCH, 'tasks', 'react-sortable-table', 'task-definition.md'),
    contextFiles: {
      V1: join(BENCH, 'tasks', 'react-sortable-table', 'context-anchors.md'),
      V2: join(BENCH, 'context-RULES.md'),
      V3: null,
    },
    extendedTests: join(BENCH, 'tasks', 'react-sortable-table', 'extended-test-suite', 'Table.sort.test.tsx'),
    outputFiles: [
      { dest: 'src/components/Table.tsx', indicator: 'Table', label: 'Table 组件', lang: 'tsx' },
    ],
    buildOutputInstructions(taskName) {
      return [
        '请基于上述上下文和任务，输出以下文件：',
        '1. `src/components/Table.tsx` — 添加排序 + 过滤 + 分页功能的 Table 组件',
        '',
        '输出格式：用 ```tsx 或 ```typescript 代码块包裹代码。代码块前一行用注释标明文件路径，例如：',
        '// src/components/Table.tsx',
        '```tsx',
        '... code ...',
        '```',
      ].join('\n');
    },
    extractFiles(blocks) {
      const table = blocks.find(b =>
        b.includes('data-testid="th-') && (b.includes('onClick') || b.includes('handleSort'))
      );
      return { files: { 'src/components/Table.tsx': table }, generatedTest: null };
    },
    collectStaticMetrics(code, _testCode) {
      const lines = countMeaningfulLines(code);
      const minLines = 80;
      return {
        code_lines: lines,
        slop_ratio: lines / minLines,
        import_count: (code?.match(/^import\s/gm) || []).length,
        uses_state: /useState/.test(code || ''),
        uses_usememo: /useMemo/.test(code || ''),
        has_sort_click_handler: /onClick/.test(code || ''),
        has_sort_indicator: /▲|▼/.test(code || ''),
        preserves_testid: /data-testid="(th-name|users-table)"/.test(code || ''),
        sorts_strings: /localeCompare/.test(code || ''),
        sorts_booleans: /true.*-1|false.*1/.test(code || '') || /Number.*active/.test(code || ''),
        no_mutation: /\.sort\(/.test(code || '') && /\[\.\.\./.test(code || ''),
        export_default: /export\s+default\s+function/.test(code || ''),
        has_filter_input: /filter-input/.test(code || ''),
        has_pagination: /prev-page|next-page|page-info/.test(code || ''),
        filter_resets_page: /setPage\(1\)/.test(code || '') || /setPage\(0\)/.test(code || ''),
        has_page_size_constant: /PAGE_SIZE\s*=\s*3|pageSize\s*=\s*3/.test(code || ''),
      };
    },
    runTypeCheck(projectDir, files) {
      return true;
    },
  },

  'python-input-validator': {
    label: 'Python form validator (rule system)',
    projectDir: join(ROOT, 'test-demo', 'input-validator'),
    taskDef: join(BENCH, 'tasks', 'python-input-validator', 'task-definition.md'),
    contextFiles: {
      V1: join(BENCH, 'tasks', 'python-input-validator', 'context-anchors.md'),
      V2: join(BENCH, 'context-RULES.md'),
      V3: null,
    },
    extendedTests: join(BENCH, 'tasks', 'python-input-validator', 'extended-test-suite', 'test_validator_extended.py'),
    outputFiles: [
      { dest: 'src/validator.py', indicator: 'validate_', label: 'validator 模块', lang: 'python' },
    ],
    buildOutputInstructions(taskName) {
      return [
        '请基于上述上下文和任务，输出以下文件：',
        '1. `src/validator.py` — 添加 validate_email, validate_phone, validate_age 三个函数',
        '    以及 ValidationResult 类、FormValidator 类（builder 模式）',
        '',
        '输出格式：用 ```python 代码块包裹代码。代码块前一行用注释标明文件路径，例如：',
        '# src/validator.py',
        '```python',
        '... code ...',
        '```',
      ].join('\n');
    },
    extractFiles(blocks) {
      const validator = blocks.find(b =>
        (b.includes('validate_email') || b.includes('validate_required'))
        && (b.includes('class ValidationResult') || b.includes('class FormValidator') || b.includes('validate_email'))
      );
      return { files: { 'src/validator.py': validator }, generatedTest: null };
    },
    collectStaticMetrics(code, _testCode) {
      const lines = countMeaningfulLines(code);
      const minLines = 80;
      return {
        code_lines: lines,
        slop_ratio: lines / minLines,
        import_count: (code?.match(/^import\s/gm) || (code?.match(/^from\s/gm) || [])).length,
        has_validate_email: /def validate_email/.test(code || ''),
        has_validate_phone: /def validate_phone/.test(code || ''),
        has_validate_age: /def validate_age/.test(code || ''),
        uses_re_module: /import re/.test(code || ''),
        email_uses_regex: /re\.(match|search|compile)/.test(code || ''),
        preserves_validate_required: /def validate_required/.test(code || ''),
        has_validation_result_class: /class ValidationResult/.test(code || ''),
        has_form_validator_class: /class FormValidator/.test(code || ''),
        has_add_error: /def add_error/.test(code || ''),
        has_is_valid: /def is_valid/.test(code || ''),
        has_errors_property: /def errors/.test(code || ''),
        has_merge_method: /def merge/.test(code || ''),
        has_fluent_chain: /return self/.test(code || ''),
        has_validate_method: /def validate/.test(code || ''),
        has_min_length_rule: /min_length/.test(code || ''),
        age_type_check: /isinstance.*int/.test(code || ''),
        age_bool_reject: /isinstance.*bool/.test(code || ''),
      };
    },
    runTypeCheck(projectDir, files) {
      return true;
    },
    runTestCommand: 'python -m pytest tests/ -v',
  },

  'java-validator': {
    label: 'Java annotation validator (3 files)',
    projectDir: join(ROOT, 'test-demo', 'java-validator'),
    taskDef: join(BENCH, 'tasks', 'java-validator', 'task-definition.md'),
    contextFiles: {
      V1: join(BENCH, 'tasks', 'java-validator', 'context-anchors.md'),
      V2: join(BENCH, 'context-RULES.md'),
      V3: null,
    },
    extendedTests: join(BENCH, 'tasks', 'java-validator', 'extended-test-suite', 'ValidatorExtendedTest.java'),
    outputFiles: [
      { dest: 'src/main/java/com/example/Email.java', indicator: '@interface Email', label: '@Email 注解', lang: 'java' },
      { dest: 'src/main/java/com/example/Phone.java', indicator: '@interface Phone', label: '@Phone 注解', lang: 'java' },
      { dest: 'src/main/java/com/example/Validator.java', indicator: 'class Validator', label: 'Validator 类', lang: 'java' },
    ],
    buildOutputInstructions(taskName) {
      return [
        '请基于上述上下文和任务，输出以下三个文件：',
        '1. `src/main/java/com/example/Email.java` — @Email 注解定义',
        '2. `src/main/java/com/example/Phone.java` — @Phone 注解定义',
        '3. `src/main/java/com/example/Validator.java` — 添加 validateEmail, validatePhone, validateAge, validateAnnotated 方法',
        '',
        '输出格式：每个文件用一个 ```java 代码块包裹。代码块前一行用注释标明文件路径，例如：',
        '// src/main/java/com/example/Email.java',
        '```java',
        '... code ...',
        '```',
      ].join('\n');
    },
    extractFiles(blocks) {
      const files = {};
      for (const b of blocks) {
        if (b.includes('@interface Email') && b.includes('@Retention')) {
          files['src/main/java/com/example/Email.java'] = b;
        } else if (b.includes('@interface Phone') && b.includes('@Retention')) {
          files['src/main/java/com/example/Phone.java'] = b;
        } else if (b.includes('class Validator') && b.includes('validateRequired')) {
          files['src/main/java/com/example/Validator.java'] = b;
        }
      }
      // Ensure Validator.java is first so mainCode picks it for static metrics
      const reordered = {};
      if (files['src/main/java/com/example/Validator.java']) {
        reordered['src/main/java/com/example/Validator.java'] = files['src/main/java/com/example/Validator.java'];
      }
      if (files['src/main/java/com/example/Email.java']) {
        reordered['src/main/java/com/example/Email.java'] = files['src/main/java/com/example/Email.java'];
      }
      if (files['src/main/java/com/example/Phone.java']) {
        reordered['src/main/java/com/example/Phone.java'] = files['src/main/java/com/example/Phone.java'];
      }
      return { files: reordered, generatedTest: null };
    },
    collectStaticMetrics(code, _testCode) {
      const lines = countMeaningfulLines(code);
      const minLines = 60;
      return {
        code_lines: lines,
        slop_ratio: lines / minLines,
        import_count: (code?.match(/^import\s/gm) || []).length,
        has_validate_email: /validateEmail/.test(code || ''),
        has_validate_phone: /validatePhone/.test(code || ''),
        has_validate_age: /validateAge/.test(code || ''),
        uses_pattern: /Pattern\.compile|Pattern\.matches/.test(code || ''),
        preserves_validate_required: /validateRequired/.test(code || ''),
        has_import_pattern: /import java\.util\.regex\.Pattern/.test(code || ''),
        package_declaration: /package com\.example/.test(code || ''),
        has_validate_annotated: /validateAnnotated/.test(code || ''),
        uses_reflection: /getDeclaredFields|getAnnotation/.test(code || ''),
        uses_compute_if_absent: /computeIfAbsent/.test(code || ''),
        has_import_reflect: /import java\.lang\.reflect\.Field/.test(code || ''),
        has_import_map_list: /import java\.util\.(Map|List|HashMap|ArrayList)/.test(code || ''),
        has_retention_runtime_in_validator: false, // checked per-annotation in separate files
      };
    },
    runTypeCheck(projectDir, files) {
      // Write ALL generated files before compiling
      const allPaths = Object.keys(files);
      const backups = [];
      const written = [];
      let anyCode = false;
      for (const destPath of allPaths) {
        const code = files[destPath];
        if (!code) continue;
        anyCode = true;
        const fullPath = join(projectDir, destPath);
        if (existsSync(fullPath)) {
          const bak = fullPath + '.bak';
          cpSync(fullPath, bak);
          backups.push({ src: fullPath, bak });
        }
        mkdirSync(join(fullPath, '..'), { recursive: true });
        writeFileSync(fullPath, code);
        written.push(fullPath);
      }
      if (!anyCode) return false;

      const result = spawnSync('mvn', ['compile', '-q'], {
        cwd: projectDir,
        shell: true,
        encoding: 'utf-8',
        timeout: 120000,
      });
      // Restore originals
      for (const p of written) {
        try { rmSync(p, { force: true }); } catch {}
      }
      for (const { src, bak } of backups) {
        try {
          rmSync(src, { force: true });
          cpSync(bak, src);
          rmSync(bak, { force: true });
        } catch {}
      }
      return result.status === 0;
    },
    runTestCommand: 'mvn test',
  },

  'probe-schema': {
    label: 'Schema validator (recursive validation)',
    projectDir: join(ROOT, 'test-demo', 'probe-base'),
    taskDef: join(BENCH, 'tasks', 'probe-schema', 'task-definition.md'),
    contextFiles: {
      V1: join(BENCH, 'tasks', 'probe-schema', 'context-anchors.md'),
      V2: join(BENCH, 'context-RULES.md'),
      V3: null,
    },
    extendedTests: join(BENCH, 'tasks', 'probe-schema', 'extended-test-suite', 'validate.test.ts'),
    outputFiles: [
      { dest: 'src/validate.ts', indicator: 'validate(', label: '验证函数', lang: 'typescript' },
    ],
    extractFiles(blocks) {
      let file = null;
      for (const b of blocks) {
        if (b.includes('interface FieldSchema') || b.includes('function validate')) {
          file = b; break;
        }
      }
      return { files: { 'src/validate.ts': file }, generatedTest: null };
    },
    runTypeCheck() { return true; },
    buildOutputInstructions(taskName) {
      return `\
## 输出要求

输出一个 TypeScript 文件 \`src/validate.ts\`，包含 validate 函数及其辅助函数。

\`\`\`
src/validate.ts
\`\`\`

不要输出其他文件。`;
    },
    collectStaticMetrics(code) {
      const lines = countMeaningfulLines(code);
      return {
        code_lines: lines,
        slop_ratio: lines / 80,
        import_count: (code?.match(/^import\s/gm) || []).length,
        has_validate: /function validate/.test(code || ''),
        has_recursion: /function\s+\w+.*\{[\s\S]*\1/.test(code || ''),
      };
    },
  },

  'probe-schedule': {
    label: 'Event scheduler (conflict detection)',
    projectDir: join(ROOT, 'test-demo', 'probe-base'),
    taskDef: join(BENCH, 'tasks', 'probe-schedule', 'task-definition.md'),
    contextFiles: {
      V1: join(BENCH, 'tasks', 'probe-schedule', 'context-anchors.md'),
      V2: join(BENCH, 'context-RULES.md'),
      V3: null,
    },
    extendedTests: join(BENCH, 'tasks', 'probe-schedule', 'extended-test-suite', 'scheduler.test.ts'),
    outputFiles: [
      { dest: 'src/scheduler.ts', indicator: 'EventScheduler', label: '调度器', lang: 'typescript' },
    ],
    extractFiles(blocks) {
      let file = null;
      for (const b of blocks) {
        if (b.includes('class EventScheduler')) {
          file = b; break;
        }
      }
      return { files: { 'src/scheduler.ts': file }, generatedTest: null };
    },
    runTypeCheck() { return true; },
    buildOutputInstructions(taskName) {
      return `\
## 输出要求

输出一个 TypeScript 文件 \`src/scheduler.ts\`，包含 EventScheduler 类。

\`\`\`
src/scheduler.ts
\`\`\`

不要输出其他文件。`;
    },
    collectStaticMetrics(code) {
      const lines = countMeaningfulLines(code);
      return {
        code_lines: lines,
        slop_ratio: lines / 100,
        import_count: (code?.match(/^import\s/gm) || []).length,
        has_class: /class EventScheduler/.test(code || ''),
        uses_uuid: /randomUUID/.test(code || ''),
      };
    },
  },

  'probe-shipping': {
    label: 'Shipping calculator (business rules)',
    projectDir: join(ROOT, 'test-demo', 'probe-base'),
    taskDef: join(BENCH, 'tasks', 'probe-shipping', 'task-definition.md'),
    contextFiles: {
      V1: join(BENCH, 'tasks', 'probe-shipping', 'context-anchors.md'),
      V2: join(BENCH, 'context-RULES.md'),
      V3: null,
    },
    extendedTests: join(BENCH, 'tasks', 'probe-shipping', 'extended-test-suite', 'shipping.test.ts'),
    outputFiles: [
      { dest: 'src/shipping.ts', indicator: 'calculateShipping', label: '运费计算', lang: 'typescript' },
    ],
    extractFiles(blocks) {
      let file = null;
      for (const b of blocks) {
        if (b.includes('function calculateShipping')) {
          file = b; break;
        }
      }
      return { files: { 'src/shipping.ts': file }, generatedTest: null };
    },
    runTypeCheck() { return true; },
    buildOutputInstructions(taskName) {
      return `\
## 输出要求

输出一个 TypeScript 文件 \`src/shipping.ts\`，包含 calculateShipping 函数及其辅助函数。

\`\`\`
src/shipping.ts
\`\`\`

不要输出其他文件。`;
    },
    collectStaticMetrics(code) {
      const lines = countMeaningfulLines(code);
      return {
        code_lines: lines,
        slop_ratio: lines / 120,
        import_count: (code?.match(/^import\s/gm) || []).length,
        has_calc: /function calculateShipping/.test(code || ''),
        handles_unavailable: /total.*-1/.test(code || ''),
      };
    },
  },
};

const VARIANT_LABEL = {
  V1: 'Anchors only',
  V2: 'Rules only',
  V3: 'Anchors + Rules',
};

// ---- Helpers ----
function countMeaningfulLines(code) {
  if (!code) return 0;
  return code.split('\n')
    .filter(l => {
      const t = l.trim();
      return t && !t.startsWith('//') && !t.startsWith('#');
    })
    .length;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { task: 'todo-cli', variant: null, n: 10, smoke: false, resume: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--task') opts.task = args[++i];
    else if (a === '--variant') opts.variant = args[++i];
    else if (a === '--n') opts.n = parseInt(args[++i], 10);
    else if (a === '--smoke') opts.smoke = true;
    else if (a === '--resume') opts.resume = true;
    else if (a === '-h' || a === '--help') {
      const taskList = Object.keys(TASKS).join(', ');
      console.log('Usage: node benchmark/run.mjs --task <task> --variant V1|V2|V3 --n 10');
      console.log('       node benchmark/run.mjs --smoke');
      console.log(`Tasks: ${taskList}`);
      console.log('Env: BENCH_PROVIDER=glm|minmax|deepseek|xfyun');
      process.exit(0);
    }
  }
  return opts;
}

function buildPrompt(taskConfig, variant, taskName) {
  let ctx;
  if (variant === 'V3') {
    // V3 = anchors (V1 file) + rules (V2 file)
    const anchors = taskConfig.contextFiles.V1;
    const rules = taskConfig.contextFiles.V2;
    if (!anchors || !existsSync(anchors)) throw new Error(`V3 requires V1 anchors: ${anchors}`);
    if (!rules || !existsSync(rules)) throw new Error(`V3 requires V2 rules: ${rules}`);
    ctx = readFileSync(anchors, 'utf8') + '\n\n' + readFileSync(rules, 'utf8');
  } else {
    const ctxFile = taskConfig.contextFiles[variant];
    if (!ctxFile || !existsSync(ctxFile)) throw new Error(`Context file not found for ${variant}: ${ctxFile}`);
    ctx = readFileSync(ctxFile, 'utf8');
  }
  const task = readFileSync(taskConfig.taskDef, 'utf8');
  const outputInstr = taskConfig.buildOutputInstructions(taskName);
  return [ctx, '', '---', '', task, '', '---', '', outputInstr].join('\n');
}

async function callLLM(prompt) {
  if (!API_KEY) throw new Error('Missing API key: set the appropriate env var');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 600000);
  const body = USE_ANTHROPIC_API
    ? JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      })
    : JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: TEMPERATURE,
      });
  const res = await fetch(USE_ANTHROPIC_API ? API_BASE + '/v1/messages' : API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...(USE_ANTHROPIC_API ? { 'anthropic-version': '2023-06-01' } : {}),
    },
    body,
    signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt}`);
  }
  const data = await res.json();
  const content = USE_ANTHROPIC_API
    ? data?.content?.[0]?.text
    : data?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Empty content: ${JSON.stringify(data).slice(0, 300)}`);
  return content;
}

function extractCodeBlocks(text) {
  const re = /```(?:\w+)?\s*\n([\s\S]*?)```/g;
  const blocks = [];
  let m;
  while ((m = re.exec(text)) !== null) blocks.push(m[1]);
  return blocks;
}

function runTests(taskConfig, files) {
  const { projectDir, extendedTests } = taskConfig;

  // Backup originals that will be overwritten, then write generated files
  const writtenPaths = [];
  const backups = [];
  for (const [destPath, code] of Object.entries(files)) {
    if (code) {
      const fullPath = join(projectDir, destPath);
      // Backup if file already exists
      if (existsSync(fullPath)) {
        const bak = fullPath + '.bak';
        cpSync(fullPath, bak);
        backups.push({ src: fullPath, bak });
      }
      mkdirSync(join(fullPath, '..'), { recursive: true });
      writeFileSync(fullPath, code);
      writtenPaths.push(fullPath);
    }
  }

  // Copy extended test suite
  const isPython = extendedTests.endsWith('.py');
  const isJava = extendedTests.endsWith('.java');
  let testDest;
  if (isPython) {
    testDest = join(projectDir, 'tests', 'test_extended.py');
  } else if (isJava) {
    testDest = join(projectDir, 'src', 'test', 'java', 'com', 'example', 'ValidatorExtendedTest.java');
  } else {
    const ext = extendedTests.endsWith('.tsx') ? '.tsx' : '.ts';
    testDest = join(projectDir, 'src', '__tests__', `extended.test${ext}`);
  }
  cpSync(extendedTests, testDest, { force: true });
  writtenPaths.push(testDest);

  const testCmd = taskConfig.runTestCommand || 'pnpm test';
  const spawnOpts = {
    cwd: projectDir,
    shell: true,
    encoding: 'utf-8',
    timeout: 120000,
  };
  if (isPython) {
    spawnOpts.env = { ...process.env, PYTHONPATH: projectDir };
  }
  const result = spawnSync(testCmd, [], spawnOpts);
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';

  // Cleanup: remove generated files and extended test suite, restore originals
  for (const p of writtenPaths) {
    try { rmSync(p, { force: true }); } catch {}
  }
  for (const { src, bak } of backups) {
    try {
      rmSync(src, { force: true });
      cpSync(bak, src);
      rmSync(bak, { force: true });
    } catch {}
  }

  const combined = stdout + '\n' + stderr;
  let tests_passed = 0, tests_total = 0, failed_names = [];

  if (isPython) {
    // Match summary like "===== 34 passed in 0.10s ====="
    const summaryMatch = combined.match(/={5,}\s*(\d+)\s+passed/);
    if (summaryMatch) {
      tests_passed = parseInt(summaryMatch[1], 10);
      const failMatch = combined.match(/(\d+)\s+failed/);
      const failedCount = failMatch ? parseInt(failMatch[1], 10) : 0;
      tests_total = tests_passed + failedCount;
    }
    const failMatches = [...combined.matchAll(/FAILED\s+(\S+)/g)];
    failed_names = failMatches.map(m => m[1]);
  } else if (isJava) {
    // Maven output: "Tests run: 29, Failures: 0, Errors: 0, Skipped: 0"
    // Use the LAST "Tests run:" line (overall summary)
    const allMatches = [...combined.matchAll(/Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+)/g)];
    if (allMatches.length > 0) {
      const last = allMatches[allMatches.length - 1];
      tests_total = parseInt(last[1], 10);
      const failures = parseInt(last[2], 10);
      const errors = parseInt(last[3], 10);
      tests_passed = tests_total - failures - errors;
    }
    const failMatches = [...combined.matchAll(/FAILED\s+(\S+)/g)];
    failed_names = failMatches.map(m => m[1]);
  } else {
    const passLine = combined.split('\n').find(l => l.includes('Tests') && l.includes('passed'));
    if (passLine) {
      const m = passLine.match(/(\d+)\s+passed/);
      if (m) tests_passed = parseInt(m[1], 10);
      const fm = passLine.match(/(\d+)\s+failed/);
      tests_total = tests_passed + (fm ? parseInt(fm[1], 10) : 0);
    }
    const failMatches = [...combined.matchAll(/×\s+(\S+)/g)];
    failed_names = failMatches.map(m => m[1]);
  }

  return {
    tests_passed,
    tests_total,
    tests_failed_names: failed_names,
    pnpm_exit_code: result.status,
    raw_output_tail: combined.slice(-500),
  };
}

async function runOnce(taskConfig, variant, idx, taskName) {
  const outDir = join(BENCH, 'out', `${taskName}-${variant}-${idx}`);
  mkdirSync(outDir, { recursive: true });

  const prompt = buildPrompt(taskConfig, variant, taskName);
  writeFileSync(join(outDir, 'prompt.txt'), prompt);

  const startedAt = new Date().toISOString();
  const t0 = Date.now();

  let raw, apiError, extracted = { files: {}, generatedTest: null };
  try {
    raw = await callLLM(prompt);
    writeFileSync(join(outDir, 'raw-response.txt'), raw);
    const blocks = extractCodeBlocks(raw);
    extracted = taskConfig.extractFiles(blocks);
  } catch (e) {
    if (e.name === 'AbortError' || e.message.includes('aborted')) {
      apiError = 'API_TIMEOUT: request exceeded 300s';
    } else {
      apiError = e.message;
    }
  }

  if (apiError) {
    const metrics = {
      task: taskName, variant, run_index: idx, variant_label: VARIANT_LABEL[variant],
      model: MODEL, temperature: TEMPERATURE,
      started_at: startedAt, duration_ms: Date.now() - t0,
      status: 'api_error', api_error: apiError,
    };
    writeFileSync(join(outDir, 'metrics.json'), JSON.stringify(metrics, null, 2));
    console.log(`  [${taskName}-${variant}-${idx}] API_ERROR: ${apiError}`);
    return metrics;
  }

  // Write extracted code to out dir
  for (const [dest, code] of Object.entries(extracted.files)) {
    if (code) {
      const fileOut = join(outDir, dest);
      mkdirSync(join(fileOut, '..'), { recursive: true });
      writeFileSync(fileOut, code);
    }
  }

  const mainCode = Object.values(extracted.files).find(v => v !== null) || null;
  const generatedTest = extracted.generatedTest;
  const staticMetrics = taskConfig.collectStaticMetrics(mainCode, generatedTest);

  const testResult = mainCode ? runTests(taskConfig, extracted.files) : {
    tests_passed: 0, tests_total: 0, tests_failed_names: ['no_code_extracted'], pnpm_exit_code: -1,
  };
  const compiles = mainCode ? taskConfig.runTypeCheck(taskConfig.projectDir, extracted.files) : false;

  const metrics = {
    task: taskName, variant, run_index: idx, variant_label: VARIANT_LABEL[variant],
    model: MODEL, temperature: TEMPERATURE,
    started_at: startedAt, duration_ms: Date.now() - t0,
    status: 'ok',
    extracted_code: !!mainCode,
    compiles,
    ...staticMetrics,
    ...testResult,
  };
  writeFileSync(join(outDir, 'metrics.json'), JSON.stringify(metrics, null, 2));

  const outputFiles = taskConfig.outputFiles.map(f => f.dest).join(', ');
  console.log(`  [${taskName}-${variant}-${idx}] tests=${metrics.tests_passed}/${metrics.tests_total} lines=${metrics.code_lines} compiles=${compiles} => ${outputFiles}`);
  return metrics;
}

function aggregate(variant, allMetrics, taskName) {
  const ok = allMetrics.filter(m => m.status === 'ok' && m.extracted_code);
  const n_ok = ok.length;
  const mean = (arr) => arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null;
  const stdev = (arr) => {
    if (arr.length < 2) return null;
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1));
  };
  const col = (key) => ok.map(m => m[key]).filter(v => typeof v === 'number');

  // Collect static metric rates (boolean metrics)
  const staticKeys = Object.keys(ok[0] || {}).filter(k =>
    typeof ok[0]?.[k] === 'boolean' && k !== 'extracted_code' && k !== 'compiles'
  );
  const staticRates = {};
  for (const key of staticKeys) {
    staticRates[`${key}_rate`] = ok.filter(m => m[key]).length / Math.max(n_ok, 1);
  }

  return {
    task: taskName, variant, variant_label: VARIANT_LABEL[variant],
    n_total: allMetrics.length, n_ok,
    aggregate: {
      tests_passed_mean: mean(col('tests_passed')),
      tests_passed_stdev: stdev(col('tests_passed')),
      code_lines_mean: mean(col('code_lines')),
      code_lines_stdev: stdev(col('code_lines')),
      compiles_rate: ok.filter(m => m.compiles).length / Math.max(n_ok, 1),
      ...staticRates,
    },
    runs: allMetrics,
  };
}

async function smoke() {
  console.log(`[smoke] provider=${PROVIDER} model=${MODEL} base=${API_BASE} key=${API_KEY ? 'present' : 'MISSING'}`);
  try {
    const out = await callLLM('Say "ok" and nothing else.');
    console.log('[smoke] response:', out.slice(0, 200));
  } catch (e) {
    console.error('[smoke] FAILED:', e.message);
    process.exit(1);
  }
}

async function main() {
  const opts = parseArgs();
  if (opts.smoke) return smoke();

  const taskConfig = TASKS[opts.task];
  if (!taskConfig) {
    console.error(`Unknown task '${opts.task}'. Available: ${Object.keys(TASKS).join(', ')}`);
    process.exit(1);
  }

  if (!opts.variant) {
    console.error('--variant V1|V2|V3 required');
    process.exit(1);
  }
  if (!VARIANT_LABEL[opts.variant]) {
    console.error(`--variant must be V1, V2, or V3 (got '${opts.variant}')`);
    process.exit(1);
  }

  console.log(`[run] task=${opts.task} (${taskConfig.label}) provider=${PROVIDER} variant=${opts.variant} (${VARIANT_LABEL[opts.variant]}) n=${opts.n} model=${MODEL} temp=${TEMPERATURE}`);

  const allMetrics = [];
  for (let i = 0; i < opts.n; i++) {
    const m = await runOnce(taskConfig, opts.variant, i, opts.task);
    allMetrics.push(m);
  }

  const agg = aggregate(opts.variant, allMetrics, opts.task);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const out = join(BENCH, `results-${opts.task}-${opts.variant}-${ts}.json`);
  writeFileSync(out, JSON.stringify(agg, null, 2));
  console.log(`[done] wrote ${out}`);
  console.log(JSON.stringify(agg.aggregate, null, 2));
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
