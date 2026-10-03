# Phase 5 Owner Review / Release Candidate

**PHASE 5 RELEASE CANDIDATE READY**

2026-10-03。只修改 build、packaging、metadata 校验、测试和文档。已接受的 Phase 4 UI、Business/Core、主副 API、规划／过滤／交接／路由和 Deferred 行为未改。未修改 Hub、Polisher、Registry。

## 结果（Owner 要求的 15 项）

| # | 项目 | 结果 |
| --- | --- | --- |
| 1 | Package v1 | PASS；直接调用固定提交的 Hub 0.8.1 原版 validator / manager |
| 2 | artifact | `MieMie-Story-Director-Extension-0.1.4.json` |
| 3 | artifact size | **2,926,216 bytes**；16 MiB 上限内 |
| 4 | artifact SHA-256 | `9301050c2b0257221d54b5d6dd19bed94ee6034658954a478eae995749de74d1` |
| 5 | content SHA-256 | `8671353af8827a02433f83f4a77ca4db5edbae7790cedb3c26c2dfdf18c4368e` |
| 6 | identity consistency | PASS；源码、Manifest、首行、metadata、固定 UUID 和实际入口一致 |
| 7 | reproducibility | PASS；两份临时 detached clean checkout，离线锁定依赖安装后，四个文件逐字节一致 |
| 8 | 新增 tests | **79**（71 Package / build / release + 8 migration / packaged entry） |
| 9 | 总 PASS / FAIL | **500 Node + 48 Chromium = 548 PASS / 0 FAIL**；原 421 Node 保留 |
| 10 | 公开包扫描 | PASS；常见 credential / private key / local path / dev fixture；data 空 |
| 11 | migration | PASS；原 extension storage 的三库、API 配置、旧 Key preference 和既定 Key 行为保留 |
| 12 | README / docs | 正式使用说明、Package、迁移、限制、测试、许可、发布计划已整理 |
| 13 | 人工 Checklist | `docs/PREFLIGHT.md`；Desktop / Hub / Mobile / migration。真实验收尚未执行 |
| 14 | 建议正式版本 | **0.2.0**；表达首次正式 Package 的 MINOR 里程碑，由 Owner 确认后下一轮统一修改 |
| 15 | blocker | 自动 RC 检查无阻塞；公开发布仍待 Owner Review、版本决定、真实验收与真实 GitHub digest 核对 |

## 版本说明

附件沿用了“源码 0.1.22”的表述，实际当前产品声明在此前 Owner 的版本校对与 UI 小迭代后已统一为 **0.1.4**。本阶段保持实际现有版本，**未升版或回退**。原始 0.1.22 继续只作冻结功能基线。发布候选建议和 SemVer 理由见 `RELEASE-PLAN.md`；0.1.23 可表达实验补丁，0.2.0 更适合工程化首次 Package，当前不建议 1.0.0。

## 产物及校验证据

`build/` 共四个文件：单脚本、MieMie-Extension-update.json、manifest.json、SHA256SUMS。直接导入只需要单脚本；未制作压缩包。大小、两层 hash、tag、asset name 都由实际构建生成，没有手工重复维护。content 首行 exact identity：schemaVersion=1、productId=miemie.story-director、scriptId=fc2d2ead-68af-43fc-904d-a72ece07277b、version=0.1.4、repository=https://github.com/SheepSheepLab/MieMie-Story-Director。

正式原始 Icon SHA：`a905de0f6ea29bf659b2b6827cb35101f5ea64a5dfdb720b45c5487d1190205e`。1254×1254、8-bit RGBA；内嵌字节与批准 PNG 相同，alpha 保留，不重绘或重编码。代码 GPL-3.0-or-later；角色、Logo、Icon 与指定美术资产排除于软件 GPL，artifact info、README 和现有资产说明保持一致。

证据：`review/phase5/package-validation.json`、`reproducibility.json`、`regression.log`、`browser-results.json`、`source-check.log`、`runtime-check.log`、`entry-check.log`。原验收的 48 项浏览器检查再次通过；实际最终单脚本另外被执行，迁移及模拟主／副请求通过。业务源码精确还原和受控 Runtime 派生检查通过；AST 校验保证发行注释清理不改可执行内容。

## 检查的实际边界

- Hub参考为真实正式代码：commit `36aaec46282e67bd01b87035165977a40d23acc9`，原样副本及 SHA 锁定。安装测试使用受控 GitHub响应，验证正式检查流程、字段和 digest 检查，并不代表已发布 Release。
- Hub install 内存写入返回 persistence=unconfirmed；未宣称实际服务器保存已经完成。下载代码由单独测试宿主启动验证，Hub validator 本身不执行它。
- 扫描为常见模式＋锁定来源／入口内容检查，不能单独证明任意未知 Secret 均可识别。public storage key 名称不是密钥值。测试只用虚构数据，不读 Owner 实际聊天或 Key。
- 原仓库尚无 commit history；仍为未跟踪源码，未宣称该原工作树是干净已提交状态。确定性检查在自动删除的临时 Git snapshot 中创建两个干净 checkout，不改变项目提交历史。最终提交后须重跑最终 commit 的 clean build。
- 真实 Tavern、服务商／CORS、完整 Hub + Polisher组合、实体手机键盘和 safe area仍需人工检查。未把 Deferred 改成新严重缺陷或在本轮修复它。

## 修改范围与停止点

新增 `tools/package-v1.mjs`、`build.mjs`、`validate-package.mjs`、`check-reproducible.mjs`；新增两个 Phase 5测试模块及受控 Release helper、Hub0.8.1原版 package参考和 pin。package.json增加构建检查命令，template仅更新公开info；补齐 README和上述文档。src、assets、entry.js、product identity、manifest版本、package版本／lock、原始0.1.22 fixture／golden均保持本阶段开始时内容。

没有创建 remote、项目 Commit、Push、Tag或GitHub Release。Phase5完成后停止，等待Owner Review，不进入后续业务或发布阶段。


> 隐私历史迁移说明：文中涉及的提交标识已对应至迁移后历史；历史测试时间、结论及贡献归属保持原意，不表示重新执行了当时的验收。原始记录由维护者受保护保存。
