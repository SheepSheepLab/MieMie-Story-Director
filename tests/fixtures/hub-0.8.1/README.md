# Formal protocol reference

Unmodified source files from MieMie Hub v0.8.1, commit
`36aaec46282e67bd01b87035165977a40d23acc9`.
Their hashes are pinned in `../phase3-references.json`.

The test harness executes `extension-runtime.js` and the exact source-registration
block of `bootstrap.js` (up to `// Capture the iframe-bound API`). Its UI callbacks
are supplied by a controlled DOM Surface fixture. This tests actual Runtime,
Manifest, provide/ready/release, lifecycle, disable/enable and Shortcut contracts;
it does not claim a full real-Tavern/Hub UI integration or pixel verification.

These are test-owned copies. No reference Hub repository or installed Hub is modified.
Code is GPL-3.0-or-later; original project: https://github.com/SheepSheepLab/MieMie-Hub.


> 隐私历史迁移说明：文中涉及的提交标识已对应至迁移后历史；历史测试时间、结论及贡献归属保持原意，不表示重新执行了当时的验收。原始记录由维护者受保护保存。
