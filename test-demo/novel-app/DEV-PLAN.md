# DEV-PLAN: 小说创作工作台 v1

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | React 18 + TypeScript | 生态最大 |
| Build | Vite | 零配置 fast refresh |
| Styling | Tailwind CSS 3 | 不用写 CSS，快 |
| Storage | IndexedDB (idb wrapper) | 结构化数据，容量大 |
| AI | fetch → OpenAI/Claude API | 无后端，纯前端直调 |
| Icons | Lucide React | 轻量，够用 |
| Router | 无（SPA 单页模式用状态切换） | v1 不需要路由 |

## 数据模型

```
Workspace {
  id: string           // crypto.randomUUID()
  title: string
  genre: string
  description: string
  styleGuide: string   // AI 风格描述
  createdAt: number
  updatedAt: number
}

Character {
  id: string
  workspaceId: string
  name: string
  age: string
  personality: string
  background: string
  appearance: string
  traits: string[]           // 标签：外向/腹黑/话痨...
  relationships: string      // 关联关系描述（自由文本）
  createdAt: number
  updatedAt: number
}

Chapter {
  id: string
  workspaceId: string
  title: string
  summary: string
  orderIndex: number
  status: 'outline' | 'writing' | 'written' | 'revised'
  content: string
  wordCount: number
  createdAt: number
  updatedAt: number
}
```

## 项目结构

```
novel-app/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── package.json
├── Product-Spec.md
├── DEV-PLAN.md
├── .forge/
│   └── spec-confirmed.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css                # Tailwind 入口
    ├── types.ts                 # 类型定义
    ├── db.ts                    # IndexedDB 操作封装
    ├── ai.ts                    # AI API 调用
    ├── components/
    │   ├── Sidebar.tsx          # 作品列表 + 导航
    │   ├── WorkspaceView.tsx    # 作品详情页（路由容器）
    │   ├── CharacterList.tsx    # 人物列表
    │   ├── CharacterForm.tsx    # 人物编辑表单
    │   ├── OutlineView.tsx      # 章节大纲列表
    │   ├── ChapterEditor.tsx    # 章节编辑（写作）
    │   ├── ApiKeySetup.tsx      # API Key 设置
    │   └── DataExport.tsx       # 导入导出
    └── utils/
        └── helpers.ts           # 工具函数
```

## 实现阶段

### Phase 1: Scaffold + Workspace CRUD
**文件**: App.tsx, Sidebar.tsx, WorkspaceView.tsx, db.ts, types.ts
- Vite + React + Tailwind 初始化
- IndexedDB 操作封装（db.ts）
- Workspace 创建/切换/删除 UI
- 本地存储验证

### Phase 2: Character Management
**文件**: CharacterList.tsx, CharacterForm.tsx
- 人物列表展示（按作品筛选）
- 人物 CRUD（增删改）
- 角色信息卡表单

### Phase 3: AI Integration
**文件**: ai.ts, ApiKeySetup.tsx
- OpenAI/Claude API 调用封装
- API Key 管理（localStorage 加密存储）
- 流式输出支持（SSE）

### Phase 4: Outline Generation
**文件**: OutlineView.tsx
- AI 根据人物+题材生成章节大纲
- 大纲列表分章展示
- 手动编辑/增删章节
- 拖拽排序（可选）

### Phase 5: Chapter Writing
**文件**: ChapterEditor.tsx
- AI 根据大纲逐章生成正文
- 实时流式显示生成内容
- 手动编辑（textarea/Tiptap）
- 字数统计
- 状态标记（大纲/写作中/已完成/已修改）

### Phase 6: Data Export/Import
**文件**: DataExport.tsx
- 导出全部作品为 JSON
- 导入 JSON 恢复
- 导出章节为 Markdown
- 定期备份提示

## API 设计

### AI 调用（ai.ts）
```typescript
// 生成大纲
generateOutline(workspace, characters): Promise<Chapter[]>

// 生成章节
generateChapter(outline, characterContext): Promise<string>
```

两种模式：
- **流式**（默认）：fetch EventSource -> text streaming -> 实时显示
- **非流式**：等全部生成完一次性显示

### IndexedDB 接口（db.ts）
```typescript
// 通用
db.getAll<T>(storeName): Promise<T[]>
db.get<T>(storeName, id): Promise<T | undefined>
db.put<T>(storeName, item): Promise<void>
db.delete(storeName, id): Promise<void>

// 专用
db.getWorkspaces(): Promise<Workspace[]>
db.getWorkspace(id): Promise<Workspace>
db.getCharacters(workspaceId): Promise<Character[]>
db.getChapters(workspaceId): Promise<Chapter[]>
```

## 里程碑
| Phase | 产出 | 预计 |
|-------|------|------|
| 1 | 可创建/切换作品 | 当前会话 |
| 2 | 可管理人物 | 当前会话 |
| 3 | AI 可调用 | 当前会话 |
| 4 | 可生成大纲 | 当前会话 |
| 5 | 可写正文 | 当前会话 |
| 6 | 可导出备份 | 当前会话 |
