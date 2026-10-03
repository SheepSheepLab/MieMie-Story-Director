# Phase 1–5 Test Plan 与覆盖

基于 Owner 原始 0.1.22。Node >=22；安装固定开发依赖后，所有测试离线运行。运行 `npm ci --ignore-scripts`，再执行 `npm run check:source`、`npm run check:runtime`、`npm run check:entry` 与 `npm test`。

## 测试分层

| 层 | 检查数 | 说明 |
| --- | ---: | --- |
| 保留历史断言：冻结原版 | 70 | 直接运行保存的原始 JSON content；Core 为从相同 JSON 提取的冻结副本。 |
| 保留历史断言：拆分源码 | 70 | 使用新工程组装出的完整 source；同一套断言，宿主为模拟。 |
| Core 固定结果＋新旧差分 | 38 | 原版先核对 golden，候选再逐项核对原版；包括结果和精确错误。 |
| Runtime 固定结果＋新旧差分 | 37 | 请求 body、路由、调试、写存储、聊天记录、状态与取消信号。 |
| Product／文件／授权基础 | 12 | 原始 hash、逐字拆分、稳定 ID、版本、Manifest 声明、Icon 原图、许可及阶段边界。 |
| 回归检测灵敏度 | 2 | 仅在内存制造“追加大纲”与“改主请求 stream”偏差，验证对照能检测；不写候选源码。 |
| 实质检查总计 | **229** | Node test 另将两个历史套件父节点计为测试，总输出 **231**。 |

上述原有 **231 项全部保留且通过**。新增 Phase 3 为 **102 项**：37 项真实 factory 与冻结 Runtime golden 对照，1 项可审计派生检查，37 项生命周期／交接／资源，16 项共用 native presentation，11 项可执行入口／图像／失败回滚／迟到响应／UI 原样检查。总计 **333 PASS / 0 FAIL**（含原有两个父节点）。

Phase 3 DOM 测试运行正式 Hub 0.8.1 的原版 Runtime 与 source provide/ready/release 块，Surface 边界由受控 DOM 回调提供。参考提交／文件 hash 见 `tests/fixtures/phase3-references.json`。Polisher 1.2.1 的 native presentation 合同测试适配在本工程内，测试不依赖兄弟仓库。

双模式覆盖：独立、Hub、反复出现／丢失／立即替换、早期 disposal 通知、延迟停用、重复激活／打开、close／deactivate 区分、新会话重新启用、Hub preference 禁用、Shortcut 开关、旧版前后加载、两层重复保护、fetch 包装器前后安装及任意清理顺序。还检查迟到 headers／body／导入不更新界面或发主请求，设置／记住密钥／未保存密钥／模型列表／历史密钥遮蔽的保留与释放。

## 固定输入覆盖

- planning：set 覆盖、add 追加、关闭条目、嵌套宏来源、动态新变量、缺故事模式／ini、晚写入、宏未闭合、未展开／空值。
- prompts：预设＋DIY＋最高指令顺序、多条启用、身份别名、只读 getvar、空值、禁止写入、主提示词 wrapper。
- filtering：指定模板、历史保留、原格式插入、唯一锚点、缺失／重复锚点、保留标记与错误 role。
- handoff：唯一 story_scene 内文、空／嵌套／多个／属性／未闭合标签、原位置替换、角色／元数据／尾部顺序、输入不变、玩家输入歧义。
- routing：关闭、normal、swipe、regenerate、continue、quiet、impersonate、缺标记、主接口不支持、tools／多候选。
- response：副接口 HTTP 错误、协议 JSON 错误、截断、reasoning-only、重试。
- lifecycle：timeout、显式取消、预先 abort、切聊天、编辑／删除／swipe／updated、等待期间切预设、cleanup。
- libraries／configuration：自动保存、导入导出、三库隔离、已有迁移、删除默认不复活、模型列表、连接测试、密钥选存及清除。
- presentation 当前断言：名称拖拽、触控排序、单条果冻、更多菜单开关／边界、侧栏／编辑器。
- Deferred：响应头后 abort 不联动、READY 到 dispatch 编辑仍继续、上游改写后的精确 body 匹配拒绝，均保持现状。

## 完整性与独立性

Fixture 的原 JSON、content、Core、原断言套件、golden 均锁定 SHA-256。候选 source 重组后在 Phase 2 要求完整字节一致。测试只从本仓库读取，不依赖旧工作目录、兄弟 Hub／Polisher 仓库或 Owner 私有预设。

固定数据是虚构 preset／chat，API 地址为 `.example`，网络调用由测试宿主响应。`private-test-key` 是明确的历史测试字符串，并非 Owner 密钥；只在测试文件和模拟输出中出现，不在候选业务源码或打包模板中。

ID 生成在模拟宿主中固定，避免随机值影响 golden；实际业务源码的生成方式未变。golden 从冻结原版一次性生成，已有文件不能由记录工具覆盖。测试运行不写 expected outputs。

## 后续验收

Phase 3 的 factory／DOM／协议测试已完成，完整 Hub UI＋真实酒馆＋Polisher 组合仍属后续 Phase 6；Package 发行构建已在 Phase 5 完成本地验证。Phase 4／7 再做实际浏览器视觉与 PC／Mobile 人工验收。jsdom 与受控动画不验证像素布局、CORS、真实酒馆数据持久化或手机动画性能。D-003 未被修复，也没有宣称组合共存已经通过。


## Phase 4 results

The original 333 tests pass. Business assertions, fixtures and golden remain
unchanged; the version-consistency assertion now checks Owner-approved patch progression to 0.1.4
separately from frozen baseline 0.1.22. Added 88 repository
tests: 37 actual official-UI / real-DOM runtime scenarios against the original
locked golden, plus 51 UI/lifecycle/accessibility checks. Total: 421 PASS, 0 FAIL.
The real DOM represents untouched text as an empty string; only an empty API
status label is omitted when comparing to the historical fake DOM's undefined
label. Requests, messages, planning, filtering, errors, storage and Debug data
are compared without normalization. No golden/lock/legacy assertion was changed.

`tools/check-ui-browser.mjs` runs the actual compiled production entry in a
wholly synthetic host using Playwright Chromium. It adds 48 browser checks;
results and screenshots are under `review/phase4`, refreshed for 0.1.4. It requires a developer
Playwright module/browser installation, not a runtime dependency. Optional:

```sh
node tools/preview-ui.mjs
MIEMIE_PLAYWRIGHT_MODULE=/path/to/playwright \
PLAYWRIGHT_BROWSERS_PATH=/path/to/browsers node tools/check-ui-browser.mjs
```

Verified viewports: 1512×859, 390×844, and 390×420. Native HTML dialog/popover,
actual touch sorting, reachable export beside the orb, real download schema,
keyboard sidebar/focus/Escape, fourth-page Debug navigation, private notice, independent log scrolling, title hover, Starsea Blue, full-width toggle/Return, individual animated jelly
and reduced motion are checked. No remote request or page error occurred.
Desktop editor measured exactly 480px overall / 227px textarea / 638px textarea
width. Main panel height stays stable across the four pages.

A 390×420 viewport simulates available keyboard height; it does not verify a
physical IME or iOS safe areas. Full real Tavern + Hub + Polisher integration,
physical PC/mobile feel and performance remain later-phase
Owner/integration acceptance. Hub tests use the locked official protocol with a
controlled Surface boundary; no pixel claim about Hub Honeycomb is made.

## Phase 5 Package / Build / Release Hardening

新增 **79** 项测试，原有 **421** 项全部保留。总计 **500 Node PASS / 0 FAIL**；既有 Chromium 检查本轮重跑 **48 PASS / 0 FAIL**，合计 **548** 项通过。

Package tests 71 项，migration/actual packaged entry tests 8 项。覆盖两份干净临时 checkout 离线 npm ci、逐字节确定性构建、实际 metadata/hash、首行 identity、Manifest/版本/仓库/固定 UUID/入口一致、空 data/export schema、原 PNG alpha/hash、损坏 JSON/UTF-8、未知字段、16 MiB/64 KiB 上限、缺资产、内容 hash、secret/local-path/dev fixture 扫描、重算 hash 的运行注入与 Manifest 篡改。AST 检查证明注释清理没有改写实际生产代码。

实际 Hub 0.8.1 manager 测试包括 inspect/install、随机安装实例 ID、固定包 scriptId、重复安装拒绝、原 0.1.22 不自动识别、GitHub digest/path/size 与 metadata 不一致、缺 metadata/asset、下载同大小损坏和 Release 在预览后变化；拒绝场景均检查未写入脚本树。HTTP 数据边界受控，不使用真实 GitHub API，不代表已取得线上 asset digest 或确认服务器保存。

迁移 tests 分别执行原实验 JSON 和最终正式 artifact，验证历史 extension storage 的三库、启用顺序、API 配置、保存命名空间，旧密钥偏好及不匹配地址／不记住／清除行为；正式 Hub 安装结果继续实际启动入口并发送模拟请求、显示 Debug，原重复保护保留。

`npm run test:package` 仅运行新增 79 项；`npm test` 运行全部 500 项。运行 `npm run build`、`npm run check:package`、`npm run check:reproducible` 验证落盘产物和两个 fresh checkout。完整记录在 `review/phase5/`。没有更改 frozen golden、原始 fixtures 或保留断言来适应新包。

## 0.1.5 Owner 默认提示词迭代

新增 16 项实际产品／安装产物测试：默认原文与顺序、空规划、只读选择复制、删除不可执行、固定默认与自建条目排序边界、置顶新增、开关保存、旧改动保留、宏展开与既有交接位置、Hub 重挂载。既有 migration 测试继续对照旧存储；针对 Owner 新要求补回的关闭默认，只过滤固定内置 ID 后比较原 DIY，不改变 fixture 或 golden。全库现为 **516 Node PASS / 0 FAIL**。

浏览器检查在独立的 `review/prompt-defaults-0.1.5/` 输出，保留 Phase 4／5 历史证据。既有桌面排序检查使用两个新建 DIY 条目，固定默认另行验证禁止排序。新增两库只读选中、默认删除禁用、键盘／鼠标拖拽越界与手机触控越界保护，共 **53 Chromium PASS / 0 FAIL**。依旧只运行虚构宿主，不连接真实酒馆或服务商。`MIEMIE_REVIEW_DIRECTORY=review/prompt-defaults-0.1.5/` 可指定这一轮的输出目录。

合计 **569 PASS / 0 FAIL**。冻结 0.1.22 重构、Runtime 派生、入口编译、Package 原版校验与两份干净源快照构建均独立检查；原有业务及历史黄金断言仍保持通过。

## 0.2.0 Final RC Freeze

以 Owner 已批准的 0.1.5 实现为当前功能依据，重新执行完整检查：**516 Node + 53 Chromium = 569 PASS / 0 FAIL / 0 SKIP**，没有复用上一版的测试结果。涵盖 Business regression、Lifecycle、Dual-mode、Package、Build、Migration、默认条目、UI 和浏览器交互。标题版本断言跟随 0.2.0；历史 fixture/golden 不改。

另行对比 0.1.5 与 0.2.0：全部 19 个实现／资产文件逐字节未改；产物只在明确的版本字段不同，归一化这些字段后脚本整体相同。Negative scan tests 的合成路径改为运行时拼接，生成值与断言不变，避免公开源码含绝对路径样例。

本次实际 Package 使用锁定的 Hub 0.8.1 原版校验器，重新计算大小、文件 SHA 与 content SHA；两份独立干净 checkout 重新离线安装依赖、构建、验证，结果见 [FINAL-RC.md](FINAL-RC.md)。本地报告目录为 `review/final-rc-0.2.0/`，受 .gitignore 排除；不公开临时预览、截图和原始日志。

真实酒馆 Desktop、实体 Mobile、Real API：**PENDING OWNER MANUAL ACCEPTANCE**。这三项不计入自动 PASS 或 SKIP，均保留独立人工验收状态。

## 正式发布前复核

Owner 授权使用冻结 0.2.0 正式发布后，重新运行 516 Node 与 53 Chromium 检查，全部通过；产物两层 SHA 保持 Final RC 冻结值。正式首发须另行核对实际 commit 的干净构建、GitHub 真实 digest、公开下载与原版 Hub Package v1 校验。本地记录保存在被忽略的 `review/release-0.2.0/`。Desktop／Mobile／Real API manual 均为 PENDING，作为 post-release manual smoke test / follow-up，不作为自动 PASS。
