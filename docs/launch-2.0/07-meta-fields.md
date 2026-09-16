# Launch 2.0 — Stream 07: Meta Fields & Options Inventory + v1 Gap

> **Meta-only scope** (Facebook + Instagram, plus their Audience Network / Messenger
> surfaces). Goal: a complete inventory of Meta's ad-creation fields at
> **campaign / ad-set / ad** level, cross-referenced against what FabAds **v1
> actually supports**. Driver: 2.0 should cover the full Meta field set; the
> manager flagged that **custom audiences** (among others) were left out of v1.
> This doc verifies precisely what exists vs what is missing — with code citations.
>
> **Confidence convention:**
> - `[data-backed]` = the v1 "in v1?" column. Read directly from code, cited `file:line`.
> - `[directional]` = the Meta full-set columns. From Meta Marketing API knowledge +
>   2025/2026 web validation (sources at bottom). Meta's surface shifts often;
>   exact enum names should be re-checked against the live Graph API version at build time.

---

## TL;DR (headline findings)

1. **The manager is right — and it's worse than "custom audiences missing."** v1's
   custom-audience support is a **free-text stub**: a single text box for an audience
   *name* + a Facebook/Instagram dropdown
   (`src/components/launch/bulk-modals/SelectCustomAudienceModal.tsx:16-62`). It does
   **not** fetch real audiences, has **no audience IDs**, and there are **no
   lookalikes** and **no saved audiences** anywhere. It persists as an
   opaque `targeting.custom_audiences: [{name, platform}]` JSON blob
   (`src/hooks/use-launch-mutations.ts:284`). Against a real Meta launch this is
   non-functional.

2. **v1's objectives are stale.** v1 offers legacy labels — `Conversions, Traffic,
   Awareness, Engagement, Leads, App Installs`
   (`src/components/launch/TargetingFormFields.tsx:16`). Meta is **fully on ODAX**
   now: the API only accepts `OUTCOME_SALES / OUTCOME_LEADS / OUTCOME_ENGAGEMENT /
   OUTCOME_AWARENESS / OUTCOME_TRAFFIC / OUTCOME_APP_PROMOTION`. The old enums
   throw 400. `[directional]`

3. **Whole categories of Meta fields are simply absent in v1**: buying type
   (auction/reservation), A/B test, attribution setting, billing event, bid
   cap/cost cap/ROAS *values*, dayparting (ad scheduling grid), pixel + dataset +
   conversion event at the ad-set, behaviors/demographics detailed targeting,
   lookalikes, saved audiences, **existing-post / post-id ("use existing post")**,
   lead forms, WhatsApp/app destinations, URL params at the standard-flow ad level,
   and offline/3rd-party tracking.

4. **v1 is a *mock builder*, not a Meta integration.** The launch backend is a stub
   (`launch-execute`, per `01-v1-teardown.md`), targeting options are hard-coded
   preset string arrays (8 countries, 8 interests, 8 languages —
   `TargetingFormFields.tsx:21-23`), and pixels/pages/catalogues are dummy selects
   (`src/lib/catalogue-dummy-data.ts`). So "in v1?" below means **"a UI control
   exists and round-trips to our DB,"** not "maps to a real Meta field."

5. **Two parallel field sets exist** and they disagree. The standard 3-step wizard
   (`AdsetCard.tsx` / `CampaignCard.tsx` / `AdEditPanel.tsx`) and the catalogue
   3-column editor (`catalogue/*`) implement overlapping-but-different field lists.
   2.0 needs one canonical schema.

---

## How v1 is wired (so the citations make sense)

- **Standard launch, Step 2 "Targeting"** → `StepTargeting.tsx` renders **`CampaignCard`**
  (campaign fields) + **`AdsetCard`** (ad-set fields). It does **not** render
  `TargetingFormFields.tsx` directly — that big component is used by the **template
  drawer / Offers** flow. Both implement the same field set with minor drift, so they're
  cited together below.
- **Standard launch, Step 3 "Creatives"** → `AdEditPanel.tsx` (per-ad creative fields).
- **Bulk edit (Ad Groups table)** → `AdGroupBulkToolbar.tsx:6-12` mounts the 7
  `bulk-modals/*` (Demographic, Device, Location, Schedule, Bidding/Budget,
  Event/Placement, Custom Audience). Saved via `useBulkUpdateAdsets`
  (`use-launch-mutations.ts:272-315`).
- **Catalogue / DPA launch** → `CatalogueAdsFlow.tsx` → `CatalogueCampaignForm` /
  `CatalogueAdsetForm` / `CatalogueAdForm` / `CatalogueAccountForm`.
- **Persisted columns** (typed): `LaunchCampaign` / `LaunchAdset` / `LaunchAd` in
  `src/hooks/use-launch-data.ts:5-58`. Anything not a typed column lives inside the
  `targeting` / `placements` / `setup_config` / `launch_config` JSON blobs.

---

## PART 1 — v1's CURRENT fields (DEFINITIVE, from code)

### Campaign level — typed columns (`LaunchCampaign`, `use-launch-data.ts:5-20`)
`objective, budget_type, budget_period, budget_value, bid_strategy, delivery_type,
special_ad_category, catalogue_ads_override`. Editable in `CampaignCard.tsx:90-192`
(standard) + `CatalogueCampaignForm.tsx` (catalogue).

### Ad-set level — typed columns (`LaunchAdset`, `use-launch-data.ts:22-40`)
`schedule_start, schedule_end, targeting (JSON), placements (JSON), performance_goal,
budget_value, budget_period, bid_strategy, bid_amount, delivery_type`.
The `targeting` JSON bag carries (`step2-defaults.ts:11-38`): `locations,
exclude_locations, gender, age_min, age_max, interests, languages, scheduling_enabled,
devices, os, flexible_creative, advantage_plus_creative, beneficiary, payor,
conversion_location` — plus, from bulk modals only: `location_type,
limit_to_people_in_location, device_platforms, network_connections, custom_audiences`
(`use-launch-mutations.ts:283-284`).

### Ad level — typed columns (`LaunchAd`, `use-launch-data.ts:42-58`)
`primary_text, headline, description, cta, destination_url, display_link, media_urls,
media_type, status`. Editable in `AdEditPanel.tsx:38-48`. Scheduling (per-ad) lives in
`launch_config` via `mergeAdSchedules` (`use-launch-mutations.ts:258`).

### Custom-audience reality check (the manager's flag — VERIFIED)
- UI: `SelectCustomAudienceModal.tsx` = one free-text `audienceName` input + a
  `facebook|instagram` select (`:35-52`). No list, no fetch, no IDs, no audience type.
- It's reachable (not dead code): `AdGroupBulkToolbar.tsx:12,63` mounts it as the
  "audience" bulk action.
- Persistence: `onSave` → `{custom_audiences: [{name, platform}]}`
  (`SelectCustomAudienceModal.tsx:21-23`) → merged into ad-set `targeting` JSON
  (`use-launch-mutations.ts:284,304-305`).
- A `Custom aud.` badge renders if the value is truthy
  (`src/components/launch/AdAccountsTab.tsx:142`).
- **Verdict:** present as a label-only stub. **Lookalikes and saved audiences: absent
  entirely** (only marketing copy mentions of "lookalike" exist —
  `src/lib/demo-mode.ts:69`, `CoPilotRecommendations.tsx:9` — not launch features).

---

## INVENTORY TABLE 1 — CAMPAIGN

| Field | Meta options `[directional]` | In v1? `[data-backed]` | Notes |
|---|---|---|---|
| **Objective** | ODAX 6: `OUTCOME_SALES, OUTCOME_LEADS, OUTCOME_ENGAGEMENT, OUTCOME_AWARENESS, OUTCOME_TRAFFIC, OUTCOME_APP_PROMOTION` | ⚠️ Partial — `TargetingFormFields.tsx:16`, `CampaignCard.tsx:90`, `CatalogueCampaignForm.tsx:11` | v1 uses **legacy labels** (`Conversions/Traffic/Awareness/Engagement/Leads/App Installs`). Legacy enums now 400 on the API. Must remap to ODAX. |
| **Buying type** | `AUCTION` (default) / `RESERVATION` (reach & freq) | ❌ Missing | No control. v1 implicitly auction-only. |
| **Budget level (CBO vs ABO)** | Advantage Campaign Budget (CBO) at campaign, or budget at ad-set (ABO) | ✅ `CampaignCard.tsx:123-129` (radio CBO/ABO) | Drives whether budget shows at campaign vs ad-set. Matches Meta concept. |
| **Campaign budget (CBO) amount + period** | `daily_budget` / `lifetime_budget` (minor units) | ✅ `CampaignCard.tsx:131-153` (daily/lifetime + value) | CBO-only. Plain number; no currency/minor-unit handling. |
| **Campaign bid strategy** | `LOWEST_COST_WITHOUT_CAP, LOWEST_COST_WITH_BID_CAP, COST_CAP, LOWEST_COST_WITH_MIN_ROAS` | ⚠️ Partial — `CampaignCard.tsx:91` (`Lowest Cost/Cost Cap/Bid Cap/Target Cost`) | Labels ≠ Meta enums; **"Target Cost" is deprecated**; **min-ROAS missing**. No cap *value* at campaign. |
| **Special ad category** | `HOUSING, EMPLOYMENT, CREDIT, ISSUES_ELECTIONS_POLITICS, FINANCIAL_PRODUCTS_SERVICES, ONLINE_GAMBLING_AND_GAMING` + country | ⚠️ Partial — `CampaignCard.tsx:93`, `TargetingFormFields.tsx:19` | v1 has `Credit/Employment/Housing/Social Issues`. **Missing:** Financial products, Gambling, and the **category country** sub-field (required by Meta). |
| **Advantage+ Shopping / Sales campaign (ASC)** | Distinct campaign type (`smart_promotion_type`) with its own simplified flow | ❌ Missing | No ASC concept. (Catalogue flow has Advantage+ *catalogue ads*, a different thing — `CatalogueAccountForm.tsx:240-251`.) |
| **A/B test (split test)** | `is_split_test` / experiments; variable (creative/audience/placement) | ❌ Missing | No A/B test anywhere. |
| **Delivery type** | (Standard vs Accelerated = ad-set `pacing_type`, not campaign) | ⚠️ Misplaced — `CampaignCard.tsx:92,163-169` | v1 puts "Standard/Accelerated" at **campaign**; in Meta this is ad-set pacing. Also duplicated at ad-set. |
| **Campaign name** | `name` | ✅ `CampaignCard.tsx:72-75` | — |
| **Campaign status** | `ACTIVE / PAUSED` | ✅ `CampaignCard.tsx:60-63` (Active/Paused switch) | — |
| **Spend cap (campaign)** | `spend_cap` | ❌ Missing | — |
| **Iterative/auto budget (Advantage budget toggle copy)** | UI nicety | ❌ Missing | — |

---

## INVENTORY TABLE 2 — AD SET

| Field | Meta options `[directional]` | In v1? `[data-backed]` | Notes |
|---|---|---|---|
| **Ad-set budget (ABO) amount + period** | `daily_budget` / `lifetime_budget` | ✅ `AdsetCard.tsx:119-141` (ABO only); bulk: `EditBiddingBudgetModal.tsx:42-58` | Shown only when campaign = ABO. |
| **Schedule start / end** | `start_time` / `end_time` | ✅ `AdsetCard.tsx:164-186` (datetime, gated by a "scheduling" toggle); bulk: `EditScheduleModal.tsx`; catalogue: `CatalogueAdsetForm.tsx:162-171` (date-only) | Catalogue uses date-only (loses time). |
| **Dayparting (ad scheduling grid)** | `adset_schedule` (per-day/hour blocks; lifetime budget only) | ❌ Missing | No day/hour grid. The "scheduling" toggle is just start/end dates. |
| **Optimization / performance goal** | per-objective `optimization_goal` (e.g. `OFFSITE_CONVERSIONS, LINK_CLICKS, IMPRESSIONS, REACH, LANDING_PAGE_VIEWS, THRUPLAY, VALUE, LEAD_GENERATION, …`) | ⚠️ Partial — `AdsetCard.tsx:18`, `CatalogueAdsetForm.tsx:13` | v1: `Maximize Conversions/Link Clicks/Impressions/Reach/Landing Page Views`. Labels ≠ enums; not objective-aware; ThruPlay/Value/Leads goals missing. |
| **Billing event** | `billing_event` (`IMPRESSIONS, LINK_CLICKS, THRUPLAY, …`) | ❌ Missing | No control at all. |
| **Bid strategy** | (see campaign list) | ⚠️ Partial — `AdsetCard.tsx:19,144`; bulk `EditBiddingBudgetModal.tsx:63-70` | Bulk modal drops "Target Cost"; min-ROAS missing. |
| **Bid amount / bid cap / cost cap / ROAS floor** | `bid_amount` (cap), `bid_constraints` (`roas_average_floor`) | ⚠️ Partial — `AdsetCard.tsx:156-159` (single "Bid Amount $") | One generic field; not labeled per strategy; **no ROAS floor**, no cost-cap-vs-bid-cap distinction. |
| **Attribution setting** | `attribution_spec` (1d/7d click, 1d view, etc.) | ❌ Missing | Entirely absent. Major gap for conversion campaigns. |
| **Conversion location** | Website / App / Messaging / Calls / Website+Calls / On your Facebook page | ⚠️ Partial — `AdsetCard.tsx:21,378-387`; `CatalogueAdsetForm.tsx:14` | v1: `Website/App/Messaging/Calls` as a free dropdown; not wired to actually change the rest of the form. |
| **Pixel / dataset** | `promoted_object.pixel_id` (+ dataset) | ⚠️ Stub (catalogue only) — `CatalogueAccountForm.tsx:143-151` dummy `Main/Test Pixel` | **Standard flow has NO pixel field.** No real pixel list. |
| **Conversion event** | `promoted_object.custom_event_type` (`PURCHASE, LEAD, ADD_TO_CART, …`) | ❌ Missing | No event selector anywhere. |
| **Application / object** (app installs) | `promoted_object.application_id`, `object_store_url` | ❌ Missing | — |
| **Page / IG account (promoted object)** | `promoted_object.page_id` | ⚠️ Stub (catalogue only) — `CatalogueAccountForm.tsx:132-141` dummy pages | Standard flow has no page selector at ad-set. |
| **Geo / locations (include)** | `geo_locations` (countries, regions, cities, DMAs, radius, zips) | ⚠️ Partial — `AdsetCard.tsx:197-207` (8 preset countries); bulk `EditLocationModal.tsx` (free-text + USA/Overseas tabs) | Country-only presets; **no city/region/radius/zip/DMA**. Two different UIs disagree. |
| **Geo / locations (exclude)** | `excluded_geo_locations` | ✅ `AdsetCard.tsx:210-219`; bulk `EditLocationModal.tsx:25-27` | Same preset limitation. |
| **Location type** | `location_types` (everyone / living-in / recently-in / traveling-in) | ⚠️ Partial — bulk only: `EditLocationModal.tsx:21,68` (single "limit to people in this location" checkbox + USA/Overseas tabs) | Not the real 4-way Meta control. |
| **Age min / max** | `age_min` (13–65) / `age_max` | ✅ `AdsetCard.tsx:235-251` (slider 13–65); `EditDemographicModal.tsx:48-63` | Matches Meta range. |
| **Gender** | `genders` (all / male / female) | ✅ `AdsetCard.tsx:222-232`; `EditDemographicModal.tsx:40-46` | — |
| **Languages** | `locales` | ✅ `AdsetCard.tsx:266-275` (8 preset langs) | Preset list, not Meta's full locale set. |
| **Detailed targeting — interests** | `flexible_spec` / `interests` (taxonomy IDs) | ⚠️ Partial — `AdsetCard.tsx:254-263` (8 preset interest strings) | Hard-coded strings; **no taxonomy IDs, no search**. |
| **Detailed targeting — behaviors** | `behaviors` | ❌ Missing | — |
| **Detailed targeting — demographics** | `demographics` (beyond age/gender) | ❌ Missing | — |
| **Detailed targeting — exclusions** | (removed by Meta 2025-03-31) | ❌ Missing | n/a going forward — Meta removed detailed-targeting exclusions. `[directional]` |
| **Detailed targeting expansion** | `targeting_optimization` / Advantage detailed targeting | ❌ Missing | — |
| **Custom audiences** | `custom_audiences` (real audience IDs; website/CRM/engagement) | ⚠️ **STUB** — `SelectCustomAudienceModal.tsx:16-62` (free-text name + FB/IG), persists `targeting.custom_audiences` (`use-launch-mutations.ts:284`) | **The manager's flag, confirmed.** No real audiences, no IDs, no source. Non-functional vs Meta. |
| **Lookalike audiences** | `custom_audiences` w/ LAL spec (`lookalike_spec`, ratio, seed) | ❌ Missing | Only marketing copy mentions (`demo-mode.ts:69`). |
| **Saved audiences** | `saved_audiences` (reusable saved targeting) | ❌ Missing | — |
| **Excluded custom audiences** | `excluded_custom_audiences` | ❌ Missing | — |
| **Advantage+ Audience** | default AI audience; inputs become *controls* (geo/min-age/excl.) + *suggestions* | ❌ Missing (concept absent) | v1 has manual targeting + a placeholder "Suggest audience" copy panel (`AdsetCard.tsx:389-402`). No Advantage+ audience model. `[directional]` |
| **Connections targeting** | `connections` / `excluded_connections` (page/app/event fans) | ❌ Missing | — |
| **Placements — mode** | `targeting_automation` Advantage+ placements vs manual | ✅ `AdsetCard.tsx:280-285` (Automatic/Manual); `EditEventPlacementModal.tsx:32-38` | — |
| **Placements — surfaces** | `publisher_platforms` + `facebook/instagram/audience_network/messenger_positions` (feed, stories, reels, in-stream, search, explore, marketplace, profile, etc.) | ⚠️ Partial — `AdsetCard.tsx:27-32` PLACEMENT_TREE | Has FB(feed/stories/reels/in-stream/search), IG(feed/stories/reels/explore), Messenger(inbox/stories), AN. **Missing:** Marketplace, Profile feed, IG Search/Profile, Reels overlay, Threads, Business Explore, Right column, etc. Stored as joined strings, not Meta enums. |
| **Device platforms** | `device_platforms` (mobile / desktop) | ⚠️ Split — `AdsetCard.tsx:34` (`Desktop/Mobile/iOS`); `EditDeviceModal.tsx:43` (`all/ios/android`) | Two inconsistent device/OS controls; conflates device platform with OS. |
| **User OS** | `user_os` (iOS / Android + versions) | ⚠️ Partial — `AdsetCard.tsx:35` (`All/Android/iOS`) | No OS version targeting. |
| **Specific mobile devices / Wi-Fi only** | `user_device`, `wireless_carrier` (Wi-Fi) | ⚠️ Partial — `EditDeviceModal.tsx:55` network (`all/wifi/4g/5g`) | Bulk modal only; not a real Meta carrier/device targeting. |
| **Audience size estimate / reach** | `delivery_estimate` / reach estimate | ❌ Missing | No estimate shown. |
| **Dynamic creative toggle** | `is_dynamic_creative` | ⚠️ Partial — "Flexible Creative" switch `AdsetCard.tsx:357` | Labeled "Flexible Creative"; unclear mapping. |
| **Advantage+ creative** | creative-level enhancements | ⚠️ Partial — switch `AdsetCard.tsx:361` | Toggle only; no per-enhancement controls. |
| **Beneficiary / Payor** | `dsa_beneficiary` / `dsa_payor` (EU DSA) | ✅ `AdsetCard.tsx:367-375` (free text) | Free-text; correct EU concept. |
| **Frequency cap** (reach & freq / reservation) | `frequency_control_specs` | ❌ Missing | Tied to reservation buying type (also missing). |
| **Pacing type** | `pacing_type` (standard / no_pacing) | ⚠️ Misplaced — see Delivery Type | Duplicated at campaign + ad-set as "Standard/Accelerated". |
| **Minimum ROAS** | `bid_constraints.roas_average_floor` | ❌ Missing | — |
| **Ad-set name / status** | `name`, `status` | ✅ `AdsetCard.tsx:96-98,87-90` | — |
| **Product set (DPA)** | `promoted_object.product_set_id` | ✅ (catalogue) `CatalogueAdsetForm.tsx:46-55` | Catalogue flow only. |

---

## INVENTORY TABLE 3 — AD (creative)

| Field | Meta options `[directional]` | In v1? `[data-backed]` | Notes |
|---|---|---|---|
| **Ad name / status** | `name`, `status` | ✅ `AdEditPanel.tsx:47,132-141` | Status incl. a "scheduled" pseudo-state (`AdEditPanel.tsx:143-156`) stored in `launch_config`, not a Meta field. |
| **Creative source** | Manual upload vs **Catalogue/DPA** vs **Use existing post** | ⚠️ Partial — manual (`AdEditPanel.tsx`) + catalogue (`CatalogueAdForm.tsx`) | **"Use existing post" entirely missing** (see next row). |
| **Existing post / post-id** | `object_story_id` (use an existing FB/IG post/page-post) | ❌ **Missing** | No post picker, no `object_story_id`, no IG media id. A core Meta ad creation path is absent. The manager-flagged gap class. |
| **Ad format** | single image / single video / **carousel** / **collection** / flexible | ⚠️ Partial — `AdEditPanel.tsx:122-130` media_type = `image/video/carousel` | "Carousel" is just a media_type tag; **no per-card carousel editor**; **collection missing**; **instant experience missing**. |
| **Media (images/videos)** | image hash / video id; aspect-ratio variants per placement | ✅ `AdEditPanel.tsx:73-87` (`MediaUploader`, `media_urls[]`) | Uploads to our storage; no per-placement crops, no Meta image-hash/video-id. |
| **Primary text** | `body` (+ multiple-text variants for DCO) | ✅ `AdEditPanel.tsx:90-94`; catalogue `CatalogueAdForm.tsx:25-34`; catalogue defaults support multi via TagInput `CatalogueAccountForm.tsx:345` | Single field in standard flow; catalogue account-defaults allow multi-value. |
| **Headline** | `title` (+ variants) | ✅ `AdEditPanel.tsx:95-99`; `CatalogueAdForm.tsx:36-45` | — |
| **Description** | `link_description` (+ variants) | ✅ `AdEditPanel.tsx:100-103`; `CatalogueAdForm.tsx:47-50` | — |
| **CTA** | `call_to_action.type` (LEARN_MORE, SHOP_NOW, SIGN_UP, BOOK_TRAVEL, DOWNLOAD, GET_OFFER, CONTACT_US, APPLY_NOW, WHATSAPP_MESSAGE, …) | ⚠️ Partial — `AdEditPanel.tsx:16` (8 opts), `TargetingFormFields.tsx:26` (7), `CatalogueAdForm.tsx:9` (7) | **3 different CTA lists** that disagree; labels not Meta enum types; messaging CTAs missing. |
| **Destination — URL** | `link` / `object_url` | ✅ `AdEditPanel.tsx:112-116`; `CatalogueAdForm.tsx:63-72` | — |
| **Destination — app** | deep link / app | ❌ Missing | — |
| **Destination — lead form** | `lead_gen_form_id` (instant form) | ❌ Missing | No Lead Ads form builder/picker. |
| **Destination — WhatsApp / Messenger / Calls** | `whatsapp_number` / click-to-message / `phone_number` | ❌ Missing | Conversion location has "Messaging/Calls" but no actual destination wiring. |
| **Display link** | `display_url` (caption shown vs real link) | ✅ `AdEditPanel.tsx:117-120`; catalogue acct `CatalogueAccountForm.tsx:177-180` | — |
| **URL parameters / UTM** | `url_tags` | ⚠️ Partial — **catalogue account only** `CatalogueAccountForm.tsx:173-176` (`utm_source=...`) | **Standard-flow ads have NO URL-params field.** |
| **Tracking — pixel** | `tracking_specs` / pixel on the ad | ⚠️ Stub (catalogue acct) `CatalogueAccountForm.tsx:143-151` | Dummy pixel select; not a real per-ad tracking spec. |
| **Tracking — offline events** | offline event set | ❌ Missing | — |
| **Tracking — 3rd-party (impression/click tags)** | `tracking_specs` (e.g. DoubleClick) | ❌ Missing | — |
| **Page / IG identity on the ad** | `page_id` + `instagram_actor_id` | ⚠️ Stub (catalogue acct) `CatalogueAccountForm.tsx:132-141` | No IG identity selection; standard flow has none. |
| **Multi-advertiser / Advantage+ catalogue ads (DPA)** | DPA template (`template_data`, product tags) | ✅ (catalogue) `CatalogueAccountForm.tsx:240-335` | Catalogue flow only; dummy data. |
| **Carousel cards** | per-card image/headline/link/CTA | ❌ Missing | — |
| **Catalogue product set on ad** | product set / "include other products" | ✅ (catalogue) `CatalogueCampaignForm.tsx:119-129`, `CatalogueAccountForm.tsx:290-321` | — |
| **Languages / dynamic language** | placement-asset customization, multi-language | ❌ Missing | — |
| **Creative tags / UTM auto-append at account** | `url_tags` defaulting | ⚠️ Partial — catalogue acct default only | — |

---

## PART 3 — GAP SUMMARY (Meta supports, v1 lacks or fakes)

### A. Hard misses — entirely absent (highest priority for 2.0)
| Gap | Level | Why it matters |
|---|---|---|
| **Real custom audiences** (fetch + IDs + source) | Ad set | Manager-flagged. Current stub is name-only, non-functional. |
| **Lookalike audiences** (seed + ratio) | Ad set | Core prospecting lever; absent. |
| **Saved audiences** | Ad set | Reuse across launches; absent. |
| **Excluded custom audiences** | Ad set | Suppression / retargeting hygiene; absent. |
| **Existing post / `object_story_id`** | Ad | A primary Meta ad-creation path ("use existing post"); absent. |
| **Attribution setting** (`attribution_spec`) | Ad set | Determines conversion counting; absent. |
| **Conversion event** (`custom_event_type`) + real **pixel/dataset** | Ad set | Without these, conversion campaigns can't be built; standard flow has neither. |
| **Billing event** | Ad set | Absent. |
| **A/B test / experiments** | Campaign | Absent. |
| **Buying type** (reservation) + **frequency cap** | Campaign/Ad set | Absent (auction-only implied). |
| **Detailed targeting: behaviors & demographics** | Ad set | Only 8 preset interest strings exist. |
| **Lead forms / WhatsApp / app / call destinations** | Ad | Only website URL is wired. |
| **URL params (UTM) in standard-flow ads** | Ad | Exists only in catalogue account defaults. |
| **Offline + 3rd-party tracking** | Ad | Absent. |
| **Dayparting grid** (`adset_schedule`) | Ad set | Only start/end dates exist. |
| **Min-ROAS / cost-cap value** distinct from bid cap | Ad set | One generic "Bid Amount" field. |
| **Advantage+ Shopping/Sales campaign (ASC)** | Campaign | Absent. |
| **Audience size / delivery estimate** | Ad set | No feedback loop on targeting. |

### B. Partial / stale — exists but wrong shape (needs rework, not greenfield)
| Gap | Level | Fix needed |
|---|---|---|
| **Objectives** | Campaign | Remap legacy labels → ODAX `OUTCOME_*`; make ad-set goals objective-aware. |
| **Bid strategy enums** | Campaign/Ad set | Use Meta enums; drop deprecated "Target Cost"; add min-ROAS; attach cap values to the right strategy. |
| **Special ad category** | Campaign | Add Financial Products + Gambling; add **required category country**. |
| **Geo targeting** | Ad set | Replace 8-country presets with real region/city/radius/zip/DMA search. |
| **Interests** | Ad set | Replace preset strings with Meta taxonomy search + IDs. |
| **Placements** | Ad set | Expand to full surface list (Marketplace, Profile, Search, Threads…); store Meta enums not joined strings. |
| **Device/OS** | Ad set | Reconcile the two conflicting controls (`AdsetCard` vs `EditDeviceModal`); separate device platform / OS / version. |
| **CTA list** | Ad | Unify the 3 divergent lists; map to Meta CTA enum types. |
| **Delivery type / pacing** | Campaign↔Ad set | It's an ad-set concept; remove the campaign-level duplicate. |
| **Conversion location** | Ad set | Make it actually drive destination + promoted_object, not a dead dropdown. |
| **Standard vs catalogue field drift** | All | Converge on one canonical schema (objectives, goals, schedule date-vs-datetime, etc.). |

### C. Architectural caveat (don't mistake "in v1?" for "Meta-ready")
Even the ✅ rows are **mock controls** persisting to FabAds' own tables with hard-coded
option lists; the launch backend is a stub (`01-v1-teardown.md`). Almost nothing maps to
a real Meta Graph API field/enum. So 2.0 is effectively **building the Meta field layer
from scratch**, with v1's UI as a partial reference for ~30-40% of the surface (the common
campaign/ad-set/creative basics) and **near-zero** coverage of audiences, conversion
tracking, advanced bidding, existing-post, A/B testing, and alternate destinations.

---

## Source notes (Meta side, `[directional]`)

- ODAX is fully rolled out; API objectives are the 6 `OUTCOME_*` enums; legacy enums
  (`CONVERSIONS, LINK_CLICKS, BRAND_AWARENESS, APP_INSTALLS`, …) now 400 for new campaigns.
- Advantage+ Audience is the default; manual inputs become *controls* (location, min age,
  exclusions) + *suggestions*; custom/lookalikes can be added but may be treated as
  suggestions. Detailed-targeting **exclusions were removed 2025-03-31**; sensitive Custom
  Audiences further restricted from Sept 2025.
- Field/enum names (`promoted_object`, `attribution_spec`, `billing_event`,
  `optimization_goal`, `bid_constraints`, `targeting_automation`, `object_story_id`,
  `geo_locations`, `publisher_platforms`, `dsa_beneficiary/payor`) are Marketing-API
  knowledge — **re-verify against the live Graph API version at implementation time**, as
  Meta versions deprecate fields frequently.

Sources consulted: developers.facebook.com/docs/marketing-api (Campaign / Ad Set / Ad
Creative references — knowledge), facebook.com/business Advantage+ Audience, plus 2025/2026
practitioner write-ups (bir.ch ODAX guide, truefuturemedia / adnabu / jonloomer on
Advantage+ audience, hunchads on old-vs-ODAX objectives).
