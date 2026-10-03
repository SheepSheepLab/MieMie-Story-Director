# Package v1 / build

当前正式 Package 版本 **0.2.0**，使用 Owner 已批准的同一冻结产物。最新功能基线为 **0.1.5 实际实现**；0.1.22 保留为原始历史参考。此前 0.1.4／0.1.5 的大小、SHA 和可复现记录均不是当前验收依据。冻结数值见 [Final RC 报告](FINAL-RC.md)，正式附件见 [0.2.0 Release](https://github.com/SheepSheepLab/MieMie-Story-Director/releases/tag/v0.2.0)。人工 smoke test 保持发布后 PENDING。

## 规范来源

使用 MieMie Hub **0.8.1** 的提交 `36aaec46282e67bd01b87035165977a40d23acc9`：

- [正式规范](https://github.com/SheepSheepLab/MieMie-Hub/blob/36aaec46282e67bd01b87035165977a40d23acc9/docs/EXTENSION-PACKAGE.md)
- [正式校验和安装代码](https://github.com/SheepSheepLab/MieMie-Hub/blob/36aaec46282e67bd01b87035165977a40d23acc9/src/extension-packages.js)

原样参考文件保存在 `tests/fixtures/hub-package-0.8.1/`，每个 SHA-256 锁定在 `tests/fixtures/phase5-references.json`；包含其实际导入依赖。构建和测试直接调用原版函数，未重新实现或削弱 Hub 校验器。源码夹是开发期依赖，不嵌入产品运行代码。

## 输入与输出

`tools/build.mjs` 调用 `tools/package-v1.mjs`：验证身份、版本和原图后，通过已有生产组合入口编译真实 `entry.js` 及全部模块、正式样式和内嵌 Icon。只去除解析器识别的 JS 注释，保持换行、ASI、所有字符串和可执行 AST；不修改业务或 UI 文件。

构建前验证 Manifest / product identity / package.json / package-lock.json / script template 版本与稳定 ID。验证入口存在、实际编译使用的 Manifest 完全相同、正式图像已内嵌。

确定性 UTF-8 JSON（2 空格缩进、末尾 LF）输出：

| 文件 | 用途 |
| --- | --- |
| `MieMie-Story-Director-Extension-<version>.json` | 酒馆助手直接导入；唯一运行产物 |
| `MieMie-Extension-update.json` | Hub 安装／更新机器元数据 |
| `manifest.json` | 当前包声明副本 |
| `SHA256SUMS` | 前三个文件的实际字节哈希 |

包 content 第一行是 `// MieMie-Extension-Build: ` 加紧凑 JSON，exact keys：schemaVersion、productId、version、scriptId、repository。schemaVersion=1；productId=`miemie.story-director`；scriptId=`fc2d2ead-68af-43fc-904d-a72ece07277b`；repository=`https://github.com/SheepSheepLab/MieMie-Story-Director`。

更新元数据的 size、asset.sha256 与 contentSha256 全部来自实际产物；tag 自动为 `v` + version。无构建时间、绝对路径、随机 ID 或 Git commit 字段。脚本 data 空，export_with 保持 data/button=true。正式 PNG 1254×1254 / 8-bit RGBA，与批准原图 SHA 完全相同，alpha 未重编码。

## 校验与信任边界

`npm run check:package` 对落盘文件重新检查：Hub manifest/metadata/package 规范、16 MiB 包与 64 KiB metadata 限制、首行身份、两层 SHA、完整 Manifest 与实际入口一致、SHA256SUMS、PNG 原图、语法、公开内容扫描。运行内容必须与当前源码的生产编译结果一致，不允许重算 hash 后塞入另一段运行代码。

扫描拒绝常见 token、私钥、非空 literal credential、本地绝对路径、开发／调试 fixture 标记；历史密钥**存储键名称**是公开标识符，不是密钥值。扫描是启发式，结合空 data、锁定源码与精确生产内容检查使用，不能单独证明任何未知文本均不含敏感资料。

负例重新计算外层 hash 后再验证 identity 或内容污染，以避免只测到最外层哈希拦截。原版 Hub manager 使用受控 GitHub HTTP 响应检验实际 release inspection / install，测试不联网、不执行下载内容。安装固定包 ID 与随机安装实例 ID 分开；返回 `persistence: unconfirmed`，不宣称模拟写入等于服务器已保存。

GitHub 实际发布后必须读取真实 Release Asset 的 `digest: sha256:<hash>`，核对 metadata 与脚本附件、官方 asset URL、大小与 Release tag；无 digest 不能跳过。**单元测试中的 asset records 是模拟，不是线上证据；正式发布需另行从公网重新下载并调用 Hub 原版校验器。**

## 可重复构建

`npm run check:reproducible` 把当前源文件复制到临时本地 Git snapshot，仅在那里创建一个测试 commit，创建两个 detached clean worktree，各自执行 `npm ci --ignore-scripts --offline` → build → validate。前后工作树均应干净、四个文件逐字节一致；原仓库和历史不变。需要 npm 缓存已包含 lockfile 依赖；无缓存时先正常安装依赖再运行。

Final RC 阶段使用未提交源快照进行可复现检查；正式首发还针对实际 Release commit 执行两次独立 clean build，并要求与原冻结产物一致。报告保存在本地 `review/`；review、build 和 node_modules 均被忽略，不加入公开源码。最终发行附件只使用当前 SHA256SUMS 列出的文件，旧版本文件保留作本地历史记录。


> 隐私历史迁移说明：文中涉及的提交标识已对应至迁移后历史；历史测试时间、结论及贡献归属保持原意，不表示重新执行了当时的验收。原始记录由维护者受保护保存。
