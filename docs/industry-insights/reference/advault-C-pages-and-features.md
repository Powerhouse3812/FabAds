# Inventory C — Pages & Features (everything except /insights)

Source: IDC AdVault reference codebase, `src/`. All paths are relative to `src/`. Labels are copied exactly from the code.
Legend: ⚠ = gap, inconsistency or UX risk worth knowing during the redesign.

---

## 1. Navigation map

**Shell** (`components/AppShell.tsx`)
- Sidebar is 240px, sticky, desktop only (`md:flex`) (`AppShell.tsx:87`).
  - Logo block: "IDC AdVault" / "Winning ads intelligence". It links to `/vault` (`:88-96`).
  - `<Freshness>` widget sits under the logo: "Last fetched {relative} · {total} ads" plus a "+N in 24h" pill. The tooltip says "Last fetched {exact} · {total} ads · {n} added in the last 24 hours" (`components/Freshness.tsx:121-138`).
  - Footer card: "Signed in", then name, email and a role pill (admin/editor/viewer), then a "Sign out" button (`:126-139`).
- Mobile: top header with the logo and a row of **icon-only** nav links with no labels, plus a logout icon (`:143-160`). ⚠ This is weak for discoverability: 12 unlabeled icons for an admin.
- Active state matches the exact pathname only (`:102`).
- Admin-only global banner: "Landing-page screenshots paused: {message} ({time})" from `job_alerts` with status=error. It polls every 5 min (`:53-61, 161-165`).

**Menu items in order** (`AppShell.tsx:29-44`). The nav has no grouping or section headers; it is one flat list.

| # | Label | Route | Icon | Visible to |
|---|---|---|---|---|
| 1 | Ad Vault | /vault | LayoutGrid | all signed-in |
| 2 | Insights | /insights | BarChart3 | all |
| 3 | Creative Report | /teardown | Crosshair | all |
| 4 | Frameworks | /frameworks | BookOpen | all |
| 5 | Assistant | /assistant | MessageSquare | all |
| 6 | Boards | /boards | Layers | all |
| 7 | Swipe file | /saved | Bookmark | all |
| 8 | Alerts | /alerts | BellRing | all. Shows a count badge of new saved-search matches ("99+" cap) (`:116-120`) |
| 9 | Spider | /spy-requests | Radar | all |
| 10 | What's new | /whats-new | Sparkles | all |
| 11 | Admin | /admin | ShieldCheck | admin only (`:51`) |
| 12 | Blocked | /blocked | Ban | admin only |

- ⚠ Labels don't match routes or page titles:
  - "Creative Report" = `/teardown`; its CTAs say "Advertiser analysis" / "Competitor teardown".
  - "Spider" = `/spy-requests`; the page title is "Request a spider".
  - "Swipe file" = `/saved`.
- Admin sub-pages are not in the nav. They are reached only from link buttons on `/admin` (`routes/_authenticated/admin.tsx:138-179`):
  - Audit manifest export → /admin-manifest
  - Spider queue → /admin-spy-requests
  - Category QA → /admin-category-qa
  - Category corrections → /admin-corrections
  - Deleted (7-day restore) → /admin-deleted
  - Offer link audit → /admin-offer-audit
  - Industry Insights push → /admin-insights-push

**Public (no auth) routes**
- `/` public landing page
- `/auth` sign in
- `/reset-password`
- `/s/$code` short share link
- `/a/$id` shared ad
- `/b/$id` shared board
- `/api-docs` bot ingest API docs
- `/spider-queue` open spider queue, `robots: noindex` (`routes/spider-queue.tsx:13`). ⚠ Shows requester IDs publicly.

**Auth gate**: `_authenticated/route.tsx` redirects to `/auth?next=…` when there is no user, and clears a dead session (`routes/_authenticated/route.tsx:4-18`).

---

## 2. Industry homepage

Two different things exist: the public marketing landing page (`/`) and the in-app industry homepage (the Vault with an industry picked).

### 2a. Public landing `/` (`routes/index.tsx`)
- If the user is already signed in, they are redirected straight to `/vault` (`:46-60`).
- Sections in order:
  1. Header: logo and a "Team sign in" link (`:71-84`).
  2. Hero: eyebrow "Internal · Idea Clan", H1 "Every winning ad, in one vault." (`:88-94`).
     - Sub-copy: "Spy on what's live across Amalfa, VSL, Lead Gen, E-commerce and Arbitrage — nested by category, ranked by longevity and clone count, refreshed every day." (`:96-97`)
     - CTA: "Enter the vault →" goes to /auth (`:101-106`).
  3. Stat strip (`:109-119`): `{total} winning creatives · {INDUSTRIES.length} industries · +{last24h} added in 24h · updated daily`.
  4. `<WinnerCriteria>` panel (see 9).
  5. "A mix from every vertical": "12 recent winners spread across industries, categories and advertisers." plus a "See all {total} →" link (`:125-149`).
     - Card fields: thumbnail, industry chip, brand, title or category, "{n}d live" (`:164-196`).
- Showcase logic (`lib/showcase.functions.ts:231-327`):
  - Pull the latest 400 ads that have a thumbnail.
  - Drop fbcdn/instagram URLs and duplicates.
  - Round-robin by source, then industry|category, then brand.
  - Take 12.
- Copy inconsistency: ⚠ the hero names 5 industries, but INDUSTRIES actually has 7: Amalfa, VSL, Telehealth, Lead Gen, E-commerce, Arbitrage, Others (`lib/ads.ts:18-26`).

### 2b. In-app industry homepage = `/vault?industry=X` with no category, brand, domain or offer (`vault.tsx:1202-1210`)
- Renders `<IndustryLeaders>` (`components/IndustryLeaders.tsx`).
- Header: "Top in {industry}" with "{periodLabel} · {n} ads", plus a link "Full {industry} insights →" to `/insights?industry=` (`:239-251`).
- 4 columns, top 6 each (`fetchIndustryLeaders(industry, periodDays, 6)`, `:227`). Data comes from SQL RPC `vault_leaders(p_industry, p_period_days, p_limit)` (`lib/vault-search.ts:139-143`).

| Column | Row click | Extra |
|---|---|---|
| Top categories (FolderTree) | sets the vault category filter (`:257`) | — |
| Top landing pages (Globe) | `/vault?industry&domain=` | ✨ icon → `/teardown?domain=` |
| Top advertisers (Store) | `/vault?industry&brand=` | ✨ icon → `/teardown?brand=` |
| Top offers (ArrowRight) | `/vault?industry&offer=`. Tooltip: "Where people go after the landing page" | — |

- Row metric: `{n} · {days}d`. The tooltip says "{winners} winners · longest {days} days live" (`:356-358`).
  - LeaderRow = {key, n, winners, days} (`lib/vault-search.ts:124-129`).
- Period follows the vault Period select (default 60d).
- Hidden entirely when total = 0 (`:231`). Loading shows 5 skeleton rows per column.
- Cached 10 minutes.

### 2c. Category leaders = `/vault?category=X` (`components/CategoryLeaders.tsx`, `vault.tsx:1212-1219`)
- Heading: "Top landers, pages & offers — {category}". Link: "View all for this category →" goes to `/insights#leaders?industry&category`.
- 3 columns, top 5 each:
  - "Top landers" (landing_domain)
  - "Pages" (brand)
  - "Top offers" (offerDomain, falling back to the landing domain)
- Ranking: ads desc, then running desc, then maxDaysLive desc (`:386-389`).
- Row: `{ads} ads · {maxDaysLive}d`, a link to the filtered vault, and a ✨ link to teardown (`:473-487`).
- Computed client-side from up to 5,000 matching ads (`vault.tsx:466-471`).

### 2d. Contextual CTAs above the vault grid (`vault.tsx:1175-1200`)
- "View industry insights" → /insights?industry&category (when an industry or category is set).
- "Advertiser analysis" (when brand is set) or "Landing page analysis" (when domain or offer is set) → /teardown.

---

## 3. Vault / explore (`routes/_authenticated/vault.tsx`)

### 3a. Layout in on-screen order
1. **Sticky top filter bar** (`:657-947`). It wraps; every control below is inline in one bar:
   - search form, Industry, Tracker, Period, Min days, Min likes, Min clones, Source chips, Network chips, Country select, Sort, Clear, Export CSV, Select, Save search, Freshness
2. **Left rail** (256px, `lg` only) (`:952-1107`):
   - Industry list with counts. Admins also see an "Issues" entry.
   - Category list (only when an industry is picked)
   - Platform chips
   - Country chips
   - Media chips
   - Footer: "{n} tracked creatives / {7} industries"
3. Main column:
   - mobile Media chips
   - `WinnerCriteria` strip
   - context CTAs
   - IndustryLeaders / CategoryLeaders
   - result count and active chips
   - masonry grid (1/2/3/4 columns)
   - infinite scroll

⚠ The same filter appears in two places: Country is both a select (top bar) and chips (rail), and Media appears twice on mobile. The top bar holds ~16 controls.

### 3b. Filters, with every option value (`lib/ads.ts`)

| Filter | URL param | Control | Options (value → label) | Default |
|---|---|---|---|---|
| Keyword | `q` | input + Enter/"Search" button. Placeholder: "Search brands, titles, captions, domains, offers, tags… then press Enter" (`:671`) | free text. Applies only on submit (`:216-219`) | "" |
| Search scope | `scope` | select (`QUERY_SCOPES`, `ads.ts:726-732`) | all → "Search everywhere"; copy → "Ad copy only"; advertiser → "Advertiser / page"; landing → "Landing page text"; domain → "Domain / offer URL" | all |
| Industry | `industry` | select + rail list (`INDUSTRY_OPTIONS`, `ads.ts:30-33`) | all → "All industries"; Amalfa; VSL; Telehealth; Lead Gen; E-commerce; Arbitrage; Others | all. Changing it resets category. Leaving VSL clears networks (`:233-234, 384-388`) |
| Category | `category` | rail list (only when an industry is set), with counts "(n)". Empty categories are hidden (`:524-528`) | from facets + `CATEGORY_SUGGESTIONS`. Full lists below | all → "All categories" |
| Tracker | `tracker` | popover multi-select (`:717-761`) | all → "All ads"; tracked → "Tracked only (any tracker)"; plus checkboxes of trackers present in the data. Canonical list: RedTrack, ClickFlare, Binom, Voluum, CPV Lab, BeMob, Keitaro, FunnelFlux, ThriveTracker, TUNE, Everflow, Trackier, ClickMagick, Branch, AppsFlyer, HYROS, Triple Whale, Northbeam (`ads.ts:1371-1375`). The trigger label shows "All ads" / "Tracked only" / the single tracker name / "{n} trackers" | all |
| Period | `period` | select (`PERIOD_OPTIONS`, `ads.ts:94-103`) | 7 "Last 7 days"; 14 "Last 14 days"; 30 "Last 30 days"; 60 "Last 60 days"; 90 "Last 90 days"; 180 "Last 6 months"; 365 "Last 12 months"; all "All time". Meaning: the ad was live during the window OR was fetched during it (`ads.ts:200-216`) | **60** (`ads.ts:105`). Ignored when `ids` is set |
| Min days live | `days` | select (`MIN_DAYS_OPTIONS`, `:76-83`) | 0 "Any duration"; 7 "7+ days live"; 14 "14+ days live"; 30 "30+ days live"; 60 "60+ days live"; 90 "90+ days live" | 0 |
| Min likes | `likes` | select (`MIN_LIKES_OPTIONS`, `:85-91`) | 0 "Any likes"; 50 "50+ likes"; 100 "100+ likes"; 500 "500+ likes"; 1000 "1k+ likes" | 0 |
| Min clones | `clones` | select (`MIN_CLONE_OPTIONS`, `:67-74`) | 0 "Any clones"; 1 "1+ clones"; 2 "2+ clones"; 3 "3+ clones"; 5 "5+ clones"; 10 "10+ clones" | 0 |
| Source | `sources[]` | chips with counts, under the "Source" title (`:811-828`) | normalized collector names: AdSpy, SpyHero, ForePlay, Meta Ad Library, TikTok Creative Center, or the raw name (`ads.ts:907-916`). Sources under 100 ads, plus "Unknown"/"The Insider", collapse into an **"Others"** chip (`:355-374`) | none |
| Network | `networks[]` | chips with counts. **Only shown when industry = VSL** (`:536-543`) | Clickbank, Digistore24, Maxweb, BuyGoods, ClickBetter, Warriorplus, JVZoo, then "Unclassified" last (`ads.ts:918-950`). The NETWORKS constant also lists "DigiStore", but normalization folds it into Digistore24 | none |
| Country | `country` | select ("All countries") + rail chips ("All") | only countries that have ads in the current industry/category. US is always first and shown as "★ USA". The rest are sorted by count (`vault-search.ts:108-122`) | all |
| Platform | `platforms[]` | rail chips | normalized: "Facebook & Instagram", TikTok, YouTube, LinkedIn, Snapchat, Pinterest, Reddit, X (`ads.ts:877-897`). Only platforms present are shown | none |
| Media | `media[]` | chips | image, video, carousel (`ads.ts:116`) | none |
| Brand | `brand` | set by clicking a brand on a card or sheet, or by a leaders link. Chip "Brand: X" | — | — |
| Domain | `domain` | clicking a landing domain. Chip "Domain: X" | — | — |
| Offer | `offer` | clicking "offer: X". Chip "Offer: X" | — | — |
| Tag | `tag` | from a tag badge in the detail sheet. Chip "Tag: X" | — | — |
| Angle | `angle` | from the Angle chip / creative breakdown. Chip "Angle: X" | — | — |
| Ad ids | `ids[]` | set by Frameworks "Open N ads in Vault" (max 300) | — | ⚠ no chip; an invisible filter |
| Min AI score | `score` | **URL only, no UI** (`:427`) | number | 0 |
| Dedupe | `dedupe=1` | **URL only** | — | off |
| Winners mode | `winners=any|all` | **URL only** (`:269-270`) | any / all gates | none |

- Brand, domain and offer are mutually exclusive when clicked: picking one clears the others (`:390-410`).
- ⚠ `clearAll` and `hasFilters` ignore tag, angle, ids, score, dedupe, winners and scope (`:546-581`). "Clear all" can leave hidden filters active.
- Category lists (`lib/subcategories.ts`):
  - **VSL**: Weight Loss, Blood Sugar / Diabetes, Brain & Memory, Hearing & Tinnitus, Vision, Prostate, Dental, Joint & Back Pain, Skin & Anti-Aging, Nail & Fungus, Hair Growth, Men's Health, Women's Health, Gut & Detox, Heart & Blood Pressure, Sleep & Anxiety, Make Money / Bizopp, Crypto & Trading, Survival & Self-Defense, Relationships & Manifestation, Pets, Other
  - **Telehealth**: Weight Loss, GLP-1, Longevity & NAD+, Labs & Diagnostics, ED, TRT, HRT, Mental Health, Skin & Derm, Hair Loss, Sleep, Primary Care, Other
  - **Lead Gen**: Auto Insurance, Health Insurance, Life Insurance, Medicare, Home & Property Insurance, Insurance (Other), Solar, Roofing, HVAC & Plumbing, Home Services, Local Clinics & Healthcare, Legal & Mass Tort, Loans & Mortgage, Debt & Tax Relief, Education & Courses, Real Estate, Automotive, Jobs & Recruiting, B2B / SaaS, Banking & Finance, Sweepstakes, Surveys & Rewards, Government & Senior Benefits, Home & Auto Warranty, Legal & Permits, Business & Coaching, Firearms & Concealed Carry, Other
  - **Others**: Dance & Fitness, App Installs, Gaming, Finance & Fintech, Crypto & Trading, Insurance, Education & Courses, Real Estate, Travel, Automotive, Dating, SaaS, AI & Digital Products, Competitions & Raffles, Advocacy & Non-Profit, Events & Tickets, News & Media, Food & Dining, Home Services, Jobs & Recruiting, Entertainment & Streaming, Astrology & Psychics, Other
  - **Amalfa**: Demi-fine & Fashion
  - **E-commerce** and **Arbitrage**: free text, no suggestions (`ads.ts:36-44`)

### 3c. Sort (`SORTS`, `ads.ts:118-131`), URL `sort`
- latest "Latest added" (**default**)
- longest "Longest running"
- clones "Most cloned"
- likes "Most likes"
- comments "Most comments"
- shares "Most shares"
- score "AI score"

### 3d. Views
- One view only: a **masonry card grid** (CSS columns, 1/2/3/4 columns by breakpoint) (`:1278`). There is no list or table view and no density toggle.
- Infinite scroll: 40 per page, triggered by an IntersectionObserver with a 600px root margin (`:187, 480-491`).
- Results line: "{total} of {facetTotal} creatives" when filtered, otherwise "{total} creatives". Removable active chips follow, then "Clear all" (`:1222-1250`).
- Admin-only "Issues" view replaces the grid (`:1109-1158`).
  - Title "Error ads": "Admin-only. Rows the collector imported with no image and no video — hidden everywhere else in the app until media lands."
  - Table columns: External ID, Brand, Industry, Media, Source, Added.

### 3e. Ad card fields, in order (`components/AdCard.tsx`)
- Media: video preview (4:5) or image (square).
- Top-left overlay: "New" badge (fetched within 2 days, `ads.ts:142-147`), industry chip (colored by industry hue, `ads.ts:46-65`), category chip.
- Top-right overlay: bookmark toggle ("Save to swipe file" / "Remove from swipe file"), or a select checkbox in select mode.
- Bottom overlay: "{n}d live" pill, then title (fallback chain: caption, brand, "Untitled creative").
- Body:
  - brand (click filters by brand; tooltip "Show all ads from X") and media kind icon + label
  - landing domain (click filters; tooltip "Show all ads on X")
  - "offer: {domain}" in green, only when it differs from the landing domain (click filters)
  - tracker pills (tooltip "Tracked with X")
  - caption (2 lines)
  - "Started {date} · {n}d live", or "First seen {date}", or "Start date unknown"
  - "Measured {date}" / "Added {date}"
  - country chips
  - clone badge "{n} cloned", plus a gold "Winner" sub-badge when ≥5 clones (`ads.ts:109-114`). Tooltip: "Cloned / duplicated N times"
  - engagement pills: views, likes, comments, shares (only those reported)
  - footer: platform · source pill · network pill (if classified) · region
  - "AI score {n} · {tier}" with a progress bar
- Score tiers (`lib/score.ts:448-457`): ≥80 Elite, ≥60 Strong, ≥40 Average, else Weak.

### 3f. Ad detail sheet (`components/AdDetailSheet.tsx`)
A right drawer, width 92vw up to 1500px. In-app links close it (`:280-290`).

- **Header**:
  - brand (clickable) and a "{n} ads" count for the brand
  - buttons: "Advertiser analysis" (primary), "Landing page analysis", "Offer analysis" → /teardown
  - chips: industry, category, source, **Angle chip** (links to `/vault?angle=`), "Wrong category?" (`SuggestCategory`), platform · kind
  - "Funnel: {type}". Types: Quiz funnel / Advertorial pre-sell / Direct VSL / Lead form / Product page, detected from landing page text (`:240-249`)
  - "Landing page" and "Offer page" rows
- **Top-left**:
  - Facebook-style ad preview (page header, primary text with "Show more/less" over 240 chars, uncropped creative, link bar) (`:79-130`)
  - landing page screenshot alongside, when captured
- Action buttons (`:425-482`):
  - "Share ad"
  - "Save to swipe file" / "In swipe file"
  - "Download creative"
  - "Landing page" ↗
  - "Offer" ↗
  - "View Facebook post" or "View in Ad Library"
  - "Ad Library"
  - "Search advertiser in Ad Library"
- **Top-right metrics panel**:
  - Metric tiles: "AI score" (n/100), "Days live", "Duplications"
  - "Engagement" grid
  - "Running {n} days as of {date}."
  - "Cloned / duplicated {n} times — proven winner" (≥5)
  - **"Score breakdown — {tier}"**, with parts (`lib/score.ts:366-439`):
    - Longevity /18
    - Likes /16
    - Comments & shares /8
    - Clones /16
    - Performance craft /42
    - Branded penalty (negative)
    - Each part has a hint, e.g. "likes not reported by source". Missing engagement is partially redistributed (60%).
  - "Add to a board" select ("Choose a board"). Empty state: "Create a board first to organise this ad."
- **Bottom-left**:
  - "Creative framework" (`CreativeBreakdown`):
    - "Clone this angle" copies a rewrite brief for ChatGPT/Claude
    - "Copy hook"
    - "Show matches in All industries | {industry}"
    - badges for framework, format, "Hook: X" and tags, each with counts and a link to /frameworks
    - Hook box, then "Angle:" (links to vault), then summary
    - element table: "# | Script / copy | What's on screen"
  - "Search the landing page" / "Landing page" (`LandingPagePanel`): screenshot, page text, "Find a word on this landing page"
  - "Funnel path": redirect hops "Ad → Hop n → Offer", "Traced by AdVault" / "From bot", "Copy full path"
    - Status badges: "no redirects found" / "couldn't trace" / "not traced yet" / "advertorial funnel"
- **Bottom-right**:
  - "Title"
  - "Primary text" (copy button)
  - "Details" rows: Advertiser (link), Source, Platform, Region, Started running, Fetched date, Discovered, CTA, Landing domain (link), Offer (link), Offer link, Tracking URL, Network, Tracking software, External ID
  - "Countries"
  - "Tags", with a "Show matches in All industries | {industry · category}" scope. Topic tags link to /frameworks; raw tags link to /vault.
  - "Source fields" (admin only)
- `readOnly` mode (public share pages) hides: suggest category, save, add to board, landing page search (`:349, 428, 568, 604`).
- ⚠ The sheet uses a **live re-computed score** (`:250-260`), while the card shows the stored `ai_score`. The two numbers can differ for the same ad.

### 3g. Bulk actions (select mode) (`vault.tsx:883-912, 1331-1456`)
- Toolbar "Select" toggles to "Done selecting". Cards then become toggles and get a ring when selected.
- Floating bottom bar:
  - "{n} selected"
  - "Select all {total}" / "Clear" (fetches all matching IDs server-side)
  - **"Download creatives"**: zip with "{done}/{total}" progress. Toast: "Downloaded N creatives · M could not be fetched"
  - **"CSV"**
  - **"JSON context"**
  - **"Add to board"**: popover. "New board from {n} ads" with a name input (pre-filled suggestion: Offer: X › brand › domain › category › industry › "Swipe file"), or "Or add to an existing board" (`components/AddSelectionToBoard.tsx`)
  - "Exit"
- Non-select toolbar action: **"Export CSV"** of all matches, capped at 50,000 (`vault-search.ts:96`). Toasts: "Exported N ads to CSV" / "CSV export failed. Try a narrower filter."

### 3h. Saved searches (from the Vault)
- Button "Save search" opens a dialog:
  - Title: "Save this search"
  - Body: "You'll be alerted on the Alerts page whenever new ads match these filters."
  - Placeholder: "e.g. AdSpy VSL winners, 2+ clones"
  - Live summary line via `describeSearch`
  - Toast: "Search saved — you'll be alerted on new matches" (`vault.tsx:913-945`, `lib/searches.ts`)
- Stored as the whole URL search object in `saved_searches.filters` (`vault.tsx:281`).
- ⚠ Matching and counting honor only q, industry, category, platforms, media, sources, clones, days, likes, country, brand, domain, offer and sort (`searches.ts:9-23, 117-161`). Period, tracker, networks, scope, tag, angle, score and winners are silently ignored. The alert count can therefore disagree with the "Open in vault" result.

### 3i. URL params (full list, `vault.tsx:101-140`)
q, scope, industry, category, platforms[], media[], sources[], networks[], clones, days, period, likes, score, dedupe, country, tracker, brand, domain, offer, tag, angle, ids[], winners, sort.
- Default values are stripped from the URL (`:173-212`). Navigation uses `replace: true`.

### 3j. Telemetry
- Search events are logged with a 900ms debounce.
- Filter events are logged when non-default (`vault.tsx:300-337` → `lib/activity.ts`).

---

## 4. Other user pages

### /frameworks: "Copywriting frameworks" (`routes/_authenticated/frameworks.tsx`)
- **Purpose**: browse analyzed creatives by copy framework, hook style, format and element.
- **Sections in order**:
  1. Header: H1 "Copywriting frameworks".
     - Body: "Every analysed creative in the vault, grouped by the copy structure it uses, how its hook works and how the creative is built. Pick a framework to see the ads running it." (`:409-413`)
  2. `AnalysisProgress`: "{done} creatives analysed · {left} left · {pct}% done", plus "{perDay} in the last 24h · about N days to go" and a bar (`:217-247`).
  3. **Scope bar** (required before anything loads):
     - Industry select ("All industries")
     - Category select ("Pick an industry first" / "All categories")
     - Advertiser input "Advertiser (exact name)…" + "Apply" (`:418-454`)
  4. Facet panel:
     - **Creative type**: "All creatives" / "Videos" / "Images"
     - **Framework**
     - **Hook style**
     - **"Creative format / image style"** (or "Image style")
     - **Industry**
     - **Tag** (top 40)
     - **Framework element** (top 26)
     - Search box: "Search inside framework elements, hooks and visuals…" or "Search inside {Element} copy…"
     - Each facet shows its top 20 with counts. Clicking toggles it.
  5. "{n} analysed ads match — showing the {≤40} highest scoring."
  6. **"Often used with these ads"**: "Other styles and formats common in these results. Click one to narrow down further." Related labels with a % share (≥2 occurrences, top 18) (`:591-615`).
  7. **"Untapped angles across industries"** (only when no filter is set): "Styles and frameworks that dominate one industry but are barely used in others — proven ideas you can port." Row format: "{label} {pct} of {industry} ({n}) barely used in [Ind x%]…" (`:735-800`).
     - Logic: industry has ≥100 rows; top share ≥5% and ≥20 ads; low-use industries are below a quarter of the top share.
  8. "Open {n} ads in Vault →": passes up to 300 IDs, sorted by likes (`:618-629`).
  9. Example grid (40 cards, sorted by AI score). Each card:
     - thumbnail with framework/format badges
     - “hook”
     - matched element box ("On screen: …")
     - brand · category
     - hook_type badge
     - "score N"
     - Click opens the AdDetailSheet.
- **Taxonomy values**:
  - FRAMEWORKS (`lib/creative-analysis.server.ts:18-32`): PAS, AIDA, BAB, PASTOR, 4Ps, FAB, Star-Story-Solution, Testimonial, Listicle, Direct Offer, Curiosity Loop, Problem-Solution, Other.
  - VIDEO formats: UGC selfie, UGC voiceover, Talking head / expert, Street interview, Testimonial, News / editorial style, Documentary / B-roll, Screen recording / demo, Animation / motion graphics, Product demo, Reaction / duet, Slideshow, AI avatar, Podcast clip (`:96-97`).
  - IMAGE styles (23): Native screenshot, UGC photo, News / editorial, Text message / chat, Comment collage, Social comment, iPhone note, IG question sticker, Google / native search, Is it a scam?, Credential selfie, Comparison card, Before / after, Proof / results, Testimonial quote, Offer & scarcity, Product photo, Lifestyle photo, Meme / novelty, Infographic / chart, Listicle graphic, Checklist / tips, Warning / alert (`:100-124`).
  - Hook types are free text, e.g. "curiosity question", "shock stat", "personal story", "callout", "warning", "before/after", "authority", "offer-led".
  - ELEMENT_LABELS (`lib/creative-analysis.ts:43-69`): Hook, Lead, Context, Pain point, Agitation, Fear / risk, Curiosity loop, Story, Mechanism, Solution, Product, Benefits, Demonstration, Social proof, Authority, Comparison, Objection handling, Guarantee, Offer, Price, Bonus, Urgency, Scarcity, Call to action, Disclaimer.
- **URL params**: framework, hook_type, format, industry, category, brand, media (all|video|image), element, tag, q.
- **States**:
  - Not scoped: "Pick an industry, category or advertiser above to load its frameworks, hook styles and formats."
  - Error: "Could not load frameworks for this scope. Try again."
  - Empty: "No analysed creatives in this scope yet. Frameworks appear here as the analyser works through the vault."

### /teardown: "Creative Report" (`routes/_authenticated/teardown.tsx`)
- **Purpose**: a competitor teardown for one or more advertisers, landing domains or offers, or for an industry/category slice.
- **Sections in order**:
  1. Eyebrow "Creative Report". H1 = the selection label, or "Pick a competitor".
     - Sub-copy: "Stop hooks, hook styles, angles, frameworks and formats across one competitor's winning ads."
  2. Scope card:
     - Industry select
     - Category select ("Pick an industry first")
     - "Clear all"
     - Pick chips (typed "advertiser" / "landing" / "offer", removable)
     - Search input: "Search advertisers, landing domains or offer domains…" or "Add another advertiser, landing domain or offer…"
     - 3-column suggestion lists: "Advertisers" / "Landing domains" / "Offer domains", each with counts. Empty: "No matches". Source: `scope_options` RPC (`lib/scoped-reports.ts:74-81`).
     - **Multi-select union**: several advertisers, domains and offers can be combined (`scoped-reports.ts:84-94`).
  3. Cap note: "{n} ads match — this report uses the top 3,000 by AI score." (`:361-365`)
  4. **IdentityCard**:
     - initial avatar, name, top industry and category badges
     - pills: "Total ads", "Winning ads", "Avg days live", "Media mix: {v} video · {i} image"
     - "Winning = 50+ likes · 1+ clone · 7+ days live." (`:509-536`)
  5. Three mini lists (top 3 each): "Top categories", "Top landing domains", "Top trackers". Empty: "None recorded".
  6. **"Ads launched — last 90 days"**: area chart of first-seen per day, "{n} first seen · launch cadence" (`:538-586`).
  7. **"How {name} hooks people"** (auto summary):
     - "Their openers lean on …", "The dominant angle is …", "usually framed as …"
     - top 3 hook quotes
     - "Takeaways" bullets (`:588-635`), e.g. "Lead with a {hook} hook — it opens N% of their analysed ads."
  8. `CreativeInsights` "{name} — creative insights" (see 5).
  9. Two ranked top-10 lists:
     - "Highest engagement": "By likes — we don't store impressions, so likes are the proxy"
     - "Longest running": "By days live — the honest proxy for spend staying on"
     - Each row: rank, thumbnail, title, "{likes} likes · {clones} clones · {days} days"
  10. **"Winning creatives"**: "Full winners first, then score, then likes". Masonry AdCards with an attached analysis strip (Winner badge, hook_type, framework, “hook”, "Angle:"). Pages by 48: "Show more ({n} left)".
- **URL params**: brand[], domain[], offer[], industry, category.
- ⚠ Clicking any creative navigates to **`/a/$id` (the public share page)**, so the user leaves the app shell (`:416, 423, 442`).
- ⚠ A `running` KPI (measured in the last 14 days) is computed but never rendered (`:192-195`).

### /assistant: "Creative assistant" (`routes/_authenticated/assistant.tsx`)
- Chat UI posting to `/api/chat`.
  - Sub-copy: "Ask what hooks, frameworks and formats are working across the vault — then get fresh copy built on those patterns."
- Empty state "Try one of these:" offers 4 suggestion buttons:
  - "What framework do the top 50 Lead Gen ads use?"
  - "Which hooks are working for Weight Loss right now?"
  - "Write 5 new UGC hooks for Telehealth based on what's running"
  - "What creative formats dominate VSL ads this month?"
- Loading shimmer: "Reading the vault…". Placeholder: "Ask about hooks, frameworks, formats or ask for new script ideas…".
- ⚠ No history persistence, no citations or links to source ads shown, and no scope controls. The trust and transparency gap matters for an AI feature.

### /saved: "Swipe file" (`routes/_authenticated/saved.tsx`)
- Eyebrow "Personal". H1 "Swipe file". "{n} saved creatives — only visible to you."
- Grid of AdCards (4 columns). Unsave toggle. AdDetailSheet with add to board.
- Empty: "Nothing saved yet. Tap the bookmark on any ad in the vault."
- ⚠ No filter, sort, search, export or bulk actions here.

### /whats-new: "What's new in AdVault" (`routes/_authenticated/whats-new.tsx`)
- Eyebrow "Updates". "Newest features first — worth a try if you haven't yet."
- Static list (`:312-345`); each entry has tag, date, title, body and CTA:
  1. New / September 2026: "Spider — request any page or domain you want spied on". CTA "Request a spider".
  2. New: "Creative assistant — ask the vault anything". CTA "Open the assistant".
  3. New: "Frameworks & hooks browser". CTA "Browse frameworks".
  4. Improved: "Bigger ad drawer with the landing page beside it". CTA "Open the vault", which links to `/` and redirects.
- ⚠ The list is hard-coded, with no unread state or nav badge.

### /boards, /alerts, /spy-requests: see 5 and 6.

---

## 5. Boards, sharing, exports

### /boards: "Boards" (`routes/_authenticated/boards.tsx`)
- Eyebrow "Team collections". "Group winning creative by client, industry or campaign. Make a board public to share it with anyone by link."
- Viewer note: "You have viewer access — boards are read-only. Ask an admin for editor access." (`:187-191`)
- "New board" (disabled for viewers) opens a dialog:
  - Title: "Create a board"
  - Body: "Boards are shared with all Idea Clan teams in the vault."
  - Fields: Name (placeholder "Q3 VSL hooks"), Description ("What this board is collecting and why."), switch "Public board" ("Anyone with the link can view it without signing in."), button "Create board"
- Board card grid (3 columns):
  - name and count badge, description
  - up to 4 thumbnails (falling back to a video frame, then brand initials)
  - Empty board: "Empty — add ads from the vault detail panel."
  - collapsible **"Creative analysis of this board"** → `CreativeInsights` titled "Hooks & frameworks on this board" (`components/BoardCreativeInsights.tsx`)
  - footer: Public/Private switch, "View" (public only, opens `/b/$id` in a new tab), "Copy share link"
- Toasts:
  - "Board created"
  - "Board is public — anyone with the link can view" / "Board is private"
  - "Public share link copied"
- ⚠ Missing board functions:
  - No board detail page in the app; boards are only viewable via the public `/b/` page.
  - No rename, delete, remove-ad or reorder (no such functions in `lib/ads.ts:466-560`).
  - No owner or collaborator display.
- ⚠ "Copy share link" **silently makes the board public** (`share.functions.ts:156-163`, `boards.tsx:152-168`).
- ⚠ The Copy share link button isn't disabled for viewers.
- ⚠ All boards are listed to everyone, but only owners can add to them ("Already on that board, or you don't own it").

### CreativeInsights block (`components/CreativeInsights.tsx`). Reused on boards, teardown and insights.
- Header: "{n} creatives analysed · {v} video · {i} image".
- Row 1 (3 columns):
  - "Frameworks working here" ("Copy structure used by these ads")
  - "Hook styles" ("How the first line grabs attention")
  - "Creative formats" ("How the creative is shot or built")
- Row 2 (2 columns):
  - "Body: parts that follow the hook" ("% of creatives that include each part in the body")
  - "Angles" ("The story or promise the body builds on")
  - "Video styles doing well" ("Across N analysed videos")
  - "Image templates doing well"
- "Top hooks": quotes linking to `/a/$id`, with a hook_type badge.
- Each tally row: key, "{count} · {share}%", bar, example quote. Analyzes up to the first 1,500 IDs.
- Empty: "No creatives in this view have been analysed yet. Hooks, frameworks and formats appear here automatically as the analyser works through the vault."

### Sharing flows
- **Share ad**: the detail sheet's "Share ad" mints a short link `/s/{7 chars}` (alphabet without ambiguous characters) or reuses an existing one. It uses `navigator.share`, falling back to clipboard ("Share link copied") (`AdDetailSheet.tsx:53-73`, `lib/share-link.ts`, `share.functions.ts:113-192`).
- **Share board**: "Copy share link" mints `/s/{code}` and forces `is_public=true`. Fallback is the long `/b/{id}` link.
- `/s/$code` resolves to SharedAdView or PublicBoardView.
  - Not found: "This link isn't available" / "The link may be wrong, or what it pointed to was removed."
- `/a/$id` **SharedAdView**: ShareHeader ("IDC AdVault" + "Team sign in"), eyebrow "Shared ad", H1 brand, "Tap the creative to see the full breakdown.", a single AdCard, and a read-only detail sheet.
  - Not found: "This ad isn't available" / "The link may be incomplete, or the creative was removed from the vault. Shared AdVault links look like advault.net/s/abc1234 — ask whoever sent this for a fresh share link."
- `/b/$id` **PublicBoardView**: eyebrow "Shared board", name, description, "{n} creatives", masonry cards, read-only sheet.
  - Private: "This board is private" / "The link may have been turned off, or the board no longer exists."
  - Empty: "This board is empty for now."
- Media on public pages is signed server-side (`share.functions.ts:40-45, 105-110`).

### Exports
**CSV**: vault "Export CSV", selection "CSV", and `ads.csv` inside the zip (`lib/csv.ts:15-46`). Columns verbatim, in order:
`Brand, Title, Caption, Source, Platform, Industry, Category, Media type, Days live, Started running, Measured on, Clones, Likes, Comments, Shares, AI score, Countries, CTA, Landing domain, Landing URL, Offer domain, Offer URL, Creative, External ID`
- Countries are joined with " | ".
- Creative is a signed absolute URL.
- File gets a UTF-8 BOM.
- Filename: `{hint}-YYYY-MM-DD.csv`, with hints `advault-filtered` / `advault-selection`.

**ZIP**: "Download creatives" (`lib/download.ts:123-168`)
- Real video, else thumbnail, fetched 5 at a time.
- File names: `{brand}_{title}_{last8ofId}.{ext}`.
- Includes `ads.csv`.
- Filename: `advault-creatives-YYYY-MM-DD.zip`.
- Strict signing; partial failures are counted.

**JSON context**: schema `advault.selection/1` (`lib/selection-export.ts:126, 192-318`; `lib/selection-download.ts`). Filename `advault-selection-YYYY-MM-DD.json`.
- Top-level: schema, generated_at, site, requested, exported, missing_ids, ambiguous_ids, gallery_url, ads[].
- Per ad:
  - id, external_id, industry, category, advertiser, headline, primary_text, cta
  - media{type, image_url, video_url, primary_creative_url, range_support, keyframes{status, reason, source_analysis_version, frames[]}}
  - transcript, transcript_status
  - destination{landing_domain, landing_url, offer_domain, offer_url, post_url, tracking_software}
  - metrics{likes, comments, shares, views, clones, unknown_metrics, days_live, started_running, last_seen, currently_running}
  - score{value, scale "1-100", provenance, breakdown, breakdown_provenance, [recomputed_reference_score, recomputed_reference_breakdown]}
  - winner_gates
  - source{collector, network, platform, countries}
  - share_url
- The same payload backs the MCP `export_ads_context` tool.

**Single creative**: "Download creative" in the sheet (`download.ts:109-115`).

**Admin exports**: Audit manifest JSON/CSV (see 8).

---

## 6. Alerts, saved searches, What's new, spy requests

### /alerts: "Alerts" (`routes/_authenticated/alerts.tsx`)
- Eyebrow "Saved searches". H1 "Alerts".
  - Sub-copy: "Save any filter set from the vault — source, clones, likes, days live — and this page tells you every time new ads match it."
- One panel per saved search:
  - name, plus a "{n} new" badge (when alerts are on)
  - description line from `describeSearch`, e.g. “q” · Industry · Category · Source: … · platforms · media · N+ clones · N+ days live · N+ likes · country · Brand: · Domain: · Offer:, or "All ads" (`searches.ts:57-73`)
  - "Last reviewed {relative}"
  - Controls:
    - "Alerts" switch (`alerts_enabled`)
    - "Open in vault"
    - "Mark reviewed" (sets `last_seen_at=now`; toast "Marked as reviewed")
    - trash icon (toast "Saved search deleted")
  - Up to 10 newest matching AdCards added since `last_seen_at` (`searches.ts:117-139`)
  - None: "No new matches since you last reviewed this search."
- Nav badge = sum of new-match counts across searches with alerts on (`AppShell.tsx:62-74`).
- Empty: "No saved searches yet. Set your filters in the vault and hit “Save search”." with button "Open the vault".
- ⚠ Cards on this page have a **no-op `onOpen`** (`alerts.tsx:151`): clicking an ad does nothing.
- ⚠ The alerts are in-app only: no email or push, no frequency setting.
- ⚠ There is no rename or edit of filters.
- ⚠ The filter subset limits matching (see 3h).

### Saved search data model
`saved_searches`: id, user_id, name ("Untitled search" fallback), filters (json), alerts_enabled, last_seen_at, created_at (`searches.ts:84-115`).

### /spy-requests: "Request a spider" (`routes/_authenticated/spy-requests.tsx`, `lib/spy-requests.ts`)
- Eyebrow "Spider".
  - Explainer: "Add a Facebook / fan page or an advertiser domain, and tell us which industry and category it belongs to. Our bots pick the request up and start pulling that advertiser's ads — the first creatives usually show up within 24 hours, both here and in the regular vault. Offer pages and keyword-only requests are in beta."
- Quota line: "{used} of 10 spiders used today · allowance resets at midnight". Shown in red when exhausted (`SPY_DAILY_LIMIT=10`, `spy-requests.ts:122`).
- Form (one row): Kind select · target input · Industry select · Category input (with a datalist of suggestions) · "Request" button · Note textarea ("Anything the bots should know? (optional)").
  - Kinds (`spy-requests.ts:11-21`):
    - page "Facebook / fan page" (hint "facebook.com/thebrand, page name or page ID")
    - domain "Advertiser domain" ("brand.com")
    - offer "Offer page · beta" ("offers.brand.com/vsl-1")
    - keyword "Keyword or category only · beta" ("e.g. blood sugar advertorial")
  - Industry and category are required for all kinds (`LABELLED_KINDS`).
- Validation copy (`:50-64`, page `:139-157`):
  - "Enter what the bots should look for."
  - "Use at least three characters."
  - "Paste the page link, its name or its numeric page ID."
  - "A domain or offer link cannot contain spaces."
  - "That doesn't look like a valid link."
  - "Pick the industry this page or domain belongs to."
  - "Add the category of this page or domain."
  - "You've used all 10 spiders for today. Your allowance resets at midnight."
  - Success: "Request sent — first ads should appear within 24 hours."
- Tabs:
  - **"My requests ({n})"** table. Columns: Target (+ note), Type (kind · industry · category), Status, Requested (date + requester email), When, Ads, and a cancel icon (queued only).
    - Statuses (`:27-32`): queued "Queued", running "Bots working", done "Completed", rejected "Rejected".
    - ETA text (`:217-224`): "Ads delivered" / "Not picked up" / "Ads should be landing now" / "First ads within ~{h}h".
  - **"Spider ads ({n})"**: AdCards, up to 100 per request, sorted by winner gates then likes (`:181-211`).
    - Empty: "No spider ads yet. Requested ads appear here as soon as the bots deliver them — they are added to the main vault at the same time."
- ⚠ Neither query filters by user (`spy-requests.ts:67-71, 181-193`). Whether "My requests" is really only yours depends on RLS; the table shows a requester email column, which suggests team-wide visibility.
- ⚠ `winnerGates` uses **3+ days live** (`:167-174`), while everywhere else uses 7+.

### What's new: see section 4.

---

## 7. Roles & permissions

- Roles (`lib/roles.ts:6-12`):
  - admin "Full access, including team stats and roles."
  - editor "Can create and edit boards and save searches."
  - viewer "Read-only: browse the vault and shared boards."
- If a user holds several roles, the highest wins (`:14-19`). With no row, the default is viewer.
- `ADMIN_EMAILS = ["rohit@ideaclan.biz"]`: always admin (`lib/access.ts:26-31`).
- Sign-up is restricted to approved domains: ideaclan.biz, ideaclan.com, amalfa.com, amalfa.in, tailorodo.com, stackoffers.com, stackoffers.in (`access.ts:5-13`). Error toast: "Use a work email (…)" (`routes/auth.tsx:111`).
- Auth page "Team access" (`routes/auth.tsx`):
  - "Continue with Google"-style button
  - Sign in tab: Work email, Password, reset link
  - Sign up tab: Full name, Team (placeholder "Growth"), Industry select ("Select your industry"), Work email, Password
  - Success: "Account created — you're in."
- Admin sets roles in an exclusive dropdown on /admin (`roles.ts:43-49`).

**What each gate actually enforces in the UI**

| Capability | Gate in code |
|---|---|
| See Admin and Blocked in nav, all admin pages | `useRole().isAdmin` |
| Vault "Issues" list | `isAdminEmail` only, the hard-coded email (`vault.tsx:293`). ⚠ Inconsistent with the role-based check |
| Detail sheet "Source fields" | `useRole().isAdmin` |
| Create board, toggle visibility | `canEdit` (editor or admin) (`boards.tsx:195, 292`) |
| Save search, swipe file, spider requests, bulk "Add to board", Copy share link | ⚠ **not gated**. Viewers can do them despite the "Read-only" role description |
| Add to board | DB RLS: owner only (error toast "Already on that board, or you don't own it" / "Couldn't add to that board. You can only add to boards you own.") |
| Suggest category ("Wrong category?") | any signed-in user. Goes to the admin review queue (`components/SuggestCategory.tsx`) |
| Admin-page denial | "Admin only" / "This area is restricted to the IDC AdVault administrator." |

---

## 8. Admin and internal tools

- **/admin "Admin"**: "Who is using IDC AdVault, when they were last active, and what they searched for."
  - Header has the 7 sub-page links.
  - Stat cards: Users, Active last 24h, Searches logged.
  - User search: "Search users by name, email or team".
  - Table columns: User (name, email · team), Role (editable select), Last active, Logins, Searches, Filters.
  - Right panel UserDetail: industry, joined date, "Recent searches", "Most used filters", "Activity" (last 25 events: kind, query, filters).
  - Source: `profiles` + `activity_events` (last 2,000).
  - Activity kinds: login, search, filter, page. ⚠ "page" is never logged (`lib/activity.ts:3`; login is logged in `__root.tsx:140`).
- **/blocked "Blocked advertisers"** (in the nav, admin only): "Branded (non-affiliate) advertisers rejected at ingest. {n} blocked creatives across {g} advertisers."
  - **Ingest blocklist** editor: "{active} active of {total}", a "Filter rules" input, Brand / Domain / Note inputs with "Add", a toggle and delete per rule.
    - Footer: "Changes apply to the next import immediately — no redeploy needed. If every rule is disabled, the built-in default blocklist is used."
  - Reason chips: All, Branded advertiser, Blocked domain, Category mismatch, Other (`lib/blocked-brands.ts:71-84`).
  - Search box.
  - Table columns: Advertiser, Domain, Reason (chips with counts), Last seen, Blocked.
  - Side panel: 6 sample creatives with the matched rule.
  - Empty: "Nothing blocked yet. Rejected advertisers will appear here after the next import."
- **/admin-spy-requests "Spider queue"**: "Everything the team asked the bots to crawl. {n} waiting to be picked up."
  - Table columns: Target, Type, Requested by, Bot (+ bot note), Ads, Status (editable select). Toast: "Request updated".
- **/admin-category-qa "Category QA"**: "Review category fixes suggested by the team, apply the ones you agree with, and undo any of them on the Corrections page."
  - Banner: "Automatic review not enabled" (automation is off).
  - **Review queue**: refresh / reject / accept. Columns: From, Now, Suggested, Why.
  - The automated check form (Industry, Category (exact), Last N days, Ads (max 400), "Open landing pages", "Transcribe videos missing a transcript") is hidden while automation is disabled. Its result columns: Ad, Now, Proposed, Why. Stats: Checked, Answered, Possible mis-labels, Transcribed.
- **/admin-corrections "Category corrections"**: "Upload a reviewed corrections file… every change is logged, and any run can be undone."
  - Inputs: Confidence floor, Reviewed file (.json).
  - Dry run, then Apply.
  - "Before / after" table: Industry, Category, Before, After.
  - Proposal table: Ad, Now, Proposed, Outcome.
  - "History" table: Started, Type, Reviewer, Applied, Skipped, revert.
- **/admin-deleted "Deleted (7-day restore)"**: "Ads removed by a spy bot or admin. They are hidden everywhere in the vault and are purged for good after 7 days."
  - Rows: thumbnail, brand, title, external id, industry · category · "via {source}", "Reason:", "{n}d left", "Restore". Toast: "Ad restored to the vault".
  - Empty: "Nothing in the trash."
- **/admin-manifest "Audit manifest"**: read-only export of all ads. Buttons: "Download JSON", "Download CSV", "Preview only".
  - Progress: "Reading rows… n of N".
  - Result fields: Run ID, Exported at, Rows exported, Rows in database, Pages read, Count check ("Matches" / "Mismatch — retry"), Missing category, Missing thumbnail.
  - "Industry / category counts" table.
- **/admin-offer-audit "Offer link audit"**: button "Scan for suspicious offers".
  - Explainer: "Flags offers on a big public site, offers shared by many unrelated advertisers, and side-browser answers nobody has confirmed yet."
  - Tabs (`:27-32`): Flagged, "Cleared — waiting recheck", "Rechecked — confirm", Verified, each with counts.
  - Actions: "Offer is right", "Wrong — clear and recheck", "Confirm new offer", "No offer page", "Still wrong — recheck again", and a "paste the correct offer URL" input.
- **/admin-insights-push "Industry Insights push"**. ⚠ **Directly relevant**: AdVault feeds an external "Industry Insights" product.
  - "Sends eligible ads to every enabled environment. Keys stay on the server." Buttons: "Dry run", "Push now".
  - Per-environment cards (dev, stage, preprod, prod):
    - "configured" / "no keys set"
    - "Last run"
    - Pushed / Failed / Unmatched
    - "Fix mapping for: …"
    - last error
  - **"Category mapping"** table: Category → "Industry Insights industry" (editable), Enabled, Save.
  - Auto-push runs every 30 min. Reconcile feed: `/api/public/industry-insights-synced-ads` (`routes/api-docs.tsx:369-382`).
  - Wire object (`lib/industry-insights.ts:92-110, 264-355`):
    - Fields: ad_archive_id, page_name, page_id, body, title, caption (= landing domain), link_url, original_image_url, original_video_url, display_format, start_date, end_date, is_active, publisher_platform[], targeted_or_reached_countries[] (ISO2), cta_type (UPPER_SNAKE).
    - `source_meta` carries: fetched_via, external_id, category, industry_bucket, ai_score, clone_count, likes, comments, shares, views, tags, network, tracker, landing_domain, offer_url, post_url, discovered_at, start_date_source, last_seen_at.
    - Active means seen in the last 14 days.
- **/api-docs "IDC AdVault Ingest API"** (public). Sections:
  1. Base URLs & authentication
  2. POST /api/public/ingest-ads
  3. Ad object field reference
  4. Industry → category taxonomy (insurance is re-routed to Lead Gen, telehealth signals to Telehealth)
  5. Example payloads
  6. POST /api/public/mirror-media
  7. POST /api/public/delete-ads (soft delete)
  8. Industry Insights sync (partner only)
  9. Rules the bot must follow
- **/spider-queue** (public, noindex): "Spider requests". "{n} requests, newest first. Machine-readable: /api/public/spider-queue?status=queued".
  - Bot instructions: "Prioritise winners: 50+ likes, 1+ clone, 3+ days live… up to 100 per day".
  - Table columns: ID, Target, Type, Industry, Category, Note, Status, Requested, By, Ads.

---

## 9. Empty, loading and error states, and copy worth reusing

**Winner criteria** (`components/WinnerCriteria.tsx:8-27`). This copy explains what makes an ad a winner and builds trust in the data:
- Panel:
  - Eyebrow "Winner criteria", H2 "These are most likely winning ads"
  - "We don't scrape everything. An ad only enters the vault once it clears at least one of the performance gates below — the ones clearing all three are the top winners."
- Gates:
  - "50+ likes · Proven engagement": "The creative is getting real social traction, not just impressions."
  - "1+ clone · Copied by competitors": "Other advertisers are already duplicating the angle — the strongest winner signal."
  - "7+ days live · Still scaling": "Losing ads get switched off fast. A week+ of spend means it's profitable."
- Strip variant: "Why these are winners … Every ad clears at least one gate — the strongest clear all three."
- ⚠ **The "winner" definition is inconsistent across the app**:
  - ≥1 gate (WinnerCriteria)
  - all 3 gates (teardown `isWinner`, `teardown.tsx:81-83`)
  - ≥5 clones (card "Winner" badge)
  - 3+ days instead of 7+ (spider)
  - The redesign should pick one definition and show it the same way everywhere.

**Honest-metric copy** (good to keep):
- "By likes — we don't store impressions, so likes are the proxy"
- "By days live — the honest proxy for spend staying on"
- "Start date unknown" / "First seen {date}": never claims a run length the data can't prove (`AdCard.tsx:224-229`)
- Score hints such as "likes not reported by source"
- "null = never reported by the collector, not a measured zero" (JSON)

**Loading patterns**:
- Skeleton grids (12 cards in vault, 4 in the infinite-scroll sentinel)
- 5 skeleton rows per leaders column
- "…" for counts
- "Reading the vault…" shimmer
- "Loading ads…"
- zip progress "{done}/{total}"
- "Reading rows… n of N"

**Empty states** (verbatim):
- Vault:
  - "No ads loaded yet — real creatives are bulk-imported into the vault."
  - "No ads match these filters. Try switching industry or clearing filters."
- Category rail: "No categories in {industry} yet."
- Issues: "No broken rows — every ad has a creative."
- Teardown: "No ads found for this selection." / "None recorded" / "No matches"
- Frameworks and CreativeInsights: "…appear here as the analyser works through the vault."
- Landing page: "No landing page captured yet" / "The collector sends a full-page screenshot and the page text with newer ads, so this fills in automatically — the ad above stays full width until it does."
- Funnel path explanations (`AdDetailSheet.tsx:640-656`):
  - "AdVault followed this link and found no redirects. The page can still send people on through a button… which AdVault can't click, so the real offer may be one step further."
  - "…the page didn't respond (often a dead or geo-blocked page)."
  - "No hops from the bot yet. AdVault traces links itself every hour and will fill this in."
- Boards: "No boards yet. Create your first one to start collecting winners."
- Swipe file, Alerts, Spider and share pages: see sections 4–6.
- Admin users: "No users match that search."

**Error states**:
- Vault: "Couldn't load ads right now. Try again" (inline retry) (`vault.tsx:1260-1267`)
- Teardown: "Could not load this report. Try again."
- Frameworks: "Could not load frameworks for this scope. Try again."
- Root 404: "Page not found" / "The page you're looking for doesn't exist or has been moved."
- Root error: "This page didn't load" / "Something went wrong on our end. You can try refreshing or head back home." (`routes/__root.tsx`)
- Toasts:
  - "CSV export failed. Try a narrower filter."
  - "Download failed. Try a smaller selection."
  - "None of the selected ads have a downloadable creative."
  - "Couldn't select every match. Try again."
  - "JSON export failed. Try a smaller selection."
  - "This ad is no longer available."
  - "Could not download this creative."
  - "Could not authorise these creatives for download. Please try again."

**Category suggestion dialog** (`SuggestCategory.tsx`):
- "Suggest a different category": "Currently filed under {Industry} / {Category}. Your suggestion goes to the admin review queue — the ad is not moved right away."
- Fields: Industry, Category (placeholder "Weight Loss"), "Why (optional)" (placeholder "Landing page sells an annuity")
- Button: "Send for review". Toast: "Thanks — sent for review."

**Other microcopy**:
- "Clone this angle" toast: "Rewrite brief copied — paste it into ChatGPT or Claude"
- "Redirect path copied"
- "Hook copied"

---

## Cross-cutting gaps to carry into the redesign

1. Nav is a flat list of 10–12 items with no grouping:
   - Discovery: Vault, Insights, Frameworks, Creative Report, Assistant
   - Collections: Boards, Swipe file
   - Monitoring: Alerts, Spider
   - Plus What's new and the admin pages
   - Mobile shows unlabeled icons.
2. The "winner" definition differs by surface (see 9).
3. Saved searches drop many filters (period, tracker, network, tag, angle). The alert count and the vault result can disagree.
4. Hidden URL-only filters (score, dedupe, winners, ids) have no chips, and "Clear all" doesn't reset them.
5. Teardown and Top-hooks clicks leave the app for public `/a/:id`. Clicking an ad on Alerts does nothing.
6. Boards have no detail, edit, delete or remove-item flows. Sharing silently flips a board to public.
7. Role descriptions don't match enforcement: viewers can save searches, use the swipe file, request spiders and bulk-add to boards. Admin checks are split between the role and a hard-coded email.
8. The card score (stored) and the sheet score (live re-computed) can differ.
9. The AI Assistant has no sources, scope controls or history. That falls short on trust, transparency and control.
10. AdVault already pushes to the external "Industry Insights" product, with a category→industry mapping table (`/admin-insights-push`). Taxonomy alignment between the two products is a real dependency.
