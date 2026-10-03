# Phase 3 Owner Review

**PHASE 3 DUAL-MODE BASELINE READY**

Version: **0.1.22**. Completed locally on 2026-10-03. Phase 4 is not started.

## 1. Files

Added runtime modules: `src/director.js`, `src/host/resources.js`,
`src/host/business-runtime.generated.js`, `src/adapters/dual-mode.js`,
`src/ui/native-launcher.js`, `src/ui/native-floating-presentation.js`,
`assets/native-launcher.css`.

Added tooling: `tools/compose-runtime.mjs`, `tools/compose-dual-mode.mjs`.
Added tests: `tests/phase3-{regression,lifecycle,native,entry}.test.mjs`,
`tests/helpers/{phase3,dual-mode}.mjs`, pinned protocol fixtures under
`tests/fixtures/hub-0.8.1/`, `tests/fixtures/phase3-references.json`.
Added documentation: this Review, fixture README, `THIRD_PARTY_NOTICES.md`.
A teardown fault test also verifies that a failing dialog cleanup cannot strand
the identity markers, hook, subscriptions or roots.

Updated: `entry.js`, `package.json`, `package-lock.json`, `README.md`,
`docs/{ARCHITECTURE,TESTING,PHASES}.md`, `tests/helpers/baseline.mjs`.
The baseline helper adds an optional factory boot seam and nullable post-dispose
UI callback observation; original inputs, expected outputs and assertions stay
unchanged. jsdom/acorn are development-only, pinned dependencies.

Unchanged: frozen fragments, reconstruction tool, original JSON/Core/suite/golden/
lock, identity/manifest/version, both icon files, packaging template, Deferred
file, reference repositories and installed scripts.

## 2. Factory

`createDirectorExtension(api, dependencies)` returns `activate`, `open`,
`deactivate`, and private in-memory capture/restore methods. Active repeated
activate/open reuses the current runtime/panel. Deactivate is idempotent.
A re-enable creates a fresh API/factory session, as required by Hub 0.8.1.
Partial activation failures roll back UI, hooks, subscriptions and ownership.

## 3. Dual-mode ownership

One source queue and one active business runtime. Legacy marker plus an activation
owner block duplicate installs. Each session owns exactly one panel, prompt state,
generation state and interceptor. Mode transitions serially remount only after
old cleanup finishes; page-only state is handed off privately.

## 4. Transitions

Standalone → Hub: capture page state, remove orb, abort/revoke old session,
await complete cleanup, then provide the factory and attach the new panel.

Hub → Standalone: await source lease release, Hub `whenDisposed` and final
session cleanup; then mount Standalone with the shared native presentation.
Fallback final-cleanup waiting also covers an early disposal announcement.

Hub reload/restoration, immediate replacement, disable/enable and source reload
are tested. While Hub exists, disabling/uninstalling the extension never mounts
Standalone. Shortcut preference changes only presentation.

## 5. Fetch/resources

The forwarder's business link is nulled. Later third-party wrappers are preserved;
retained forwarders fall through to the prior chain. Tests cover wrappers before/
after Director and arbitrary cleanup orders.

Deactivation removes owned events, guards, timers, URL objects, roots, Surface and
launcher registrations. It aborts extension-created work and detaches late
promise completions. UI callback links are nulled. Close Panel does none of this.
Settings, prompt libraries and API key preference survive.

## 6. Legacy compatibility

0.1.22 active before formal: activation rejects with a conflict message, leaving
legacy marker/fetch untouched. 0.1.22 loaded after formal: the original script's
marker branch opens the existing formal instance. Two formal sources/factories
are also blocked. No Hub whitelist or reference product modifications.

## 7–8. Tests

Original baseline: **231 / 231 PASS**.
Added Phase 3: **102 / 102 PASS**.
Total Node test output: **333 PASS / 0 FAIL / 0 skipped / 0 cancelled**.

| New layer | Count |
| --- | ---: |
| Actual factory vs frozen Runtime outputs | 37 |
| Generated runtime derivation | 1 |
| Lifecycle / ownership / resource tests | 37 |
| Shared native presentation contract tests | 16 |
| Executable entry / assets / rollback / late completion / frozen UI | 11 |
| Total new | **102** |

Formal references were read from actual code:
Hub 0.8.1 `36aaec46282e67bd01b87035165977a40d23acc9`;
Polisher 1.2.1 `5a0a5cf9f4ac7cf5dbb9dac0134d307ad1caa9d1` (clean local checkout).
Actual Hub Runtime and provide/ready/release block run in tests with a controlled
DOM Surface boundary. No live model/API requests or Owner settings are used.

## 9. Behavior differences

**No observed business differences** across all frozen assertions and 37 actual
Phase 3 Runtime golden comparisons: exact main/secondary messages, filters,
planning, scene/driver handoff, routing, settings writes, errors, debug and active
cancel signals match 0.1.22. The original content can still be reconstructed byte
for byte. Core/library/panel source and UI markup/styles remain frozen.

Authorized host-shell differences: panel initially hidden until launcher/Surface
open; native approved-icon entrance; open/close through host API; serial ownership
handoff; robust full-extension teardown. After deactivation, removed probe controls
are no longer reset, async imports cannot touch old controls, callback links are
revoked, and owned controllers/awaits are stopped, including main transport after
headers. This does not fix the active D-001 cancel listener. D-001/D-002/D-003 remain
**DEFERRED / POST-RELEASE FOLLOW-UP** and are all reproduced by regression tests.

## 10. Decisions and limits before Phase 4

No blocking Owner decision found for Phase 3. The three Deferred issues did not
prevent dual-mode implementation and were not repaired. Phase 4 visual choices
remain for Owner Review: current panel layout, old header/icon and editor styling
are deliberately retained; formal icon is already used at lifecycle entrances.

DOM tests are not real-Tavern PC/mobile, CORS, pixel-layout or full Polisher
combination acceptance. These later checks remain Phase 6/7; D-003 compatibility
is not claimed solved. Native motion is tested via controlled animation frames,
not a claim of measured mobile performance.

No version bump, remote publish/push/tag/release, package release or catalog
submission. No git commit or remote was created. Stop here for Owner Review.


> 隐私历史迁移说明：文中涉及的提交标识已对应至迁移后历史；历史测试时间、结论及贡献归属保持原意，不表示重新执行了当时的验收。原始记录由维护者受保护保存。
