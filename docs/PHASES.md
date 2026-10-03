# Owner 确认的实施顺序

| Phase | 工作 | 当前状态 |
| --- | --- | --- |
| 1 | 0.1.22 frozen behavioral baseline | 已通过 Owner Review |
| 2 | 本地 Repository／Productization Foundation | 已通过 Owner Review |
| 3 | factory＋Hub／Standalone dual-mode adapter | 已通过 Owner Review |
| 4 | Polisher 1.2.1 Design Language 与新 Icon 接入 | 已通过 Owner Review |
| 5 | Package v1、build、metadata、validation | 已完成；本轮对 0.2.0 重新验证 |
| 6 | 完整 automated regression＋integration | 本轮重跑全部自动检查；真实组合验收仍待 Owner |
| 7 | Owner 真实酒馆 PC／Mobile 人工验收 | PENDING；已转为 post-release manual smoke test / follow-up |
| 8 | GitHub Release | Owner 已授权冻结 0.2.0 正式首发；不等待人工 smoke test |

阶段 1–3 不改变 active request、abort、过滤、提示词、Debug 或 API 配置语义。阶段 3 只改宿主生命周期／Presentation ownership／停用清理。Phase 4 只接入正式 UI／Presentation；不改变上述业务与宿主行为。正式 Icon 已用于 Header、Native、Shortcut 与 Hub metadata；窗口视觉见 Phase 4 Review。Deferred 问题不进入本轮修复。任何无法在保留行为前提下继续的实际适配阻塞，先报告 Owner。

Owner 已将产品版本校对为 0.1.3，本次星海蓝／返回按钮迭代递增至 **0.1.4**；产品声明、界面和脚本模板统一版本，小迭代递增最后一位。原始 0.1.22 功能基线不变。仍然不创建远端、不 Commit／Push、不 Tag／Release、不修改 Hub、Polisher 或 Registry。

后续 Owner 授权替换三条默认提示词，并要求默认条目只读、禁止删除和排序、新建条目置顶。本次产品迭代为 **0.1.5**，通过配置读取边界及产品 UI 保护实现；冻结 Core／业务 Runtime 不变。Phase 5 的 0.1.4 报告保留为历史证据，不将本次修改视为 Phase 5 Owner Review 已通过。

## Final RC Freeze

Owner 随后确认当前功能、UI 和默认提示词，并指定 **0.1.5 实际实现**为 0.2.0 的最新功能基线。此前的 0.1.22 继续作为历史参考；不回滚 0.1.5。当前只统一版本为 0.2.0、重新构建、验证及检查待公开内容。全套结果见 [FINAL-RC.md](FINAL-RC.md)。Deferred 继续保留，不创建远端、不 Push／Tag／Release／投稿 Catalog，不修改 Hub、Polisher、Registry。

## 正式发布授权

Owner 于 2026-10-03 批准自动 RC 并授权公开仓库、main、v0.2.0 Tag、正式 Release 和公网验证。此授权取代上一阶段的发布禁令；人工 Desktop／Mobile／Real API 保持 PENDING，转为发布后跟进。仍禁止 Catalog 投稿以及修改 Hub、Polisher、Registry。详见 [RELEASE-PLAN.md](RELEASE-PLAN.md)。
