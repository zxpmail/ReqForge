#!/usr/bin/env node
/**
 * forge-verify generate-contracts — 从需求描述自动生成 C1 patterns
 *
 * 目的：解决 C1 collapse (24%) 问题——人工写的正则太 brittle，
 * 靠自动展开 multiple patterns 覆盖 agent 输出的措辞变体。
 *
 * 用法：
 *   node scripts/forge-verify/generate-contracts.mjs < requirements.json
 *   node scripts/forge-verify/generate-contracts.mjs --in requirements.json
 *
 * 输入格式（stdin 或 --in 文件）：
 *   {
 *     "task": "当前 Phase 的任务描述",
 *     "files": ["src/api/register.ts"],
 *     "requirements": [
 *       { "id": "REQ-1", "desc": "IP 级别限流", "evidence_file": "test-output.txt" },
 *       { "id": "REQ-2", "desc": "Coverage ≥ 85%", "evidence_file": "coverage.txt" },
 *       { "id": "REQ-3", "desc": "不得使用 TTL 替代 write-invalidation", "evidence_file": "diff-review.md" }
 *     ]
 *   }
 *
 * 输出（stdout）：可直接写入 .forge/content-verify.json 的 JSON
 *
 * 生成策略：
 *   - 数字范围约束（如 "≥ 85%"）→ 展开为区间正则 + 关键词变体
 *   - 中文描述 → 提取名词短语生成同义变体
 *   - 英文描述 → 提取关键词，生成大小写不敏感变体
 *   - 否定词（不/不得/禁止/no/not/never）→ type=negative
 *
 * 向后兼容：与现有手写 pattern/patterns 配置共存。生成结果是起点，
 * 可人工手工优化。
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

// ====== 中文关键词 → 正则片段映射 ======
// 核心同义映射：限流相关
const SYNONYM_MAP_CN = {
  "限流": ["limit", "throttl", "ratelimit", "rate.?limit"],
  "限速": ["limit", "throttl", "speed.?limit"],
  "缓存": ["cache", "cach"],
  "过期": ["expir", "ttl", "timeout"],
  "刷新": ["refresh", "invalidat", "flush"],
  "登录": ["login", "signin", "sign.?in", "auth"],
  "注册": ["register", "signup", "sign.?up"],
  "权限": ["permission", "auth", "access.?control", "role"],
  "验证": ["validat", "verify", "check"],
  "加密": ["encrypt", "hash", "cipher"],
  "解密": ["decrypt", "decipher"],
  "搜索": ["search", "query", "find"],
  "排序": ["sort", "order"],
  "分页": ["paginat", "page", "offset.?limit"],
  "过滤": ["filter", "where", "condition"],
  "通知": ["notif", "alert", "message"],
  "日志": ["log", "logg"],
  "重试": ["retry", "retri"],
  "超时": ["timeout", "time.?out"],
  "并发": ["concurr", "parallel", "race"],
  "事务": ["transact", "atomic"],
  "回滚": ["rollback", "roll.?back"],
  "备份": ["backup", "back.?up"],
  "恢复": ["recover", "restore"],
  "导入": ["import", "load"],
  "导出": ["export", "dump"],
  "配置": ["config", "setting", "option"],
  "监控": ["monitor", "metric", "observ"],
  "告警": ["alert", "alarm", "warn"],
  "降级": ["degrad", "fallback", "circuit.?break"],
  "熔断": ["circuit.?break", "fuse"],
  "负载均衡": ["load.?balanc", "lb", "reverse.?prox"],
  "灰度": ["canary", "gradual.?rollout", "traffic.?split"],
  "AB 测试": ["ab.?test", "experiment", "bucket"],
  "录制": ["record", "capture"],
  "回放": ["replay", "playback"],
};

// 英文关键词 → 同义正则片段
const SYNONYM_MAP_EN = {
  "rate.?lim": ["limit", "throttl", "ratelimit"],
  "cache": ["cach", "ttl", "stale"],
  "timeout": ["time.?out", "expir", "ttl"],
  "invalidat": ["invalid", "flush", "purge", "clear"],
  "concurr": ["parallel", "race", "simultan"],
  "retry": ["retri", "attempt.?again", "backoff"],
  "authenticat": ["login", "signin", "auth"],
  "authoriz": ["permission", "access.?control", "role"],
  "encrypt": ["encipher", "cipher", "hash", "aes"],
  "validat": ["verify", "check", "assert"],
};

// 停用词（中英文）
const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been",
  "have", "has", "had", "do", "does", "did", "will", "would",
  "can", "could", "should", "may", "might", "must",
  "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "as", "that", "this", "these", "those", "it", "its",
  "not", "no", "never", "without", "but", "or", "and",
  "if", "then", "else", "when", "while", "during",
  "实现", "使用", "通过", "进行", "完成", "需要", "能够",
  "一个", "这个", "那个", "一些", "可以", "应该", "必须",
  "以及", "或者", "但是", "并且", "如果", "当", "在",
]);

/**
 * 判断字符串是否含中文字符
 */
function hasChinese(str) {
  return /[一-鿿]/.test(str);
}

/**
 * 从描述中提取关键词（去停用词）
 */
function extractKeywords(desc) {
  // 先按标点/空格拆分
  const tokens = desc.split(/[\s,，。、；：()（）\[\]{}""''"「」『』]+/).filter(t => t.length > 0);
  // 对于中文，进一步按单字拆但保留常见双字词
  const keywords = [];
  for (const t of tokens) {
    if (hasChinese(t)) {
      // 中文：尝试匹配已知同义词映射（优先匹配最长key）
      const matched = [];
      for (const [key, _] of Object.entries(SYNONYM_MAP_CN)) {
        if (t.includes(key)) {
          matched.push(key);
        }
      }
      if (matched.length > 0) {
        keywords.push(...matched);
      } else if (t.length >= 2) {
        // 未匹配的保留词（去掉纯停用/标点）
        keywords.push(t);
      }
    } else {
      // 英文/数字：去停用词，保留有意义的词
      const lower = t.toLowerCase().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
      if (lower.length >= 2 && !STOP_WORDS.has(lower)) {
        keywords.push(lower);
      }
    }
  }
  return [...new Set(keywords)];
}

/**
 * 检测描述是否含否定语义 → type=negative
 */
function isNegativeDesc(desc) {
  const negWords = ["不", "不得", "禁止", "不应", "不能", "不要",
                    "no", "not", "never", "without", "avoid", "禁止"];
  const lower = desc.toLowerCase();
  return negWords.some(w => lower.includes(w));
}

/**
 * 从 desc 抽取数字范围（如 ≥ 85% → 85, 百分比）
 * 返回 { min, unit, suffix } 或 null
 */
function extractNumericConstraint(desc) {
  // 匹配 "≥ N" 或 ">= N" 或 "N% 以上" 或 "> N"
  const numPatterns = [
    /[≥>=]\s*(\d+)\s*(%|秒|毫秒|ms|s|个|次|行|条)?/,
    /(\d+)\s*(%)\s*以[上下]/,
    /coverage\s*[≥>=]\s*(\d+)\s*(%|percent)/i,
    /(至少|最少|不少于|不低于|at least|minimum|min)\s*(\d+)\s*(%|秒|ms|s)?/i,
  ];
  for (const pat of numPatterns) {
    const m = desc.match(pat);
    if (m) {
      const num = parseInt(m[1] || m[2], 10);
      const unit = m[3] || m[2] || "";
      return { min: num, unit, suffix: unit === "%" ? "%" : "" };
    }
  }
  return null;
}

/**
 * 生成数字范围正则（百分比）
 * 如 min=85 → (8[5-9]|90+)%
 */
function genPercentPattern(min) {
  if (min >= 100) return "100%";
  const tens = Math.floor(min / 10);
  const ones = min % 10;
  const parts = [];
  // [NN-99]%
  if (ones <= 9) {
    parts.push(`${tens}[${ones}-9]`);
  }
  // 十位递增
  for (let t = tens + 1; t <= 9; t++) {
    parts.push(`${t}\\d`);
  }
  // 100%
  parts.push("100");
  return `(${parts.join("|")})%`;
}

/**
 * 从单一 desc 生成 patterns 数组
 */
function generatePatterns(req) {
  const { id, desc } = req;
  if (!desc) return null;

  const patterns = [];
  const numCon = extractNumericConstraint(desc);
  const isNeg = isNegativeDesc(desc);
  const hasCn = hasChinese(desc);

  // 1. 数字约束 pattern
  if (numCon && numCon.suffix === "%") {
    patterns.push(genPercentPattern(numCon.min));
  }

  // 2. 关键词展开 pattern
  const keywords = extractKeywords(desc);
  const knownSynonyms = [];

  if (hasCn) {
    // 中文：查找已知同义词展开
    for (const kw of keywords) {
      if (SYNONYM_MAP_CN[kw]) {
        knownSynonyms.push(...SYNONYM_MAP_CN[kw]);
      } else {
        // 未映射的中文词：原文保留
        knownSynonyms.push(kw);
      }
    }
  } else {
    // 英文：查找同义映射
    for (const kw of keywords) {
      let found = false;
      for (const [key, syns] of Object.entries(SYNONYM_MAP_EN)) {
        if (kw.includes(key) || key.includes(kw)) {
          knownSynonyms.push(kw, ...syns);
          found = true;
          break;
        }
      }
      if (!found) {
        knownSynonyms.push(kw);
      }
    }
  }

  // 去重
  const uniqueTerms = [...new Set(knownSynonyms)];

  if (uniqueTerms.length > 0) {
    // 生成多个 pattern 变体：
    // a) OR 联合模式（同义词任一模匹配）
    if (uniqueTerms.length <= 6) {
      // 同义词数量少 → 直接 OR 联合
      const joined = uniqueTerms.map(t => {
        // 如果已经是正则片段则直接使用，否则转义
        return t.includes(".") || t.includes("?") || t.includes("\\") ? t : escapeRegex(t);
      }).join("|");
      patterns.push(`(?i)(${joined})`);
    } else {
      // 同义词多 → 拆成多组 OR
      const chunkSize = 4;
      for (let i = 0; i < uniqueTerms.length; i += chunkSize) {
        const chunk = uniqueTerms.slice(i, i + chunkSize);
        const joined = chunk.map(t =>
          t.includes(".") || t.includes("?") || t.includes("\\") ? t : escapeRegex(t)
        ).join("|");
        patterns.push(`(?i)(${joined})`);
      }
    }

    // b) 双词组合（如果有关键词对）
    if (keywords.length >= 2) {
      const pairs = [];
      for (let i = 0; i < keywords.length; i++) {
        for (let j = i + 1; j < keywords.length; j++) {
          const a = keywords[i].includes(".") ? keywords[i] : escapeRegex(keywords[i]);
          const b = keywords[j].includes(".") ? keywords[j] : escapeRegex(keywords[j]);
          pairs.push(`(?i)${a}.*${b}`);
        }
      }
      // 只取前 4 对，避免爆炸
      patterns.push(...pairs.slice(0, 4));
    }
  }

  // 3. 原始 desc 作为兜底 pattern（对英文，做词边界模糊）
  if (!hasCn && desc.split(/\s+/).length <= 6) {
    // 短英文描述 → 直接作为模糊匹配
    const words = desc.toLowerCase()
      .replace(/[≥≤><=]/g, "")
      .split(/\s+/)
      .filter(w => w.length >= 2 && !STOP_WORDS.has(w))
      .slice(0, 4); // 最多 4 个词
    if (words.length <= 3) {
      const altPhrasings = [
        words.map(w => escapeRegex(w)).join(".*"),
        words.map(w => escapeRegex(w)).join(".?"),
      ];
      patterns.push(...altPhrasings.map(p => `(?i)${p}`));
    }
  }

  // 去重，取前 6 条
  const unique = [...new Set(patterns)].slice(0, 6);

  if (unique.length === 0) {
    return null; // 无法生成有效 pattern
  }

  return {
    id,
    desc,
    evidence_file: req.evidence_file || "evidence.txt",
    patterns: unique,
    type: isNeg ? "negative" : "regex",
  };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 主入口
 */
function main() {
  const args = process.argv.slice(2);
  let input;

  const inIdx = args.indexOf("--in");
  if (inIdx >= 0 && inIdx + 1 < args.length) {
    input = readFileSync(args[inIdx + 1], "utf-8");
  } else if (!process.stdin.isTTY) {
    // 管道输入
    const chunks = [];
    process.stdin.on("data", d => chunks.push(d));
    process.stdin.on("end", () => {
      try {
        generate(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
      } catch (e) {
        console.error("❌ 输入解析失败:", e.message);
        process.exit(1);
      }
    });
    return; // 异步等待 stdin
  } else {
    console.error("用法: node generate-contracts.mjs < requirements.json");
    console.error("       node generate-contracts.mjs --in requirements.json");
    process.exit(1);
  }

  try {
    generate(JSON.parse(input));
  } catch (e) {
    console.error("❌ 输入解析失败:", e.message);
    process.exit(1);
  }
}

function generate(input) {
  const { task, files, requirements } = input;
  if (!requirements || !Array.isArray(requirements)) {
    console.error("❌ requirements 数组必填");
    process.exit(1);
  }

  const generated = {
    task: task || "",
    files: files || [],
    evidence_gates: {
      evidence_dir: ".skillgate/evidence",
      requirements: [],
    },
    layer3: {
      divergence_threshold: 0.8,
      uncertain_output: ".forge/verify-uncertain.json",
    },
  };

  let generatedCount = 0;
  let skippedCount = 0;

  for (const req of requirements) {
    // 如果已有显式 pattern 或 patterns，保留原样
    if (req.pattern || (req.patterns && req.patterns.length > 0)) {
      generated.evidence_gates.requirements.push({
        id: req.id,
        desc: req.desc || "",
        evidence_file: req.evidence_file || "evidence.txt",
        pattern: req.pattern,
        patterns: req.patterns,
        type: req.type || (isNegativeDesc(req.desc || "") ? "negative" : "regex"),
      });
      continue;
    }

    // 从 desc 自动生成
    if (req.desc) {
      const gen = generatePatterns(req);
      if (gen) {
        generated.evidence_gates.requirements.push(gen);
        generatedCount++;
        continue;
      }
    }

    // 跳过无法生成的（无 desc 且无 pattern）
    skippedCount++;
  }

  if (generated.evidence_gates.requirements.length === 0) {
    console.error("❌ 未能生成任何 requirement（请提供 desc 或 pattern）");
    process.exit(1);
  }

  console.log(JSON.stringify(generated, null, 2));

  if (skippedCount > 0) {
    console.error(`⚠ 跳过 ${skippedCount} 条需求（无 desc 且无 pattern）`);
  }
  console.error(`✅ 生成 ${generatedCount} 条需求的 patterns（共 ${generated.evidence_gates.requirements.length} 条）`);
}

if (process.argv[1] && (process.argv[1].endsWith("generate-contracts.mjs") || process.argv[1].endsWith("generate-contracts"))) {
  main();
}
