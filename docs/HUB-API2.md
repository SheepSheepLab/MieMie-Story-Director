# Hub API2 development integration

This development branch targets Hub 0.9.0 Extension API **2**. It is not a new
published product version. Existing public API1 releases and their assets remain
unchanged. Owner has approved product version **0.3.0** for this candidate. Release assets
and production rollout still require separate Owner authorization. Do not distribute a different build under an existing released version.

## Runtime contract

The root manifest declares `schemaVersion: 1`, `apiVersion: 2` and
`hubApi: {min: 2, max: 2}`. Only a Hub advertising API2 is adopted; an API1 Hub
is not treated as an API2 runtime. Standalone remains available without API2.

The source adapter serializes Standalone/Hub transfer and waits for cleanup before
starting a replacement business session. Surface/Native entry changes within a
Hub session reuse the same business instance. A runtime disable does not create a
Standalone instance that bypasses the user's selection.

Every Surface open/close forwards the captured SurfaceLease. Native presentation
uses `registerNativeWindow`, with synchronous mount/open/release boundaries. The
extension owns its native window, animation, drag and close behavior. Release
invalidates pending native work, cancels presentation and restores owned root
styles before Hub takes the panel. Late completion cannot reclaim a revoked lease.
The Native preference controls presentation, not business activation. No API1
Runtime, Shortcut Runtime, shared Core native presentation or product-specific
Core fallback is introduced.

## Managed Package contract

Runtime compatibility and managed installation are separate gates. Manifest,
Managed Package, machine metadata and Build Identity schemas remain **1**. Product,
stable script, repository, author and version identities are unchanged. The Build
Identity does not declare apiVersion; it is not proof of API compatibility.

A target must pass the exact-version manifest and full Package v1 identity/hash
checks before installation or update writes. An already-installed API1 script
must not be activated as API2 or deleted because it is incompatible. A safe
upgrade needs a strictly newer, fully verified compatible target and preserved
instance ID, custom name, data, order and enabled state. The current development
build is not a new official online update candidate merely because its API changed.

## Verification and scope

`npm test` runs the existing business suite and additional API2 contract tests.
`npm run build` creates a development package with the same machine schema.
Pinned, unmodified Hub API2 test sources and SHA-256 provenance are under
`tests/fixtures/hub-api2`; these fixtures are not included in the product bundle.
DOM contract tests use controlled Surface/Native boundaries. Real browser and
isolated Tavern results must be recorded separately; they cannot be inferred from
machine validation or a mock boundary.

Historical API1 references, release reports, test records and contributor credits
remain evidence for their original versions. They do not certify this API2 branch.
Production Registry API2, production Origin, published online install/update,
physical mobile Safari and Owner acceptance remain independent release gates.

Generated runtime edits are derived by `tools/compose-runtime.mjs`; frozen
business source fragments remain intact. Source/runtime/entry checks and package
validation are still required. Reproducibility compares two independent source
snapshots with locked offline installs and complete artifact byte equality; it
does not fabricate commits or override signing identity.

## API2-only cleanup

Only API2 Hub factories are adopted. Required lifecycle/Surface methods, the
Source ready/release contract and Hub whenDisposed boundary must be present;
a failed ready result is reported as failure. Disposal still waits for the
current API2 completion boundary and this extension's own cleanup, rather than
treating the synchronous disposed notification as completed teardown.

Native Window and Back remain optional API2 capabilities. A Surface-only host
may omit them; no Native availability or Shortcut integration is claimed in
that case. Their capability checks do not dispatch an API1 implementation.
Standalone uses the extension's own close route and data, independently of Hub.
Historical API1 fixtures and published packages remain evidence only, outside
the current production build closure.

## 故事导演的入口、生成源与请求所有权

`entry.js → startDirector → createDirectorDualMode（src/adapters/dual-mode.js）→ trackedFactory → createOfficialDirectorExtension` 仅接入API2。Source ready/release、whenDisposed及必需Surface／清理方法缺失时报错；可选Native／Back检测不分派旧Runtime。`src/adapters/hub-api2.js` 以同一instance.open路由NativeLease，mount/open/release都同步；动画由自身异步任务在Lease有效时完成。

Standalone→Hub先捕获私有页面状态，撤销资源和请求，等最终清理后remount；同Hub Surface／Native不重建业务。三套提示词库、接口字段、页面、未记住Key和脱敏历史私有交接，进行中的generation／READY不复制。主副API、唯一story_scene、大纲原位交接和active cancel继续使用已批准业务。

`tools/compose-source.mjs` 还原原始0.1.22；`tools/compose-runtime.mjs` 通过唯一匹配patch生成business-runtime.generated.js，再组合entry。IME修复位于生成规则及自有输入层，不能手改生成Runtime跳过源。默认提示词以已批准0.1.5为当前功能依据，旧golden／Deferred边界不改写。当前执行记录见 [TESTING](TESTING.md#api2-pre-main2026-10-20)。
