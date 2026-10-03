# Phase 4 Owner Review

**PHASE 4 OFFICIAL UI READY FOR OWNER REVIEW**

2026-10-03 · 已落实 Owner 的调试 Sidebar、标题对齐、Hover、星海蓝及底部返回调整 · Version **0.1.4** · Functional Source of Truth 仍为原始 Owner 0.1.22。本轮只完成正式 UI／Presentation；等待 Owner Review，不进入 Phase 5。

## 1. UI 新结构

Header（正式 PNG／名称与版本／当前角色）→ 常驻长条导演开关 → SVG 图标侧栏＋当前页面 → 常驻状态、请求取消与长条“返回”。副 API 页平铺预设规划、导演规划、最高指令；主 API 页为独立提示词库；接口页分连接、模型、生成参数与保存／测试。第四页为导演调试，保留原五类 selector、清除记录和只读业务数据；日志使用 monospace 和独立滚动。移除底部打开调试按钮，不再使用 Debug Modal。关闭窗口只收起 UI。

## 2. 新增／修改文件

新增：

- `assets/official-ui.css`：单一正式主题与共享 Card／Library Row／Editor／Popover／Debug 样式。
- `src/ui/official-presentation.js`：移动已绑定控件、装饰动态条目、焦点／视口适配、资源化展示监听。
- `src/ui/official-director.js`：正式 Presentation factory 包装。
- `tests/phase4-ui.test.mjs`、`tests/phase4-regression.test.mjs`、`tests/helpers/phase4.mjs`。
- `tools/preview-ui.mjs`、`tools/check-ui-browser.mjs`；本地审阅 HTML、14 张截图和浏览器结果。

修改：`entry.js`、`src/director.js`、`tools/compose-dual-mode.mjs` 仅接入展示 hook／正式入口／内存样式；测试 helper 仅增加可选真实 DOM 与正式 factory；README、阶段、架构、测试、出处文档。

未改：Core、Prompt Library 业务源码、生成 Business Runtime、Host adapter、Native Launcher／Floating Presentation 源码、原始 fixture／golden／锁定 hash、稳定 ID、存储 key、导入导出结构与原始 PNG。Hub／Polisher／Registry 工作目录保持干净。Owner 后续授权的版本校对仅同步 product version、manifest、package／lock、脚本模板及标题为 0.1.3；本次展示迭代递增至 0.1.4，额外修改官方主题及 native-launcher.css 的颜色，不改 Motion 几何／时长。

## 3. 与 Polisher 共享的 Design Language

实际读取并核对 Polisher **1.2.1**（commit `5a0a5cf9f4ac7cf5dbb9dac0134d307ad1caa9d1`）的 `assets/theme.css` 与 `legacy-tool.js`。保留布局、字号、细边框、16px 窗口、10px 控件圆角、52px Header Icon、标题层级、连接式侧栏、Hover／Focus 和菜单动效。Owner 后续选择星海蓝参考：主蓝 `#3b82f6`、浅蓝 `#60a5fa`，窗口深海底色 `#071326 → #040b17`、页面 `#091a31`、输入 `#050d1b`。条目、果冻勾选、编辑器、调试、菜单与悬浮球统一蓝色。

原收起按钮移动到 Footer，文字与辅助名称改为“返回”，对象与关闭 handler 不变；顶部开关铺满一行，移除重复的已开启／已关闭 badge。忙碌态以原状态提示及请求取消按钮呈现，同时保留 aria-busy 与 aria-pressed。

没有复制润色工具的业务页面。旧样式只保留为冻结比较来源；正式运行时删除全部旧 style 节点，只有一份新主题生效，不继续叠加历史覆盖。

## 4. 导演保留的特色

海蓝渐变果冻 Checkbox、当前条目的单独回弹、条目名称拖拽、右侧铅笔与三个点、预设只读来源和三组独立提示词库。真实桌面拖动与手机触摸排序均验证；只对被移动的启用条目回弹。

展示层仅处理两个界面事件兼容点：Escape 先收起自身弹出菜单；HTML 鼠标拖动开始后的浏览器 pointercancel 不误清触摸拖动状态。触摸／笔取消、原排序算法、持久化内容和请求取消均保持原样。

## 5. Desktop

1512×859 Chromium 验证。Native 面板 600×780，四个页面切换时窗口高度稳定。页内滚动、卡片列表独立滚动、菜单在 top layer 不裁切且无模糊背景。编辑器实测 **480px 总高／227px 内容高／638px 内容宽**，允许 resize；模板初始三个选项同等样式，焦点在标题。

## 6. Mobile

390×844 触摸模式验证四页均无横向溢出。侧栏、条目操作、库操作保持触摸区域；模板竖排，Footer 常驻，Dialog／Popover 不超屏。经过右侧原生悬浮球的卡片操作只预留局部空间，不移动球、不改变窗口几何。实测手机导出与触摸排序可操作。

390×420 验证键盘可用高度下编辑器与完成按钮可见；展示层监听 visualViewport 高度／偏移并保留 safe-area 间距。此模拟不等于真实 iOS／Android 软键盘验收。

## 7. Native Launcher／Shortcut

继续共用 Phase 3 的 Native Floating Presentation。原始正式 PNG 同时用于 Header、独立悬浮球与 Hub Shortcut，拖动阈值、吸边、尺寸、开合与 Orb ↔ Header 动画不变。开启／收起不重建 Runtime；反复打开只有一个实例。

## 8. Hub Surface

使用锁定的官方 Hub 0.8.1 Runtime／provide 协议测试正式 UI：Hub 出现后撤掉独立球，Shortcut 按 Hub preference 挂载，同一个正式 Panel 可从 Honeycomb／Shortcut 打开。模式交接保留启用状态、提示词、页面、接口字段和当前页面密钥；第四个调试页及其 selector、业务检测记录同样保留。Honeycomb Surface Motion 仍由 Hub 管理。

这里是实际协议＋受控 Surface 的自动验证，不宣称真实酒馆中的完整 Hub／Polisher 组合和 Honeycomb 像素动画已经完成验收。

## 9. Accessibility／Interaction

四个 SVG Tab 有名称、role、aria-selected、关联 Panel 与键盘 Up／Down／Home／End；焦点可见。开关使用 aria-pressed，状态保留 live region。编辑器关闭后恢复焦点，Escape 与完成／取消继续现有保存语义。菜单可二次点击收起、再打开和 Escape 关闭。保留禁用态、只读说明、手机触控与 reduced motion。卸载时清理 observer／监听，旧控件不能重新运行。

API Key 继续 password；记住密钥仍为主动勾选，风险说明保留，不随设置或提示词导出。Debug 的五类 selector／清除控件／PRE 为原来已绑定的同一 DOM 对象，展示在第四个普通页面，切换侧栏不清除数据。隐私提示强调完整聊天上下文、角色资料和私人内容，提醒分享前删去敏感信息。旧 dialog 仅留下不可见的清理兼容壳，不提供打开入口；数据生成、清理聊天记录及请求逻辑不改。

标题采用实际 Polisher 的“名称 + 版本号”与“当前角色”布局。条目名称的独立 hover／active 色块已移除，仍保留整条目的边框反馈、铅笔／更多按钮反馈和键盘焦点。

## 10. 新增测试数量

新增 **88 项仓库测试**：37 项正式 UI＋真实 DOM 的业务 golden 差分，51 项正式 UI／交互／生命周期检查。另有 **48 项真实浏览器断言**。共新增 **136 项**自动检查。

## 11. 总计 PASS／FAIL

- 原有 **333 PASS／0 FAIL**，业务断言、fixture 与 golden 未改；版本一致性断言按 Owner 要求校对并迭代为 0.1.4，历史基线版本仍为 0.1.22。
- 仓库总计 **421 PASS／0 FAIL**。
- 真实浏览器 **48 PASS／0 FAIL**。
- 合计 **469 PASS／0 FAIL**。
- `check:source`：原 0.1.22 content 字节一致。
- `check:runtime`：生成 Runtime 仍与已审计的 Phase 3 推导一致。
- `check:entry`：正式入口＋原始图像＋正式样式编译通过（仅内存）。

0.1.4 已重新运行仓库回归、入口检查和真实浏览器检查，截图与尺寸记录同步更新。浏览器检查零页面错误、零远端请求；运行的是虚构聊天、演示预设与页内模拟接口，没有调用真实模型或读取 Owner 聊天。

## 12. Business Regression

**未发现。** 固定输入的 expert messages、writer messages、规划、过滤、路由、失败条件、Debug 与存储逐项对照原版 golden。仅适配真实 DOM 空状态文本为 `''` 而历史 fake DOM 为 `undefined` 的观察差异；消息与业务数据不做归一化、不重录 golden。

D-001／D-002／D-003 继续冻结并复现原行为。没有改提示词、story_scene／story_driver、API 行为或 active cancel／abort。

## 13. 截图／人工检查入口

[本地交互预览](../review/phase4/official-ui.html) 使用实际正式入口，无需导入酒馆。可用“模拟一轮”查看虚构 Debug 输出；点击球、侧栏、库操作与弹窗检查交互。

[浏览器结果与实测尺寸](../review/phase4/browser-results.json)

[桌面主窗口](../review/phase4/desktop-expert.png) · [接口配置](../review/phase4/desktop-api.png) · [编辑框](../review/phase4/desktop-editor.png) · [模板](../review/phase4/desktop-template.png) · [菜单](../review/phase4/desktop-popover.png) · [调试](../review/phase4/desktop-debug.png)

[390px 主窗口](../review/phase4/mobile-expert.png) · [主 API](../review/phase4/mobile-writer.png) · [接口配置](../review/phase4/mobile-api.png) · [导演调试](../review/phase4/mobile-debug.png) · [编辑框](../review/phase4/mobile-editor.png) · [模板](../review/phase4/mobile-template.png) · [菜单](../review/phase4/mobile-popover.png) · [键盘可用高度](../review/phase4/mobile-keyboard-height.png)

复现命令见 [TESTING.md](TESTING.md)。预览是审阅工具，不是发行脚本或安装包。

## 14. Phase 5 前需要 Owner 决定的事项

请确认整体视觉、条目密度、手机字号／操作触感、编辑框比例及是否接受为正式 Presentation。真机软键盘／safe-area、实际酒馆＋Hub＋Polisher 的共存与性能仍按 Phase 6／7 验收。是否进入 Phase 5 由 Owner Review 决定；后续正式版本、发行范围和 Deferred 的处理继续另行决定。

产品版本先按 Owner 要求校对为 0.1.3，本次展示迭代为 0.1.4，原始 0.1.22 基线保持字节一致。无 Push、Tag、Release、Package Release、Catalog Submission；没有修改 Hub、Polisher 或 Registry。**停在 Phase 4。**

Owner 已于 Phase 5 请求中确认 Phase 4 Review 通过；本轮不重设计已接受 UI。
