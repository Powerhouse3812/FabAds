# Industry Insights V2 — API map for Phase-2 agents

Read this, then open the barrels for exact signatures:
`src/lib/insights-v3/data/index.ts` · `src/lib/insights-v3/selectors/index.ts` · `src/lib/insights-v3/stores/index.ts` · `src/components/insights-v3/shared/index.ts`.
Working usage of every shared component (populated, partial, empty, long names): `src/components/insights-v3/shared/__preview__/KitPreview.tsx`, live at `/industry-insights/_kit`.

## Data — `@/lib/insights-v3/data`
- Singletons `UNIVERSE`, `INDEX`, `MODULE_NOW` (use `MODULE_NOW` as `now` everywhere).
- Lookups: `getAds()`, `getAd(id)`, `getAdvertisers(kind?)`, `getAdvertiser(id)`, `getAdsForAdvertiser(id)`, `getLandingPages()`, `getLandingPage(id)`, `getOffers()`, `getOffer(domain)`, `getElements(type)`, `getElement(type,id)`, `getFrameworkElements()`, `getFrameworkElement(key)`, `getIndustries()`, `getIndustry(id)`, `getCategories()`, `getCategory(id)`, `countryName(iso2)`.
- Vocab: `ELEMENT_TYPE_LABEL`, `ELEMENT_TYPE_PLURAL`, `FRAMEWORK_ELEMENT_LABEL`, `CONCEPT_MEDIA`, `FUNNEL_TYPES`, `TIER_LABEL` …

## Selectors — `@/lib/insights-v3/selectors`
- Context: `SelectorCtx { now; lastVisitAt?; prefs?; data? }`, `UserPrefs`, `formatDays(n|null)` ("Start date unknown"), `formatChange`, `formatCompact`.
- Scope: `adsInScope(ads, scope, { now, prefs? })`, `adsInBaseScope(ads, scope, opts)` (no period — feed this to trend functions), `industryOptions(ads, scope, opts)`, `categoryOptions(ads, scope, opts)` (TagOption[] with an "all" row first; categories full A–Z with 0s), `hasAnyPrefs(prefs)`, `scopeLabel(scope)`.
- Winner/New: `isWinner(ad)`, `isActive(ad)`, `isEngagementStandout(ad, scopedAds)`, `isNew({firstSeenAt}, lastVisitAt)`.
- Tags: `DISCOVER_GROUP_KEYS`, `ADVERTISER_GROUP_KEYS`, `LANDING_PAGE_GROUP_KEYS`, `elementGroupKeys(type)`, `groupKeysForScope(keys, scope)` (drops Category when scoped), `tagGroups(scopedAds, keys)`, `filterByTagUnion(ads, selected)`, `unionTotal`, `filterListByTagUnion(items, adsOf, selected)`, `hasSelection`, `tagLabel(key,id)`.
- Trends: `launchFrequency(ads, scope, now, opts?)` → TrendSeries, `rising(kind, baseAds, period, now, {limit})`, `scaling(...)`, `trendingTags(baseAds, period, now, opts?)`. Kinds: page | domain | landing-page | offer | framework | hook | angle | concept | keyword.
- KPIs (all `(baseAds, scope, ctx)`): `discoverKpis`, `advertiserKpis(kind, …)`, `landingPageKpis`, `elementKpis(type, …)`.
- Rows (`RowCtx = SelectorCtx & { scope; baseAds?; shareBase? }`): `advertiserRows(kind, ads, ctx)`, `landingPageRows(ads, ctx)`, `elementRows(type, ads, ctx)`.
- Sorts: `sortAds(ads, AdSort)`, `sortAdvertiserRows`, `sortLandingPageRows`, `sortElementRows`.
- Summaries: `aiSummary(subject)` — kinds: scope, my-feeds, advertiser, element, landing-page, offer, advertiser-list, landing-page-list, element-list. Never phrase "best".
- Details (null when id unknown; every block has `basedOn`): `advertiserDetail(kind, id, baseAds, scope, ctx)`, `elementDetail(type, id, …)` (whereItWorks, worksWellWith with lift), `landingPageDetail(id, …)`, `offerDetail(offerDomain, …)`.
- Downloads: `buildDownloads(ref)` → DownloadFile[] (Q16 media + text), `buildDownload(ref)` → single text file | null.
- Boards: `snapshotFor(ref)`, `detailTargetFor(ref)`.

## Stores — `@/lib/insights-v3/stores` (localStorage, safe; seeded demo state)
- Last visit: `useLastVisitAt()`, `getLastVisitAt()`.
- Follows (Brand = Page): `toggleFollowPage(id)`, `toggleFollowIndustry(id)`, `useIsPageFollowed(id)`, `useFollows()`, `useFollowedPageIds()`, `useFollowedIndustryIds()`.
- Competitors: `toggleCompetitor(kind, id)`, `useIsCompetitor(kind, id)`, `useCompetitors()`.
- Boards: `useBoards()`, `usePinnedBoards()`, `useBoard(id)`, `createBoard`, `renameBoard`, `deleteBoard`, `addToBoard(boardId, ref, snapshot?, note?)`, `removeFromBoard`, `toggleInBoard`, `updateBoardItemNote`, `togglePin(id)` (cap 5), `boardsContaining(ref)`, `useBoardCountForItem(ref)`, `useIsSavedAnywhere(ref)`.
- Saved ads: `useSavedAdIds()`, `useIsAdSaved(id)`, `toggleSavedAd(id)`.
- Prefs / My Feeds: `useUserPrefs()`, `useMyFeedsAds()`, `myFeedsAds(prefs?, ads?)`.

## Shared UI — `@/components/insights-v3/shared`
- URL hooks: `useInsightsScope()`, `useSelectedTags()`, `useListSort(allowed, fallback)`, `usePageTab(allowed, fallback)` (clears tags+sort on switch), `useDetailStack()`, `useAdDrawer()`, `useSaveModal()`, `useViewMore()`. **Don't chain two different hooks' setters in one handler.**
- Layout: `InsightsPageLayout` (owns the one scroller; `onReachEnd` for infinite scroll; `headerActions` slot), `ScopeBar`, `PageTabs`, `OverviewShell`, `KpiRow`, `AiSummaryBlock`, `BasedOnNote`, `TopTenGroups`/`TopTenGroup`, `ViewMoreModal` (each page mounts it once), `SelectedChips`, `SortControl`, `DisabledSection`, `TrendBars`/`TrendSpark`/`ChangeChip`, `DetailOverlay` + `OverlaySection`.
- Actions: `SaveButton({target, savedCount, variant})`, `DownloadButton({build})` (build may return one file, an array, or null), `ElementActions({target, savedCount, buildDownload, genieSlot})`.
- Atoms: `NewBadge`, `WinnerBadge({engagementStandout})`, `AiScoreBadge`, `StatusPill`, `DaysLive`, `ClonesPill`, `TypeChip`, `ElementChip({type,id,label})` (default click opens the right overlay/drawer), `EngagementGroup`, `TruncatedText`, `EmptyResults`, `EmptyState`, `ListSkeleton`, `GridSkeleton`, `Hint`, `InfoGlyph`, `fmtInt`, `fmtPct`.

## Orchestrator-owned glue
- `src/components/insights-v3/InsightsOverlayHost.tsx` — **every page renders `<InsightsOverlayHost />` once.** It maps `detail` → overlay (top of stack, back chip), `modal=save` → SaveToBoardModal, `ad` → AdDrawer (mounted last, stacks on top).
- `src/components/insights-v3/overlays/overlayNav.ts` — `OverlayNav { open, backLabel?, onBack?, onClose }`: overlays pass it straight into `<DetailOverlay>`.
- `src/components/insights-v3/nav/NavCount.tsx` — sub-nav counts.

## Contract stubs (owner replaces the body, keeps the export + props)
| Path | Export | Owner |
|---|---|---|
| `ad-card/AdCard.tsx` | `AdCard({ ad, onOpen? })` (may add optional props) | A |
| `overlays/AdvertiserDetail.tsx` | `AdvertiserDetail({ kind, id, nav })` | B |
| `overlays/LandingPageDetail.tsx` | `LandingPageDetail({ id, nav })` | B |
| `overlays/OfferDetail.tsx` | `OfferDetail({ id, nav })` (id = offer domain) | B |
| `overlays/ElementDetail.tsx` | `ElementDetail({ elementType, id, nav })` | C |
| `ad-drawer/AdDrawer.tsx` | `AdDrawer({ adId, onClose })` | D |
| `boards/SaveToBoardModal.tsx` | `SaveToBoardModal()` (reads `useSaveModal`) | D |
| `boards/PinnedBoardsNav.tsx` | default `PinnedBoardsNav()` | D |
| `genie/UseInGenie.tsx` | `UseInGenie({ target, action?, label?, variant? })` | E |
| `search/InsightsSearch.tsx` | `InsightsSearch()` | E |
