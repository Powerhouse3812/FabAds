# Launch v2 — Step 4 (Review) Overhaul — Implementation Plan

> Scope locked with Maalik, 18 Jun 2026. Companion to `MEETING_PLAN.md` (§D Review).
> Full sweep: A1–A7, B1–B7, C1–C13, D21–D29 + necessary upstream ripples.

## Guiding philosophy (non-negotiable)
- **Genie removes Meta's limitations — it does NOT mimic them.** Meta's Marketing API
  contract is consulted ONLY for valid-combo logic/dependencies (objective→optimization_goal,
  CBO/ABO rules, what-unlocks-what) so the UI guides users to valid selections.
- **"Show = Launch" is truthfulness, not Meta-copying.** Whatever the Review screen shows
  must be exactly what launches. Our launched structure may be *richer* than Meta's manual flow.
- Mock engine stays this round; everything is built against the **real Meta contract** so the
  live Graph API swap is trivial later.

## Locked decisions
| Topic | Decision |
|---|---|
| Meta service | Keep `mockLaunchV2`; build all UI/validation/override-mapping against the real Meta contract (swap-ready). |
| Unify | One shared `buildPlanUnits(plan)` drives BOTH the review tree and the launch units, with stable canonical node IDs. |
| Campaigns / "C2" | All campaigns are **real** and launch. Launch honors `structure.campaigns` (N real campaigns). Remove the old "variant" gimmick (flipped CBO/ABO, 0.6× budget). |
| Currency | **True USD-only.** Strip `toUsdEquivalent` INR/EUR/GBP branches; enforce single-currency at Setup. |

---

## Work items

### Bucket A — Correctness / honesty
- **A1 (P0)** Unify: single `buildPlanUnits(plan)` → canonical units w/ stable node IDs; tree
  summarizes these units; launch honors `structure.campaigns` (all campaigns real). — `reviewModel.ts`, `services/mockLaunchV2.ts`, `deriveV2.ts`
- **A2 (P0)** Per-node overrides actually apply at launch (resolve by same node IDs). — `mockLaunchV2.ts`, `nodeOverrides.ts`
- **A3 (P0)** `capCheck`/`perPageDemand` resolve overrides → override-induced 250-cap breach blocks launch. — `reviewModel.ts`, `deriveV2.ts`
- **A4 (P0)** True USD-only; strip multi-currency; single-currency validation at Setup. — `reviewModel.ts`, `LaunchV2Flow.tsx`, Setup
- **A5 (P0)** "+N more" ads addressable/editable (with B1 virtualization, render the real full tree). — `NodeTreeRail.tsx`, `reviewModel.ts`
- **A6 (P1)** `buildIssues` resolves per-node values → blanked required field re-raises its error. — `reviewModel.ts`
- **A7 (P1)** GC/migrate orphaned overrides on plan-shape change. — `useFlowV2.ts`, `nodeOverrides.ts`

### Bucket B — Scale & reliability
- **B1 (P0)** Virtualize tree rail. — `NodeTreeRail.tsx`
- **B2 (P0)** Run-state persistence + reconcile on refresh. — `mockLaunchV2.ts`
- **B3 (P1)** Perf: memoize tree, `Map` lookups, drop per-render `JSON.stringify`. — `Step4Review.tsx`, `reviewModel.ts`
- **B4 (P1)** Bulk-edit fan-out perf. — `nodeOverrides.ts`, `NodeEditPane.tsx`
- **B5 (P1)** Re-launch-after-edit (idempotency keyed on plan hash, not plan id). — `mockLaunchV2.ts`
- **B6 (P2)** Two-tab coordination. — autosave layer
- **B7 (P2)** Delete dead code (old `ReviewTree`, `EditPane`/`LaunchBreakdown` exports, `Step4Distribution*`). — cleanup

### Bucket C — Pre-flight validation (real Meta contract) — new `launchv2/preflight.ts`
Mock data reshaped to real Meta response shape (account `min_daily_budget`, `has_payment_method`,
pages, datasets/pixels, custom_conversions, `valid_optimization_goals`).
- **C1 (P0)** account active + payment method + currency
- **C2 (P0)** budget minimums (per-account min, CBO ≥ Σadset-mins, lifetime needs end_time)
- **C3 (P0)** objective ↔ optimization_goal compatibility
- **C4 (P0)** CBO/ABO consistency
- **C5 (P0)** promoted_object + pixel/dataset exists + custom_event exists
- **C6 (P0)** page selected/exists + leadgen ToS (lead ads)
- **C7 (P1)** creative completeness (page_id, one source, https url, hash/video, IG id)
- **C8 (P1)** special-ad-category targeting normalization
- **C9 (P2)** EU/DSA beneficiary + payor
- **C10 (P1)** time validity (start/end/lifetime)
- **C11 (P0)** page active-ad cap (harden existing)
- **C12 (P2)** aspect-ratio/placement compatibility
- **C13 (P1)** idempotency/dedupe map (swap-ready)

### Bucket D — Missing decided features (MEETING_PLAN §D)
- **D29 (P1)** reducer bulk-patch + bulk-save footer unhide (foundation for D22). — reducer/`useFlowV2.ts`, `ReviewPanes.tsx`
- **D22 (P1)** select-all + per-node checkboxes. — `NodeTreeRail.tsx`, `Step4Review.tsx`
- **D21 (P1)** table variant + level-tabs + V1↔V2 toggle (selection preserved). — `ReviewTable.tsx`, `Step4Review.tsx`
- **D26 (P1)** inline rename (tree/table). — `NodeTreeRail.tsx`, `ReviewTable.tsx`
- **D27 (P1)** nomenclature token builder + live resolved-name preview. — `NomenclatureBuilder.tsx`, Step config
- **D23 (P2)** search + filters popover. — `ReviewFiltersPopover.tsx`
- **D24 (P2)** single-open accordion sections. — `NodeEditPane.tsx`
- **D25 (P2)** placement preview tabs (correct aspect ratios). — `PlacementPreviewTabs.tsx`
- **D28 (P2)** save-as-strategy post-launch. — success modal, strategy save

---

## Phased sequencing (dependency order)

**Phase 0 — Foundation** (everything builds on it)
A1 unify + launch honors N campaigns · A2 overrides apply · A4 USD-only · B7 dead-code delete ·
mock-data → real-Meta shape.

**Phase 1 — Correctness on unified base**
B1 virtualize (enabler) → A5 "+N more" editable · A3 cap-check overrides · A6 per-node issue re-raise · A7 override GC.

**Phase 2 — Pre-flight validation** (`preflight.ts`)
P0 first (C1–C6, C11) → C7, C8, C10, C13 → C9, C12.
Ripple: Step 1 (objective/special-cat), Setup (account/page/pixel/budget/CBO-ABO), Step 3 (creative/placement).

**Phase 3 — Features** (reducer-first)
D29 → D22 → D21 → D26 → D27 → D23 → D24 → D25 → D28.

**Phase 4 — Reliability/perf**
B2 run-persist+reconcile · B3 perf · B4 bulk fan-out · B5 re-launch-after-edit · B6 two-tab.

## Upstream ripples (intentional, not hidden)
- **Step 1:** objective + special-ad-category clean capture (C3/C8).
- **Step 2 / Setup:** single-currency enforce (A4); account/page/pixel selection capture (C1/C5/C6);
  CBO/ABO + budget (C2/C4); reducer bulk-patch (D22/D29).
- **Step 3:** creative/placement data (C7/C12); naming patterns (D27).
- **Mock-data layer:** reshape to mirror real Meta responses (pre-flight + swap-ready).

## NOT in scope this round (fence)
- Real Graph API network calls (mock stays).
- Relaunch-with-edits / `LaunchV2Auto` (deferred).
- Infinite scroll (#28 — dropped, devs' side).
- Backend/Supabase schema beyond mock needs.
- Advantage+ `asset_feed_spec` creative (MCP unsupported; raw API later).

## Execution model
Per-phase parallel agents + one monitor agent guarding quality (Opus for design/refactor,
Haiku for mechanical). Tightly-coupled core (A1/A2) done as one focused refactor, not split
across conflicting agents.

## Verification (each phase)
- `cd /Users/powerhouse/Downloads/FabAds && npx tsc --noEmit` → exit 0
- `npm run build` → clean
- Preview walkthrough of the touched surface; monitor agent reviews diff before sign-off.

---

## Progress log

### Phase 0 — in progress (18 Jun 2026)
- ✅ **A1 unify** — new `planUnits.ts::buildPlanUnits()` is the single source; `buildReviewTree`
  (reviewModel) groups it, `buildUnitsV2` (mockLaunchV2) maps it. Launch now honors
  `structure.campaigns` (all campaigns real). Old "C2 variant" hack (0.6× budget, flipped
  CBO/advantage+) **removed**.
- ✅ **A2 overrides apply** — launch units carry the override-resolved snapshot; unit.id == ad
  node id (so overrides map + failed units trace back to the tree).
- ✅ **A4 USD-only** — `toUsdEquivalent` (INR/EUR/GBP) removed from LaunchConfirmModal; added
  `err:mixed-currency` blocking issue in `buildIssues` (kills the cross-currency math bug).
- ✅ Cleanup: dead `perTargetAdCounts` + its `perPageDemand` import removed.
- ✅ Verified: `tsc --noEmit` exit 0; standalone parity test (3 pages × 2 campaigns × 2 adsets ×
  3 ads, duplicate) → tree leaves == launch units (36), 2 real campaigns/page, ID parity,
  campaignName override flows to launch. Monitor agent review: no P0s.
- ⏳ **Remaining in Phase 0:** B7 dead-code delete (Step4Distribution*, EditPane/LaunchBreakdown
  exports); mock-data reshape to real-Meta response shape (this is really the Phase 2 dependency
  — start it when Phase 2 opens).

### Batch 1 — DONE + monitor-signed-off (18 Jun 2026)
- ✅ **Node-ID disambiguation** — every node ID now embeds target index: `acct:t{ti}:{fbPageId}`,
  `t{ti}:{fbPageId}:c{ci}:s{si}:a{k}`. Fixes shared-fbPageId override-bleed/collision. Tree↔launch
  ID parity preserved; `nodeKindFromId` regexes updated.
- ✅ **A3 (per-adset count)** — new adset registry field `adsPerAdSet`; `buildPlanUnits` resolves it
  per node; new `perPageDemandResolved`/`capCheckResolved` count real units → `buildIssues` cap is
  override-aware. (deriveV2/Step 3 stays formula-based — overrides only exist in Step 4.)
- ✅ **B7** — deleted `Step4Distribution.tsx`, `Step4DistributionV2.tsx`; removed dead
  `EditPane`/`LaunchBreakdown` exports from `ReviewPanes.tsx`.
- Monitor (Opus): tsc 0, build clean, 18 parity assertions pass (incl. shared-fbPageId no-collision),
  Steps 1/2/3 unaffected. No P0/P1.

### Batch 2 — DONE + monitor-signed-off (18 Jun 2026)
- ✅ **B1** collapse-by-default: only first account + campaign seeded open; lazy child render.
- ✅ **A5** "+N more" expandable: `expandAdSetLeaves` + `fullyExpandedAdSets` state.
- ✅ **baselineAdCountForAdSet** helper: single-select `adsPerAdSet` shows actual resolved baseline.
- ✅ Cap-divergence note in Step4Review (muted/mono when capCheck ≠ capCheckResolved).

### Batch 3 — DONE + monitor-signed-off (18 Jun 2026)
- ✅ **A6** buildIssues per-node blank field validation (destinationUrl, primaryText).
- ✅ **A7** GC orphaned overrides — new `gcOverrides.ts` + `useFlowV2.ts` patch GC.
- ✅ **A7 back-nav fix** — 5 reducers (chooseIntent/Strategy/applySavedStrategy/applySetupTemplate/applyDistributionTemplate) now wrapped in `gcNodeOverrides`.

### Batches 4–9 — ALL DONE + monitor-signed-off (18 Jun 2026)

#### Phase 2 — Pre-flight validation (C1–C13)
- ✅ **mockMetaData.ts** — real Meta API response shapes (MetaAdAccount, MetaPage, MetaDataset, VALID_OPTIMIZATION_GOALS, ADVANTAGE_PLUS_OBJECTIVES, PIXEL_REQUIRED_OBJECTIVES). USD + INR test accounts; USD edge-case account for C2–C6 testing.
- ✅ **preflight.ts** — `runPreflight(plan): ReviewIssue[]` (sync, swap-ready for async):
  - C1: account active / payment method / currency (USD-only enforce)
  - C2: budget minimums (USD-gated), lifetime needs endDate
  - C3: objective ↔ optimizationGoal compat (ODAX matrix)
  - C4: Advantage+ validity check
  - C5: promoted_object / pixel required for CONVERSIONS/VALUE goals
  - C6: page exists/published + leadgen ToS for OUTCOME_LEADS
  - C7: creative completeness (destinationUrl, primaryText, source)
  - C8: special-ad-category targeting normalization
  - C9: EU/DSA stub (escalates to real checks when fields added to PlanV2)
  - C10: time validity (malformed scheduledFor)
  - C11: page active-ad cap via `capCheckResolved`
  - C12: aspect-ratio/placement stub (stories/reels detection from plan.placements)
  - C13: idempotency key stub
- ✅ **Wiring**: preflight wired into Step4Review (issues panel + blocking), LaunchV2Flow (footer gate: `allValid` includes `!preflightBlocked`), LaunchConfirmModal (body banner + canLaunch guard).

#### Phase 3 — Features (D21–D29)
- ✅ **D29** — `patchManyNodes` on UseFlowV2 hook; bulk-selection sticky footer in Step4Review.
- ✅ **D22** — per-node checkboxes (hover-reveal, indeterminate), select-all header checkbox, `onMultiSelect` prop, correct set semantics.
- ✅ **D21** — `ReviewTable.tsx` (4-level tabs: Accounts/Campaigns/Ad Sets/Ads); tree/table toggle pill in Step4Review; selection preserved on view switch.
- ✅ **D26** — inline rename: double-click → inline `<input>` → saves to `nodeOverrides[nodeId][nameField]`; level-aware field ID (`campaignName`/`adSetName`/`name`); in both NodeTreeRail and ReviewTable.
- ✅ **D27** — NomenclatureBuilder.tsx: token chips ({brand}/{intent}/{objective}/{date}/{adset}/{n}), pattern input, live resolved-name preview via `resolveName`, Save/Reset; collapsible "Naming" section in Step4Review.
- ✅ **D23** — ReviewFiltersPopover.tsx: inline search + 5 filter chips (All/Campaign/Ad Set/Ad/Overridden); NodeTreeRail: `highlightQuery`+`filterKind` props, `isDimmed` memo dims non-matching nodes, `HighlightedLabel` for matching substrings.
- ✅ **D24** — single-open accordion in NodeEditPane: `openSection` state, ChevronDown toggle, resets to first section on node change.
- ✅ **D25** — PlacementPreviewTabs.tsx wired into Step4Review right rail and NodeEditPane "Preview" accordion section (ad-level only); Feed/Stories/Reels/Right-Column tabs.
- ✅ **D28** — `SaveAsStrategyRow` in LaunchV2Detail: shown on "completed"/"partial" runs; reads plan from sessionStorage, fallback derives from run; calls `strategiesService.save`; 3-state UX (button → input → saved).

#### Phase 4 — Reliability/perf (B2–B6)
- ✅ **B2** — run-state persistence: `persistRun`/`hydratePersistentRun`/`clearPersistentRun` (sessionStorage, try/catch); `planHash` (FNV-1a) on run creation; `rehydrateFromStorage`; stale detection in Step4Review.tsx useEffect via `markRunStale`; LaunchV2Detail shows "Refreshed" / "plan changed" banners; `"stale"` added to RunStatus.
- ✅ **B3** — perf: `buildReviewTree` result passed as prop to avoid double-call; `NodeEditPane` field computations memoized (incl. `JSON.stringify` in `valueAcross`); NodeTreeRail already used Set for O(1) selection lookups.
- ✅ **B4** — bulk perf: `setManyNodesOverride` single-pass spread; `gcOverrides.ts` WeakMap cache for `getValidIds`; `patchManyNodes` skips GC for non-structural fields (`fieldId !== "adsPerAdSet"`).
- ✅ **B5** — covered by B2: plan hash comparison on re-hydration + `markRunStale` on hash mismatch.
- ✅ **B6** — two-tab coordination: `BroadcastChannel("fabads_launchv2_sync")` in `useFlowV2`; broadcasts plan on every `patch`; loop-guard via `isBroadcastUpdate` ref; subscribes on mount, closes on unmount.

### Account detail panel + parent-aware field gating (19 Jun 2026) — DONE + monitor-signed + preview-verified
Maalik ask: "ad account/page change nhi hoga, but show currency + distribution-per-account (collapsed) + timezone + account details (pages list, etc); and field logic — agar campaign pr CBO on hai, adset pr ABO option nahi hoga."
- ✅ **Part A — Account node = bespoke detail panel** (NEW `screens/review/AccountDetailPane.tsx`). Identity (ad account, FB page) stays READ-ONLY (Setup-level decision; non-destructive). Panel shows: account name + status pill (account_status 1/2/3/7) + id, Currency (🔒 derived, "follows the account"), Time zone (🔒), Payment method, Min daily budget (`min_daily_budget/100` → formatMoney), Pixel/dataset (resolved name); a read-only **Pages** list (every target sharing this accountId — name + Published + Leadgen ToS chips); and a **collapsed-by-default Distribution** accordion editing `plan.pageDistributionByAccount[accountId]` (4 PageDistribution modes, "overridden" pill + reset-to-plan-default). `NodeEditPane` early-returns to this pane for `kind==="account"`; bulk account selection shows an honest "one account at a time" hint (P1 fix from monitor).
- ✅ **Part B — Parent-aware gating** (NEW `screens/review/fieldGating.ts`: `FieldGate`, `resolvedBudgetMode`, `fieldGate`, `fieldGateAcross`). Override-aware, node-hierarchy-resolved (NOT plan-global). Ad-set `dailyBudget` LOCKS (greyed + reason "Set on the campaign" + `CBO` badge) when its PARENT campaign node resolves to CBO; campaign `budgetAmount` LOCKS ("Set on ad sets" + `ABO`) when ABO. Ad-set `conversionEvent`/`placements` HIDE based on the node's own resolved optimizationGoal/placementMode. `EditField` renders a locked row and suppresses the override accent + Reset (`showOverride = overridden && !gate?.locked`). Bulk combine: hidden iff all-hidden, locked iff all-locked, else editable.
- ✅ **settingsRegistry.ts** — removed the 4 plan-GLOBAL `visibleWhen` predicates (campaign `budgetAmount`, adset `dailyBudget`/`conversionEvent`/`placements`); these are now node-resolved in fieldGating. `bidValue` (advanced) + `destinationUrl` (format) visibleWhen KEPT.
- ✅ **mockMetaData.ts** — added `timezone_name` to MetaAdAccount + all 6 mock accounts (USD→America/Los_Angeles, INR→Asia/Kolkata).
- Verified live in preview (Mamaearth INR, CBO, 1×2×2): account panel renders all fields correctly (Min daily ₹50, tz Asia/Kolkata); ad-set Daily budget shows locked "Set on the campaign · CBO". No console errors. tsc 0, build clean.
- **P2 cleanups surfaced (not blocking):** the `ACCOUNT` level in `settingsRegistry` (accountName/pageName/pixelId/currency fields) is now dead (account branch never reads the registry) — `account` key still required by `Record<NodeKind, LevelRegistry>`, only its `fields[]` are dead. `levelFields()` export has zero callers. INR amounts use en-US grouping in shared `formatMoney` (pre-existing).

### Known open items (tracked P2, not blocking)
- Select-all under-selects ads behind "+N more" (collect fns use MAX_LEAVES-capped tree, not expandAdSetLeaves). Fix: thread plan into collectors and use expandAdSetLeaves for adset nodes.
- `patchManyNodes` REMOVED (was dead) + launchv2 `PreviewPane` REMOVED (was unimported) — 19 Jun 2026.
- Kind-filter (D23) dims parent nodes but doesn't auto-expand matching subtrees. Decision: acceptable or add auto-expand?
- Table-view preview rail tracks tree selection, not table row selection (P2 UX).
- "Clear selection" footer label vs. collapse-to-single behavior mismatch (cosmetic).

### Final tsc + build status (18 Jun 2026)
`tsc -p tsconfig.app.json --noEmit` → exit 0. `npm run build` → ✓ built in 12.44s. No errors.
