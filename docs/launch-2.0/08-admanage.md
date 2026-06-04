# Launch 2.0 — Stream 08: AdManage.ai Feature Teardown

> **Single-competitor deep dive** flagged by the team: study **AdManage / AdManage.ai**
> **FEATURE-wise** (not UI) before the Launch redesign. Brief was "feature-wise toh
> YouTube pe hai" — two demo videos were given. This doc focuses on **what fields,
> options, and flows AdManage supports** for bulk Meta-ad launching, especially
> **anything FabAds v1 lacks**.
>
> **Companion to** `02-competitive.md` §6c, which covered AdManage in two lines. This
> is the full inventory.
>
> **Confidence tags:** `[data-backed]` = stated on AdManage's own site / docs / API
> reference (or ≥2 sources). `[directional]` = surfaced in a search snippet / single
> blog, plausible but not page-verified. `[not-found]` = could not be retrieved.

---

## 0. Retrieval honesty — what could and couldn't be pulled

**The two demo videos could NOT be retrieved.** As anticipated in the brief, this
environment's fetch allowlist blocks YouTube and every transcript/oembed shim tried:

| Target | Result |
|---|---|
| `youtube.com/watch?v=PwdKghPA5gM` | **HTTP 403** (WebFetch) |
| `youtube.com/watch?v=QL_bHjXTtPs` | **HTTP 403** (WebFetch) |
| `youtube.com/oembed?...` (both IDs) | **HTTP 403** — even title/channel metadata blocked |
| `noembed.com/embed?...` (both IDs) | **HTTP 403** |
| `youtubetotranscript.com/transcript?v=...` (both IDs) | **HTTP 403** |
| WebSearch for the two video IDs | No result — neither ID surfaces in search; titles/descriptions not indexed |

So **nothing video-specific** (no transcript, title, channel, or description) was
obtained. The two URLs remain un-inspected. **What follows is reconstructed entirely
from AdManage's own site, docs, API reference, changelog, and third-party comparison
pages** — which were themselves only reachable **through WebSearch snippet extraction**
(direct WebFetch on `admanage.ai/*` and `docs.admanage.ai/*` also returned 403; the
search backend reads those pages, so content was recovered via targeted queries).
Every claim below is cited to a reachable page. **No video content is fabricated to
fill the gap.**

**Net:** the video route failed, but the fallback was rich — AdManage publishes
per-format landing pages, public API docs, a docs site, a changelog, and a pricing
page, so the feature inventory is solid even without the videos.

---

## 1. What AdManage is (positioning)

- **"#1 Ad Launching Platform — Launch Meta & TikTok Ads 10x Faster — 1M+ Ads
  Monthly."** Self-described as the fastest way to **bulk launch** ads, with support
  for all ad formats, cloud integrations, and multi-language campaigns. `[data-backed]`
  ([admanage.ai](https://admanage.ai/), [admanage.ai/meta](https://admanage.ai/meta))
- **Multi-platform, not Meta-only.** Dedicated bulk launchers for **Meta, TikTok,
  Google (PMax/YouTube UAC), Snapchat, Taboola, and AppLovin Axon.** `[data-backed]`
  ([admanage.ai/tiktok](https://admanage.ai/tiktok), [/google](https://admanage.ai/google), [/snapchat](https://admanage.ai/snapchat), [/taboola](https://admanage.ai/taboola), [/applovin](https://admanage.ai/applovin); cross-platform framing per [MOGE listing](https://moge.ai/product/admanageai))
- **Three ways in:** the web app (`admanage.ai/launch`), a **Google Sheets add-on**,
  and a **public REST API + MCP server** (Claude/Perplexity connectors). `[data-backed]`
  ([docs.admanage.ai/gsheets-app](https://docs.admanage.ai/gsheets-app), [admanage.ai/api-docs](https://admanage.ai/api-docs), [admanage.ai/mcp](https://admanage.ai/mcp))
- **Pricing is flat, not spend- or upload-metered:** **£499/mo In-House** (3 ad
  accounts, 3 workspaces) and **£999/mo Agency** (unlimited ad accounts + workspaces);
  both include **unlimited uploads, launches, team members, and ad spend** — "pricing
  does not scale with ad spend volume." `[data-backed]` ([admanage.ai/pricing](https://admanage.ai/pricing))
  *(Note: higher absolute price than AdsUploader's $59 flat — AdManage sits at the
  agency/enterprise end of the flat-pricing tier.)*

---

## 2. The core bulk-launch flow (Meta)

The signature flow is **media-first**, not wizard-first:

1. **Go to `admanage.ai/launch`** → **drag a whole batch of creative files onto an
   upload zone.** Up to **200 files per batch**; "entire creative library in ~15
   seconds." `[data-backed]` ([docs.admanage.ai/bulk](https://docs.admanage.ai/bulk), [admanage.ai/blog/facebook-ads-bulk-upload](https://admanage.ai/blog/facebook-ads-bulk-upload))
2. **Filename drives structure.** Naming convention
   `Campaign_Product_Version_Placement.ext` (e.g. `BF2025_Shoes_A_4x5.jpg`); AdManage
   parses it to group assets. `[data-backed]` ([docs.admanage.ai/bulk](https://docs.admanage.ai/bulk))
3. **Bulk-edit text/settings** across all rows before launch. `[data-backed]`
4. **"Launch Ads"** → pushes everything to Meta via the Marketing API. **"100+ ads
   live in under a minute."** `[data-backed]` ([docs.admanage.ai/bulk](https://docs.admanage.ai/bulk), [admanage.ai/](https://admanage.ai/))

**IMPORTANT structural constraint (manual-upload flow):** the simple bulk-upload flow
**launches ads into _existing_ campaigns and ad sets** — "you need to create campaigns
first." `[data-backed]` ([docs.admanage.ai/bulk](https://docs.admanage.ai/bulk)) The
**from-scratch campaign/ad-set creation** capability lives in the **API and duplicate
flows** (see §3, §5), not the drag-drop uploader. This is a meaningful nuance: AdManage
optimizes the **ad-creation-at-volume** step; campaign scaffolding is assumed to exist
or be cloned.

---

## 3. Campaign / ad-set / ad fields (from the public API reference)

AdManage's **API docs** expose the field-level surface more precisely than the
marketing pages. It "supports creating Meta campaigns from scratch, including core
setup plus advanced budgeting, bidding, promoted-object, and Advantage+/SKAN fields."
`[data-backed]` ([admanage.ai/api-docs](https://admanage.ai/api-docs))

**Campaign level** `[data-backed]`:
- Required: `businessId` (Meta ad account), `name`, `objective`.
- Objectives: `OUTCOME_TRAFFIC`, `OUTCOME_ENGAGEMENT`, `OUTCOME_LEADS`,
  `OUTCOME_AWARENESS`, `OUTCOME_SALES`, `OUTCOME_APP_PROMOTION` (the full ODAX set).
- Budget: daily **or** lifetime, in account currency, **auto-converted to Meta minor
  units.**

**Ad-set level** `[data-backed]`:
- Budget, schedule, optimization event, **targeting rules**, placements.
- Targeting fields confirmed: `geo_locations` (countries), `age_min`, `age_max`,
  `targeting` (full object), and `promotedObject` (`pixel_id` + `custom_event_type`).
- Advanced fields: `billingEvent`, `bidStrategy`, `bidAmount`, `destinationType`,
  `promotedObject`, `attributionSpec`, `startTime`, `endTime`, `pacingType`,
  `existingCustomerBudgetPercentage`, `placementSoftOptOut`.
- API accepts **both camelCase and Meta snake_case aliases.**
([admanage.ai/api-docs](https://admanage.ai/api-docs); targeting fields corroborated by [Meta Marketing API challenges post](https://admanage.ai/blog/meta-marketing-api-challenges-and-fix))

**Ad level** `[data-backed]`: creative assets (images/videos), copy (`primary text`,
`headline`, `description`), destination URL, tracking/UTM parameters.
([admanage.ai/api-docs](https://admanage.ai/api-docs))

> **Caveat `[directional]`:** detailed **interest/behavior/lookalike/custom-audience
> selection** (beyond geo + age + pixel promoted-object) is **not explicitly enumerated**
> in the retrieved API snippets. The `targeting` object presumably passes through Meta's
> full spec, but a discrete UI for interest search / saved-audience / custom-audience
> attach was **not confirmed** in the reachable material. Flagged as a gap to verify
> (possibly shown in the un-retrieved videos).

---

## 4. Creative formats & placement intelligence (AdManage's strongest area)

This is where AdManage clearly out-specs the simpler launchers.

- **Format coverage:** Single Placement, **Multi-Format / Multi-Placement**,
  **Partnership Ads**, **Collection Ads**, **Carousel Ads** (up to **10 cards**),
  **Flexible Ads**, **Post ID Ads**, **Multi-Language (DLO)**. `[data-backed]`
  ([admanage.ai/meta](https://admanage.ai/meta), [admanage.ai/blog/meta-ad-formats-explained](https://admanage.ai/blog/meta-ad-formats-explained))
- **Auto-grouping by aspect ratio = "placement intelligence."** AdManage
  **auto-detects aspect ratio (1:1, 4:5, 9:16) from the uploaded files** and routes
  each to the right surface (Feed vs Stories/Reels) automatically — "best-in-class…
  the most sophisticated of any tool tested." One concept across Feed (4:5) and
  Stories/Reels (9:16) becomes one multi-placement ad with the right asset per
  placement. `[data-backed]` ([admanage.ai/blog/auto-grouping](https://admanage.ai/blog/auto-grouping), [admanage.ai/blog/best-bulk-meta-ad-launch-tools](https://admanage.ai/blog/best-bulk-meta-ad-launch-tools))
- **Flexible ads:** group multiple creative variations into one ad and let Meta
  optimize the strongest. `[data-backed]` ([admanage.ai/meta](https://admanage.ai/meta))
- **Multi-Language / DLO:** one ad serves multiple languages; Meta serves the right
  language per user. `[data-backed]` ([admanage.ai/meta](https://admanage.ai/meta))
- **Built-in media processing — "Smart Fix":** fixes common video issues (wrong
  codec, wrong aspect ratio), auto-resizes video (e.g. to 9:16), and supports
  **custom thumbnail** selection/upload. `[data-backed]` ([admanage.ai/blog/best-bulk-tiktok-ad-launch-tools](https://admanage.ai/blog/best-bulk-tiktok-ad-launch-tools), [admanage.ai/blog/best-bulk-meta-ad-launch-tools](https://admanage.ai/blog/best-bulk-meta-ad-launch-tools))
- **Disable unwanted automated enhancements** (Advantage+ creative tweaks) and keep
  that preference **consistent across launches.** `[data-backed]` ([admanage.ai/meta](https://admanage.ai/meta) per search extract)
- **Carousel:** dedicated docs flow; custom-placement carousels supported. `[data-backed]`
  ([docs.admanage.ai/launch-carousel-ads](https://docs.admanage.ai/launch-carousel-ads), [docs.admanage.ai/carousel_custom_placement](https://docs.admanage.ai/carousel_custom_placement))

---

## 5. Duplication, post-ID & social proof

- **Cross-account / cross-adset duplication** is a first-class flow: duplicate
  entities, pause/activate, and edit creative copy, URLs, CTAs, UTM tags in the
  process. You can "duplicate the most suitable existing campaign and ad set… then
  launch ads into the new duplicated ad set **in paused status** using saved page,
  Insta, CTA, link, and other defaults." `[data-backed]`
  ([admanage.ai/blog/how-to-duplicate-facebook-ads](https://admanage.ai/blog/how-to-duplicate-facebook-ads), [docs.admanage.ai/duplicate-adset-in-admanage](https://docs.admanage.ai/duplicate-adset-in-admanage))
- **Pixel reassignment on duplicate (notable):** "pixel IDs are **verified and
  reassigned to match the destination account on every duplication**, with no silent
  failures or misattributed conversions." `[data-backed]` ([admanage.ai/api-docs](https://admanage.ai/api-docs))
  → This is the exact native-Meta cross-account-copy failure mode (broken pixel
  mapping) that `02-competitive.md` §10 anti-pattern #7 warns about — **AdManage
  explicitly solves it.**
- **Post ID preservation at scale:** reuse existing post IDs to keep likes/comments
  across all campaigns/ad sets; "eliminates manual work of copying Post IDs one by
  one… maintain engagement across hundreds of duplicates **with a single click**."
  `[data-backed]` ([admanage.ai/blog/how-to-duplicate-facebook-ads](https://admanage.ai/blog/how-to-duplicate-facebook-ads), [admanage.ai/blog/how-to-preserve-social-proof-scaling-facebook-ads](https://admanage.ai/blog/how-to-preserve-social-proof-scaling-facebook-ads))

---

## 6. Naming, UTM, templates & saved settings

- **Dynamic naming enforced automatically:** standardized naming conventions with
  **customizable date formats**, applied to every duplicate "instead of relying on
  humans to manually rename hundreds." `[data-backed]` ([admanage.ai/blog/how-to-duplicate-facebook-ads](https://admanage.ai/blog/how-to-duplicate-facebook-ads), [admanage.ai/blog/ad-creative-naming-conventions](https://admanage.ai/blog/ad-creative-naming-conventions))
- **UTM controls in bulk** across all ads. `[data-backed]` ([admanage.ai/blog/best-bulk-tiktok-ad-launch-tools](https://admanage.ai/blog/best-bulk-tiktok-ad-launch-tools))
- **Saved ad-copy templates:** default **text, headlines, and media URLs** reusable
  across launches; **saved page / Insta / CTA / link defaults** applied on launch.
  `[data-backed]` ([admanage.ai/blog/how-to-duplicate-facebook-ads](https://admanage.ai/blog/how-to-duplicate-facebook-ads))
  *(This is a "defaults/presets" model — note: it's **copy/creative + identity
  defaults**, not confirmed to be a named, reusable **targeting-audience template
  library** the way FabAds' Targeting Templates are. See §9.)*

---

## 7. Cloud import, Google Sheets & API/MCP

- **Cloud import:** upload from **Google Drive, Dropbox, and more.** `[data-backed]`
  ([admanage.ai/meta](https://admanage.ai/meta)) Plus **import from YouTube** to
  repurpose videos as ads across platforms. `[data-backed]` ([admanage.ai/youtube-integration](https://admanage.ai/youtube-integration))
- **Google Sheets add-on** (Workspace Marketplace): manage campaigns inside Sheets —
  **upload launch drafts, export ad sets with pagination, background sync scheduling,
  intelligent/custom column mapping** (Column Mappings section). `[data-backed]`
  ([docs.admanage.ai/gsheets-app](https://docs.admanage.ai/gsheets-app), [Workspace Marketplace](https://workspace.google.com/marketplace/app/bulk_launch_ads_admanageai/550827967992))
- **Public REST API:** launch, **duplicate campaigns/ad sets**, edit, manage
  templates, check status, fetch performance data. `[data-backed]` ([admanage.ai/api-docs](https://admanage.ai/api-docs))
- **MCP server:** connect Claude or Perplexity directly to ad accounts (AI-driven
  launch/measure). `[data-backed]` ([admanage.ai/mcp](https://admanage.ai/mcp))

---

## 8. Multi-account / workspace management

- **Workspaces** are the org unit: In-House = 3 ad accounts / 3 workspaces; Agency =
  **unlimited ad accounts + workspaces**, with **unlimited team members.** `[data-backed]`
  ([admanage.ai/pricing](https://admanage.ai/pricing))
- Positioned for **agencies, multi-brand companies, franchise networks, and
  performance teams.** `[data-backed]` ([admanage.ai/blog/how-to-manage-multiple-facebook-ad-accounts](https://admanage.ai/blog/how-to-manage-multiple-facebook-ad-accounts))
- **Per-platform partnership-ads identity controls:** single / double / **dynamic
  identity** display; load existing partnerships or paste **Instagram URLs**; pull
  from approved partners' media. `[data-backed]` ([admanage.ai/meta-partnership-ads](https://admanage.ai/meta-partnership-ads))

> **Caveat `[directional]`:** granular **per-seat roles/permissions inside AdManage**
> (admin vs editor vs view-only) were **not confirmed** on reachable pages — the
> roles content that surfaced was generic Meta Business Manager guidance, not AdManage's
> own RBAC. "Unlimited team members" is stated; the permission model is not.

---

## 9. FEATURE INVENTORY (the deliverable table)

| Feature | Supported? | Detail | Source | Confidence |
|---|---|---|---|---|
| **Bulk ad creation (drag-drop, many at once)** | ✅ Yes | 200 files/batch; "100+ ads in <1 min"; bulk-edit before launch | [docs/bulk](https://docs.admanage.ai/bulk) | `[data-backed]` |
| **Filename → structure parsing** | ✅ Yes | `Campaign_Product_Version_Placement.ext` convention drives grouping | [docs/bulk](https://docs.admanage.ai/bulk) | `[data-backed]` |
| **Campaign creation from scratch** | ✅ API/duplicate | Drag-drop launches into *existing* campaigns; from-scratch via API (objective, daily/lifetime budget, ODAX set) | [docs/bulk](https://docs.admanage.ai/bulk), [api-docs](https://admanage.ai/api-docs) | `[data-backed]` |
| **Ad-set creation (budget/schedule/optim/placements)** | ✅ Yes (API) | budget, schedule, optimization event, placements, bid strategy/amount, pacing, attribution | [api-docs](https://admanage.ai/api-docs) | `[data-backed]` |
| **Targeting — geo + age** | ✅ Yes | `geo_locations`, `age_min`, `age_max` | [api-docs](https://admanage.ai/api-docs) | `[data-backed]` |
| **Targeting — interests / behaviors / lookalikes** | ⚠️ Unclear | full `targeting` object passes through, but no explicit interest-search / saved-audience / custom-audience UI confirmed | [api-docs](https://admanage.ai/api-docs) | `[directional]` |
| **Pixel / dataset / conversion event** | ✅ Yes | `promotedObject` = `pixel_id` + `custom_event_type`; SKAN/attribution fields | [api-docs](https://admanage.ai/api-docs) | `[data-backed]` |
| **Cross-account / cross-adset duplication** | ✅ Yes | duplicate entities, edit copy/URL/CTA/UTM, launch paused | [duplicate blog](https://admanage.ai/blog/how-to-duplicate-facebook-ads) | `[data-backed]` |
| **Pixel re-mapping on duplicate** | ✅ Yes | pixel verified + reassigned to destination account every duplication | [api-docs](https://admanage.ai/api-docs) | `[data-backed]` |
| **Post ID / existing-post (social proof)** | ✅ Yes | reuse Post IDs at scale, 1-click, keep likes/comments | [duplicate blog](https://admanage.ai/blog/how-to-duplicate-facebook-ads) | `[data-backed]` |
| **Auto-grouping by aspect ratio → placements** | ✅ Yes (flagship) | 1:1 / 4:5 / 9:16 auto-detected → Feed vs Stories/Reels; "best-in-class" | [auto-grouping](https://admanage.ai/blog/auto-grouping) | `[data-backed]` |
| **Carousel (up to 10 cards) + custom placement** | ✅ Yes | dedicated docs flow | [docs/launch-carousel-ads](https://docs.admanage.ai/launch-carousel-ads) | `[data-backed]` |
| **Collection ads** | ✅ Yes | listed format; "launch collection ads at speed" | [admanage.ai/meta](https://admanage.ai/meta) | `[data-backed]` |
| **Flexible ads (multi-variation, Meta picks)** | ✅ Yes | group variations into one ad | [admanage.ai/meta](https://admanage.ai/meta) | `[data-backed]` |
| **Catalogue / DPA / Advantage+ catalog** | ✅ Yes | "DPA" + "catalog campaigns" assignable; Advantage+/SKAN fields in API | [bulk-upload blog](https://admanage.ai/blog/facebook-ads-bulk-upload), [api-docs](https://admanage.ai/api-docs) | `[data-backed]` / DPA depth `[directional]` |
| **Partnership / branded-content ads (creator codes)** | ✅ Yes | single/double/dynamic identity; IG URLs; partner media; bulk | [meta-partnership-ads](https://admanage.ai/meta-partnership-ads) | `[data-backed]` |
| **Multi-language / DLO** | ✅ Yes | one ad, many languages, Meta serves per user | [admanage.ai/meta](https://admanage.ai/meta) | `[data-backed]` |
| **Media processing (Smart Fix) + custom thumbnail** | ✅ Yes | fix codec/aspect, auto-resize, choose/upload thumbnail | [best-bulk-meta blog](https://admanage.ai/blog/best-bulk-meta-ad-launch-tools) | `[data-backed]` |
| **Disable Advantage+ creative enhancements (persisted)** | ✅ Yes | turn off auto-enhancements, keep consistent across launches | [admanage.ai/meta](https://admanage.ai/meta) | `[data-backed]` |
| **Scheduling (start/end time)** | ✅ Yes | `startTime`/`endTime` on ad set; duplicate flow customizes schedule | [api-docs](https://admanage.ai/api-docs), [docs/duplicate-adset](https://docs.admanage.ai/duplicate-adset-in-admanage) | `[data-backed]` |
| **Dayparting / recurring auto-launch / warm-up ramp** | ❌ Not found | no scheduler/AutoPilot/warm-up concept surfaced; it's a launcher, not a rules engine | — | `[not-found]` |
| **Dynamic naming + custom date formats** | ✅ Yes | enforced automatically across duplicates | [duplicate blog](https://admanage.ai/blog/how-to-duplicate-facebook-ads) | `[data-backed]` |
| **Bulk UTM management** | ✅ Yes | UTM controls applied across all ads | [tiktok-bulk blog](https://admanage.ai/blog/best-bulk-tiktok-ad-launch-tools) | `[data-backed]` |
| **Saved ad-copy / identity defaults (presets)** | ✅ Yes | default text/headlines/media URLs + page/Insta/CTA/link defaults | [duplicate blog](https://admanage.ai/blog/how-to-duplicate-facebook-ads) | `[data-backed]` |
| **Named reusable *targeting* template library** | ⚠️ Unclear | "templates" exist via API, but a FabAds-style audience-template library not confirmed | [api-docs](https://admanage.ai/api-docs) | `[directional]` |
| **Cloud import (Drive / Dropbox / YouTube)** | ✅ Yes | drag from cloud; import YouTube videos as ads | [admanage.ai/meta](https://admanage.ai/meta), [/youtube-integration](https://admanage.ai/youtube-integration) | `[data-backed]` |
| **Google Sheets workflow** | ✅ Yes | add-on: upload drafts, export ad sets, sync schedule, column mapping | [docs/gsheets-app](https://docs.admanage.ai/gsheets-app) | `[data-backed]` |
| **Public API** | ✅ Yes | launch/duplicate/edit/templates/status/insights | [api-docs](https://admanage.ai/api-docs) | `[data-backed]` |
| **MCP / AI-agent integration** | ✅ Yes | Claude/Perplexity connect to ad accounts | [admanage.ai/mcp](https://admanage.ai/mcp) | `[data-backed]` |
| **Multi-platform launch (Meta/TikTok/Google/Snap/Taboola/AppLovin)** | ✅ Yes | dedicated launcher per network | [admanage.ai/tiktok](https://admanage.ai/tiktok) + per-platform pages | `[data-backed]` |
| **Multi-account / workspaces** | ✅ Yes | unlimited accounts + workspaces on Agency; unlimited members | [admanage.ai/pricing](https://admanage.ai/pricing) | `[data-backed]` |
| **Per-seat roles / RBAC inside AdManage** | ⚠️ Unclear | "unlimited team members" stated; permission model not documented on reachable pages | — | `[directional]` |
| **Multi-*page* distribution (acct × page pairs)** | ❌ Not found | no concept of spreading load across (account, page) pairs | — | `[not-found]` |
| **Per-page ~250-ad cap awareness** | ❌ Not found | not surfaced anywhere | — | `[not-found]` |
| **Rejection / account-health recovery (≈RRM)** | ❌ Not found | not a launcher concern for AdManage | — | `[not-found]` |
| **Vendor-defined "Launch Strategy" structure presets** | ❌ Not found | (matches `05b` finding — nobody ships these) | — | `[not-found]` |
| **Real reporting / optimization rules engine** | ◐ Light | API can "fetch performance data"; not an optimization product | [api-docs](https://admanage.ai/api-docs) | `[directional]` |

---

## 10. What AdManage does that FabAds v1 DOESN'T

Cross-referenced against `01-v1-teardown.md`. FabAds v1's launch is, critically, a
**simulated backend** (`launch-execute` is a stub — §1/F-R1 of the teardown) with
fragmented entry points. Beyond "it actually launches," the concrete feature gaps:

1. **It actually pushes to Meta.** AdManage launches live via the Marketing API
   ("100+ ads in <1 min"); **FabAds v1's `launch-execute` is a simulation** and
   Catalogue/Fast-Launch don't execute at all. The single biggest gap. ([docs/bulk](https://docs.admanage.ai/bulk) vs `01-v1-teardown.md` F-R1/F-C2/F-CL5)

2. **Aspect-ratio auto-grouping → placement routing.** Upload mixed 1:1/4:5/9:16
   assets and AdManage builds the right multi-placement ad automatically. FabAds v1
   has **no filename→placement intelligence** at all. ([auto-grouping](https://admanage.ai/blog/auto-grouping))

3. **Built-in media processing ("Smart Fix") + custom thumbnails.** Auto-fix
   codec/aspect, auto-resize, pick thumbnail. FabAds v1 has none — media is uploaded
   as-is. ([best-bulk-meta blog](https://admanage.ai/blog/best-bulk-meta-ad-launch-tools))

4. **Pixel verified + reassigned per destination account on every duplicate.** FabAds
   v1 has no real cross-account duplication execution (relaunch just clones a draft);
   AdManage hardens the exact pixel-misattribution failure FabAds' own anti-patterns
   doc flags. ([api-docs](https://admanage.ai/api-docs))

5. **Post ID reuse at scale, one click.** FabAds v1 has no post-ID / existing-post
   path anywhere in the launch flow. ([duplicate blog](https://admanage.ai/blog/how-to-duplicate-facebook-ads))

6. **Rich format coverage in bulk:** Collection, Flexible, Carousel-10, Partnership,
   Multi-Language/DLO. FabAds v1 handles single image/video ads (media-type toggle in
   `AdsTableTab`); no collection/flexible/partnership/DLO builders. ([admanage.ai/meta](https://admanage.ai/meta))

7. **Partnership / branded-content ads** with single/double/dynamic identity + IG-URL
   import. Entirely absent from FabAds v1. ([meta-partnership-ads](https://admanage.ai/meta-partnership-ads))

8. **Cloud-drive + YouTube import.** FabAds v1 ingests only from its own Creative
   Library / catalogue; no Google Drive / Dropbox / YouTube pull. ([admanage.ai/meta](https://admanage.ai/meta))

9. **Google Sheets add-on workflow** (draft upload, ad-set export, column mapping).
   No equivalent in FabAds. ([docs/gsheets-app](https://docs.admanage.ai/gsheets-app))

10. **Public API + MCP server.** Programmatic + AI-agent launching. FabAds v1 has no
    public API surface. ([api-docs](https://admanage.ai/api-docs), [mcp](https://admanage.ai/mcp))

11. **Disable Advantage+ auto-enhancements as a persisted preference.** FabAds v1 has
    no Advantage+ enhancement control. ([admanage.ai/meta](https://admanage.ai/meta))

12. **Multi-platform** (TikTok/Google/Snap/Taboola/AppLovin) from one tool. FabAds is
    Meta-first (TikTok/NewsBreak referenced in Reports but Launch is Facebook-only —
    `01-v1-teardown.md` F-T3). ([per-platform pages](https://admanage.ai/tiktok))

**Conversely — where FabAds' _design intent_ still beats AdManage** (whitespace
confirmed, consistent with `02-competitive.md` §8): AdManage shows **no**
(account × page)-pair distribution, **no** per-page ~250-cap awareness, **no**
warm-up/ramp, **no** AutoPilot-style recurring scheduling, and **no** rejection/
account-health (RRM) concept. AdManage is a **fast launcher**; it is *not* an
account-health / distribution-strategy product. That band remains FabAds' wedge — but
only once FabAds' launch actually executes and matches AdManage on the table-stakes
above (auto-grouping, media processing, post-ID, formats, cloud import).

---

## 11. Caveats & what to verify next

- **The two demo videos were never seen** (§0). Anything shown *only* in the videos —
  most likely the **end-to-end launch UI, the targeting/audience picker depth, and any
  live A/B-matrix step** — is **not captured here.** If video content is essential,
  someone with normal YouTube access should watch `PwdKghPA5gM` and `QL_bHjXTtPs` and
  append a §0-addendum; this doc has marked exactly which cells (`[directional]`/
  `[not-found]`) those videos would most likely resolve: **interest/lookalike/custom-
  audience targeting UI**, **named targeting-template library**, **in-app RBAC**, and
  whether the **combinatorial matrix (creatives × copy → variations)** exists as a
  visual builder vs. just filename-grouping.
- **All site/docs content here came via WebSearch snippet extraction**, since direct
  WebFetch on `admanage.ai/*` returned 403. Snippets are faithful but **not full-page
  reads** — field lists (esp. §3 API) should be re-checked against the live
  [api-docs](https://admanage.ai/api-docs) before being treated as exhaustive.
- **Pricing is point-in-time (mid-2026)** and AdManage may regionalize (£). Re-check
  [admanage.ai/pricing](https://admanage.ai/pricing).
- **DPA/catalog depth is `[directional]`** — "DPA" and "catalog campaigns" are listed
  as assignable formats, but the **product-set / catalog-feed configuration UI** was
  not page-verified.

---

### Source index

**AdManage primary (site / docs / API / changelog):**
[admanage.ai](https://admanage.ai/) ·
[/meta](https://admanage.ai/meta) ·
[/meta-partnership-ads](https://admanage.ai/meta-partnership-ads) ·
[/pricing](https://admanage.ai/pricing) ·
[/api-docs](https://admanage.ai/api-docs) ·
[/mcp](https://admanage.ai/mcp) ·
[/youtube-integration](https://admanage.ai/youtube-integration) ·
[/changelog](https://admanage.ai/changelog) ·
[/tiktok](https://admanage.ai/tiktok) · [/google](https://admanage.ai/google) · [/snapchat](https://admanage.ai/snapchat) · [/taboola](https://admanage.ai/taboola) · [/applovin](https://admanage.ai/applovin) ·
[docs.admanage.ai/bulk](https://docs.admanage.ai/bulk) ·
[docs/gsheets-app](https://docs.admanage.ai/gsheets-app) ·
[docs/launch-carousel-ads](https://docs.admanage.ai/launch-carousel-ads) ·
[docs/carousel_custom_placement](https://docs.admanage.ai/carousel_custom_placement) ·
[docs/duplicate-adset-in-admanage](https://docs.admanage.ai/duplicate-adset-in-admanage)

**AdManage blog (feature-bearing):**
[auto-grouping](https://admanage.ai/blog/auto-grouping) ·
[facebook-ads-bulk-upload](https://admanage.ai/blog/facebook-ads-bulk-upload) ·
[how-to-duplicate-facebook-ads](https://admanage.ai/blog/how-to-duplicate-facebook-ads) ·
[how-to-preserve-social-proof-scaling-facebook-ads](https://admanage.ai/blog/how-to-preserve-social-proof-scaling-facebook-ads) ·
[meta-ad-formats-explained](https://admanage.ai/blog/meta-ad-formats-explained) ·
[best-bulk-meta-ad-launch-tools](https://admanage.ai/blog/best-bulk-meta-ad-launch-tools) ·
[best-bulk-tiktok-ad-launch-tools](https://admanage.ai/blog/best-bulk-tiktok-ad-launch-tools) ·
[meta-marketing-api-challenges-and-fix](https://admanage.ai/blog/meta-marketing-api-challenges-and-fix) ·
[how-to-manage-multiple-facebook-ad-accounts](https://admanage.ai/blog/how-to-manage-multiple-facebook-ad-accounts) ·
[ad-creative-naming-conventions](https://admanage.ai/blog/ad-creative-naming-conventions)

**Third-party / listings:**
[Workspace Marketplace — Bulk Launch Ads](https://workspace.google.com/marketplace/app/bulk_launch_ads_admanageai/550827967992) ·
[MOGE product listing](https://moge.ai/product/admanageai) ·
[AdsUploader — compare/admanage](https://adsuploader.com/compare/admanage) ·
[Adnova — AdManage alternatives](https://www.adnova.ai/blogs/admanage-ai-alternatives)

**Could NOT retrieve:** `youtube.com/watch?v=PwdKghPA5gM`, `youtube.com/watch?v=QL_bHjXTtPs`
(both 403), plus oembed/noembed/youtubetotranscript shims (all 403). Direct WebFetch on
`admanage.ai/*` and `docs.admanage.ai/*` also 403 — content recovered via WebSearch.

> **Confidence summary:** Format coverage, bulk flow, duplication+pixel-remap, post-ID,
> auto-grouping, Smart Fix, cloud/Sheets/API/MCP, multi-platform, and pricing are
> **`[data-backed]`** (AdManage's own pages + ≥1 corroborator). The **interest/lookalike/
> custom-audience targeting UI, named targeting-template library, in-app RBAC, and any
> combinatorial-matrix builder** are **`[directional]` or unconfirmed** — most likely
> resolvable only by watching the two videos this environment could not open.
