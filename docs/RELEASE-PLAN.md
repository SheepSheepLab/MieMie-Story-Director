# 0.2.0 正式首发与后续安排

Owner 已批准 0.2.0 Final RC 的自动验证，并于 2026-10-03 授权正式 GitHub Release。使用冻结的同一 0.2.0 脚本，不修改功能、UI、默认提示词或 Deferred 行为。

- Repository：[SheepSheepLab/MieMie-Story-Director](https://github.com/SheepSheepLab/MieMie-Story-Director)
- Tag：`v0.2.0`
- Release：[MieMie Story Director 0.2.0](https://github.com/SheepSheepLab/MieMie-Story-Director/releases/tag/v0.2.0)
- 主分支：`main`；Tag 与 Release 均指向同一正式首发 commit。
- 发行附件：单脚本 JSON、MieMie-Extension-update.json、manifest.json、SHA256SUMS。

0.2.0 表示 0.1.x 实验阶段结束、首次正式工程化与 MieMie Extension Package v1，同时继续保持 pre-1.0 状态。最新功能基线是 Owner 已批准的 0.1.5 实际实现；0.1.22 作为历史兼容参考。后续兼容小修复递增 PATCH。

## 冻结产物

| 项目 | 值 |
| --- | --- |
| Artifact | MieMie-Story-Director-Extension-0.2.0.json |
| Size | 2,938,240 bytes |
| Artifact SHA-256 | `f69eddd219d89606ffbd08aaa298c1501e3ef9dae75dd3356abff855244cc4d0` |
| Content SHA-256 | `648e82fe4b78111147bb7273356052ccf3f1d45d870905b999d320e1c28d7a48` |
| Automated validation | 569 PASS / 0 FAIL / 0 SKIP |

正式发布必须重新核对上述冻结值、当前源码与 Package 身份，针对实际首发 commit 做 clean build。公开后读取 GitHub API 的真实 Asset digest、从 Release URL 重新下载四个附件，并使用 Hub 0.8.1 原版 Package v1 validator 核验。任何冻结哈希或线上 digest 不一致均停止，不自动重新冻结新产物。

## 人工 smoke test / follow-up

Owner 已明确允许不等待人工验收而发布。以下项目不阻止本次 GitHub Release，但不能写成已经通过：

- Desktop manual：**PENDING**
- Mobile manual：**PENDING**
- Real API manual：**PENDING**

这些项目作为 **post-release manual smoke test / follow-up**，清单见 [PREFLIGHT.md](PREFLIGHT.md)。自动模拟不等同于真实酒馆持久化、实体手机体验或真实服务商 API 测试。D-001、D-002、D-003 继续按 [DEFERRED.md](DEFERRED.md) 保留。

本次授权只覆盖 Git history、公开仓库、main、Tag、Release 和线上验证。**不投稿 Hub Catalog，不修改 Registry、Hub 或 Polisher**；Catalog 需 Owner 下一轮单独授权。代码、品牌及美术许可范围保持不变。
