# Story Director 0.2.0 Final Release Candidate

后续授权（2026-10-03）：Owner 已批准使用本报告冻结的同一产物正式发布 GitHub Release，不再等待人工验收。Desktop／Mobile／Real API manual 继续为 PENDING，作为 post-release manual smoke test / follow-up；不伪造 PASS。以下保留 RC 冻结时的历史状态、哈希和证据，最新发布安排见 [RELEASE-PLAN.md](RELEASE-PLAN.md)。

2026-10-03。Owner 已确认 0.1.5 的功能、UI 与默认提示词，当前仅统一正式版本为 0.2.0，重新执行完整自动验证。本轮没有发布。

**STORY DIRECTOR 0.2.0 FINAL RC READY FOR MANUAL ACCEPTANCE**

| # | 项目 | 最终结果 |
| --- | --- | --- |
| 1 | Final version | 0.2.0 |
| 2 | Final artifact | `MieMie-Story-Director-Extension-0.2.0.json` |
| 3 | Artifact byte size | 2,938,240 bytes |
| 4 | Artifact SHA-256 | `f69eddd219d89606ffbd08aaa298c1501e3ef9dae75dd3356abff855244cc4d0` |
| 5 | Content SHA-256 | `648e82fe4b78111147bb7273356052ccf3f1d45d870905b999d320e1c28d7a48` |
| 6 | Total tests | 569 PASS / 0 FAIL / 0 SKIP；516 Node + 53 Chromium |
| 7 | Hub Package v1 | PASS；锁定 Hub 0.8.1 的真实 validator / manager |
| 8 | Reproducible build | PASS；两份独立 detached clean checkout，离线安装、构建和校验；全部四个发行文件逐字节相同 |
| 9 | Identity consistency | PASS；Product Identity、Manifest、Build Identity、Update Metadata 和 Artifact 一致 |
| 10 | Secret / local-path / private-data | PASS；发行包及待公开源码未发现真实凭据、本机路径、私人聊天或实际 Debug 数据；本地 review 材料已排除 |
| 11 | Migration compatibility | PASS；保留 storage keys、scriptId、prompt exchange format、API key preference、preset IDs，以及已批准的 0.1.5 迁移行为 |
| 12 | Default-entry regression | PASS；16 项产品默认测试及浏览器操作检查保留通过 |
| 13 | Git working tree | 原仓库仍无 commit；源码为未跟踪状态，未 stage / commit；无 remote。review/build 等本地输出被忽略 |
| 14 | Manual acceptance | PENDING OWNER MANUAL ACCEPTANCE；Desktop / Mobile / Real API 均未标记 PASS |
| 15 | Remaining blockers | 自动 Final RC 无阻塞；公开发布仍须真实人工验收与后续单独发布授权 |

## 身份与功能冻结

- productId：`miemie.story-director`
- scriptId：`fc2d2ead-68af-43fc-904d-a72ece07277b`
- repository：`SheepSheepLab/MieMie-Story-Director`
- version：`0.2.0`
- 最新功能基线：**Owner 已批准的 0.1.5 实际实现**。原始 0.1.22 仅作历史参考与兼容回归，不回滚新默认条目行为。

对升版前后的 19 个实现／资产文件做 SHA 检查：src、assets 与 entry 全部未变。版本声明、Manifest、package/lock 与脚本模板仅改变版本字段。新旧 artifact 的运行内容归一化明确的版本字面量后逐字节相同，其他 JSON 字段相同。历史 fixture/golden、主／副 API 设计、request semantics、UI、默认原文与 Deferred 行为均保留。

默认三条固定在对应列表底部，不可编辑、删除、排序；允许开关、滚动查看和选择复制。DIY 新建置顶、允许编辑删除及相互排序，升级保留用户自定义内容。

## 最终产物与验证来源

`build/` 的本次发行集合只有以下四个文件；旧版本产物仅为本地历史材料：

- `MieMie-Story-Director-Extension-0.2.0.json`
- `manifest.json`
- `MieMie-Extension-update.json`
- `SHA256SUMS`

本报告大小与两层 SHA 均由最终 0.2.0 重新生成，不沿用 0.1.4 或 0.1.5。Package 验证使用 Hub 0.8.1 提交 `36aaec46282e67bd01b87035165977a40d23acc9` 的未修改源码，参考文件 hash 通过锁定检查。构建身份、Manifest、更新元数据、实际脚本与源码版本逐一比对；正式图标字节与 alpha 保留。

独立 clean build 使用临时源快照仓库的两个 detached worktree，分别安装锁定依赖、构建、校验，构建前后保持干净，源仓库未改变。其临时测试 commit 不属于原项目历史；后续真实提交仍应针对最终 commit 重跑，不声称当前已经有正式发布 commit。

## 公开仓库与人工验收

待公开范围按 Git 的 tracked + nonignored untracked 文件核查。`review/` 下预览 HTML、截图、原始日志、临时快照与报告保留本地，不加入公开源码；`build/` 通过最终附件独立分发。代码、文档、资产与计划公开的回归 fixture 已检查，测试中的假密钥和虚构聊天是明确的合成材料，不携带 Owner 私人数据。公开 artifact 的 data 为空。

README、GPL LICENSE、Brand / Asset notice、Migration、Known limitations、Package 文档均已核查；既有许可与品牌范围不变。本轮没有修改 Hub、Polisher、Registry，没有创建远端、Push、Tag、GitHub Release 或投稿 Catalog。

自动浏览器检查运行虚构宿主和模拟接口，不能当作真实酒馆 Desktop/Mobile/Real API 验收。[人工清单](PREFLIGHT.md) 保持 **PENDING OWNER MANUAL ACCEPTANCE**。D-001、D-002、D-003 保持 [Deferred](DEFERRED.md)，未将其升级为新功能或擅自修复；后续发布还需真实 GitHub 附件 digest 和 Hub 在线安装核验。

原始自动记录保留于本地 `review/final-rc-0.2.0/`。本轮到 Final RC 冻结为止。


> 隐私历史迁移说明：文中涉及的提交标识已对应至迁移后历史；历史测试时间、结论及贡献归属保持原意，不表示重新执行了当时的验收。原始记录由维护者受保护保存。
