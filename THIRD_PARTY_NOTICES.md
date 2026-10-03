# Reference code attribution

Phase 3 native presentation and serialized source adapter are adapted from
**MieMie Polisher 1.2.1**, by SheepSheep, commit
`5a0a5cf9f4ac7cf5dbb9dac0134d307ad1caa9d1`.
https://github.com/SheepSheepLab/MieMie-Polisher

Affected files: `src/adapters/dual-mode.js`, `src/ui/native-launcher.js`,
`src/ui/native-floating-presentation.js`, `assets/native-launcher.css`, and
`tests/phase3-native.test.mjs`. Director-owned resource helpers follow its
severable fetch-forwarding model with Director-specific lifecycle cleanup.

Formal protocol fixtures in `tests/fixtures/hub-0.8.1/` are unmodified copies of
**MieMie Hub 0.8.1**, by SheepSheep, commit
`36aaec46282e67bd01b87035165977a40d23acc9`.
https://github.com/SheepSheepLab/MieMie-Hub

These code references use GPL-3.0-or-later; the full license is in `LICENSE`.
Reference source hashes are recorded in `tests/fixtures/phase3-references.json`.
No Polisher or Hub artwork is copied. Director artwork remains governed by
`ASSETS-LICENSE.md` and `BRAND.md`.

Phase 4 official theme / navigation / surfaces follow the same Polisher 1.2.1
reference (`assets/theme.css` and `legacy-tool.js` at the commit above). Affected
Director files: `assets/official-ui.css`, `src/ui/official-presentation.js`.
No reference artwork or business behavior is copied.

Development-only dependencies: jsdom 26.1.0 (MIT) for DOM tests; acorn 8.15.0
(MIT) for syntax-aware local source derivation. Their notices are provided in
their installed packages. Neither dependency is included in the runtime.

Phase 5 Package v1 documentation, validator and manager fixtures in
`tests/fixtures/hub-package-0.8.1/` are unmodified files from MieMie Hub 0.8.1,
commit `36aaec46282e67bd01b87035165977a40d23acc9`, by SheepSheep (GPL-3.0-or-later).
They include `extension-packages.js` and its three direct source dependencies;
source and document hashes are pinned in `tests/fixtures/phase5-references.json`.
These fixtures are development-only and are not embedded in the runtime package.
Source: https://github.com/SheepSheepLab/MieMie-Hub


> 隐私历史迁移说明：文中涉及的提交标识已对应至迁移后历史；历史测试时间、结论及贡献归属保持原意，不表示重新执行了当时的验收。原始记录由维护者受保护保存。
