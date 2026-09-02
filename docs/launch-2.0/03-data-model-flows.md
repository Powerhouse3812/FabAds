# Launch 2.0 — Stream 03: Data Model, Flows & Stress @ 10×

> Research-only. The **data foundation** for the redesign: the full Launch entity
> model, lifecycle/status semantics, budget + targeting shapes, the distribution
> engine (`src/lib/launch-distribution.ts`) spelled out precisely, the wizard
> gating rules, the DB schema, and a ranked analysis of what **breaks at 10×
> scale**. Primary engine: codebase. Cited `file:line` throughout.
>
> Companion to Stream 01 (V1 teardown) and Stream 02 (competitive). Where 01
> catalogues *surfaces & friction*, this stream pins the *data constraints* the
> 2.0 redesign must respect.

---

## Overview

A launch is one canonical artifact — a `launches` row — with a strict 4-level
child hierarchy (`launch_ad_accounts`, `launch_campaigns` → `launch_adsets` →
`launch_ads`) plus an optional `targeting_templates` reference. Almost all soft
state (wizard distribution config, per-ad schedules, catalogue UI state, expand
state) is crammed into one untyped `launch_config jsonb` blob on the parent row.

Three orthogonal "strategy" concepts coexist and must not be conflated:

1. **Hierarchy strategy** — `{campaigns, adsets, ads}` integers that generate the
   skeleton (how many rows to create). Lives in `StepAccountSetup`/`useCreateLaunch`.
2. **Distribution strategy** (`LaunchStrategy = fill_first | equal | duplicate`) —
   how a *fixed* set of selected ads spreads across (ad_account → page) target
   pairs. Lives in `src/lib/launch-distribution.ts`, persisted in
   `launch_config.distribution`.
3. **Round-robin item→adset rotation** — a separate axis in
   `use-adgroup-launch.ts` (out of scope here; noted by the lib header at
   `src/lib/launch-distribution.ts:16-23`).

The launch *execution* itself is a simulated stub: `LaunchConfirmDialog` and
`LaunchPreviewModal` both call `supabase.functions.invoke("launch-execute", { body: { launch_id } })`
(`src/components/launch/LaunchConfirmDialog.tsx:134-137`). The Facebook Page
capacity that the entire distribution engine validates against is **mock-derived
from a hash**, not read from the real `fb_pages` table
(`src/components/launch/distribution/mock-page-capacity.ts:27-41`,
wired in `src/hooks/use-launch-distribution.ts:83`).

The dominant data risk at scale: **everything loads and renders unbounded**.
There is no pagination on the launch list, `useLaunchFull` pulls the entire
hierarchy in one shot, no table virtualizes, and writes are per-row loops.

---

## 1. Entity model

### 1.1 Hierarchy diagram

```
workspaces (1)
   │
   └── launches (N)                         ← the canonical artifact; launch_config jsonb
         │   id, workspace_id, name, status, platform, completed_step,
         │   targeting_template_id?, launch_config (JSON), + distribution summary cols
         │
         ├── launch_ad_accounts (N)         ← which FB ad accounts this launch targets
         │       fb_ad_account_id → fb_ad_accounts.id
         │       setup_config (JSON: website_url, page, catalogue_ads_defaults, …)
         │       ⚠ NO link from accounts → campaigns/adsets/ads (see §1.7)
         │
         └── launch_campaigns (N)           sort_order, status, objective, budget_*…
               │
               └── launch_adsets (N)        sort_order, status, targeting(JSON),
                     │                        placements(JSON), budget_*, bid_*, schedule_*
                     │
                     └── launch_ads (N)     sort_order, status, creative fields,
                                              media_urls[], + distribution provenance cols

targeting_templates (N per workspace)       template_payload (JSON)
   └── referenced by launches.targeting_template_id (nullable, ON DELETE SET NULL)

fb_pages (N)                                ← capacity registry (250-cap source of truth,
                                                but UNUSED by the live code — see §4.7)
```

All child tables cascade-delete from both `launches` and `workspaces`
(`ON DELETE CASCADE`), and every table carries a redundant `workspace_id` for RLS
(`supabase/migrations/20260210114932_…:9,31,46,71,99`).

### 1.2 `Launch` / `LaunchFull` (parent row)

Source: `src/hooks/use-launch.ts:7-32`, `src/hooks/use-launch-data.ts:68-84`, schema
`supabase/migrations/20260210114932_…:7-17` + later ALTERs.

| Field | Type | Req? | Notes |
|---|---|---|---|
| `id` | uuid | PK | `gen_random_uuid()` |
| `workspace_id` | uuid | yes | FK → workspaces, cascade |
| `name` | text | yes | free text (no length cap) |
| `status` | text | yes | default `'draft'`; lifecycle in §2.1 |
| `platform` | text | yes | default `'facebook'` |
| `launch_config` | jsonb | — | default `{}`; **untyped catch-all** (see §1.6) |
| `completed_step` | int | yes | default `0`; wizard gate (added `20260212100905_…`) |
| `targeting_template_id` | uuid | no | FK → targeting_templates, `ON DELETE SET NULL` (`20260213083049_…:34-35`) |
| `created_by` | uuid | yes | profile id |
| `last_modified_by` | uuid | no | profile id (TS-only field) |
| `created_at`/`updated_at` | timestamptz | yes | `updated_at` via trigger `20260210114932_…:129-131` |
| **Distribution summary cols** (added `20260603120000_…:18-30`) | | | all default 0/1, optional in TS |
| `launch_batch_id` | uuid | no | groups ads created in one distribution run; indexed |
| `launch_strategy` | text | no | CHECK in (`fill_first`,`equal`,`duplicate`) |
| `selected_ads_count` | int | yes | default 0 |
| `created_ads_count` | int | yes | default 0 |
| `active_count` | int | yes | default 0 |
| `scheduled_count` | int | yes | default 0 (added `20260604120000_…:22-23`) |
| `paused_count` | int | yes | default 0 |
| `target_pairs_count` | int | yes | default 0 |
| `unique_pages_count` | int | yes | default 0 |
| `budget_before`/`budget_after` | numeric | no | |
| `budget_multiplier` | numeric | yes | default 1 |

`LaunchWithCounts` (`use-launch.ts:34-40`) adds derived `campaign_count`,
`adset_count`, `ad_count`, and resolved `created_by_email` / `last_modified_by_email`.
`LaunchFull` (`use-launch-data.ts:68-84`) is the parent row + arrays of all four
children.

> **Note**: the TS `Launch` interface comments the distribution cols as "may be
> absent until the migration is applied" (`use-launch.ts:18-19`), and **both
> distribution migrations carry `DO NOT AUTO-APPLY`** headers
> (`20260603120000_…:1-3`, `20260604120000_…:1-3`). So in any non-manually-migrated
> environment these columns + `fb_pages` + `scheduled_at`/`ad_timezone` may not
> exist — a real data-integrity hazard the redesign must resolve.

### 1.3 `LaunchAdAccount`

Source: `use-launch-data.ts:60-66`, schema `20260210114932_…:27-33`.

| Field | Type | Req? | Notes |
|---|---|---|---|
| `id` | uuid | PK | |
| `launch_id` | uuid | yes | FK → launches, cascade |
| `fb_ad_account_id` | uuid | yes | FK → `fb_ad_accounts`, cascade |
| `workspace_id` | uuid | yes | |
| `setup_config` | jsonb | — | default `{}`. Holds `website_url`, `page` (legacy single-page id, e.g. `"page-1"`), `display_link`, `catalogue_ads_defaults {primary_text, headline, description, cta, catalogue_id, product_set_id}`. Read at `CatalogueAdsFlow.tsx:226-239`, `StepAccountSetup.tsx:158`. |

### 1.4 `LaunchCampaign`

Source: `use-launch-data.ts:5-20`, schema `20260210114932_…:43-57`.

| Field | Type | Req? | Notes |
|---|---|---|---|
| `id` | uuid | PK | |
| `launch_id` | uuid | yes | FK, cascade |
| `workspace_id` | uuid | yes | |
| `name` | text | yes | default `'Campaign 1'` |
| `objective` | text | no | UI enum: Conversions/Traffic/Awareness/Engagement/Leads/App Installs (`TargetingFormFields.tsx:16`). **Required** at validation (`launch-validation.ts:48`). |
| `budget_type` | text | no | CBO/ABO. ⚠ **casing collision**: form writes `"CBO"`/`"ABO"` (`TargetingFormFields.tsx:123`), table writes `"cbo"`/`"abo"` (`CampaignsTableTab.tsx:132-133`), validation accepts both (`launch-validation.ts:50`). |
| `budget_period` | text | no | `daily`/`lifetime` (`TargetingFormFields.tsx:137-138`) |
| `budget_value` | numeric | no | required when CBO (`launch-validation.ts:51`) |
| `bid_strategy` | text | no | Lowest Cost/Cost Cap/Bid Cap/Target Cost (`:17`) |
| `delivery_type` | text | no | Standard/Accelerated (`:18`) |
| `special_ad_category` | text[] | no | default `'{}'`; Credit/Employment/Housing/Social Issues (`:19`). Note table filters out a sentinel `"NONE"` value (`CampaignsTableTab.tsx:137`). |
| `sort_order` | int | yes | default 0 |
| `status` | text | yes | default `'active'` |
| `catalogue_ads_override` | jsonb | no | default NULL (added `20260227065656_…`) |

### 1.5 `LaunchAdset`

Source: `use-launch-data.ts:22-40`, schema `20260210114932_…:67-85`.

| Field | Type | Req? | Notes |
|---|---|---|---|
| `id` | uuid | PK | |
| `launch_id` | uuid | yes | FK, cascade |
| `campaign_id` | uuid | yes | FK → launch_campaigns, cascade |
| `workspace_id` | uuid | yes | |
| `name` | text | yes | default `'Adset 1'` |
| `schedule_start`/`schedule_end` | timestamptz | no | required when `targeting.scheduling_enabled` (`launch-validation.ts:60-62`) |
| `targeting` | jsonb | — | default `{}`. Structure in §3.3. |
| `placements` | jsonb | — | default `{"type":"automatic"}`. `{mode: automatic\|manual, selected: string[]}` (`TargetingFormFields.tsx:307-326`). |
| `performance_goal` | text | no | Maximize Conversions/Link Clicks/… (`:20`) |
| `budget_value` | numeric | no | required when ABO (`launch-validation.ts:69`) |
| `budget_period` | text | no | daily/lifetime |
| `bid_strategy` | text | no | |
| `bid_amount` | numeric | no | |
| `delivery_type` | text | no | |
| `sort_order` | int | yes | default 0 |
| `status` | text | yes | default `'active'` |

> ⚠ **Adsets carry NO currency and NO ad-account FK.** This is load-bearing for
> budget math and rollups — see §1.7 and §3.1.

### 1.6 `LaunchAd`

Source: `use-launch-data.ts:42-58`, schema `20260210114932_…:95-111`, provenance
cols `20260603120000_…:36-45`, schedule cols `20260604120000_…:26-28`.

| Field | Type | Req? | Notes |
|---|---|---|---|
| `id` | uuid | PK | |
| `launch_id` | uuid | yes | FK, cascade |
| `adset_id` | uuid | yes | FK → launch_adsets, cascade |
| `workspace_id` | uuid | yes | |
| `name` | text | yes | default `'Ad 1'` |
| `primary_text`/`headline`/`description` | text | no | creative copy (validated in Step 3) |
| `cta` | text | no | Book Now/Learn More/… (`AdsTableTab.tsx:23`) |
| `destination_url`/`display_link` | text | no | |
| `media_urls` | text[] | no | default `'{}'`; first element is the thumbnail (`AdsTableTab.tsx:218-219`) |
| `media_type` | text | no | `image`/`video`/`carousel` (`AdsTableTab.tsx:86`) |
| `sort_order` | int | yes | default 0 |
| `status` | text | yes | default `'active'`; **`active`/`scheduled`/`paused`** only (§2.3) |
| **Provenance cols** (post-distribution-run, `DO NOT AUTO-APPLY`) | | | |
| `source_ad_id` | uuid | no | which selected ad this created-ad came from; indexed |
| `created_ad_id` | text | no | the FB ad id once created |
| `copy_group_id` | uuid | no | groups duplicate copies; indexed |
| `target_pair_id` | text | no | which (account,page) pair |
| `destination_fb_page_id` | text | no | FB Page identity; guarded FK to `fb_pages.fb_page_id` (only wired if a unique constraint exists — `20260603120000_…:100-127`) |
| `destination_ad_account_id` | uuid | no | |
| `budget_before`/`budget_after`/`budget_multiplier` | numeric | no/no/yes(=1) | |
| `scheduled_at` | timestamptz | no | absolute go-live instant |
| `ad_timezone` | text | no | IANA tz the schedule was picked in |

### 1.7 The missing FK that shapes everything

`launch_campaigns`, `launch_adsets`, `launch_ads` have **no `ad_account_id`**. Ad
accounts link to the *launch*, not to individual campaigns/ads
(`src/lib/launch-selection-rollup.ts:15-23`). Two hard consequences the redesign
must address:

1. **Account-level selections can't be distributed.** `rollupSelection` contributes
   *nothing* from an account selection and sets `accountConstrained: true` rather
   than silently rolling up to the whole launch
   (`launch-selection-rollup.ts:130,151`).
2. **Currency is resolved at launch level, not adset level.** Since adsets have no
   currency and no account, budget math borrows the *first* ad account's currency
   and applies it to every adset (`use-launch-distribution.ts:103-111`,
   `distribution-view-helpers.ts:37-43`). A genuinely multi-currency launch is
   mis-summed.

---

## 2. Lifecycle & status

### 2.1 Launch status

`launches.status` defaults to `'draft'` (`20260210114932_…:11`). Only `'draft'` is
asserted in this repo's TS (set on create at `use-launch.ts:121`, on relaunch at
`:251`, on catalogue create). `LaunchHistoryTable` and `useDeleteLaunch` gate
destructive actions on drafts. Other statuses (launching/completed/failed) are
implied by the `launch-execute` stub but not enumerated in code — a gap for 2.0.

### 2.2 `completed_step` (wizard gate)

`completed_step int NOT NULL DEFAULT 0` (`20260212100905_…`). Semantics:

- **0** — nothing saved; only Step 1 is reachable.
- **1** — Step 1 (account setup + distribution config) saved
  (`StepAccountSetup.tsx:311,329`).
- **2** — Step 2 (targeting) saved.
- **3** — Step 3 (creatives) validated/saved (`StepCreatives.tsx:150`); also the
  value a **relaunch/clone** lands on so the copy opens straight to Review
  (`use-launch.ts:233,250`).

**Resume**: on opening an existing launch the wizard resumes at
`min(completed_step + 1, 3)` (`LaunchFlow.tsx:31`).

**Gating** (`LaunchFlow.tsx:36-41`, `LaunchStepper.tsx:23`): you may click step 1
always, any completed step, or exactly the next step (`completed_step + 1`).
Jumping further forward, or jumping ahead while the current step has unsaved work
(`currentStep > completedStep`), is blocked with a toast. Locked steps render a
lock icon.

### 2.3 Per-entity status (`active` / `scheduled` / `paused`)

Campaigns/adsets/ads each have `status text DEFAULT 'active'`. For **ads**, the
canonical vocabulary is exactly three values (`src/lib/ad-status.ts:9-11`):
`active`, `scheduled`, `paused`. `toAdStatus()` normalizes any unknown string to
`paused` for *display* (`ad-status.ts:32-34`), but the **distribution engine treats
unknown strings as a 4th bucket and excludes them** (`launch-distribution.ts:112-125`)
— a subtle divergence (a row shown as "Paused" in the table may be silently
dropped from a launch).

Slot semantics (the crux of the 250-cap, §4):
- `active` **and** `scheduled` both **consume** a Page slot (a scheduled ad will go
  live) — `slotConsuming()` = active + scheduled (`launch-distribution.ts:132-139`).
- `paused` is **free** — never consumes a slot.
- `unknown` → excluded from launch entirely.

### 2.4 `sort_order`

Every child carries `sort_order int NOT NULL DEFAULT 0`, assigned sequentially on
generation (`use-launch.ts:149,163,178` etc.) and read back via
`.order("sort_order")` in `useLaunchFull` (`use-launch-data.ts:96-98`). Duplicates
insert at `src.sort_order + 1` **without re-packing siblings**
(`use-launch-mutations.ts:79,151,210`), so heavy cloning produces collisions and
non-deterministic ordering at scale.

### 2.5 Resume / relaunch / clone

`useRelaunchDraft` (`use-launch.ts:216-306`) deep-clones a launch: parent → ad
accounts → campaigns → adsets → ads, **one INSERT per row in nested loops**
(`:278-298`). It resets `launch_config.ui_state.catalogue_ads` to avoid stale
entity-id references (`:236-242`). This clone path is an N+1 write bomb at scale
(§5, risk D2).

---

## 3. Budget & targeting model

### 3.1 Budget: campaign vs adset (CBO vs ABO)

- **CBO** (campaign budget optimization) — budget lives on the **campaign**
  (`budget_type/period/value` on `launch_campaigns`); the adset budget block is
  hidden (`TargetingFormFields.tsx:130-152, 405`). Validation requires
  `campaign.budget_value > 0` (`launch-validation.ts:50-53`).
- **ABO** (adset budget optimization) — budget lives on each **adset**
  (`budget_value/period`, plus `bid_strategy`, `bid_amount`, `delivery_type` —
  `TargetingFormFields.tsx:405-447`). Validation requires each
  `adset.budget_value > 0` (`launch-validation.ts:69-70`).
- `budget_period` ∈ {`daily`, `lifetime`}; `bid_strategy` ∈ {Lowest Cost, Cost
  Cap, Bid Cap, Target Cost}; `delivery_type` ∈ {Standard, Accelerated}.

**Distribution budget total** (`budgetByCurrency`, `launch-distribution.ts:581-626`):
sums **distinct parent-adset** `budget_value` per currency (an ad's parent adset is
counted once even if many selected ads share it). Adsets with null/≤0 budget land
in `unavailableAdsets` and are excluded from the base. `final = base × multiplier`
where `multiplier = (strategy === "duplicate" ? targetPairsCount : 1)`. Never sums
across currencies. **Because adsets carry no currency**, all adsets get the launch's
single resolved currency (§1.7) — so CBO budgets (which live on the *campaign*, not
the adset) are entirely invisible to this total. This is a correctness gap for 2.0.

### 3.2 Bid strategies

Campaign-level `bid_strategy` + adset-level `bid_strategy`/`bid_amount` are free
text columns populated from the enum lists above. No cross-level coherence check
exists.

### 3.3 Targeting payload (`launch_adsets.targeting` JSON)

Written field-by-field by `TargetingFormFields` via `updateTargeting(key, value)`
(`:80-82`). Observed keys:

```jsonc
{
  "locations": ["United States", …],         // include; required (validation :64-67)
  "exclude_locations": [...],
  "gender": "All" | "Male" | "Female",
  "age_min": 18, "age_max": 65,               // slider 13–65, "65+" cap (:262-278)
  "interests": [...], "languages": [...],
  "scheduling_enabled": true,                 // gates schedule_start requirement
  // bulk-update also recognises (use-launch-mutations.ts:283-284):
  // location_type, include_locations, limit_to_people_in_location,
  // device_platforms, network_connections, custom_audiences,
  // geo_locations.countries (read by CampaignsTableTab :66 for the Countries col)
}
```

⚠ **Schema drift**: the form writes `targeting.locations`, but
`CampaignsTableTab` reads `targeting.geo_locations.countries`
(`CampaignsTableTab.tsx:66`) — two different shapes for "where", so the Countries
column is usually empty for wizard-built launches. The bulk-update merger
(`use-launch-mutations.ts:283`) recognises yet another set of keys
(`include_locations`, `device_platforms`, …). There is **no canonical targeting
schema** — a core problem for 2.0.

Adset-level (non-`targeting`-JSON) fields also set by the form: `performance_goal`,
`conversion_location`, `devices[]`, `os[]`, `flexible_creative`,
`advantage_plus_creative`, `beneficiary`, `payor` — some of these aren't DB columns
and ride in the JSON / are UI-only.

### 3.4 Targeting templates

`targeting_templates` (`20260213083049_…:3-12`): `id`, `workspace_id`, `name`,
`platform` (default `facebook`), `template_payload jsonb`, `created_by`, timestamps.
A launch references one via `launches.targeting_template_id` (nullable, `ON DELETE
SET NULL`). The wizard accepts a `templateId` URL param threaded into Step 2
(`LaunchFlow.tsx:19,76`). The template **payload shape is entirely free-form** (no
schema, no validation), and applying a template is a client-side merge into the
adset `targeting` JSON. At scale, applying one template across thousands of adsets
is an unbounded per-row write (no bulk path that sets template across all adsets in
one statement).

---

## 4. Distribution rules — `src/lib/launch-distribution.ts` (precise)

Pure module (no React/Supabase). Operates on `(ad_account → page)` **TargetPairs**.

### 4.1 Core types

- `TargetPair` (`:29-35`): `{ad_account_id, account_name, page_id (internal
  account→page link id), fb_page_id (FB Page identity), page_name}`.
- `DistAd` (`:38-42`): `{id, status, adset_id}`.
- `DistAdset` (`:44-48`): `{id, budget_value, currency}`.
- `StatusSplit` (`:50-55`): `{active[], scheduled[], paused[], unknown[]}`.
- `PageCapacity` (`:57-60`): `{fb_page_id, currentActive}` → `available = 250 −
  currentActive`.
- `PerPairAllocation` (`:62-73`): `{pair, activeToLaunch (= active+scheduled placed),
  scheduledToLaunch, pausedToAdd, status: ok|partial|full}`.

### 4.2 The 250-cap, spelled out

```
MAX_ADS_PER_PAGE = 250                                    (:27)

Capacity is keyed on fb_page_id (the FB Page identity), NOT on the (account,page)
link. The SAME fb_page_id linked under two accounts is ONE shared 250-slot bucket
across both pairs — never two.                            (:1-8, :172-192)

availableFor(page) = max(0, 250 − currentActive)          (:194-199)

Slot demand of a set of ads = active.length + scheduled.length   (paused = 0)   (:132-139)
```

`aggregateCapacityByPage` (`:172-192`) collapses duplicate `fb_page_id`s to one
bucket; a referenced page with no capacity row is treated as **empty** (0 active,
full 250 available) — so missing capacity data **over-promises** room.

### 4.3 Strategy algorithms

**`fillFirst`** (`:230-265`): walk pairs in target order; into each pair's page,
place `min(liveLeft, page.remaining)` slot-consuming ads, decrement the shared
page bucket, overflow to the next pair. Paused ride along, spread evenly across all
pairs (`distributePausedAlong`, `:268-276`). Per-pair status: `full` (wanted slots
but bucket was 0), `partial` (placed some, bucket ran out mid-fill), `ok` (placed
all / nothing to place).

**`equalDistribute`** (`:288-325`): split **TOTAL** ads (active+scheduled+paused)
as evenly as possible across `n` pairs — `base = floor(total/n)`, the `extra =
total % n` remainder goes to the **earliest** pairs. Within each pair's quota,
slot-consuming ads fill first, paused take the remainder. **Not capacity-aware
during placement** — capacity is checked separately in validation.

**`duplicateToEach`** (`:334-349`): every pair gets **ALL** slot-consuming ads +
ALL paused. A unique page in `N` pairs therefore needs `(active+scheduled) × N`
slots on its one shared bucket. **This is the 10× explosion vector** (§5, risk A1).

`distribute()` (`:353-371`) dispatches by strategy with an exhaustive `never` check.

### 4.4 Output count

`computeOutputCount` (`:561-568`):
- `fill_first` / `equal` → `selectedAdCount` (same ads spread across pairs).
- `duplicate` → `selectedAdCount × targetPairsCount` (copied into each pair).

`selectedAdCount` = ALL selected ads (active+scheduled+paused), status-agnostic.

### 4.5 Validation (`validateStrategy`, `:389-473`)

Returns `{available, reason?, perPair, perPageDemand, excludedUnknown}`. Logic:

| Condition | Result |
|---|---|
| 0 target pairs | `available: false`, "Select at least one Page" (`:397-405`) |
| 0 slot-consuming ads (only paused) | `available: true` regardless of capacity (`:443-445`) |
| any page over capacity (equal/duplicate) | `available: false`, names the page(s) (`:450-451`, `capacityReason :476-483`) |
| `fill_first` | global Σ-available across unique pages ≥ live count; if not, names the full page(s) (`:453-467`) |

Per-page demand (`computeLiveDemandPerPage`, `:514-551`) is computed **before**
capacity clamping for equal/duplicate (so over-capacity is detectable), and
post-fill for `fill_first` (whose binding constraint is the global sum, never a
single page). `fill_first` never flags per-page "over" by construction (`:428`).

`scheduledToLaunch` is apportioned deterministically so the scheduled column
reconciles back to the exact total across pairs (`makeScheduledApportioner`,
`:148-162`).

### 4.6 Where the engine is consumed (and re-run)

- **Step 1** `StepAccountSetup`: runs `splitByStatus`, then per render calls
  `distribute` once (`:414`) **plus `validateStrategy` once per strategy card ×3**
  (`:553`) **plus `budgetByCurrency`** (`:416,556`) — all driven off a *live
  estimate* of ads (`structureAdCount = campaigns × adsets × ads`,
  `:382-393`) so the preview reacts in real time. That estimate array is
  materialised in memory (`Array.from({length: structureAdCount})`, `:389`).
- **Step 3** `StepCreatives`: `rollupSelection` (memoised, `:80-88`) →
  `LaunchStrategyBar` / `LaunchDistributionPreview` (`validateStrategy` +
  `computeOutputCount` per render, `LaunchDistributionPreview.tsx:85-86`) →
  `LaunchConfirmDialog` (validates on open **and again** immediately before
  execute, `LaunchConfirmDialog.tsx:85,101`).

### 4.7 ⚠ Capacities are mock, not real

`useLaunchDistribution` resolves capacities via
`getMockCapacities(targetPairs)` (`use-launch-distribution.ts:83`), which seeds
`currentActive` from a **FNV-1a hash** of `fb_page_id` into healthy/near-full/full
bands (`mock-page-capacity.ts:27-41`). Target pairs themselves come from a **mock
page directory** that gives every account exactly 3 pages — Main, Promo, and a
shared "House Brand" page (`mock-pages.ts:47-68`). The real `fb_pages` table
(`20260603120000_…:59-67`, with `active_ad_count`) exists but is **never queried**.
So today the entire 250-cap UX validates against fiction. **2.0 must wire real
page capacity** before the cap is trustworthy.

---

## 5. Wizard gating & flows (summary)

Standard 3-step wizard (`LaunchFlow.tsx`, steps in `LaunchStepper.tsx:4-8`):

1. **Ad Account & Setup** — name, accounts, per-account `setup_config`, hierarchy
   strategy, distribution strategy + target pairs. Creating generates the full
   skeleton immediately (`useCreateLaunch`, §6).
2. **Targeting** — campaign/adset config via `TargetingFormFields`.
3. **Creatives & Config** — the 4-tab table surface (Accounts / Campaigns / Ad
   groups / Ads) + distribution bar/preview/confirm.

**Two alternate flows** branch off the same `LaunchFlow` shell:
- **Catalogue mode** (`?mode=catalogue` or `launch_config.mode === "catalogue"`,
  `LaunchFlow.tsx:20,25`) → a 3-column resizable editor (`CatalogueAdsFlow.tsx`)
  with hierarchy/config/preview panels and debounced autosave into
  `launch_config.ui_state.catalogue_ads`. Its "Launch" is a **toast only**
  (`CatalogueAdsFlow.tsx:262`) — no execute call.
- **Relaunch/clone** lands on Review (`completed_step: 3`).

**Validation gates**: `validateStep1` (name, ≥1 account, hierarchy ≥1 each,
per-account website_url — `launch-validation.ts:17-40`); `validateStep2`
(objective, CBO/ABO budget, ≥1 location, schedule_start when scheduling) ;
`validateStep3` (per-ad required-field check, surfaced as `ad-summary-<id>` errors
that drive the `MissingFieldsSummary` and scroll-to-error —
`StepCreatives.tsx:96-146`).

---

## 6. DB schema summary

Core launch tables (all created `20260210114932_…`; all RLS-enabled with the same
workspace policy shape — read = `is_workspace_member`, write =
`is_workspace_owner_or_admin`):

| Table | PK | Parent FK(s) | Cascade | Key cols |
|---|---|---|---|---|
| `launches` | id | workspace_id | from ws | status, completed_step, launch_config jsonb, targeting_template_id, distribution summary cols |
| `launch_ad_accounts` | id | launch_id, fb_ad_account_id, workspace_id | from launch+ws+account | setup_config jsonb |
| `launch_campaigns` | id | launch_id, workspace_id | from launch+ws | objective, budget_*, special_ad_category[], sort_order, status, catalogue_ads_override |
| `launch_adsets` | id | launch_id, campaign_id, workspace_id | from launch+campaign+ws | targeting/placements jsonb, budget_*, bid_*, schedule_*, sort_order, status |
| `launch_ads` | id | launch_id, adset_id, workspace_id | from launch+adset+ws | creative cols, media_urls[], media_type, sort_order, status, + provenance + schedule cols |
| `targeting_templates` | id | workspace_id | from ws | template_payload jsonb |
| `fb_pages` | id | workspace_id, fb_ad_account_id? | from ws | fb_page_id, active_ad_count, status — **unused by live code** |

Supporting tables referenced by the launch flow:
- `fb_ad_accounts` — the real account registry (`+ timezone` col, `20260604120000_…:31-32`).
- **Account-health** (`account_health_config`, `account_health_snapshots`,
  `account_health_events` — read by `use-account-health.ts`): drive the per-account
  health badge + "capacity remaining" hint in Step 1
  (`StepAccountSetup.tsx:17,497-500`). `getCapacityHint` uses a *rejection-ratio*
  threshold, **unrelated** to the 250-cap — two different "capacity" concepts on the
  same screen.
- **RRM** (`rrm_global_links`, `rrm_account_links`, `rrm_global_settings`,
  `rrm_account_settings` — `20260216073213_…`): reject-rate-management /
  dilution / replacement automation, with a DB-side threshold-validation trigger
  (`:84-109`). Adjacent to Launch (auto-launch stubs) but not part of the wizard
  data path.

Storage: a public `launch-media` bucket (`20260210114932_…:134-139`).

`launch_config` jsonb keys observed across the codebase (the untyped catch-all):
`mode`, `distribution {version, strategy, target_pairs[], overflowAsPaused,
backendSupportsOverflow}`, `distribution_run {…}` (written at confirm,
`LaunchConfirmDialog.tsx:120-131`), `adSchedules {<adId>: entry}`
(`use-launch-mutations.ts:241-268`), `expandState`, `ui_state.catalogue_ads
{expanded, selected_entity}`.

---

## 7. Stress @ 10× — what breaks (ranked)

Scenario set: a launch with **10K ads** (e.g. 100 campaigns × 10 adsets × 10 ads),
**100 brands/ad accounts**, large `(account × page)` target matrices, and
duplicate-strategy multiplication. Severity: **S1 = breaks/unusable**, **S2 =
severe degradation**, **S3 = noticeable**.

| # | Risk | Where in code | Severity |
|---|---|---|---|
| **A1** | **Duplicate-strategy output explosion.** `output = selectedAdCount × targetPairsCount`. 10K ads × even 50 pairs = **500K** created ads in one run, fanned through the per-row execute path. No ceiling, no warning beyond a generic amber note. | `launch-distribution.ts:566`; warning only `LaunchConfirmDialog.tsx:203-209` | **S1** |
| **A2** | **`useLaunchFull` loads the entire hierarchy unbounded.** 5 parallel `select("*")` with no `limit`/pagination; 10K-ad launch ships ~10K ad rows (with `primary_text`/`media_urls[]`) + 1K adsets + 100 campaigns to the client in one query, held entirely in memory and re-fetched on **every** mutation via `invalidateQueries(["launch-full"])`. | `use-launch-data.ts:92-99`; invalidation `use-launch-mutations.ts:8-11` | **S1** |
| **A3** | **No table virtualization anywhere.** `AdsTableTab` renders `filteredAds.map(...)` straight into a `<Table>` — 10K live DOM rows, each with multiple inputs/`TextCarousel`/dropdowns. `CampaignsTableTab` and `AdGroupsTableTab` do the same. Confirmed: no `react-window`/`react-virtual`/virtualization dependency exists in the app code. | `AdsTableTab.tsx:201-352`; `CampaignsTableTab.tsx:91-240`; `AdGroupsTableTab.tsx:56-60` | **S1** |
| **A4** | **`CampaignsTableTab` is O(C × A × Ad) per render.** For each campaign it `filter`s all adsets, then `filter`s all ads (`ads.filter(a => campAdsets.some(...))`); expanding an adset `filter`s all ads again. At 100/1K/10K that's tens of millions of comparisons on every state change (expand, rename, checkbox). | `CampaignsTableTab.tsx:92-93,180,217` | **S2** |
| **B1** | **Live distribution recompute on Step 1 = N strategies × full engine, every keystroke.** `StepAccountSetup` materialises an estimate array of `campaigns×adsets×ads` `DistAd`s and runs `validateStrategy` ×3 + `distribute` + `budgetByCurrency` on every render, driven by uncontrolled inputs. A 10K estimate × (1 distribute + 3 validations, each internally re-running `equalDistribute`/`fillFirst` via `computeLiveDemandPerPage`) recomputes synchronously on each change. | `StepAccountSetup.tsx:382-416,553`; `computeLiveDemandPerPage` re-runs allocators `launch-distribution.ts:530-549` | **S2** |
| **B2** | **Large `(account × page)` matrices grow target pairs unbounded.** 100 accounts × 3 mock pages = 300 pairs; with duplicate that's the A1 multiplier. The per-pair preview/confirm tables also render every pair as DOM rows with no windowing. | `mock-pages.ts:47-68`; `LaunchDistributionPreview.tsx:211-240`; `LaunchConfirmDialog.tsx:215-229` | **S2** |
| **C1** | **Launch list fetches ALL launches + 3 unbounded count queries + a profiles query.** `useLaunches` does `select("*")` on launches (no pagination), then 3 separate `.in("launch_id", launchIds)` over campaigns/adsets/ads (every child row in the workspace), then counts client-side. 100 brands × many launches × deep hierarchies = the whole workspace's launch data pulled to render one list. | `use-launch.ts:48-95` | **S1** |
| **D1** | **Writes are per-row loops (N+1), not batched.** Skeleton generation inserts one campaign → one adset → one ad-batch per iteration (`useCreateLaunch`), and regen does the same (`StepAccountSetup`). A 100×10×10 generation = 100 campaign inserts + 1K adset inserts (each `.select().single()` round-trips) before any ads. | `use-launch.ts:142-197`; `StepAccountSetup.tsx:293-308` | **S1** |
| **D2** | **Clone/relaunch is a nested N+1 deep copy.** `useRelaunchDraft` reads then re-inserts every campaign/adset/ad one row at a time. Cloning a 10K-ad launch = ~11K+ sequential round-trips client-side. Same shape in `useDuplicateCampaign`/`useDuplicateAdset`. | `use-launch.ts:276-298`; `use-launch-mutations.ts:72-98,144-163` | **S1** |
| **D3** | **`useBulkUpdateAdsets` fetches + writes per adset for targeting fields.** For any targeting key it loops ids, doing a `select("targeting")` then `update` **per adset** to merge JSON. "Apply to all" across 1K adsets = 2K sequential round-trips. | `use-launch-mutations.ts:300-311` | **S2** |
| **E1** | **`launch_config` jsonb is a single hot row updated wholesale.** Per-ad schedules (`adSchedules`), expand state, distribution, and catalogue UI state all read-modify-write the *entire* blob (`mergeAdSchedules` reads then overwrites). At 10K scheduled ads the schedule map alone is large, re-serialised on every per-ad save, and every write invalidates `launch-full` (→ A2 re-fetch). | `use-launch-mutations.ts:241-268`; bulk schedule `StepCreatives.tsx:114-121` | **S2** |
| **F1** | **`splitByStatus` over a 500K duplicate output / rollup is O(n) but synchronous + re-run.** `rollupSelection` rebuilds 3 Maps over all ads and adsets and re-splits status on every selection change; combined with no virtualization the selection interactions on the Ads tab stall. | `launch-selection-rollup.ts:85-149`; memo `StepCreatives.tsx:80-88` | **S3** |
| **G1** | **Capacity validation is fiction at scale (correctness, not perf).** Real `fb_pages.active_ad_count` is never read; capacities come from a hash. A 10× real launch could blow past 250 on a shared page while the UI shows "OK", or block a launch that actually has room. The shared-bucket case (one `fb_page_id` across many accounts) makes this worse. | `use-launch-distribution.ts:83`; `mock-page-capacity.ts:27-41`; unused `fb_pages` `20260603120000_…:59-67` | **S2** (correctness) |
| **G2** | **Multi-currency / CBO budgets mis-summed.** Adsets have no currency → one launch currency applied to all (mis-sums genuine multi-currency); CBO budgets live on the campaign and are excluded from `budgetByCurrency` entirely. At 100 accounts spanning currencies the "budget impact" number is wrong. | `use-launch-distribution.ts:103-111`; `budgetByCurrency` ignores campaign budget `launch-distribution.ts:601-613` | **S2** (correctness) |
| **H1** | **`sort_order` collisions on heavy duplication.** Duplicates insert at `src.sort_order + 1` without re-packing siblings, so after many clones ordering is non-unique/non-deterministic — table order and any future "ordered create" become unstable. | `use-launch-mutations.ts:79,151,210` | **S3** |
| **I1** | **Migration drift / `DO NOT AUTO-APPLY`.** The distribution + scheduled-status columns and `fb_pages` may not exist in a given env; TS reads them as optional/`as any`. At scale this means silent data loss (counts default 0, schedules with no column) rather than a hard failure. | `20260603120000_…:1-3`; `20260604120000_…:1-3`; `use-launch.ts:18-19` | **S2** (data integrity) |

### 7.1 The three things that must change first for 2.0

1. **Server-side execution + batched writes.** The per-row insert/clone/bulk loops
   (D1–D3) and the simulated `launch-execute` stub cannot survive 10×. Generation,
   cloning, and bulk edits need set-based SQL / an edge function, and the distribution
   *run* must produce ads server-side, not client-side fan-out (A1).
2. **Pagination + virtualization end-to-end.** Launch list (C1), `useLaunchFull`
   (A2), and all four Step-3 tables (A3/A4) must page/window. The current "load
   everything, render everything" model is the single biggest UX cliff.
3. **Real capacity + a canonical targeting/currency model.** Wire `fb_pages`
   (G1), give adsets a real currency/account linkage or fix the rollup (G2, §1.7),
   and define one targeting schema to end the `locations` vs `geo_locations`
   vs bulk-key drift (§3.3).

---

## 8. File reference index

| Concern | File(s) |
|---|---|
| Parent row types + create/relaunch | `src/hooks/use-launch.ts` |
| Child types + full loader | `src/hooks/use-launch-data.ts` |
| All mutations (CRUD, bulk, clone, step) | `src/hooks/use-launch-mutations.ts` |
| Distribution engine (pure) | `src/lib/launch-distribution.ts` |
| Distribution config resolver + currency | `src/hooks/use-launch-distribution.ts` |
| Selection rollup | `src/lib/launch-selection-rollup.ts` |
| Mock pages / mock capacity | `src/components/launch/distribution/mock-pages.ts`, `…/mock-page-capacity.ts` |
| Wizard shell + gating | `src/pages/LaunchFlow.tsx`, `src/components/launch/LaunchStepper.tsx` |
| Step 1 (setup + distribution) | `src/components/launch/StepAccountSetup.tsx` |
| Step 2 targeting fields | `src/components/launch/TargetingFormFields.tsx` |
| Step 3 (tabs + dist surfaces) | `src/components/launch/StepCreatives.tsx`, `AdsTableTab.tsx`, `CampaignsTableTab.tsx`, `AdGroupsTableTab.tsx`, `LaunchDistributionPreview.tsx`, `LaunchConfirmDialog.tsx` |
| Catalogue flow | `src/pages/CatalogueAdsFlow.tsx` |
| Validation | `src/lib/launch-validation.ts` |
| Ad status vocabulary | `src/lib/ad-status.ts` |
| Account health (Step 1 badge) | `src/hooks/use-account-health.ts` |
| Schema | `supabase/migrations/20260210114932_…` (core), `…20260212100905_…` (completed_step), `…20260213083049_…` (targeting_templates), `…20260227065656_…` (catalogue_ads_override), `…20260603120000_…` (distribution + fb_pages), `…20260604120000_…` (scheduled status), `…20260216073213_…` (RRM) |
