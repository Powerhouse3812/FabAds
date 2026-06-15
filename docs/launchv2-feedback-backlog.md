# Launch v2 — Developer Feedback Backlog (FE/BE Categorized)

> **Source Slack thread:** https://ideaclan.slack.com/archives/C07USMLMD8C/p1781253344741689
> **Contributors:** Rahul Saini (kickoff), Sourabh Burman (detailed pointers). Launch 2.0 review.
> **Target surface:** `/launchv2` — the Beta 4-step from-scratch redesign in `src/launchv2/`.
> **Purpose of this doc:** turn the raw thread feedback into a planning-ready, FE/BE categorized backlog, each item cross-referenced against the actual code (current state, exact files), with priority + rough effort. This doc is meant to be handed to an implementation session.

---

## How to read this

- **Layer:** `FE` = frontend only · `BE` = needs backend/API · `FE+BE` = both
- **Theme:** 🐞 bug · 🎨 UX/IA · ✨ feature-gap · 💬 needs-discussion
- **Current state:** ✅ exists · ⚠️ partial/confusing · ❌ missing · 💬 discuss-first
- **Effort:** S (small / hours) · M (medium / 1-2 days) · L (large / multi-day)
- **Step mapping:** feedback "step 1" = Start/intent · "step 2" = Setup · "step 3" = Ad & Distribution.

### Key insight
Most "missing" items already **exist in code** but are (a) hidden behind Advanced collapsibles, (b) on the wrong step, or (c) mock-only with no real API. So this is **less rebuild, more re-surface + wire-up + IA fixes**. The genuinely ❌missing cluster is **naming/nomenclature, asset-name edit, per-account structure, per-placement media**.

---

## Raw feedback (verbatim from thread)

**Rahul Saini:** "Regarding Launch 2.0, please add any of your points in this thread … deliver a corrected version by Monday." + "Please add step-wise pointers, for example in step 1 while I was selecting this I got confused…etc"

**Sourabh Burman:**

- **on first step**
  - discuss filter inside search
  - custom launch option should not be there as it is optional selection
- **2nd step**
  - at top where is this information coming for adaccount/campaign/adset (also what if custom selected)
  - recently used beside adaccount selection (to be discussed)
  - new-feature catalogue launch at adaccount → missing field of product selection
  - new feature use existing post (what if user select both catalogue and existing post) → there should be dedicated button for openning post modal
  - Custom Audience (to be discussed)
  - advance bid starategy? out of collapsible this is required field
  - targeting template to be discussed which is under adset & audience (API needed) → also how to save new targeting template; attribution spec field missing
  - Manual placement many fields are missing
  - optimization section to be discussed with gaba
  - advantage+ to be discussed (why there is advantage+ in placement type, also it should be at place, as it was also at campaign level)
  - special ad category (country selection is missing, also if at campaign level, it should be under campaign section)
- **3rd step**
  - Ad creative → how will multiple media with different text will be handled
  - edit placement media upload feature mising
  - creative distribution and strategy selection confusing (structure and distribution are 2 diff thing)
  - creative enhancement missing
  - if text edit for multiple media, there should be save button
  - utmParemeter, per creative overides (purpose and flow to be dicussed)
- **Common**
  - no flexibility for handling number of campaign adset ad at adaccount level
  - assets name edit missing
  - launch name missing
  - nomenclature missing (basic + asset level)

---

## STEP 1 — Start / Intent
Primary file: `src/launchv2/screens/steps/Step1Start.tsx`

| ID | Item | Layer | Theme | Current state | Pri | Effort |
|----|------|-------|-------|---------------|-----|--------|
| S1-1 | "Filter inside search — discuss" | FE | 💬🎨 | ✅ Search + AND-tag filters + sort already exist (`Step1Start.tsx:199–379`) | P2 | — (decide) |
| S1-2 | "Custom launch option should not be there (it's optional)" | FE | 🎨 | ✅ `custom` intent exists (`types.ts:17`, `data.ts:30–34`, `reducer.ts:206–215`). Action: remove/hide from picker | P1 | S |

---

## STEP 2 — Setup
Primary files: `src/launchv2/screens/steps/Step2Setup.tsx`, `Step2SetupV2.tsx`, `setup/AccountsPages.tsx`

| ID | Item | Layer | Theme | Current state | Pri | Effort |
|----|------|-------|-------|---------------|-----|--------|
| S2-1 | "Top: where is adaccount/campaign/adset info coming from? (also if custom selected)" | FE+BE | 🎨💬 | ✅ Section summary chips exist (`Step2Setup.tsx:425–453`), derived from plan state. Action: add clear source label + define custom-intent behaviour | P1 | M |
| S2-2 | "Recently used beside adaccount — discuss" | FE | 💬 | ✅ Exists: `RecentChips`, top-3 by active ads (`AccountsPages.tsx:271–308, 781–793`) | P2 | — |
| S2-3 | "Catalogue launch at adaccount — missing product selection field" | FE+BE | ✨🐞 | ⚠️ Catalogue toggle + product-set multi-select DO exist (`AccountsPages.tsx:552–673`, `deriveV2.ts:171–213`). **Verify exact missing field Sourabh saw** (single-product vs product-set?) | P1 | M |
| S2-4 | "Use existing post — dedicated button for post modal; what if both catalogue + existing post selected" | FE | ✨🐞 | ⚠️ `RunningPickerModal` exists (`AccountsPages.tsx:707–718`), but **no mutual-exclusion** between catalogue & post; button not prominent | P1 | M |
| S2-5 | "Custom Audience — discuss" | FE+BE | 💬 | ✅ Exists: toggle + select/upload-CSV (`AccountsPages.tsx:1062–1141`), mock data | P2 | — |
| S2-6 | "Advance bid strategy out of collapsible — it's a required field" | FE | 🎨 | ⚠️ Currently inside `AdvancedReveal` (`Step2Setup.tsx:625–662`). Action: surface as required | P1 | S |
| S2-7a | "Targeting template under adset & audience — API needed" | BE | ✨ | ⚠️ Templates are **localStorage mock** (`templates/service.ts:93`, seeded). Needs real API for save/load | P1 | L |
| S2-7b | "How to save a new targeting template" | FE+BE | ✨ | ⚠️ Save-as exists via `SetupTemplateBar.tsx:133–154` but it's a *setup* template, not targeting-specific. Action: clarify/separate | P1 | M |
| S2-7c | "Attribution spec field missing" | FE | ⚠️🎨 | ⚠️ Attribution **window** exists (`Step2Setup.tsx:777–805`, 3 options). Confirm if "spec" = granular click/view spec they want | P2 | S |
| S2-8 | "Manual placement — many fields missing" | FE | ✨ | ⚠️ 15 placement toggles across 4 platforms (`Step2Setup.tsx:239–334`). **Enumerate exact missing placements** vs Meta list | P1 | M |
| S2-9 | "Optimization section — discuss with Gaba" | FE | 💬 | ✅ Exists & surfaced (`Step2Setup.tsx:705–806`): conv location, goal, attribution | P1 | — (Gaba) |
| S2-10 | "Advantage+ — why in placement type? should be one place (was at campaign level)" | FE | 🎨💬 | ⚠️ Appears twice: campaign toggle (`Step2Setup.tsx:600–613`) + placement-mode label (`1036–1056`), derived via `isAdvantagePlus` (`reducer.ts:149–159`). IA cleanup needed | P1 | M |
| S2-11 | "Special ad category — country selection missing; if campaign-level, put under campaign section" | FE | ✨🎨 | ❌ Only category picker, **no country/location** (`SpecialAdCategoryField.tsx`). Action: add country + relocate under campaign | P1 | M |

---

## STEP 3 — Ad & Distribution
Primary files: `src/launchv2/screens/steps/Step3AdDistributionV3.tsx`, `spread/AdContent.tsx`, `distribution/StructureEditor.tsx`

| ID | Item | Layer | Theme | Current state | Pri | Effort |
|----|------|-------|-------|---------------|-----|--------|
| S3-1 | "Multiple media with different text — how handled?" | FE | ⚠️🎨 | ⚠️ `plan.copyOverrides` per-creative exists (`AdContent.tsx:245–307`) but UI is compact/buried. Action: clarify model | P1 | M |
| S3-2 | "Edit-placement media upload — missing" | FE+BE | ✨ | ❌ Not implemented; `PlacementSelection` is toggles only (`types.ts:236–261`). Per-placement media is net-new | P2 | L |
| S3-3 | "Creative distribution vs strategy selection confusing (structure & distribution = 2 diff things)" | FE | 🎨 | ⚠️ Distinct in code (`plan.structure` vs `plan.pageDistribution`/`spread`) but **conflated in UI** under one "Distribution" pane (`Step3AdDistributionV3.tsx:745–904`). Action: separate visually | P1 | M |
| S3-4 | "Creative enhancement — missing" | FE | 🎨 | ⚠️ Exists as `advantageCreative` toggle but in **Step 2** (`Step2SetupV2.tsx:~593`), not where user expects. Action: surface in Step 3 | P2 | S |
| S3-5 | "Multiple-media text edit needs a Save button" | FE | 🎨 | ❌ Auto-saves on keystroke, **no explicit Save** (`AdContent.tsx`). Action: add save affordance | P2 | S |
| S3-6 | "UTM parameter / per-creative overrides — purpose & flow to discuss" | FE | 💬 | ✅ Exists: global `adCopy.utmTemplate` + per-creative override (`AdContent.tsx:191–196`) | P2 | — |

---

## COMMON / cross-step

| ID | Item | Layer | Theme | Current state | Pri | Effort |
|----|------|-------|-------|---------------|-----|--------|
| C-1 | "No flexibility for # of campaign/adset/ad at adaccount level" | FE+BE | ✨ | ❌ `plan.structure` is **plan-level**, same for all accounts (`types.ts:315`, `StructureEditor.tsx`). Need per-account structure | P1 | L |
| C-2 | "Asset name edit — missing" | FE | ✨ | ❌ Review pane fields **read-only** (`ReviewPanes.tsx:123–150`); names auto-derived. Action: add inline edit | P1 | M |
| C-3 | "Launch name — missing" | FE | ✨ | ⚠️ `plan.name` exists (`types.ts:269`, `useFlowV2.ts:48`) but **no edit UI**. Action: surface a name field | P1 | S |
| C-4 | "Nomenclature — missing (basic + asset level)" | FE+BE | ✨ | ❌ Single `plan.namingPattern` token string, ad-unit only (`mockLaunchV2.ts:44–57`). No UI, no per-level patterns | P1 | L |
| M-1 | "Add step-wise pointers / inline guidance (got confused on step 1)" — Rahul Saini | FE | 🎨 | ❌ No inline contextual help today. Action: add per-step hints/tooltips | P2 | M |

---

## Backend epic (umbrella)

`launchv2` is **100% mock** today — no Graph API, no Supabase (`services/mockLaunchV2.ts`, `services/strategiesService.ts`, `data.ts`). The API-tagged items (S2-1 data source, S2-3 catalogue/products, S2-4 posts, S2-5 audiences, S2-7a/b templates, S3-2 media upload, C-1 structure, C-4 nomenclature persistence) all roll up into a **real Meta integration epic**: account/page/pixel enumeration, catalogue + product sets, saved posts, custom audiences, targeting-template CRUD, creative/media upload, and the campaign/adset/ad creation calls. This is the largest BE workstream and should be planned separately from the FE polish above.

---

## 💬 Discussion-first items (decide before building)

Explicitly tagged "to be discussed" by the team — need Maalik/Gaba decision first:
- **S1-1** filter inside search · **S2-2** recently-used · **S2-5** custom audience scope · **S2-9** optimization (Gaba) · **S2-10** Advantage+ placement (Gaba) · **S3-6** UTM purpose/flow.
- Plus **S2-3** & **S2-8**: need Sourabh to point to the *exact* missing field (product selection / placements), since the generic versions already exist in code.

---

## Suggested first wave (quick, high-signal — "deliver by Monday" intent)

Low-effort FE wins that directly answer the loudest complaints:
1. **S2-6** — bid strategy out of collapsible (S)
2. **C-3** — surface launch-name field (S)
3. **S1-2** — remove custom intent option (S)
4. **S3-5** — save button on per-media text edit (S)
5. **S3-4** — surface creative enhancement in Step 3 (S)

Then P1 medium items (S2-1, S2-4, S2-10, S2-11, S3-1, S3-3, C-2). The L-effort + BE items (S2-7a, S3-2, C-1, C-4, backend epic) go to a planned sprint, not Monday.

---

## Notes for the implementation session

- All file paths are relative to repo root (`src/launchv2/...`). Line numbers were accurate at time of writing (2026-06-15) — re-grep if the file shifted.
- There are **two** Step-2 variants in code: `Step2Setup.tsx` (stacked) and `Step2SetupV2.tsx` (sidebar nav). Confirm which is the live one before editing.
- Before building any 💬 item, get the decision. Before building S2-3 / S2-8, get the exact field list from Sourabh.
- Verify changes by running the app and walking `/launchv2/new` through the affected step.
