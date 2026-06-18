export type AIProvider = "openai" | "deepseek" | "claude";

const API_KEY_KEY = "novel-app-api-key";
const PROVIDER_KEY = "novel-app-provider";

const providerConfig: Record<AIProvider, { baseUrl: string; defaultModel: string }> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
  },
  claude: {
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-sonnet-4-20250514",
  },
};

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_KEY) || "";
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_KEY, key);
}

export function getProvider(): AIProvider {
  return (localStorage.getItem(PROVIDER_KEY) as AIProvider) || "deepseek";
}

export function setProvider(p: AIProvider) {
  localStorage.setItem(PROVIDER_KEY, p);
}

type Role = "system" | "user" | "assistant";

interface Message {
  role: Role;
  content: string;
}

interface StreamCallbacks {
  onToken: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (err: Error) => void;
}

async function callOpenAI(messages: Message[], callbacks: StreamCallbacks) {
  const apiKey = getApiKey();
  const config = providerConfig.openai;
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.defaultModel,
      messages,
      stream: true,
      temperature: 0.8,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`API 错误 (${res.status}): ${err}`);
  }
  await readSSE(res, callbacks);
}

async function callDeepSeek(messages: Message[], callbacks: StreamCallbacks) {
  const apiKey = getApiKey();
  const config = providerConfig.deepseek;
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.defaultModel,
      messages,
      stream: true,
      temperature: 0.8,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`API 错误 (${res.status}): ${err}`);
  }
  await readSSE(res, callbacks);
}

async function callClaude(messages: Message[], callbacks: StreamCallbacks) {
  const apiKey = getApiKey();
  const config = providerConfig.claude;

  // Convert to Anthropic format
  const systemMsg = messages.find((m) => m.role === "system");
  const userMsgs = messages.filter((m) => m.role !== "system");

  const res = await fetch(`${config.baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.defaultModel,
      system: systemMsg?.content || "",
      messages: userMsgs.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: 8192,
      stream: true,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`API 错误 (${res.status}): ${err}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("无法读取响应");

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "content_block_delta") {
          const token = parsed.delta?.text || "";
          if (token) {
            fullText += token;
            callbacks.onToken(token);
          }
        }
      } catch {
        // skip
      }
    }
  }
  callbacks.onDone(fullText);
}

async function readSSE(res: Response, callbacks: StreamCallbacks) {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("无法读取响应");

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content || "";
        if (token) {
          fullText += token;
          callbacks.onToken(token);
        }
      } catch {
        // skip parse errors on partial lines
      }
    }
  }
  callbacks.onDone(fullText);
}

async function callAI(messages: Message[], callbacks: StreamCallbacks) {
  const apiKey = getApiKey();
  if (!apiKey) {
    callbacks.onError(new Error("请先设置 API Key"));
    return;
  }

  const provider = getProvider();
  try {
    if (provider === "openai") await callOpenAI(messages, callbacks);
    else if (provider === "deepseek") await callDeepSeek(messages, callbacks);
    else if (provider === "claude") await callClaude(messages, callbacks);
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  }
}

export function generateCharacters(
  workspace: { title: string; genre: string; description: string },
  callbacks: StreamCallbacks
) {
  const prompt = `你是一个小说人物设定专家。请根据以下小说信息，设计主要人物。

作品标题：${workspace.title}
题材：${workspace.genre}
简介：${workspace.description}

要求：
1. 设计 3-8 个主要人物
2. 每个人物输出格式为一行，用 | 分隔：
   姓名|年龄|性格描述|背景故事|外貌特征|标签1,标签2

3. 性格描述 10-30 字，背景故事 20-50 字
4. 标签用逗号分隔，如：外向,腹黑,话痨
5. 人物要符合题材特征，角色之间有戏剧张力
6. 输出纯数据行，不要额外说明`;

  callAI(
    [
      {
        role: "system",
        content: "你是一个专业的小说人物设定师。输出格式严格，人物设定立体且有戏剧冲突。",
      },
      { role: "user", content: prompt },
    ],
    callbacks
  );
}

export function generateRelationships(
  workspace: { title: string; genre: string; description: string },
  characters: { id: string; name: string; personality: string; background: string; traits: string[] }[],
  callbacks: StreamCallbacks
) {
  const charList = characters
    .map(
      (c) =>
        `ID:${c.id} ${c.name}（${c.personality}，背景：${c.background}，标签：${(c.traits || []).join("/")}）`
    )
    .join("\n");

  const prompt = `你是小说设定分析专家。请分析以下小说的人物设定，推断人物之间可能存在的关系。

作品标题：${workspace.title}
题材：${workspace.genre}
简介：${workspace.description}

人物列表（含 ID）：
${charList}

要求：
1. 根据人物性格、背景、题材，推断合理的人物关系
2. 关系类型包括：情侣、朋友、仇人、亲属、同事、师生、对手、主仆、暗恋、知己 等
3. 每对关系输出一行，格式：<sourceId>|<targetId>|<关系类型>|<关系描述>
4. 不要输出重复关系（A→B 和 B→A 只输出一次）
5. 输出 5-15 条合理的关系`;

  callAI(
    [
      {
        role: "system",
        content: "你是一个小说人物关系分析专家。输出格式严格，关系推断合理且有戏剧张力。",
      },
      { role: "user", content: prompt },
    ],
    callbacks
  );
}

// ---- Public generators ----

export function generateOutline(
  workspace: { title: string; genre: string; description: string; styleGuide: string },
  characters: { name: string; personality: string; background: string; relationships: string }[],
  callbacks: StreamCallbacks
) {
  const charDesc = characters
    .map(
      (c) =>
        `- ${c.name}：性格${c.personality}，背景${c.background}${
          c.relationships ? `，关系：${c.relationships}` : ""
        }`
    )
    .join("\n");

  const prompt = `你是一个小说创作助手。请根据以下信息，为一部小说生成章节大纲。

作品标题：${workspace.title}
题材：${workspace.genre}
作品简介：${workspace.description}
风格要求：${workspace.styleGuide}

人物设定：
${charDesc || "（暂无详细人物设定）"}

要求：
1. 生成 10-20 章的大纲
2. 每章包括：章节标题、章节摘要（100-200字）
3. 章节之间要有连贯的情节发展
4. 符合该题材的典型结构（起承转合）
5. 输出格式为每行一个章节：## 第X章 标题\n摘要内容\n`;

  callAI(
    [
      {
        role: "system",
        content:
          "你是一个专业的小说大纲策划师，擅长为各类题材设计章节结构。输出格式清晰，内容有张力。",
      },
      { role: "user", content: prompt },
    ],
    callbacks
  );
}

export function generateChapter(
  chapterTitle: string,
  chapterSummary: string,
  workspace: { title: string; genre: string; styleGuide: string },
  characters: { name: string; personality: string; background: string }[],
  previousChapters: { title: string; summary: string }[],
  callbacks: StreamCallbacks
) {
  const charDesc = characters
    .map((c) => `- ${c.name}：${c.personality}，${c.background}`)
    .join("\n");

  const prevDesc = previousChapters
    .map((c) => `- ${c.title}：${c.summary}`)
    .join("\n");

  const prompt = `你是一个小说作者。请根据以下信息，写出小说的一个章节。

作品标题：${workspace.title}
题材：${workspace.genre}
风格要求：${workspace.styleGuide}

人物设定：
${charDesc || "（暂无详细人物设定）"}

情节前情提要：
${prevDesc || "（这是第一章）"}

本章信息：
标题：${chapterTitle}
摘要：${chapterSummary}

要求：
1. 写出完整的章节内容，字数 2000-3000 字
2. 以叙事为主，包含对话、描写、心理活动
3. 符合该题材的语言风格
4. 章节结尾留有悬念或推进情节
5. 直接输出正文，不要输出章节标题以外的额外说明`;

  callAI(
    [
      {
        role: "system",
        content: "你是一个专业的网络小说作者。文字流畅，情节生动，人物对话自然。",
      },
      { role: "user", content: prompt },
    ],
    callbacks
  );
}
