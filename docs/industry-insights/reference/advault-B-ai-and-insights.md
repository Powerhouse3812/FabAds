# Inventory B: AI analysis, classification, Industry Insights push, MCP/assistant

Source: IDC AdVault reference codebase (read only, nothing executed). Paths are relative to `src/` unless they start with `drizzle/`, `supabase/`, `docs/` or `.lovable/`.

---

## 1. Creative analysis schema (`lib/creative-analysis.server.ts`)

### Models and routing
- Gateway: `https://ai.gateway.lovable.dev/v1/chat/completions`, `response_format: json_object` (L12, L335-339)
- `VIDEO_MODEL = "google/gemini-3.8-flash"` (L15); `IMAGE_MODEL = "google/gemini-3.1-flash-lite"` (L16)
- Text-only fallback: DeepSeek `deepseek-chat`, stored as model `deepseek/deepseek-chat` (`lib/deepseek.server.ts` L7, L45)
- Routing order inside `analyzeCreative` (L359-443):
  1. Video that already has a transcript of 200+ chars: DeepSeek text-only (transcript + copy + landing text). No visuals, no beats (L397-401)
  2. Otherwise Gemini gets the media URL (video_url for video, thumbnail_url for image)
  3. On HTTP 400 (not a size error): re-send the media inline as base64, max 14 MB (L300, L413-416)
  4. Video still failing with 400: transcribe the audio, then DeepSeek text-only if transcript is 50+ chars or caption+landing text is 200+ chars (L420-430)
- Media kind: `video` when `media_type === "video"` or a `video_url` exists, else `image` (L363-364)
- Input context sent to the model (L167-177): Advertiser (brand), Industry label, Category label, Headline (title), Primary text (caption, first 2000 chars), CTA button, Landing domain. Text path adds Transcript (first 12000 chars) and Landing page text (first 3000 chars) (L378-379)
- Prompt persona: "senior direct-response copy chief analysing a paid social ad". Closing rule: "Be literal, quote the ad rather than paraphrasing, and never invent claims that are not in the creative." (L179, L204)

### Output fields (`CreativeAnalysis`, L73-90) with limits from `normalize()` (L247-298)
| Field | Type | Rule / cap |
|---|---|---|
| `media_kind` | `"video" \| "image"` | set by code, not by the model |
| `ad_format` | string | one value from VIDEO_FORMATS or IMAGE_STYLES; max 80 chars |
| `format_tags` | string[] | "up to 4 short extra descriptors"; stored lowercase, underscores become spaces, deduped, max 6 kept |
| `topic_tags` | string[] | see TOPIC_TAG_RULE; 4-8 tags, 2-40 chars each, max 8 |
| `framework` | string | one value from FRAMEWORKS; max 60 |
| `framework_confidence` | number | 0-1 |
| `hook` | string | opening hook, verbatim where possible, max 220 in prompt; stored max 400 |
| `hook_type` | string | free label (examples below); max 60 |
| `angle` | string | persuasion angle in under 12 words; max 200 |
| `short_angle` | string | see SHORT_ANGLE_RULE; cleaned, max 60 |
| `summary` | string | 2 sentences on how the ad sells; max 800 |
| `cta_text` | string | closing call to action, verbatim; max 200 |
| `elements[]` | `{key, text, visual, start, end}` | max 40; text max 1500, visual max 600; start/end in seconds for video, null for images |
| `visual_beats[]` | `{start, end, visual, role}` | video only (images get `[]`); max 40; visual max 600; role max 60 |
| `transcript` | string | video only, full spoken + on-screen transcript; max 20000 |
| `model` | string | which model produced the row |

### FRAMEWORKS (closed list, verbatim, L18-32)
- `PAS` (Problem – Agitate – Solution)
- `AIDA` (Attention – Interest – Desire – Action)
- `BAB` (Before – After – Bridge)
- `PASTOR`
- `4Ps`
- `FAB`
- `Star-Story-Solution`
- `Testimonial`
- `Listicle`
- `Direct Offer`
- `Curiosity Loop`
- `Problem-Solution`
- `Other`

### ELEMENT_KEYS (closed list, verbatim, L34-60), with display labels from `lib/creative-analysis.ts` ELEMENT_LABELS (L43-69)
| key | label |
|---|---|
| hook | Hook |
| lead | Lead |
| context | Context |
| pain | Pain point |
| agitation | Agitation |
| fear | Fear / risk |
| curiosity_loop | Curiosity loop |
| story | Story |
| mechanism | Mechanism |
| solution | Solution |
| product | Product |
| benefits | Benefits |
| demonstration | Demonstration |
| social_proof | Social proof |
| authority | Authority |
| comparison | Comparison |
| objection | Objection handling |
| guarantee | Guarantee |
| offer | Offer |
| price | Price |
| bonus | Bonus |
| urgency | Urgency |
| scarcity | Scarcity |
| cta | Call to action |
| disclaimer | Disclaimer |
- An unknown key is stored as given; a missing key becomes `"other"` (L278)
- Prompt rule: break the whole script or layout down element by element in order; "most ads have 6-10 distinct elements"; never merge two elements; cover first second to last (L198)
- "Body" elements = everything except `hook`, `cta`, `disclaimer` (`creative-analysis.ts` L221; `mcp/tools/creative-insights.ts` L130)

### ad_format: video formats (14, verbatim, L96-97)
- UGC selfie
- UGC voiceover
- Talking head / expert
- Street interview
- Testimonial
- News / editorial style
- Documentary / B-roll
- Screen recording / demo
- Animation / motion graphics
- Product demo
- Reaction / duet
- Slideshow
- AI avatar
- Podcast clip

### ad_format: image styles (`IMAGE_STYLES`, 23, verbatim, L100-124)
- Native screenshot
- UGC photo
- News / editorial
- Text message / chat
- Comment collage
- Social comment
- iPhone note
- IG question sticker
- Google / native search
- Is it a scam?
- Credential selfie
- Comparison card
- Before / after
- Proof / results
- Testimonial quote
- Offer & scarcity
- Product photo
- Lifestyle photo
- Meme / novelty
- Infographic / chart
- Listicle graphic
- Checklist / tips
- Warning / alert
- Note: `ad_format` is stored as free text up to 80 chars. Nothing in code forces it onto these lists, so expect drift.

### hook_type (open list; example values from the prompt, L193)
- "curiosity question", "shock stat", "personal story", "callout", "warning", "before/after", "authority", "offer-led"
- Free text. No closed list and no normalisation beyond trimming to 60 chars.

### visual_beats.role
- Free text, max 60 chars. The prompt gives no allowed values (L199).

### format_tags
- Free text, "up to 4 short extra descriptors". No list.

### TOPIC_TAG_RULE (verbatim, L150-151)
> array of 4-8 short lowercase tags (1-3 words each) for who the ad targets and what it sells, taken from the ad copy, transcript and landing page: the audience (e.g. "senior women", "men over 50", "homeowners"), the product type (e.g. "nutra", "supplement", "hair serum", "solar", "auto insurance", "mobile app"), the problem or desire (e.g. "hair loss", "joint pain", "weight loss", "save money") and 1-3 key landing page keywords. No brand names, no ad-style words, no country names
- Four tag facets: audience, product type, problem/desire, landing keywords. All flattened into one array. The facet is not stored.
- `cleanTopicTags`: lowercase, trims, `_` becomes space, strips a leading `#`, keeps 2-40 chars, dedupes, max 8 (L154-164)

### SHORT_ANGLE_RULE (verbatim, L129-130)
> a 2-6 word lowercase label for the specific claim or value proposition (NOT the copywriting framework: never "pas", "aida", "fear of missing out", "social proof", "curiosity gap", "urgency", "government program"). Generic enough that other ads making the same claim get the same words: drop exact numbers, prices, names and places. Examples: "save money on auto insurance", "insurers are overcharging you", "new ai rate-saving tool", "natural eye health support", "regrow thinning hair"
- `cleanShortAngle` (L135-148): lowercases, removes numbers/currency/%, keeps only a-z, space, `'` and `-`, max 6 words, max 60 chars. Returns null when the label is one of these framework words: `pas, aida, fomo, fear of missing out, social proof, curiosity gap, curiosity, urgency, scarcity, government program, testimonial, authority` (L132)
- Angle grouping for display (`creative-analysis.ts` L156-201): `angleGroupKey` drops stop words (`a an the for of to and your you on in with by from new`), maps synonyms, sorts the words. The label shown is the most-used spelling. Synonym map:
  - forgiveness/forgive/forgiven/reduction/reduce → relief
  - veterans/vets/vet/military → veteran
  - seniors/elderly/retirees → senior
  - programs/plan/plans/scheme → program
  - savings/saving/cheaper/lower → save
  - loans → loan; insurers → insurer; payments → payment; bills → bill

### Storage: `ad_creative_analysis` (`drizzle/migrations/0003…sql`; `integrations/supabase/types.ts` L47-73)
- Columns: `ad_id` (PK, FK to ads), `media_kind` (default 'image'), `ad_format`, `format_tags` jsonb, `topic_tags` jsonb, `topic_tagged_at`, `framework`, `framework_confidence` numeric, `hook`, `hook_type`, `angle`, `short_angle`, `short_angle_at`, `summary`, `cta_text`, `elements` jsonb, `visual_beats` jsonb, `transcript`, `model`, `status`, `error`, `analyzed_at`, `created_at`, `updated_at`
- **status values**: `pending` (DB default), `ok` (success), `failed` (with an `error` string) (`routes/api/public/analyze-creatives.ts` L176, L230). Every reader filters to `status = 'ok'`.
- Error buckets (prefix before `:`): `no_api_key`, `no_media`, `network`, `http_<code>`, `bad_body`, `unparsable_json`, `video_fallback_failed` (creative-analysis.server.ts)
- Indexes on framework, ad_format, status, hook_type
- Original RLS made it readable by anon and authenticated; later restricted (`drizzle/migrations/0008_restrict_creative_analysis_reads.sql`)
- Job state table `creative_analysis_state` (id 'default'): `lease_until`, `paused`, `paused_reason`, `last_run_at`, `last_status`

### Aggregations built on the analysis (`lib/creative-analysis.ts` L119-267)
- `Tally` = `{key, count, share (% of analysed rows), examples[≤3]{ad_id, text}}`
- `CreativeInsight`:
  - `analysed`, `videos`, `images`
  - `frameworks` (top 6, example = hook or summary)
  - `hookTypes` (top 6)
  - `formats` (top 6)
  - `topHooks` (top 10 by rank fn: ad_id, hook, hook_type)
  - `angles` (top 10 grouped short_angle)
  - `bodyElements` (top 8; share = % of ads that use that element)
  - `videoFormats` (ad_format, video only)
  - `imageTemplates` (ad_format, image only)
- Tag helpers: `tagKey` (lowercase, `_`/spaces collapsed), `tagLabel` (capitalised first letter), `normalizeTags` drops tags that just repeat the industry, `tagVariants` lists the stored spellings for exact DB matches (L270-299)

---

## 2. Classification: industry / category / offer

### Taxonomy
- **Industries (7)** `KNOWN_INDUSTRIES` (`lib/classify.server.ts` L34-42): `Amalfa`, `VSL`, `Telehealth`, `Lead Gen`, `E-commerce`, `Arbitrage`, `Others`. Anything unknown becomes `Others`.
- Industry aliases (L44-68):
  - ecom / ecommerce / e commerce / e-comm / shopify / dtc → E-commerce
  - leadgen / lead-gen / lead generation / insurance / insurance leads / leads → Lead Gen
  - vsl / video sales letter → VSL
  - telehealth / telemedicine → Telehealth
  - arbitrage / arb → Arbitrage
  - amalfa → Amalfa
  - other / others / misc / unknown → Others
- Industries that get a sub-category classifier: `VSL | Telehealth | Others | Lead Gen` (L25)
- **Closed category lists** (`lib/subcategories.ts`):
  - **VSL (22)**: Weight Loss, Blood Sugar / Diabetes, Brain & Memory, Hearing & Tinnitus, Vision, Prostate, Dental, Joint & Back Pain, Skin & Anti-Aging, Nail & Fungus, Hair Growth, Men's Health, Women's Health, Gut & Detox, Heart & Blood Pressure, Sleep & Anxiety, Make Money / Bizopp, Crypto & Trading, Survival & Self-Defense, Relationships & Manifestation, Pets, Other
  - **Telehealth (13)**: Weight Loss, GLP-1, Longevity & NAD+, Labs & Diagnostics, ED, TRT, HRT, Mental Health, Skin & Derm, Hair Loss, Sleep, Primary Care, Other
  - **Lead Gen (27)**: Auto Insurance, Health Insurance, Life Insurance, Medicare, Home & Property Insurance, Insurance (Other), Solar, Roofing, HVAC & Plumbing, Home Services, Local Clinics & Healthcare, Legal & Mass Tort, Loans & Mortgage, Debt & Tax Relief, Education & Courses, Real Estate, Automotive, Jobs & Recruiting, B2B / SaaS, Banking & Finance, Sweepstakes, Surveys & Rewards, Government & Senior Benefits, Home & Auto Warranty, Legal & Permits, Business & Coaching, Firearms & Concealed Carry, Other
  - **Others (22, open: an unknown source label is kept after merging)**: Dance & Fitness, App Installs, Gaming, Finance & Fintech, Crypto & Trading, Insurance, Education & Courses, Real Estate, Travel, Automotive, Dating, SaaS, AI & Digital Products, Competitions & Raffles, Advocacy & Non-Profit, Events & Tickets, News & Media, Food & Dining, Home Services, Jobs & Recruiting, Entertainment & Streaming, Astrology & Psychics, Other
  - **E-commerce (33, `ECOM_CATEGORIES`)**: General Merchandise, Apparel, Nutrition, Beauty, Pet, Gifts, Fitness, Viral Products, Home Decor, Electronics, Outdoor, Sleep, Bags & Accessories, Shoes, Kitchen, Hair Care, Fragrance, Baby & Kids, Watches, Home & Garden, Arts & Crafts, Tools & Hardware, Home Organizers, Automotive Accessories, Cleaning, Musical Instruments, Toys & Games, Books & Info Products, Health Devices, Astrology & Psychics, Pest Control, Sexual Wellness, Jewelry. Unknown labels fold to `General Merchandise`.
  - **Arbitrage (6)**: Search Arbitrage (fallback), Native, Shopping Content, Article Pages, Adult, Other
  - **Amalfa (1)**: Demi-fine & Fashion (`AMALFA_CATEGORY`, classify.server.ts L664)
- **DB guard**: table `category_canon (industry, category, is_fallback)` plus a BEFORE INSERT/UPDATE trigger `enforce_category_canon()` folds any other label into the fallback and logs it to `category_drift_log (industry, raw_category, folded_to, hits, first_seen, last_seen)` (`drizzle/migrations/0024_category_canon_guard.sql`; AGENTS.md L14)
  - **Drift found**: the canon seed has `Lead Gen / Dance & Fitness` (not in the TS list) and does not have `Lead Gen / Firearms & Concealed Carry` (in the TS list). No migration adds Firearms, so the trigger would likely fold those ads to `Other`.
- **Dual category** (`lib/dual-category.ts`): an E-commerce `Viral Products` ad with beauty or skin words becomes primary `Beauty` and gets the tag `cat:Viral Products`. Extra categories are stored as `cat:<Category>` tags.
- **Merges** (`CATEGORY_MERGES`, subcategories.ts) collapse narrow labels into the broader category:
  - **Lead Gen**: hvac/plumbing → HVAC & Plumbing; debt/tax relief → Debt & Tax Relief; legal/mass tort → Legal & Mass Tort; mortgage/loans/personal loans/finance/financial → Loans & Mortgage; home/homeowners/property insurance → Home & Property Insurance; commercial insurance/disability/insurance → Insurance (Other); remodeling/gutters/windows/siding/flooring/walk-in tubs/home improvement/foundation → Home Services; roofs → Roofing; concealed carry/firearms/guns → Firearms & Concealed Carry; sweepstakes → Other
  - **Others**: finance → Finance & Fintech; sweepstakes → Gaming; supplements → Other
  - **VSL**: supplements → Other; finance → Make Money / Bizopp
  - **E-commerce**: retail → General Merchandise; fashion/clothing → Apparel; supplements → Nutrition; skincare → Beauty
  - **Everywhere**: any astrology/numerology/psychic/tarot/horoscope/zodiac label → Astrology & Psychics
  - Plus ordered regex fold rules for Lead Gen, Others and E-commerce (subcategories.ts L216-324)

### Industry router: `resolveIndustry` (classify.server.ts L917-950). Order matters; earlier steps win.
1. Casino / sweepstakes / gaming → Others / Gaming
2. Dance & online fitness → Others / Dance & Fitness
3. App-store destination (hard rule) → Others / App Installs
4. Rx / online clinic → Telehealth
5. Jewellery (and not insurance or home services) → Amalfa / Demi-fine & Fashion
6. Insurance or contractor lead forms → Lead Gen
7. Retail with cart / price / COD evidence → E-commerce
- Also used at ingest, by the audit sweep and by QA. Ingest additionally applies: local clinic → Lead Gen / Local Clinics & Healthcare; mobile app → Others / App Installs; the SpyHero source prior; dual category; then canonical category (`routes/api/public/ingest-ads.ts` ~L690-976)

### Signal detectors (all keyword regex over `adText`)
- `adText` = title + caption + cta + brand + landing_domain + tags + transcript, first 3000 chars (L455-461)
- `destinations` = landing_url, landing_domain, offer_url, offer_domain, redirect_chain hops, first 3000 chars (L434-442)
- Detectors:
  - `isIGamingAd`: casino brand list (`CASINO_BRANDS`, ~45 operators e.g. chumba, luckyland, draftkings, fanduel, bet365, coin master), casino-like domain, or `IGAMING_SIGNALS` words (casino, slots, free spins, sportsbook, poker, jackpot, gacha, mobile game…) (L346-368)
  - `isDanceFitnessAd`: dance forms (bharatanatyam, kathak, garba, bhangra, zumba, k-pop…), yoga/pilates, online fitness programs. Excludes gyms and equipment (L375-386)
  - `isAppStoreDestinationAd`: play.google.com, apps.apple.com, itunes, appstore.com, adjust, appsflyer, onelink, branch.io, smart.link (L448-453)
  - `isTelehealthAd`: `TELEHEALTH_BRANDS` (~45, e.g. noom, hims & hers, ro, bluechew, henry meds, everlywell, function health, teladoc, nurx, curology, maven clinic, amazon clinic) or `TELEHEALTH_SIGNALS` (GLP-1 drug names, TRT/HRT, sildenafil, tadalafil, minoxidil, labs, "not approved by the fda"…). A direct-response funnel overrides the signals (L467-485)
  - `isDirectResponseFunnel`: throwaway domain (letters followed by 2+ digits, or TLD info/xyz/top/click/online/site/live/icu/buzz) or DR script phrases ("without blue pills", "weird trick", "doctors don't want", "watch this video", "before it's taken down", "rock hard", "brazilian", "three simple ingredients"…) (L487-507)
  - `isInsuranceLeadAd`: insurance, medicare, final expense, premiums, deductible, get a quote, compare quotes… (L513-519)
  - `isHomeServicesLeadAd`: roofing, gutters, siding, windows, HVAC, plumbing, septic, paving, foundation, pest control, remodels, walk-in tubs, solar, contractor. Not telehealth, not jewellery (L526-535)
  - `isLocalClinicAd`: brand or domain contains dentistry / dental clinic / DDS / DMD / orthodontic / chiropractic / med spa / dentist domain (L539-545)
  - `isJewelleryAd`: jewellery words incl. Indian forms (jhumka, mangalsutra, kundan, polki, payal, maang tikka, rudraksha…), brands (giva, palmonas, rubans, salty, melorra, caratlane, bluestone…). Not telehealth (L552-566)
  - `isRetailProductAd`: decides E-commerce. Landing page evidence comes first: shopify/woocommerce platform → yes; shopScore ≥ 2 and > leadScore → yes; leadScore ≥ 2 and > shop → no. Then copy: hard cart words beat VSL markers; otherwise needs retail words (shop now, % off, COD, ₹, free shipping…) and no VSL markers (L572-607)
  - `isMobileAppAd`: app-store destination wins; app words (cleaner, VPN, duplicate photos, junk files…); `.app`/`.io` domains count only with app words. Free hosting (netlify.app, vercel.app, web.app, clickfunnels…) is not an app (L613-639)
  - `appStoreCategory` for Others: keep the existing Others category, else Dance & Fitness, Gaming, Entertainment & Streaming (drama/story apps: reelshort, dramabox, pocket fm, werewolf, billionaire…), else App Installs (L649-661)
- **Source prior** `sourceIndustryPrior` (L896-915): SpyHero ads that land outside VSL/Telehealth are pulled back to VSL unless a telehealth, iGaming, jewellery, insurance/home-services or app signal says otherwise
- **Seed mismatch** (`lib/seed-mismatch.ts`): the Meta Ad Library bot labels found ads with the seed advertiser's niche. When `source_fields.seed_niche/seed_category` is set, the brand is not the `seed_page` and the landing domain is not the seed domain, the collector label is distrusted. The vision prompt is then told the label is "UNRELIABLE".

### Sub-category resolution: `resolveSubcategories` (L857-884)
1. Existing label (canonicalised via aliases) → `auditSubcategory`: replaced when an ordered keyword rule disagrees. A low-confidence rule (Insurance (Other), Insurance, B2B / SaaS, SaaS AI & Digital Products, Automotive, Jobs & Recruiting, Finance & Fintech, Entertainment & Streaming, Pets, Other) only overrides when the stored label is contradicted by the copy and destinations (L794-851)
2. No label → `ruleSubcategory`, first match wins over ordered regex lists: `RULES` (VSL, 21 rules), `TELEHEALTH_RULES` (11), `LEADGEN_RULES` (21), `OTHERS_RULES` (15) (L269-407)
   - VSL special pass: money / income-claim copy (faceless page, dropshipping, SMMA, "$X a day", passive income…) with no health words → Make Money / Bizopp (or Crypto & Trading). Survival wins over money (L673-707)
3. Still none → AI batch `aiSubcategories`: model `google/gemini-2.5-flash`, batches of 25, each ad's text capped at 500 chars. Prompt: "Allowed labels: … Reply ONLY with JSON {results:[{i,label}]}. Never guess: … answer 'Other'". Lead Gen prompt adds "Never assume insurance" (L716-787)
4. Unresolved → `Other`. Then `enforceCanonicalCategory` snaps the label to the closed list (closed lists become Other; Others stays open but merged)
- Alias tables for collector labels: VSL `ALIASES` (L82-114), `TELEHEALTH_ALIASES` (L116-131), `LEADGEN_ALIASES` (L133-182), `OTHERS_ALIASES` (L184-227)

### Vision / landing-page verdict (`lib/vision-classify.server.ts`)
- **Landing signals** `LandingSignals = {url, status, title, description, text, shopScore, leadScore, platform}` (L57-66)
  - `SHOP_MARKERS`: add to cart, add to bag, buy now, checkout, shop now, free shipping, cash on delivery, in stock, sold out, sku, ₹, $digit, quantity… (L52-53)
  - `LEAD_MARKERS`: get a free quote, free estimate, free consultation, book a call/appointment, zip code, phone number, apply now, see if you qualify, check eligibility, speak to an agent, no obligation (L54-55)
  - `platform`: `shopify | woocommerce | funnel-builder` (clickfunnels, systeme.io, gohighlevel, unbounce, leadpages) | null (L138-144)
  - Live fetch: 9 s timeout, HTML only, first 400 KB, text capped at 4000 chars. Or built from the stored `ad_landing_pages` row (`landingSignalsFromStored`)
- **Prompt input** (`adSummary`, L200-231):
  - Advertiser, Headline, Copy (first 700 chars), CTA, Landing domain, Offer domain
  - Collector's label (or the UNRELIABLE note), Video transcript (first 700 chars)
  - Landing page status/platform/title/description, Shop-signal hits, Lead-form-signal hits, Landing text (first 1500 chars)
  - Allowed sub-categories
  - Plus the thumbnail as a base64 image (max 4 MB)
- **Industry definitions given to the model** (L176-183), verbatim gist:
  - E-commerce: sells a physical product directly
  - Lead Gen: collects contact/quote/appointment
  - Telehealth: real branded online clinics only
  - VSL: DR video sales letter funnels
  - Amalfa: jewellery / demi-fine / fashion accessories
  - Arbitrage: search/content arbitrage to article/listicle pages
  - Others: everything else
- **Rules, in order** (L185-196):
  - Destination decides (destination, then creative, then collector label)
  - App store → Others / App Installs
  - Rx / GLP-1 / TRT / HRT / labs / clinic → Telehealth
  - Jewellery → Amalfa
  - Retail with price/discount/COD/cart → E-commerce
  - Lead Gen only when the destination asks for details
  - VSL only for DR funnels; established retail brands → E-commerce; local clinic/store → Lead Gen
  - Concealed carry → Lead Gen / Firearms & Concealed Carry
  - Exact taxonomy names only
  - Unreadable destination and inconclusive creative → confidence < 0.5
- **Output** `VisionVerdict = {industry, category, confidence 0-1, reason (≤20 words, stored ≤160 chars), used:{image, landing}}` (L39-46)
- Models:
  - `visionVerdict` default `google/gemini-3.7-flash`
  - `textVerdict` uses DeepSeek with the same prompt (text only)
  - `visionVerdicts` runs with concurrency 1-8 (default 4)

### Post-analysis recheck (`lib/category-recheck.server.ts`)
- Runs after every successful creative analysis, and once for "label dispute" ads (`analyze-creatives.ts` L196-201, L245-271)
- DeepSeek text verdict first (when a transcript or landing text exists). Gemini vision (`google/gemini-3.7-flash`) only when DeepSeek is unsure or there is no text
- `MIN_CONFIDENCE = 0.7`; `AUTO_APPLY_CONFIDENCE = 0.7`. Owner approved auto-applying anything ≥ 0.7 (L14-24)
- Outcomes: `agreed | proposed | applied | skipped` (L26)
- Guards: app-store-link ads never leave Others; local clinic ads never go to VSL; the old category is dropped when the industry changes (L73-94)
- Applied changes are logged to `label_corrections` under a daily run `auto-apply-YYYY-MM-DD` (reviewer "auto (owner approved)"), and to `category_qa_proposals` with status `applied`. `reviewOnly` (bot disputes) never auto-applies
- `evidence` string = joined subset of `transcript + landing page + creative`, else `copy only`
- Stamps `ads.qa_checked_at`
- **Inconsistency**: `QA_AUTOMATION_ENABLED = false` (`lib/qa-automation.ts` L13) gates only the manual QA run and the daily QA endpoint. This auto-apply path is not gated, so AI relabels still happen hourly via analyze-creatives.

### Other classification passes
- `classify-ads` endpoint: backfills sub-categories for one industry (default VSL, ≤500 rows); moves VSL rows that look like telehealth to Telehealth (`routes/api/public/classify-ads.ts`)
- `audit-categories` endpoint: full-vault rules-only sweep (≤20000 rows, `dry_run`). Order: app store → casino → SpyHero prior → telehealth → jewellery → insurance → home services → local clinic → mobile app → retail → source prior → sub-category audit (`audit-categories.ts` L108-210)
- `vision-audit` endpoint: vision + landing page verdicts on ≤400 ads, `min_confidence` default 0.75, `use_landing`, `newest_first`, `dry_run`, explicit `ids` (`vision-audit.ts` L22-48)
- `transcribe-ads` endpoint: transcribes videos, then re-runs the industry detectors + SpyHero prior + `resolveSubcategories` on the spoken script (CLASSIFIABLE = VSL, Telehealth, Others, Lead Gen) (`transcribe-ads.ts` L28, L102-150)
- **Ingest dispute rule**: once an ad has `qa_checked_at`, a bot re-sending a different industry/category does not overwrite it. The ad gets `source_fields.label_dispute = {industry, category, at}` and is re-inspected once in the next hourly pass (`ingest-ads.ts` ~L1141-1170)
- **Bot landing-page label**: `ads.source_category` (aliases accepted at ingest: `landing_category`, `page_category`, `detected_category`, max 120 chars). Stored as a second opinion only; it never overwrites `category` (`ingest-ads.ts` L384-391)

### "Offer" data points (classification inputs)
- `offer_url`, `offer_domain`, `redirect_chain`, `chain_source` ("from bot" vs "traced by AdVault"), `chain_traced_at`, `landing_url`, `landing_domain`, `tracking_url`, `tracker`, `network` (affiliate network e.g. Digistore24, ClickBank, Maxweb, BuyGoods, Unclassified). Used by `destinations()` and shown in MCP output
- Redirect tracer plan: max 10 hops, 8 s timeout, follows meta refresh and the primary CTA anchor (`.lovable/plan/fix-scoring…md`)

### Models used (summary)
| Purpose | Model |
|---|---|
| Video creative breakdown | google/gemini-3.8-flash |
| Image creative breakdown | google/gemini-3.1-flash-lite |
| Text-only breakdown / topic tags / short angle / text verdict | deepseek-chat (api.deepseek.com) |
| Sub-category AI fallback | google/gemini-2.5-flash |
| Vision industry verdict / recheck / QA vision | google/gemini-3.7-flash |
| QA text-only verdict | google/gemini-3.1-flash-lite |
| Transcription | openai/gpt-4o-mini-transcribe |
| Assistant chat | openai/gpt-6-astra (Responses API, reasoning effort low) |

---

## 3. Topic tags, short angle, transcripts

### Topic tags backlog (`lib/topic-tags.server.ts`)
- For ads analysed before topic tags existed. New ads get tags inside the main analysis
- DeepSeek text only, concurrency 8, once per ad (`topic_tagged_at`)
- Industry priority order: Lead Gen, VSL, Telehealth, Arbitrage, Others, Amalfa, E-commerce (L10)
- Input: Industry, Category, Headline, Ad copy (1500), CTA, Angle, Transcript (2500), Landing page title, Landing page text (2500)
- Output: `{"topic_tags":[...]}` → `cleanTopicTags`. An unparsable reply stores `[]` so the ad is not paid for twice
- Fails closed: DeepSeek 401/402/403 pauses the whole backlog
- Per run: `tag_limit` default 60, max 120 (`analyze-creatives.ts` L280)

### Short angle backlog (`lib/short-angle.server.ts`)
- Same priority order, concurrency 8, once per ad (`short_angle_at`)
- Input: Category, Full angle, Hook, Framework (marked "not the angle"), Summary, Headline, Ad copy (1200), plus "Existing labels in this category (reuse one exactly if it is the same claim)"
- Existing labels = top 40 by frequency from up to 400 rows per category; grows to 60 within a run
- Output: `{"short_angle":"..."}` → `cleanShortAngle`
- Per run: `angle_limit` default 60, max 120
- Angle grouping in vault_search / scope_insights uses `short_angle` with `angle` as fallback (AGENTS.md L17)

### Transcripts (`lib/transcribe.server.ts`)
- Model `openai/gpt-4o-mini-transcribe` via `…/v1/audio/transcriptions` (L59-63)
- Size gates: 20 KB minimum, 22 MB maximum. Content-length is checked before download. Formats mp4 / webm / mp3
- Text capped at 8000 chars
- One transcription at a time per worker (memory)
- Status strings: `ok`, `empty`, `no_api_key`, `media_too_large`, `media_too_small`, `fetch_<code>`, `fetch_error:…`, `ai_<code>:…`, `ai_error:…`
- Stored on `ads.transcript`, `ads.transcript_status` (≤120 chars), `ads.transcript_at`. The analysis transcript (≤20000 chars) also lands in `ad_creative_analysis.transcript` and is synced back to `ads` (`analyze-creatives.ts` L183-192)
- Why it exists: "Most VSL / telehealth / iGaming ads carry almost no on-page copy — the whole pitch is spoken" (transcribe.server.ts header)
- The transcribe cron was merged into analyze-creatives (`drizzle/migrations/0015…sql` unschedules `transcribe-video-ads-hourly`)

### Keyframes (selection export)
- `media.keyframes = {status: "not_stored" | "available", reason, source_analysis_version, frames[{url, timestamp_seconds, description}]}`. Never extracted today, always "not_stored" (`lib/selection-export.ts` L25-41)

---

## 4. QA, corrections, blocked brands, data hygiene

### Category QA (manual, admin) (`lib/category-qa.functions.ts`, page `/admin-category-qa`)
- `runCategoryQa` input `QaInput`:
  - `industry`, `category`
  - `days` 1-365 (default 60)
  - `limit` 1-400 (default 100)
  - `use_landing`, `transcribe_missing`
- Gated by `assertQaAutomationEnabled()`. Currently OFF, so the run throws "Automatic review not enabled. Category checks run manually only — no AI provider is called." (`qa-automation.ts`)
- Routing: transcript and no thumbnail → TEXT_MODEL `google/gemini-3.1-flash-lite`; otherwise VISION_MODEL `google/gemini-3.7-flash`; concurrency 4
- `QaRow` fields:
  - id, external_id, brand, title, thumbnail_url
  - current_industry, current_category, source_category
  - proposed_industry, proposed_category, confidence, reason
  - evidence (transcript + creative + landing page + bot label | copy only)
  - agrees_with_source, row_version
- `QaReport`: run_at, scanned, judged, transcribed, mismatches, rows (sorted by confidence, highest first)
- `suggestCategoryChange` (any signed-in user): writes a `category_qa_proposals` row with source `user`, confidence 1, evidence "team member", reason ≤300 chars (default "Suggested by a team member"). Upserts the user's own pending row
- `decideProposals` (admin): status `accepted | rejected`, ≤500 ids, records reviewer, reviewed_at and correction_run_id
- `listProposals` (admin): pending only, ordered by source then confidence, limit 300, plus `category_qa_state` (id 'daily')
- **`category_qa_proposals` columns**: id, ad_id, external_id, source (`auto | user`), old_industry, old_category, proposed_industry, proposed_category, confidence, reason, evidence, row_version, status (`pending | accepted | rejected | applied`), created_by, created_by_email, reviewed_at, reviewed_by_email, correction_run_id, created_at. Unique index on (ad_id, source) where status = 'pending'
- **`QaState`**: paused, paused_reason, last_run_at, last_status

### Daily QA job (`routes/api/public/category-qa-daily.ts`)
- Schedule was 03:15 UTC on never-checked ads, newest first. Default 150, max 400. 20-minute lease. Circuit breaker pauses on AI 402/403 and runs one probe ad while paused
- Proposals written only when confidence ≥ 0.7. Never relabels
- last_status values: `idle_no_new_ads`, `paused_no_verdicts`, `checked N, M proposed`, `error: …`
- **Status now**: cron removed (`drizzle/migrations/0014_remove_daily_category_check.sql`) and the endpoint returns the "not enabled" message because of the QA flag

### Correction import (`lib/corrections.ts`, `lib/corrections.functions.ts`, page `/admin-corrections`)
- File schema `advault.category-corrections/1`: `{schema, source_run_id, reviewed_at, reviewer, changes[]}`
- Each change: id | external_id (at least one), old_industry, old_category, new_industry (required), new_category (required), confidence 0-1, reason, row_version, allow_new_category, needs_recrawl (alias no_evidence)
- `DEFAULT_CONFIDENCE_FLOOR = 0.7`
- Dry-run verdicts and labels (L39-47, L371-380):
  - applicable "Will apply"
  - conflict "Conflict — skipped"
  - unknown_id "Unknown ad — skipped"
  - taxonomy_violation "Not an allowed label — skipped"
  - no_op "No change needed"
  - duplicate_id "Duplicate row — skipped"
  - below_threshold "Below confidence floor — skipped"
  - needs_recrawl "No evidence — needs re-crawl"
- Dry-run report: rows, counts, `fingerprint` (Apply is bound to it), confidence_floor, `before_after[]{industry, category, before, after, delta}` across the whole library
- Apply: conditional update (id + old labels + created_at as row_version must match). Batches of 200. Audit row per change
- Run statuses: `running`, `completed`, `completed_with_skips`, `failed`, `recovered`, `abandoned`
- Revert: writes the old labels back if the ad is untouched since; mode `revert`, `revert_of`
- `recoverStaleRuns`: closes runs stuck in "running" for more than 30 minutes
- **`label_correction_runs`**: id, source_run_id, reviewer, reviewed_at, actor_id, actor_email, mode (`apply | revert`), revert_of, status, total_rows, applied_count, skipped_count, conflict_count, started_at, finished_at, notes
- **`label_corrections`**: run_id, ad_id, external_id, old/new industry/category, confidence, reason, row_version, outcome (`applied | skipped`), skip_reason (`taxonomy_violation | precondition_failed | <db error>`), applied_at

### Blocked brands (`lib/blocked-brands.ts`)
- Rejected at ingest; logged to `blocked_ingest_log` (block_reason, matched_rule) (`ingest-ads.ts` L534-577)
- Rules come from an admin-editable DB list (`BlocklistRule {brand, domain, enabled}`). When no enabled rules exist, the static defaults below apply
- Static brand names: best egg, chewy, braman bmw, american express, amex, capital one, chase, discover card, geico, progressive insurance, state farm, allstate, amazon.com, walmart, target, costco, nike, verizon, t-mobile, at&t
- Static domains: bestegg.com, chewy.com, edmunds.com, americanexpress.com, capitalone.com, chase.com, discover.com, geico.com, progressive.com, statefarm.com, allstate.com, amazon.com, walmart.com, target.com, costco.com, nike.com, verizon.com, t-mobile.com, att.com
- Matching: brand equals or contains a rule (substring, so "target" catches any brand containing "target"); domain equals or is a subdomain
- Reason codes and labels:
  - `branded-match` "Branded advertiser"
  - `domain-match` "Blocked domain"
  - `category-mismatch` "Category mismatch"
  - `other` "Other"
- Ingest response reports `blocked_branded_advertisers` and `blocked_by_reason`

### Other hygiene
- Soft delete: `deleted_at`, `deleted_reason`, `deleted_source`; 7-day restore, then hard purge; delete-ads API (`.lovable/plan/soft-delete…md`)
- Media: every creative is mirrored into the private `ad-media` bucket. `verify-media` deletes ads whose creative is missing. Ingest rejects videos that did not mirror. Ads with no thumbnail and no video are hidden and flagged under admin → Issues (api-docs)
- Known data gaps (fix-scoring plan, 2026-09-24):
  - ~3,000 Meta ads had player text ("0:00 / 2:39 Low impression count") instead of copy
  - ~2% of ads have redirect chains
  - Many ads lack a Facebook ad ID, which blocks the FabFunnel sync
  - ~624 videos are cut at 5 MB
  - ~830 Meta videos have no thumbnail
- Metrics: null means "never reported", not zero. Exposed as `metrics_unknown`

---

## 5. Industry Insights push pipeline (AdVault → external "Industry Insights" / FabFunnel)

- Roadmap: "FabFunnel/Industry Insights: push to live (prod) going forward + backfill all ads already sent to preprod" [done] (`roadmap.md` L32)

### Destination and transport (`lib/industry-insights.server.ts`)
- Environments: `dev`, `stage`, `preprod`, `prod` (`lib/industry-insights.ts` L9). Enabled set from env `INDUSTRY_INSIGHTS_ENABLED_ENVS` (default all four)
- Per env: `INDUSTRY_INSIGHTS_<ENV>_BASE_URL` and `INDUSTRY_INSIGHTS_<ENV>_API_KEY`. Envs missing either are reported as `missing_secrets_for` (L33-48)
- Endpoint: `POST {baseUrl}/insights-scrapper/industry-ads`, header `X-Insights-Api-Key` (L346-349)
- Request body (L329-333):
  ```
  { "entity_type": "INDUSTRY", "asset": "<Industry Insights industry>", "ads_data": [IIAdObject, ...] }
  ```
  One request per (industry, chunk of 30)
- Media URLs are made absolute against `INDUSTRY_INSIGHTS_MEDIA_BASE_URL` (default `https://www.advault.net`) and signed for 30 days. The payload hash is computed on the unsigned object (L299-321)
- Throttle: one request per 220 ms or more (≤5 req/s) (`industry-insights.ts` L14)
- 413 → split the chunk in half and retry recursively (L361-373)
- Response handling (L375-406):
  - 200 → `success`. 200 with `industry_matched:false` → `success_unmatched_industry` (message kept)
  - 401/403/404 → target misconfigured; abort that env's run without burning attempts
  - 400 → permanent: attempts set to MAX (5)
  - 429/5xx → retried by later runs on backoff
- Dry run: option `dryRun`, env `INDUSTRY_INSIGHTS_DRY_RUN=true`, or no keys. Logs the first 2000 chars of the body; status `dry_run`

### Selection rules
- **Category map gate**: only ads whose `category` is in `industry_insights_category_map` with `enabled = true`. The map translates AdVault category → Industry Insights industry (`asset`)
- **Seeded map** (`supabase/migrations/20260910065441…sql`), editable at `/admin-insights-push`:

| AdVault category | Industry Insights industry | enabled |
|---|---|---|
| Auto Insurance | Auto Insurance | true |
| Medicare | Medicare | true |
| Weight Loss | GLP-1 / Weight Loss | true |
| Nutrition | Supplements | true |
| Prostate | Supplements | true |
| Telehealth | Telehealth | true |
| Demi-fine & Fashion | Jewelry | true |
| General Merchandise | DTC / E-commerce | true |
| Viral Products | DTC / E-commerce | true |
| Home Services | Home Services | true |
| Beauty | Beauty | true |
| Fitness | Fitness | true |
| Dental | Dental Implants | true |
| Legal & Mass Tort | Mass Tort | true |
| Education & Courses | Skill Courses | true |
| Jobs & Recruiting | Jobs & Recruiting | false |
| Gaming | Gaming | false |
| Adult | Adult | false |
| Gifts | Gifts | false |

- **Map caveats**:
  - The key is the category name only, not industry + category. So "Weight Loss" maps VSL and Telehealth Weight Loss alike; "Dental" maps VSL Dental and is mapped to "Dental Implants"; "Education & Courses" covers both Lead Gen and Others
  - "Telehealth" is an industry name, not a category, so that row probably never matches
  - Not mapped: GLP-1, ED, TRT, HRT, Health/Life Insurance, Solar, Roofing, all Make Money / VSL health categories except Weight Loss/Prostate/Dental
- Other gates:
  - Not soft-deleted
  - Must yield a Facebook ad id (`ad_archive_id`) and a non-empty `brand` (`page_name`), or the ad is skipped as `skipped_no_facebook_ad_id`
- Scan: paged 1000 at a time by `created_at desc, id desc`, up to 40,000 rows (`MAX_SCAN_ROWS`). Then `maxAds` (default 5000, cap 10,000) applies per env to ads still due (L123-178, L208-210)
- **shouldPush** (`industry-insights.ts` L402-420):
  - never pushed → push
  - last log was a dry run → push
  - payload hash changed → push
  - ad row changed after the last push (`created_at` used as row version) → push
  - previous `failed`: push if the payload changed; else stop after 5 attempts; else wait on backoff 30 s / 2 m / 10 m / 1 h
- Grouping: due ads grouped by mapped industry, then chunked by 30

### Payload: `IIAdObject` (exact wire contract; "no extra fields are ever added") and field mapping (`industry-insights.ts` L91-110, L264-354)
| Wire field | Source | Rule |
|---|---|---|
| `ad_archive_id` (required) | Facebook ad id | 1) digits of `external_id` when it starts `meta_`; 2) `id=` param of `source_fields.facebook_ad_url` or `source_url`; 3) `source_fields.facebook_ad_id` if numeric |
| `page_name` (required) | `brand` | trimmed |
| `page_id` | numeric FB page id | `source_fields.page_id / fb_page_id / facebook_page_id / advertiser_page_id / page_profile_id` (5+ digits), or parsed from `post_url / page_url / facebook_page_url` (`facebook.com/<digits>/` or `page_id=`). Names never sent |
| `body` | `caption` | |
| `title` | `title` | |
| `caption` | `landing_domain` | follows FB's convention: the display link is the "caption" |
| `link_url` | `landing_url` → `tracking_url` → `offer_url` | first non-empty |
| `original_image_url` | `thumbnail_url` | signed URL, 30 days |
| `original_video_url` | `video_url` | signed URL, 30 days |
| `display_format` | `media_type` lowercased | e.g. video / image |
| `start_date` | unix seconds | `started_running`; fallback first-seen `discovered_at → fetched_date → created_at` |
| `is_active` | bool | last seen (`fetched_date → discovered_at → created_at`) within 14 days (`ACTIVE_WINDOW_DAYS`) |
| `end_date` | unix seconds or null | null while active; else last-seen date |
| `publisher_platform` | string[] | parsed from `platform`, then `source_fields.publisher_platform/platform`. Values: facebook, instagram, audience_network, messenger, whatsapp, threads. "meta" → facebook. Collector names → ["facebook"]. Non-Meta (tiktok, youtube, snapchat, pinterest, twitter, linkedin, reddit, taboola, outbrain, google, display, native, push) → omitted |
| `targeted_or_reached_countries` | ISO-2[] | from `countries` (names via `COUNTRY_NAME_TO_ISO2`: US, CA, GB, AU, DE, FR, ES, IT, NL, MX, BR, IN, NZ, IE, SG, ZA, JP, AE; 2-letter codes pass through; unknown names dropped) |
| `cta_type` | `cta` → UPPER_SNAKE | "Shop Now" → SHOP_NOW |
| `source_meta` | object | keys below, empty values dropped |

- `source_meta` keys (L329-350):
  - `fetched_via` (always set, default "unknown")
  - `external_id`
  - `category` (AdVault category)
  - `industry_bucket` (AdVault industry)
  - `ai_score`, `clone_count`, `likes`, `comments`, `shares`, `views`
  - `tags` (when non-empty)
  - `network`, `tracker`, `landing_domain`, `offer_url`, `post_url`
  - `discovered_at`
  - `start_date_source` (`started_running | discovered_at | fetched_date | created_at`)
  - `last_seen_at`
- **Not pushed (gap for redesign)**: none of the AI creative analysis (framework, hook, hook_type, ad_format, angle, short_angle, topic_tags, elements, visual beats, summary), transcript, landing page capture, redirect chain, offer domain, days_running, score breakdown or winner gates
- Hash: FNV-1a 32-bit run twice over stable sorted-key JSON → 16 hex chars (L357-380)
- Tests confirm the exact key set, the 14-day inactive rule, link fallback order, start-date fallback, page_id from post URL, the "never a page name" rule, the facebook default, country mapping, cta normalisation, chunk size 30, hash stability, env filter, backoff and 5-attempt cap, and that dry runs never suppress real pushes (`lib/__tests__/industry-insights.test.ts` L55-282)

### Logging and status
- **`industry_insights_push_log`**: id, ad_id, environment, facebook_ad_id, industry, pushed_at, status (`pending` default | `success` | `success_unmatched_industry` | `failed` | `dry_run`), http_status, attempts, last_error (≤1000), payload_hash, created_at. Indexes (ad_id, environment) and (pushed_at desc). Admin-only read
- **Run summary per env** (`EnvSummary`): environment, candidates, skipped_no_facebook_ad_id, skipped_unmapped_category, chunks_sent, ads_pushed, ads_failed, unmatched_industries[], elapsed_ms, last_error. Overall `RunResult`: run_at, dry_run, environments[], missing_secrets_for[]
- **Admin page** `/admin-insights-push` (`routes/_authenticated/admin-insights-push.tsx`):
  - Buttons "Dry run" and "Push now"
  - One card per env: configured / "no keys set", Last run, Pushed, Failed, Unmatched, "Fix mapping for: …", last error
  - Editable category mapping table (Category, Industry Insights industry, Enabled, Save)
  - Status counts cover log rows within 15 minutes of the latest push (`fetchPushStatus`, `industry-insights.functions.ts` L444-485)

### Triggers and cadence
- `POST /api/public/push-industry-ads` (header `x-ingest-token`; body `{dry_run?, max_ads?}`), called by pg_cron and the admin button (`routes/api/public/push-industry-ads.ts`)
- Cadence: "every 30 minutes" per public API docs (`routes/api-docs.tsx` L371). **No cron entry for it exists in the repo migrations**, so it is scheduled outside the repo
- **Reconciliation feed** `GET /api/public/industry-insights-synced-ads`:
  - Header `X-AdVault-Api-Key` = `INDUSTRY_INSIGHTS_RECONCILE_KEY`
  - Called once a day by the partner
  - Params: `from` (inclusive) and `to` (exclusive), ISO UTC, window ≤7 days; `limit` default 500, max 1000; base64 offset `cursor`
  - Scans `discovered_at` and `created_at` separately (≤20,000 each), merges, applies the same map + FB-id gates
  - Response: `{from, to, total, skipped_no_facebook_ad_id, skipped_unmapped_category, ads[{facebook_ad_id, external_id, industry, category, fetched_via, discovered_at, updated_at, pushed:{dev, stage, preprod, prod: success|failed|dry_run|success_unmatched_industry|pending}}], next_cursor}`. Never returns ad text or media (`industry-insights-synced-ads.ts`)

---

## 6. MCP tools and in-app assistant

### MCP server (`lib/mcp/index.ts`; manifest `.lovable/mcp/manifest.json`)
- Name `idc-advault`, title "IDC AdVault", v1.0.0. Supabase OAuth (aud `authenticated`)
- Endpoints:
  - `/mcp`: text tools, published
  - `/api/public/mcp-apps`: same tools plus the `ui://` resource `ad_gallery` "Selectable ad cards: creative preview, full caption, winner metrics, score provenance, cross-page selection, export and original download". Built, not published per docs (`docs/mcp-contract.md`)
- Server instructions (key product rules):
  - Winner gates: 50+ likes, 1+ clone, 7+ days live. `winners_only` is STRICT (all gates) by default; `winner_mode: any` gives the looser vault strip
  - Default window 60 days
  - Industry/category are source labels: matched exactly, not checked for topical relevance. Never silently reclassify
  - Never widen a query
  - Share links are short links `https://www.advault.net/s/<code>` only
  - Never claim a gallery was rendered unless it was
- **Shared `filterSchema`** (`lib/mcp/query.ts` L198-262):
  - `industry`, `category`
  - `query` (title/caption/brand/landing_domain), `brand`, `landing_domain`, `offer_domain`
  - `country`, `source` (collector e.g. SpyHero, Adplexity), `network` (e.g. Digistore24, ClickBank, Unclassified)
  - `media_type` (video|image)
  - `min_likes` 0-1e8, `min_clones` 0-1e5, `min_days_live` 0-3650, `min_ai_score` 0-100
  - `days` 1-3650 (default 60)
  - `winners_only`, `winner_mode` (all|any)
  - `dedupe` (default true; concept = landing domain + first 160 chars of normalised copy)
- `SORTS`: `ai_score` (default), `likes`, `days_live`, `clones`, `newest`, `comments`, `shares`. Missing metrics sort last (L418)
- Derived values:
  - `daysLive` = started_running → last seen, else `days_running`
  - `isRunning` = seen within 14 days
  - `resolveScore` → `{score 1-100, provenance stored|computed_at_read_time, breakdown[{key, label, value, max, hint}], breakdown_provenance explains_score|reference_only, recomputed_reference_score?}`
  - `winnerGates` → `{likes_50_plus, cloned_1_plus, live_7_days_plus}`
- **Ad summary object** (`adSummary`, query.ts L491-556), used by search/get/export:
  - Identity: id, external_id, title, copy, advertiser
  - Taxonomy: industry, category, taxonomy_source "source_taxonomy", taxonomy_note
  - Source: network, tracker, platform, source, countries[]
  - Destination: landing_domain, landing_url, offer_domain, offer_url, cta, post_url
  - Media: media_type, image_url, video_url, creative_url
  - Metrics: likes, comments, shares, views, clones, metrics_unknown[]
  - Score: ai_score, ai_score_provenance, ai_score_breakdown, ai_score_breakdown_provenance, (recomputed_reference_*)
  - Performance: winner_gates, days_live, started_running, last_seen, currently_running
  - Links: share_url, vault_url

| Tool | Inputs | Outputs |
|---|---|---|
| `search_ads` (read) | `preview_images` (default false, ≤5 inline images), `winner_mode`, filterSchema, `sort`, `limit` 1-50 (10), `offset` | matched, returned, offset, next_offset, window_days/from/to, sort, resolved_filters, winners_only, winner_mode, winner_gate_definition, diagnostics{rows_read_from_database, matched_before_winner_filter, matched_if_winner_mode_all, matched_if_winner_mode_any}, deduped_concepts, score_note, taxonomy_note, metrics_note, inline_images, previews[{id, kind inline_image\|video_poster\|link_only, image_url, video_url}], gallery_url, ads[adSummary with short share_url]. Plus a markdown list and resource_links (`tools/search-ads.ts`) |
| `industry_insights` (read) | filterSchema, `top` 1-25 (10) | scope{industry, category, window_days}, winner_gate_definition, totals{ads, still_running, winners_any_gate, winners_all_gates, advertisers, landing_domains, videos, avg_days_live, longest_days_live, avg_likes, avg_ai_score}, leaderboards top_landing_pages, top_advertisers, top_categories (top N), top_platforms, top_sources, top_networks (top 5). Each row: {name, ads, still_running, longest_days_live, avg_days_live, avg_likes, total_clones, avg_ai_score} (`tools/industry-insights.ts`) |
| `creative_insights` (read) | filterSchema, `framework`, `hook_type`, `top` 1-25 (10), `board_id` (overrides filters) | scope{industry, category, board_id, window_days, framework, hook_type}, coverage{ads_in_scope, analysed, note}, videos_analysed, top_frameworks, top_hook_styles, top_formats, top_video_styles, top_image_templates, top_angles (short_angle) each [{name, ads, share_pct}], body_parts[{part, ads, share_pct}] (excluding hook/cta/disclaimer), top_hooks[{ad_id, advertiser, ai_score, framework, hook_type, hook, angle}] sorted by score. Max 2000 analysis rows (`tools/creative-insights.ts`) |
| `top_ad_copy` (read) | filterSchema, `sort`, `limit` 1-30 (15) | scope, analysed_ads, top_copy[{id, external_id, headline, primary_text, cta, advertiser, landing_domain, likes, clones, days_live, ai_score, ai_score_provenance}], recurring_hooks[{phrase, ads}] = top 25 bigrams of words longer than 3 chars, stop words removed, count > 1 (`tools/top-ad-copy.ts`) |
| `get_ad` (read) | `id` (uuid or external_id; prefix `id:` / `external_id:`) | adSummary (signed media, short share_url) + transcript + creative_breakdown{media_kind, ad_format, format_tags, framework, framework_confidence, hook, hook_type, angle, summary, cta_text, elements, visual_beats} + share_note. Note: topic_tags and short_angle are not returned (`tools/get-ad.ts`) |
| `list_taxonomy` (read) | none | total_ads, industries[{name, ads}], categories_by_industry{industry: [{name, ads}]} (rows with no industry go under "Unassigned"), networks, sources. Scans up to 50k ads (`tools/list-taxonomy.ts`). Note: countries are not returned despite the description |
| `export_ads_context` (read) | `ids` 1-50, `include_transcript` (true) | schema `advault.selection/1`: generated_at, site, requested, exported, missing_ids, ambiguous_ids, rejected_ids, gallery_url, ads[{id, external_id, industry, category, advertiser, headline, primary_text, cta, media{type, image_url, video_url, primary_creative_url, range_support, keyframes}, transcript, transcript_status, destination{landing_domain, landing_url, offer_domain, offer_url, post_url, tracking_software}, metrics{likes, comments, shares, views, clones, unknown_metrics, days_live, started_running, last_seen, currently_running}, score{value, scale "1-100", provenance, breakdown, breakdown_provenance}, winner_gates, source{collector, network, platform, countries}, share_url}]. Plus JSON file `advault-selection-YYYY-MM-DD.json` (`tools/export-ads.ts`, `lib/selection-export.ts`) |
| `create_share_board` (write) | `name` 1-80, `ids` 1-100, `description` ≤500, `board_id` | board_id, board_name, share_url (`/s/<code>`, 7-char code), ads_added, ads_already_on_board, missing_ids, ambiguous ids. Makes the board public (`tools/share-board.ts`) |

### In-app creative assistant (`routes/api/chat.ts`, page `/assistant`)
- Model `openai/gpt-6-astra` via the Lovable gateway Responses API; reasoning effort low; up to 50 steps (L189-204)
- System prompt: "AdVault creative strategist for Idea Clan's performance marketing team"
  - Always call tools before answering
  - Quote real hooks and cite `https://www.advault.net/a/<id>`
  - Present industry/category as collector labels
  - Write fresh copy grounded in patterns; never copy word for word
  - Be concise and practical (L11-20)
- Data scope: only `ad_creative_analysis` rows with status `ok` joined to non-deleted ads (brand, industry, category, title, ai_score, days_running, likes). Max 5000 rows per question, paged by 1000
- Tools:
  - `creative_stats({industry, category, limit})` → analysed, truncated, note, videos, frameworks/hook_types/formats as top-10 {key, count, share}
  - `top_hooks({industry, category, limit, framework, hook_type})` → top 20 by ai_score: ad_id, url, brand, score, days_running, framework, hook_type, hook
  - `ad_breakdown({ad_id})` → media_kind, ad_format, framework, hook, hook_type, angle, summary, cta_text, elements, visual_beats, transcript (or "not analysed yet")
- Not reachable by the assistant: topic_tags, short_angle, format_tags, landing pages, offer/redirect data, engagement beyond likes, countries, time window (no date filter)
- Suggested prompts (`assistant.tsx` L42-47):
  - "What framework do the top 50 Lead Gen ads use?"
  - "Which hooks are working for Weight Loss right now?"
  - "Write 5 new UGC hooks for Telehealth based on what's running"
  - "What creative formats dominate VSL ads this month?"
- UI copy:
  - Subtitle: "Ask what hooks, frameworks and formats are working across the vault — then get fresh copy built on those patterns."
  - Placeholder: "Ask about hooks, frameworks, formats or ask for new script ideas…"
  - Loading: "Reading the vault…"
- **Security flag**: `/api/chat` has no auth check in the handler and reads with the service-role client. Whether the route sits behind an auth gate elsewhere was not confirmed

---

## 7. Background jobs and APIs (`routes/api/public/*.ts`)

- Auth: `x-ingest-token` accepts INGEST_TOKEN, AUDIT_CRON_TOKEN or the scheduler token in `job_tokens` (`lib/job-auth.server.ts`). Some routes accept INGEST_TOKEN only (classify-ads, mirror-media)
- Cron sources: `drizzle/migrations/00xx` plus `supabase/migrations`

| Endpoint | Purpose | Schedule |
|---|---|---|
| `analyze-creatives` | Creative breakdown worker (half newest, half oldest backlog via `pick_unanalyzed_ads`). Then category recheck, label-dispute re-inspection (≤40), topic-tag backlog, short-angle backlog, rescore. Body `{limit ≤50 (10), retry_failed, resume, rescore_ids, tag_limit, angle_limit}`. Concurrency 8, 3.5-minute work budget, 6-minute lease, pauses on 402/403. Returns considered, analyzed, failed, failures, category_rechecked, category_proposals, paused, rescored, topic_tagged, short_angles | hourly at :27 (`analyze-creatives-hourly`, 0017); the earlier every-5-min job was removed (0015) |
| `transcribe-ads` | Transcribe videos and reclassify from the script. `{limit ≤200 (25), external_ids, force, reclassify}` | was hourly at :20 (`transcribe-video-ads-hourly`), unscheduled in 0015; now folded into analyze-creatives |
| `classify-ads` | Sub-category backfill for one industry; VSL → Telehealth reroute | on demand |
| `audit-categories` | Rules-only full-vault industry/category audit and correction, `dry_run` | on demand |
| `vision-audit` | Vision + landing industry audit, ≤400 ads, min_confidence 0.75 | on demand |
| `category-qa-daily` | Daily AI category QA → pending proposals | was 03:15 UTC; cron removed (0014); disabled by QA flag |
| `push-industry-ads` | Industry Insights push (section 5) | every 30 min per docs; no cron in repo |
| `industry-insights-synced-ads` | Partner reconciliation feed (read only) | called daily by partner |
| `trace-redirects` | Trace landing → redirects → offer page, then capture page text + screenshot, rescore; backlog re-check (Lead Gen / VSL / Telehealth first) | hourly at :07 (0017; was :40 in 0010) |
| `capture-landing-pages` | Capture landing page text + screenshot for new ads, rescore. `{limit ≤200 (60)}` | hourly at :47 (0017; was :50 in 0011) |
| `ingest-landing-pages` | Bot feed of landing-page captures `{pages:[{external_id\|ad_id, url, text\|html, screenshot_url…}]}` | push by bots |
| `ingest-ads` | Main bot ingest: normalise, block brands, route industry, sub-categorise, dual category, score, dispute handling | push by bots |
| `delete-ads` | Soft delete by exact external_id, ≤500 per call, 60/min, 7-day purge | on demand (bots) |
| `score-ads` | (Re)compute the 1-100 AI score `{limit ≤5000 (2000), rescore, offset}` | on demand |
| `backfill-media` | Copy live external creatives into storage; clear dead URLs | hourly at :37 (0019) |
| `mirror-media` | Mirror given media items into storage `{items}` | on demand |
| `verify-media` | Health sweep; delete ads whose creative is missing `{limit, offset, dryRun}` | periodic (no cron found) |
| `media.$` | Private `ad-media` proxy: signed URL or public-board ad only; also `landing` screenshot and `landingdoc` PDF | n/a |
| `side-browser` | GET feed for the owner's laptop browser assistant to check advertorials blocked to servers; reports `found\|no_offer\|dead\|blocked` with landing/offer URLs | on demand |
| `spy-requests` | Bot queue for spider requests (GET queued, POST progress) | bots poll |
| `spider-queue` | Open read-only JSON feed of spider requests (no auth, no emails) | bots poll |
| `mcp-apps` | MCP Apps interactive endpoint (OAuth in handler) | n/a |
| (SQL) `daily-snapshots` | `record_daily_snapshot()` for the Rising Feed | 23:50 UTC daily (0022) |

- **Security flag**: `supabase/migrations/20260904201155…sql` hardcodes a project URL and a plaintext `x-ingest-token` value inside the cron body. Treat that token as compromised and rotate it.

---

## 8. Product intent notes (plans, roadmap, docs)

- **Category QA plus push to AdLab** (`.lovable/plan/category-qa-push-to-adlab-2026-09-10.md`):
  - QA flow: pick a slice (industry + category + window + ≤400) → run, cheapest signal first (stored transcript < one transcription < thumbnail; bot landing label trusted as a free strong signal) → review table (creative, advertiser, current label, proposed label, confidence, one-line reason, worst first) → tick and Apply through the reversible pipeline. Nothing changes until Apply
  - Bot landing-page category is shown as a "third opinion"; agreement with the AI is treated as high confidence
  - "Push to AdLab": button on the ad card and the multi-select bar; project picker using the user's AdLab login; create a new project; optional note; per-ad record ("Already in <project>"); payload = creative, advertiser, full copy, transcript, landing and offer URLs, AdVault permalink
  - Use case: "brief-to-build" (strategist pushes 3 winning weight-loss VSLs into "Q4 GLP-1 angles"); also competitor swipe files per client and "make variants" handoffs
  - Status: BLOCKED pending AdLab endpoints and auth (`roadmap.md`)
- **Fix scoring / funnel / redirects** (`.lovable/plan/fix-scoring…2026-09-24.md`):
  - Branded penalty only for real brands (clean established domain, no advertorial, no redirect, no affiliate link, no DR script)
  - Score the transcript as DR structure (hook, problem/story, proof, offer/urgency, spoken CTA) under "Performance craft", reusing analyzer elements so score and Frameworks page agree
  - In-house redirect tracer; funnel shown in the drawer with "from bot" / "traced by AdVault" badges; "direct link" only when confirmed
  - Drawer "View on Facebook" (post first, else Ad Library `facebook.com/ads/library/?id=<ad_id>`); store `fb_post_id`, `ad_library_url`
- **Soft delete** (`.lovable/plan/soft-delete…2026-09-09.md`): data-layer hiding for everyone except admins; admin trash "Deleted (7-day restore)" with thumbnail, advertiser, reason, source, deleted when, days left, Restore
- **Roadmap shipped items relevant to Insights** (`roadmap.md`):
  - Industry homepage with top categories / landing pages / advertisers for a date range (`vault_leaders` RPC, live SQL, browser-cached 10 min, per AGENTS.md L16)
  - Frameworks page: ad opens in a side window, "Open in Vault", "untapped angles explorer"
  - Insights: Top categories leaderboard
  - Ad window: funnel badge, "Clone this angle" and "Copy hook", all-industries / this-industry switch
  - Rising Feed via daily snapshots ("needs two daily snapshots to compare"; first snapshot 23:50 UTC)
  - Vault filtering moved server-side
  - Rescored AI score: less longevity weight, credit for advertorial/affiliate funnels and clickbait DR copy, branded penalty, unmeasured ads capped
- **MCP contract** (`docs/mcp-contract.md`, 2026-09-07): `/mcp` published; `/api/public/mcp-apps` built, not published
- **Correction import** (`docs/category-correction-import-plan.md`): built; at writing, no correction file had been applied and both history tables were empty

### Redesign-relevant gaps spotted (designer flags)
1. The Industry Insights payload carries no AI creative intelligence (framework, hook, angle, topic tags, format, elements) and no funnel data. The receiver gets raw ad + engagement + AdVault category only.
2. The category map is category-name only, not industry-scoped. Several high-volume verticals are unmapped (GLP-1, ED/TRT/HRT, Health/Life Insurance, Solar, Roofing, Make Money). The "Telehealth" row likely never matches.
3. FB ad id is a hard requirement. Per the 2026-09-24 plan, many ads lack it, so large parts of the vault never reach Insights.
4. `ad_format`, `hook_type`, `format_tags` and `visual_beats.role` are free text, so expect label drift unless normalised. Only `framework` and element keys have closed lists, and even those are not enforced on write.
5. AI relabel auto-apply (≥0.7) runs ungated while the QA "automation" flag reads OFF. That is a trust and transparency risk for any UI showing "verified" categories.
6. Category canon in the DB disagrees with the TS taxonomy (Firearms missing; Lead Gen / Dance & Fitness extra).
7. Topic tags lose their facet (audience / product / problem / keyword). A redesign that wants facet filters needs the prompt to return structured facets.
