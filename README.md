# 咩咩故事导演 / MieMie Story Director

咩咩故事导演让一个副 API 先规划本轮故事，再把大纲交给酒馆原本的主 API 扩写。玩家可以分别配置导演规划、最高指令和主 API 提示词；调试页可以检查实际发送的上下文与交接结果。

当前版本 **0.2.0**，首次正式 MieMie Extension Package v1。Owner 已确认功能、UI 和默认提示词；最新功能基线是已批准的 **0.1.5 实际实现**，包含三条固定默认提示词。0.1.22 继续作为原始实验基线和兼容回归参考。

自动验证 **569 PASS / 0 FAIL / 0 SKIP**。Desktop manual、Mobile manual、Real API manual 均为 **PENDING — post-release manual smoke test / follow-up**。Owner 已授权在人工 smoke test 前发布；自动检查不能代替人工验收。

## 工作方式与适配范围

1. 在单人角色聊天中开启故事导演，普通发送或重新生成时，副 API 收到经过既定过滤的上下文、预设规划和已启用的自定义提示词。
2. 副 API 输出报告。只有唯一、完整的 `<story_scene>…</story_scene>` 内文交给主 API，报告标签外的说明保留在调试中。
3. 大纲替换本轮玩家输入的原位置；主 API 提示词替换预设对应的故事驱动规则，再由主 API 生成预设要求的完整回复。

当前针对**咩咩预设的故事模式**，功能基线对应 **5.8.2**。预设须保留脚本依赖的规划变量与格式条目结构。其他预设、群聊和非故事模式不在当前适配承诺内。主接口需要酒馆的 OpenAI 聊天补全模式；副接口需要兼容 OpenAI 的聊天补全 API。续写、静默与代替用户生成不进入导演规划流程。

## 安装

从 [0.2.0 Release](https://github.com/SheepSheepLab/MieMie-Story-Director/releases/tag/v0.2.0) 获取附件。**酒馆助手直接导入只需一个文件**：

[MieMie-Story-Director-Extension-0.2.0.json](https://github.com/SheepSheepLab/MieMie-Story-Director/releases/download/v0.2.0/MieMie-Story-Director-Extension-0.2.0.json)

首次迁移前请备份提示词库，停止生成并停用旧 0.1.22。不要同时启用两个故事导演。不要把更新元数据或 `manifest.json` 当作酒馆脚本导入。正式安装包的 `data` 为空，已有设置从原酒馆扩展存储读取。

### 独立使用

在酒馆助手的全局脚本中导入单文件并启用。刷新后点击「咩咩导演」浮动入口，选择提示词与接口；打开单人聊天后再开启顶部的「故事导演」开关。关闭开关后使用原单 API 流程。「返回」仅收起界面；重新打开后仍能查看当前记录。

### MieMie Hub 使用

同时启用兼容的 MieMie Hub 时，脚本通过 Hub 的扩展入口打开；也可按 Hub 设置使用 Shortcut。Hub 退出后恢复独立入口，切换不会新增第二个业务实例。正式 Package 的安装管理协议按 **Hub 0.8.1 / Extension API v1 / Package v1** 验证。

在兼容的 Hub 中使用仓库地址 [SheepSheepLab/MieMie-Story-Director](https://github.com/SheepSheepLab/MieMie-Story-Director) 检查 Package。当前尚未投稿 Hub Catalog；真实酒馆安装与组合使用仍属于发布后人工跟进项目。

## 接口配置

在侧栏「接口配置」填写副 API 的基础地址（一般以 `/v1` 结束）、模型和密钥。脚本提供模型列表获取、手填模型及连接测试。按界面保存接口配置后开启导演。输出上限和超时沿用现有设置；主 API 仍由酒馆配置。

地址不能附带账号密码、查询参数或片段。接口是否可访问仍受浏览器跨域、网络和服务商权限影响。连接测试会发送一个很短的实际请求，可能计入服务商用量。

## 提示词库

副 API 页面平铺「预设规划」（只读）、「导演规划」和「最高指令」；主 API 页面是独立的主提示词库。

首次使用时，导演规划为空，最高指令依次为「禁止-默认」「大纲输出提示词-默认」，主 API 为「思维链-默认」。这三个默认条目固定在各自列表底部，不可编辑、删除或排序；可以开关、导出，也可以在只读编辑器中滚动、选择、复制。关闭默认后可使用自建规则，再次启用即可恢复默认内容。

新建与导入的 DIY 条目从列表顶部插入，支持多条启用、按顺序拼接、编辑、删除及相互拖拽排序。名称区域用于排序，铅笔打开编辑器，更多菜单包含单条导出与删除；默认条目的删除按钮置灰。修改自动保存。导演规划新增可选单一、多合一或空白模板。

升级保留已有 DIY 内容和启用状态。未修改过的旧默认更新为本次默认；被玩家修改过的旧默认保留为普通 DIY。已有库缺失的默认补回为关闭状态，避免改变原有启用组合。详见 [默认提示词说明](docs/DEFAULT-PROMPTS.md)。

提示词中的 `{{getvar::变量名}}` 按原有预设变量读取流程展开。主 API 库仅需填写规则内文，脚本负责既定 wrapper。提示词文件格式保持 `meeme-director-requirements` / version 1。导入不会共享不同库的启用状态或修改其他库。

## 调试与隐私

侧栏「导演调试」保留五类检测：本轮概况、规划规则、副 API 请求、导演报告、主 API 上下文；可选择查看和清除记录。切换页面不会清除数据。日志使用独立滚动和等宽字体。

**Debug 可能包含完整聊天上下文、角色资料、玩家输入及导演报告。分享截图或复制记录前请自行检查私人内容。** 已知当前密钥按原有逻辑遮蔽，这不等于会自动脱敏所有聊天资料。调试数据不会随公开安装包分发。

副 API 会收到本轮经过既定过滤的上下文；主 API 会收到其正式生成上下文和大纲。数据会发送给你选择的服务商。

密钥默认仅在当前页面使用。主动选择「记住」并保存接口后，密钥保存在同一浏览器、同一酒馆来源的 localStorage，**不是加密保险箱**。可以取消记住或清除密钥。普通配置／提示词导出和公开脚本不携带个人密钥；换浏览器或重新加载未记住的密钥需要重新填写。

## 从 0.1.22 迁移

正式包继续使用 `meeme_story_planner_v1` 保存三套库与接口配置，密钥偏好继续使用 `meeme_story_director_api_key_v1`。旧实验版不等于 Package v1 安装，Hub 不负责自动识别或停用它。

按 [迁移指南](docs/MIGRATION.md) 先停用旧脚本再安装；本轮已用旧存储模拟数据验证兼容，但真实酒馆持久保存仍须人工确认。不要通过清空扩展变量来“完成迁移”。

## 兼容性与验证

需要支持预设读取、扩展变量和生成事件的酒馆助手，以及提供相应上下文的 SillyTavern。Hub 协议校验使用锁定的 0.8.1 正式代码，未宣称覆盖任意历史版本。界面需要现代浏览器的 dialog、popover、SVG 等能力。

最终版本的结果和哈希见 [Final RC 报告](docs/FINAL-RC.md)，测试范围见 [测试说明](docs/TESTING.md)。[Phase 5 报告](docs/PHASE-5-REVIEW.md) 仅记录历史 0.1.4，不能用其大小或哈希验证 0.2.0。真实酒馆桌面、Hub 组合与实体手机检查见 [人工验收清单](docs/PREFLIGHT.md)，目前未代为执行。当前范围和后续事项见 [已知限制](docs/KNOWN-LIMITATIONS.md)。

## 本地构建

Node.js 22 或更新版本；安装依赖仅用于构建／测试，运行时无需 Node.js：

```sh
npm ci --ignore-scripts
npm run check:source
npm run check:runtime
npm run check:entry
npm test
npm run build
npm run check:package
npm run check:reproducible
```

`build/` 输出单脚本、更新元数据、Manifest 和 SHA256SUMS。构建不包含时间戳或随机构建 ID，校验失败会终止。完整规范、信任边界与发布步骤见 [Package 说明](docs/PACKAGE.md) 和 [Release 记录与后续安排](docs/RELEASE-PLAN.md)。

## 授权与品牌

软件代码采用 **GPL-3.0-or-later**，见 [LICENSE](LICENSE)。**咩咩角色、Logo、Icon 及指定美术资产不包含在软件 GPL 授权中**，使用范围见 [BRAND.md](BRAND.md) 与 [ASSETS-LICENSE.md](ASSETS-LICENSE.md)。正式 Icon 使用 Owner 确认的扩音器与场记板原始 PNG，透明度保持原样。参考代码和开发依赖说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
