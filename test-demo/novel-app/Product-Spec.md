# Product Spec: 小说创作工作台

## 产品概述
面向网络小说作者的 Web 端写作规划工具。核心工作流：构思人物 → AI 生成关系网 → 用户修改 → AI 生成大纲 → 用户修改 → AI 逐章写正文。

核心定位：不是"AI 写小说"，而是"人决定写什么，AI 执行"。

## Idea Stage Exit Criteria

### 1. Problem real and specific?

| Field | Answer |
|-------|--------|
| Who exactly | 自己写网络小说的作者（现代言情、都市、穿越等题材） |
| How often | 每个创作周期都会遇到：人物设定分散、章节规划混乱、正文撰写耗时 |
| How severe | 中高——无规划工具时容易写到一半卡住或弃坑 |
| Current workaround | Word / 纯文本 / 没有专门工具，人物关系记在脑子里或散落各处 |

### 2. Solution addresses the validated problem?

| Field | Answer |
|-------|--------|
| Validated problem | 从构思到正文缺少结构化的过渡工具。现有写作软件偏编辑器（Scrivener/ULysses），AI 写作工具偏自动生成（缺少规划+修改环节） |
| How this product addresses it | 人物→大纲→正文三步走，每步 AI 生成素材 + 用户审核修改 |
| Differs from original assumption? | N/A |

### 3. Enough signal to justify building?

| Field | Answer |
|-------|--------|
| Qualitative evidence | 用户本人是目标用户，有真实写作需求和痛点 |
| Disconfirming evidence considered | 市场上有成熟竞品（Scrivener/墨者/纯纯写作），但差异化在"AI 辅助规划+人控正文" |
| Why build now vs wait | 需求明确，范围可控，v1 可独立验证 |

## 目标用户
- 自己写网络小说的作者（现代言情、都市、穿越等题材）
- 一个人使用，非团队协作

## 核心功能

### v1（核心流程）

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 作品管理 | 创建/切换/删除作品；题材标签设定 | P0 |
| 人物设定 | 填写角色信息卡（姓名/年龄/性格/背景）；支持修改 | P0 |
| AI 生成章节大纲 | 根据人物+题材生成；用户可编辑调整 | P0 |
| AI 写正文 | 逐章生成；支持手动修改；用户自备 API Key | P0 |
| 数据导入导出 | JSON/Markdown 导出；备份恢复 | P0 |

### v2（增强）

| 功能 | 说明 |
|------|------|
| 人物关系网可视化 | 图结构展示 + 拖拽编辑 |
| 多模型支持 | OpenAI / Claude / 国内模型切换 |
| AI 续写/重写段落 | 精细化控制 |

### 明确不做
- 多人协作
- 发布/连载到平台
- 移动端适配（v1 仅桌面 Web）

## 用户流程
1. 创建新作品 → 设定题材和背景
2. 创建人物 → 设定角色信息
3. AI 生成章节大纲 → 用户审核调整
4. 确认后 AI 逐章生成正文
5. 用户编辑修改，完成作品

## 架构决定

**前端**: SPA（React + Vite + TypeScript + Tailwind CSS）
**后端**: 无。纯前端应用
**AI 调用**: 用户在前端输入 API Key → 直接调用 LLM API（OpenAI / Claude）
**存储**: IndexedDB（结构化数据）+ localStorage（配置项）
**关系网可视化**: v1 用表格 → v2 用 D3.js

## 数据模型

### Workspace
- id, title, genre, description, createdAt, updatedAt

### Character
- id, workspaceId, name, age, personality, background, traits, relationships[]

### Chapter
- id, workspaceId, title, summary, orderIndex, status (outline|writing|written|revised), content

## 未解决假设（开发前确认）
1. API Key 方案：用户输入自己的 API Key（OpenAI/Claude），不经过后端
2. 每章期望字数：不限，由用户在 prompt 中指定
3. AI 风格控制：用户在作品设定中写风格描述
4. 跨设备：v1 仅单设备本地存储，用户手动导出迁移

## 当前状态
✅ v1 范围确认 → 进入开发计划
