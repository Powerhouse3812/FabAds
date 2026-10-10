# Industry Insights v3 — BUILD LOG

Branch `industry-insights-v3` (cut from `origin/main` @ b2437a0; local `main` was 145 commits stale).
Orchestrator session worktree: `.claude/worktrees/priceless-payne-e2f7a1`. Nothing pushed, nothing merged to `main`.

## Status

| Phase | State |
|---|---|
| 0 — Read, inventory, contracts, questions | ✅ done — answers in, **GO given 2026-10-10** |
| 1 — F1 data, F2 shared UI, orchestrator routes/sidebar | ✅ done — F1 + F2 merged with follow-up fixes; host, sub-nav counts, pinned-boards slot, contract stubs wired; gates green (typecheck, eslint on touched files 0, vitest 194/194) |
| 2 — A Discover+Feeds, B Advertiser, C Elements, D Drawer+Boards, E Cross-surface | **in progress** — 5 agents in worktrees |
| 3 — Merge, Q (QA), final report | not started |

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

**Rules on every page (00 §2)**
- [ ] 1 Scope bar Industry › Category › Period, default All, everything follows it; no Industry/Category tabs
- [ ] 2 Counts on every filter, menu, tag; 0 = visible + disabled
- [ ] 3 Top-10 union within + across groups; other counts never change; each ad once
- [ ] 4 Winner = days + clones + status; never likes
- [ ] 5 Engagement: no filter/sort; grouped block; "Not reported"
- [ ] 6 No analysed toggle / badge / Analyse buttons anywhere
- [ ] 7 Missing data → disabled section + tooltip; layout stable
- [ ] 8 "Based on X ads" on every overview / summary / analysis block
- [ ] 9 AI copy never equates most common with best
- [ ] 10 No spy-tool / source names in UI or user-visible dummy data (grep clean)
- [ ] 11 Save to board + download on ads, hooks, frameworks, angles, concepts, landing pages
- [ ] 12 Kept: URL state, compact header on scroll, Follow brand, pinned boards, Genie handoff
- [ ] 13 Every bar/trend chart: unit label + tooltip
- [ ] 14 New = since last visit
- [ ] 15 Dark/light parity, keyboard, narrow viewport, 60+ char truncation + tooltip

**IA / nav (PRD)**
- [ ] New module "Industry Insights V2" in sidebar; sub-nav = My Feeds, Discover, Advertiser, Creative Element Insights, Saved Ads, Boards (with counts per rule 2)
- [ ] No Domains / Competitors / Home / Trends / My preference items in V2; "My preference" = Discover toggle
- [ ] Old Industry Insights module: zero diff (verified by `git diff --stat` on its paths)

**Discover**
- [ ] Scope bar + "My preferences only" toggle (off by default); no tabs
- [ ] KPI row: Total, Active, Winning, Advertisers, New, Avg days live, LPs & offers
- [ ] AI summary + based-on note
- [ ] Launch frequency chart (unit + tooltip)
- [ ] Rising + Scaling (expanded only)
- [ ] Trending tags = real data
- [ ] 11 top-10 groups (Category only when no category scoped) + View more modal
- [ ] Selected chips + Clear all + total
- [ ] Card: industry+category chips, New, Winner(+engagement mark), days/status/clones, AI score, analysis chips, save+download
- [ ] Sort: Newest, Oldest, Longest running, Most cloned, AI score
- [ ] Click tag → filter; ad → drawer; element on card → element overlay

**My Feeds**
- [ ] Sources: competitor marks + followed pages + followed industries; no prefs toggle
- [ ] Discover layout as-is (same KPIs, groups, card, sort)
- [ ] Empty: explains sources + links to Advertiser

**Advertiser**
- [ ] Tabs Domain · Page · LP & Offers (URL-backed)
- [ ] Domain/Page KPIs: Total, Active, New, Scaling, Rising
- [ ] Domain/Page groups: Hook, Angle, Framework, Concept, CTA, Country, Category*
- [ ] Domain/Page columns: Name, Total+Active, Winning+Longest run, Launch trend, Top framework/hook/concept, Industry+Category, LPs/offers, Actions
- [ ] Mark as competitor (domain+page) → My Feeds; Follow (pages) → prefs → My Feeds
- [ ] Domain/Page sort: Most ads, Most active/scaling, Most winners, Longest run
- [ ] LP KPIs: LPs+offers, Active+New LPs, Rising LPs + avg ads/LP
- [ ] LP groups: Funnel type, Offer domain, Hook, Framework, Concept, Country, CTA
- [ ] LP columns: Page (thumb, domain, title), Offer ("Not traced"), Funnel, Ads, Advertisers, Winners
- [ ] LP sort: Most ads, Most active, Most advertisers, Longest running, Fastest rising

**Creative Element Insights**
- [ ] Tabs Framework · Hook · Angle · Concept
- [ ] KPIs: items + ads analysed, top item + share, fastest rising, video vs image, + all Discover KPIs/summary/charts
- [ ] Groups = Discover's minus the tab's own element
- [ ] Columns: Item, Ads+share, Winning+avg days, Trend, Example+top advertisers, Live ads/advertisers/longest run/clones
- [ ] Sort: Most used, Most winners, Fastest rising, Longest running
- [ ] Save + download on every row

**Detail overlays** (large overlay, URL-backed, follows scope, back chip for nesting, dynamic sections)
- [ ] Advertiser: header (Mark/Follow) + AI summary + KPIs; launch activity; hooks/angles/frameworks/concepts/CTA/keywords; winners + longest + LPs
- [ ] Element: header + summary + KPIs; where it works; works well with; top ads + Use in Genie + Save
- [ ] LP & Offers: page capture; funnel; ads + advertisers; creative mix

**Ad drawer**
- [ ] All kept sections (creative, meta row, actions, stats grid, keywords+platforms, demographics, location, domains+language, similar ads)
- [ ] Removed: analysed badge, Analyse again, Add to analysis queue
- [ ] Added: chips/New/Winner; metrics + engagement group; AI score breakdown w/ reasons + examples; merged creative breakdown (clickable elements); LP+offer+funnel; Use in Genie + save/download per element

**Saved Ads and Boards**
- [ ] Save from cards, drawer, every list row, every overlay
- [ ] Boards accept every element type; Saved Ads = ads only
- [ ] Download next to Save everywhere; pinned boards kept
- [ ] Opening a saved item opens the same drawer/overlay

**States**
- [ ] Disabled-with-tooltip sections; "Not reported"; 0-count disabled options; Country gap disclosed
- [ ] New since last visit on ads + New ads / New advertisers KPIs
- [ ] Trend % no minimum base; unit + tooltip
- [ ] No-results → one-click clear; My Feeds empty → explain + link; loading = existing skeletons

**Prototype surfaces that change (E)**
- [ ] V2 search popover scopes follow the new menu
- [ ] Genie picker: frameworks, hooks, angles, concepts + ads (additive)
- [ ] V2 "Use in Genie" resolves V2 ids in Genie flows
- [x] Dashboard tiles / onboarding / Reports card — stay on V1 by decision (Q17), out of scope

---

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
- **Orchestrator wiring** — InsightsOverlayHost (detail stack → overlay, save modal, ad drawer on top), OverlayNav contract, sub-nav counts (lazy, follow scope: 800 → 156 for Lead Gen · 30d verified in browser), V2 pinned-boards slot in sub-nav, stubs for UseInGenie + InsightsSearch, API map `docs/industry-insights/API.md`.
- **F2 shared UI kit** — `af3879d`, merged. 31 files, only `src/components/insights-v3/shared/**`. Gates green (typecheck, eslint 0, vitest 97/97). Orchestrator review: ownership clean; DetailOverlay = Radix, no outside-click close, back chip, focus trap; accent at rest confirmed in browser (`/industry-insights/_kit`); Geist Mono numerals = design system v1.2 rule. Deviations accepted: `periodCounts` on ScopeBar, `usePageTab` clears tags/sort on tab switch, badges not tab stops (aria text instead). Notes carried to Phase 2: don't chain two different URL hooks' writes in one handler; ad drawer must portal above overlays; host mounts ViewMoreModal once; save modal = D.
