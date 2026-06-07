# UI-Spec Template

> 页面需求 → UI Spec → 视觉参考 → 代码实现。
> UI Spec 是 design-maker 自动生成的中间产物，dev-builder 读取后替代从像素猜结构。
> 用户不维护此文件，下次重新跑 design-maker 即更新。

---

```yaml
page:
  name: 页面名称
  purpose: 页面要解决什么问题
  target_user: 目标用户
  primary_action: 用户在这个页面的核心操作

layout_type: dashboard | form | list | detail | landing

sections:
  - name: 模块 1
    purpose: 模块作用
    priority: high | medium | low
    component_type: Card | Table | Form | Tabs | Chart | List
    states:
      - normal
      - loading
      - empty
      - error
    child_components:
      - name: 子组件 1
        type: Button | Input | Select | Badge
        states: [normal, disabled, active]

  - name: 模块 2
    purpose: 模块作用
    priority: high | medium | low
    component_type: Card | Table | Form | Tabs | Chart | List
    states:
      - normal
      - loading
      - empty
      - error

responsive:
  desktop:
    layout: 多列 / 侧边栏 + 主区 / 全宽
    breakpoint: "≥ 1024px"
  tablet:
    layout: 2 列 / 上下堆叠
    breakpoint: "768–1023px"
    changes:
      - 侧边栏收为顶栏汉堡菜单
      - 卡片从 4 列变 2 列
  mobile:
    layout: 单列
    breakpoint: "< 768px"
    changes:
      - 多列卡片变为上下排列
      - 表格变为卡片列表
      - 隐藏非核心辅助信息

reusable_components:
  - name: 数据卡片
    file: src/components/DataCard.tsx
    used_by: [模块 1, 模块 2, 模块 3]
    states: [normal, loading, empty, error]
  - name: 状态标签
    file: src/components/StatusBadge.tsx
    used_by: [模块 2]
    states: [success, warning, error, default]

acceptance:
  - 所有核心功能在桌面端可完整操作
  - 移动端核心路径可完成，无交互阻塞
  - 空/加载/错误态均已覆盖
  - 超长文本/大量数据时布局不溢出
  - 模板块可通过 `responsive.changes` 响应式调整
```
