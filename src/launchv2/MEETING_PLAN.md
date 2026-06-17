# Launch v2 — Locked Build Plan (Meeting + Backlog)

> Source: "Launch feedback - figma progress" meeting (tldv 6a2fc648…) + dev feedback backlog.
> Every item below was decided by Maalik in a decision-by-decision Q&A. FE-only unless tagged.
> Status legend: ✅ decided · ⏸ deferred · 🔬 mock-now/real-API-later · 🧩 TBD-detail-before-build

---

## A · Step 1 — Start / Flow
1. **Strategy = first mandatory pick.** Custom → objective picker appears next; Template → objective comes from the template.
2. **Branch:** Custom = full manual walk · Template = prefilled + editable across steps · **footer "Skip & Launch" button** beside Next (jump ahead any time).
3. **Fast launch:** per-card "Fast launch" button on saved setups **AND** a top-level mode toggle.
4. **Saved-setup search:** search bar + filter chips row (CBO/ABO, objective, budget mode, tags) + **"More" overflow dropdown** when chips exceed space.

## B · Step 2 — Account / Creative / Placement / Templates
5. **Creative source:** Post-ID + Catalogue toggles both allowed (not exclusive). Catalogue on → info msg "select catalogue + creative distribution next step"; Post-ID on → "creative selection next step." Actual selection happens in Step 3.
6. **Advantage+ placement:** ON → placements auto-set + manual hidden; OFF → manual restored.
7. **Templates section-wise** via launch-strategy + copy-from-running. Copying at campaign level → only campaign-level settings come in + info msg confirming behavior. Targeting templates stay as-is.
8. **Catalogue → creative pipeline (full):** catalogue → product picker → product images feed Step 3 media for creation. (FE + BE plumbing.)
9. **Manual placements:** complete to the **full Meta list** (all FB/IG/AN/Messenger positions + Threads).
10. **Special ad category:** add **country/region selector** when a category is declared.
11. **Bid strategy:** surface **inline** in campaign section (out of Advanced); cap/cost value shows only for the relevant strategy.
12. **Advantage+ IA:** single source = campaign-level toggle; placement section only **reflects** it (read-only "Auto placements via Advantage+"), no separate toggle.

## C · Step 3 — Distribution (full redesign) + Ad content
13. **Account split (stage 1):** distribute N ads across selected accounts — **equal** / **duplicate** (each gets full) / **custom = explicit ad counts (must sum to total)**.
14. **Per-account structure (stage 2):** Campaign : Adset : Ad, default **1 : 1 : N**. Editable any level:
    - **Under-count** (e.g. 1:2:20) → extra ads deleted + info msg.
    - **Over-count** (e.g. 1:10:10) → adsets/campaigns repeat in sequential ad-repeat order to fill slots + info msg.
15. **Per-account page split (stage 3):** split that account's total ads across its pages. Duplicate → campaign duplicates + info msg when count increases.
16. **Budget:** per-account show **budget only** (no breakdown table).
17. **Bulk-select accounts → apply settings in bulk.**
18. **Two variants:** V1 (current split panel) · V2 (left ad-account panel, multi-select + per-level edit). **Toggle on Step 3, V1 default; Catalogue/Post-ID → V2 forced.**
    - **V2 right pane** = creative selection (top) + distribution/structure/page-split/budget (below), per-account.
    - **V2 multi-select → bulk edit** with info msg ("N ad accounts selected, editing in bulk"); single = no bulk label. Per-level edit reuses the bulk editor.
    - **V2 creative/catalogue/post** = per-account in the right pane.
    - *(Parked idea: a 3rd "creative-top + distribution-below" variant — not building unless asked.)*
19. **V2 creative→account:** if arrived WITH creatives → pop-over asks account-level distribution; if WITHOUT → ask "all-at-once (distribute across accounts now) vs per-account manual." No auto-spray to all accounts.
20. **Per-placement media:** add **UPLOAD** per placement (+ keep crop + replace-from-existing).

## D · Step 4 — Review
21. **Two variants:** (1) tree master-detail (current) · (2) **full table with level-tabs** (Ad account / Campaign / Adset / Ad).
    - **Row click → reuses the tree-variant edit pane** (same editor).
    - **Bulk:** check rows → bulk-edit toolbar slides in (apply to all checked, mixed-state).
    - **Columns:** fixed sensible per level (name, status, key settings, count, budget).
    - **V1↔V2 toggle:** shared search/filter + preserved selection across the switch.
22. **Bulk checkboxes** on every tree/table node + **"Select all"** (the missing piece; was shift/cmd-only).
23. **Search + filters popover** (page, ad account, status, type).
24. **Accordion:** edit-pane sections single-open (collapse others); tree stays multi-open.
25. **Placement preview tabs** (Feed / Stories / Reels / In-stream), each in its aspect ratio.
26. **Asset names:** editable name field per node (campaign/adset/ad) **+ inline rename** in tree/table.
27. **Nomenclature:** launch-name field + **per-level token-template builder** ({brand}_{objective}_{n}…) + live preview of resolved names.
28. **Infinite scroll** for nested 4-level → **devs' side, not ours** (dropped from FE scope).

## E · Audience / Targeting (Step 2 + per-level in Review)
29. **Full Meta parity** — common 3–4 fields inline (locations, age/gender, custom/lookalike, Advantage+ Audience), the rest in the **template-edit modal** (detailed targeting flexible_spec with Narrow/Must-also-match/Exclude, all category keys, DMA/pins, languages, exclusions).
30. **Editable in Step 2 + Review** (at parent levels too — every level's edit actions).
31. **Detailed targeting + audience-size meter:** 🔬 mock now, real Meta targeting-search + delivery-estimate API later.
32. **special_ad_category cascade** gates audience fields (age 18-65, gender all, no zip, 15-mi min radius, no detailed/lookalike) — gray out with explainer.

---

## Deferred / not-ours
- ⏸ **Relaunch with edits** (previous launch) — later wave (`LaunchV2Auto` stays stub for now).
- ⏸ **Unused templates >30d → mark for deletion** — lifecycle, BE-leaning, later.
- **Infinite scroll (4-level)** — developers handle on their end.
- **Mock launch service consuming overrides/carousel/crop at launch** — end-to-end wiring is a separate slice.

## Build waves (conflict-safe execution)
- **Wave 0 — Foundation/contract (SOLO, sequential):** all `types.ts` + `useFlowV2` init + `settingsRegistry` + `reducer` flow/cascade changes in one pass, so parallel agents never collide on shared files. Type-clean before fan-out.
  - Schema: account-split (`accountDistribution` + `accountWeights`), per-account structure map, per-account page-split, `TargetingSpec` (audience), per-level `namingPatterns` + launch name, special-ad country, flow mode (custom/template) + fast-launch, per-placement upload on `AssetCustomizationRule`.
- **Wave 1 — Step 1 flow (SOLO/near-solo):** strategy-first order, custom/template branch, footer Skip&Launch, fast-launch, saved-setup search+filters. Touches `Step1StartV2` + `LaunchV2Flow` (flow/stepValid) — shared orchestrator, so kept close to foundation.
- **Waves 2-5 — PARALLEL (distinct file-sets, no overlap):**
  - **Step 2** — `Step2Setup` + `setup/AccountsPages` (creative-source toggles+msgs, full placements, special-ad country, bid-strategy inline, advantage+ IA, template section-wise, catalogue→creative).
  - **Step 3 dist V1 + ad content** — `Step3AdDistributionV3` + `distribution/*` + `spread/*` (account split → per-account structure → page split, per-placement upload).
  - **Step 3 V2** — NEW left-account-panel component (per-account right pane).
  - **Step 4 review** — `Step4Review` + `review/*` (table variant, checkboxes, search popover, accordion, placement preview tabs, asset names, nomenclature builder).
  - **Audience editor** — new audience/targeting components + template-edit modal (reads the Wave-0 `TargetingSpec`).
- Integrate + `npm run build` (tsc app config) clean after each wave.

## Source-of-truth notes
- Meta field structure (campaign/adset/ad + audience/targeting) confirmed via Marketing API + Ads Manager (catalogs gathered this session). Maalik to share previous targeting-template screenshots **for reference only**; Meta API = source of truth.
