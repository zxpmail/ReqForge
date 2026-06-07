## 来源

唐巧《让 Claude Code 在你睡觉时持续运行》——检测 Claude 在自主模式卡住等人类回答的场景，自动跳过或用默认值继续。

## 问题

Claude Code 在 -p（非交互）模式或长时间自主运行时，遇到需要用户确认的问题会卡住等待，导致整夜空转。

## 方案

PreToolUse hook 检测 tool 调用意图：
1. 当检测到 request-human-input 或类似阻塞人类回答的模式时
2. 自动注入默认答复："use best judgment, proceed with the most reasonable option"
3. 记录已被自动跳过的决策点，方便后续审查

## 不做（如果否决）
- Forge 并非以过夜自主运行为主要场景
- Machine Gate 本质上就是需要人类判断的拦截点，两者目标相反
- 误自动决策的风险可能大于卡住的风险

## 状态

提议待评估。实现路径：在 core/hooks/ 下新增 no-ask-human.sh / .bat，作为可选 hook，默认不启用。

GitHub Issue: https://github.com/zxpmail/ReqForge/issues/4
