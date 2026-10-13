# Industry Insights v3 — BUILD LOG

Branch `industry-insights-v3` (cut from `origin/main` @ b2437a0; local `main` was 145 commits stale).
Orchestrator session worktree: `.claude/worktrees/priceless-payne-e2f7a1`. Nothing pushed, nothing merged to `main`.

## Status

| Phase | State |
|---|---|
| 0 — Read, inventory, contracts, questions | ✅ done — answers in, **GO given 2026-10-10** |
| 1 — F1 data, F2 shared UI, orchestrator routes/sidebar | ✅ done — F1 + F2 merged with follow-up fixes; host, sub-nav counts, pinned-boards slot, contract stubs wired; gates green (typecheck, eslint on touched files 0, vitest 194/194) |
| 2 — A Discover+Feeds, B Advertiser, C Elements, D Drawer+Boards, E Cross-surface | ✅ all merged; follow-ups in flight (A: `q` search, E: V2 exit path + test timeout). Gates green: typecheck, eslint touched 0 errors, vitest 335/335 (×2) |
| 3 — Merge, Q (QA), final report | ✅ done — QA: 0 blocker / 4 major / 10 minor / 7 cosmetic → all 21 fixed and merged, majors re-verified in browser. Final gates: typecheck ✅, eslint 0 errors on every V2 + touched file ✅, vitest 385/385 ✅, `npm run build` ✅. Final report: `docs/industry-insights/FINAL-REPORT.md` |

### Baseline on `origin/main` (before any v3 code)
- `npm run typecheck` ✅ · `npm run test` ✅ 81/81 · `npm run build` (not yet run)
- `npm run lint` ❌ **798 errors / 205 warnings pre-existing**, none ours → gate proposed in Q15.
- Playwright not installed → Q14.

---

## Inventory (Phase 0, step 2)

> The "v3 fate" column was written before the fresh-module decision. Now **nothing in the old module is replaced or edited**; V2 only reuses old code by read-only import or by copying it into `insights-v3` folders.

| Area | Today | v3 fate |
|---|---|---|
| Routes (`src/App.tsx` 252-275) | `/insights`→feed, `/insights/overview` (Home dashboard), `/insights/discover`, `/insights/trends`, `/insights/boards[/:id]`, `/insights/competitors` (+`?view=domains`), `/insights/saved` (**stub**: ComingSoonPage), `/insights-v2/feed` | new 6 routes in `INSIGHTS_ROUTES`; old feed/competitors redirect; Home/Trends → Q12 |
| Sidebar (`components/sidebar/modules.ts` 158-182) | Home · My feeds · Discover · Trends · Saved Ads · Competitor · Board | My Feeds · Discover · Advertiser · Creative Element Insights · Saved Ads · Boards |
| Mobile (`mobileRoutePolicy.ts` 90-139, `MobileTabBar.tsx:89`, `MobileInsightsTabs.tsx`) | feed/discover/boards/saved full; overview/trends/competitors blocked | feeds/discover/saved/boards full, advertisers/elements blocked (fail-closed) |
| Ad data (`src/lib/insights-dummy-data.ts`, 800 ads) | 15 generic industries, `category = industry`, no analysis fields, `analysed` flag, no engagement, fake hashtags | **left untouched** (Home dashboard, onboarding, Genie `flowSources.ts` import it). v3 gets its own universe in `src/lib/insights-v3/data/` |
| Feed page `pages/insights-v2/InsightsV2Feed.tsx` (815) | compact header on scroll, Follow brand, URL drawer/modals | patterns reused by A; page replaced |
| Discover `pages/insights/InsightsDiscover.tsx` (563) | tabs trending/industry/platform + filter bar | replaced by A |
| Competitors `pages/insights/InsightsCompetitors.tsx` + `CompetitorDetailDrawer.tsx` (Sheet, 243) + `CompetitorsDomainsView.tsx` | prototype Sheet is small; **live app overlay** (screens 2026-10-10) is the reference: AI Strategy Summary, KPIs, Launch Activity, Angle Mix, Proven Winners, Hooks & Keywords, CTA Mix, Landing Pages | replaced by B's Advertiser page + overlay |
| Ad drawer `components/insights/InsightAdDetailDrawer.tsx` (761) | analysed/not-analysed variants, Analyse buttons, Create Variations (unwired) | upgraded by D (port, keep all kept sections) |
| Cards `IndustryInsightsAdsCard.tsx` (556), `InsightAdCard.tsx` (243) | Follow brand, Save, "Send to Genie" via `genie6/flows/SendToGenieMenu.tsx` | new v3 card by A, reusing SendToGenieMenu |
| Boards `pages/insights/InsightsBoards.tsx`, `InsightsBoardDetail.tsx`, `SaveToBoardModal.tsx`, `hooks/use-insight-boards.ts` (Supabase) | ads only; pinned boards in localStorage `genie6:insights:pinned-boards` | any element type → Q10 |
| Follow | **two systems**: `insight_user_preferences.followed_brands` (names) + `insight_follows` (competitor ids) | → Q10 |
| Search popover `insights-v2/InsightsSearchPopover.tsx` | scopes feed/discovery/boards/competitors; **4 broken param links** (`?search=` unread, `/insights-v2/search` no route) | E rescopes + fixes |
| Dashboard tiles | `growth/InsightsJourneyCard`, `growth/IndustryInsightsCard`, `ai-plan/IndustryInsightsTile`, `ai-plan/AnalyticsHero` KPI labels, `IndustryInsightsWidget`, `NewAdsFetchedTile` etc. (dead `?brand=`/`?category=`/`?filter=new`) | E relabels + repoints |
| Onboarding | `onboarding-demo/steps/InsightsQuickSetup.tsx`, `FirstLoginOnboardingModal`, `mobile-onboarding/MobileInsights*` | E: industry + page follows feed My Feeds |
| Genie picker | `genie6/studio-v4/components/IndustryInsightsPicker.tsx` (reads `mocks/shared`, not ad data); `flows/data/flowRegistry.ts` industry-insights actions already include use-framework/hook/angle/concept | E: elements + ads from v3 data; v3 ids resolvable by `getFlowSource` |
| Reports cross-sell | `components/shell/ReportsInsightsCrossCard.tsx` ("Industry Insights Pro · ₹999/mo") | E: copy only |
| Forbidden names | visible "Meta Ad Library" in `insights-dashboard/*` (Provenance label, tooltips), `insights-trends/lib/trendsDisplay.ts`, `CompetitorsDomainsView.tsx:212`; StoreLeads in dashboard; Foreplay in comments | → Q13 |
| Reusable | KpiRow + InfoTip (`insights-dashboard/components`), TrendsToolbar scope pattern, `DateRangeWithPresets`, `TrendingTagsStrip`, `MasonryGrid`, `use-infinite-scroll`, `IndustryInsightsAdsCardSkeleton`, `SaveToBoardModal`, `PinnedBoardsSection`, `SendToGenieMenu`, recharts + `ui/chart.tsx` | F2/A–D reuse |
| Missing entirely | Download action, AI summary block, "based on X ads", New badge, Winner badge, generic top-10 group | F2 builds |

---

## Decisions (Maalik, 2026-10-10)

**Overriding instruction:** build a **fresh new module "Industry Insights V2"** beside the old one. Do not change anything in the old Industry Insights. Do not push, do not merge.
→ own sidebar module (`launchv2` precedent), own namespace `/industry-insights/*`, code under `insights-v3` folders (the `insights-v2` folder name is already the old feed). Old pages, components, hooks, data and routes are read-only; anything needing a change is copied into v3.

| # | Topic | Answer → applied as |
|---|---|---|
| Q1 | Industries | "Amalfa comes under E-Com" → VSL · Telehealth · Lead Gen · E-commerce (incl. Demi-fine & Fashion) · Search Arb · Others. "Adult" category from the reference is excluded from the demo data |
| Q2 | Categories | yes → full A–Z list in every industry, 0-count disabled |
| Q3 | Period | yes → 7d / 14d / 30d / 90d / 6m / 12m / All, default All |
| Q4 | Winner | yes → active + ≥14 days live + ≥2 clones; engagement mark = top 10% of reported engagement in scope |
| Q5 | Status | yes → active ("Seen live", 14-day window) / inactive; no paused |
| Q6 | AI score | ok → reference model as-is incl. likes/social parts, "Not reported" when missing |
| Q7 | Rising/Scaling | yes → as in `types.ts` (trend vs previous equal period; All = last 30 vs prior 30) |
| Q8 | New | ok → session-based last visit; first visit seeded 2 days back |
| Q9 | Elements | "Domain, Landing page, Offer, Page are also elements, not for all, accordingly" → hook = style, angle = grouped short angle, concept = 37 formats, plus **domain, page, landing page, offer as savable/downloadable elements** with per-type actions (`ELEMENT_ACTIONS`). Offer gets its own detail overlay (B). |
| Q10 | Persistence | ok (Supabase) — **superseded by the fresh-module rule**: shared Supabase board tables would leak V2 element items into the old module's boards. V2 uses its own localStorage stores behind an adapter (swappable to Supabase later). Flagged to Maalik. |
| Q11 | Use in Genie | ok, use existing → existing `use-hook / use-framework / use-angle / use-concept` flow actions |
| Q12 | Home + Trends | "disable them for now, don't change anything in them" → V2 has no Home/Trends; old module untouched |
| Q13 | Source names | "nahi chahiye" → none anywhere in V2 (UI + dummy data), grep-gated |
| Q14 | QA screenshots | Maalik asked what this is → explained; default = in-app browser screenshots, no new dependency |
| Q15 | Lint gate | explained to Maalik (repo has 798 pre-existing errors) → zero lint errors in files V2 adds/touches; old errors left alone |
| Q16 | Download | ok → ad = media + .txt (copy + analysis); element = Markdown one-pager; LP = screenshot + page text |
| Sketch | Discover sketch | not shared → building to spec |
| Q17 | Dashboard tiles / onboarding / Reports card / old search popover | "leave them in V1 for now" → not touched; E does only V2 search + additive Genie work |

---

## Agents + file ownership

Only the owner touches a path. Anything outside your paths → stop and report.
Stubs at contract paths are created by the orchestrator in Phase 1, then owned by the named agent.

| Agent | Model | Phase | Owns (exclusive) | Spec sections |
|---|---|---|---|---|
| **Orchestrator** | Opus | 0,1,3 | `src/lib/insights-v3/types.ts` · `src/App.tsx` (new `/industry-insights/*` routes only) · `src/components/sidebar/modules.ts` (new `insights-v3` module block only) · `src/components/shell/mobileRoutePolicy.ts` (new rows only) · `src/components/shell/routeTitle.ts` (new entry only) · `src/components/insights-v3/InsightsOverlayHost.tsx` · `src/pages/insights-v3/*` placeholders (handed to A/B/C/D) · `docs/industry-insights/BUILD-LOG.md` | IA, routes |
| **F1 Data** | Opus | 1 | `src/lib/insights-v3/data/**` · `src/lib/insights-v3/selectors/**` · `src/lib/insights-v3/stores/**` (last-visit, follows, competitor marks, saved/boards adapter) · `src/lib/insights-v3/**/*.test.ts` | PRD Data rules, Taxonomy; specs States (New, trends, missing data) |
| **F2 Shared UI** | Sonnet | 1 | `src/components/insights-v3/shared/**` (ScopeBar, OverviewShell, KpiRow, AiSummaryBlock, TopTenGroup, ViewMoreModal, SelectedChips, SortControl, DisabledSection, TrendBars, DetailOverlay shell + back chip, SaveButton, DownloadButton, NewBadge, WinnerBadge, url-state hooks) | Shared page pattern; rules that hold on every page |
| **A Discover + My Feeds** | Sonnet | 2 | `src/pages/insights-v3/DiscoverPage.tsx` · `MyFeedsPage.tsx` · `src/components/insights-v3/discover/**` · `src/components/insights-v3/ad-card/**` | Discover; My Feeds |
| **B Advertiser** | Sonnet | 2 | `src/pages/insights-v3/AdvertiserPage.tsx` · `src/components/insights-v3/advertiser/**` · `src/components/insights-v3/overlays/AdvertiserDetail.tsx` · `overlays/LandingPageDetail.tsx` · `overlays/OfferDetail.tsx` | Advertiser (Domain, Page, LP & Offers); Detail overlays › Advertiser, LP & Offers |
| **C Creative Elements** | Sonnet | 2 | `src/pages/insights-v3/ElementsPage.tsx` · `src/components/insights-v3/elements/**` · `src/components/insights-v3/overlays/ElementDetail.tsx` | Creative Element Insights; Detail overlays › Element |
| **D Drawer + Saving** | Sonnet | 2 | `src/components/insights-v3/ad-drawer/**` · `src/pages/insights-v3/SavedAdsPage.tsx` · `BoardsPage.tsx` · `BoardDetailPage.tsx` · `src/components/insights-v3/boards/**` | Ad drawer; Saved Ads and Boards |
| **E Cross-surface** | Sonnet | 2 | `src/components/insights-v3/search/**` (V2's own search popover) · `genie6/studio-v4/components/IndustryInsightsPicker.tsx` (additive: V2 elements + ads) · `genie6/flows/data/flowSources.ts` (additive V2 resolver). Dashboard tiles / onboarding / Reports card stay on V1 (Q17) | PRD › Prototype surfaces that change |
| **Q QA** | Opus | 3 | `docs/industry-insights/qa/**` (read-only on code) | everything; reports only |

Total agents: 8 (2 + 5 + 1).

### Cross-agent contracts (Phase 2 imports these exact paths)
- Ad drawer: `components/insights-v3/ad-drawer/AdDrawer.tsx` → `export function AdDrawer({ adId, onClose })` (D)
- Overlays: `overlays/AdvertiserDetail.tsx` `({ kind, id })` (B) · `overlays/LandingPageDetail.tsx` `({ id })` (B) · `overlays/OfferDetail.tsx` `({ id })` (B) · `overlays/ElementDetail.tsx` `({ elementType, id })` (C)
- Ad card: `ad-card/AdCard.tsx` `({ ad, onOpen })` (A) — B/C/D reuse it inside overlays and boards
- The host (`InsightsOverlayHost`, orchestrator) reads `detail` + `ad` params and mounts the above; every page renders `<InsightsOverlayHost />` once.

### Order
1. Maalik answers + go → orchestrator commits docs + contracts, adds routes/sidebar/placeholder pages/stubs/redirects/host.
2. F1 ‖ F2 (worktrees). Review → merge → typecheck/lint(touched)/test/build.
3. A ‖ B ‖ C ‖ D ‖ E (worktrees). Review each diff vs spec + ownership → merge one by one, gates after each.
4. Q on merged branch → fixes routed to owners → final report.

---

## Spec checklist (one line per spec section; ticked only after QA)

All lines ticked after Agent Q (QA-REPORT.md: 62 PASS, the FAIL/PARTIAL lines all traced to QA-01…QA-21) **and** the fix round, re-verified by the orchestrator in the browser 2026-10-10. Lines met with an accepted deviation are marked ◐ in the notes below.


**Rules on every page (00 §2)**
- [x] 1 Scope bar Industry › Category › Period, default All, everything follows it; no Industry/Category tabs
- [x] 2 Counts on every filter, menu, tag; 0 = visible + disabled
- [x] 3 Top-10 union within + across groups; other counts never change; each ad once
- [x] 4 Winner = days + clones + status; never likes
- [x] 5 Engagement: no filter/sort; grouped block; "Not reported"
- [x] 6 No analysed toggle / badge / Analyse buttons anywhere
- [x] 7 Missing data → disabled section + tooltip; layout stable
- [x] 8 "Based on X ads" on every overview / summary / analysis block
- [x] 9 AI copy never equates most common with best
- [x] 10 No spy-tool / source names in UI or user-visible dummy data (grep clean)
- [x] 11 Save to board + download on ads, hooks, frameworks, angles, concepts, landing pages
- [x] 12 Kept: URL state, compact header on scroll, Follow brand, pinned boards, Genie handoff
- [x] 13 Every bar/trend chart: unit label + tooltip
- [x] 14 New = since last visit
- [x] 15 Dark/light parity, keyboard, narrow viewport, 60+ char truncation + tooltip

**IA / nav (PRD)**
- [x] New module "Industry Insights V2" in sidebar; sub-nav = My Feeds, Discover, Advertiser, Creative Element Insights, Saved Ads, Boards (with counts per rule 2)
- [x] No Domains / Competitors / Home / Trends / My preference items in V2; "My preference" = Discover toggle
- [x] Old Industry Insights module: zero diff (verified by `git diff --stat` on its paths)

**Discover**
- [x] Scope bar + "My preferences only" toggle (off by default); no tabs
- [x] KPI row: Total, Active, Winning, Advertisers, New, Avg days live, LPs & offers
- [x] AI summary + based-on note
- [x] Launch frequency chart (unit + tooltip)
- [x] Rising + Scaling (expanded only)
- [x] Trending tags = real data
- [x] 11 top-10 groups (Category only when no category scoped) + View more modal
- [x] Selected chips + Clear all + total
- [x] Card: industry+category chips, New, Winner(+engagement mark), days/status/clones, AI score, analysis chips, save+download
- [x] Sort: Newest, Oldest, Longest running, Most cloned, AI score
- [x] Click tag → filter; ad → drawer; element on card → element overlay

**My Feeds**
- [x] Sources: competitor marks + followed pages + followed industries; no prefs toggle
- [x] Discover layout as-is (same KPIs, groups, card, sort)
- [x] Empty: explains sources + links to Advertiser

**Advertiser**
- [x] Tabs Domain · Page · LP & Offers (URL-backed)
- [x] Domain/Page KPIs: Total, Active, New, Scaling, Rising
- [x] Domain/Page groups: Hook, Angle, Framework, Concept, CTA, Country, Category*
- [x] Domain/Page columns: Name, Total+Active, Winning+Longest run, Launch trend, Top framework/hook/concept, Industry+Category, LPs/offers, Actions
- [x] Mark as competitor (domain+page) → My Feeds; Follow (pages) → prefs → My Feeds
- [x] Domain/Page sort: Most ads, Most active/scaling, Most winners, Longest run
- [x] LP KPIs: LPs+offers, Active+New LPs, Rising LPs + avg ads/LP
- [x] LP groups: Funnel type, Offer domain, Hook, Framework, Concept, Country, CTA
- [x] LP columns: Page (thumb, domain, title), Offer ("Not traced"), Funnel, Ads, Advertisers, Winners
- [x] LP sort: Most ads, Most active, Most advertisers, Longest running, Fastest rising

**Creative Element Insights**
- [x] Tabs Framework · Hook · Angle · Concept
- [x] KPIs: items + ads analysed, top item + share, fastest rising, video vs image, + all Discover KPIs/summary/charts
- [x] Groups = Discover's minus the tab's own element
- [x] Columns: Item, Ads+share, Winning+avg days, Trend, Example+top advertisers, Live ads/advertisers/longest run/clones
- [x] Sort: Most used, Most winners, Fastest rising, Longest running
- [x] Save + download on every row

**Detail overlays** (large overlay, URL-backed, follows scope, back chip for nesting, dynamic sections)
- [x] Advertiser: header (Mark/Follow) + AI summary + KPIs; launch activity; hooks/angles/frameworks/concepts/CTA/keywords; winners + longest + LPs
- [x] Element: header + summary + KPIs; where it works; works well with; top ads + Use in Genie + Save
- [x] LP & Offers: page capture; funnel; ads + advertisers; creative mix

**Ad drawer**
- [x] All kept sections (creative, meta row, actions, stats grid, keywords+platforms, demographics, location, domains+language, similar ads)
- [x] Removed: analysed badge, Analyse again, Add to analysis queue
- [x] Added: chips/New/Winner; metrics + engagement group; AI score breakdown w/ reasons + examples; merged creative breakdown (clickable elements); LP+offer+funnel; Use in Genie + save/download per element

**Saved Ads and Boards**
- [x] Save from cards, drawer, every list row, every overlay
- [x] Boards accept every element type; Saved Ads = ads only
- [x] Download next to Save everywhere; pinned boards kept
- [x] Opening a saved item opens the same drawer/overlay

**States**
- [x] Disabled-with-tooltip sections; "Not reported"; 0-count disabled options; Country gap disclosed
- [x] New since last visit on ads + New ads / New advertisers KPIs
- [x] Trend % no minimum base; unit + tooltip
- [x] No-results → one-click clear; My Feeds empty → explain + link; loading = existing skeletons

**Prototype surfaces that change (E)**
- [x] V2 search popover scopes follow the new menu
- [x] Genie picker: frameworks, hooks, angles, concepts + ads (additive)
- [x] V2 "Use in Genie" resolves V2 ids in Genie flows
- [x] Dashboard tiles / onboarding / Reports card — stay on V1 by decision (Q17), out of scope

---

**Met with an accepted deviation (◐), for Maalik's call**
- ◐ Rule 1 "scope bar on every page": not on Boards / Board detail (boards hold saved items, not market data). Saved Ads has it.
- ◐ Rule 11 / Genie: "Use this script in Genie" in the drawer sends the ad (Winner-aware action) — Genie has no carrier for Industry Insights script text (`use-script` isn't offered for the module; `use-storyboard` carries no text). Hooks/angles/frameworks/concepts DO travel.
- ◐ Saved Ads vs boards are two separate "saved" concepts (spec: Saved Ads = ads only, elements live in boards); the Saved Ads page explains the bookmark = add to board.
- ◐ "Most used / share %" on element rows is relative to ads with that element identified (honest under partial analysis; tooltip says so).

## Decisions taken during the build
- 2026-10-10 · Module key `insights-v3`, label "Industry Insights V2", rail chip "V2" (both modules truncate to "Industry…" in the rail; chip disambiguates). Route index `/industry-insights` → Discover (spec: "user lands here").
- 2026-10-10 · V2 routes are owns-layout (like the old feed): pages own their scroll container; compact header attaches to it.
- 2026-10-10 · Mobile: feeds/discover/saved/boards full; advertisers/elements blocked → fallback Discover.
- 2026-10-10 · URL: filters/scope/sort/tab replace history; drawer/overlay/modal push (Back closes them). Scope restores from session when a page is opened without scope params, so it carries across sub-nav.

## Agent reports
- **F1 data layer** — `c440e24` + fix `c5670be`, merged. Only `src/lib/insights-v3/{data,selectors,stores}`. 800 ads (Lead Gen 241, VSL 199, E-com 144, Telehealth 98, Others 79, Search Arb 39); active 51.6%, winners 18.5%, engagement 18.1%, no country 13.5%, start unknown 7.2%; 25 new in 48h; 130 pages, 100 domains, 265 LPs, 52 offers. AI score per reference A §3. 175 tests. Orchestrator review: sampled ads read as real DR copy; doubts decided — CTA groups by button label; "Advertiser / domain" = domain advertisers; LP-tab tag counts are ad counts; Discover Rising = rising elements, Scaling = scaling pages; +700% kept (Q7). Fix asked + landed: unknown start falls back to firstSeenAt for period membership.
- **F2 follow-up** — `3ac3177`: DownloadButton accepts one file, an array (Q16 media + text) or null.
- **A Discover + My Feeds + AdCard** — `ece7174`, merged. Ownership clean; vitest 218/218. Orchestrator browser review: KPIs/summary/launch chart (unit + based-on)/trending tags/11 groups render, no console errors; union verified live (Callout 106 + PAS 88 → 185, other counts unchanged, `?f_hookStyle=callout&f_framework=pas`); compact header on scroll works; card carries every spec field. Deviations accepted: identity row rendered above scope bar; CSS-columns masonry; "Load more" button alongside infinite scroll; industry/category chips on cards are labels (spec lists only elements as clickable). Follow-ups queued: (1) ScopeBar needs a separate "All industries" total (kit), (2) orchestrator wires InsightsSearch into AdsMarketView headerActions.
- **C Creative Element Insights + Element overlay** — `8512c81` + fix `74ce202`, merged. Ownership clean. Integration catch: once A's real AdCard landed, C's example wrapper duplicated Save and its smoke test went ambiguous → sent back, fixed (card owns Save/Download; visible Use in Genie per example kept). Browser review: tabs Framework 13 · Hook 12 · Angle 54 · Concept 37; rows carry every spec column; overlay opens via `detail=hook:callout` with Use in Genie / Save / Download + sections. Decisions: share % is relative to ads with that element identified (tooltip says so — honest under partial analysis); element "New" = its first ad appeared after last visit; extra column named "Market footprint" (no source name); framework beats shown as frequency with an explicit not-order note.
- **F2 fix** — `9155479`: ScopeBar "All industries"/"All categories" rows use the true All counts (prefers the data layer's "all" row).
- **D Ad drawer + Saved Ads + Boards** — `062c585`, merged. Ownership clean. Browser: drawer opens via `?ad=`, kept + added sections present, no analysed/Analyse text, 5× "Not reported". Accepted deviations: no scope bar on Boards/Board detail (boards aren't market data — flag to Maalik), drawer steps aside while a drill-down overlay is on top, z-50 + portal order, Board-detail type chips use `tab`. Saved Ads independent from board membership (save modal exposes both).
- **B Advertiser + advertiser/LP/offer overlays** — `25bcbdc` + fix `8d6560d`, merged. Same AdCard integration catch as C (header Follow assertions went ambiguous) → scoped to overlay header; strip cells widened to 280px for the real card. Accepted: full advertiser numbers under tag filter, "Show more" paging, extra LP Actions column + "Opening lines" + "Connected pages/domains" sections.
- **E Genie handoff + V2 search + picker** — `a41627e`, merged after line-by-line review of the Genie diffs: `iiv2:` namespaced refs, competitorOwned + §7.2 highlight intact, metrics never likes, new optional `FlowSourceRef.elements` only set by V2 refs, old refs unchanged (tested). Picker keeps the old pane as default and adds a V2 tab. Browser: Element overlay → Use in Genie → `/iq/genie6/studio-alpha/format?src=industry-insights&ref=iiv2:ad-0495&act=use-hook`, banner shows, no console errors. Known cost: Genie flow code now imports the V2 data module (~80ms universe build on first Genie load).
- **F2 fixes** — `d919e2c`: 0-count tabs disabled (non-negotiable #2), lime count pill on ElementChip.
- **Orchestrator** — mounted `InsightsSearch` on Elements, Saved Ads, Boards, Board detail (B mounted its own; A doing Discover/My Feeds with `q`).
- **Follow-ups merged** — A `5bd9419` (Discover/My Feeds read `q`; search chip; header search), E `ec37837` (V2 refs exit Genie to `/industry-insights/discover` via optional `FlowSourceRef.exitPath`; picker test de-flaked).
- **Test infra** — vitest `testTimeout` 15s: render smoke tests timed out at 5s only when machine load average hit ~113 (parallel sessions + leftover agent dev servers, which were stopped).
- **QA round (Agent Q, Opus)** — `qa/QA-REPORT.md` + 57 screenshots. Fixes routed by owner and merged: F1 `faa84b9` (QA-03 data, 04, 06, 10, 13, 18, 20) · F2 `3203c27` (QA-01, 03 UI, 04, 05, 10 UI, 14, 15, 16, 17) · A `217b2d7` (QA-11) · B `1caa20b` (QA-07) · C `0fb1d07` (QA-08, 15) · D `ce528e9` (QA-05 drawer, 09, 19, 21) · E `3557fd6` (QA-02, 12, 17 search) · orchestrator: nav count on forced empty (QA-11), compact chip wiring (QA-15), 3 tests moved to real zero-match tags after QA-10. After-fix shots: `qa/screens-after-fixes/`.
- **UI/UX crit round (orchestrator, ui-ux-pro-max lens, 2026-10-10)** — `f8d0758`. 12 surfaces screenshotted and judged. Fixed: first-glyph clip on every clamped line (kit `TruncatedText`, verified at 2×); name-valued KPIs ("Personal story") wrap at prose size instead of "Persona…"; trending tags moved under the AI summary so the overview's two columns balance; no-creative ads render a copy-first tile and the 25 New ads always carry a creative; Saved Ads card bookmark reflects saved-anywhere (explanatory sentence removed); board detail masonry (row grid left ~600px gaps); save-modal type icon; compact missing-screenshot tile; rising/scaling lists drop the catch-all "Other"; "Video share 47%". After-shots: `qa/screens-ux-round/`. Gates: typecheck ✅ eslint 0 ✅ vitest 385/385 ✅.
- **UX crit round 2 (states · interaction · a11y · AI-native lenses)** — surfaces: full + sparse drawer, empty/loading/no-results, Genie landing, element + advertiser tables, boards. Fixed: loading skeleton now mirrors the overview (was grid-only → layout jump on load); drawer has ONE primary (Save is secondary at rest, lime tint when saved) and its title is the headline with the Ad ID demoted to a mono sub-line; Follow page now toasts like Mark as competitor (consistent feedback); tag / element / trending chips are 32px tall below `sm` (tap targets). Verified: no horizontal overflow at 375 on the 4 mobile pages; dark-mode contrast of new tiles ≥ 9:1 after compositing; Esc / Back / outside-click rules hold. Gates: typecheck ✅ eslint 0 ✅ vitest 385/385 ✅.
- **Orchestrator wiring** — InsightsOverlayHost (detail stack → overlay, save modal, ad drawer on top), OverlayNav contract, sub-nav counts (lazy, follow scope: 800 → 156 for Lead Gen · 30d verified in browser), V2 pinned-boards slot in sub-nav, stubs for UseInGenie + InsightsSearch, API map `docs/industry-insights/API.md`.
- **F2 shared UI kit** — `af3879d`, merged. 31 files, only `src/components/insights-v3/shared/**`. Gates green (typecheck, eslint 0, vitest 97/97). Orchestrator review: ownership clean; DetailOverlay = Radix, no outside-click close, back chip, focus trap; accent at rest confirmed in browser (`/industry-insights/_kit`); Geist Mono numerals = design system v1.2 rule. Deviations accepted: `periodCounts` on ScopeBar, `usePageTab` clears tags/sort on tab switch, badges not tab stops (aria text instead). Notes carried to Phase 2: don't chain two different URL hooks' writes in one handler; ad drawer must portal above overlays; host mounts ViewMoreModal once; save modal = D.
- **My Feeds redesign (2026-10-12, branch `my-feeds-redesign`)** — UI/design only, My Feeds only, old Industry Insights look on the V2 data. Spec = the approved static mock (Overview layout A, first 4 filter rows + "Show N more", "Build as shown"). Built as additive `AdsMarketView layout="feed"` + `src/components/insights-v3/feeds/*`; Discover, Saved, Boards, the drawer and every overlay keep `layout="market"` and the standard `AdCard` (unchanged).
  - Header/toolbar: title + count pill, Period pill top-right (joins the toolbar when the title row collapses), toolbar = search pill · filter toggle (badge = applied tags) · Industry · Category · gear (sources popover). Platform segmented control and workspace picker dropped (no V2 equivalent). Old identity row removed: its popover content (`SourcesList`) now sits behind the gear and the Overview's sources pill.
  - Quick filters (above Overview, collapsed by default): Trending + every tag group as one horizontal row, descending counts, first 15 chips + "View more (N)" into the existing `ViewMoreModal`; expanded shows 4 rows + "Show 8 more filters". Same union rule, same URL params; "N applied" counts only ids the groups know.
  - Overview (collapsed by default): one bar = merged sources pill + all 7 KPIs as pills. Expanded: pills, one full-width AI row (summary + suggested action from the top rising element + primary Use in Genie + "Show N ads"), then "New Ad launch" (renamed from Launch frequency, unit + tooltips kept) | Rising top 3 | Scaling top 3, "Based on N ads".
  - Card (`FeedCard`, My Feeds only): avatar · page + follow · days/status tag · save → 2 lines of copy → media (New/Winner, AI score, N Similar ads, kind) → domain + View collection → headline → Industry · Category → Download · Genie · Copy link · More. Hook/angle/framework/concept chips and the CTA label are drawer-only (still filterable from Quick filters). No-creative ads keep the copy-first tile with the signals in a row under it.
  - Panel state persists per user (`fabads:insights-v3:feeds:filters-open` / `:overview-open`), default collapsed; separate from the old `overview:my-feeds` key so nobody inherits the old expanded default.
  - Deliberate deviations from the mock: Trending row has no "View more" (no modal group exists for it, 12 tags max); Industry tag lime-tinted at rest on the card (accent-at-rest rule); Rising/Scaling carry a one-line unit caption (kit honesty rule) the mock omitted; KPI "Avg days live" reads "Avg live" in its pill (the value already says "days").
  - Left as is on purpose: `MyFeedsIdentity` (the old row) is no longer mounted by My Feeds but still exported (its `SourcesList` is reused); removing it is a separate cleanup.
  - Final-gate monitor (Opus): SIGN-OFF WITH FIXES, all fixed. A thumbnail that fails to load no longer leaves overlays on top of the fallback headline tile (`AdCardMedia onBroken`, regression test added); at 1024px Rising | Scaling sit side by side under the chart (three across only from `xl`); "FRAMEWORK" kind label no longer overflows; Trending chips announce "new ads" + change; collapsed Quick filters summary no longer halves; `appliedCount` memoised; KPI pills are focusable and carry their trend line for keyboard/touch; the AI row's applied-state button reads "Filter applied · Clear" (the page total is a union, so it can exceed the tag's own count); chart delta shows "vs previous period" visibly; a one-line note explains the trend blocks use the period-free base when a period is picked; Period pill hidden on the empty state; `aria-controls` dropped while loading. Gates: typecheck ✅ eslint 0 problems ✅ vitest 401/401 ✅ build ✅.
  - Known, left: ~60 chip tab stops with Quick filters open (a roving tabindex per row would help), "Start unknown" squeezes the page name, heading levels jump h1 → h3/h4.
- **My Feeds round 2 (2026-10-12, Maalik's feedback; same branch)**
  - **One toolbar row:** search · filter toggle (Quick filters) · Domain · Page · Status · Running days · Similar ads · Sort. New selectors in `selectors/feedFilters.ts` + `feeds/FeedFilters.tsx`; URL params `fdomain`/`fpage`/`fstatus`/`fdays`/`fsimilar` (not `f_*`, that prefix is the tag groups). Within one filter several picks = any of them, across filters = all of them. **They narrow the whole page like the search does** (Maalik's call): KPIs, AI summary, charts, Rising/Scaling, quick-filter and scope counts all recompute. Option counts are taken BEFORE these filters (after scope + search) so a pick never hides its siblings. Running days = Under 7 · 7–29 · 30–89 · 90+ · Start date unknown. Similar ads = None · 1–2 · 3–5 · 6–9 · 10+. Domain also offers "No landing domain". Filters that leave nothing show "No ads match these filters" with Clear filters; "Clear search" in the no-match state now clears them too.
  - **Header:** Industry · Category · Period (calendar) + the sources gear moved to the title row, top-right (Maalik's call: they hide with the title row on scroll, no copy in the toolbar). Header actions now wrap on mobile (shared `InsightsPageLayout`, additive `flex-wrap`).
  - **Rename Advertiser → Competitors** everywhere visible in V2 (Maalik's call): nav, page title, search scope, KPI, tag group "Competitor / domain", overlays, drawer tooltips, AI-summary prose, downloaded files, mobile policy label. Route `/industry-insights/advertisers`, identifiers, URL values and tab labels unchanged. **Open naming collisions** (flagged, not changed): the "Competitors" KPI counts every page with ads in scope, while "From N competitors" counts only the ones the user marked; the page named Competitors lists everything but its rows say "Mark as competitor".
  - **AI score:** filled, tier-coloured tags on the My Feeds card (Elite lime · Strong green · Average amber · Weak red) via `AiScoreBadge solid`; `text-background` keeps contrast in dark mode.
  - **Engagement (spec change, Maalik's call):** the old rule "engagement is never filtered or sorted on" is lifted for My Feeds only. Cards show an "Engagement" tag with icons for the metrics that exist (never the numbers). New sorts Most liked / commented / shared (`FeedAdSort`, `ENGAGEMENT_SORT_FIELD`): ads that do not report the metric are listed LAST, never hidden, and an inline warning explains it in plain words with a "Back to Newest" link. Discover keeps its five sorts and ignores `?sort=most-liked`. The ad drawer shows all three counts plus Total engagements, Per day live, Comments per 100 likes and Shares per 100 likes (only what can be derived; a missing number stays "Not reported", a reported 0 stays 0).
  - **Demo data coverage** (`data/demoCoverage.ts`, deterministic overrides on pinned ads inside the seeded feed; 800 ads, 148 winners, every tag count and the all-time KPI row unchanged): page names of 82 and 70 chars; engagement shapes likes-only / comments-only / shares-only / likes+shares / likes+comments / all three / all-zero / huge (1.24M likes) / tiny (3·0·1), 58 → 77 ads reporting; a 412-day ad, a 0-day ad; two dead thumbnail URLs; one ad with every optional field missing; a New + Winner ad. Small intended shifts: one launch ~12 days earlier (a Winner needs 14+ days), longest-run values now 412. **Skipped:** a search-arb source in the feed (it needs `seedCompetitors` to swap lead-gen for search-arb, which drops lead-gen ads that the coverage overrides rely on).
- **Ad drawer round (2026-10-13, Maalik's feedback; 4 parallel workers + orchestrator)**
  - **Engagement section** is collapsible (starts open when the ad reports data). No data: toggle disabled + small warning "No engagement data for this ad.", never "Not reported". Partial data shows only the metrics that exist.
  - **AI score** no longer uses likes / comments / shares (data-layer change in `score.ts` so the total never includes hidden points; the `likes` and `social` parts are no longer emitted). Max reachable score is now 90 (unchanged `RECOVERED_SHARE` 0.6); tiers over the 800 demo ads: elite 95 · strong 357 · average 293 · weak 55. New **Suggested actions** block under the breakdown: weakest parts (under half their points, worst first, max 3) each name replacement elements from the ad's industry (most winners, then rising) with a `Try “X” in Genie` CTA (+ `Create a variation`), or one positive row when nothing is weak. Unknown start date is not treated as weak longevity.
  - **Creative breakdown:** the thin timeline is replaced by a non-interactive Video Sage style segmented row of framework elements in order (width by duration when timed). The script list stays.
  - **Transcript** moved out of Creative breakdown into "Landing page, offer and funnel": a fixed-height (160px) scroll box, keyboard reachable, with a fade while more text is below.

