# 不是压缩，是晋升：为什么 Phase 切换时不要全量打包

AI 编程有一个隐秘的瓶颈不在模型能力里——在上下文窗口里。

你写完 Phase 1，代码库长了 5000 行。进入 Phase 2 时，怎么把这些"你知道但 AI 不知道"的东西传过去？

当前行业的标准答案是 **Repomix**：全量压缩成一个 Markdown 文件，塞进 context。看起来解决了问题，实际上制造了更大的问题。

---

## 不是压缩，是 Full GC dump

Repomix 做的事等价于 JVM 里的 **Full GC + Heap Dump**。

一个 `-XX:+HeapDumpOnOutOfMemoryError`  拍下来的二进制转储——包含所有存活对象、所有垃圾、所有曾经分配过还没来得及回收的内存碎片。你确实可以把整个堆塞进一张硬盘，但加载的时候要读，解析的时候要遍历，分析的时候要从几万个对象里找到真正有用的那十几个。

把它翻译到 AI 编程的上下文：

- 代码库 10 万行 → Repomix 打包成 15 万 token 的文件 → 塞进 prompt → AI 要在这 15 万 token 里找到"Phase 2 需要改动的那 3 个文件"
- 15 万 token 的处理延迟 + 注意力稀疏 + 关键信号被雷同框架代码淹没 → AI 开始"遗忘"你在 Phase 1 中做出的关键决策
- 于是 Phase 2 的代码开始偏离 Phase 1 的意图 → 需要更多指令来修正 → 上下文更膨胀 → 恶性循环

这个过程有个专有名词：**[lost in the middle](https://arxiv.org/abs/2307.03172)**。AI 对长上下文中间部分的回忆准确率断崖式下跌。你把 10 万行代码全塞进去，就等于确保 AI 会忘掉中间那 7 万行里的关键逻辑。

但更根本的问题是：

**只有 Full GC dump 才有"压缩"这个动作。Promotion 不需要压缩——它只需要晋升。**

---

## JVM 式内存模型：开发者最熟悉的上下文管理范式

你看 JVM 怎么做。HotSpot 分了三代：

| 代 | 角色 | 回收策略 |
|----|------|----------|
| **Eden** | 新对象诞生地 | Minor GC 时大量死亡，少量晋升 |
| **Survivor (S0/S1)** | 经历过 1 次 GC 仍存活的对象 | 在 S0/S1 之间复制，每轮年龄+1 |
| **Tenured (Old)** | 年龄足以上升的长期存活对象 | Major GC 时回收，频率极低 |

这个模型完美对应了 AI codebase 里信息的生命周期：

```
Phase 完成 ——▶ 善刀而藏之 ——▶ 下一 Phase
     │
     ├─ Eden（一次性代码）               → ❌ 不传递
     │    脚手架、样板、临时方案、本次试验代码
     │
     ├─ Survivor（存活接口/类型/领域模型）→ 🔼 晋升到 project-memory.md
     │    被本次 Phase 验证有用的抽象
     │
     ├─ 被打破的假设                    → 📋 写到假设注册表
     │    "原来 MySQL 不支持这种全文搜索"
     │    "这个库在 Windows 上路径分隔符不一样"
     │
     └─ 未解决的技术债务                → 🏷️ 显式标记，不是遗忘
          "Phase 3 必须重构 auth provider"
```

区别不是压缩——是晋升。你不需要把整个堆拍平，你只需要把存活对象升级到下一代的上下文里。

---

## 三个阶段拆解实操

### Phase 完成时（晋升触发器）

在 Phase 结束的 review/fix 循环之后，不要急着进入下一 Phase。问三个问题：

**Q1：这次写的东西里，哪些数据结构和接口被证明了"有长期价值"？**
→ 晋升到 project-memory.md 的核心类型章节

```yaml
# project-memory.md — Survivor 区
domain:
  User:
    fields: [id, email, hashed_password, display_name]
    invariant: email 全局唯一，创建时校验
  Book:
    fields: [id, title, isbn, owner_id, status]
    invariant: status ∈ {reading, finished, abandoned}
```

**Q2：这次哪些假设被打破了？**
→ 写到假设注册表，下一 Phase 不必重蹈覆辙

```markdown
## 假设变更日志

2026-06-27: "数据库连接池默认 10 够用" ❌ 被打脸 → 改 25
2026-06-27: "Vercel 免费层支持 100MB 响应" ❌ 打脸 → 加分页
```

**Q3：这次留下了哪些明知要改但没改的东西？**
→ 显式标记，保证下一 Phase 不会忘记

```markdown
## 遗留债务

- [ ] Phase 3: 将 auth 从 JWT session 迁移到 OAuth2
      原因：先做 MVP，Phase 3 引入第三方登录时必须做
```

### Phase 启动时（加载晋升数据）

进入 Phase 前，只加载三样东西：

```
┌──────────────────────────────────────────┐
│  Phase 2 上下文                          │
│                                          │
│  ├── Product-Spec.md（已确认的 spec）     │
│  ├── project-memory.md（晋升上来的接口）   │
│  │     ├── 存活类型 / 领域模型             │
│  │     ├── 假设变更日志                   │
│  │     └── 遗留债务标记                   │
│  └── DEV-PLAN.md Phase 2 章节（本阶段目标）│
└──────────────────────────────────────────┘
```

不需要整个代码库的 Repomix。不需要上一 Phase 的全部 session 对话。甚至不需要上一 Phase 的全部 DEV-PLAN（那些设计推演已经完成了，存活结论在 project-memory.md 里）。

Token 开销对比：

| 方式 | Token 量 | 注意力分布 |
|------|----------|-----------|
| Full Repomix dump | ~100K-500K | 稀释在全局，关键信号被淹没 |
| JVM 晋升式加载 | ~5K-15K | 集中在本 Phase 所需的存活知识 |

相差一个数量级。

### 跨 Phase 的晋升路径

当一个类型连续 3 个 Phase 都存活、被 3 个以上文件引用，它就不只是 Survivor 了——它应该晋升 Tenured。

```yaml
# project-memory.md — Tenured 区
tenured:
  User:
    fields: [id, email, hashed_password, display_name]
    invariant: email 全局唯一，创建时校验
    phase_origin: 1        # Phase 1 创建
    last_promoted: 3       # Phase 3 确认晋升 Tenured
    ref_count: 7           # 被 7 个文件引用
    stable_since: "2026-06-20"
```

Tenured 区的数据几乎从不改动。进入 Phase 时只读加载，不写入。这对应了 JVM 里 Major GC 频率极低的特征——这些接口已经稳定了，不需要每轮都重新审视。

---

## 和 Repomix 并非互斥

有人会问：那把晋升后的上下文 + 变更文件加入 Repomix 呢？

可以，但不改变本质。因为问题不是"能不能把全量代码传给 AI"——**传得过去不等于啃得动**。哪怕是 200K 窗口的模型，在中间区域注意力仍然衰减。把晋升上下文放在 prompt 开头，把具体变更文件放在 prompt 结尾，中间夹 Repomix 全量 dump——AI 读到中间时已经丢失了开头和结尾的信号。

正确做法是 **分层注入**：

```
prompt 结构
├── [Phase 上下文] — 存活接口 + 本 Phase 目标 (5K-15K tokens)
├── [变更文件全文] — 本 Phase 要改的 3-5 个文件 (10K-20K tokens)
└── (可选) [Repomix 全文] — 放在 model.tool_use 或可折叠区域，
     仅当 AI 主动需要 cross-file 引用时展开
```

这样 AI 的注意力始终集中在最关键的存活知识和待改文件上。全量代码库变成了"按需查阅"的参考，而不是每轮都要被迫阅读的负担。

---

## 收尾

Repomix 解决了一个真实问题（全量代码传不进 context），但它的答案是错的。它用"更大的 dump"去回答"更聪明的筛选"——这在 JVM 里相当于用 Full GC 频率代替分代回收。

而任何一个熟悉 JVM 调优的工程师都知道：分代假设是对的——大多数对象早死，少数存活对象值得晋升。

代码库的信息生命周期也一样：

- 90% 的代码是 Eden 代码 → 写了就是历史，不需要传递给下一 Phase
- 9% 是 Survivor → 晋升到 project-memory.md，每 Phase 携带
- 1% 是 Tenured → 核心域模型，只在被推翻时更新

你不需要压缩。你只需要 **会看哪 10% 值得带走**。

---

*基于 ReqForge 框架 v1.48.6 Phase 边界纪律 + 存活晋升模式的实践经验。
核心文件：核心 `dev-builder` Phase 过渡逻辑（~200 行），`project-memory.md` 三区管理（~50 行）。
架构思想源自与 JVM 分代 GC 的类比——感谢原作者 Philip，你的 GC 讲座比我任何一次 debug 都有价值。*
