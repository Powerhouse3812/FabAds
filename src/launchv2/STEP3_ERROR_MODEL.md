# Launch v2 · Step 3 (Ad & Distribution) — Error Model + Build Contract

> Single source of truth for the Step-3 distribution/creative error system.
> Every builder agent codes against the contracts here. Grounded in the ACTUAL
> launchv2 types/derivations, using the `Launch_2.0_Distribution_Errors` handoff
> only as a *reference catalog*, not gospel. Catalog codes (PS-*/CD-*/CC-*) are
> kept so the final deliverable maps back to the handoff.

---

## 0. Scope (locked with Maalik)

- Live surface: `src/launchv2/screens/steps/Step3AdDistributionV3.tsx` (+ shared
  `deriveV2.ts`, `reviewModel.ts`, `preflight.ts`). The `distribution/` component
  set (`DistributionSurface`, `Step3V2Panel`, `AccountDistributionPanel`,
  `AccountSplitEditor`, `PerAccountStructureEditor`, `PerAccountPageSplit`,
  `AdTreeVisualization`) is **dead code** — salvage its inline-validation
  patterns, then delete.
- Errors emerge from the **interaction of two independent levers** and must be
  *computed*, not enumerated by hand:
  1. **Creative distribution** (`plan.spread` + structure + creatives + mix-match) → sets `D` = ads per destination.
  2. **Page split** (`plan.pageDistribution` + `pageWeights`) → maps `D` onto pages vs each page's free slots.
- Surfacing: **inline at the control + mirrored in the cap-meter** (Nielsen #5).
- `[I]` cross-account caveats: shown as visible warnings now, re-checked at Review.
- Fix all 4 bugs (§4). Add all 4 feature layers (§6).

---

## 1. Core quantities (the math, grounded in current fields)

```
targets              plan.targets: TargetPair[]           (account × page pairs)
pages P              unique targets grouped by fbPageId   (shared pages summed)
activeAds(pg)        pageActiveAds(fbPageId)  [mock; real API later]
free(pg)             max(0, 250 - activeAds(pg))          MAX_ADS_PER_PAGE = 250
p                    P.length
media                max(plan.creatives.length, 1)
texts                1 + (plan.adCopy.textVariations?.filter(nonEmpty).length ?? 0)
C, A, X              plan.structure.{campaigns, adSetsPerCampaign, adsPerAdSet}
base                 C * A * X
```

### 1.1 Mix-match effective creative units — `n_eff` (fixes CD-11)

```
combinationActive = media > 1 && texts > 1
n_eff =
  !combinationActive        → media
  combination === "all"     → media * texts
  combination === "paired"  → max(media, texts)     // default
```

`deriveV2` currently ignores `plan.combination` — **it MUST use `n_eff`** wherever
it uses creative count, so the number shown in `CombinationChooser` equals the
downstream cap-meter / budget / Review count.

### 1.2 Ad sets + ads-per-destination `D`, by spread mode (uses `n_eff`)

| spread | adSets | D (ads / destination) | notes |
|---|---|---|---|
| `one_per_adset` | `n_eff` | `n_eff` | 1 unique creative per ad set |
| `round_robin` | `C*A` | `base` | creatives rotate to fill `base` slots |
| `stacked` | `C*A` | `C*A*n_eff` | every ad set holds all `n_eff` |
| `multiply` | `C*A*n_eff` | `base*n_eff` | one ad set per creative × structure |
| `manual` | `C*A` | `base` | mapping via `creativeSlotMap` |
| `custom` | `C*A` | `base` | structure authored as-is |

### 1.3 Placement across pages — `placement(plan)` (fixes cap-preventer + one_page)

```
switch pageDistribution:
  one_page   → demand = [D, 0, 0, …]           // ONLY the first page (dedicated path)
  duplicate  → demand_i = D for every page      // total requested = D * p
  equal      → demand_i = floor(D/p) + (i < D%p ? 1 : 0)
  fill_first → greedily place D into pages in order, each capped at free(pg_i);
               STOP at free — never dump remainder onto the last page.
               unplaceable = max(0, D − Σ free)
  custom     → demand_i = pageWeights[pg_i] ?? 0
```

Breach(pg) := `activeAds(pg) + demand_i > 250`  (equivalently `demand_i > free(pg)`).
`unplaceable` := fill_first → `max(0, D − Σfree)`; else → `Σ over breaches (demand_i − free_i)`.

> **Reliability note:** `estimateAds` keeps returning *requested* count (N=N
> invariant). Placement additionally exposes `placed` + `unplaceable`; any
> `unplaceable > 0` is a launch blocker, not a silent truncation.

---

## 2. The combination matrix (page-split × creative-distribution)

This is the "dono ke milake bnenge errors" analysis. `D` is set by the spread
column; the page-split row decides how `D` lands and therefore what breaches.

| ↓ page-split \ D source → | small `D` (one_per_adset / round_robin) | large `D` (stacked / multiply) |
|---|---|---|
| **one_page** | breach if `D > free₁` → **PS-03** | high breach risk on the single page → **PS-03** |
| **fill_first** | breach only if `D > Σfree` → **PS-05/06** (+ unplaceable) | most demand; aggregate-short likely → **PS-05/06** |
| **equal** | per-page share may exceed a small page → **PS-04**; remainder → **PS-12** | shares large → **PS-04** on the tightest page |
| **duplicate** | every page gets full `D`; budget & count ×`p` → **PS-DUP** + **CC-02**; breach any page with `activeAds+D>250` | ×`p` on top of large `D` → **count explosion CC-01** + multi-page breach |
| **custom** | `Σweights≠D` → **PS-08**; `weight_i>free_i` → **PS-07** | same, with bigger numbers |

Creative-side (independent of page-split, but feeds `D`):

| condition | code |
|---|---|
| `manual` mapped creatives `< D` slots → empty slots | **CD-01** |
| `round_robin` `n_eff > D` → some creatives never placed | **CD-02** |
| `round_robin` `n_eff % adSets ≠ 0` → uneven per ad set | **CD-03** |
| `multiply`/`one_per_adset` push `adSets > 200` (Meta limit) | **CD-ADSET** (existing `ADSET_200`) |
| `combination "all"` `n_eff = media*texts` spikes count/budget | **CD-11** (now flows through `n_eff`) |
| carousel cards `<2` / `>10`; flexible assets outside `1–10` | **CD-04/05/06** |
| catalogue/DPA mode → count from product sets, bypass creative checks | **CD-07** (info) |
| post-ID: selected posts `< D` slots | **CD-08** |
| launch mixes distinct ad `format`s | **CD-12** (warn) |

---

## 2.1 Fix-selection rule (CONFIRMED — Maalik)

> "Add a Page" only fixes an overflow when ads can be **REDISTRIBUTED** to the
> new page — i.e. **Fill-first** (aggregate short) and secondarily **Equal**.
> For **DUPLICATE** (every page gets the full set), **ONE-PAGE**, or an
> **AT-CAP page**, adding a page **CANNOT** fix it — the correct fix is
> **replace/remove the page**, or **change the split method**. Fixes must
> match the root cause.

Concretely:

| Root cause | Why add-page doesn't help | Correct fix |
|---|---|---|
| `one_page` (PS-03) | Method pins all demand onto a single page by design; a new page never receives spillover | Switch method (Use suggested) · Add a Page only helps if paired with a method switch away from `one_page` · Reduce structure |
| `duplicate` (PS-DUP) | Every page gets the **full** `D`; a new page adds ×1 more full copies, it doesn't relieve any existing page | Change/Remove the breaching Page · Switch off Duplicate (to Fill-first) |
| at-cap page (PS-02, `free===0`) | The page itself has zero room; nothing lands there regardless of other pages | Change this Page · Remove this Page |
| `fill_first` aggregate-short (PS-05/06) | Fill-first greedily fills existing pages then spills to the next — a new page **directly absorbs** the shortfall | Add a Page (primary) · Reduce structure |
| `equal` per-page breach (PS-04) | A new page grows `p`, shrinking each page's share on the next auto-balance — **secondary** redistribution effect | Use suggested · Change this Page · Auto-balance |

---

## 3. Full error catalog (the implementation + deliverable source)

Namespaces: `ps:` page-split · `cd:` creative-distribution · `cc:` cross-cutting.
`tier`: 🔴 error (block) · 🟠 warning (confirm) · 🔵 info. `prov` = `[I]` provisional
(cross-account aggregation unverified). Messages interpolate `{P}` page, `{n}` ads,
`{s}` slots, `{d}` diff, `{c}` creatives, `{a}` ad sets. **Specific, no blame.**

### 3A. Page-split (`anchor: "pageSplit"` unless a page/field)

| code | tier | when (trigger) | message | fixes |
|---|---|---|---|---|
| PS-01 | 🔴 | `targets.length===0` | "Select at least one Page to continue." | goto:accounts |
| PS-02 | 🔴 | any selected page `free===0` | "Page {P} is at its 250-ad limit — change it or remove it to continue." | change_page, remove_page |
| PS-03 | 🔴 | `one_page` & `D>free₁` | "Page {P} only holds {s} of the {n} ads this launch needs — use the suggested spread, change the Page, or shrink the structure." | use_suggested, change_page, reduce_structure |
| PS-04 | 🔴 | `equal` & `∃ share_i>free_i` | "Splitting equally puts {a} ads on {P}, which only has {s} slots — spread across Pages, change the Page, or reduce the ad count." | spread_across_pages (use_suggested), change_page, reduce_structure |
| PS-05 | 🔴 | `Σdemand>Σfree` (agg short) | "Your pages have {s} free slots but this launch needs {n} — add a Page to absorb the {d} that don't fit, or reduce structure." | add_page, reduce_structure |
| PS-06 | 🔴 | Suggested best-fit still `unplaceable>0` | "Even the best possible spread leaves {d} ads with nowhere to go across {s} free slots — add a Page or reduce structure." | add_page, reduce_structure |
| PS-07 | 🔴(field) | `custom` & `weight_i>free_i` | "{P} only has {s} free slots — auto-balance to bring every Page's weight within its own limit." | auto_balance |
| PS-08 | 🔴 | `custom` & `Σweights≠D` | "You've assigned {x} of {n} ads — auto-balance to close the {d}-ad {over/under}." | auto_balance |
| PS-DUP (breach) | 🔴 | `duplicate` & any page breaches (`activeAds+D>250`) | "Duplicate would push {P} over its 250-ad cap — change or remove that Page, or switch off Duplicate." | change_page, remove_page, switch_off_duplicate (→ fill_first) |
| PS-DUP (fits) | 🟠 | `duplicate` & `p>1`, no breach | "Duplicate runs the full {n} ads on each of {p} Pages — count and spend ×{p}. Switch to Fill-first to spread instead, or continue." | switch_to_fill_first, acknowledge (budget warn) |
| PS-10 | 🟠 prov | free-slot read unavailable for a page | "Couldn't check {P}'s remaining slots right now." | retry, acknowledge (re-check at Review) |
| PS-11 | 🔴 | page on restricted/disabled account | "Page {P} is on a restricted account — check Account Health or change the Page." | change_page, goto:health |
| PS-12 | 🔵 | `equal` & `D%p≠0` | "{n} ads / {p} Pages → {split}. Remainder goes to the Page with most room." | none |
| PS-13 | 🟠 prov | multi-account & shared/unverified aggregation | "Slots shown are per Page; other accounts on this Page may lower real headroom." | none (re-check at Review) |
| PS-14 | 🟠 | same `fbPageId` under ≥2 selected accounts | "Page {P} is selected under {k} accounts — their ads share the same 250 cap." | dedupe, acknowledge |

### 3B. Creative-distribution (`anchor: "creativeDist"` / `"structure"` / `"combination"`)

| code | tier | when | message | fixes |
|---|---|---|---|---|
| CD-01 | 🔴 | `manual` mapped `< D` | "Structure needs {n} ads but only {c} slots are mapped — {d} empty." | auto_map, reduce_structure |
| CD-02 | 🟠 | `round_robin` `n_eff>D` | "You added {c} creatives but structure has {n} slots — {d} unused." | switch spread(multiply), reduce creatives, expand_structure |
| CD-03 | 🟠 | `round_robin` `n_eff%adSets≠0` | "{c} creatives across {a} ad sets isn't even — some get {x}, others {y}." | auto_balance, acknowledge |
| CD-04 | 🔴 | carousel cards `<2` | "Carousel needs at least 2 cards; this ad has {c}." | add cards, switch format |
| CD-05 | 🔴 | carousel cards `>10` | "Carousel allows max 10 cards; you have {c}." | remove cards |
| CD-06 | 🔴 | flexible assets `<1` or `>10` | "Flexible ads take 1–10 assets; you added {c}." | add/remove assets, switch format |
| CD-07 | 🔵 | catalogue/DPA active | "Catalogue ads are dynamic — ad count comes from the product set, not creatives." | none |
| CD-08 | 🔴 | post-ID selected posts `< D` | "Structure expects {n} ads but you picked {c} posts." | pick more posts, reduce_structure |
| CD-11 | 🟠 | `combination "all"` count spikes vs slots/budget | "{t} texts × {c} creatives = {n} ads. That may exceed slots or budget." | switch paired, reduce_combos, confirm |
| CD-12 | 🟠 | launch mixes distinct `format`s | "This launch mixes {types} — some may need separate launches." | split_launch, acknowledge |

### 3C. Cross-cutting (`anchor: "capMeter"` / Review)

| code | tier | when | message | fixes |
|---|---|---|---|---|
| CC-01 | 🔴 | total (after `n_eff` + page dist) `> Σfree` | "Creatives expand this to {n} ads, over your {s} free slots — reduce structure, or add a Page if you're on Fill-first/Equal." | reduce_structure, add_page (fill_first/equal only — see §2.1) |
| CC-02 | 🟠 | `total × perUnitBudget > threshold` | "Count is now {n} ads → est. daily {$}. Confirm or reduce." | confirm, reduce_structure, edit budget |
| CC-03 | 🔴(Review) | fresh free-slots `<` Step-3 snapshot | "Slots changed since Step 3 — {P} now has {s}. Re-balance before launch." | auto_balance, goto:step3 |
| CC-04 | 🔵 | retry dispatches failed-only, same idempotency key | "Retrying failed ads only — they won't be recounted against the cap." | none |

---

## 4. Bugs to fix (in `deriveV2.ts` + UI)

1. **Mix-match divergence (CD-11):** `deriveV2` must consume `plan.combination` via `n_eff` (§1.1) in `adSetCount`, `adsPerDestination`, `estimateAds`, `spreadPreview`, `budgetPerDay`, `perTargetCounts`.
2. **Cap as preventer:** `perTargetCounts`/placement for `fill_first` must NOT dump remainder onto the last page (`out[n-1]+=left`); clamp at `free` and surface `unplaceable` → PS-05/06.
3. **`one_page` truly single-page:** dedicated branch — all `D` on page 1, `0` elsewhere; breach if `D>free₁`.
4. **Unify slots-left + severity:** one canonical `free`/`slotsLeft` value everywhere (`250 − activeAds`, pre-demand for the chip; demand-aware for the meter is a separate labelled field). Hard cap-breach styled **error/red**, not amber.

---

## 5. `deriveV2.ts` API contract (builders code to these signatures)

Keep existing exports working; ADD:

```ts
export function combinationUnits(plan: PlanV2): number;          // n_eff (§1.1)
export interface CreativeFit {
  mode: SpreadMode; nEff: number; slots: number;
  empty: number; unused: number; uneven: { min: number; max: number } | null;
}
export function creativeFit(plan: PlanV2): CreativeFit;          // CD-01/02/03 source
export interface Placement {
  method: PageDistribution;
  perPage: PageDemand[];        // extend PageDemand with demand/over already present
  requested: number;            // = estimateAds
  placed: number;
  unplaceable: number;          // cap-respecting remainder (PS-05/06/CC-01)
}
export function placement(plan: PlanV2): Placement;              // cap-respecting (§1.3)
```

- `adsPerDestination`, `adSetCount`, `estimateAds`, `spreadPreview`, `budgetPerDay`,
  `dailyTotalBudget`, `perTargetCounts` all switch to `combinationUnits(plan)`
  instead of raw `plan.creatives.length`.
- `perTargetCounts` `fill_first`/`one_page` overflow logic rewritten per §1.3.

## 5.1 Error engine contract — NEW module `src/launchv2/distributionErrors.ts`

```ts
export type DistTier = "error" | "warning" | "info";
export type DistAnchor =
  | "pageSplit" | "creativeDist" | "structure" | "combination"
  | "capMeter" | "accounts" | string /* fbPageId for page-scoped */;
export type DistFixKind =
  | "use_suggested" | "switch_distribution" | "auto_balance" | "auto_map"
  | "add_page" | "remove_page" | "split_launch" | "reduce_structure" | "reduce_combos"
  | "change_page" | "acknowledge" | "retry" | "goto" | "none";
// NEW: "remove_page" — removes a breaching/at-cap/duplicate-target page from the
// plan outright (distinct from "change_page", which swaps it for another page via
// the picker). Root-cause fix for PS-02 (at-cap) and PS-DUP breach (§2.1) where
// "add_page" cannot help — the offending page must go, not be supplemented.
export interface DistFix {
  label: string; kind: DistFixKind;
  distribution?: PageDistribution;   // for switch_distribution/use_suggested
  goto?: "accounts" | "step3" | "health";
}
export interface DistError {
  id: string;            // unique instance, e.g. `ps:equal-overflow:${fbPageId}`
  code: string;          // catalog code: "PS-04", "CD-01", ...  (maps to deliverable)
  tier: DistTier;
  anchor: DistAnchor;    // where the inline slot renders
  title: string;
  message: string;       // interpolated, specific
  fixes: DistFix[];
  provisional?: boolean; // [I] cross-account caveat
}
/** Single source of truth. Pure. Consumed by inline slots + cap-meter + Review. */
export function distributionErrors(plan: PlanV2): DistError[];
/** Apply a one-tap fix → returns the patched plan partial. */
export function applyDistFix(plan: PlanV2, fix: DistFix): Partial<PlanV2>;
/** Suggested (smart) distribution that respects each page's free slots. */
export function suggestedDistribution(plan: PlanV2): PageDistribution;
```

- `reviewModel.buildIssues` + `preflight` should REUSE `distributionErrors` for the
  page-split/creative-dist/cap families (map `DistError`→`ReviewIssue`) instead of
  re-implementing — kills the double-implementation drift noted in the audit.

---

## 6. Feature layers

1. **Always-on slots chip:** on every selected page in Step 3 — `{free} left` (green) → `{n} over` (red) as demand grows. One canonical number.
2. **Expanded one-tap fixes:** wire `use_suggested`, `auto_balance`, `add_page`, `split_launch` (rest → draft), `reduce_structure`, `reduce_combos`, `auto_map` in `applyDistFix`.
3. **Per-control inline slots:** each `DistError` renders at its `anchor` (page-split card / creative-dist card / structure editor / combination) AND mirrors in `CapMeterWithFixes`.
4. **Suggested-as-default:** `suggestedDistribution` marked "Suggested" + default; overflow errors only appear when the user overrides to Equal/Custom/Duplicate.

---

## 7. File-ownership map (one agent per file — no merge conflicts)

**Phase A — foundation (must land first; defines contracts):**
- `src/launchv2/deriveV2.ts` — §5 math (n_eff, placement, creativeFit, cap-preventer, one_page). **[Opus]**
- `src/launchv2/distributionErrors.ts` (NEW) — §5.1 engine + catalog §3 + `applyDistFix` + `suggestedDistribution`. **[Opus]**
- `src/launchv2/types.ts` — any new fields (none expected; confirm `combination`, `pageWeights`, `textVariations` exist). **[Haiku]**

**Phase B — consumers (parallel, code to Phase-A contracts):**
- `src/launchv2/screens/review/reviewModel.ts` — reuse `distributionErrors`; unify cap severity→error; expand fixes. **[Sonnet]**
- `src/launchv2/preflight.ts` — reuse engine for page-cap family; drop duplicated logic. **[Sonnet]**
- `src/launchv2/screens/steps/distribution/CapMeterWithFixes.tsx` — mirror all `DistError`, amber→red, expanded fix buttons, canonical slots. **[Sonnet]**
- `src/launchv2/screens/steps/Step3AdDistributionV3.tsx` — per-control inline slots (pageSplit/creativeDist/structure), always-on slots chip, Suggested-default + badge, wire `applyDistFix`. **[Sonnet]**
- `src/launchv2/screens/steps/spread/CombinationChooser.tsx` — align displayed count to `combinationUnits`. **[Haiku]**
- Flexible bounds (CD-06): add to `distributionErrors` (Phase A) — no separate file.

**Phase C — cleanup:** salvage inline-validation patterns from dead `distribution/` set into Step 3 (Phase B), then delete: `DistributionSurface, Step3V2Panel, AccountDistributionPanel, AccountSplitEditor, PerAccountStructureEditor, PerAccountPageSplit, AdTreeVisualization` (+ any now-orphaned imports). **[Sonnet]**

**Phase D — monitor gate (final, single adversarial pass):** `tsc --noEmit` + build, verify each `DistError` code renders inline + mirrors, confirm bugs fixed, design-system + NN/g compliance, no regressions. **[Opus]**

---

## 8. Design-system guardrails (FabFunnel v1.2.1)

- Error/block = status error `#ff4d4f` fill / text `#cf1322`; warning `#faad14` / `#874d00`; success `#52c41a` / `#237804`. Info blue.
- Lime `#8FB821` = fill/selected only, never error text. Geist Mono for numbers. Lucide 2px.
- Light + dark parity. Icons distinct per tier (not color-only): AlertTriangle/AlertCircle/Info/Check.
- One-tap fix = never a dead-end (Nielsen #9). Specific + no blame (name page/slots/count).

---

## 9. Final deliverable (produce AFTER build)

`src/launchv2/STEP3_ERRORS.md` — human table for Maalik: **code · when it occurs ·
message · suggested fix · severity**, generated from §3 as actually implemented.
