# Industry Insights Dashboard — Figma vs. what we shipped

Figma: file `4KOjmDqJX1lWSKD2Dg6Xor`, page `5055:14596` "Dashboard".
Frames read: `5055:14597` (main), `5055:17532` (UX notes), `5055:17568` (Day 1 / thin), `5055:17818` (non-ecom module states).
Our build: `src/pages/insights/InsightsOverview.tsx` + `src/insights-dashboard/components/` (16 files).

---

## First: the brief. Is it ours or theirs?

**It's theirs.** The daily brief is in the Figma — node `5055:14917`, layer name `Today brief`, headed **"✨ Today across your 6 industries"** with a **"3 windows close within 48h"** counter on the right. We did not invent it. We kept the block and rewrote almost everything inside it.

The Figma's brief reads: *"Weight loss is the story: the GLP-1 'off-ramp' is breaking out (+4,800%) and no advertiser owns it yet. Beauty is following a 'glass skin' format wave... 12 of today's 34 signals passed the brand-safety gate."*

**Why it exists at all:** a dashboard that opens with five counts makes the user do the reading. The brief does the reading for them — one paragraph naming the sharpest thing that moved, so the rest of the page is confirmation rather than homework.

**What ours contains** (`DailyBrief.tsx` + `buildPopulatedBrief` in `lib/fixtures.ts`) — four to five sentences assembled from this module's own numbers, nothing else:

1. Live ads + advertisers across your followed industries, and how many changes cleared the recurrence gate.
2. The sharpest mover — domain, industry, 30d vs. prior 30d ad count, % change.
3. The dominant market angle as a % of live creative, against your own %.
4. How many followed advertisers have gone quiet (21+ days, no new creative).

**Five things we changed, and why:**

| Change | Why |
|---|---|
| **Daily → weekly.** "Today across your 6 industries" became **"This week, in your industries"** | There is no scheduled re-sync behind this page. The Figma's own copy guardrail (`5055:17547`) says *don't promise "updated daily" until a scheduled re-sync exists* — the headline broke the note. |
| **The ✨ and the AI framing are gone.** Attribution is now "Written from your followed industries · N recurring changes in the 7 days to \<date\>" | Same guardrail: *don't label templated text "AI"*. A sparkle icon is the word "AI" without typing it. We name what it was built from instead of who wrote it. |
| **Added "Show the N numbers behind this"** — a reveal listing every fact the paragraph was assembled from, each with its own provenance chip | A summary you can audit is worth ten you can't. This is the one thing that makes a generated paragraph safe to put at the top of the page. |
| **The "3 windows close within 48h" counter is gone** | It's a Trends artefact, and Trends is out of scope. See "Act on this now" in List A. |
| **Content is our numbers, not a written narrative.** No GLP-1 story, no "glass skin wave", no "brand-safety gate" | The Figma brief is fed by the Trends signal engine (stated in the UX notes, `5055:17541`). That engine is not in this dashboard's scope, so the brief had to be rebuilt from data this page actually holds. |

Thin and zero states render the same block through one `available: false` branch with an honest reason — *"Nothing indexed in Credit Repair yet, so there's nothing to summarise"* — never filler prose, never an empty quote box.

---

## List A — every block in the Figma

| Figma block | In our build? | Where it lives / what replaced it | Why |
|---|---|---|---|
| **Module sidebar** (Dashboard · My Feed · Discover · Trends · Saved Ads · Competitors · Domains + a Boards list) | No | — | It's a module sub-nav mock. Our page renders inside the real FabAds app shell; duplicating it would fork the nav. |
| **Top bar** — freshness dot "Signals refreshed today, 6:20 AM" · Refresh now · Manage preferences | Yes | `InsightsOverview.tsx` top row | Kept as-is. "Refresh now" fires a toast restating when we last scanned — it never implies a live pull, because there is none. |
| **"Good morning, Siddhant"** greeting | No | Replaced by the plain `Industry Insights` H1 | A greeting is a personality tax on every visit and pushes the actual title out of first position. |
| **Chip "US · 8 sources"** | Partly | `US · 4 sources`, tooltip lists them: Meta Ad Library, StoreLeads, AdPlexity, Google Trends | The 8 was never substantiated. We name the four we can actually cite. |
| **Module description paragraph** | Yes | Header, rewritten | Kept the orientation job, dropped "turns what's working into briefs you can launch" — briefing isn't wired. |
| **Today brief** (`Today brief`) | Yes, rebuilt | `DailyBrief.tsx` — see section above | Kept the block, changed cadence, attribution, source and content. |
| **"3 windows close within 48h"** counter on the brief | No | — | Urgency countdown belongs to the Trends signal engine, out of scope here. |
| **KPI row — the row itself** (5 tiles, sparkbars, sub-captions) | Yes | `KpiRow.tsx` | Kept the shape, sparklines and the caption-under-every-number pattern. |
| ↳ **Followed industries 6 of 105** | Moved | Header state note: *"6 of 105 industries followed."* | It's page context, not a metric — it explains everything below rather than measuring anything. |
| ↳ **New signals today 34** | Yes, renamed | `Changes this week` | "Signals" is the Trends vocabulary. This page counts observed changes. |
| ↳ **Live ads 20,515** | Yes | `Live ads observed` | Unchanged in substance. |
| ↳ **Ecom stores in range 812 of 1,063** | Replaced | `Advertisers indexed` | "Ecom stores in range" is a coverage stat about our index, not about the user's market. |
| ↳ **Est. category sales $48.2M** | Demoted | Still exists as `Est. monthly sales, ecom` but out of the primary five (`KPI_PRIMARY_KEYS`) | It's the only third-party *modelled* figure. Wedged between four observed counts it inherits their credibility. |
| ↳ **(new) Median creative lifespan** | Added | `KpiRow` | See List B. |
| ↳ **(new) Your share of live creative** | Added | `KpiRow` | See List B. |
| **Top ads gallery** — ranked by longevity, format filter pills, days-running badge, hook, "N similar", Variation / + Board / Save | Yes | `LongRunnersGallery.tsx` | The hero, as designed. `Variation` ships **disabled with a reason** — Genie doesn't read URL params yet, so wiring it live would silently drop the ad's context on click. |
| **Competitor ad launches** (12-week column chart with spike annotation) | Yes | `LaunchCadenceChart.tsx` | Kept, plus every column is clickable and filters the change feed to that week — a chart on a landing page has to be actionable. |
| **What angles are working** (donut, 198 ads, Lifestyle 32% / Features 30% / …) | Yes | `AngleMixDonut.tsx` | Kept, plus a your-vs-market baseline per row. "Lifestyle 32%" means nothing until you know what *you* run. |
| **Act on this now** — signal card, "−36h left" countdown, Caution·medical-claims chip, suggested angle, Create brief / Save to watching / Dismiss | **No** | Replaced by `ChangeFeed.tsx` | Trends is out of scope, and this card is pure Trends output. A manufactured 36-hour deadline on data we re-scan irregularly is a fake urgency we can't honour. |
| **"See all trends →"** links | No | — | Trends excluded from this dashboard's scope entirely. |
| **Who's actually making money in your industries** — segmented Ecom/Affiliate/Lead gen/PPC/Telehealth table, est. sales, est. visits, products, platform, live ads | Yes, changed | `DomainsTeaser.tsx`, **below the fold**, headline now **"The businesses behind these ads"** | The sales figures are StoreLeads estimates. "Who's actually making money" asserts revenue knowledge we don't have, over a modelled number — the single most-cited complaint against this whole product category. |
| ↳ **Per-type column swap** (`5055:17818`: affiliate → tracker/offers/rotation; lead gen → tracker/landers/top angle/markets) | Yes | `DomainsTeaser` — `DomainGroup.columns` | Kept exactly. Columns swap, they never grey out; an em-dash across 251 of 1,063 domains reads as "we have no data" when the truth is "that field doesn't exist for this business model". |
| ↳ **Source footer** naming observed vs. estimated tiers | Yes | `sampleNote` + `universeNote` | The Figma is right that this one sentence is what makes the table believable. |
| **What you can do here** — 6-surface router (Trends / Discover / Competitors / Domains / Saved Ads / Boards, with live counts) | **No** | — | A card that only describes the nav next to it. Two of its six rows point at Trends, which is out of scope, and the counts it carries are already on the blocks they describe. |
| **Get more out of this** — 4-item checklist, "2 of 4 done" | Yes, **3 items** | `SetupChecklist.tsx` | Follow industries · Track your first competitor · Install the Chrome extension. |
| ↳ **"Turn on the weekly digest"** | **No** | Cut | That feature does not exist. A checklist promising a capability we don't ship undercuts the honesty the rest of the page is built on. |
| ↳ **"Track 3 competitors"** | Softened to "Track your first competitor" | `SetupChecklist` | The UX notes themselves (`5055:17538`) call tracking the **first** competitor the activation event. Three is an arbitrary gate on the way there. |
| **Top ad movers** (30d ad-volume bars, +308% … −83%, Track all) | Yes | `MarketMovers.tsx` | Kept. Direction never rides on colour alone — icon + signed number carry it. Track/Track all are local-optimistic only; nothing writes to the demo workspace. |
| **Day 1: "Your first signals are still coming in"** banner | Yes | Split — `DailyBrief` unavailable branch + `CoverageRescue.tsx` | Kept the argument verbatim in spirit: 0 indexed ads is a gap on **our** side, never proof the market is empty. |
| **Day 1: "Start here — industries with live data today"** adjacency table (Debt Relief 340 ads, Personal Loans 890, …) | Yes | `CoverageRescue.tsx` | The strongest idea in the whole Figma. Real counts from neighbouring indexed industries are the argument; the numbers do the persuading. |
| **Day 1: "What unlocks once an industry has data"** (Store economics / Funnel intel / Top movers) | **No** | — | A locked-features teaser. It advertises capability instead of giving the user the one-click follow that unlocks it — `CoverageRescue` already does that directly above it. |
| **Day 1: Watching (0)** card — "save a signal and its window ticks here" | **No** | — | Only exists in the thin frame (`5055:17786`), and it's storage for Trends signals with countdown windows. Both halves are out of scope. |
| **Day 1: KPI "—" with "needs store data to estimate"** | Yes, generalised | `KpiTile.naReason` across all states | Correct instinct, applied everywhere: a null value always renders its reason, never a bare dash. A real `0` renders as an ordinary number and looks visibly different. |
| **UX note: copy guardrails** (`5055:17547`) — source + freshness on every number · never a bare dash · don't label templated text "AI" · don't promise "updated daily" | Yes, all four | `Provenance.tsx`, `naReason`, `DailyBrief`, `meta.refreshNote` | These four lines are the best thing in the Figma and we implemented every one. |
| **UX note: adaptive 5th KPI** — swap EST. CATEGORY SALES → OFFERS IN ROTATION when followed industries aren't ecom-heavy | **No** | We dropped est. sales from the primary five outright | Solves the same problem more simply. A tile whose *identity* changes per user is hard to read across sessions; removing the estimate from the headline row removes the failure mode. |
| **UX note: "What was cut, and why"** (`5055:17555`) — claims the creative strip was removed, "Competitors tracked" KPI removed, "Urgent windows" KPI folded in | n/a — **stale** | — | Flagging it: the frame contradicts its own note. The creative strip is back as the hero gallery, and the KPI layers are still *named* `KPI/URGENT WINDOWS` and `KPI/COMPETITORS TRACKED` while displaying "Live ads in your space" and "Ecom stores in range". The cuts were applied by relabelling in place, so don't read that panel as the current spec. |

---

## List B — what we added, and why

| What we added | Why | What it answers that the Figma didn't |
|---|---|---|
| **Change feed** — `ChangeFeed.tsx`, six named signal kinds: new-angle, offer-shift, format-expansion, velocity-change, landing-page-change, withdrawal | The documented weekly ritual of a performance marketer is *what's new → what's still running → what disappeared → write a brief*. We scanned 12 products in the category and none of them opens with it — Meta Ad Library keeps no baseline to diff against. | **"What changed since I last looked?"** The Figma answers "what is happening right now"; nothing on it answers "what is different from last week". |
| **The recurrence gate on that feed** — signals seen once render de-emphasised with no actions; only 2+ sightings get the full row | A single observation is not a trend. But hiding one-offs loses the teaching moment — the user should see we noticed it and are deliberately declining to call it. The visible restraint is the trust-builder. | Nothing in the Figma distinguishes a one-off sighting from a pattern. Its "Act on this now" card presents a single detection with a countdown as if it were established. |
| **Provenance chips** — Observed / Estimated / Derived on every number, `Provenance.tsx` | The Figma asks for this in prose (*"label the tiers"*, *"every number carries its source"*) but never designs it. This is the mechanism: an icon + word next to the figure, never colour-coded, using the same neutral tokens for all three tiers. | **"Can I trust this number?"** — per number, not per table. The Figma's one footer sentence covers the domains table only; every other figure on the page is unlabelled. |
| **Saturation caveat on long-running ads** — flagged past 90 days, surfaced on the card and as a block rollup | Every competing tool ranks by longevity and quietly sells it as proof. Past 90 days across many advertisers the same signal can mean a burnt-out audience, not a winner. The Figma's own UX notes say this (`5055:17541`) — but only in the notes; the gallery frame shows a `187d` badge with no qualification. | **"Is 187 days good, or is it fatigue?"** The Figma ranks by longevity and stops there. |
| **Creative share of voice** — `ShareOfVoice.tsx`, per followed industry, stacked one-hue bar | Share of voice is the headline metric of the enterprise tier (Sensor Tower, SimilarWeb, MediaRadar) and absent from the DTC/agency tier we compete in. Bringing it down-market is real differentiation — provided it's named as share of **live creative**, never spend. | **"How big am I in this market?"** The Figma has no metric that positions the user inside their own industry. |
| **You vs the market** — `YouVsMarket.tsx`, creative behaviour only: ad counts, launch cadence, lifespan, format/angle mix | This is the block no pure-play ad-intelligence tool can build — Foreplay's Spyder and Lens are two products whose data never joins. FabAds is the ad manager, so it sees both sides. Verdicts ship as labels, never colours; below-market lifespan isn't "bad". | **"Are they refreshing faster than me because they found a better angle, or because they hit the same wall?"** Every Figma block looks outward only. |
| **Your share of live creative** + **median creative lifespan** KPIs | Two of the five headline slots now carry a number about *you*, not about our index size. | The Figma's five tiles are all market-side or coverage-side; none of them tells the user anything about their own account. |
| **Watchlist health** — `WatchlistHealth.tsx`, cap rendered as a slots-used constraint, quiet advertisers first with an Unfollow next to them | An unbounded follow list is the most reliable predictor that a user abandons an ad-intelligence tool. Forty competitors and twenty signals guarantees the loop dies within a month. So this card prunes rather than celebrates. | **"Is my setup still worth checking?"** The Figma only ever adds — Follow, + Track, Track all — with no surface that subtracts. |
| **Board hygiene** — `BoardHygiene.tsx`, stale and never-briefed boards, deliberately unflattering, CTA is "Review" not "Delete" | Swipe files die. Someone saves forty ads in one sitting and never opens the board again; no product in this category surfaces that rot. Rule in the file: no vanity total — only counts that imply an action. | **"Which of my saved boards still mean anything?"** The Figma lists board names in the sidebar and counts them in the router. Neither says whether they're alive. |
| **"Show the N numbers behind this"** on the brief | A generated paragraph at the top of a dashboard is only safe if it can be audited in one click. | **"Where did that sentence come from?"** |
| **Cadence column → change feed filter** | A chart earns its place on a landing page only if the mark itself is actionable. Click the spike week, land on what actually happened that week. | The Figma's cadence chart annotates the spike but the spike goes nowhere. |
| **Angle legend rows link to Discover** (`?angle=<key>`, resolved from real headlines) | The donut wedges can't take keyboard focus (recharts hardcodes `tabIndex: -1` on Pie sectors), so the legend is the real navigation surface — genuine `<Link>`s, one per angle. | The Figma donut is a static readout. Ours is a filter you can walk into. |
| **`StatePill`** — dev-only populated / thin / zero switcher, gated behind `import.meta.env.DEV` | The Figma ships two of the three states as separate frames. This makes all three reviewable in the running build in one click, and never renders for end users. | — (build tool, not product surface) |

---

## Scope note

**Trends is excluded from this dashboard entirely.** That single decision accounts for most of List A's "No" rows: the "Act on this now" card, the 48-hour window counter, the Watching card, the "See all trends" links, and two of the six rows in the surface router. The Figma treats this dashboard as a Trends teaser with a workspace strip attached; we built it as a standalone control tower whose every block is fed by data this module holds itself.

Per Maalik: the Figma **"is just an idea, not the proper design."** It was cross-checked block by block and rebuilt in our design system — the arguments in its UX notes survived better than its layout did.
