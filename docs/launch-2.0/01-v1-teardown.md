# Launch 2.0 — Stream 01: V1 Teardown + "Launch 2.0 Beta" Audit

> Research-only. Deep teardown of the **current** Launch module: what exists,
> the real flows, and the UX/flow friction. Plus a precise audit of the existing
> "New Launch 2.0 (Beta)" CTA so the redesign knows its exact starting point.
> Primary engine: codebase. Cited file:line throughout.

---

## Overview

The current Launch module is a **mature, multi-surface ad-ops suite** built around one
canonical artifact: a `launches` row plus child `launch_campaigns` / `launch_adsets` /
`launch_ads` / `launch_ad_accounts`, with almost all soft state crammed into a single
`launch_config` JSON blob. The product offers **at least four distinct ways to create a
launch** — the 3-step wizard (`/launch/new`), the catalogue 3-column editor
(`/launch/new?mode=catalogue`), the Creative-Library "Fast Launch" + "Adgroup Launch"
modals, and RRM/AutoPilot auto-launch stubs — each with its own bespoke distribution
model, its own validation, and (critically) its own mental model of the word "strategy."
The History table is the hub. The "New Launch 2.0 (Beta)" CTA that this redesign is named
after is, **today, a literal no-op toast** — there is no Launch 2.0 code, route, flag, or
component anywhere. The dominant friction themes: (1) **fragmented entry points with no
shared spine**, (2) **three colliding meanings of "strategy" / "distribution,"** (3) a
**simulated launch backend** (`launch-execute` is a stub) that the UI presents as real,
(4) **dead/duplicate code** (`StepReview.tsx`, `FastLaunchModal.tsx` both orphaned), and
(5) **near-total absence of large-scale and permission edge-case handling** despite the
product's explicit "launch at scale across many accounts" promise.

---

## 0. Routing + IA map (ground truth)

From `src/App.tsx:139-146` and `src/components/sidebar/modules.ts:120-132`:

| Sidebar sub-item | Path | Component | Maturity |
|---|---|---|---|
| History | `/launch` | `LaunchHistory` (`src/pages/LaunchHistory.tsx`) | Mature |
| Targeting Template | `/launch/templates` | `TargetingTemplates` (`src/pages/TargetingTemplates.tsx`) | Mature |
| AutoPilot | `/launch/autopilot` | `AutoPilotLaunch` (`src/pages/AutoPilotLaunch.tsx`) | Mature prototype, **mock state only** |
| Launch Settings | `/launch/settings` | `ComingSoonPage` stub (`src/App.tsx:144`) | Stub |
| RRM | `/rrm` | `RRM` (`src/pages/RRM.tsx`) + `RRMSettings` | Mature |
| — (no nav item) | `/launch/new`, `/launch/:id` | `LaunchFlow` (`src/pages/LaunchFlow.tsx`) | Mature |
| — (no nav item) | `/launch/clones` | `ComingSoonPage` stub (`src/App.tsx:143`) | Stub |
| — (no nav item) | `/launch/campaign-urls` | `Offers` (`src/App.tsx:145`) | Mature elsewhere |

**IA-vs-implementation gap #1:** `CLAUDE.md` and `modules.ts:124-125` claim "Clones merged
inside History (history page filters between launches and clones)." **This filter does not
exist.** `LaunchHistory.tsx` has only a name search (`:36`) and a non-functional filter
icon button (`:96`). `LaunchHistoryTable.tsx` shows a Standard/Catalogue type badge
(`:125-127`) but no launches-vs-clones toggle. `/launch/clones` is still a ComingSoon stub.
The nav promises a capability the page doesn't deliver.

**IA-vs-implementation gap #2:** `Launch.tsx` (`src/pages/Launch.tsx`) is a dead
`ShellPage` placeholder ("Create campaigns with templates…") that nothing routes to —
`/launch` goes to `LaunchHistory`, not `Launch`.

---

## 1. "Launch 2.0 Beta" — what it is today (HIGHEST PRIORITY)

### The exact truth

`src/pages/LaunchHistory.tsx:98`:

```tsx
<Button variant="outline" onClick={() => toast({ title: "Coming Soon", description: "New Launch 2.0 is under development." })}>
  <Rocket className="mr-2 h-4 w-4" /> New Launch 2.0 <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">Beta</Badge>
</Button>
```

- **It routes nowhere.** The `onClick` fires a single `toast()` and returns.
- **There is no flag.** No feature-flag check, no `searchParams`, no env gate, no plan gate.
  A repo-wide search for `Launch 2.0 / launch-2 / launch2 / Launch2` returns only this button,
  the `docs/launch-2.0/` research folder, and unrelated `mode === "development"` in
  `vite.config.ts`. **No Launch 2.0 component, route, or hook exists.**
- **It is not behind the AI/Growth plan gate.** The whole page early-returns
  `<LaunchUpsellPage />` for `plan === "ai"` (`:22-24`), so the button is only ever seen by
  full-plan users — but even for them it does nothing.

### How it sits next to the other two CTAs

The History toolbar (`LaunchHistory.tsx:96-99`) renders **three** create affordances in a
row, which is itself a friction point (Hick's law, see §11):

1. `New Catalogue Ads` (outline) → `navigate("/launch/new?mode=catalogue")` (`:97`) — real.
2. `New Launch 2.0` + Beta badge (outline) → **toast only** (`:98`) — fake.
3. `New Launch` (primary) → `navigate("/launch/new")` (`:99`) — real, the classic wizard.

So today "Launch 2.0" is **purely a placeholder/marketing stub** signalling intent. The
redesign is greenfield: there is no half-built 2.0 flow to inherit or reconcile — the
starting point is a button that lies. Whatever 2.0 becomes, this button is the only thing
to repoint.

### Implication for the redesign

- We are **not** reconciling a parallel "v2 beta" implementation with the classic flow.
  The "Beta" label sets a user expectation (something new exists) that the product breaks
  the moment it's clicked — a visibility-of-status / honesty violation we should kill or
  make real on day one.
- The real "two flows" tension is **Standard wizard vs Catalogue editor** (§3 vs §4), not
  "v1 vs v2." That is the actual fork 2.0 must unify or deliberately keep separate.

---

## 2. History (`/launch`) — `LaunchHistory.tsx` + `LaunchHistoryTable.tsx` + `LaunchDetailDrawer.tsx`

### Real flow
1. User lands on `/launch`. If `plan === "ai"`, the whole page is replaced by the
   `LaunchUpsellPage` orbital illustration (`LaunchHistory.tsx:22-24`).
2. Otherwise: toolbar (search + dead filter button + 3 create CTAs) over a 12-column table
   (`LaunchHistoryTable.tsx:73-87`): Name, Type, Strategy, Platform, status (mislabelled —
   header says "Platform" twice, see below), Campaigns, Adsets, Ads, Created, Updated,
   Created By, Last Modified By, actions.
3. Draft rows are click-to-resume → `navigate('/launch/:id')` (`:64-68`). Non-draft rows are
   not clickable.
4. Row kebab: drafts get Edit / View Details / Delete; launched get View Details / Relaunch /
   Go to Report (`:174-198`).
5. View Details opens a **read-only** `Sheet` (`LaunchDetailDrawer.tsx`) showing platform,
   status, counts, created/updated. Relaunch clones to a new draft and routes into the wizard
   (`LaunchHistory.tsx:40-55`).

### Friction
- **F-H1 (High):** The filter button (`LaunchHistory.tsx:96`) is a `SlidersHorizontal` icon
  with **no onClick** — pure decoration. Same dead filter button repeats in
  `TargetingTemplates.tsx:164`. Classic "control that looks interactive but isn't"
  (NN/g #1 visibility, user-control violation).
- **F-H2 (High):** Three create CTAs side by side with overlapping semantics; "Launch 2.0
  (Beta)" does nothing. Decision overload + broken affordance.
- **F-H3 (Med):** Column header bug — `LaunchHistoryTable.tsx:78` and `:81` (well, `:77`
  Strategy, `:78` Platform) then the **status** badge renders under the "Platform" header at
  `:146-150` while a separate `Badge variant="outline">Facebook</Badge>` renders at
  `:143-145`. The status column has **no header label** — headers and cells are misaligned by
  one. Status is visually unlabelled.
- **F-H4 (Med):** Rename is **double-click only** and **draft-only** (`:111-117`), with no
  affordance hinting it's editable. Recognition-over-recall failure — users can't discover it.
- **F-H5 (Med):** The detail drawer is **read-only and shallow** (`LaunchDetailDrawer.tsx`):
  no campaign/adset/ad breakdown, no per-account distribution, no error/why-failed surface, no
  link to the report for a launched item (that's only in the kebab). A "failed" launch gives
  the user nothing actionable here.
- **F-H6 (Med):** Strategy column resolves from either a column or `launch_config.distribution`
  (`:36-41`) — but launches created via Catalogue, Fast Launch, or Adgroup Launch never write
  a distribution strategy, so they show "—". The column is empty for most non-wizard launches,
  making it low-signal.
- **F-H7 (Low):** Search is client-side substring on already-loaded rows (`:36-38`). Fine at
  small N, see stress test §10.
- **Activity logging** is fire-and-forget inline `supabase.insert` into `activity_logs`
  (`:44-49`, `:60-66`) with `as any` casts — not surfaced anywhere in this module (per
  `CLAUDE.md`, Activity Log was removed as a nav item).

### State coverage
- Populated ✅ (table). Zero-data ✅ (`:104-116`, distinguishes empty-search vs no-launches).
- Loading ✅ ("Loading launches…" `:103`). **Error ❌** — `useLaunches` error is not handled;
  `isLoading` false + undefined data falls through to the empty state, so a fetch failure
  reads as "No launches yet" (false zero-state — dangerous).
- Partial ⚠️ — counts come from `LaunchWithCounts`; a launch mid-creation with 0 ads still
  renders 0s with no "incomplete draft" cue beyond the status badge.

### Carry vs break
- **Carry:** table-as-hub model, relaunch-to-draft, plan-gated upsell takeover
  (`LaunchUpsellPage` is genuinely polished).
- **Break:** the dead filter, the fake 2.0 CTA, the unlabelled/misaligned status column, the
  shallow read-only drawer, the false zero-state on error. The promised clones filter must
  either be built or removed from the IA.

---

## 3. The 3-step wizard — `LaunchFlow.tsx` + `LaunchStepper.tsx` + Step{AccountSetup,Targeting,Creatives}

### Stepper reality (important)
`LaunchStepper.tsx:4-8` defines **exactly 3 steps**: "Ad Account & Setup", "Targeting",
"Creatives & Config". **There is no 4th "Review" step in the wizard.** Review is a **modal**
(`LaunchPreviewModal`) launched from inside Step 3 (`StepCreatives.tsx:268-273`). Yet a fully
built `StepReview.tsx` exists — **it is orphaned dead code** (imported nowhere; grep for
`StepReview` returns only its own definition, `src/components/launch/StepReview.tsx:16,21`).
So there are **two complete "review + launch" implementations** (`StepReview.tsx` and
`LaunchPreviewModal.tsx`) with nearly identical logic (both call `validateStep4` + invoke
`launch-execute`), only one of which ships. This is a maintenance trap and a source of drift.

`LaunchFlow.tsx` also routes to the catalogue editor based on `mode=catalogue` or
`launch_config.mode` (`:20,25,48-63`), so the same route renders **two completely different
UIs** (wizard vs 3-column editor) with no visible switch — see §4.

### Step navigation flow
- Resume logic: on load with an existing launch, jump to `completed_step + 1` (`:29-34`).
- Step gating (`:36-41`): can go back freely; can't jump ahead past `completedStep+1`; toasts
  "Complete the current step first" / "Save current step before jumping ahead." Locked steps
  show a padlock (`LaunchStepper.tsx:42-44`).

### Step 1 — `StepAccountSetup.tsx` (the heaviest screen, 618 lines)
**Flow:** optional Campaign URL → Launch name → Ad-account multiselect → per-account
"Tracking & Setup" cards (`AccountSetupCard`) → **Distribution** block (status split summary
+ 3 strategy radio cards + live per-(account→page) allocation) → missing-fields summary →
Next.

This step is doing an enormous amount: account selection, per-account tracking config,
hierarchy structure (campaigns×adsets×ads), **and** the entire ad→page distribution model
(`:101-103`, `:374-416`), health badges + capacity hints (`:497-500`), legacy single-page →
`target_pairs` migration (`:140-175`), and strategy-change-triggers-regeneration with a
destructive confirm (`:251-254`, `:599-615`).

**Friction:**
- **F-1.1 (High):** Step 1 is **overloaded** — it mixes "who am I launching to" (accounts) with
  "how do I spread ads across pages" (distribution strategy) **before the user has any ads**.
  The distribution numbers are explicitly **estimates** off the structure inputs
  (`:374-396`, `pending` flag) and are recomputed authoritatively only in Step 3. Users tune a
  strategy against fake counts.
- **F-1.2 (High):** **Destructive regeneration.** Changing campaigns/adsets/ads structure on an
  existing launch deletes all campaigns/adsets/ads and rebuilds them (`:284-308`), wiping any
  creative work done in Step 3. The confirm dialog (`:599-615`) warns but the blast radius
  (losing all ad copy/media) isn't quantified.
- **F-1.3 (Med):** Raw `supabase` writes with `as any` happen **inside the component**
  (`:281-308`, `:324-327`) rather than in a mutation hook — inconsistent with the rest of the
  step's use of `useCreateLaunch`/`useUpdateLaunch`, and not covered by query invalidation
  patterns.
- **F-1.4 (Med):** "Bulk edit" on the account toolbar is a stub — `handleBulkEdit` just toasts
  `"Bulk edit … — coming soon"` (`:362-364`). The toolbar appears functional.
- **F-1.5 (Med):** Per-account strategy state exists (`strategies` keyed by account, `:93`) but
  the UI only ever uses the **first** account's strategy globally (`getGlobalStrategy()`,
  `:223-226`). So multi-account launches silently share one structure — the per-account data
  model is a lie the UI doesn't honour.
- **F-1.6 (Low):** Campaign URL helper text promises it will "auto-filter templates in the next
  step" (`:451`) — a cross-step dependency the user can't see the effect of until Step 2.

**Edge cases:** Long names — name input has no maxlength; account cards `truncate`. 0 accounts
— Tracking/Distribution blocks hidden (`:479`, `:529`). Validation — strong: per-field errors +
`MissingFieldsSummary` with scroll-to-anchor (`:586-588`, `lib/launch-validation.ts:156-169`).
Permission-denied — **none** (any role can configure + save). Offline — save failures toast
generically (`:333-335`).

### Step 2 — `StepTargeting.tsx` + `TargetingFormFields`/`CampaignCard`/`AdsetCard`
**Flow:** On first entry (`!step2_initialized`), a **`TemplateSelectModal` auto-opens**
(`:74`) forcing a choice: pick a template, link a CU template, or "Skip" (apply
`STEP2_DEFAULTS`). Then per-campaign cards with nested adset cards. Optional "save as template"
checkbox. Continue validates (`validateStep2`) and persists.

**Friction:**
- **F-2.1 (Med):** The auto-opening modal is a **forced interstitial** every first visit
  (`:74`). No "remember my default / always skip" — repeat users dismiss it every time
  (consistency + user-control friction).
- **F-2.2 (Med):** Two competing back affordances at the bottom — a text "← Back to History"
  link (`:315-317`) **and** a "Previous" button (`:319-321`). The text link **abandons the
  wizard** (navigates to `/launch`) with no save warning; "Previous" goes to Step 1. Easy to
  lose work by clicking the wrong one (NN/g #5 error prevention).
- **F-2.3 (Med):** Template application is **whole-launch overwrite** — `applyPayloadToCampaigns`
  / `applyPayloadToAdsets` (`:30-59`) map the template across **every** campaign/adset
  uniformly. No per-campaign template, no preview of what changes.
- **F-2.4 (Low):** "Save as template" only captures `campaigns[0]`/`adsets[0]` (`:191-213`) — if
  campaigns differ, you silently template only the first.
- Validation is again strong with friendly relabelled missing-fields (`:107-127`).

### Step 3 — `StepCreatives.tsx` + Ads/Campaigns/AdGroups/Accounts tabs + distribution bar
**Flow:** 4 tabs (Accounts / Campaigns / Ad groups / **Ads**, default Ads). The Ads tab
(`AdsTableTab.tsx`) is the workhorse: inline-edit name, primary text (with `TextCarousel`
cycling workspace presets `:35-83`), headline, description, CTA, display link, media type
toggle, per-row edit panel (`AdEditPanel`), duplicate, delete (blocked if last in adset,
`:171-178`). Bulk toolbars for ads (apply/schedule/duplicate/delete) and adgroups appear on
selection. A **sticky `LaunchStrategyBar`** appears when a selection rolls up to ads
(`:90-92`, `167-181`). "Proceed" validates (`validateStep3`) and opens **`LaunchPreviewModal`**.

A **parallel distribution path** also lives here: the strategy bar's Preview/Launch opens
`LaunchDistributionPreview` → `LaunchConfirmDialog` (`:275-311`) — a *different* launch path
from the `LaunchPreviewModal` "Proceed" button.

**Friction:**
- **F-3.1 (High):** **Two coexisting launch paths on one screen.** "Proceed" (`:261`) →
  `LaunchPreviewModal` (whole-launch execute). The strategy bar's "Launch" (`:177`) →
  `LaunchDistributionPreview` → `LaunchConfirmDialog` (distribution execute). Both ultimately
  invoke the same `launch-execute` (`LaunchPreviewModal.tsx:74`,
  `LaunchConfirmDialog.tsx:134`) but via different review UIs, different summaries, and
  different mental models (launch-everything vs distribute-selection). A user can reach "launch"
  two ways with different previews. Severe consistency problem.
- **F-3.2 (Med):** The 4-tab structure splits one hierarchy across tabs; the only tab with real
  per-row editing is Ads. Accounts/Campaigns/AdGroups tabs are mostly selection surfaces feeding
  the distribution rollup. Users hunting for "where do I set the budget" must know it's on the
  Campaign/Adset cards back in **Step 2**, not here.
- **F-3.3 (Med):** Bulk schedule sets status "scheduled" + writes a per-ad schedule map into
  `launch_config.adSchedules` (`:112-121`) — but per-ad timezone defaults to the **first** ad
  account's tz (`:69-72`), even though a launch can span accounts in different timezones.
  Silent correctness risk for multi-account scheduled launches.
- **F-3.4 (Low):** Media presence is validated (`validateStep3` requires ≥1 media,
  `launch-validation.ts:104`) but `media_urls` placeholder rows can be set without real upload
  in some paths (Fast/Adgroup launch create ad rows with no media; see §6).

**Edge cases:** 1000+ ads — `AdsTableTab` renders **all** filtered rows with no virtualization
(`:201`), see §10. Search — client-side over name/text/headline (`:141-147`). Delete-last-ad
guarded (`:171-178`). Long copy — textareas `resize-none`, fixed 2 rows (`:71`).

### Review (modal) — `LaunchPreviewModal.tsx`
Two stat rows (BM/accounts/campaigns/adsets/ads; budget/media/headlines/text/desc, `:47-60`),
Active/Inactive toggle, optional schedule (date/end/timezone, `:144-209`), validation error
list (`:213-221`), Launch. Calls `launch-execute` (`:74`).

**Friction:**
- **F-R1 (High — and applies to all launch paths):** `launch-execute` is a **simulation**. The
  comment in `LaunchConfirmDialog.tsx:16` says "Simulation returned failure" and
  `StepReview.tsx:52` says "Simulation returned failure." The UI shows "Launch successful!" /
  navigates to History as if ads went live. There is **no real Meta API call, no per-entity
  result, no partial-success handling.** The most consequential action in the product is fake
  and presented as real — the single biggest gap for 2.0.
- **F-R2 (Med):** Validation error list is capped at 10 with "+N more" (`:216-218`) and is just
  strings — not clickable, no jump-to-fix from the modal (unlike the in-step
  `MissingFieldsSummary`). To fix you must close the modal and hunt.
- **F-R3 (Low):** Budget shown with a hardcoded `$` (`:55`, also `StepReview.tsx:86`) ignoring
  per-account currency that the distribution core tracks carefully (`launch-distribution.ts`
  `budgetByCurrency`). Currency inconsistency between surfaces.

### Carry vs break (wizard)
- **Carry:** the 3-step skeleton, the per-field `MissingFieldsSummary` + scroll-to-anchor
  pattern (genuinely good, reuse everywhere), inline ad editing, relaunch.
- **Break:** dual launch paths (F-3.1), dual review implementations (delete `StepReview.tsx`),
  Step-1 overload + estimate-based distribution, destructive regen, simulated execute presented
  as real, the abandon-vs-previous footer ambiguity.

---

## 4. Catalogue Ads flow — `CatalogueAdsFlow.tsx` + `components/launch/catalogue/*`

### Real flow
1. Entered via `/launch/new?mode=catalogue` (History `:97`) or an existing catalogue launch.
2. New: a **setup `Dialog`** (`CatalogueAdsFlow.tsx:35-125`) — name + ad-account checklist →
   Create → routes to `/launch/:id`.
3. Existing: a **3-column resizable layout** (`:265-319`): left hierarchy tree
   (`CatalogueHierarchyPanel`), center config form (`CatalogueConfigPanel`), right live preview
   (`CataloguePreviewPanel`). Autosave via `useCatalogueAutosave` (`:144`). Footer: Cancel +
   "Launch N Catalogue Ads."

### Friction
- **F-C1 (High):** This is a **structurally different UI from the wizard** for the same job
  (creating a launch), reachable from a sibling button, with **no stepper, no progress, no
  shared chrome**. The user's mental model resets completely between "Standard" and "Catalogue."
  2.0's core decision: unify or deliberately bifurcate — but the current silent fork is the
  worst of both.
- **F-C2 (High):** **Launch is a no-op toast.** `handleLaunch` validates, and on success only
  fires `toast({ title: 'Launching N Catalogue Ads...' })` (`:262`) — it **never calls
  `launch-execute` or any mutation.** Catalogue launches cannot actually be launched. (Compare:
  the standard flow at least simulates.)
- **F-C3 (Med):** Bulk actions stubbed — `handleBulkAction` toasts "Bulk … coming soon"
  (`:211-213`). The bulk toolbar is non-functional.
- **F-C4 (Med):** Preview is derived from **dummy defaults** (`DUMMY_ACCOUNT_DEFAULTS`,
  `:226-227`) and a hardcoded page-name map (`'page-1' → 'My Business Page'`, `:228`). The right
  pane shows fabricated content, not the user's real catalogue/page.
- **F-C5 (Med):** Validation on launch (`validateCatalogueLaunch`, `:244-260`) jumps selection to
  the first error entity and sets `fieldErrors`, but there's no summary panel like the wizard's
  `MissingFieldsSummary` — errors are scattered into the config panel.

### State coverage
- Setup dialog handles 0 ad accounts ("Connect Facebook first" `:91-92`). Auto-selects first
  account (`:160-166`). **No zero/loading/error state for the hierarchy panel itself** beyond
  the auto-select. Long names truncate in the dialog (`:103-104`).

### Carry vs break
- **Carry:** the 3-column "tree → config → live preview" pattern is a strong IA for bulk catalog
  editing — arguably better than the wizard's tab-splitting; worth studying for 2.0's unified
  editor.
- **Break:** the dead Launch button (F-C2 is a showstopper), dummy preview data, stubbed bulk,
  and the silent fork from the wizard.

---

## 5. Targeting Templates (`/launch/templates`) — `TargetingTemplates.tsx`

### Real flow
Toolbar (search + **dead filter button** `:164` + New Template) over a 4-column table
(Name / Platform / Created / Actions). New/Edit opens a right `Sheet` with name + the shared
`TargetingFormFields` (campaign + adset + ads sections). Validate → create/update. Delete via
confirm.

### Friction
- **F-T1 (Med):** Same dead `SlidersHorizontal` filter button as History (`:164`).
- **F-T2 (Med):** Templates table has **no usage signal** — you can't see which launches use a
  template or how many. Delete copy says "Launches using this template will not be affected"
  (`:269`) implying linkage exists, but it's invisible. Recognition gap.
- **F-T3 (Low):** Platform is hardcoded "Facebook" everywhere (`:189`) — no multi-platform story
  despite Reports/sidebar referencing TikTok/NewsBreak.
- **F-T4 (Low):** Template fields are a full `TargetingFormFields` clone of Step 2; the two can
  drift (they share `STEP2_DEFAULTS` `:24` which mitigates this, good).

### State coverage
- Loading ✅ (`:180-182`), zero-data ✅ (`:183-185`). **Error ❌** (mutation errors toast; query
  error unhandled — empty reads as "No templates yet"). Note the empty/loading checks use
  `templates` (unfiltered) while the body maps `filteredTemplates` (`:65-67`) — a search with no
  matches shows an **empty table with no "no matches" message** (only the unfiltered-empty case
  is handled). Minor zero-state gap.

### Carry vs break
- **Carry:** template CRUD + shared form, deep-merge-with-defaults hydration (`:39-51`).
- **Break:** dead filter, no usage/linkage visibility, search-empty has no message.

---

## 6. Creative-Library launch modals — Fast Launch + Adgroup Launch

### What's actually wired
- **`AdgroupLaunchModal.tsx`** is the heavily-used one — imported into `CreativeLibrary.tsx`,
  `Genie`/`Genie2`/`Genie3`/`Genie4`/`Genie5`, `GenieLibraryView`, and `FolderContentsView`
  (8 sites). It builds a launch **draft** (`useAdgroupLaunch`) from selected creative items.
- **`FolderLaunchModal.tsx`** offers a fork: "Fast Launch" → `FastLaunchDrawer` (`:33-39`) or
  "Advanced Launch" → `navigate('/launch/new?folderId=…')` into the wizard (`:21-24`).
- **`FastLaunchModal.tsx` is ORPHANED dead code** — defined but imported nowhere. The live Fast
  Launch surface is `FastLaunchDrawer.tsx` (used by `FolderLaunchModal.tsx:8,33`). Another
  duplicate-implementation trap (cf. `StepReview`).

### Adgroup Launch flow + friction
**Flow:** name + structure (campaigns / adsets-per-campaign / ads-per-adset, `:168-202`) +
**Round Robin** toggle (`:204-218`) + Advanced Mapping + a live distribution-message block
(`:240-337`) describing clean-fit / duplication / truncation, then "Create Launch Draft"
(`:355`).

- **F-CL1 (High — naming collision):** This modal's **"Round Robin Strategy"** (`item → adset`
  distribution) is a *third* distinct meaning of "strategy/distribution" in the codebase. The
  core lib explicitly flags this (`launch-distribution.ts:16-23`): the wizard's "Equal/Fill/
  Duplicate" is the *ad → page* axis, while Round Robin is the *item → adset* axis, **and**
  AutoPilot has "Launch Strategy" configs (§7). Three things called "strategy," all different.
  Users (and us) conflate them constantly — a top redesign hazard.
- **F-CL2 (Med):** Truncation silently **drops items** unless the user reads the red message and
  opens Advanced Mapping (`:322-336`). Default behaviour can discard creatives.
- **F-CL3 (Med):** Creates a **draft** ("Create Launch Draft" `:361`) — so the CL "launch"
  doesn't launch; it dumps you back into the wizard/History to finish. The word "Launch" on the
  CTA over-promises (it's really "stage a draft").
- **F-CL4 (Low):** Structure caps are hardcoded (campaigns ≤10, adsets ≤10, ads ≤50, `:174-198`)
  with no explanation; "ads/adset" can exceed item count, triggering duplication implicitly.

### Fast Launch (`FastLaunchModal` orphan / `FastLaunchDrawer` live) flow + friction
**Flow (from the orphan, which mirrors the drawer):** pick linked Campaign URLs + ad accounts →
"Launch (N)" → for each CU, fetch its default targeting template, then **directly insert**
launches/accounts/campaigns/adsets/ads via raw `supabase` (`FastLaunchModal.tsx:62-165`) with
`status: 'launched'` and `completed_step: 3`.

- **F-CL5 (High):** Fast Launch writes `status: 'launched'` **without ever calling
  `launch-execute`** (`:88-92`) — it marks launches "launched" in the DB while doing zero
  platform work, and creates ad rows with **no media/copy** (`:136-155`). These appear as
  successful launched rows in History that contain empty ads. Data-integrity + honesty problem.
- **F-CL6 (Med):** Heavy multi-table writes in a loop with no transaction (`:62-165`) — partial
  failure leaves orphaned launches/campaigns. No rollback.
- **F-CL7 (Med):** Requires a CU to have a linked default template; if none, it launches with
  `templatePayload = {}` (`:74-78`) — empty targeting, silently.

### State coverage
- Adgroup modal: thumbnails cap at 8 + "+N" (`:139-151`); empty items handled by `|| 1` ad
  fallbacks. Fast Launch: `linkedCUs` empty → helpful inline message (`:201-207`); `canLaunch`
  gating (`:54`). No loading skeletons for the account list.

### Carry vs break
- **Carry:** the FolderLaunchModal "Fast vs Advanced" fork is a good progressive-disclosure
  pattern; the Adgroup distribution-preview messaging (clean/dup/truncate) is clear and worth
  generalizing.
- **Break:** delete `FastLaunchModal.tsx` orphan; stop writing `status:'launched'` without real
  execution (F-CL5); transactionalize the bulk inserts; reconcile the three "strategy" meanings
  (F-CL1) — this is *the* IA cleanup for 2.0.

---

## 7. AutoPilot (`/launch/autopilot`) — `AutoPilotLaunch.tsx` + `components/autopilot/*`

### Real flow
Plan-gated (`plan === 'ai'` → `AutomationUpsellPage`, `:129-131`). 4 tabs: **Launch
Strategies**, **Warm-up Configs**, **Ad Accounts**, **Auto Launches**. Strategies/warmups are
CRUD'd, set-default, cloned, assigned to accounts; assignment counts computed from a fixed
dummy account array (`INITIAL_ACCOUNTS_FOR_COUNTS`, `:89-94`).

### Friction
- **F-A1 (High):** **Entirely mock / in-memory.** All state is `useState` seeded from
  `INITIAL_STRATEGIES` / `INITIAL_WARMUP_CONFIGS` (`:17-86`, `:134-139`) — **no persistence, no
  fetch, no save.** Refresh = total reset. The CLAUDE.md is honest ("mature prototype, mock
  state"), but to a user it's a fully interactive feature that silently forgets everything.
- **F-A2 (Med):** Module-level mutable counters `nextStrategyId` / `nextWarmupId` (`:14-15`) —
  IDs persist across mounts within a session but not reloads; a re-entry can collide. Fragile.
- **F-A3 (Med):** "Launch Strategy" here = automation profile (nomenclature, interval,
  max/day, rejection-pause). **Fourth** overloaded use of "strategy" relative to §3/§6 (see
  F-CL1). Naming chaos compounds.
- **F-A4 (Low):** Assignment counts are computed against a frozen 4-account fixture, not the
  real connected accounts — numbers are decorative.

### State coverage
- Populated only (mock). No zero-data (always seeded), no loading, no error, no empty-account
  story. This is a prototype shell, not a stateful surface.

### Carry vs break
- **Carry:** the tabbed config IA (strategies / warmups / accounts / auto-launches) is a
  reasonable structure for automated launching; the strategy + warm-up concept is core to the
  "launch at scale" value prop.
- **Break:** everything below the IA — it needs real persistence + data model before 2.0 can
  treat it as anything but a vision mock. Rename "Launch Strategy" to disambiguate.

---

## 8. RRM (`/rrm`, `/rrm/settings`) — `RRM.tsx` + `RRMSettings.tsx` + `components/rrm/*`

### Real flow
Plan-gated (`plan === 'ai'` → `UpsellEmptyState`, `:28-41`). A "Seed Demo Data" button
(`:449-454`), overview cards, and 5 tabs (Ad Accounts / Trend / Pages / Tools / Action Log).
Per-account dilution/replacement toggles, manual "Run Dilution" (`handleRunDilution` invokes a
real `dilution-check` edge function, `:104-135`), and a config drawer. Notably this is the
**most data-backed launch-adjacent surface** — it reads real `account_health_*`, `rrm_*`,
`offers` tables and only **falls back to dummy** snapshots/configs when a real row is missing
(`:76-97`).

### Friction
- **F-RR1 (High):** **Dummy data is silently blended with real data.** `effectiveSnapshotMap` /
  `effectiveConfigMap` overlay fabricated values onto any account lacking real rows
  (`:88-97`), and overview cards render the blend (`:456`). A user can't tell which numbers are
  real vs seeded — a trust/visibility hazard on a feature that triggers automated spend.
- **F-RR2 (High):** **`handleSeedDemoData` is a 300-line writer that inserts production rows**
  (fb_connections, ad accounts, snapshots, events, templates, offers, folders, ads, settings,
  global settings — `:146-441`) directly from a UI button visible to any non-AI user
  (`showSeedButton = !dataLoading`, `:443`). It even creates a fake `fb_connection`
  ("Demo User", `:164-174`). This is a dev tool sitting in the production surface with no admin
  gate.
- **F-RR3 (Med):** "Run Dilution" is admin-gated in the handler (`!isAdmin` early return,
  `:105`) but the **button's enabled/disabled state isn't clearly tied to `isAdmin`** at this
  level — non-admins can click and get a silent no-op. (One of the very few places `role` is
  even consulted in the whole module — see §9.)
- **F-RR4 (Med):** Massive non-transactional seed (`:146-441`): any mid-sequence failure leaves
  half-seeded data; the catch just toasts (`:436-438`).

### State coverage
- Loading via `dataLoading` passed to the table (`:475`). Real-vs-dummy blend covers the
  zero-data case (always shows *something*) — but that's exactly the problem (no honest empty
  state). Error on the edge functions toasts.

### Carry vs break
- **Carry:** the real edge-function integration (`dilution-check`), the health/guardrail model,
  the 5-tab operational view, the 1:1:250 framing in the upsell (`:33`).
- **Break:** remove/gate the seed button (F-RR2), stop blending dummy into real silently (F-RR1),
  enforce role on destructive/spend actions visibly (F-RR3).

---

## 9. Cross-cutting: permissions, currency, persistence, dead code

- **Permissions (High, system-wide):** Across the entire Launch module the **only** role check
  is RRM's `isAdmin` (`RRM.tsx:59,105`). Creating, editing, launching, deleting, relaunching, and
  catalogue editing have **no permission gating** — `useAuth().role` is not consulted in
  `LaunchFlow`, any Step, `LaunchHistory`, `TargetingTemplates`, AutoPilot, or the CL modals.
  "Permission denied" as an edge case is essentially **unhandled** product-wide.
- **`launch_config` overload (High):** Soft state for *everything* lives in one JSON blob —
  `expandState`, `distribution` (v1, `StepAccountSetup.tsx:50-56`), `distribution_run`
  (`LaunchConfirmDialog.tsx:120-129`), `step2_initialized`, `adSchedules`, `initial_status`,
  `scheduled_at`, `mode`, `source`, `ui_state.catalogue_ads`. **Worse, several writers do
  `update({ launch_config: { … } })` that REPLACES the blob** (e.g. `StepReview.tsx:42-44`,
  `LaunchPreviewModal.tsx:65-72`) rather than spreading existing config, so launching can
  **clobber** distribution/expand state. Step 1 spreads correctly (`:266-270`); the review
  modals do not. Latent data-loss bug.
- **Currency (Med):** The distribution core is currency-careful (`budgetByCurrency`,
  per-account currency in `StepCreatives`/`StepAccountSetup`), but the review/preview surfaces
  hardcode `$` (`LaunchPreviewModal.tsx:55`, `StepReview.tsx:86`, History uses Facebook-only).
  Inconsistent money display.
- **Dead / duplicate code (Med):** `StepReview.tsx` (orphan, dup of `LaunchPreviewModal`),
  `FastLaunchModal.tsx` (orphan, dup of `FastLaunchDrawer`), `Launch.tsx` (dead ShellPage). All
  reachable-looking, none used. Remove or consolidate for 2.0.
- **`as any` Supabase casts (Low):** Pervasive (`(supabase as any).from(...)`) across launch
  writes — the launch tables aren't in the generated types, so there's **no compile-time safety**
  on the most data-critical writes in the app.

---

## 10. Stress test (10× scale) + edge-case sweep

| Concern | Reality today | File |
|---|---|---|
| **1000+ launches in History** | Client-side filter over all rows (`:36-38`), no pagination, no virtualization. Full table renders. | `LaunchHistory.tsx:36`, `LaunchHistoryTable.tsx:90` |
| **1000+ ads in Step 3** | `AdsTableTab` maps **all** filtered ads, each with inline inputs + a `TextCarousel` + edit panel. No virtualization → DOM blowup, input lag. | `AdsTableTab.tsx:201` |
| **50 accounts × N pages (distribution)** | Core is O(pairs) and sound; UI `LaunchDistributionPreview` renders every pair row grouped by account, no virtualization (`:211-240`). Fine to ~hundreds, degrades beyond. | `LaunchDistributionPreview.tsx:203-241` |
| **Duplicate strategy ×100 pairs** | `LaunchConfirmDialog` warns it multiplies spend (`:203-209`) — good — but output count can balloon (selectedAds × pairs) with only a textual warning. | `LaunchConfirmDialog.tsx:204-208` |
| **Long names (60+ ch)** | Mostly `truncate` in cards/tables; no maxlength on name inputs anywhere. Ad/template/launch names can be arbitrarily long. | multiple |
| **0 items** | Handled in History/Templates/Catalogue setup; Adgroup/Fast launch fall back to "≥1 ad." | §2, §4, §6 |
| **Slow / offline** | Save/launch failures toast generically; no retry, no optimistic-rollback messaging; no offline detection. | all steps |
| **Validation errors** | **Best-in-class in the wizard** (`MissingFieldsSummary` + scroll-to-anchor); absent/weaker in Catalogue + review modal (string list, capped at 10). | `launch-validation.ts`, §3, §4 |
| **Permission denied** | Unhandled outside RRM `isAdmin`. | §9 |
| **Narrow viewport** | Wizard steps are vertical-stack friendly; the **Catalogue 3-column resizable** layout (`min-h-0` panels) and the wide 12-col History table + Step-3 tables are not mobile-considered. | `CatalogueAdsFlow.tsx:278`, `LaunchHistoryTable.tsx:73` |
| **RTL / long-language** | Not addressed; fixed-width truncation only. | — |

---

## 11. NN/g heuristic violations (top, ranked)

1. **#1 Visibility of system status / honesty (High):** `launch-execute` is a simulation but
   reads as a real launch (F-R1); Fast Launch marks `status:'launched'` with no execution
   (F-CL5); Catalogue "Launch" only toasts (F-C2); AutoPilot forgets on refresh (F-A1); RRM
   blends dummy into real (F-RR1). The product repeatedly tells the user something happened that
   didn't.
2. **#4 Consistency & standards (High):** Three+ meanings of "strategy/distribution" (F-CL1,
   F-A3); two launch paths on one screen (F-3.1); two review implementations; standard vs
   catalogue are entirely different UIs for one job (F-C1).
3. **#5 Error prevention (High):** Destructive structure-regen wipes creatives (F-1.2);
   abandon-wizard text link next to a Previous button (F-2.2); truncation silently drops items
   (F-CL2); `launch_config` clobber on launch (§9).
4. **#6 Recognition over recall (Med):** Double-click-only rename with no affordance (F-H4); no
   template-usage visibility (F-T2); budget lives in Step 2 but is needed mentally in Step 3
   (F-3.2).
5. **#7 Flexibility / efficiency (Med):** Forced template interstitial every first visit, no
   "always skip" (F-2.1).
6. **#1 again — dead controls (Med):** The `SlidersHorizontal` filter buttons in History and
   Templates do nothing (F-H1, F-T1).

---

## 12. Friction inventory (ranked)

| ID | Sev | Friction | Surface / File |
|---|---|---|---|
| F-R1 | **High** | `launch-execute` is a simulation; UI says "Launch successful" — no real Meta call, no partial-success | `LaunchPreviewModal.tsx:74`, `LaunchConfirmDialog.tsx:16,134`, `StepReview.tsx:52` |
| F-C2 | **High** | Catalogue "Launch N Ads" only fires a toast — never executes | `CatalogueAdsFlow.tsx:262` |
| F-CL5 | **High** | Fast Launch writes `status:'launched'` with no execution + creates empty ad rows | `FastLaunchModal.tsx:88-155` (and `FastLaunchDrawer`) |
| F-CL1 | **High** | Three colliding meanings of "strategy/distribution" (ad→page vs item→adset vs AutoPilot profile) | `launch-distribution.ts:16-23`, `AdgroupLaunchModal.tsx:204`, `AutoPilotLaunch.tsx:17` |
| F-3.1 | **High** | Two launch paths on one screen (Proceed→PreviewModal vs StrategyBar→DistributionPreview→Confirm) | `StepCreatives.tsx:167-311` |
| F-1.2 | **High** | Destructive hierarchy regen deletes all campaigns/adsets/ads incl. creatives | `StepAccountSetup.tsx:284-308` |
| F-1.1 | **High** | Step 1 overloaded; distribution tuned against fake estimated counts pre-ads | `StepAccountSetup.tsx:374-416` |
| F-RR1 | **High** | RRM silently blends dummy data into real on spend-triggering surface | `RRM.tsx:88-97` |
| F-RR2 | **High** | "Seed Demo Data" writes production rows from an ungated UI button | `RRM.tsx:146-454` |
| F-A1 | **High** | AutoPilot is fully mock/in-memory; refresh wipes all config | `AutoPilotLaunch.tsx:17-139` |
| Perm | **High** | No permission gating anywhere except RRM `isAdmin` | module-wide; only `RRM.tsx:59,105` |
| Cfg | **High** | `launch_config` is an everything-blob; review modals replace (clobber) it | `LaunchPreviewModal.tsx:65`, `StepReview.tsx:42` vs `StepAccountSetup.tsx:266` |
| F-H1/F-T1 | **High** | Dead `SlidersHorizontal` filter buttons (no onClick) | `LaunchHistory.tsx:96`, `TargetingTemplates.tsx:164` |
| F-H2 | **High** | Three create CTAs incl. the fake "Launch 2.0 (Beta)" toast | `LaunchHistory.tsx:96-99` |
| IA-1 | **Med** | Nav promises "Clones filter in History" — filter doesn't exist; `/launch/clones` is a stub | `modules.ts:124`, `LaunchHistory.tsx`, `App.tsx:143` |
| F-C1 | **Med** | Catalogue is a structurally different UI from the wizard for the same job, silent fork | `LaunchFlow.tsx:20-63`, `CatalogueAdsFlow.tsx` |
| F-3.3 | **Med** | Multi-account scheduling defaults every ad to the first account's timezone | `StepCreatives.tsx:69-72,112-121` |
| F-2.2 | **Med** | Abandon-wizard text link sits beside "Previous" — easy accidental work-loss | `StepTargeting.tsx:315-321` |
| F-2.1 | **Med** | Forced template-select interstitial on every first Step-2 visit, no "always skip" | `StepTargeting.tsx:74` |
| F-1.5 | **Med** | Per-account strategy data exists but UI uses only the first account's globally | `StepAccountSetup.tsx:223-226` |
| F-CL2 | **Med** | Truncation silently drops creative items unless user opens Advanced Mapping | `AdgroupLaunchModal.tsx:322-336` |
| F-CL3 | **Med** | CL "Launch" only creates a draft — over-promising CTA | `AdgroupLaunchModal.tsx:361` |
| F-CL6 | **Med** | Bulk multi-table inserts with no transaction → orphan rows on partial failure | `FastLaunchModal.tsx:62-165` |
| F-R2 | **Med** | Review error list capped at 10, plain strings, not jump-to-fix | `LaunchPreviewModal.tsx:213-221` |
| F-H3 | **Med** | History status column has no header label; headers misaligned to cells | `LaunchHistoryTable.tsx:73-150` |
| F-H5 | **Med** | Detail drawer is shallow read-only; failed launches give nothing actionable | `LaunchDetailDrawer.tsx` |
| F-C3/F-1.4 | **Med** | Bulk-edit toolbars stubbed ("coming soon") on Catalogue + Step 1 | `CatalogueAdsFlow.tsx:211`, `StepAccountSetup.tsx:362` |
| F-C4 | **Med** | Catalogue preview uses dummy defaults + hardcoded page names | `CatalogueAdsFlow.tsx:226-228` |
| F-T2 | **Med** | No template-usage/linkage visibility | `TargetingTemplates.tsx` |
| F-RR3 | **Med** | "Run Dilution" enabled state not visibly tied to admin role | `RRM.tsx:105` |
| Err | **Med** | History/Templates query errors render as false "zero-data" states | `LaunchHistory.tsx:104`, `TargetingTemplates.tsx:183` |
| Scale | **Med** | No virtualization/pagination in History or Step-3 ads (1000+ rows) | `LaunchHistory.tsx`, `AdsTableTab.tsx:201` |
| Dead | **Med** | Orphaned dup code: `StepReview.tsx`, `FastLaunchModal.tsx`, `Launch.tsx` | those files |
| F-R3/Cur | **Low** | Hardcoded `$` in review/history ignores per-account currency | `LaunchPreviewModal.tsx:55`, `StepReview.tsx:86` |
| F-H4 | **Low** | Double-click-only rename, no affordance | `LaunchHistoryTable.tsx:111-117` |
| F-T3 | **Low** | Platform hardcoded "Facebook" across templates/history | `TargetingTemplates.tsx:189` |
| F-CL4 | **Low** | Unexplained hardcoded structure caps (10/10/50) | `AdgroupLaunchModal.tsx:174-198` |
| Types | **Low** | `(supabase as any)` casts → no compile safety on launch writes | module-wide |

---

## 13. Headline carry-over vs break (for synthesis)

**Carry into 2.0:**
- The `MissingFieldsSummary` + scroll-to-anchor validation pattern (`lib/launch-validation.ts`)
  — the best UX in the module; generalize it to Catalogue + review.
- The distribution **core** (`lib/launch-distribution.ts`) — careful, currency- and
  capacity-aware, well-documented; keep the engine, fix the surfaces around it.
- The Catalogue **tree → config → live-preview** 3-column IA — a strong basis for a unified
  bulk editor.
- History-as-hub, relaunch-to-draft, plan-gated upsell takeovers.
- RRM's real edge-function integration + guardrail model.
- FolderLaunchModal's Fast-vs-Advanced progressive fork.

**Break / redesign:**
- The fake "Launch 2.0 (Beta)" CTA (greenfield — repoint to the real flow).
- The simulated `launch-execute` honesty gap (the #1 thing to make real).
- The three-way "strategy/distribution" naming collision — pick one vocabulary.
- The silent Standard-vs-Catalogue fork — unify or deliberately, visibly bifurcate.
- Dual launch paths + dual review implementations on Step 3 (collapse to one).
- Step-1 overload + estimate-based distribution + destructive regen.
- `launch_config`-as-everything blob + clobbering writers (needs a real schema).
- Module-wide permission gating + honest empty/error states.
- AutoPilot persistence (it's a mock); RRM seed button + dummy-blend.
- Dead controls (filter buttons) and dead code (StepReview / FastLaunchModal / Launch.tsx).
