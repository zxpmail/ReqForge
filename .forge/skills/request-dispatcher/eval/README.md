# Skill Eval 模板

用户项目自定义 Skill 的评估包。复制到：

```
.forge/skills/<skill-name>/eval/
├── triggers.json         # 触发准确率用例（人工在 Agent 中验证）
├── cases.json            # 输出质量断言（可对 eval-output/ 跑静态检查）
└── rejected-edits.json   # 被拒 Skill 编辑（SkillOpt 负样本缓冲）
```

```bash
pnpm skill-eval init <skill-name>    # 生成上述目录
pnpm skill-eval <skill-name>         # 静态校验 + 对已存在产物跑断言
```

详见 [core/docs/skill-eval.md](../../docs/skill-eval.md)。
