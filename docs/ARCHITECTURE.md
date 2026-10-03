# Phase 3 architecture

## Frozen authority

For Final RC 0.2.0, the Owner-approved 0.1.5 implementation is the latest
functional authority, including official UI, new default prompts and fixed rows.
Owner-supplied `tests/fixtures/0.1.22/script.json` remains the historical reference
for unchanged business algorithms and compatibility. Core, prompt libraries, panel markup and the historical host
fragments remain unchanged. `tools/compose-source.mjs` still reconstructs the
entire original content byte for byte. Fixtures, original 70 assertions, golden
outputs and their baseline hashes are unchanged.

## Runtime derivation

`tools/compose-runtime.mjs` derives `src/host/business-runtime.generated.js`
from that exact reconstruction. Its explicit, unique-match patch list replaces
only the host shell: dependencies, mount/unmount, entrance routing, cleanup,
tracked lifetime resources and private session handoff. A syntax-aware pass
wraps UI callbacks and the existing awaits with whole-extension revocation.
These wrappers preserve active results/exceptions and do not attach new behavior
to the host's generation/request cancel signal. No runtime eval, parser or remote
code loading is introduced. Do not edit the generated file by hand.

Original panel content, styles, header, editor dimensions and library rows remain
unchanged, verified in DOM tests. The old text launcher is removed; the approved
PNG is used for the native entrance and Hub presentation metadata. Existing UI
branding/style redesign remains Phase 4.

## Modules

| File | Responsibility |
| --- | --- |
| `entry.js` | `startDirector` source entry, explicit host/helpers/manifest/assets. |
| `src/director.js` | Factory `activate`, `open`, `deactivate`; one activation owner. |
| `src/host/resources.js` | Revoke callbacks/awaits/controllers, tracked timers/URLs/listeners, severable fetch link. |
| `src/host/business-runtime.generated.js` | Original business mounted through the audited lifetime adapter. |
| `src/adapters/dual-mode.js` | Source lease and serialized Hub/Standalone ownership transitions. |
| `src/ui/native-launcher.js` | One shared Standalone/Shortcut native orb. |
| `src/ui/native-floating-presentation.js` | External orb motion/geometry only; never Hub navigation or business. |
| `assets/native-launcher.css` | Native entrance tokens only; does not theme the original panel. |
| `tools/compose-dual-mode.mjs` | In-memory runnable local entry for tests; no release files. |

## Ownership and handoff

One source adapter serializes all host transitions. Each valid API session owns
one business runtime and one panel. A transition revokes the old session and
awaits its complete deactivation, Surface/Shortcut detachment and final cleanup
before creating the next session. This is a serial remount, as in Polisher 1.2.1;
it does not keep two business runtimes or clone an active generation.

Private page-only handoff preserves config/libraries, enabled state, API fields,
model choices, tab, diagnostic display and secret-redaction history. Unremembered
keys stay in memory. In-flight generation/READY records are not copied to a new
host session. Adapter disposal clears the handoff. Persistent settings/key
preferences are not removed by deactivation.

A factory's `activate` is idempotent within its live API session; `open` reuses the
same instance. Reactivation after deactivation uses a fresh host API/factory
session, matching the official Hub's one-panel-per-session rule. A revoked
session cannot open or activate again.

Hub presence suppresses Standalone even when the extension is disabled. Hub
provides the primary Surface and owns Honeycomb origin/motion. If supported,
`registerShortcutLauncher` supplies the same native implementation used in
Standalone; Hub alone decides when to mount it. No extra retained Standalone orb
bypasses its preference. Closing a panel only changes presentation.

## Fetch and async cleanup

The forwarding closure is outside the business activation scope and retains a
severable `{handler, previous}` link. Dispose nulls `handler`. If it still owns
`host.fetch`, it restores the previous wrapper; otherwise it leaves a later
wrapper in place. Any retained Director forwarder delegates to its previous
chain after disposal without retaining the Director business closure.

Lifetime revocation aborts extension-created controllers (including already
handed-off streams), removes owned listeners/timers/URLs, nulls UI callback
links, and detaches pending async completions. An abort-ignoring provider cannot
later consume its response into a dead runtime or trigger main dispatch.
These are whole-extension teardown behaviors, not changes to active cancel
semantics. D-001 still reproduces the original response-header listener removal;
D-002 and D-003 remain frozen as well.

## Legacy conflict

The original `__meemeStoryPlanner` marker remains. It blocks activation when
legacy 0.1.22 already runs; no old hook/state is overwritten. Original 0.1.22
loaded after the formal entry sees that same marker and opens the formal runtime
instead of mounting another. Extra source/activation markers reject duplicates.

Stable UUID, storage/key names, exchange v1 and preset location IDs are unchanged.
No Hub, Polisher or Registry source is modified. No release/version work is done.


## Phase 4 official presentation

`entry.js` exposes the official factory and production `startDirector` selects
`createOfficialDirectorExtension`. It wraps the same Phase 3 factory with
`mountOfficialDirectorPresentation`, after `attachPanel` has installed its close
control. No second Runtime, config, prompt store or request pipeline is created.

The presenter moves already-bound controls into the persistent controls/footer
and visual API groups. Original IDs, data selectors and field objects are retained. Business-bound
controls retain their handlers; a presentation controller extends navigation
from three to four pages. One card/row/editor theme serves three independent libraries.
Debug's existing selector, clear button and PRE move into a fourth normal page;
the modal launch button is removed. An inert, permanently hidden dialog shell
remains only because frozen Business cleanup calls its close method. The presenter
never opens it. Diagnostic generation/clearing remains entirely Business-owned.
The official factory adds transient presentationPage to the in-memory handoff,
without changing Business session fields or persistent settings. It restores the
selector's displayed value from the existing debugPage before revealing the page.
Header displays name/version and current character as in Polisher. The original
close control moves into the footer as a full-width Return, and the top toggle
fills its row without a duplicate status badge. Owner-approved Starsea Blue
replaces the original pink/purple palette, including native launcher color CSS;
launcher geometry, timings, docking and motion code remain unchanged. Name hover
uses the whole row's outline rather than a separate rectangular button fill.
Mutation observers decorate newly painted rows/menus and reflect toggle state;
owned resources disconnect them and remove presentation listeners at teardown.

Native docking/geometry/motion stay unchanged. On a narrow screen, only the
padding of cards intersecting the right-docked orb reserves room for their
controls. Dialogs use the visual viewport height/offset and safe-area spacing.
Escape dismisses an owned top-layer menu before the window-close shortcut.
During an active HTML mouse drag only, the presenter prevents the browser
`pointercancel` handoff from reaching the touch gesture cancellation handler.
The same original drop/reorder operation executes; touch/pen cancel and all
request cancel/abort semantics remain untouched.

Historical markup/CSS remain untouched inside the frozen reconstruction and
comparison factory. The official presenter removes *all* their style nodes from
the live root and installs one `assets/official-ui.css` theme. No new override is
added to the historical panel. The comparison entry remains useful for the 333
original assertions; official real-DOM golden and production browser checks
separately verify the actual Phase 4 entry.

## Phase 5 build boundary

`tools/package-v1.mjs` wraps the actual existing compiled production entry in
Package v1 identity and generates deterministic JSON and metadata. The parser
removes only JS comments, keeping executable AST, string contents and ASI intact.
It does not patch the runtime, prompts, filters, routing, storage or accepted UI.
Unmodified Hub 0.8.1 package validators are called from pinned development fixtures;
these fixtures and tests are not bundled. File and content hashes derive from
actual bytes. Separate checks verify source Manifest/entry equivalence, the exact
approved PNG and public-content scanning. `check-reproducible.mjs` uses two clean
temporary detached source-snapshot checkouts; it never commits the real repository.

## 0.1.5 Owner defaults and fixed rows

The product factory in `entry.js` wraps only this extension's configuration read
through `src/default-prompts.js`. It supplies Owner-authored initial defaults,
updates untouched prior defaults, preserves edited prior defaults as ordinary
custom rows, and retains stored activation states. Missing builtins in existing
arrays are restored disabled. Custom rows precede the canonical builtin tail.
The wrapper does not write storage and delegates unrelated namespaces unchanged.

`src/ui/default-prompt-protection.js` is mounted only in the product factory.
Builtin editors remain selectable read-only; deletion is disabled; mouse/touch
and keyboard reorder cannot move builtins or cross their fixed boundary.
Ordinary rows retain the original handlers and prepend semantics. Owned listeners
and observers are removed through existing lifecycle resources. The frozen
Core, library/runtime derivation, request pipeline and comparison factory remain
unchanged, so historical golden tests still exercise their original behavior.
