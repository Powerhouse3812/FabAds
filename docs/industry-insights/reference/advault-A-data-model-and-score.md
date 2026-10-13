# Inventory A: ad data model, scoring, single-ad detail view (IDC AdVault reference)

Root for every path below: `src/` inside the reference repo. `types.ts` = `src/integrations/supabase/types.ts`. Migrations: `drizzle/migrations/NNNN_*.sql` (shortened to `dz/NNNN`) and `supabase/migrations/<timestamp>_*.sql` (shortened to `sb/<date>`).

---

## 1. Tables and columns

### 1.1 `ads`: one row per creative (types.ts:201-275)

**Identity and source**
- `id` uuid: internal id (PK)
- `external_id` text NOT NULL, unique upsert key: the collector's id. The `meta_<digits>` prefix gives the FB Ad Library id (ads.ts:399)
- `fetched_via` text: which collector or spy tool sent it (raw). Normalised to a source name (§4.2)
- `platform` text: raw channel. Normalised (§4.1). Empty means "Facebook & Instagram"
- `spider_request_id` uuid FK → `spy_requests.id`: the ad came from a user's on-demand "spy request"
- `source_fields` jsonb: free-form blob of every extra field the collector sent. Heaviest column; loaded only in the detail sheet and shown to admins as "Source fields" (ads.ts:247-252, 445)
- `fingerprint` text: dedupe key = `landing_domain(lower, no www) || first 160 chars of caption-or-title (lower, whitespace collapsed)` (ingest-ads.ts:214-221)
- `source_category` text: the category the collector read off the landing page. Kept as a second opinion for category QA and never overwrites `category` (ingest-ads.ts:22-24)

**Taxonomy**
- `industry` text: top level (§4.6): Amalfa, VSL, Telehealth, Lead Gen, E-commerce, Arbitrage, Others. Null shows as "Unsorted"
- `category` text: sub-label inside the industry. A DB trigger forces it onto the canon list (§8)
- `category_audited_at` timestamptz: when the AI category audit last judged it. Reset to NULL when title, caption, cta, brand, landing_domain, transcript, tags or fetched_via change (dz/0016)
- `qa_checked_at` timestamptz: daily category-QA pass stamped this ad
- `tags` jsonb: free tags (array, object or string). Holds system tags plus `cat:<Category>` secondary-category tags (dual-category.ts)

**Advertiser and copy**
- `brand` text: advertiser or page name
- `title` text: headline
- `caption` text: primary text. Player junk is stripped for scoring (ad-copy.ts)
- `cta` text: button label, e.g. "Learn more"
- `transcript` text / `transcript_status` text / `transcript_at` timestamptz: spoken script from the transcription job. Status values seen: `available`, `not_available`, `ok`, or a provider status string (≤120 chars)

**Media**
- `media_type` text: `image` | `video` | `carousel`. If `video` has no real file (.mp4/.webm/.m3u8), it is stored and displayed as an image
- `thumbnail_url` text: image or poster (mirrored to the internal `/api/public/media/...` store)
- `video_url` text: video file
- `media_mirror_attempted_at` timestamptz: media-mirroring job bookkeeping (retried weekly)

**Dates and run length**
- `started_running` date: first date the ad ran (from the spy tool)
- `fetched_date` date: date the collector observed it
- `discovered_at` timestamptz: when the collector discovered it
- `created_at` timestamptz: row insert time (the vault's "last fetched" freshness reads this)
- `days_running` int NOT NULL: run length as sent. Recomputed at ingest when it is missing or ≤0: `round((fetched_date or now) − started_running)` in days (ingest-ads.ts:491-499)

**Performance signals**
- `likes`, `comments`, `shares` int; `views` bigint: engagement. Null means the source didn't report it (only some sources, e.g. AdSpy)
- `clone_count` int: number of copies seen with the same fingerprint. 1 = the original. Each merged twin adds +1 (ingest-ads.ts:1060-1096)
- `ai_score` int 1-100: stored performance score (§3). Computed at ingest (ingest-ads.ts:983) and rescored when an LP, transcript or framework arrives (rescore.server.ts)

**Geo**
- `countries` jsonb: ISO codes, names, comma-packed strings or `{iso2,name}` objects
- `region` text: free text. Folded together with countries (§4.3)

**Funnel and URLs**
- `landing_url` text: richest click URL the collector sent (URL aliases: landing_url, final_url, click_url, tracking_url, tracker_url, destination_url, destination, redirect_url, lander_url, lander, target_url, link_url, url; ingest-ads.ts:230-244)
- `landing_domain` text: lander host
- `offer_url` / `offer_domain` text: final product or offer page behind the advertorial (aliases: offer_url, offer_link, offer, final_offer_url, direct_offer_url, product_url, affiliate_offer_url)
- `tracking_url` text: first tracking link
- `redirect_chain` jsonb: array of hop URLs
- `chain_source` text: `bot` (collector sent it) | `traced` (AdVault followed it) | `side_browser` (manual or side-browser report) | `reviewed` (admin confirmed) | NULL
- `chain_trace_status` text: `ok` | `failed` | NULL (not traced)
- `chain_traced_at` timestamptz
- `offer_rechecked_at` timestamptz: deeper offer-button re-check pass done
- `side_checked_at` timestamptz / `side_check_result` text: side-browser verdict `found` | `no_offer` | `dead` | `blocked` (side-browser.ts)
- `network` text: affiliate network as sent (normalised §4.4)
- `tracker` text: tracking software, comma-joined possible (§4.5)
- `post_url` text: original FB post URL
- `lp_capture_attempted_at` timestamptz / `lp_capture_status` text: `bot` (bot already sent the LP) | `captured` (text + screenshot) | `text_only` | `failed`

**Soft delete**
- `deleted_at` timestamptz / `deleted_reason` text / `deleted_source` text: trash. Excluded from every grid and count. Re-ingesting the same external_id restores the row (ingest-ads.ts:1192-1195)

**Generated `vx_*` columns** (STORED, dz/0028; each mirrors a client helper)
- `vx_has_creative` bool = thumbnail or video non-blank
- `vx_platform` = vault_norm_platform(platform)
- `vx_source` = vault_norm_source(fetched_via)
- `vx_network` = vault_norm_network(network, landing_domain, landing_url)
- `vx_brand_key` = lowercase brand with all non-alphanumerics stripped (or the raw lowercase value if nothing is left)
- `vx_offer_key` = normalised offer domain, else normalised landing domain
- `vx_countries` text[] = canonical country list (GIN index)
- `vx_tracker_keys` text[] = tracker split on comma, lowercased, spaces removed
- `vx_tags` text[] = tags flattened
- `vx_days` int = vault_days_live(...) (§2)
- `vx_added` timestamptz = coalesce(discovered_at, created_at, fetched_date), truncated to ms
- `vx_text_all` = \x01-joined lowercase brand, title, caption, cta, industry, category, landing_domain, offer domain, offer_url, tags
- `vx_text_copy` = title, caption, cta, tags
- `vx_text_domain` = landing_domain, offer domain, offer_url, landing_url
- `vx_dedupe_key` = `landing_domain|offer domain|brand (lower, no www) || first 160 chars of title+caption (lower, non-alphanumerics → space)`

Legacy columns dropped (sb/0815): vertical, format, headline, hook, ad_copy, creative_url, landing_page_url, spend_score, engagement, status, first_seen, created_by.

### 1.2 `ad_creative_analysis`: AI breakdown, 1:1 with ads (types.ts:47-135; dz/0003, 0033, 0037)
- `ad_id` PK/FK
- `media_kind` text: `image` (default) | `video`
- `ad_format` text: style label from a fixed list (§4.7)
- `format_tags` jsonb: up to 4 extra descriptors
- `topic_tags` jsonb: 4-8 lowercase tags covering audience, product type, problem/desire and LP keywords. No brands or countries
- `topic_tagged_at` timestamptz
- `framework` text: one of the FRAMEWORKS list (§4.7)
- `framework_confidence` numeric 0-1
- `hook` text: opening hook, verbatim (≤220 chars)
- `hook_type` text: free label, e.g. "curiosity question", "shock stat", "personal story", "callout", "warning", "before/after", "authority", "offer-led"
- `angle` text: persuasion angle in under 12 words
- `short_angle` text: 2-6 word lowercase claim label, never a framework name (e.g. "save money on auto insurance"); `short_angle_at` timestamptz
- `summary` text: 2 sentences on how the ad sells
- `cta_text` text: closing CTA, verbatim
- `elements` jsonb: ordered array of `{key, text, visual, start, end}`. Keys listed in §4.7. start/end are seconds for video
- `visual_beats` jsonb: video only, `{start, end, visual, role}` per scene
- `transcript` text: video transcript
- `model` text: e.g. `google/gemini-3.8-flash` (video) or `google/gemini-3.1-flash-lite` (image)
- `status` text: `pending` | `running` | `ok` | `failed`; `error` text; `analyzed_at`, `created_at`, `updated_at`

### 1.3 `ad_landing_pages`: captured lander, 1:1 (types.ts:136-200; dz/0002)
- `id`, `ad_id` (unique FK)
- `url`: lander URL
- `final_url`: URL after redirects
- `title` (≤500 chars), `description` (meta description, ≤1000 chars)
- `content`: page text, ≤400k chars
- `word_count`
- `screenshot_url` (full page, mirrored), `pdf_url`
- `status_code`: HTTP status
- `lang`: html lang, ≤12 chars
- `captured_at`, `created_at`, `updated_at`
- `search` tsvector: generated from title + description + content (English, GIN index)

### 1.4 `daily_snapshots` (dz/0022)
- `snapshot_date` date; `industry` (or 'Unknown'); `category` (or 'Unknown')
- `dimension_type` CHECK in `domain` | `page` | `category` | `hook` | `format`
- `dimension_value`
- `ad_count`: live ads in the bucket on that date
- `new_ads`: rows created that UTC day
- Unique on (date, industry, category, dim type, dim value)

### 1.5 `boards` / `board_items` / `saved_ads`
- `boards`: id, name, description, color (default 'gold' when created from selection), is_public bool, owner_id, created_at, updated_at
- `board_items`: id, board_id, ad_id, added_by, note, created_at. Unique (board_id, ad_id)
- `saved_ads` ("swipe file"): id, user_id, ad_id, created_at

### 1.6 `category_canon` (dz/0024)
- `industry`, `category`, `is_fallback` bool. PK (industry, category). Full values in §4.6

### 1.7 Other tables
- `category_drift_log`: industry, raw_category, folded_to, hits, first_seen, last_seen. Records every off-canon category the trigger folded
- `category_qa_proposals`: ad_id, external_id, old/proposed industry and category, confidence, evidence, reason, source, status, created_by(_email), reviewed_at, reviewed_by_email, row_version, correction_run_id
- `category_qa_state`, `creative_analysis_state`: job leases (id, lease_until, paused, paused_reason, last_run_at, last_status)
- `label_correction_runs`: actor, mode, status, total_rows, applied/skipped/conflict counts, revert_of, reviewer, notes, timestamps
- `label_corrections`: per-ad old→new industry and category, confidence, outcome, skip_reason, run_id, applied_at
- `offer_audit` (dz/0042): ad_id, offer_url, offer_domain, landing_domain, brand, industry, reason, status (`flagged` | `verified` | `cleared` | `no_offer`), new_offer_url, reviewed_by, reviewed_at
- `blocklist_rules`: brand, domain, enabled, note (seeded with mega-brands, §8)
- `blocked_ingest_log`: brand, landing_domain, external_id, title, caption, thumbnail_url, industry, category, platform, fetched_via, blocked_at, block_reason (`branded-match` | `domain-match` | `category-mismatch` | `other`), matched_rule
- `industry_insights_category_map`: category → industry_insights_industry, enabled. Seed:
  - Auto Insurance→Auto Insurance; Medicare→Medicare; Weight Loss→GLP-1 / Weight Loss; Nutrition→Supplements; Prostate→Supplements; Telehealth→Telehealth; Demi-fine & Fashion→Jewelry
  - General Merchandise→DTC / E-commerce; Viral Products→DTC / E-commerce; Home Services→Home Services; Beauty→Beauty; Fitness→Fitness; Dental→Dental Implants; Legal & Mass Tort→Mass Tort; Education & Courses→Skill Courses
  - Disabled: Jobs & Recruiting, Gaming, Adult, Gifts
- `industry_insights_push_log`: ad_id, environment, facebook_ad_id, industry, pushed_at, status (default pending), http_status, attempts, last_error, payload_hash
- `saved_searches`: id, user_id, name, filters jsonb, alerts_enabled bool, last_seen_at, created_at, updated_at. An "alert" means ads matching the filters with added time after last_seen_at (searches.ts:50-55, 118-140)
- `activity_events`: user_id, kind (`login` | `search` | `filter` | `page`), query, filters, path, created_at
- `spy_requests`: kind (`domain` | `page` | `offer` | `keyword`), value, category, industry, note, status (`running`, `done`, `rejected`, …), bot, bot_note, ads_found, requested_by, requester_email, claimed_at, completed_at. Daily and monthly quotas apply
- `share_links`: code, kind (`ad` | `board`), target_id, created_by
- `profiles`: id, email, full_name, team (default 'Growth'), industry, avatar_url
- `user_roles`: role enum `admin` | `editor` | `viewer`
- `job_alerts`: job, status, message (e.g. job `landing-screenshots`); `job_tokens`

---

## 2. Derived fields and formulas

- **daysLive** (ads.ts:180-191; SQL `vault_days_live`, dz/0025):
  - If started_running exists: `round((fetched_date ?? discovered_at ?? created_at ?? now) − started_running)` in days. Used when >0
  - Otherwise `days_running` if >0
  - Otherwise null. The UI never invents a run length
- **measuredAt** (ads.ts:194): fetched_date ?? discovered_at ?? created_at. Shown as "Running N days as of <date>"
- **addedAt** ("Latest added" sort, period filter): discovered_at ?? created_at ?? fetched_date (ads.ts:135)
- **isNewAd** ("New" badge): `fetched_date ?? discovered_at ?? created_at` within the last **2 days** (ads.ts:142-147)
  - The field order differs from addedAt
- **inPeriod(days)** (ads.ts:204-216; mirrored in SQL): the ad passes if either:
  - addedAt ≥ now − days, or
  - started_running ≤ now and measuredAt ≥ now − days ("live at some point in the window")
  - Period options: 7, 14, 30, 60, 90, 180 ("Last 6 months"), 365 ("Last 12 months"), all. **Default 60**
- **cloneTier** (ads.ts:109-114): `winner` if clone_count ≥5, `some` if >0, `none` otherwise
  - Card badge reads "{n} cloned" plus a "Winner" pill at ≥5
  - Detail reads "Cloned / duplicated N times — proven winner" at ≥5
- **Winner gates** (WinnerCriteria.tsx:8-27; filterAndSortAds ads.ts:775-779; SQL `winners`):
  - Gates: likes ≥ **50**; clone_count ≥ **1**; daysLive ≥ **7**
  - Mode `any` = at least one gate; `all` = every gate
  - Copy: "50+ likes · Proven engagement", "1+ clone · Copied by competitors", "7+ days live · Still scaling"
  - Banner: "Every ad clears at least one gate — the strongest clear all three."
- **Winner definitions differ by RPC**:
  - `vault_leaders.win` = ANY gate
  - `scope_insights.win` = ALL three gates
- **"Running" / live** in scope_insights: measured date (fetched_date ?? discovered_at ?? created_at) within the last **14 days**. This is a proxy, not a real active flag
- **adScore** (ads.ts:224): stored `ai_score`, else scoreAd() computed on the fly
- **hasCreative** (ads.ts:257): thumbnail or video non-blank. Ads without one are hidden from all grids; admins see them in a "broken" list
- **mediaKind** (AdMedia.tsx:14-19): video only when video_url ends in .mp4/.webm/.m3u8; carousel kept; everything else is image
- **isJunkThumb** (AdMedia.tsx:29-34): thumbnail treated as junk (profile icon or sprite) if its max side is under 200px, or h/w > 2.4, or h/w < 1/3.2. Falls back to a video frame at t=2s, then a branded placeholder
- **adEngagement** (ads.ts:229): views, likes, comments, shares; only non-null ones are shown
- **brandKey**: lowercase with non-alphanumerics stripped. Groups "Zeraki Jewels®" and "zeraki_jewels" together
- **offerDomain** = normalizeDomain(offer_domain || offer_url)
- **funnelPages** (ads.ts:671-685): from the hop list (or landing_url) plus offer_url, tracker hosts dropped (§4.5)
  - landing = first non-tracker page
  - offer = last page whose root domain differs from the landing page
- **separateOfferDomain**: the offer only when it is a different site from the lander (tracers often copy the lander into the offer field)
- **usefulAdTags** (ads.ts:601-612): removes system or collector tags matching:
  - `expand|backfill|refetch|recheck|seed|_bot$|bot$|spy|library|adplexity|foreplay|spyhero|rtkcid|redtrack|voluum|^tracker$|daily|photo_\d|caption|fix$|^\d|^(us|usa|eu|uk)$|`
  - industry names; `shopify|woocommerce|magento|bigcommerce|opencart|squarespace|shopify-woo|conversion_focused|affiliate-network`
  - Remaining tags: `_`/`-` replaced with spaces, lowercased
- **Concept dedupe (collapseConcepts)** (ads.ts:699-721):
  - key = (landing_domain || offerDomain || brand) + `||` + first 160 chars of normalised title+caption
  - Keeps the highest adScore; ties go to the lower external_id
- **funnelType** (AdDetailSheet.tsx:240-249; detail only). Built from LP final_url, landing_url and the first 6000 chars of LP text. First match wins:
  1. "Quiz funnel": `quiz | question N of | step N of N | take the (free) quiz/assessment | answer N (quick) questions`
  2. "Advertorial pre-sell": lpAdvertorial or lpRedirected or `advertorial | /page(s)/ | editor's pick/note | by First L. | updated N days/weeks ago`
  3. "Direct VSL": `watch the/this (full/free) video/presentation | video below | vsl | presentation will`
  4. "Lead form": `get (your) (free) quote | zip code | see if you qualify | check eligibility | enter your email/details`
  5. "Product page": `add to cart | buy now | shop now | free shipping | checkout`
- **lpRedirected**: LP final host ≠ landing_domain host
- **lpAdvertorial** (detail): all of the following hold:
  - trace status ≠ ok
  - LP text longer than 200 chars
  - text matches `affiliate links? | we (may) earn (a) commission | advertorial | see (the) top/best-rated`
- **Freshness** (ads.ts:1210-1231):
  - lastFetched = newest `ads.created_at`
  - total = count(ads), with no deleted or creative filter
  - last24h = rows created in the last 24h

---

## 3. AI Score model (score.ts; "1-100: how likely an ad is a real performance winner")

**Base weights (sum 100)**

| key | label | max | input | benchmark (log curve) |
|---|---|---|---|---|
| longevity | Longevity | 18 | runDays (same as daysLive, 0 if unknown) | 120 days |
| likes | Likes | 16 | likes | 5,000 |
| social | Comments & shares | 8 | comments + shares | 800 |
| clones | Clones | 16 | clone_count − 1 (1 = original) | 10 |
| craft | Performance craft | 42 | rules below | n/a |

- **curve(v, bench, max)** = `min(1, log10(1+v)/log10(1+bench)) × max`, rounded to 0.1. v ≤0 gives 0 (score.ts:130-134)
- **Missing data** (score.ts:355-362, 415-429):
  - likes is "available" when not null. social is available when comments or shares is not null. clones is available when clone_count is not null. Longevity and craft are always available
  - Missing parts get value 0 and max 0
  - Their weight is redistributed only partially, with RECOVERED_SHARE = 0.6:
    - `effectiveMax = availableMax + 0.6 × (100 − availableMax)`
    - every available part is scaled by `effectiveMax / availableMax`
  - Examples:
    - All present: ×1.0
    - Only longevity + craft: availableMax 60 → effective 84 → ×1.4 (longevity max 25.2, craft max 58.8). An ad with no engagement data caps at 84
    - Clones present but no likes/social (typical: ingest sets clone_count=1): 76 → 90.4 → ×1.189
- **Final score** = round(sum of part values, including the penalty), clamped to 1..100

**Craft raw points** (craftScore, score.ts:171-347). Copy = cleaned title + caption; if that is under 15 words and a transcript exists, the transcript is appended.

- Format:
  - video (media_type video and video_url) +4 "video creative"
  - carousel +2.5 "carousel creative"
  - else +1
- Script depth (words):
  - ≥90 → +5 "long-form sales script"
  - ≥40 → +3.5 "long-form script"
  - ≥15 → +2 "developed copy"
- Angle (only the first match counts):
  - clickbait regex +6 "clickbait / curiosity angle"
  - else numbered list (`N ways|reasons|things|signs|foods|tips|mistakes|secrets|steps`) +4 "listicle angle"
  - else curiosity punctuation (`? … ... !`) plus second person ("you/your") +2 "curiosity phrasing"
- Hook words +4 "strong hook": `how i|how to|why|what if|secret|discover|revealed|stop|warning|attention|finally|introducing|the truth|nobody tells|before you`
- Offer words +4 "explicit offer": `free|off|save|$N|N%|discount|deal|bogo|trial|guarantee|money back|shipping`
- Urgency +3: `today|now|limited|last chance|hurry|ends|only N|while supplies|don't miss|instant`
- Social proof +2.5: `N people/customers/users/reviews/patients|rated|reviews|clinically|doctor|dermatologist|proven|study/studies`
- CTA field non-empty +2.5 "clear CTA"
- Clickbait regex words (score.ts:150): shocking, weird, banned, doctors hate, they don't want, exposed, leaked, this is why, you won't believe, watch what/until/till, wait for/until the end, shut down, controversial, scam, angry, furious, desperate, forced to, refuse(s/d) to, goes/went viral, crazy, insane, scary, terrifying, nightmare, regret, mistake(s), never do, stop doing, do this, try this, one (simple/weird/strange) trick, hack, loophole, little-known, nobody talks about, what happened next, hidden, the real reason, finally exposed, shocked
- Spoken-script DR (transcript of at least 20 words):
  - Checks:
    - hook: hook, clickbait or "?" in the first 35 words
    - body: at least 80 words and matches `i was|my wife/husband/mom/doctor|years|suffer|pain|struggl|tired of|problem|finally|discovered|until|then i|because`
    - cta: spoken CTA in the last 60 words (`click the link/button|tap…|link below|order now/today|visit|get yours|go to|check it out|learn more|claim|sign up|shop now|buy now`)
  - 3 hits +6, 2 hits +3.5
- Framework elements (from the analysis) in the DR set {hook, pain, agitation, fear, curiosity_loop, story, mechanism, social_proof, authority, offer, urgency, scarcity, cta, guarantee, objection}: ≥6 distinct +5, ≥4 distinct +3
- Funnel, bridged +6 ("advertorial / bridge funnel" or "advertorial page with offer CTA"). Triggered by any of:
  - offer_domain ≠ landing_domain
  - more than 1 redirect hop
  - LP final root domain ≠ landing root domain
  - LP text over 200 chars matching an offer CTA (`see top/best-rated|check price/availability|see today's price/deal/offer|claim your/the|order now|get yours/it now/today|visit the official|→`)
  - landing path matches `/article|advertorial|story|news|blog|review(s)|health|report|presell|pre-sell|lp|landing|quiz|survey|vsl|watch|discover|read`
- Funnel, affiliate +6 (note "affiliate disclosure on landing page" / "throwaway funnel domain" / "affiliate / tracked link"). Triggered by any of:
  - tracker set, or network set
  - LP affiliate disclosure (`affiliate links|earn a commission|advertorial|this is an advertisement|paid advertisement|sponsored content|we may be compensated`)
  - throwaway host: digit-stuffed label `[a-z]+\d{2,}`, or TLD in .info .xyz .top .click .online .site .live .icu .buzz .shop .store
  - affiliate params in landing, offer or tracking URL: affid, aff_id, aff_sub*, affiliate_id, affiliate, hop, hopid, clickid, click_id, cid, sub_id*, subid, s1-s3, utm_term, transaction_id, offer_id, oid, pid, tid, gclid, ttclid, fbclid, source_id, traffic_source, zoneid, campaignid, camp_id
  - affiliate hosts: clickbank, digistore24, buygoods, maxweb, jvzoo, warriorplus, shareasale, cj.com, impact(radius), partnerize, awin, hasoffers, go2cloud, trk., track., click., redirect., linkstorm, voluum, redtrack, clickflare, binom, keitaro, thrivetracker
- Neither bridged nor affiliate, but a landing page exists: +0.5
- **Craft value** = `min(42, raw × 1.55)`, rounded to 0.1. Raw ≥27.1 hits the cap
- **Branded penalty** (separate negative part "Branded penalty"):
  - Applies only when "looksBranded" holds: no affiliate, bridge, LP-affiliate, LP-advertorial, throwaway or LP-redirect evidence; script hits <2; DR elements <4; and copy words >0
  - drSignals counts offer, urgency, (clickbait/list/curious), CTA, hook
  - 0 signals → **−12** "branded ad: no offer, urgency, hook or CTA"
  - 1 signal and fewer than 40 words → **−6** "mostly branded: thin copy, one direct-response signal"
- **Part hints shown under each bar**:
  - Longevity: "N days live" / "no run length reported"
  - Likes: "N likes" / "likes not reported by source"
  - Comments & shares: "N comments + shares" / "comments/shares not reported by source"
  - Clones: "N competitor clone(s)" / "no clones yet" / "clone data not reported by source"
  - Craft: the joined notes, or "thin direct-response signals"
- **Tiers** (scoreTier, score.ts:448-457): **Elite ≥80**, **Strong ≥60**, **Average ≥40**, **Weak <40**
- **Where it is computed**:
  - Ingest: no LP or framework yet
  - rescoreAds after LP storage: adds LP url/final/content (first 20k chars), transcript, framework element keys
  - Detail sheet: computes a *live* score from chain hops, analysis transcript and elements, and LP data. This can differ from the stored `ai_score` shown on cards and used for sorting

---

## 4. Normalisation lists (actual values)

### 4.1 Platforms (ads.ts:884-897; SQL vault_norm_platform)
- empty → **Facebook & Instagram**
- /tiktok/ → **TikTok**
- /youtube|google|display/ → **YouTube**
- /linkedin/ → **LinkedIn**
- /snap/ → **Snapchat**
- /pinterest/ → **Pinterest**
- /reddit/ → **Reddit**
- /x\.com|twitter/ → **X**
- anything else (incl. tool names foreplay/spyhero/adspy, Meta, Threads) → **Facebook & Instagram**

### 4.2 Sources / spy tools (ads.ts:907-916)
- empty → **Unknown**
- /adspy/ → **AdSpy**
- /spyhero/ → **SpyHero**
- /foreplay/ → **ForePlay**
- /meta ad library|facebook ad library/ → **Meta Ad Library**
- /tiktok/ → **TikTok Creative Center**
- otherwise the raw trimmed value
- Other tool names referenced in tags or comments: adplexity

### 4.3 Countries (ads.ts:1053-1199; SQL vault_norm_country / vault_countries)
- ISO-2 map:
  - ae United Arab Emirates, af Afghanistan, al Albania, am Armenia, ar Argentina, at Austria, au Australia, az Azerbaijan, ba Bosnia & Herzegovina, bd Bangladesh, be Belgium, bg Bulgaria, bh Bahrain, br Brazil, by Belarus
  - ca Canada, ch Switzerland, cl Chile, cn China, co Colombia, cr Costa Rica, cy Cyprus, cz Czech Republic, de Germany, dk Denmark, do Dominican Republic, dz Algeria
  - ec Ecuador, ee Estonia, eg Egypt, es Spain, et Ethiopia, fi Finland, fr France, gb United Kingdom, ge Georgia, gh Ghana, gr Greece, gt Guatemala
  - hk Hong Kong, hn Honduras, hr Croatia, hu Hungary, id Indonesia, ie Ireland, il Israel, in India, iq Iraq, is Iceland, it Italy, jm Jamaica, jo Jordan, jp Japan
  - ke Kenya, kh Cambodia, kr South Korea, kw Kuwait, kz Kazakhstan, lb Lebanon, lk Sri Lanka, lt Lithuania, lu Luxembourg, lv Latvia
  - ma Morocco, md Moldova, mk North Macedonia, mm Myanmar, mt Malta, mu Mauritius, mx Mexico, my Malaysia
  - ng Nigeria, nl Netherlands, no Norway, np Nepal, nz New Zealand, om Oman, pa Panama, pe Peru, ph Philippines, pk Pakistan, pl Poland, pr Puerto Rico, pt Portugal, py Paraguay, qa Qatar
  - ro Romania, rs Serbia, ru Russia, sa Saudi Arabia, sc Seychelles, se Sweden, sg Singapore, si Slovenia, sk Slovakia
  - th Thailand, tn Tunisia, tr Turkey, tw Taiwan, tz Tanzania, ua Ukraine, ug Uganda, us United States, uy Uruguay, uz Uzbekistan, ve Venezuela, vn Vietnam, za South Africa, zw Zimbabwe
- Aliases:
  - usa / united states / united states of america / u.s. / u.s.a. / america → United States
  - uk / united kingdom / great britain / britain / england → United Kingdom
  - uae / united arab emirates → UAE name
  - south korea / korea / republic of korea → South Korea
  - czechia → Czech Republic; holland → Netherlands; viet nam → Vietnam
  - worldwide / global / ww / international / multiple countries / all countries → **Worldwide**
- Rules:
  - trailing dots stripped
  - packed values split on `, / |`
  - unmapped tokens of ≤2 chars dropped
  - junk dropped: contains a digit; "[object", "undefined", "[]", "{}"; ^all|any|everywhere|cta$; CTA text (action, shop now, learn more, sign up, click, button, download, apply now, order now); ends in countries|country|region(s)|various|multiple|other|unknown|n/a|null|none
  - unknown names are Title-Cased
  - object entries are read from name, country, country_name, label, iso2, code, iso
  - `region` is merged in
- Filter list: **United States always first**, then by ad count (`PRIMARY_COUNTRY`)

### 4.4 Affiliate networks (ads.ts:918-950; SQL vault_norm_network)
- Constant list: Clickbank, Digistore24, Maxweb, BuyGoods, ClickBetter, DigiStore, Warriorplus, JVZoo
- Inference haystack: `network + landing_domain + landing_url`
  - /clickbank|hop\.clickbank|cbengine/ → Clickbank
  - /digistore/ → Digistore24
  - /maxweb/ → Maxweb
  - /buygoods/ → BuyGoods
  - /clickbetter/ → ClickBetter
  - /warriorplus|warrior\+/ → Warriorplus
  - /jvzoo/ → JVZoo
  - else **Unclassified** (always sorted last)
- Facet `networks_vsl` is counted only for industry = VSL

### 4.5 Trackers
- Ingest canon (tracker.ts), name → host patterns:
  - RedTrack: redtrack.io, rdtk.io, rtkclk.com
  - Voluum: voluum.com, voluumtrk.com, trackvoluum.com, vlmtrk.com, go2cloud.org
  - Binom: binom.org
  - ClickFlare: clickflare.io, cfclick.io
  - ClickMagick: clickmagick.com, cmglink.com
  - FunnelFlux: funnelflux.com
  - ThriveTracker: thrivetracker.com
  - Everflow: everflow.io, efwnetwork.com
  - HasOffers (alias TUNE): hasoffers.com, go2cloud.org
  - CAKE: cakemarketing.com, ftd122.com
  - Keitaro: keitaro.io
  - BeMob: bemob.com
  - PeerClick: peerclick.com
  - AdsBridge: adsbridge.com
  - 315Track: 315track.com
- Tracker is set only from an explicit collector name or a recognised tracking/chain host. Values none/n/a/unknown/null become null
- Display canon (ads.ts:1371-1375): RedTrack, ClickFlare, Binom, Voluum, CPV Lab, BeMob, Keitaro, FunnelFlux, ThriveTracker, TUNE, Everflow, Trackier, ClickMagick, Branch, AppsFlyer, HYROS, Triple Whale, Northbeam
- Tracker-host regex (never a readable page) (ads.ts:655, redirect-trace.server.ts:151):
  - host prefix `trk|track|tracking|click|clk|go|r|t|redirect|link|lnk|tk` + optional digits + `.`
  - or contains redtrack, voluum, binom, clickflare, keitaro, bemob, cpvlab, funnelflux, thrivetracker, everflow, trackier
- Filter value `tracked` means any tracker is present

### 4.6 Industries and categories
- INDUSTRIES (ads.ts:18-26): Amalfa, VSL, Telehealth, Lead Gen, E-commerce, Arbitrage, Others
- Industry hues (oklch): Amalfa 350, VSL 265, Telehealth 160, Lead Gen 250, E-commerce 190, Arbitrage 60, Others 30
- `category_canon` seed (dz/0024); `*` = fallback:
  - **VSL**: Weight Loss, Blood Sugar / Diabetes, Brain & Memory, Hearing & Tinnitus, Vision, Prostate, Dental, Joint & Back Pain, Skin & Anti-Aging, Nail & Fungus, Hair Growth, Men's Health, Women's Health, Gut & Detox, Heart & Blood Pressure, Sleep & Anxiety, Make Money / Bizopp, Crypto & Trading, Survival & Self-Defense, Relationships & Manifestation, Pets, Other*
  - **Telehealth**: Weight Loss, GLP-1, Longevity & NAD+, Labs & Diagnostics, ED, TRT, HRT, Mental Health, Skin & Derm, Hair Loss, Sleep, Primary Care, Other*
  - **Lead Gen**: Auto Insurance, Health Insurance, Life Insurance, Medicare, Home & Property Insurance, Insurance (Other), Solar, Roofing, HVAC & Plumbing, Home Services, Local Clinics & Healthcare, Legal & Mass Tort, Loans & Mortgage, Debt & Tax Relief, Education & Courses, Real Estate, Automotive, Jobs & Recruiting, B2B / SaaS, Banking & Finance, Sweepstakes, Surveys & Rewards, Government & Senior Benefits, Home & Auto Warranty, Legal & Permits, Business & Coaching, Dance & Fitness, Other*
    - The client list (subcategories.ts) also has "Firearms & Concealed Carry", which is not in the canon seed
  - **Others**: Dance & Fitness, App Installs, Gaming, Finance & Fintech, Crypto & Trading, Insurance, Education & Courses, Real Estate, Travel, Automotive, Dating, SaaS, AI & Digital Products, Competitions & Raffles, Advocacy & Non-Profit, Events & Tickets, News & Media, Food & Dining, Home Services, Jobs & Recruiting, Entertainment & Streaming, Astrology & Psychics, Other*
  - **E-commerce**: General Merchandise*, Apparel, Nutrition, Beauty, Pet, Gifts, Fitness, Viral Products, Home Decor, Electronics, Outdoor, Sleep, Bags & Accessories, Shoes, Kitchen, Hair Care, Fragrance, Baby & Kids, Watches, Home & Garden, Arts & Crafts, Tools & Hardware, Home Organizers, Automotive Accessories, Cleaning, Musical Instruments, Toys & Games, Books & Info Products, Health Devices, Astrology & Psychics, Pest Control, Sexual Wellness, Jewelry
  - **Arbitrage**: Search Arbitrage*, Native, Shopping Content, Article Pages, Adult, Other
  - **Amalfa**: Demi-fine & Fashion*
- Dual category (dual-category.ts): an E-commerce "Viral Products" ad matching a beauty regex (skin, serum, lipstick, makeup, mascara, sunscreen, acne, lakmé, maybelline, l'oréal, nykaa, mamaearth, minimalist, plum, dot & key, the derma co…) becomes primary **Beauty** with tag `cat:Viral Products`. The category filter matches either

### 4.7 Creative-analysis vocabularies (creative-analysis.server.ts)
- **FRAMEWORKS**: PAS, AIDA, BAB, PASTOR, 4Ps, FAB, Star-Story-Solution, Testimonial, Listicle, Direct Offer, Curiosity Loop, Problem-Solution, Other
- **Video formats**: UGC selfie, UGC voiceover, Talking head / expert, Street interview, Testimonial, News / editorial style, Documentary / B-roll, Screen recording / demo, Animation / motion graphics, Product demo, Reaction / duet, Slideshow, AI avatar, Podcast clip
- **Image styles** (23): Native screenshot, UGC photo, News / editorial, Text message / chat, Comment collage, Social comment, iPhone note, IG question sticker, Google / native search, Is it a scam?, Credential selfie, Comparison card, Before / after, Proof / results, Testimonial quote, Offer & scarcity, Product photo, Lifestyle photo, Meme / novelty, Infographic / chart, Listicle graphic, Checklist / tips, Warning / alert
- **Element keys → labels**:
  - hook Hook, lead Lead, context Context, pain Pain point, agitation Agitation, fear Fear / risk, curiosity_loop Curiosity loop, story Story, mechanism Mechanism
  - solution Solution, product Product, benefits Benefits, demonstration Demonstration, social_proof Social proof, authority Authority, comparison Comparison, objection Objection handling
  - guarantee Guarantee, offer Offer, price Price, bonus Bonus, urgency Urgency, scarcity Scarcity, cta Call to action, disclaimer Disclaimer
- Words banned from short_angle: pas, aida, fomo, fear of missing out, social proof, curiosity gap, curiosity, urgency, scarcity, government program, testimonial, authority

### 4.8 Filter option lists (ads.ts:67-126)
- Min clones: Any, 1+, 2+, 3+, 5+, 10+
- Min days: Any, 7+, 14+, 30+, 60+, 90+ days live
- Min likes: Any, 50+, 100+, 500+, 1k+
- Media: image, video, carousel
- Sorts: Latest added (default), Longest running, Most cloned, Most likes, Most comments, Most shares, AI score
- Query scopes: Search everywhere, Ad copy only, Advertiser / page, Landing page text, Domain / offer URL

---

## 5. Database RPCs and aggregations

- **vault_search(p jsonb, p_offset=0, p_limit=40 (max 1000), p_ids_only=false)** (latest: dz/0028 + 0039/0040 patches)
  - Base set: deleted_at IS NULL and vx_has_creative
  - Filters (p keys):
    - `ids` (id or external_id), `industry`, `category` (or tag `cat:<cat>`), `platforms[]`, `sources[]`, `networks[]`, `media[]`
    - `min_clones`, `min_likes`, `min_score` (stored ai_score), `min_days` (vx_days)
    - `brand` (brand key), `domain` (exact lower landing_domain), `offer` (vx_offer_key)
    - `tracker` (`tracked` or comma list matched against vx_tracker_keys), `country` (vx_countries contains)
    - `tag`: vx_tags normalised with `_`/`-`/spaces collapsed, exact match
    - `angle`: lower trimmed `ad_creative_analysis.short_angle` equals the value, status ok
    - `winners` (`all` = AND of the 3 gates, otherwise OR)
    - `period_days` (inPeriod logic), `added_after` (vx_added >)
    - `q` + `scope`: all → vx_text_all substring or LP ids; copy; advertiser (brand); domain; landing (`landing_ids` passed from client LP full-text search)
  - `dedupe=true`: DISTINCT ON vx_dedupe_key, keeping the highest ai_score, then the lowest external_id
  - Sort keys:
    - longest = vx_days; clones; likes; comments; shares; score = ai_score
    - then vx_added DESC; for "latest", ai_score DESC; then discovered_at, created_at, id DESC
  - Returns `{total, rows:[...]}`
    - row fields: id, external_id, brand, platform, industry, category, title, caption, media_type, thumbnail_url, video_url, fetched_via, started_running, fetched_date, discovered_at, created_at, days_running, clone_count, cta, landing_url, landing_domain, offer_url, offer_domain, tracking_url, region, ai_score, tags, countries, likes, comments, shares, views, post_url, network, tracker
    - or `{total, ids:[...]}` when ids_only
- **vault_facets()** → over live ads with a creative, returns:
  - `total`
  - `industries` {industry: n}
  - `categories` [{industry, category, n}]
  - `platforms` [distinct]
  - `sources` {source: n}
  - `networks_vsl` {network: n} (VSL only)
  - `countries` [{industry, category, country, n}]
  - `trackers` [distinct raw tracker strings]
- **vault_leaders(p_industry, p_period_days=0, p_limit=6)** (dz/0031)
  - Scope: live with creative, industry filter ('all' allowed), period on vx_added ≥ now − N days
  - Returns `{total, categories, domains, brands, offers}`. Each list = top p_limit by ad count `n` DESC
  - Each item `{key, n, winners (count meeting ANY gate), days (max vx_days)}`
  - brands are grouped by vx_brand_key (key = min(brand))
  - domains = lower landing_domain
  - offers = offer domain only when it differs from the landing domain ("true offers")
- **scope_insights(p jsonb)** (dz/0035 + 0036/0037/0040 patches)
  - Runs vault_search(p, ids_only) to define the scope set
  - Returns:
    - `total`
    - `running`: measured in the last 14d
    - `winners`: ALL three gates
    - `brands`: distinct brand
    - `domains`: distinct landing_domain
    - `videos`: media_type = video OR video_url not null
    - `images`
    - `avgDaysLive`: avg of days >0, rounded
    - `maxDaysLive`
    - `avgLikes`: avg of likes >0
    - `addedLast7` / `addedLast30`: vx_added
    - `added1d` / `added7d`: created_at
    - `categoryCount`
  - Dimension lists `categories`, `brandList`, `domainList`, `offerList` (true offers), `platforms`, `sources`, `countries`:
    - each item `{key, ads, running, brands, avgDaysLive, maxDaysLive, avgLikes, totalClones}`
    - top **40** per dimension, ordered by ads DESC then key
  - `angles`: grouped by lower(short_angle), `{key (short_angle), example (full angle), ads, running, brands, avgDaysLive, maxDaysLive, avgLikes, totalClones}`, top **25**, ads DESC
  - `timeline`: 30 days (current_date−29 … today), ads per vx_added day
  - `longestRunning`: top 8 by days `{id, brand, title, category, clone_count, days}`
  - `mostCloned`: top 8 with clone_count >0, clone_count DESC
  - `ids`: up to 1500, ordered by ai_score DESC then likes DESC
- **scope_options(p_q='', p_limit=8, clamp 1-50)** → `{brands, domains, offers}`
  - each `[{label, value, count}]`, filtered by substring, count DESC
  - offers are true offers only
- **record_daily_snapshot(_date = today UTC)** (cron `50 23 * * *` UTC)
  - For each live ad (left-joined to analysis with status ok), emits one row per dimension: domain (lower landing_domain), page (brand), category, hook (hook_type), format (ad_format)
  - Counts `ad_count` per (industry, category, dim, value); `new_ads` = created that UTC date
  - Upsert is idempotent. Returns the row count
- **snapshot_top_movers(_industry, _category, _dim, _per_type=12)**
  - last_d = max snapshot_date; prev_d = previous snapshot date
  - Sums ad_count across matching industry/category per date for dates ≥ last_d−7
  - cur = count at last_d; prev = count at prev_d; delta = cur − prev
  - Keeps only delta >0; ranks per dimension_type by delta DESC, then cur DESC; top clamp(1..50)
  - Returns `{dimension_type, dimension_value, current_count, previous_count, delta, series:[{d,v}] (8-day sparkline), last_date, prev_date}`, plus one `_dates` marker row
- **pick_unanalyzed_ads(_limit=20 (1-200), _retry_failed, _oldest)**: ads with media and no analysis (or a failed one when retrying), newest first unless `_oldest`
- **offer_audit_scan()**: flags ads whose offer domain is suspicious. Reasons:
  - "Offer is a big public site, not an advertiser page" (.gov, .edu, wikipedia, amazon, walmart, ebay, forbes, cnn, bbc, nytimes, reddit, twitter, x.com, tiktok, instagram, pinterest, bing, yahoo, microsoft, github, zoom, paypal, stripe, shopify.com, wordpress.com)
  - "Same offer site shows up on ads from many unrelated advertisers" (≥3 distinct brands and ≥2 industries)
  - "Reported by the side browser and not yet confirmed"
- **offer_audit_act(ad, action, url)**: actions verify, clear (removes the offer across same-landing siblings), confirm (sets the offer and chain_source 'reviewed'), no_offer
- **detect_tracker(...)**: present in types only; SQL not in the repo
- **Helpers**: vault_trim, vault_norm_*, vault_tags, vault_country_text, vault_countries, vault_days_live, vault_added_at, vault_tracker_keys, vault_has_creative, vault_offer_key, vault_join, vault_text_*, vault_dedupe_key, ad_is_shared_public, has_role, can_edit, is_advault_admin, is_role_admin, my_spy_requests_today, resolve_share_link

---

## 6. Single-ad detail view (AdDetailSheet.tsx), in on-screen order

**Header**
1. Title: brand (clickable to filter by brand) or "Unknown advertiser", plus a chip "{N} ad(s)" (brand ad count)
2. Links row:
   - "Advertiser analysis" button → /teardown?brand
   - "Landing page analysis" (if landing_domain)
   - "Offer analysis" (if a separate offer domain exists)
3. Chip row:
   - Industry chip (tinted; "Unsorted" if null)
   - Category chip
   - Source chip (normalised fetched_via)
   - **Angle chip**: "ANGLE {short_angle} {count of ads with that angle}" → Vault filtered by angle; tooltip shows the full angle
   - "Suggest category" control (not read-only)
   - text "{Platform} · {media kind or 'creative'}"
4. "Funnel: {Quiz funnel | Advertorial pre-sell | Direct VSL | Lead form | Product page}" chip. Tooltip "How the click converts, detected from the landing page"
5. Mini table:
   - "Landing page" {domain} (click to filter) / "unknown"
   - "Offer page" {domain} (click to filter offer) / "same site as the landing page / not found yet"

**Top-left: creative and actions**

6. Facebook-style ad card:
   - avatar initial; brand; "{started_running or fetched_date} · {Platform}"
   - caption (5-line clamp, "Show more"/"Show less" if over 240 chars)
   - full uncropped media (video player, image, or placeholder; "Video unavailable")
   - link bar: DOMAIN (uppercase), title, CTA button (cta or "Learn more") → landing_url
   - "Carousel creative" footer for carousels
7. Landing-page screenshot tile beside the creative (only if a screenshot exists):
   - "Landing page" + host link; click → full-screen viewer ("Zoom in"/"Fit width", "Open page"); "View full page" hover
8. Action buttons:
   - Share ad
   - Save to swipe file / In swipe file
   - Download creative
   - Landing page (opens landing_url)
   - Offer (opens offer_url)
   - View Facebook post / View in Ad Library (primary)
   - Ad Library (if both exist)
   - Search advertiser in Ad Library (keyword search on landing_domain or brand)

**Top-right: numbers panel**

9. Metrics:
   - **AI score** "{live score}/100"
   - **Days live** "{n}d" or "—"
   - **Duplications** "{clone_count}" or "—" when 0
10. **Engagement** (if any): views, likes, comments, shares tiles
11. "Running {n} days as of {measured date}." and "Cloned / duplicated {n} times" (amber, plus " — proven winner" at ≥5)
12. **Score breakdown — {Elite|Strong|Average|Weak}**: per part "{label} {value}/{max}", a bar and the hint line; "Branded penalty" shown as a red negative bar
13. **Add to a board**: select "Choose a board" / "Create a board first to organise this ad."

**Bottom-left**

14. **Creative framework** (CreativeBreakdown):
    - buttons "Clone this angle" (copies an LLM rewrite brief) and "Copy hook"
    - "Show matches in: All industries | {industry}"
    - badges, each with a count of analysed ads sharing it: framework, ad_format, "Hook: {hook_type}", format tags
    - **Hook** box
    - "Angle: {short_angle}" link
    - summary
    - Element table: columns "#", "Script / copy" (element label + mm:ss–mm:ss + text), "What's on screen"
    - **Visual beats** list (time — visual — role)
    - "Full transcript" (collapsible)
    - Empty state: "This creative hasn't been analysed yet…"
15. **Landing page** / "Search the landing page" (LandingPagePanel):
    - "Captured {date} · {N} words · HTTP {code}"; final_url link
    - screenshot ("Page text captured, no screenshot sent for this ad.")
    - buttons "Landing page PDF", "Full screenshot"
    - search box "Find a word on this landing page" → "{n} matches" / "No match on this page", with up to 5 highlighted excerpts (90 chars before, 120 after)
    - page text preview of 1200 chars with "Show the full page text"
    - empty states: "No landing page captured yet", "No page text captured for this landing page yet."
16. **Funnel path**, one of:
    - Hop list (≥2 hops): "Traced by AdVault" or "From bot"; rows labelled Ad / Hop N / Offer with host and full URL; "Copy full path"
    - No hops + advertorial/redirect: badge "advertorial funnel", path `lander → redirected host → offer page (not captured)`, explanation text
    - No hops otherwise: badge "no redirects found" / "couldn't trace" / "not traced yet", with explanation text (hourly tracing mentioned)

**Bottom-right**

17. **Title**
18. **Primary text** (+ Copy)
19. **Details** grid (rows hidden when empty):
    - Advertiser (link), Source, Platform, Region
    - Started running, Fetched date, Discovered (local datetime)
    - CTA
    - Landing domain (link), Offer (link; separate offer only), Offer link
    - Tracking URL
    - Network (normalised, includes "Unclassified")
    - Tracking software (one link per tracker)
    - External ID
20. **Countries** chips
21. **Tags**: "Show matches in All industries | {industry · category}"; topic_tags (→ /frameworks?tag) and useful ad tags (→ /vault?tag)
22. **Source fields** (admins only): raw key/value dump

**Ad card (grid) fields, in order** (AdCard.tsx)
- Media
- Overlay top:
  - "New" (≤2d)
  - industry chip
  - category chip
  - save bookmark / select checkbox
- Overlay bottom: "{n}d live", title / caption / brand / "Untitled creative"
- Brand (filter) + media kind icon
- landing_domain (filter)
- "offer: {domain}" (when it differs from the landing domain)
- tracker chips
- caption (2 lines)
- "Started {date} · {n}d live" or "First seen {date}" / "Start date unknown"
- "Measured {date}" / "Added {date}"
- country chips
- "{n} cloned" (+ Winner) and engagement chips (views/likes/comments/shares)
- platform, source chip, network chip (if not Unclassified), region
- "AI score {n} · {tier}" with a bar

**Freshness indicator** (Freshness.tsx)
- "Last fetched {relative} · {total} ads"
- chip "+{n} in 24h"
- tooltip with the exact time

---

## 7. Landing page, funnel, redirect and tracker data captured

- **Bot-sent LP** (landing-pages.server.ts). Input aliases:
  - text from text/content/page_text/body_text/markdown, or HTML from html/page_html/body_html/raw_html (stripped)
  - screenshot from screenshot_url/screenshot/image_url/snapshot_url/screenshot_base64
  - pdf from pdf_url/pdf/document_url/pdf_base64
  - url from url/landing_url/page_url; final_url from final_url/resolved_url/offer_url
  - title, description/meta_description, status_code/http_status, lang/language, captured_at/scraped_at/fetched_at
- Storage:
  - media mirrored to the internal bucket (≤15MB, 25s timeout); a row is stored only if text, screenshot or pdf exists
  - upsert per ad
  - triggers a rescore
- **AdVault self-capture** (landing-capture.server.ts; hourly cron `:50`, 60 ads):
  - targets ads with landing_url, no LP row and never attempted
  - fetches as iPhone Safari (15s)
  - ScreenshotOne full page: 390×844 viewport, jpg q70, ads and cookie banners blocked, 40s
  - stores title, meta description, html lang, status, final URL
  - siblings with the same landing_url share the capture
  - status `captured` / `text_only` / `failed` / `bot`
  - provider 401/402/403/429 stops the run and writes `job_alerts` 'landing-screenshots'
- **Redirect tracer** (redirect-trace.server.ts; hourly cron `:40`, 150 ads):
  - follows HTTP 3xx, meta refresh and script-only JS redirects; max **10 hops**, 8s per hop
  - on a content page, follows the main offer link up to **2 clicks deep** (advertorial → presell/quiz → offer)
  - offer link pick order: CTA-text link first, then the most-repeated outbound link, then an app-store link
  - CTA text regex includes: see top/best rated, check price/availability/eligibility, see if you, qualify, claim, order/buy/shop now, get yours/started/access, visit official, learn more, continue, click/tap here, try it, yes I want, apply now, get/see offer, sign up, join, register, download, install, start now, unlock, reveal, next, proceed
  - Excluded hosts: facebook, instagram, twitter, x.com, google.com, googleapis, gstatic, youtube, tiktok, pinterest, w3.org, schema.org, cloudflare, jsdelivr, fonts.*
  - App stores: apps.apple.com, itunes.apple.com, play.google.com, onelink.me, app.link, adj.st, app.adjust
  - Copies the RedTrack click id (rtkcid/clickid/cid) onto /click links
  - Writes redirect_chain, chain_source 'traced', chain_trace_status, and the offer when the last hop is on a different root. Bot chains (>1 hop) are never overwritten
- **Offer re-check** (recheckOffers):
  - industry priority Lead Gen, VSL, Telehealth, Arbitrage, Others, Amalfa, E-commerce
  - extends bot chains from their last hop
  - offer = last non-tracker hop on a root different from the lander
- **Side browser** (side-browser.ts): manual or assisted reports `found` | `no_offer` | `dead` | `blocked`
  - rejects offers on the same root as the lander, on login pages, PDFs or ad networks
- **Detail chain display** (fetchAdRedirectChain): tracking_url + redirect_chain + offer_url, http(s) only and deduped. Shown only when there are ≥2 URLs
- **Ad Library / FB post derivation**:
  - external_id `meta_<id>`, or source_fields ad_library_url/facebook_ad_url/source_url/library_url, or facebook_ad_id/ad_archive_id/library_id/fb_ad_id (≥8 digits)
  - post: post_url/fb_post_url/facebook_post_url/permalink/post_link, or post_id/fb_post_id/facebook_post_id
- **Tracker detection at ingest**: explicit name, else host match on tracking_url plus chain URLs (§4.5)

---

## 8. Other notable rules (data quality, dedupe, blocking, freshness)

- **Blocked brands at ingest** (blocked-brands.ts; DB `blocklist_rules` overrides the static list when any enabled rule exists):
  - Brands: best egg, chewy, braman bmw, american express, amex, capital one, chase, discover card, geico, progressive insurance, state farm, allstate, amazon.com, walmart, target, costco, nike, verizon, t-mobile, at&t
  - Domains: bestegg.com, chewy.com, edmunds.com, americanexpress.com, capitalone.com, chase.com, discover.com, geico.com, progressive.com, statefarm.com, allstate.com, amazon.com, walmart.com, target.com, costco.com, nike.com, verizon.com, t-mobile.com, att.com
  - Brand match = equals or *contains* (so "target" blocks any brand containing "target")
  - Domain match = equal or subdomain
  - Blocked rows go to `blocked_ingest_log` with reason labels "Branded advertiser" / "Blocked domain" / "Category mismatch" / "Other"
- **Clone merge at ingest**:
  - same fingerprint (domain + copy ≥10 chars) → existing row's clone_count +1, upgraded to video if the twin has a real video
  - known external_ids are refreshes, not clones
  - new mergeable rows default to clone_count = 1
  - **Implication**: the "1+ clone" winner gate is met by almost every ad with copy, so "any gate" winners ≈ nearly everything. The Duplications metric shows "1" for an original
- **Category canon trigger** (dz/0024), runs on insert or update of category/industry:
  - exact match kept
  - else fuzzy match (lowercase, alphanumerics only, trailing "s" stripped)
  - else the industry's fallback category
  - logged to `category_drift_log`
- **Category audit reset**: copy, brand, domain, transcript, tags or source changes clear `category_audited_at`
- **Soft delete**: hidden everywhere (admin trash at /admin-deleted). Re-ingest restores
- **Hidden without creative**: rows without a thumbnail or video are excluded from grids, facets, leaders and snapshots (snapshots don't filter on creative, only on deleted)
- **Freshness/staleness inconsistencies**:
  - Freshness `total` counts all rows, including deleted and creative-less ones
  - The grid excludes both
  - "New" uses fetched_date first, while "Latest added" uses discovered_at first
  - The client ad list is cached in IndexedDB for 24h (stale up to 5 min before refetch)
- **Score inconsistency**: cards, sort and min-score use the stored `ai_score`; the detail headline uses a live recompute with chain, LP and analysis inputs
- **Winner inconsistency**: leaders = ANY gate, scope_insights = ALL gates
- **"Running" is a proxy**: measured within 14 days (scope_insights). There is no true active/inactive status column
- **Offer audit**: suspicious offers are flagged (big public sites; shared across ≥3 brands and ≥2 industries; unconfirmed side-browser reports)
- **Junk copy**: video-player text ("0:00 / 2:39", "Low impression count", "This content isn't available", "Sponsored · Paid for by") is stripped before scoring
- **Security note for the redesign team**: the reference cron migrations (dz/0010, 0011) embed a hard-coded ingest token and project URL in plain SQL. Do not carry this pattern over

