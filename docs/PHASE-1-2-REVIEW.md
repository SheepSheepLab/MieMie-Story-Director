# Phase 1＋2 Owner Review

本阶段完成：以 Owner 提供的 0.1.22 JSON 建立冻结来源、固定输出、行为对照及本地产品工程。

## 新增文件

- 产品基础：`product-identity.js`、`manifest.json`、`entry.js`、`package.json`、`package-lock.json`、`.gitignore`、`.gitattributes`。
- 拆分源码：`src/core.js`、`src/prompt-libraries.js`、`src/host/standalone-runtime.js`、`src/ui/panel.html`。
- 资产：`assets/icon.png`（确认的新原图）、`assets/legacy-icon.png`（原样重组验证）。
- 包基础：`packaging/script-template.json`；不是发行包。
- 开发工具：`tools/compose-source.mjs`、`tools/record-baseline.mjs`。
- 测试：四份 test 文件、两个 helper、冻结 JSON／Core／原 suite／golden／lock。
- 文档：README、GPL LICENSE、BRAND、ASSETS-LICENSE，以及 BASELINE／ARCHITECTURE／TESTING／DEFERRED／MIGRATION／PHASES／RELEASE-PLAN／本报告。

所有这些都是新本地工程内新增文件。Owner 提供的原 JSON、旧 workspace 文件、Hub、Polisher 与 Registry 没有修改。

## 结果

- content 字节完全一致，SHA-256：`b34f6142b3a4ea2c32986060f508374f26644415d33b312fba825ec17d25554f`。
- 原始 JSON 锁定 SHA-256：`26a00694d6e76d3e240bd2b51909f937f317901efa4804efe30bc3744721c743`。
- 实质检查 229 项，Node 统计含两套件父节点为 231；全部通过。
- planning、副 API messages、director prompt、filter、scene、writer、routing 与失败条件在固定输入下与 0.1.22 相同。
- Deferred D-001／002／003 保持原行为，未修复。
- 版本仍是 0.1.22。固定 scriptId、旧设置与 Key、提示词文件格式和预设定位 ID 均保留。
- 新 Icon 原始字节已收录，尚未切换旧 UI；入口和 UI 接入属于 Phase 4。

## 当前结构与边界

产品身份与业务存储分离；源码拆分只是组织和唯一插槽重组。factory、Hub／Standalone adapter 和正式 UI 尚未开始。Manifest 是后续适配基础，不表示当前已具备 Hub Runtime 注册能力。

没有发现阻止 **Phase 1＋2** 在不改变 0.1.22 行为前提下完成的阻塞。尚未实施 Phase 3，不能据此声称双模式适配或真实宿主兼容已经完成。

本阶段仅建立本地 Git repository，不创建 GitHub 远端，不 Commit／Push、不 Version bump、Tag 或 Release，不发布 Production，不修改 Hub／Polisher／Registry。

当前交付止于 Phase 2，等待 Owner Review。继续时先进行 Phase 3；若真正出现无法保留业务行为的适配阻塞，停止并报告。
