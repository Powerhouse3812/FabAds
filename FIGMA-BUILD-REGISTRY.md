# FIGMA-BUILD-REGISTRY — the live shared state for wave 2

**Every builder MUST append to its own row block here as its LAST action**, before
reporting. The sync orchestrator reads this file to do cross-screen wiring. If your
ids are missing, your screen will not get wired to anything.

Append only to YOUR section. Never edit another builder's section. Never reformat
the file.

## Known-good shared facts (do not re-discover — zero reads)

- File: `a4R8eBl0xyNFENEJiLor0j`
- **Drawer overlay root: `39:24264`** (`OVERLAY / Drawer / Populated`, page `25:2964`)
- Shell master: `30:3599`
- Foundations page: `25:2954` · Handoff page: `25:2965`
- Library (only one subscribed for our use): **Design System - FF new**,
  `lk-d0db22f96aa104f4b76d850fbacce5d06f3866b8cf065e1faa6878f87f56beb2b10d66320382109b7daeae0c2a09bc71f7c17a4d710bd8233221ba86bee350b5`
- Foundations keys: Creative Card `98ae5ba5dbc1c10a622da4ee037377ddf774bada` ·
  Metric Cell `6325d00da59ce0357d4271bc4e7b614e444f80e9` ·
  Bucket Chip `ca6baf9c47439d1b8d2fed4e3295cd29d32f09a8` ·
  Chart Placeholder `f5240a954d967c15a6464008a02206b1579dd2f2` ·
  Glass Panel `a453a95ece51d1eb666d41d12f1915195c21e283`
- Table atoms: Header Item `4b11dbcaf97f43b58cf9cafb3855fe1eea873107` ·
  Cell `2a1fe912edf5c011af9343dc901673e83fc4fbc7`

## Per-builder blocks

### B1 · Overview · page 25:2956 — COMPLETE (wave 1)
- Populated `39:13954` · Loading `46:4192` · Empty `47:5138` · Filtered-empty `47:6223`
- Error `48:7036` · Partial `49:7985` · Long-content `49:9122`
- Bucket states: Winners `50:10000` · Scaling `50:11301` · Fatiguing `39:13954` · New `50:12632` · Losers `50:13882`
- ENTRANCE `51:23478`→`51:29388` · SPEC board `52:20813`

### B1 retrofit (font sweep + wiring pass)
- **Inter→Geist sweep, whole page, ONE script:** 1040 changed · 777 already Geist (skipped) · 0 other families · 1817 text nodes scanned · **0 blocked**. Empirical finding: text nodes inside library instances (Button/Tab Item/Segmented labels) accepted the font override without detaching — the "expected blocked set" in PATCH 02 §Q1 did not materialize on this page. Blocked list: `[]` (none).
- **Row→drawer wiring: BLOCKED by a Plugin API limitation, not a builder error.** Attempted `On Click → Open Overlay → 39:24264` (Move In from Right, Ease In And Out, 500ms) on all Bucket Tab Row instances across all 5 bucket-state frames (`39:13954` 4 rows, `50:10000` 6 rows, `50:11301` 8 rows, `50:12632` 3 rows, `50:13882` 5 rows — 26 rows total, all located and ready). Every attempt threw: `"Reaction ... destination 39:24264 was rejected — ... the destination may not be reachable from this source"`. Isolated via 5 separate probes: same-page NAVIGATE works fine; cross-page NAVIGATE fails with an explicit engine message "for NAVIGATE actions, destinations must be a different top-level frame on the same page"; cross-page OVERLAY fails with the same generic rejection regardless of source node type (tested nested instance AND top-level frame), regardless of `overlayRelativePosition`, and regardless of pre-warming page `25:2964` in a prior call. **Conclusion: this `use_figma` Plugin API environment cannot set cross-page NAVIGATE or OVERLAY reactions at all — same-page only.** This contradicts §G.3's "cross-page overlay targets work" claim. Rows are left with their hotspots intact and reactions unset (unchanged from wave 1) rather than faked or worked around by cloning B9's drawer locally (which would drift from the source of truth). **Needs an architect decision**: either confirm/refute this in the live Figma app UI (manual cross-page overlay wiring may still work through the UI even though the plugin API rejects it), or pick another cross-screen wiring strategy for B1/B2/B4/B5.
- **Threshold-settings popover: BUILT + WIRED.** Trigger is instance `39:24423` ("Edit formulas button", inside `Toolbar` `39:24417` on frame `39:13954`). New popover frame `65:58533` (`OVERLAY / Overview / Threshold settings`) at `(3640, 2760)` on the overlay-states row, listing all 5 bucket formulas (Winners/Scaling/Fatiguing/New/Losers) as read-only formula chips + Cancel/Save changes footer, Geist/Geist Mono only. Wired `39:24423` → `On Click → Open Overlay → 65:58533`, Move In (from top), Ease Out, 150ms (same-page reaction — succeeded, confirms the cross-page issue above is specifically a cross-page problem, not a general reaction bug).
- **Structural conflicts, resolved by inspecting the live nodes (no guessing):**
  - §C.2 vs P5.10: **1128px confirmed as what's actually built.** `Page Body` (`39:14077`) is 1176 wide with 24px padding each side → usable content column = 1128px, matching P5.10's correction, not §C.2's original 1136 claim.
  - §A.2 vs §G.2 slot `(0,3680)`: **confirmed resolved per P5.11.** ENTRANCE occupies the full row from x=0 (`51:23478`→`51:29388` at x=0,1560,3120,4680,6240,7800, all y=3680); `SPEC / Overview / Interactions` (`52:20813`) sits at x=9360 on the same row, not at x=0. No actual collision on canvas.
- OUTSTANDING: row→drawer wiring (blocked, see above — needs architect call, not a B1 fix).

### B2 · Creatives · page 25:2957
- Grid Populated `39:10206` (done) · Table Populated `39:11281` (shell only)
- **W2-A additions (2026-07-29):**
  - Table content: Toolbar `65:57881` · PortfolioTrendChart `65:57912` · Table wrapper `65:57940` ·
    Header row `65:57941` · 8 data rows `65:57997,65:58064,65:58131,65:58198,65:58265,65:58332,65:58399,65:58466`
    (rows carry `default`/`hover`/`selected`/`focus` states; Spend column shows `sorted-desc`)
  - Table layout toggle buttons: grid-icon `65:57901` · table-icon (active) `65:57907`
  - BulkActionBar (on Grid Populated, floating near bottom of visible Page Body) `65:69864`
  - 4 overlays (`y=2760` row): Column picker `66:60646` · Card metrics `66:60712` ·
    Add filter list `66:60762` · Add filter Geo drill-in `66:60796` · Row actions dropdown `66:60821`
  - 6 state frames: Loading `66:91054` · Empty `66:92388` · Filtered-empty `66:93679` ·
    Error `66:94970` · Partial/low-data `66:96261` · Long-content stress `66:97601`
- **Card resize→rescale check (P5.6):** verified, no fix needed — Grid Populated's 8 cards were
  already built via `rescale()` (native 300px scaled proportionally, `relativeTransform` scale
  factor confirmed), not `resize()`. No mutation made.
- **Font sweep (Q1) result:** 694 text nodes on page, 294 Inter→Geist, 400 already Geist,
  **0 blocked-in-instance**. Zero Inter remains on this page.
- **Prototype wiring done:** Grid↔Table layout toggle (Smart Animate 200ms) · Card-metrics /
  Columns / Add-filter (both screens) / Row-actions popovers (Move In top, Ease Out, 150ms) ·
  all 8 table row-action kebabs → Row actions dropdown.
- **BLOCKED — architect decision needed:** row/card → drawer (`Open Overlay → 39:24264`) is
  **NOT wired**. Verified empirically that the Plugin API rejects both `OVERLAY` and `NAVIGATE`
  reactions whose destination lives on a different page — confirmed error text: *"for NAVIGATE
  actions, destinations must be a different top-level frame on the **same page**"*; `OVERLAY`
  fails with the same rejection even when the destination is a valid top-level FRAME with sane
  `overlayPositionType`/`overlayBackground`. This **contradicts §G.3/P6**'s claim that "cross-page
  overlay targets work" — that claim does not hold in this Plugin API. This blocks B1, B4, B5 too
  (anyone wiring to B9's `39:24264` from a different page). Needs an architect call: either (a)
  duplicate the drawer frame per consuming page (breaks single-source-of-truth), (b) accept this
  as a documented prototype-hygiene gap and demo cross-screen via manual page switch, or (c)
  verify by hand in the real Figma editor UI whether the *manual* prototype panel allows a
  cross-page connection that the Plugin API alone cannot create (plausible — some editor-only
  affordances aren't exposed to plugins).
- **Also found:** all 5 read tools were unnecessary for building — everything above was written
  via `use_figma` alone (free). Only used hosted `get_screenshot` 3× (visual verification) and
  local desktop `get_screenshot` ×5 for the same purpose — well under the 5-hosted-read cap.
- **Not fixed (out of my scope, flagging for W2-C):** Grid Populated's own Page Body is
  `clipsContent=true` at fixed h=654 with real content (2 rows of cards) needing ~1096px —
  the 3rd row (the `hover` and `selected` demo cards) is **entirely clipped and invisible**
  today. This is the same P5.7-class defect noted for B6, just discovered independently here.
  I did not touch it (W2-C's P5.7 unclip task owns this); I only made sure my OWN new content
  (Table Populated's chart+table, BulkActionBar) fits inside the existing 654px budget by
  compacting spacing/row-heights rather than requesting a shell resize.
- **§K gate closure pass (2026-07-29) — ENTRANCE + SPEC board built, the two things this page was missing:**
  - **Confirmed via grep (`grep -rn "cr-stagger|--i:" src/creative-report/`): `Creatives.tsx` has ZERO
    `cr-stagger`/`--i` usage — only `Overview.tsx` uses that convention file-wide.** The task brief's
    assumption of real `--i` sections in this screen does not hold. Built the honest equivalent instead,
    same approach B3/B5 used for their own no-stagger screens: reveal derived from the real, visible,
    top-to-bottom `Page Body` children on Grid Populated (`39:10206`) — **Toolbar** (`--i` equiv. 0) →
    **Creative grid** (equiv. 1) → **BulkActionBar** (equiv. 2, built as an always-visible demo section
    on this Populated frame, so it counts as a real section, not skipped).
  - **ENTRANCE / Creatives / 0→1→2→3** — `89:53113` → `89:53271` → `89:53429` → `89:53587`, each a full
    clone of Grid Populated at `x=0,1560,3120,4680`, all `y=5680`. Opacity-only progressive reveal of the
    3 sections above (frame 0 = all hidden, frame 3 = all revealed = Populated's look). translateY(6px)
    omitted — `Page Body` is `VERTICAL` auto-layout, so children can't be manually y-offset without
    breaking sibling layout (same simplification B6 logged for Owner report). Wired
    `After Delay 60ms → Navigate → Smart Animate, Ease Out, 280ms` for 0→1→2→3, final hop
    `3 → 39:10206 (Populated)` is `After Delay 60ms → Instant (transition: null)`. Flow starting point set
    to `89:53113`, flow named `Entrance — Creatives`.
  - **Placement deviation, logged:** the generic `y=3680` default for the ENTRANCE/SPEC row **collides**
    with this page's own overlay row (`OVERLAY / Creatives / *`, already at `y=4260` — a full-height
    ~1282px entrance clone at `y=3680` would span to `~4962`, overlapping `4260–4578`). This page was
    already re-pitched to **1420** per PATCH 06 §U2 (rows at `0 / 1420 / 2840 / 4260`). Continued that
    same pitch to the next clear row: **`y=5680`**. `x` computed per §U3: `1560 × entranceFrameCount(4)
    = 6240` for the SPEC board — **not** a hard-coded 9360, and not the collision-causing 3680 either.
  - **`SPEC / Creatives / Interactions`** board `90:22172` at `(6240, 5680)` — 13 interaction rows
    (layout toggle, card select→BulkActionBar, row/card→drawer [not wired, cross-page], 3 popovers, row
    actions dropdown, group/sort selects, bucket-pill remove [not wired], sortable table headers, the
    ENTRANCE sequence itself, sub-nav cross-screen tabs [not wired]) plus a placement-reasoning note and
    a 4-item deviations log, mirroring B3's (`68:18512`) and B6's (`69:83830`) row structure.
  - **Font sweep on all new content:** 863 text nodes scanned across the 4 ENTRANCE frames + SPEC board,
    **0 Inter, families = {Geist, Geist Mono} only.**
  - **Clipping check:** all 5 new frames verified non-clipping — the 4 ENTRANCE clones inherit Grid
    Populated's already-fixed (PATCH 06 §U1) `1281.64px` content height exactly; the SPEC board is a
    HUG-height auto-layout frame (`h=1771`, content can't exceed its own bounds by construction).
  - **Reads used this pass: 0 of 3.** All discovery (Grid Populated structure, B3/B6 SPEC board formats
    for reference, canvas collision-checking) and all verification (font sweep, clip check, screenshots)
    were done via `use_figma` (write-exempt) and in-script `node.screenshot()` — the free write-path
    fallback the task brief names explicitly. The local desktop server was not needed.
- (append further ids here)

### B3 · Components · page 25:2958 — COMPLETE (this pass)
- **All 5 tabs built as separate full-screen frames** (sub-nav "Components" active on each):
  Hooks (canonical) `39:40650` · Headlines `66:52350` · Primary text `66:53423` ·
  CTAs `66:54494` · Visual styles `66:55565`. Each: 5-tab pill strip + verbatim
  per-tab subhead (incl. the shipped "cTAs" bugfix — reads "Which CTAs are winning…")
  + Winners/Decliners sections, each a header row + real data rows, columns
  Hooks/Creatives/Spend/ROAS/Win-rate vs median/Trend/Confidence/Action.
- **Spec deviation, logged:** §D.1's `Table Item / Header Item` (`4b11dbc…`) and
  `Table Item / Cell` (`2a1fe91…`) keys both 404 (`Component ... not found`) —
  confirmed unusable, not a mistake on my end. Inspected B2's actual working
  substitute (`Components/Table-Cell/Text` set key `1269a87a…`) and found it
  renders with **zero children** (empty box) — also broken. Built local
  header/cell row atoms instead (plain auto-layout frame + text, not a shared
  component), per §D.3's local-build allowance. `CR2/Confidence Chip` resolved
  fine via same-file id `28:3139` (Level=high/medium/low/na, all 4 used).
- **Button substitution, logged:** `*Button*` (`792294bb…`, documented corrupted
  per §P5.1) not used for the ~34 "Brief this → Genie" ghost actions — built
  `LOCAL/Components/Ghost Action Button` component set instead
  (`65:65194`, States default/hover/pressed/focus/disabled, default variant
  `65:65124`), plus `LOCAL/Components/Tab Pill` set (`65:65123`, States
  selected/default/hover/disabled, parked at `(0,4600)` with the ghost button
  set). Icons (TrendingUp/TrendingDown/Minus/Wand2/ArrowRight) imported as
  real lucide SVG paths read from the repo's own `node_modules/lucide-react`
  source (not hand-drawn primitives, not Ant substitutes — no Ant icon key was
  available without a `search_design_system` call, which is banned this wave).
- **Honest data presentation:** every row shows a real Confidence chip (all 4
  levels represented); trend column never shows a bare dash — real `0%` is
  distinguished from `Not enough data (n=…)` (shortened from spec's "yet" to
  fit the column). Fixed a real overflow bug found on the stress frame: text
  truncation was initially character-count-based (matching code's `VALUE_MAX`)
  but that doesn't reflect actual rendered pixel width — switched to native
  Figma `textTruncation:'ENDING'`/`maxLines:1` on all 41 value cells file-wide,
  and rebalanced/widened the Creatives column on the stress frame so 4-digit
  counts stop bleeding into Spend.
- **7 state frames** (canonical Hooks layout): Loading `66:87805` (skeletons
  reshaped to the real tab-strip/subhead/2-table shape, not a generic block) ·
  Empty (no account) `66:88900` · Filtered-empty `66:89977` · Error `66:98904`
  (chrome reused from the Empty template, copy "Couldn't load your components…")
  · Partial/low-data `66:101179` (every row confidence low/na, honest
  "Not enough data (n=…)" fallbacks) · Long-content stress `66:102447` (60+
  char hook truncating with ellipsis, 4-digit creative counts, 4-5 digit spend).
- **ENTRANCE** `66:108157`→`66:109465`→`66:110773`→`66:112081`→Populated
  (`39:40650`), 3 sections in code's actual top-to-bottom order — header
  (tab-strip+subhead) / Winners / Decliners (`Components.tsx` has no
  `cr-stagger`/`--i`, confirmed by reading the source, so visual order is the
  honest match, not a shortcut). Wired `After Delay 60ms → Smart Animate Ease
  Out 280ms` per hop, final hop Instant; flow starting point set, flow named
  "Entrance — Components". `SPEC / Components / Interactions` board `68:18512`.
- **Wired:** in-page 5-tab strip on all 5 tab frames, cross-linking to each
  other (Smart Animate, Ease Out, 200ms) — 20 reactions · confidence-chip
  hover → tooltip (4 tooltips built with verbatim `ConfidenceChip.tsx` method
  copy, parked at `(3120..4080, 2760)`; wired on the 9 chip instances on the
  canonical Hooks frame, Dissolve/Ease Out/120ms).
- **NOT wired — same environment blocker every other builder hit:** "Brief
  this → Genie" (→ B7 Populated `39:19846`) and the 7 outbound cross-screen
  sub-nav tabs. Reproduced the identical error other builders logged:
  `use_figma`'s reaction setter rejects any `NAVIGATE`/`OVERLAY` destination
  on a different page ("destinations must be a different top-level frame on
  the same page"), confirmed on this page independently. Left unwired per the
  established precedent (B1/B2/B4/B5/B8) rather than faked; ready for the
  orchestrator/cross-screen wiring queue below.
- **Inter→Geist sweep:** 1645 text nodes scanned, 446 changed, 1199 already
  Geist, **0 blocked** — consistent with every other builder's corrected
  finding this wave: font override succeeds even on text nested inside
  library instances, no library-side ask needed.
- **Reads used: 2 of 5** (local desktop `get_screenshot` — Hooks Populated,
  Loading, Long-content-stress verification, one re-check after the overflow
  fix; a few of these were free re-screenshots of the same node). All
  discovery (component/variable/font resolution, B2's working table-cell key,
  Tab Item property names) done via structured `use_figma` returns, zero
  `search_design_system`/`get_metadata`-on-page calls.
- **§F.4 focus-state gate closure pass (2026-07-30):**
  - **New token: `CR2/Accent/focus-ring`** (`VariableID:104:17008`, "CR2 Tokens"
    collection, Light mode) = **#5B7611** (r0.357/g0.463/b0.067). Measured
    **contrast ≈ 5.19:1 against white** — clears both the 3:1 non-text-UI floor
    and the 4.5:1 text floor. The pre-existing ring color (`CR2/Accent/primary`,
    ~#8FB821, used at full opacity) measures **≈ 2.32:1 against white — fails
    3:1**. Did not touch `CR2/Accent/primary` itself (used file-wide at low
    opacity for hover/pressed tints elsewhere) — added a new token instead of
    repointing the shared one.
  - **`LOCAL/Components/Tab Pill` (`65:65123`): added `State=focus`** (new node
    `104:137431`, cloned from `State=default`, 2px OUTSIDE stroke bound to
    `CR2/Accent/focus-ring`, matching Ghost Action Button's ring treatment
    exactly). Set now has 5 states: inactive/active/hover/disabled/focus.
  - **Renamed `selected→active`, `default→inactive` per §F.1** (`65:65115`,
    `65:65117`). **Verified all 55 live Tab Pill instances on this page survive
    the rename: 55/55 resolved, 0 broken** — snapshotted every instance's
    `mainComponentId` + `componentProperties.State.value` before the rename,
    re-walked the same 55 IDs after, confirmed `mainComponentId` unchanged and
    `state.value` correctly reads `active`/`inactive`. `componentPropertyDefinitions.defaultValue`
    auto-updated to `active`. Screenshotted a live "Tab strip" instance
    post-rename to confirm no visual regression.
  - **`LOCAL/Components/Ghost Action Button` (`65:65194`): added `State=loading`**
    (new node `104:17009`) — 6th state per §F.2. Left icon's wand vectors
    replaced with a static spinner arc (ellipse, `arcData`, ~250° sweep); label
    changed to "Sending…"; trailing arrow icon kept in the layout (opacity 0 on
    its vectors, not `visible=false`) specifically to avoid a real bug hit
    mid-build: hiding the frame via `visible=false` let the HUG auto-layout
    shrink the button from 172→101px, a layout-shift regression against its 5
    siblings — fixed by keeping the frame present and forcing `resize(172,29)`
    (which also pins `primaryAxisSizingMode:'FIXED'` per the known resize
    gotcha). All 6 states now share the identical 172×29 footprint.
  - **Also fixed the pre-existing `State=focus` (`65:65166`) ring color** —
    rebound from `CR2/Accent/primary` (fails 3:1, see above) to the new
    `CR2/Accent/focus-ring`. This is the one the task named as "the reference
    to match" — matched its treatment (2px, OUTSIDE align) but corrected its
    color, since shipping a new AA-safe ring elsewhere while leaving this one
    failing would be inconsistent and still non-functional.
  - **Doc cluster:** `STATES / Components / Focus + variants` (`104:137443`,
    at `(0,5100)`) — both sets' full state lists as live component instances,
    side by side, captioned. Backs the SPEC board's prose with real artwork.
  - **SPEC board `68:18512` corrected:** Tab Pill states line now reads
    inactive/active/hover/disabled/focus (was selected/default/hover/disabled,
    no focus); Ghost Action Button line now lists all 6 states incl. loading.
    **Also found and corrected a separate false claim**, out of my named scope
    but on my page: the "Table row (Winners/Decliners)" row claimed
    "States: default/hover/selected/focus" — verified via `use_figma` structural
    read that every data row on the canonical Hooks frame renders identically
    (a 6%-opacity hairline divider only, no state variation in the artwork at
    all) — corrected the line to say so plainly. Added a new SPEC row for the
    ring-token fix, pointing at the doc cluster board.
  - **Metered reads used this pass: 0 of 3** — all discovery, the rename
    verification, and all visual checks done via `use_figma` (write-exempt)
    and inline `node.screenshot()`. Zero hosted `get_screenshot`/`get_metadata`.

### B4 · Compare · page 25:2959 — COMPLETE (wave 2)
- Populated `39:3029` · Line `39:26882` · Bar `39:27023` · Loading `39:36683`
- Empty `39:33368` · Filtered-empty `39:33499` · Error `39:39567`
- LOCAL/Compare/Column `39:24278` — **relocated** to local-components strip `(4680, 3680)` (label `64:16687`)
- Contexts mode (mode toggle flipped, attribution `*Alert*` always visible, never a summed-across-platforms total):
  Contexts × Cards `65:18579` · Contexts × Line `65:19051` · Contexts × Bar `65:19342`
- Partial / low-data (2 columns, CPA + hook-rate `N/A` with reason) `65:45932`
- Long-content-stress (4 columns, 60+ char names, 7-digit spend, truncation verified) `65:46464`
- Empty-selection "Pick 2–4 creatives to compare" (0 picked) `65:52012`
- Contexts single-platform "Nothing to compare across contexts yet" `65:52270`
- `OVERLAY / Compare / Add creative picker — populated` `65:52534` · `— no match` `65:52549`
- Added missing trailing add-slot ("Add another creative") wired to the picker overlay on the Creatives×Cards Populated frame (4/4 already selected, so no add-slot needed there — confirmed and left as-is)
- ENTRANCE `65:65656` → `65:65908` → `65:66160` (Header then content-row fade-up, 60ms/280ms Ease Out per §G.2) · SPEC board `65:66415`
- Wiring done: mode toggle × view toggle across all 6 frames (Smart Animate Ease Out 200ms) · Add-creative buttons → Add-creative picker overlay (Move In top + Dissolve, Ease Out, 150ms) · picker `overlayBackgroundInteraction` attempted (read-only via API — see note below)
- Font sweep (Q1): 1561 text nodes on page, 630 converted Inter→Geist, 0 blocked-in-instance (every Inter node, including library-instance-nested ones, accepted the override once its current font was (re)loaded first — no genuine blocked set on this page)
- Button re-point (P3/P5.1): all `*Button*` instances already on FF-new key `792294bb…` (including shell-inherited ones); no non-new-key usage found on this page. New "Add creative" buttons built via `importComponentSetByKeyAsync` + exact variant-name string + nested-TEXT mutation per the corrupted-component workaround.
- **NEW VERIFIED DEFECT (not in P5's list of 11):** cross-page `Open Overlay` reactions are rejected by `setReactionsAsync` in this environment — confirmed via isolated test (same-page OVERLAY to a real source succeeds; identical reaction targeting a node on a different page, e.g. drawer root `39:24264` on page `25:2964`, throws "destination ... may not be reachable from this source" even after pre-loading the destination page via `setCurrentPageAsync`). This contradicts §G.3's claim "Cross-page overlay targets work." Per the registry's own cross-screen wiring queue (owned by the sync orchestrator, not per-builder), row/card → drawer clicks on this page are **intentionally left unwired**, matching B1's precedent — ready for the orchestrator to wire once the cross-page mechanism is resolved (may need to be done from a script whose `fileKey` context already has both pages hot, or via the desktop UI's own prototype panel rather than the Plugin API).
- Two Plugin-API properties are read-only despite being documented as settable: `overlayPositionType`, `overlayBackgroundInteraction` on a freshly created FRAME — could not set "close on click outside" explicitly on the two picker overlays; left at Figma's default overlay behavior.

### B5 · Automations · page 25:2960
- Rules Populated `39:8048` · Boards Populated `39:30169` · Digest `39:37989` (body empty)
- OUTSTANDING: H1 + Rules|Boards|Digest segmented strip missing on `39:8048` and `39:30169`
- **wave-2 update — retrofit + Digest body + states + overlays + wiring (this pass):**
  - Fixed the wave-1 gap: H1 "Automations" + honesty subhead + Rules|Boards|Digest tab strip
    (`*Segmented*` 5-item defect workaround, 2 hidden) now present on all 3 tab frames, above
    the existing content. No resize needed on Rules (654px already had slack); Boards grew
    additively to 916px (still under the 920 row pitch) since its content nearly filled 654px.
  - Rules Populated `39:8048` — header block `65:45846`, tab strip `65:45849`
  - Boards Populated `39:30169` — header group `65:69879`, tab strip `65:69883`
  - Digest Populated `39:37989` — header group `66:65737`, tab strip (query by name
    "Tab Strip / Rules Boards Digest" inside "Screen Header" — id not captured on creation),
    Digest Grid `66:65780`, DigestSettings card `66:65781`, DigestPreview card `66:71562`.
    Built per source (DigestSettings.tsx/DigestPreview.tsx/digestStore.ts) verbatim: switch OFF
    (enabled:false default), Daily|Weekly segmented (Weekly active), 7-day picker (Sun–Sat,
    Mon active, real 3-letter WEEKDAY_LABELS — spec's "single-letter" paraphrase doesn't match
    source), time 09:00, 40%-opacity disabled body, verbatim "Prototype only…" disclaimer
    outside the opacity wrapper. KPI strip uses `CR2/Metric Cell` (`28:3709`,
    "Align=left, Tone=good, State=value" — exact variant string, lowercase; the Foundations key
    `6325d00d…` did NOT resolve, same defect class as §P5.9, used same-file id instead).
  - State frames (§F.3, built off the Rules tab as canonical): Loading `66:80680` (skeleton
    toolbar+rows) · Empty/zero-rules `66:81835` (dashed box, verbatim RuleList.tsx empty copy +
    cloned New-rule button) · Empty/zero-boards `66:82976` (repurposed the Filtered-empty slot —
    a filtered-empty search state doesn't apply to this screen; built BoardsPanel.tsx's real
    "No board selected" empty pane instead, logged as a substitution) · Error `66:84289` ·
    Partial/low-data `66:85430` (rows edited to 0-matched / never-run) · Long-content stress
    `66:86568` (rule name replaced with a 100+ char string to verify truncation).
  - Overlays: `OVERLAY / Automations / Rule builder` `66:101072` (modal card `66:101074`) —
    name/type-toggle/2 condition rows/AND helper/live match-count line/board select/footer, all
    verbatim RuleBuilder.tsx copy. `OVERLAY / Automations / Delete rule` `66:101143` (modal card
    `66:101145`) — verbatim AlertDialog copy from RuleList.tsx. Both hand-built as card+scrim
    frames rather than instancing `*Modal*` — did not attempt injecting custom form content into
    a library Modal instance given the proven content-slot defect class (§P5.3); logged as a
    substitution, not blocked.
  - `ENTRANCE / Automations / 0` `66:105497` (Page Body opacity 0, y+6) wired
    `After Delay 60ms → Navigate To Rules Populated 39:8048 → Smart Animate, Ease Out, 280ms`;
    flow starting point set, flow named "Entrance — Automations". Automations.tsx has no
    `cr-fade-up`/`--i` stagger in source (unlike Overview) — single-step entrance is the honest
    match to the actual code, not a shortcut.
  - `SPEC / Automations / Interactions` `66:106626` — full interaction log, including the NOT
    WIRED list below.
  - **Wired:** all 6 cross-tab-strip links (Rules↔Boards↔Digest, Smart Animate/Ease Out/200ms) ·
    New rule → Rule builder modal (Dissolve/Ease Out/200ms) · Delete icon (row 1) → Delete rule
    modal · both modals' Cancel/Create rule/Delete → Close Overlay (Dissolve/Ease Out/160ms) ·
    entrance → Populated.
  - **NOT wired / out of scope for this page:**
    - Rule row → drawer, and the `rbWrapper`/`delWrapper` overlay position/scrim/
      close-on-outside-click properties — **settled by the sync orchestrator, not a B5 gap**:
      prototype reactions are page-scoped by design (destinations must be a same-page top-level
      frame, confirmed independently by 4 agents), so cross-page overlay wiring and all overlay
      property configuration is being done centrally on the flow page `66:74040` against local
      clones. Not reattempting here.
    - Switch enable/disable animated toggle, Run-now toast, folder/board expand-collapse,
      digest enable/disable, weekday/cadence pill clicks, and all hover/press/focus states on
      individual controls — deferred given time/read budget; logged on the SPEC board.
  - **Inter → Geist sweep, corrected** (whole page, re-run after the coordinator flagged the
    first pass): 757 text nodes scanned, **312 changed**, 445 already Geist, **0 still Inter**,
    0 errors. The original "312 blocked inside library instances" report was a **method
    artifact, not a real limitation** — that pass pre-emptively skipped every text node inside
    an instance without ever attempting the assignment (based on PATCH 02 §Q1's blocked-set
    prediction, which the orchestrator has since walked back: font is an overridable text
    property and does not require detaching). The corrected script actually attempts every
    node — including inside `*Segmented*`/`*Button*`/`CR2/Why Dot` instances and the shell rail/
    breadcrumb/sub-nav/dropdowns — preloads all 4 Geist + 4 Inter styles up front, and handles
    mixed-font text via `getStyledTextSegments`/`setRangeFontName`. Zero Inter remains on this
    page; zero nodes needed a library-side fix.
  - **Reads used: 4 of 5** (local desktop `get_screenshot` ×4 — Rules, Boards, Digest, Rule
    builder modal). All discovery/verification and both font-sweep passes done via structured
    `use_figma` returns per §R3 — no additional reads spent on the re-run.
  - **Spec errors / ambiguities found:** (1) Digest's weekday picker — spec text says
    "7 single-letter day buttons" but `DigestSettings.tsx` renders the full `WEEKDAY_LABELS`
    3-letter strings ("Sun","Mon"...); built to match source. (2) No canonical "Filtered-empty"
    concept exists for Automations (nothing here is a text/date search result) — repurposed that
    grid slot for the zero-boards state instead of forcing a synthetic filtered-empty screen.
- **Defect-fix pass (2026-07-30) — Digest preview subtitle `39:37989`/`66:71569` unclipped:**
  the underlying `characters` string was **already the full verbatim sentence**
  (`"Preview — this is what your next digest would contain right now (nothing is actually
  sent)."`, confirmed against `DigestPreview.tsx:61-63`) — structure never lied about the string
  itself. The defect was purely a rendering clip: ancestor containers (`Titles` `66:71563`,
  `DigestPreview` `66:71562`, `Digest Grid` `66:65780`, `Content Area` `39:38067`) were fixed-height
  and cut the wrapped 2nd line ("...sent)."). Re-asserted `primaryAxisSizingMode='AUTO'` up the
  chain (Page Body `39:38112` correctly left `FIXED` — it's the outer canvas boundary, not a
  hugging card) and re-wrote `characters` to the exact string anyway (idempotent, guarantees
  correctness regardless of prior state). Screenshot-confirmed: card now hugs to fit both lines,
  no clip, no collision with neighboring content. 0 metered reads used (all via `use_figma` +
  free `node.screenshot()`).

### B6 · Owner report · page 25:2961 — COMPLETE (wave 2)
- **P5.7 clipping fix:** Page Body `39:9246` un-fixed from h=654/clipsContent, set to hug
  (auto-layout `primaryAxisSizingMode=AUTO`) → now 1703h. Content Area `39:9201`, outer frame
  `39:9123`, icon rail `39:9124` and secondary nav `39:9164` all resized to match (1849h final).
  Rail's bottom-pinned block (`39:9159`, `constraints.vertical="MIN"`) repositioned manually each
  resize pass — confirmed it does NOT follow automatically, exactly as flagged.
- Populated `39:9123` (header + KPIs + trend chart + by-brand table + **new:** By account table +
  Testing velocity bar chart). New section frames: By account `66:4095` · Testing velocity `66:72153`.
- Loading `66:118946` · Empty `66:119195` · Filtered-empty `66:119444` · Error `66:129858` ·
  Partial/low-data `66:130101` (na-fallback overrides + chart swapped to `Type=bar,State=empty`) ·
  Long-content stress `66:130414`.
- **Report wizard overlay** (`OVERLAY / Owner report / Report wizard`): Step 1 Brands `66:105071` ·
  Step 2 Sections `66:105170` · Step 2 validation-error `66:105248` · Step 3 Preview & export
  `66:105328` · Export toast `66:105370`.
- ENTRANCE `66:133871` → `66:134285` → `66:134699` → `66:135113` → `66:135527` → `66:135941` →
  `66:136355` (7 frames, opacity-only reveal per section — translateY skipped since Page Body is
  auto-layout and children can't be manually offset without breaking sibling layout; logged as a
  simplification, not a defect). SPEC board `69:83830`.
- **Prototype wiring (same-page only, per updated ruling — cross-page reactions are impossible):**
  Configure report → Open Overlay Step1 (Dissolve 200ms) · Step1↔Step2↔Step3 Next/Back (Smart
  Animate 200ms, matches the tab-switch rule) · Step2-error Back · all 4 modal Close-X → Populated
  (Dissolve 160ms) · Step3 Export → toast → auto-dismiss to Populated (1.6s delay, Dissolve 200ms) ·
  Error Retry → Loading (instant) → auto-recover to Populated (0.8s delay, Dissolve 200ms) ·
  Filtered-empty Clear filters → Populated (Smart Animate 200ms) · ENTRANCE 0→1→...→6 (After Delay
  60ms, Smart Animate 280ms) → 6→Populated (instant).
- **Font sweep (Q1) result:** 641 Inter→Geist, 1318 already Geist, **0 blocked-in-instance**
  (confirms B1's finding — no library-instance font lock encountered). Zero Inter remains on this page.
- **New API finding (reactions schema):** instant navigation requires `transition: null` (a literal
  null), not `{type:"INSTANT_TRANSITION"}` or an omitted field — both throw a schema validation error.
  Overlay-open actions must omit `overlayRelativePosition` unless the destination frame's
  `overlayPositionType` is `"MANUAL"`.
- **Auto-layout gotcha found:** for a HORIZONTAL auto-layout frame, `counterAxisSizingMode` (not
  `primaryAxisSizingMode`) controls height-hug. Leaving it unset defaults to `FIXED` at Figma's
  100px frame default, silently inflating nested row heights (my By-account table briefly built at
  882px instead of 374px before this was caught and fixed).
- **OUTSTANDING / logged gaps:**
  1. `Icon/SettingOutlined` on the header CTA (`39:20978`) still points at the unsubscribed
     "Design System - FF" (non-new) library. No FF-new equivalent key was available in spec/registry,
     and resolving it would require a `search_design_system` discovery read, which the wave-2
     read-budget rule forbids. Left as-is, logged for the architect/Maalik to supply the correct key.
  2. Library `*Steps*` component (`0164820ed648fd290491383204e1a0583bf77fa7`) only exposes
     Type/Size/Direction variants — "current step" state is baked into deeply-nested per-item
     instances, not a settable property. Substituted a local hand-built 3-item step indicator
     (`LOCAL/Owner report/Steps indicator`) instead, per the "substitute, document, don't block" rule.
  3. Checkbox rows in the wizard are visual only (checked/unchecked per frame), not click-wired —
     Figma prototyping can't express "count checked boxes" conditional logic.
  4. Empty state's "Connect ad account" button has no click target — no "connected" state exists
     on this page to link to (that flow lives outside Creative Report 2.0's scope).
- Reads used: 5 of 5 (1 initial `get_metadata` structure read, 4 `get_screenshot` verification reads).

### B7 · Brief builder · page 25:2962 — COMPLETE (this pass)
- **Populated `39:19846`** (2 references picked — Bluestone_Necklace_Video_003 primary +
  Plum_NovaSerum_Video_011 secondary): References Card `39:37890` (header/desc/Add-creative
  button, 2 selected rows with Primary badge + real ROAS/spend, "SUGGESTED FROM YOUR WINNERS"
  strip of 4 chips) · Brief Blocks Section `39:37891` (5 blocks Hook/Body/CTA/Visual
  direction/Offer, each `From: <name>` attribution caption + "Also seen in:" hint from the
  secondary reference; CTA block shown hand-edited by the buyer — "Grab yours before the next
  restock" — to demonstrate the filled/edited state; footer disclaimer + Send to Genie).
  Header (icon tile + H1/sub) was **already built by an earlier pass** — found populated,
  left untouched per the "never rebuild what's done" rule.
- **Secondary — 0-reference pre-pick state** `66:103801` (`x=1560,y=0`): References Card with
  zero selected rows, all 6 candidates (the would-be primary/secondary + 4 more) offered in the
  Suggested strip; Brief Blocks Section entirely absent (matches `{primary && (...)}` in
  `BriefBuilder.tsx` — no footer/Send-to-Genie exists pre-pick either).
- **GenieHandoffStub** `66:105007` (`x=3120,y=0`, own 1440×1124 frame, not clipped to the CR2
  shell grid since it's the `/genie/new` destination, not a Creative Report screen) — verbatim
  copy from `GenieHandoffStub.tsx`: simulated-handoff badge, Concept/Angle/Winning hook/Source
  creative/Product info box, full Brief block dump + "Referenced: …" line, disabled
  "Generate 3 variations" button.
- **7 state frames (§F.3):** Loading `66:113954` (skeleton blocks shaped like References-card +
  5 brief-blocks, not a generic template) · Empty/no-account `66:115154` (verbatim §F.3 copy +
  primary "Connect ad account") · Filtered-empty `66:116354` (verbatim copy + outline "Clear
  filters") · Error `66:117554` (verbatim copy + primary "Retry") · **Partial/low-data**
  `66:127208` — demonstrates the **bootstrap-vs-curated Winners labelling**: single low-spend/
  low-ROAS reference (YogaBar_PeakWhey_Video_002, 1.85× ROAS, $380 spend), Suggested strip
  relabelled "SUGGESTED FROM STARTER WINNERS (BOOTSTRAP — MARK A WINNER TO REFINE)" per
  `winnersBank.ts`'s honest `source==='bootstrap'` branch, no "Also seen in" hints (only one
  reference, matches code exactly) · **Long-content stress** `66:128505` — 2 references with
  60+ char names/products (`UrbanLadder_NordicThrowBlanket_HandwovenWoolCollection_Carousel_014`
  etc.), 6-digit spend ($128.4k), truncating via `textTruncation:'ENDING'`.
- **Overlay row (`x=0,y=2760`):** `OVERLAY / Brief builder / Add creative picker — populated`
  `69:83852` (search input + 4 candidate rows, thumb + name + product + Bucket Chip) ·
  `— no match` `69:83898` (verbatim `CommandEmpty` copy "No creatives match.") ·
  `STATES / Brief builder / Micro-states (§F.2)` `69:83905` — Add-creative button
  enabled-vs-disabled (3-of-3 cap) side by side, plus Textarea default/hover/focused/filled
  swatches (the library set actually exposes 6 states — default/hover/focused/filled/typing/
  disabled — 4 used per spec).
- **ENTRANCE** `70:84317`→`70:85483`→`70:86649`→`70:87815`→Populated (`39:19846`), 3 sections
  in code's real top-to-bottom order (Header+back-link / References Card / Brief Blocks).
  Wired `After Delay 60ms → Smart Animate Ease Out 280ms` per hop, final hop Dissolve→Populated.
  **Flow-starting-point metadata failed to set** (`setReactionsAsync`/flow API threw "duplicate
  input nodeIds" on `page.flowStartingPoints` — non-blocking, the reactions themselves are wired
  and functional, just no named flow-start marker). `SPEC / Brief builder / Interactions` board
  `70:88985`.
- **Wired (same-page only, per the environment limitation every other builder independently
  confirmed):** ENTRANCE 0→1→2→3→Populated · **Add creative button** (`References Card` on
  `39:19846`) → `Open Overlay` → `69:83852` (populated picker), `MOVE_IN` from `TOP`, Ease Out,
  150ms · all 4 candidate rows inside `69:83852` → `{type:"CLOSE"}` (Figma's actual close-overlay
  action shape — top-level `type:"CLOSE"`, no `transition` field accepted, no `destinationId`;
  discovered by reading the schema-validation error verbatim rather than guessing a second time)
  · the no-match overlay `69:83898` → click-anywhere → `{type:"CLOSE"}` (it has no actionable
  rows of its own) · **Send to Genie** button (Footer Bar on `39:19846`) → `Navigate To` →
  GenieHandoffStub `66:105007`, `transition: null` (B6's literal-null finding for instant
  transitions — `{type:"INSTANT_TRANSITION"}` and an omitted field both throw). **NOT wired:**
  remove-reference (X) and textarea focus — no-op visually distinct states, not reachable via a
  single-destination reaction, left as SPEC-board-documented gaps. 8 cross-screen sub-nav tabs:
  **correctly deferred**, same cross-page NAVIGATE/OVERLAY rejection B1/B2/B4/B5/B6/B8 all hit
  independently — owned by the flow page `66:74040`, not re-attempted here.
- **Spec deviations / substitutions, logged:**
  1. **Icon gap confirmed, no wand/sparkles equivalent found in FF-new.** Earlier substitutes
     (`ExperimentOutlined`/`StarOutlined`) were from the now-unsubscribed "Design System - FF"
     (non-new); no FF-new replacement could be resolved without a `search_design_system` call,
     which this wave's rate-limit model explicitly bans. **Substitute used:** a simple hand-built
     4-point sparkle SVG (`figma.createNodeFromSvg`, not rotated primitives), named
     `LOCAL/BriefBuilder/Sparkle Glyph (icon gap — see Handoff)`, used in: header icon tile, Send
     to Genie button, GenieHandoffStub's icon tile/Generate button/Simulated badge. **Flagging
     for the Handoff page (`25:2965`, architect-owned — not edited by me): needs a real
     `Icon/ThunderboltOutlined`-or-similar FF-new key supplied, or add wand/sparkles to the J.2-
     style library gap list.**
  2. `CR2/Creative Thumb` key `bcbf79e5c3d2ccff572fafd7ab9d91ee58a69042` **does not resolve**
     (`Component set ... not found` on `importComponentSetByKeyAsync`) — same defect class as
     Trust Meter Chip (§P5.9). Used same-file Foundations node `29:3340` instead; works fine.
  3. Button set `792294bb…` per §P5.1 workaround (exact variant-name string match + direct
     nested-TEXT mutation, never `setProperties()`/`componentPropertyDefinitions`) — no
     corruption hit, confirms B1/B4's finding that `.name`-based matching + instance creation is
     safe even though the set has 3816 variants.
  4. Two real bugs found and fixed mid-build (documented for future builders): (a) calling
     `.resize(w,h)` on an already-`primaryAxisSizingMode:'AUTO'` auto-layout frame silently
     resets it back to `FIXED` at that literal height — even a same-value resize — so any
     `.set({primaryAxisSizingMode:'AUTO'}) → .resize(...)` sequence must be followed by
     re-asserting `primaryAxisSizingMode='AUTO'` (or `layoutSizingVertical='HUG'`) **after** all
     children are appended, not just once up front. Hit this on `Card Header`, the
     `GenieHandoffStub` content column, and (worst case) the whole References Card / Brief
     Blocks Section on the Partial and Long-content-stress clones — caught via a free
     `use_figma` structural read (children present, height stuck at 80px, mode `FIXED`) before
     it reached a screenshot. (b) Foundations Textarea's `State=Default` variant renders its
     text in placeholder-gray, not solid ink — real pre-filled content must use `State=Filled`;
     `State=Default` should only ever demo an actually-empty textarea.
- **Font sweep (Q1), corrected re-run:** the first pass's "280 blocked-in-instance" was a
  **method artifact, not a real limitation** — identical root cause to B5's retracted finding.
  That first script gated on `isInsideInstance(node)` and pushed straight to a blocked list
  **without ever attempting the assignment**, and separately never preloaded the *current* Inter
  styles before assignment (only the Geist targets), so any attempt would have thrown an
  "unloaded font" error indistinguishable from a real block. Re-run as ONE script with **no
  instance gate at all**, preloading all 4 Geist (`Regular`/`Medium`/`SemiBold`/`Bold`, one word)
  **and** all 4 Inter (`Regular`/`Medium`/`Semi Bold`/`Bold`, note the space) styles up front, plus
  `getStyledTextSegments`/`setRangeFontName` for any `figma.mixed` node. Result:
  **`{scanned: 938, changed: 280, alreadyGeist: 658, stillInter: 0, errors: []}`** — every
  previously-"blocked" node (Tab Item, Breadcrumb Link, Dropdown trigger, `*Button*` label,
  Textarea placeholder/value text, `*Badge*` count) converted cleanly, confirming **font is an
  overridable text property on instance children, no detach required** — now confirmed on this
  page too (seventh confirmation this wave, after shell master/B1/B2/B3/B4/B6/B8). Zero Inter
  remains on page `25:2962`.
- **Reads used: 4 of 5** (local desktop `get_screenshot` — full Populated frame, References Card
  zoom, Brief Blocks Section zoom, GenieHandoffStub). Zero `search_design_system`, zero
  page-wide `get_metadata`. One scoped `get_metadata`-equivalent structural check was done via a
  free `use_figma` script (not a metered read) to diagnose the resize/hug bug above.
- **§K gate closure pass (2026-07-29) — flow-start marker fixed, the one thing this page was missing:**
  the gate found the page's `flowStartingPoints` pointing at `ENTRANCE / Brief builder / 0` (`70:84317`)
  rather than the Populated frame. Per this task's explicit instruction, replaced it:
  `page.flowStartingPoints = [{ nodeId: "39:19846", name: "Flow 1" }]` — confirmed before/after
  (`before: [{"70:84317","Flow 1"}]` → `after: [{"39:19846","Flow 1"}]`). The ENTRANCE sequence's own
  internal same-page reactions (0→1→2→3→Populated) are untouched and still function; only the
  Presentation-mode/gate entry marker changed. Reads used: 0 of 3 (metadata-only write, no
  screenshot needed to verify a property assignment).
- **Defect-fix pass (2026-07-30) — 2 pixel-verified defects on Populated `39:19846`, fixed:**
  1. **Tofu icons rebuilt as local lucide vectors.** The Add-creative Plus icon (`66:80554`) and
     both Remove/X icons (`66:80572`, `66:80584`) were instances of a **remote** AntD-style library
     (`Icon / PlusOutlined` `3:5970`, `Icon / CloseOutlined` `3:829`, both `remote:true`) — internal
     vector geometry read fine via the Plugin API but the actual render came back as dark solid
     squares, matching "structure lied, only pixels caught it." Replaced all 3 with **local
     `FRAME > VECTOR` icons** (`LOCAL/BriefBuilder/Plus Glyph` `104:16998`,
     `LOCAL/BriefBuilder/Close Glyph` `104:17001` + `104:17004`) built from real
     `node_modules/lucide-react/dist/esm/icons/{plus,x}.js` path data (`M5 12h14`/`M12 5v14` for
     Plus; `M18 6 6 18`/`m6 6 12 12` for X), scaled from lucide's native 24x24 to 14x14, stroke-
     based (`strokeCap/strokeJoin='ROUND'`, weight 1.167), same fill color/opacity
     (`{0.059,0.059,0.047}` @ 0.55) the original AntD glyphs used. `lucide-static` does not exist
     in this worktree's `node_modules` (only in the repo root, and only `lucide-react` is present —
     no `lucide-static` anywhere in the repo) — used `lucide-react`'s per-icon source files
     instead, same upstream path data. **CR2/Creative Thumb** (the suggestion-chip icon) checked
     and confirmed **local, not remote** (`29:3328`, `remote:false`) — not a tofu risk, untouched.
     `LOCAL/BriefBuilder/Sparkle Glyph` (`66:80674`, inside the Send-to-Genie button) was
     inspected as the reference pattern per the task brief but is **not itself one of the 5 named
     defects** — left untouched, still flagged "(icon gap — see Handoff)" from the prior pass.
  2. **Footer clip at the 1612px frame boundary, fixed.** `Footer Bar` (`66:80671`) sat at
     absolute y=1572, bottom=1640 — 28px past the outer frame's fixed 1612px height (frame
     `layoutMode='NONE'`, so it never auto-hugged `Content Area`'s own hugged 1664px). Cascaded:
     resized outer frame `39:19846` 1612→1664 (matching `Content Area` `39:19924`'s natural
     hugged height), resized icon rail (`aside` `39:19887`) 1612→1664 to match. Searched the rail
     for any `constraints.vertical==='MAX'` bottom-pinned descendant (the B6-reported
     1049px-overshoot class) — **none exist in this rail**, so no overshoot to fix. Collision
     check: page pitch is 1760, new frame height 1664 — **96px of headroom, no collision** with
     the next canvas row (`Loading` frame at `y=1760`). Screenshot-confirmed: disclaimer text and
     "Send to Genie" button both render complete, uncut.
  - Reads used this pass: **0 of 3** (all inspection + fix via `use_figma` + free
    `node.screenshot()`, per the wave's rate-limit rule).

### B8 · Saved views · page 25:2963 — COMPLETE
- Populated `39:20980` · header `39:31284` · save card `39:31287` · ViewsList `65:45724` (6 rows, 1 with 60+ char stress name, all truncating via `maxLines:1` + `textTruncation:ENDING`)
- LOCAL/Saved Views/View Row set `39:37979` — **relocated** to (0, 5600) local-components strip. All 5 variants' text (View name / query caption / date / rename-input) retargeted Inter→Geist directly on the master (it's our own local component, not shared).
- Rename-demo (secondary populated, row swapped to `State=renaming`) `65:54289`, swapped row `65:54430`
- Zero-views empty state (screen-specific, not the generic account-empty) `65:54439`, empty box `65:58582` — copy verbatim from `SavedViews.tsx`: "No saved views yet — set some filters and save them here."
- After-save (7th row appears, save-reveal target) `66:72824`, new row `66:73933`
- Loading `65:48770` (skeleton reshaped to header/save-card/views-list, NOT the generic 96/224/224 template shape) · Empty (no account) `65:48897` · Filtered-empty `65:49028`
- Error `65:54589` (custom chrome: icon circle + title + body + Retry, verbatim F.3 copy) · Partial/low-data `65:62724` (current-filters + 2 rows fall back to "No filters"/"No filters set") · Long-content-stress `65:62874` (all 6 rows 60+ char names/queries)
- OVERLAY / Saved Views / Delete confirm `65:70290` (scrim + `*Modal*/Confirmation` instance `65:70291`, danger-swapped right button)
- ENTRANCE `65:70423`→`65:70573`→`65:70723`→`65:74008`→Populated (4 frames, matches 3-section `--i` order: Header/SaveCard/ViewsList) · SPEC board `66:103690`
- Dev simulate-affordance row (Loading/Filtered-empty/Error triggers, since code has no organic path to those states) `66:72820`
- Inter→Geist sweep (page-wide): 944 text nodes scanned, 419 changed, 525 already-Geist, **0 blocked** (contrary to Q1's expectation, font overrides succeeded even on nodes nested inside library instances — no library-side ask needed for this page)
- Spec substitutions logged: Button set `792294bb…` used per PATCH01 §P5.1/§P5.2 workaround (exact variant-name string match + direct nested-TEXT mutation); confirmation modal `b4a185fa…` right button swapped to `Danger=True` variant
- **KNOWN BLOCKER (env, not a B8 defect) — flag to architect:** this session's `use_figma` rejects ALL cross-page reaction destinations for both `NAVIGATE` and `OVERLAY` ("destination may not be reachable from this source"), reproduced against B1's Populated (`39:13954`) and B9's drawer root (`39:24264`) even after priming the destination page via `setCurrentPageAsync`. This blocks: Apply-link → B1, each row's name-link → B2 Creatives Grid (`39:10206`), and (pending) the 8 cross-screen sub-nav tabs on every builder's page. Controls are built with hover states and logged on the SPEC board (⚠ rows) but carry no reaction until this is resolved — likely needs to be retried once every page has been opened at least once in the *same* editor session, or via the desktop app directly rather than this sandboxed API.
- Reads used: 5/5 (screenshots only — views-list check, stress-name truncation check, error-state check, rename-demo check, final post-sweep check). Zero discovery reads.
- **§F.4 focus-state gate closure pass (2026-07-30):**
  - **Correction to the audit's own finding:** `LOCAL/Saved Views/View Row`
    (`39:37979`) **already had a `State=focus` variant** (`39:37977`) before
    this pass — the task brief's "5 variants including renaming, no focus"
    claim does not match the live file. Sequential node IDs (`39:37974`–`39:37978`
    for default/hover/pressed/focus/renaming) indicate it was built in the
    original batch, just never surfaced in any doc or instance on this page.
  - **What was actually wrong with it: contrast, not absence.** Its ring used
    `CR2/Accent/primary` at full opacity (~#8FB821, ≈2.32:1 against white —
    fails the 3:1 non-text-UI floor). **Rebound to the new `CR2/Accent/focus-ring`
    token** (`VariableID:104:17008`, #5B7611, ≈5.19:1 against white — created
    on B3, shared file-level variable, not page-owned) — same fix applied to
    Ghost Action Button on B3.
  - **Doc cluster:** `STATES / Saved Views / Focus + variants` (`105:137482`,
    at `(0,6150)`) — all 5 View Row states as live instances, stacked
    (full-width component, so vertical layout instead of B3's horizontal
    cards), captioned, focus ring visibly correct.
  - **SPEC board `66:103690` corrected:** added a new row for "View Row (×6,
    the row container itself)" — it had **no entry at all** for its own
    5-state model before (existing rows only covered the Rename/Delete
    IconButtons and the View-name link nested inside it). **Read `SavedViews.tsx`
    directly to ground this in the real component, not guesswork:** the row
    wrapper is a plain `<div>`, not focusable — real keyboard focus lands on
    the View-name `<Link>` and the Rename/Delete `<button>`s independently, not
    the row as a whole. Documented this precisely: the row-level focus ring is
    a visual affordance, not a 1:1 match to a real DOM focus target; the two
    IconButtons are library instances whose internal focus-state coverage is
    unverified (per the task's don't-detach constraint).
  - **Metered reads used this pass: 0 of 3** — rebind, doc cluster, source
    read (local repo file, not a Figma read), and SPEC correction all done via
    `use_figma`/`Read`, zero hosted `get_screenshot`/`get_metadata`.

### B9 · Drawer · page 25:2964 — COMPLETE (wave 2)
- **Root `39:24264`** · header `39:24265` · AdPreviewMock `39:39527`
- 9 remaining bands (local auto-layout, per P5.3 — `CR2/Drawer Band` cannot be instanced):
  FunnelStrip `65:70319` · TrendChart `65:70362` · FatiguePanel `65:70391` ·
  ComponentBreakdown `66:45307` · ScriptElementsPanel `66:45360` · BenchmarkPanel `66:84124` ·
  DemographicsPanel `66:84166` · RunningInTable `66:84247` · VariantsList `66:100909`
- Sticky footer `DrawerActionBar` (8 actions, icon+label per P5.2) `66:105372`
- Variant frames (siblings on this page, offset right of root): `OVERLAY / Drawer / Loading`
  `66:118904` · `OVERLAY / Drawer / Non-video` `66:126136` · `OVERLAY / Drawer / Healthy` `66:126562`
- 3 action modals (each nested inside its own top-level scrim frame — use the **scrim's** id,
  i.e. `modal.parent.id`, as the reaction/CHANGE_TO destination, not the card id):
  `OVERLAY / Drawer / Pause confirm` `66:133565` · `OVERLAY / Drawer / Relaunch confirm` `66:133578`
  (+ spinner variant `66:133596`) · `OVERLAY / Drawer / Edit targeting` `66:133618`
- **`OVERLAY / Drawer / Populated — actioned (done states)` `70:16151`** — a full clone of root
  with the 5 optimistic buttons flipped to their done state (Relaunch→"Queued in Launch" disabled,
  Save→"Saved", Mark Winner→"Winner", Duplicate→"Duplicated", Pause→"Paused" disabled). This is
  the valid `NAVIGATE`+Smart-Animate destination other reactions point to — see wiring note below.
  A standalone footer-only version also exists at `69:84073` (superseded, kept for reference).
- **Wired:** close-X → Close; Save/Mark Winner/Duplicate buttons → `NAVIGATE` (not `CHANGE_TO` —
  see below) to `70:16151`, Smart Animate Ease Out 200ms; Relaunch/Pause buttons → Open Overlay
  their modal's **scrim**, Dissolve Ease Out 200ms; each modal's primary confirm button → `NAVIGATE`
  to `70:16151`; every modal's secondary/cancel button → Close. Placement select and per-button
  independent Change-To were **not** wired (see finding below) — left with hover states only, no
  dead click, per hygiene rule.
- **API finding (confirms B2's independent finding on the same wall):** `CHANGE_TO` navigation
  reactions are rejected ("destination may not be reachable from this source") when the destination
  is a raw component-set variant OR a node nested inside another frame — Figma requires the
  destination to be a **top-level page frame** for `NODE` actions. Working substitute:
  `navigation: 'NAVIGATE'` with a `SMART_ANIMATE` transition to a full top-level frame clone
  (matching layer names/positions so only the differing region visually animates). This is why
  the "actioned" state is a whole-root clone (`70:16151`) rather than per-button node targeting.
  `overlayPositionType`/`overlayBackground`/`overlayBackgroundInteraction` are confirmed **read-only**
  in the Plugin API (no setter exists) — cannot script "position Right / scrim 80%" on overlay
  destinations; must be set by hand in the editor UI if precise overlay chrome matters.
- **Spec error found:** table atom keys `Table Item / Header Item` (`4b11dbcaf97f43b58cf9cafb3855fe1eea873107`)
  and `Table Item / Cell` (`2a1fe912edf5c011af9343dc901673e83fc4fbc7`) do **not** resolve via
  `importComponentByKeyAsync` (`Component with key "..." not found`) — hand-built `RunningInTable`'s
  rows locally instead (sanctioned fallback given §D.3 already allows local screen-specific builds
  and the *Table* monolith is documented-broken anyway).
- **Blocked-font list (Q1 sweep, page-wide):** 188 text nodes inside library/Foundations instances
  couldn't be retargeted from Inter (Button labels, Select labels, Metric Cell/Confidence Chip/
  Bucket Chip/Why Dot internal labels, Badge labels) — expected per Q1, logged for Handoff page.
  44 nodes were successfully converted (wave-1 header/AdPreviewMock leftovers); 735 were already Geist.
- **Assumption logged:** exact verbatim copy wasn't available in source for the 3 modal bodies
  (Pause/Relaunch/Edit targeting confirm text) — wrote realistic non-placeholder copy consistent
  with product tone rather than leaving lorem/blank; flag for content review.
- Reads used: 1 hosted (`use_figma` discovery calls are write-exempt, not reads) — the only hosted
  read-tool call was the zero-mutation button/select/badge variant discovery, which itself was a
  `use_figma` write-exempt call, so **0 of 5 hosted reads used**. Local desktop
  (`mcp__Figma__get_metadata`/`get_screenshot`, separate quota) used ~12× for verification.
- **§K gate closure pass (2026-07-29) — SPEC board built, the one thing this page was missing:**
  - **`SPEC / Drawer / Interactions`** board `89:138045` at `(0, 4800)` — a fully clear row (nothing else
    on this page extends past `y≈4600`, where the modal-scrim frames end). Per this task's explicit
    scope, §F.3 (state-frame set) and §G.2 (entrance sequence) were **not** built here — this is an
    overlay, not a screen.
  - Documents: all 9 bands, the sticky `DrawerActionBar`'s 8 actions, the 3 action modals, and 25
    interaction rows total covering what's wired and what isn't, plus a "Known constraints" block
    (CHANGE_TO rejects component-set variants/non-top-level frames — hence the whole-drawer done-state
    clone `70:16151`; `overlayPositionType`/`overlayBackground`/`overlayBackgroundInteraction` read-only;
    `Table Item / Header Item`/`Cell` keys don't resolve; the 188-node blocked-font residue from the
    original Q1-era sweep, not re-attempted this pass).
  - **Prominently flagged, per this task's explicit instruction:** the 3 modal body strings (Pause
    confirm / Relaunch confirm / Edit targeting confirm) are **NOT verbatim from source** — called out in
    a dedicated red-text "⚠ CONTENT PASS NEEDED" block at the end of the board so it doesn't get lost.
  - **Font sweep on the new board:** 109 text nodes scanned, **0 Inter**, family = Geist only.
  - **Clipping check:** HUG-height auto-layout frame (`h=3112`), content can't exceed its own bounds.
  - **Reads used this pass: 0 of 3** — discovery (page layout, free canvas space) and verification (font
    sweep, clip check, screenshot) done entirely via `use_figma` (write-exempt) and in-script
    `node.screenshot()`.
- **Defect-fix pass (2026-07-30) — 2 pixel-verified defects on the drawer, fixed:**
  1. **`ComponentBreakdown` `66:45307` clipped value, fixed.** `"Trusted by 40,000 buyers"`
     (node `66:45325`) was truncating mid-word with no ellipsis ("Trusted by 40,000 bu"). Root
     cause: its parent `Column` (`66:45323`) is a **fixed 140px, `clipsContent:true`** container —
     an earlier attempt to widen the text node itself to 240px just got clipped by that mask
     before any ellipsis could render (the real overflow boundary was the column, not the text
     node's own box). Fixed properly: resized the text node to 136px (4px safety margin inside
     the actual 140px clip), `textAutoResize='TRUNCATE'`, `textTruncation='ENDING'` (character-
     count truncation was explicitly avoided per the task brief — native Figma truncation matches
     actual pixel width). Now renders **"Trusted by 40,000…"** cleanly. The underlying string
     (`characters`) was already the correct full value — same "structure was fine, only the
     render clipped" pattern as B5's digest fix.
  2. **`RunningInTable` "Active" status recolored out of danger-red.** All 4 `RunningInTable`
     variants on this page (`66:84247` populated/drawer-root, `66:126436`, `66:126862`,
     `70:16451` — 8 "Active" badges total; `66:118932` is a skeleton with no real badges) had
     their status pill using `#FF4D4F`-class red (bound to
     `VariableID:6d70936073226e9492c838f5d80ecfff3e82e5ec/4006:15009`) for a state that is not an
     error. Recolored to the **AA-safe lime `#5B7611`** (`{0.357,0.463,0.067}`, exactly matching
     the mandated hex, not the forbidden `#749818`) at 15% opacity for the pill background + full
     color for the label text, overriding the bound variable with an explicit success-tone solid.
     Only "Active" exists as a status value in every instance checked on this page — no other
     status words (Paused/Learning/etc.) are present to audit.
  - Reads used this pass: **0 of 3** (all via `use_figma` + free `node.screenshot()`).

### MONITOR-2 (second gate)

- **Fixed by the gate:** 11 dead-click actions removed from flow page `66:74040`
  (cloned frames whose reactions still pointed at source pages: 3 Overview bucket
  tabs → `50:13882`/`50:11301`/`50:12632`, 6 Saved-views Rename → `65:54289`,
  6 Delete → `65:70290`, 2 Automations Segmented → `39:30169`/`39:37989`; verified
  395→384 actions, 0 dead remaining, all 16 row→drawer links to `78:13253` intact).
  Motion fixes: B7 `70:87815` DISSOLVE 1ms → Instant; B8 `39:31296` 280→200ms; B6
  wizard `Content` ×6 280→200ms. AFTER_TIMEOUT entrance hops deliberately left at
  280ms per §G.2.
- **Accessibility — VIOLATIONS.** Per-page failing text segments (verified pages
  only): B1 405/1537, B2 387/1129, B3 440/1376, B4 316/1336, B5 182/702.
  **B6/B7/B8/B9/Flow NOT VERIFIED** with the corrected method. Methodology
  correction, recorded prominently: **Figma mirrors a bound variable's alpha into
  `paint.opacity`**, so multiplying alpha again double-counts it and understates
  ratios — the gate's first pass claimed 5,626 failures and was discarded. Worst
  classes: `#bbbbbb` on `#f5f5f5` = **1.75** (search placeholder, all 9 pages);
  white on lime `#8fb821` = **2.32** (every primary CTA); `#d97706` on `#fef5e7` =
  **2.95** (`CR2/Attention/text`, fatigue + confidence chips); `#8c8c8c` on white =
  **3.35**; **`colorTextTertiary` `#0f0f0c`@55% on white = 4.24 — fails AA by
  design and is the highest-volume text token in the build (B3 ×306, B1 ×214)**.
  Also: **two different variables both named
  `Colors/Neutral/Text/colorTextTertiary`** with different values (4.24 and 3.35)
  — a live §T4 duplication instance. Disabled controls (B5 `#bbbbbb` "Run now")
  are WCAG-exempt and were correctly cleared.
- **Focus states: 2 exist, ~14 interactive element classes need them.** Only
  `LOCAL/Components/Ghost Action Button` (B3) has a real `State=focus`; B7
  `69:83905` has an unwired Textarea `Focused` swatch. B1/B2/B4/B5/B6/B9/Flow
  have zero `/focus/` layers. §F.4 unmet. Several SPEC boards describe focus
  states in prose that don't exist as artwork — doc/reality mismatch, flagged.
- **§K.5 state coverage:** only 3 local component sets exist file-wide — Ghost
  Action Button (B3, missing `loading`), Tab Pill (B3, missing `focus`, and uses
  `selected/default` where §F.1 mandates `active/inactive`), Saved Views View Row
  (B8, missing `focus`). Screen-level §F.3 coverage passes; element-level §F.2
  essentially does not exist.
- **Copy: 3 drifts.**
  1. B3 drops "yet" → `Not enough data (n=…)` vs source
     `Not enough data yet (n=${n})` (4 on B3 + 1 on flow snapshot; B6 renders it
     correctly, proving the string; B3's registry entry admits shortening it to
     fit the column).
  2. **B4's invented `N/A — no purchases yet` — fixed this pass.** Node
     `I65:46069;39:24224` on page `25:2959` (name "Value", the CPA cell in
     `LOCAL/Compare/Column`) read the invented string. Replaced with
     **`No purchases`**, verbatim from `src/creative-report/components/
     CompareColumn.tsx:51` (`title: m.cpa === null ? "No purchases" : undefined`
     — the exact copy the source renders for a null-CPA cell). Confirmed via
     Plugin API before/after: `"N/A — no purchases yet"` → `"No purchases"`.
  3. B9's 3 modal bodies still non-verbatim (Pause/Relaunch/Edit targeting
     confirm text — flagged by B9 itself as needing a content pass).
  **Verified verbatim and correct:** `N/A — no video`, all 4 confidence-chip
  method strings, all 4 bucket formulas, the digest disclaimer, `No purchases`,
  GenieHandoffStub badge, and B5's 3-letter weekday labels (**B5 was right and
  the spec was wrong** — `digestStore.ts:14` is `["Sun","Mon",…]`).
- **Unresolved spec-vs-source conflict:** §F.4/§K.10 forbid a bare `—`, but
  `ConfidenceChip.tsx` sets the `na` label to literally `"—"`. B3's 10 bare-dash
  chips and B9's one are faithful to code and in breach of spec simultaneously.
  The chip carries a tooltip reason, so it arguably meets intent. Needs a human
  call — code or spec has to move.
- **Shell master defects inherited by all 9 pages** (`30:3599`, text nodes
  `30:3081`/`30:3083`/`30:3078`): date range reads
  **`2025-10-02 → 2020-11-02`** (end date five years before start, and disagrees
  with the filter bar's "1 Jul – 30 Jul"); tips banner typo
  **"Select Creative sor Adgroups"** → should be "Creatives or Adgroups".
  **Because pages were cloned, not instanced, ~140 frames each carry their own
  copy** — the master fix only helps future clones.
- **Chart reflow:** `CR2/Chart Placeholder`'s main is natively 700px and its
  children have no stretching constraints, so a 1096px instance leaves exactly
  396px dead. Affects B6 `39:24294` + `66:72160`, likely B1, and is the same
  class as PATCH 06's logged B4 `Chart — line-multi` 220px overflow. (Another
  agent is fixing this in Foundations — in-progress, not touched here.)
- **Not verified, state plainly:** corrected contrast for B6/B7/B8/B9/Flow;
  library component sets' internal §F.2 conformance; hit-target sizes (§F.4
  ≥32×32, never measured); screen-reader and colour-blind checks (out of reach
  in Figma).

## Cross-screen wiring queue (sync orchestrator owns this)
- [ ] Every creative row/card on B1,B2,B4,B5 → Open Overlay `39:24264`, Move In from Right, Ease In And Out, 500ms
- [ ] 8 sub-nav tabs → each screen's Populated frame (needs all 9 ids above)
- [ ] Overview "View all N in grid" → B2 Grid Populated
- [ ] Overview "Open Automations" → B5 Rules Populated
- [ ] Re-point any FF-non-new component keys → FF-new equivalents
- [ ] Page Body unclip fix wherever content > 654px
- [ ] Handoff page `25:2965`: J-list, substitution log, blocked-font log, motion spec

---

### FINAL SWEEP + FINAL GATE (2026-07-30)

Third and closing gate. Ten per-page sweep agents, nine builders, two prior monitor
gates and six fix agents preceded this. **0 metered reads used** (all work via
write-exempt `use_figma` + free in-script `node.screenshot()`).

#### 1. METHODOLOGY CORRECTION — this invalidates every prior "N nodes scanned" figure

**`page.findAll()` on this file returns inconsistent traversal depth.** A first
`findAll` immediately after `page.loadAsync()` under-reports; a second traversal in the
same script sees more, because instance subtrees load lazily. Reproduced deterministically
on B2: pass 1 = **0** `Ellipse N` layers, pass 2 = **330**. It also silently omits
instance-internal nodes: B1 shallow = 828 text nodes, **deep = 1833**.

**Rule for anyone auditing this file: never trust `findAll` for a "zero X" claim.** Use
explicit recursion over `.children` (which always descends into instances). Every
scan-total in the blocks above (including this gate's own first-pass numbers) is a
**lower bound, not a count**. Two false passes were caught inside this gate by re-running
warm — one of them would have recorded "shell page is Inter-free" when 54 Inter nodes
remained.

#### 2. RECONCILED SWEEP COUNTS — reported vs. independently verified

Shell-defect strings (`2025-10-02`, `2020-11-02`, `Creative sor Adgroups`):

| Page | Reported | Verified | Result |
|---|---|---|---|
| B1 `25:2956` | 17 | 17 | ✅ |
| B2 `25:2957` | 12 | 12 | ✅ |
| B3 `25:2958` | 15 | 15 | ✅ |
| B4 `25:2959` | 17 | 17 | ✅ |
| B5 `25:2960` | 10 | 10 | ✅ |
| B6 `25:2961` | 14 | 14 | ✅ |
| B7 `25:2962` | 12 | 12 | ✅ |
| B8 `25:2963` | 14 | 14 | ✅ |
| B9 `25:2964` | 0 | 0 | ✅ |
| Flow `66:74040` | 8 | 8 | ✅ |
| Handoff `25:2965` | 0 | 0 | ✅ |
| **Total** | **119** | **119** | ✅ |

Per-page tallies and the 119 frame total **reconcile exactly**. New strings
(`2026-07-01`, `2026-07-30`, `Select Creatives or Adgroups`) appear the expected number
of times on every page.

**DISCREPANCY 1 — the sweep missed 3 frames.** "Zero occurrences anywhere" was **false**.
Page `25:2955` carries three shell **state** frames that no sweep touched:
`32:5668` (Loading), `32:5793` (Empty), `32:5918` (Filtered empty). Each held all three
defect strings — 9 text nodes total. The master `30:3599` itself was clean (its
exception-#2 fix held). **Fixed this pass** (see §4). True defective-frame population was
**122, not 119**.

**DISCREPANCY 2 — placeholder count was ~73, actually 126.** See §3.

**Fragment search** (`"2025"`, `"2020"`, `"sor Adgroup"`, `"Select Creative "`) found no
near-miss variants. One benign hit: Handoff `84:114473` contains `"B1 2020 (17 frames
moved)"` — a row-pitch value, not a date. Documented so it is not "fixed" later.

**White/near-white text on a lime `#8fb821` ancestor: 0 file-wide.** Verified with both
bare `.fills` and per-segment `getStyledTextSegments(['fills'])` on all 13 pages. The 11
recoloured nodes (B6 8, B5 2, B1 1) are confirmed done; no mixed-fill node is hiding one.

#### 3. THE PLACEHOLDER ACCESSIBILITY FIX — done, 126 nodes

**Contrast maths validated before any write.** Reproduced all three mandated check values
exactly: `#0f0f0c`@55% on white = **4.24** · white on `#8fb821` = **2.32** ·
`#0f0f0c`@25% on white = **1.76**. The alpha-mirroring trap did not apply here —
the placeholder paint has `boundVariables: {}`, so alpha was composited **once**.

**The backdrop is not white — this reconciles the two conflicting audit readings.** The
`Search Input` frame carries its own `#000000 @ 4%` fill over a white parent, so the true
backdrop is **`#f5f5f5`** (244.8). That is why MONITOR-2 measured **1.75** (`#bbbbbb` on
`#f5f5f5`) and the final audit measured **1.76** (`#0f0f0c`@25% on white) — both were
right about different layers. Against the real backdrop the starting ratio was **1.752**.

- Minimum alpha to clear 4.5:1 over `#f5f5f5` = **0.576**.
- **Applied: `opacity 0.25 → 0.62`** on `#0f0f0c`.
- **After: 5.24:1 on the real `#f5f5f5` field backdrop** (5.40:1 on pure white). Passes
  AA with headroom, and stays visibly subordinate to entered-value text (~19:1).

**126 nodes fixed, 0 errors, 0 blocked, 0 nodes classified blocked without an attempted
write.** Every one re-read and verified at 0.62:

`25:2955` 4 · B1 17 · B2 12 · B3 15 · B4 **19** · B5 10 · B6 14 · B7 **13** · B8 14 ·
B9 0 · Flow 8.

**Count discrepancy vs the reported ~73:** the true population is **126**. 73 is exactly
the cumulative total through B5 — the audit's figure appears to be a partial scan that
stopped early. Also corrected: the audit said placeholders were "present on all 9 pages" —
**B9 has none** (the drawer has no search field), while the shell template page and the
Flow page (never counted) do.

Two nodes the reported count missed entirely:
- B4 has 19 placeholders against 17 date instances.
- B7 `69:83856` (`"Search creatives or products…"`, Brief-builder overlay) sat at
  **0.55** = 4.24:1, not 0.25. PATCH 07 §V2 accepted `colorTextTertiary` at 4.24 for
  general text, but this is **placeholder text conveying the field's purpose**, which is
  not exempt under WCAG. Raised to 0.62 with the rest.

#### 4. MASTER + SHELL-PAGE EDITS ON RECORD

**`30:3599` second sanctioned edit — unchanged and confirmed.** §A.3 was already amended
with SANCTIONED EXCEPTION #2 (dates `30:3081`/`30:3083`, typo `30:3078`). This gate
re-verified it holds and made **no further edit to the master**. Provenance, stated
accurately: that authorisation came **via the final-sweep task brief issued by the
coordinating session, traceable to Maalik's mandate for the sweep — not from a personal
sign-off by Maalik on that specific node list.**

**NEW — SANCTIONED EXCEPTION #3, page `25:2955` state frames only.** Same provenance as
above: authorised by **this gate's task brief from the coordinating session** ("You MAY
edit any page including the master and Foundations if a fix genuinely requires it"), **not
by a personal Maalik sign-off.** Justification: leaving `"Creative sor Adgroups"` and an
end-before-start date range in three shipped state frames would contradict the entire
point of the sweep, and §K's "zero occurrences" cannot be certified while they stand.

- 9 text writes, canonical font-load recipe, nothing detached:
  `32:5760`/`32:5885`/`32:6010` typo · `32:5763`/`32:5888`/`32:6013` → `2026-07-01` ·
  `32:5765`/`32:5890`/`32:6015` → `2026-07-30`.
- Page re-verified: **0 defect strings, 4 of each corrected string** (master + 3 states).
- **The master `30:3599` was explicitly excluded from every write in this pass.**

#### 5. CORRECTION TO B9's REGISTRY NOTE — no propagating fix exists

The sweep's B9 note claimed its lime labels *"inherited the fix automatically because the
master's variable-value fix propagates."* **That is wrong on both halves and must not be
relied on.**

1. **No variable-value fix was ever made** — not on the master, not in Foundations, not
   in the library. There is no propagating mechanism in this file at all.
2. **Those labels were already dark.** They never needed the fix. This gate's independent
   white-on-lime scan of B9 returned **0** before any colour write was made.

Anyone reading that sentence would assume a live propagation path they could rely on for
future lime CTAs. **There is none.** The pages are **clones, not instances** (§A.3) — every
lime label must be fixed per-node, per-page, forever.

**Related false guard, also corrected:** B9's block above logs *"188 text nodes inside
library/Foundations instances couldn't be retargeted from Inter"*. **Instance-internal font
writes work.** This gate performed 174 of them (54 shell + 5 B3 + 115 Foundations) with
**0 errors**. B9 is now deep-verified at **0 Inter**. The 188-blocked-node claim is the
same false-guard class as the 780 phantom blocked font nodes — nothing was ever blocked;
it was never attempted correctly.

#### 6. §P2 (NO INTER) — was NOT clean, now clean on 12 of 13 pages

Every prior gate reported zero Inter. They measured builder pages with shallow traversal
only. Deep recursion found **181 Inter text nodes** on the two architect-owned pages:

- **Foundations `25:2954`: 121** (103 plain, 18 in instances) — 96 of them **inside the
  shared `CR2/*` main components**. Builder-page instances override to Geist, which is why
  this stayed invisible: the components were Inter *at source*, so **every future instance
  would have come in as Inter.** This was the root cause of the whole Inter problem.
- **Shell `25:2955`: 54** — all inside external-library instances (`*Badge*`,
  `Breadcrumb Link`, `Breadcrumb Separator`, `Tab Item / Basic`), all in the 3 state
  frames. **Master `30:3599` = 0, confirmed clean.**
- **B3 `25:2958`: 5** and **Flow `66:74040`: 1** — `Tab Item / Basic` "Overview" labels.
  The library's **Default** variant ships Inter while Active ships Geist; builders only
  ever overrode the Active one. **Self-inflicted disclosure: the Flow one was introduced
  by this gate's own §K.2 tab fix** (setting State=Default swapped in the Inter variant).
  Caught and fixed in the same pass.

**Fixed: 175 nodes → Geist** (Inter Regular→Regular, Medium→Medium, Semi Bold→SemiBold),
0 errors. Foundations components screenshot-verified after the swap: `CR2/Bucket Chip` and
`CR2/Confidence Chip` render clean, no reflow, no clipping.

**Final deep Inter count: 12 of 13 pages = 0.**

**OPEN — 6 nodes, needs a design call (NOT fixed, deliberately).** Foundations `28:3657`,
`28:3667`, `28:3677`, `28:3687`, `28:3697`, `28:3707` — the `"No data"` labels in
`State=na` variants, set in **Inter *Italic***. **Geist has no Italic** (available: Thin,
ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, Black). Options:
(a) Geist Regular — satisfies §P2 but silently removes a deliberate visual marker on the
missing-data state, which §F.4/§K.10 care about; (b) keep Inter Italic — breaches §P2.
This is a design decision, not a mechanical fix, so it was left for Maalik rather than
guessed.

#### 7. NEW DEFECT CLASS — 2,868 dead prototype actions (largest in the file, never counted)

MONITOR-2 removed 11 dead cross-page frame links on the Flow page and recorded "0 dead
remaining". That was true only of the class it measured. Counting **every** `NODE` action
whose destination does not resolve on its own page (§S6: reactions are page-scoped):

| Page | Actions | **Dead** |
|---|---|---|
| B1 | 458 | **390** |
| B2 | 334 | **281** |
| B3 | 393 | **345** |
| B4 | 480 | **439** |
| B5 | 295 | **235** |
| B6 | 393 | **340** |
| B7 | 320 | **277** |
| B8 | 375 | **332** |
| B9 | 52 | **4** |
| Flow | 233 | **133** |
| Shell `25:2955` | 96 | **92** |
| **Total** | | **2,868** |

Every destination is a **COMPONENT variant inside a COMPONENT_SET** — e.g. `3:216` =
`variant=1,:hover=true` in set `Component 1`; `3:45` = a `Tab Item / Basic` variant;
`12:5093` = a `*Button*` variant. Figma cannot navigate to a component variant, so each is
a dead click. They sit on the cloned FabAds global sidebar (`aside.relative` →
`Component 1`/`Component 3`), i.e. **import artifacts from the original shell capture**:
almost certainly intended as hover variant-swaps that came through as `NODE` navigations.

**NOT fixed — deliberately, and this is a recommendation not a defect I am hiding.** The
reactions live on instance nodes and *are* writable, so a sweep is mechanically possible.
It was not done because (a) they originate in the frozen master `30:3599`, so fixing the
9 clones while the master keeps them leaves the file inconsistent and re-seeds the defect
on the next clone; (b) deleting 2,868 reactions destroys the record of intended hover
behaviour, which someone may want **converted** to proper `CHANGE_TO` variant swaps rather
than removed; (c) a mutation of that size at a closing gate cannot be re-verified within
this pass. **This needs a Maalik/architect decision: convert or delete, master first.**

#### 8. HIT TARGETS (§F.4 ≥32×32) — a LIBRARY-SIDE ASK, not a build defect

634 elements measured under the 32×32 minimum. The **confirmed** ones:

- **`Icon/CloseOutlined` at 14×14** — every page, inside library `*Alert*` chrome whose
  own parent is only **30px** tall.
- **B6 checkbox rows at 19px** tall.
- **B8 breadcrumb rows at 22px** tall.

**These sit in library-owned chrome and cannot be fixed without editing the external
library `7h5lI7IieGCuAuySfJVKxS` or detaching the instance — both forbidden.** Stated
plainly: this is an ask to the library owners, not work the build can do or should be
marked down for.

**Probably inflating the 634 — flagged but NOT verified as interactive:** `CR2/Bucket Chip`
and `CR2/Confidence Chip` (14–15px). **Zero prototype reactions anywhere in their ancestor
chain**, and they read as **status tags, not controls**. §F.4 governs *interactive* targets,
so these likely do not belong in the count at all. Nobody has confirmed either way — do not
treat 634 as a verified figure.

#### 9. §K VERDICT PER PAGE

Checked per page: zero Inter (deep) · no `Frame N`/`Group N`/`Rectangle N`/`Ellipse N` ·
no detached instances · no Page Body clipping · no overlapping frames · exactly one active
tab per strip · flow-start marker · no dead-click reactions.

| Page | Verdict | Specifics |
|---|---|---|
| **B1** `25:2956` | **PARTIAL** | Inter 0 ✅ · names 0 ✅ · clipping 0 ✅ · overlap 0 ✅ · tabs 1-active ✅ · 2 flow starts ✅ · screenshot clean. **Fails only on 390 dead actions (§7).** |
| **B2** `25:2957` | **PARTIAL** | Inter 0 ✅ · overlap 0 ✅ · tabs ✅ · screenshots (grid + table) clean. **281 dead actions.** 330 `Ellipse N` layers **inside library instances** — unfixable without detaching, reclassified library-side like §8. 29 table rows have a mis-parented `Divider` (1128px wide rect at x=1064 inside a HORIZONTAL auto-layout, so only ~64px draws) — **visually verified harmless** in the table screenshot, logged as cosmetic. |
| **B3** `25:2958` | **PARTIAL** | Inter **5 → 0 (fixed this pass)** · names 0 ✅ · clipping 0 ✅ · overlap 0 ✅ · tabs 1-active ✅ (the historic 2-active on 5 frames has **not** returned) · screenshot clean. **345 dead actions.** Known copy drift unfixed: `Not enough data (n=…)` missing "yet" (B6 renders it correctly). |
| **B4** `25:2959` | **PARTIAL** | Inter 0 ✅ · names 0 ✅ · overlap 0 ✅ · tabs ✅ · screenshot clean, `N/A — no video` verbatim ✅. **439 dead actions.** 2 × `Chart — line-multi` overflow 50px (pre-logged PATCH 06). |
| **B5** `25:2960` | **PARTIAL** | Inter 0 ✅ · names 0 ✅ · clipping 0 ✅ · overlap 0 ✅ · tabs ✅ · screenshot clean (disabled "Run now" is WCAG-exempt; inline red rule-error is intentional). **235 dead actions.** |
| **B6** `25:2961` | **PARTIAL** | Inter 0 ✅ · names 0 ✅ · overlap 0 ✅ · tabs ✅. **Charts now render full-width — the half-filled-chart defect is genuinely fixed**, and "Testing velocity" bars span correctly. `Not enough data yet (n=0)` verbatim ✅. **340 dead actions.** 30 frames flag y-overflow 329px, all `aside.relative`/`aside.flex` = the shell sidebar taller than the 800px viewport (real-world scroll behaviour, not content loss). |
| **B7** `25:2962` | **PARTIAL** | Inter 0 ✅ · names 0 ✅ · overlap 0 ✅ · tabs ✅ · screenshot clean and complete; `Send to Genie` lime CTA has **dark** label ✅ (§V3). **277 dead actions.** 11 clip flags: `STATES` board x+136, 4 `ENTRANCE` frames y+52 — **not visually verified individually**. |
| **B8** `25:2963` | **PARTIAL** | Inter 0 ✅ · names 0 ✅ · clipping 0 ✅ · tabs ✅ · 2 flow starts ✅ · screenshot clean. **Overlap FIXED this pass:** stray top-level `Icon / BookOutlined` `39:24936` sat at (0,0) over the Populated frame → parked at (9360,2000) and renamed, page now 0 overlaps. **332 dead actions.** |
| **B9** `25:2964` | **PARTIAL** | Inter 0 ✅ (deep) · names 0 ✅ · SPEC board `89:138045` **confirmed present** ✅ · `RunningInTable` "Active" badges verified **`#5b7611` on `#5b7611`@15% — out of danger red, 8/8** ✅. **Overlap FIXED this pass:** 4 confirm/scrim frames overlapped the tall drawer frames by up to 720×900 → relocated to a clear row (`66:133564`→5000,0 · `66:133577`→6520,0 · `66:133608`→8040,0 · `66:133617`→9560,0), page now 0 overlaps. **4 dead actions.** Still open: 3 modal bodies non-verbatim (content pass needed). |
| **Flow** `66:74040` | **PARTIAL** | Inter **1 → 0 (fixed)** · overlap 0 ✅ · **the 11 removed dead links have NOT returned** ✅. **2 defects FIXED this pass:** (a) **§K.2 two-active sub-nav** — `77:6761` had both Overview and Components `State=Active`; `77:6762` set to Default, screenshot-verified single active; (b) **15 default layer names** (`Group 372`, `Frame 1000002832`, `Frame 2147225662`…) renamed, now 0. 66 `Ellipse N` remain **inside library instances** (same reclassification as B2). **133 dead actions.** |
| **Handoff** `25:2965` | **PASS** | Inter 0 ✅ · names 0 ✅ · overlap 0 ✅ · 0 reactions so no dead clicks ✅. 3 doc boards flag x-overflow 12–84px (text boards, cosmetic). |
| **Foundations** `25:2954` | **PARTIAL** | Inter **121 → 6 (fixed 115)**; the 6 remaining Inter Italic `"No data"` labels need the design call in §6. Post-swap screenshots clean. |
| **Shell** `25:2955` | **PARTIAL** | Defect strings **3 frames → 0 (fixed)** · Inter **54 → 0 (fixed)** · master `30:3599` clean and untouched ✅ · State—Empty screenshot verified (Geist, correct dates, corrected banner, darker placeholder, dark-on-lime CTA). **92 dead actions.** |

**B2's and B9's previously-standing verdicts are genuinely closed, verified not assumed:**
B2's ENTRANCE chain (`89:53113`→`89:53271`→`89:53429`→`89:53587`) and SPEC board
`90:22172` are present, and B2 now shows 1-active tabs on all 10 strips. B9's SPEC board
`89:138045` is present at (0,4800).

**No page is a clean PASS except Handoff**, and the single reason every screen sits at
PARTIAL is the 2,868 dead actions in §7. On every other §K axis the builder pages are
clean.

#### 10. WHAT THE SCREENSHOTS ACTUALLY SHOWED

Populated frames of B1–B9 + shell State—Empty + Foundations chips + Flow sub-nav were
rendered and **looked at**, not just structurally checked.

- **Genuinely fixed and confirmed by eye:** B6's charts fill their width (the half-filled
  chart is gone); no tofu glyphs anywhere; dates read `2026-07-01 → 2026-07-30`; the tips
  banner reads "Select Creatives or Adgroups"; the search placeholder is legibly darker;
  lime CTAs carry dark labels; B9's "Active" badges are lime not red.
- **One thing the structural checks would never have caught, found by eye:** the
  **bottom-left card in B2's Populated (Grid)** renders as a **skeleton — grey placeholder
  bars where the title and brand should be, no thumbnail, no bucket badge — while still
  showing real metrics** ($2.9k / 2.20× / $20.40). A skeleton card inside a *Populated*
  frame is wrong: partial/loading treatment belongs in the Partial or Loading frame per
  §F.3. **NOT fixed** (needs B2's owner to decide whether it is a stray leftover or an
  intentional "still loading" affordance) — but it is a real visual defect and it is
  logged here so it is not lost.

#### 11. NOT VERIFIED — state plainly

An honest unverified beats an inferred pass.

- **Contrast beyond the placeholder.** Only the placeholder token was recomputed. The other
  MONITOR-2 classes are **untouched and still failing**: white on lime `#8fb821` = 2.32
  (every primary CTA fill, though §V3 rules the fill stays), `#d97706` on `#fef5e7` = 2.95,
  `#8c8c8c` on white = 3.35, and `colorTextTertiary` at 4.24 (accepted deviation, §V2).
  Per-page failing-segment counts were **not** re-run with deep traversal — given §1, the
  earlier per-page figures (B1 405/1537 etc.) are **undercounts**.
- **Focus states.** Not re-checked this pass. MONITOR-2's finding stands: 2 exist, ~14
  element classes need them. §F.4 unmet.
- **§F.2/§K.5 element-level state coverage.** Not re-checked. Only 3 local component sets
  exist file-wide.
- **Detached instances (§K.3).** No reliable detection method was found — a detached
  lookalike is structurally indistinguishable from a legitimate local build, and §D.3/§P5.3
  explicitly sanction local builds. **Reported as unverified on all 13 pages**, not passed.
- **Hit targets.** The 634 figure is **not** verified (see §8); only the 3 named classes are.
  Bucket/Confidence chip interactivity unconfirmed.
- **B7's 11 clip flags** and **B9/Handoff/Flow clip flags** were not individually eyeballed.
- **Animation conformance to §G.1** (durations/curves) not re-measured this pass.
- **Screen-reader and colour-blind checks** — out of reach in Figma, as before.
- **Only the Populated frame of each page was screenshot.** Loading / Empty /
  Filtered-empty / Error / Partial / Long-content-stress / ENTRANCE frames were **not**
  visually inspected (except the shell's State—Empty). Given that every visual defect in
  this build escaped structural checking, **the non-Populated frames remain the most likely
  place for an unfound defect.**

#### 12. EXACTLY WHAT THIS GATE CHANGED

| # | Change | Nodes |
|---|---|---|
| 1 | Search placeholder alpha 0.25→0.62 (and 0.55→0.62 on `69:83856`) — 1.75:1 → **5.24:1** | **126** |
| 2 | Shell state-frame defect strings (dates + typo), master excluded — Exception #3 | 9 |
| 3 | Inter→Geist, shell state frames (plain) | 24 |
| 4 | Inter→Geist, shell state frames (library-instance internals) | 54 |
| 5 | Inter→Geist, Foundations (115 of 121; 6 Italic left for a design call) | 115 |
| 6 | Inter→Geist, `Tab Item / Basic` "Overview" labels — B3 5, Flow 1 | 6 |
| 7 | Flow §K.2 fix — `77:6762` State Active→Default (single active tab restored) | 1 |
| 8 | Flow §K.4 fix — 15 default layer names renamed | 15 |
| 9 | B8 overlap fix — stray `Icon / BookOutlined` `39:24936` parked + renamed | 1 |
| 10 | B9 overlap fix — 4 confirm/scrim frames relocated to a clear row | 4 |
| | **Total mutated** | **355** |

**0 write errors. 0 nodes classified "blocked" without an attempted write. Nothing
detached. External library `7h5lI7IieGCuAuySfJVKxS` and the `REF ·` page untouched.
Master `30:3599` untouched by this pass. Light theme only. Geist only.**

#### 13. OPEN ITEMS HANDED FORWARD (ranked)

1. **2,868 dead prototype actions** — convert to `CHANGE_TO` or delete; **master first**,
   or every future clone re-seeds them. Needs a decision.
2. **6 Inter Italic `"No data"` labels** in Foundations — Geist has no Italic. Design call.
3. **B2 skeleton card** in Populated (Grid) — stray leftover or intentional?
4. **Focus states** — ~14 element classes still missing them (§F.4).
5. **Hit targets** — library-side ask to the `*Alert*`/breadcrumb/checkbox owners (§8).
6. **B9's 3 modal bodies** — still non-verbatim, content pass needed.
7. **B3 copy drift** — restore "yet" in `Not enough data yet (n=…)`.
8. **Bare `—` in `ConfidenceChip`** — spec-vs-source conflict, still needs a human call.

---

### ADDENDUM — MAALIK'S TWO RULINGS, EXECUTED (2026-07-30, same gate)

**§9's verdict table and §13's open list are SUPERSEDED by §15 and §17 below.** Both
rulings arrived via the coordinating session after the gate's first report. Recorded here
so a future reader knows these were **decisions, not accidents**.

#### 14 · RULING 1 — DELETE all dead prototype actions (Maalik chose deletion over conversion)

**Maalik's reasoning, on record:** a dead click reads as broken to a reviewer, and this is
**inherited sidebar chrome, not the module's own interaction design** — so the record of
intended hover behaviour is not worth the risk of leaving thousands of dead targets in a
handoff prototype.

Executed with the safety envelope the coordinator specified: **only** actions whose
destination is a COMPONENT variant inside a COMPONENT_SET were deleted; every other
reaction was left untouched. Page by page, warm double-pass verification after each.

| Page | Deleted | Live NODE actions before → after | Total actions before → after | Dead remaining |
|---|---|---|---|---|
| B9 `25:2964` *(canary)* | 4 | 8 → **8** | 56 → 52 | **0** |
| B1 `25:2956` | 429 | 30 → **30** | 511 → 82 | **0** |
| B2 `25:2957` | 953 | 30 → **30** | 1008 → 55 | **0** |
| B3 `25:2958` | 360 | 33 → **33** | 408 → 48 | **0** |
| B4 `25:2959` | 456 | 22 → **22** | 499 → 43 | **0** |
| B5 `25:2960` | 260 | 9 → **9** | 337 → 77 | **0** |
| B6 `25:2961` | 354 | 22 → **22** | 408 → 54 | **0** |
| B7 `25:2962` | 289 | 6 → **6** | 332 → 43 | **0** |
| B8 `25:2963` | 346 | 24 → **24** | 509 → 163 | **0** |
| Flow `66:74040` | 275 | 74 → **74** | 385 → 110 | **0** |
| Shell `25:2955` *(state frames only)* | 72 | 0 → **0** | 100 → 28 | **0** in states |
| **TOTAL** | **3,798** | | | |

**COUNT DISCREPANCY — my count wins: 3,798 deleted, not 2,868.** The 2,868 estimate came
from the shallower traversal described in §1; the deep per-page pass found **930 more**.
Worst divergence: **B2 953 vs 281 estimated** (its four ENTRANCE clones and overlay frames
were never reached by the shallow walk). B1 429 vs 390, B8 346 vs 332.

**WIRING-SURVIVAL PROOF — nothing protected was lost, on any page:**
- **Live (resolvable) NODE actions: identical before and after on all 11 pages** — the
  column above is the proof. Sub-nav links and in-page tab strips are inside this count.
- **Flow page specifically:** the **16 row→drawer overlay links to `78:13253` survived
  intact (16 → 16)**, all **22 OVERLAY-navigation actions** survived, and the **live
  destination histogram is byte-identical before and after** (`78:13253`×16, `77:6504`×8,
  `77:6724`×8, `77:6662`×7, …). Flow's live NODE actions: **74 → 74**.
- **Every `{type:"CLOSE"}` action survived** (B5 4→4, B7 5→5, B8 2→2, B9 6→6, Flow 2→2).
- **Every `AFTER_TIMEOUT` entrance trigger survived**, signature-identical per page.
- **`totalDropped === deletedCount` on all 11 pages** — the live count dropped by exactly
  the deleted count and by nothing more. **0 errors, 0 nodes failed to write.**

**Two things worth flagging from the deletion pass:**
1. **The master `30:3599` still holds 24 dead actions — deliberately excluded.** Verified
   **byte-identical before and after** (`masterUntouched: true`); the shell page's 72
   deletions were confined to the three state frames. §A.3 freezes the master and
   Exceptions #2/#3 were text-only, so its reactions were out of scope. **This is the one
   place the defect can still re-seed: any future clone of `30:3599` inherits all 24.**
   It needs its own authorisation to clear.
2. **Correction to the entrance-timing note.** The coordinator's guard list described the
   entrance chains as "AFTER_TIMEOUT at 280ms". The actual **trigger timeouts are 0.06s
   (60ms)** on B1–B5/B7/Flow, plus `0.8`/`1.6` on B6 and `0.9` on B8. The 280ms figure is
   the **transition duration**, not the trigger timeout. All were preserved unchanged
   either way — recorded so the next reader does not "fix" a 60ms trigger to 280ms.

**One methodology note, for honesty:** an intermediate whole-file sweep reported 6 residual
dead actions on Flow. Re-tested by **actual page-ancestry** rather than id-set membership,
the true figure is **0** — the "6" was the §1 lazy-depth artifact producing an incomplete
id set, which makes live actions look off-page. The ancestry test is the reliable one.

#### 15 · RULING 2 — B2's card was a STRAY. Fixed. It was NOT a skeleton.

**Maalik's reasoning, on record:** a skeleton displaying real metrics is incoherent —
either the data has loaded or it hasn't — so it is a leftover, not a design choice.

**The diagnosis changed on inspection, and the ruling still holds.** It was never a loading
skeleton. The card was `CreativeCard / Mamaearth · Rice Water Shampoo **(hover)**`
(`39:39393`) with its **`Quick Peek Overlay` (272×328) left visible** — a near-full-card
semi-opaque white panel showing SPEND/ROAS/CPA, washing the real title, brand, chips and
metrics beneath it to a grey ghost. That is what read as "skeleton bars with real metrics".
It is the **hover-state card parked in the Populated frame** — precisely the "hover overlay"
defect class flagged earlier in this build. *(The overlay's metrics did match this card —
no wrong-creative mismatch.)*

**The coordinator's instinct was right: the card was cloned, so the defect was cloned too.
6 copies found, all fixed:**

| Node | Frame |
|---|---|
| `39:39393` | `CR2 / Creatives / Populated (Grid)` |
| `89:53261` | `ENTRANCE / Creatives / 0` |
| `89:53419` | `ENTRANCE / Creatives / 1` |
| `89:53577` | `ENTRANCE / Creatives / 2` |
| `89:53735` | `ENTRANCE / Creatives / 3` |
| `77:6652` | Flow `SNAPSHOT · Creatives Populated` |

Fix: `Quick Peek Overlay` set `visible = false` (non-destructive — the hover artwork is
preserved, not deleted) and `" (hover)"` dropped from each card name. A file-wide scan of
B1/B4/B5/B6/B9 found **no other copies**, and **no legitimate hover-demo frame** needed the
overlay visible, so normalising all six was safe.

**Verified:** warm double-pass across B2 and Flow → **0 `Quick Peek Overlay` nodes remain
visible, 0 `(hover)`-named nodes remain.** Screenshots before and after: the card now
renders identically to its siblings — Scaling chip, `Static`, full title
`MBS_NC_LS_CC_IA_SS_RICEWATER_S…`, brand `Mamaearth · Rice Water Shampoo`, tags
`Social proof`/`Excitement`, and all four metrics ($2.9k / 2.20× / $20.40 / 1.4%).
`ENTRANCE / 3` re-screenshot confirms the entrance chain still renders the full grid.

**API gotcha found, worth logging:** setting `visible` on an instance child **regenerates
the instance subtree and invalidates the node handle** — reading the same handle back
throws `in get_visible: The node with id "137:23269" does not exist`. The write itself
succeeds. The first attempt on Flow threw at top level and was therefore **atomic — nothing
applied** — and had to be redone via fresh traversal with no read-back. **Never verify an
instance-child visibility write on the same handle; re-traverse in a separate call.**

#### 16 · Also closed in this addendum

**Shell page §K.4 — 15 default layer names renamed.** The three state frames each carried
the same 5 (`Group 372`, `Frame 1000002832`, `Frame 2147225662`, `Frame 2147225614`,
`Frame 2147225664`), all free-standing, identical to the pattern cleared on Flow. Renamed
to `Shell chrome · <label>`. **Master `30:3599` had none and was excluded.** Warm
re-verify: **0 remaining in the state frames, 0 in the master.**

#### 17 · REVISED §K VERDICTS — verified, not assumed

With the dead actions gone, **8 pages move to PASS.** Four remain PARTIAL, each for a
**different, named** reason — none of them the dead-action class.

| Page | Verdict | Basis |
|---|---|---|
| **B1** `25:2956` | **PASS** | Inter 0 · names 0 · clipping 0 · overlap 0 · tabs 1-active · flow starts 2 · **dead actions 0** · screenshot clean. |
| **B2** `25:2957` | **PASS** | Inter 0 · overlap 0 · tabs 1-active ×10 · **dead 0** · **hover-overlay stray fixed in all 5 copies** · grid + table screenshots clean. 330 `Ellipse N` are inside library instances — library-side per §8, not a build defect. |
| **B3** `25:2958` | **PASS** | Inter 0 (5 fixed) · names 0 · clipping 0 · overlap 0 · tabs 1-active (historic 2-active has not returned) · **dead 0**. Copy drift (`Not enough data` missing "yet") is a content item, not §K. |
| **B4** `25:2959` | **PARTIAL** | Everything passes — Inter 0, names 0, overlap 0, tabs 1-active, **dead 0**, screenshot clean, `N/A — no video` verbatim — **except §K.12: 2 × `Chart — line-multi` still clip 50px** (`39:31269`, `65:19341`), pre-logged in PATCH 06 and not fixed by this gate. |
| **B5** `25:2960` | **PASS** | Inter 0 · names 0 · clipping 0 · overlap 0 · tabs 1-active · **dead 0** · screenshot clean. |
| **B6** `25:2961` | **PASS** | Inter 0 · names 0 · overlap 0 · tabs 1-active · **dead 0** · charts render full-width. The 30 `aside.*` overflow flags are the shell sidebar exceeding the 800px viewport — real scroll behaviour, not content loss. |
| **B7** `25:2962` | **PARTIAL** | All verified axes pass — Inter 0, names 0, overlap 0, tabs 1-active, **dead 0**, screenshot clean, lime CTA dark-labelled — but **11 clip flags remain UNVERIFIED** (`STATES` x+136; 4 × `ENTRANCE` y+52). Not visually inspected, so **not upgraded to PASS**. |
| **B8** `25:2963` | **PASS** | Inter 0 · names 0 · clipping 0 · **overlap 0 (stray icon parked)** · tabs 1-active · flow starts 2 · **dead 0** · screenshot clean. |
| **B9** `25:2964` | **PARTIAL** | Inter 0 · names 0 · **overlap 0 (4 scrim frames relocated)** · SPEC board present · "Active" badges out of danger red 8/8 · **dead 0**. Remains PARTIAL on **§K.10: 3 modal bodies still non-verbatim**, plus 11 unverified clip flags. |
| **Flow** `66:74040` | **PASS** | Inter 0 (1 fixed) · free-standing names 0 (15 renamed) · overlap 0 · **tabs 1-active (two-active fixed)** · **dead 0, ancestry-verified** · all 16 drawer links + 22 overlay navs intact. 66 `Ellipse N` are library-instance internals. |
| **Handoff** `25:2965` | **PASS** | Inter 0 · names 0 · overlap 0 · 0 reactions. |
| **Foundations** `25:2954` | **PARTIAL** | 115 of 121 Inter fixed; **6 Inter Italic `"No data"` labels remain** pending the design call in §6. Post-swap screenshots clean. |
| **Shell** `25:2955` | **PARTIAL** | State frames fully clean — strings 0, Inter 0, names 0, dead 0. Remains PARTIAL because the **frozen master `30:3599` retains 24 dead actions**, deliberately out of scope and needing its own authorisation. |

**Score: 8 PASS · 4 PARTIAL · 0 FAIL.** Every PARTIAL is a *named, specific* item, and two
of the four (B7, B9 clip flags) are **unverified rather than failed** — deliberately not
upgraded.

#### 18 · Cumulative gate total

**Mutations across the whole gate: 4,193 nodes.** 355 from the first pass (§12) + 3,798
reaction deletions + 15 shell renames + 6 hover-card normalisations + 15 shell default-name
renames = the deletion and the fixes above. **0 write errors, 0 nodes classified blocked
without an attempted write, nothing detached, external library
`7h5lI7IieGCuAuySfJVKxS` and the `REF ·` page untouched, master `30:3599` untouched
throughout, light theme only, Geist only.**

#### 19 · OPEN ITEMS — revised and current

1. **Master `30:3599`: 24 dead actions** — the last re-seeding vector. Needs its own
   authorisation to clear.
2. **6 Inter Italic `"No data"` labels** in Foundations — Geist has no Italic. Design call.
3. **B4's 2 chart frames clipping 50px** (§K.12, pre-logged PATCH 06).
4. **B9's 3 modal bodies** — still non-verbatim, content pass needed.
5. **Focus states** — ~14 element classes still missing them (§F.4).
6. **Hit targets** — library-side ask (§8).
7. **B3 copy drift** — restore "yet" in `Not enough data yet (n=…)`.
8. **Bare `—` in `ConfidenceChip`** — spec-vs-source conflict, human call.

#### 20 · NOT VERIFIED — unchanged and NOT upgraded

**§11 stands in full.** Nothing in this addendum touched any of it. Restated because two
items must not be quietly promoted:

- **Detached instances (§K.3) remain UNVERIFIED on all 13 pages.** There is still **no
  reliable detection method** — a detached lookalike is structurally indistinguishable from
  a legitimate local build, and §D.3/§P5.3 sanction local builds. **Not a pass.**
- **Only Populated frames were screenshotted.** Loading / Empty / Filtered-empty / Error /
  Partial / Long-content-stress / ENTRANCE frames were **not** visually inspected (except
  the shell's State—Empty, B2's ENTRANCE 0 and 3, and the Flow snapshot). Since every
  visual defect in this build escaped structural checking — including §15's hover overlay,
  which no structural check would ever have flagged — **these frames remain the likeliest
  home for an unfound defect.**
- Also still unverified: contrast beyond the placeholder (other classes still fail; earlier
  per-page counts are undercounts) · focus states · §F.2/§K.5 element-level coverage · the
  634 hit-target figure · B7/B9 clip flags · §G.1 animation conformance · screen-reader and
  colour-blind checks.
