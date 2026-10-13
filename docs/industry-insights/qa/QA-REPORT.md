# Industry Insights V2 — QA report (Agent Q)

Date: 2026-10-10 · Branch `industry-insights-v3` @ `d7665da` · Dev server http://localhost:3000 (this worktree)
Screenshots: `docs/industry-insights/qa/screens/` (57 files; `*.png` = headless Chrome, `*.jpg` = in-app browser for mobile 375px + dark mode)

## Verdict

**Ship-ready for demo once the 4 major issues are fixed. No blockers.**

The build covers the spec well. All 6 pages, every tab, all 8 overlay types, the drawer, the save and view-more modals, and the states render. Union filtering is mathematically correct, forbidden-text checks are clean, and the old module is byte-identical. Gates are green: `npm run typecheck` exit 0, `npx vitest run` 343/343, eslint on all V2 and touched files 0 problems.

Main gaps:
- Esc closes the whole overlay stack instead of only the top layer.
- Non-winner ads reach Genie labelled "Winner ad as reference".
- The Country gap is never disclosed.
- KPI tiles truncate their values with no tooltip, so some values are unreadable.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 4 |
| Minor | 10 |
| Cosmetic | 7 |

Method:
- Headless Chrome screenshots at 1440 wide. At 390 wide, headless Chrome clamps the layout to about 500px, so its mobile shots were false and were discarded. Mobile was checked in the in-app browser at 375×812 with DOM overflow measurement instead.
- In-app browser for clicks, keyboard, Esc, Back, outside click, deep links and refresh, and dark mode via `localStorage.theme`.
- Independent recomputation from the raw data module (`/src/lib/insights-v3/data/index.ts` imported in the page, not through the selectors).
- Static greps and a code read.

Caveat: the in-app pane was hidden, which throttles `requestAnimationFrame`. So the compact-on-scroll header could not be seen engaging. It is verified by code (`InsightsPageLayout.tsx:54-111`) and by the orchestrator's earlier browser check, not by me.

---

## Spec checklist (BUILD-LOG)

### Rules on every page (00 §2)
| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | Scope bar Industry › Category › Period, default All; no Industry/Category tabs | PASS | Every page header (`discover-desktop.png`, `advertisers-*.png`, `elements-*.png`, `saved-desktop.png`). Boards/Board detail have no scope bar (accepted deviation D). |
| 2 | Counts on every filter, menu, tag; 0 = visible + disabled | PASS | Sub-nav, tabs, scope options, tags and view-more rows all show counts. Category menu in VSL lists "Advocacy & Non-Profit 0 · No ads in this scope" with `aria-disabled=true`. |
| 3 | Top-10 union within + across groups; other counts unchanged; each ad once | PASS | Callout + Curiosity question + PAS gives a UI total of 268. Independent recompute: 268 distinct ads (106+95+88 = 289 before dedupe). All 140 tag buttons kept their counts (`discover-tags-union.png`). |
| 4 | Winner = days + clones + status; never likes | PASS (rule) / FAIL (Genie label) | `selectors/winner.ts:13-20` = active ∧ ≥14 days ∧ ≥2 clones. But non-winners reach Genie as "Winner ad as reference" (QA-02). |
| 5 | Engagement: no filter/sort; grouped block; "Not reported" | PASS | No engagement sort or filter anywhere (grep). Drawer Engagement group shows "Not reported" (`drawer-sparse-ad-0274-tall.png`). |
| 6 | No analysed toggle / badge / Analyse buttons | PASS | Grep plus rendered-text scan are clean. "analysed ads" appears only in "based on N analysed ads" notes, which the spec allows. |
| 7 | Missing data → disabled section + tooltip; layout stable | PASS | Sparse drawer ad-0274 locks Framework, Hook, Angle, Concept, Script, Transcript, LP, Location and Similar ads, each with a reason. Concepts section in `overlay-nested-backchip.png`. |
| 8 | "Based on X ads" on every overview / summary / analysis block | PASS | Overviews, AI summaries, charts, Rising/Scaling, trending tags, overlay sections, drawer AI score / breakdown / LP / keywords. |
| 9 | AI copy never equates most common with best | PASS | No "best", "top-performing" or "works best" in summaries. Unit test `summaries.ts:30-36` guards it. Copy says "Usage counts show popularity, not results". |
| 10 | No spy-tool/source names | PASS | Grep is clean for code and data. "AdVault" appears only in 2 code comments in `types.ts` (not user-visible). Rendered-text scan on Discover + drawer, domain overlay, angle overlay and offer overlay is clean. |
| 11 | Save + download on ads, hooks, frameworks, angles, concepts, LPs | PARTIAL | Present on cards, rows, overlays and drawer elements. The drawer's ad download is buried in "More" (QA-09). |
| 12 | Kept: URL state, compact header, Follow brand, pinned boards, Genie handoff | PASS | Deep link with `industry`+`f_*`+`detail`+`ad` reproduced and survived refresh. Follow page on cards. Pinned boards in sub-nav. Genie handoff works. Compact header verified by code only (caveat above). |
| 13 | Every bar/trend chart: unit label + tooltip | PARTIAL | TrendBars has "Unit:" plus a date+count tooltip. Row sparks have a unit and Hint. The "Where it works" share bars have neither (QA-08). |
| 14 | New = since last visit | PASS | `isNew` = firstSeenAt > lastVisitAt. Fresh profile shows 25 New. A revisit in the same session showed 3–5. |
| 15 | Dark/light, keyboard, narrow viewport, 60+ char truncation + tooltip | PARTIAL | Dark parity is good (`dark-*.jpg`). Rows and cards are focusable, Enter opens. No horizontal overflow at 375 on 4 pages. 76-char page name truncates with a tooltip. **But** KPI tiles truncate with no tooltip (QA-04), Esc pops the whole stack (QA-01), and focus is not restored (QA-05). |

### IA / nav
| Line | Result | Evidence |
|---|---|---|
| Module "Industry Insights V2"; 6 sub-items with counts | PASS | Sub-nav: My Feeds 299, Discover 800, Advertiser 100, Creative Element Insights 13, Saved Ads 6, Boards 3. The Elements count follows the Framework default tab (13), which reads oddly on the Hook tab, but is documented in `NavCount.tsx`. |
| No Domains / Competitors / Home / Trends / My preference items | PASS | `modules.ts` insights-v3 block. |
| Old module zero diff | PASS | `git diff --stat 262e2db -- src/pages/insights src/pages/insights-v2 src/components/insights src/components/insights-v2 src/insights-dashboard src/insights-trends src/lib/insights-dummy-data.ts src/hooks` is empty (also empty vs branch base `b2437a0`). `/insights-v2/feed` and `/insights/discover` render (`old-*.png`). |

### Discover
| Line | Result | Evidence |
|---|---|---|
| Scope bar + "My preferences only" toggle off; no tabs | PASS | `discover-desktop.png`. Observation: toggle set = My Feeds set (299 = 299) by definition. |
| KPI row: Total, Active, Winning, Advertisers, New, Avg days live, LPs & offers | PASS | 800 / 413 / 148 / 130 / 25 / 97 days / 265. Labels and subs truncate (QA-04). |
| AI summary + based-on | PASS | |
| Launch frequency chart (unit + tooltip) | PASS | "Unit: new ads per month"; tooltip = bucket range + count. |
| Rising + Scaling (expanded only) | PASS | |
| Trending tags = real data | PASS | Keywords and angles from data, with rise %. |
| 11 top-10 groups (Category only unscoped) + View more | PASS | 11 groups unscoped. `viewmore-modal.png` is searchable and selectable with counts. |
| Selected chips + Clear all + total | PASS | "268 ads · Clear all · showing items that match any selected tag". |
| Card fields | PASS | Industry + category, New, Winner (+engagement mark), days, status, clones, AI score + tier, analysis chips, save + download. |
| Sort: Newest, Oldest, Longest running, Most cloned, AI score | PASS | `AD_SORT_LABEL`. |
| Tag → filter; ad → drawer; element on card → overlay | PASS | Card chips "Hook: Callout. Open details" push `detail`. Article Enter opens `ad=`. |

### My Feeds
| Line | Result | Evidence |
|---|---|---|
| Sources = competitors + followed pages + followed industries; no prefs toggle | PASS | Identity row "From 3 competitors · 4 followed pages · 1 followed industry" (`feeds-desktop.png`). |
| Discover layout as-is | PASS | |
| Empty explains sources + links to Advertiser | PASS / minor | `state-empty-feeds.png`: copy and CTA are right, but the identity row contradicts it (QA-11). |

### Advertiser
| Line | Result | Evidence |
|---|---|---|
| Tabs Domain · Page · LP & Offers (URL) | PASS | `?tab=domain|page|lp`, with counts 100 / 130 / 265. |
| Domain/Page KPIs: Total, Active, New, Scaling, Rising | PASS | `advertisers-domain.png` (base-count inconsistency QA-13). |
| Groups Hook, Angle, Framework, Concept, CTA, Country, Category* | PASS | `groupKeysForScope` drops Category when scoped. |
| Columns | PASS / minor | All present, but LP/offers and Actions sit off-screen at 1440 (QA-07). |
| Mark as competitor → My Feeds; Follow (pages) | PASS | Table actions plus overlay header (Mark / Follow). |
| Sort Most ads, Most active/scaling, Most winners, Longest run | PASS | |
| LP KPIs | PASS | 265 / 52 offers · 193 active / 7 new · 74 rising / avg 2.1 (`advertisers-lp.png`). |
| LP groups Funnel, Offer domain, Hook, Framework, Concept, Country, CTA | PASS | |
| LP columns incl. "Not traced" | PASS | |
| LP sort (5) | PASS | |

### Creative Element Insights
| Line | Result | Evidence |
|---|---|---|
| Tabs Framework · Hook · Angle · Concept | PASS | 13 · 12 · 54 · 37. |
| KPIs: items + analysed, top + share, fastest rising, video/image, + Discover KPIs | PARTIAL | All present; "Fastest rising" and "Video vs image" values are truncated and unreadable (QA-04, `elements-hook.png`). |
| Groups = Discover minus own element | PASS | Hook tab has no Hook style group. |
| Columns | PASS | `elements-hook-table.png` (cosmetic QA-15). |
| Sort (4) | PASS | |
| Save + download on every row | PASS | Plus Use in Genie. |

### Detail overlays
| Line | Result | Evidence |
|---|---|---|
| Large overlay, URL-backed, follows scope, back chip, dynamic sections | PASS / FAIL (Esc) | Back chip "Back to Callout" (`overlay-nested-backchip.png`). Scope follows (Callout = 43 in Lead Gen vs 106 All). Outside click does not close it. **Esc closes the entire stack** (QA-01). |
| Advertiser overlay sections | PASS | Header + Mark/Follow + AI strategy summary + KPIs, launch activity, hooks/angles/frameworks/concepts/CTA/keywords, winners + LPs (copy bug QA-06). |
| Element overlay sections | PASS | Summary + KPIs, Where it works (categories / industries / advertisers), Works well with, top ads + Use in Genie + Save + Download (`overlay-hook-callout.png`). |
| LP & Offers overlay sections | PASS | Page capture (URL, final URL, HTTP 200, word count, searchable text), funnel + redirect path, ads + advertisers, creative mix (`overlay-lp-lp-001.png`, `overlay-offer.png`). |

### Ad drawer
| Line | Result | Evidence |
|---|---|---|
| Kept sections | PASS | Creative, meta row, actions (Create Variations, Add to competitor, Save w/ count, Copy link, More), stats grid, keywords + platforms, demographics, location, domains + language, similar ads (`drawer-full-ad-0106-tall.png`). |
| Removed analysed badge / Analyse buttons | PASS | |
| Added: chips/New/Winner; metrics + engagement; AI score breakdown; merged creative breakdown; LP+offer+funnel; Use in Genie + save/download per element | PASS | 82/100 Elite breakdown with reasons and examples; script/storyboard/timeline with 8 beats; transcript; each element clickable with Save/Download/Genie. |

### Saved Ads and Boards
| Line | Result | Evidence |
|---|---|---|
| Save from cards, drawer, rows, overlays | PASS | |
| Boards accept every element type; Saved Ads = ads only | PASS | Board detail type chips (Ads, Hooks, Frameworks, Angles, Concepts, Domains, Pages, LPs, Offers). |
| Download next to Save; pinned boards kept | PARTIAL | Drawer ad download is in "More" (QA-09). Pinned boards in sub-nav. |
| Opening a saved item opens the same drawer/overlay | PASS | Saved hook:warning to "Offers to watch" → board → "Open Warning" → `?detail=hook:warning` (`flow-element-5-board-item-reopens-overlay.png`). Test data was removed afterwards. |

### States
| Line | Result | Evidence |
|---|---|---|
| Disabled sections w/ tooltip; "Not reported"; 0-count disabled; **Country gap disclosed** | PARTIAL | First three PASS. Country gap: **FAIL**, no disclosure anywhere (QA-03). |
| New since last visit on ads + KPIs | PASS | |
| Trend % no minimum base; unit + tooltip | PASS | "+700%" from small bases shown; units present. |
| No-results one-click clear; My Feeds empty; loading = skeletons | PASS | `state-noresults-vsl-auto-insurance.png` ("No ads match the selected tags" + Clear tags, "1 selected beyond the top 10"). `state-loading-discover.png` shows grid skeletons matching card shape. |

### Prototype surfaces (E)
| Line | Result | Evidence |
|---|---|---|
| V2 search scopes follow new menu | PASS | `InsightsSearch.tsx` scopes per V2 menu item with counts; mounted on all pages. |
| Genie picker: elements + ads (additive) | PASS | `IndustryInsightsPicker.tsx:92-149` V2 tab; old pane default. |
| V2 Use in Genie resolves V2 ids | PASS | `ref=iiv2:ad-0495&act=use-hook` → banner "From Industry Insights · Action Use hook" (`flow-element-3-genie-use-hook.png`). |
| Dashboard tiles etc. stay on V1 | PASS (by decision Q17) | |

---

## Key flows

**Market first.** PASS, with QA-02 on the last step.
1. Discover, scope All: `flow-market-1-discover.png`.
2. Read the overview (KPIs, AI summary, launch chart).
3. Click top-10 tag Callout: list goes to 106, other counts unchanged (`flow-market-2-tag-callout.png`).
4. Open an ad (Enter on card `ad-0412`): drawer with AI score breakdown and Script/storyboard (`flow-market-3-drawer.png`).
5. "Use this script in Genie" → `/iq/genie6/studio-alpha/format?src=industry-insights&ref=iiv2:ad-0412&act=winner-as-reference…`. The banner says **"Winner ad as reference … using this winner as your reference"** for an ad with 24 days and 0 clones, which is not a winner (`flow-market-4-genie-script.png`, QA-02).

**Element first.** PASS.
1. Elements → Hook tab (`flow-element-1-hook-tab.png`).
2. Keyboard focus on the "Open Callout" row, Enter → `detail=hook:callout` (`flow-element-2-overlay.png`). The overlay shows Where it works and ads.
3. Use in Genie → `act=use-hook`, banner present, Exit returns to `/industry-insights/discover` (`flow-element-3-genie-use-hook.png`). The banner's REFERENCE is the example ad's headline, not the hook (QA-12).
4. Save → modal → board → board shows the item → opening it reopens the same overlay (`save-modal.png`, `flow-element-4-board-detail.png`, `flow-element-5-*.png`).

---

## Edge cases

| Case | Result | Notes |
|---|---|---|
| 0 results after tags | PASS | Composed empty state + one-click Clear tags. |
| Partial analysis (ad-0274: null framework/hook/angle/concept/beats/transcript, no LP, no country, no engagement) | PASS | Locked sections with reasons; AI score redistributes missing parts and says so. |
| No engagement | PASS | "Not reported" ×3 plus explanation. 655 of 800 ads have none. |
| No country (108 ads) | FAIL | Country counts neither sum to the total nor disclose it (QA-03). Data quirk: ad-0274 has no country but "Transparency regions: AU" (QA-20). |
| 60+ char names (pg-001 76 chars, pg-050, pg-051, dm-038) | PASS | Table cell ellipsis + Radix tooltip; overlay title truncates with tooltip (`overlay-page-pg-001-longname.png`). KPI tiles: FAIL (QA-04). |
| Dark / light | PASS | `dark-discover.jpg`, `dark-elements-concept.jpg`, `dark-advertisers-page-table.jpg`, `dark-overlay-lp-002.jpg`, `dark-drawer-sparse-ad-0274.jpg`. Accent at rest holds; no raw hex or raw palette classes in V2. |
| Narrow viewport (375) | PASS | Discover, My Feeds, Saved and Boards: `documentElement.scrollWidth` = 375, 0 overflowing elements. Advertiser and Elements show "best on desktop" with the URL kept (`mobile-*.jpg`). Cosmetic wrap issues QA-17. |
| Keyboard | PARTIAL | Rows `tr[tabindex=0]` and cards `article[tabindex=0]` are focusable with a visible ring; Enter opens. Esc on the drawer closes only the drawer. Esc on a nested overlay closes the whole stack (QA-01). Focus goes to `<body>` after close (QA-05). |
| Deep links | PASS | `?industry=lead-gen&f_hookStyle=callout&detail=hook:callout&ad=ad-0106` reproduced exactly (scope, pressed tag, overlay scoped to 43, drawer on top) and survived reload (`deeplink-combo.png`). |
| Back button | PASS | From Discover-tag → hook overlay → page overlay → ad drawer, three Backs peel drawer → page → hook. |
| Outside click | PASS | Click on the backdrop leaves the overlay open (Radix `onPointerDownOutside` prevented). |
| Hand-edited tag id | minor | `f_country=fr` (ids are `FR`) applies a 0-match filter and shows a raw "fr" chip (QA-10, `state-noresults-unknown-tag-fr.png`). |

## Forbidden text

- **Spy-tool / source names.** Case-insensitive grep over `src/lib/insights-v3`, `src/components/insights-v3`, `src/pages/insights-v3` and the added lines of the V2 Genie edits. Terms: adspy, foreplay, bigspy, spyhero, adplexity, "ad library", storeleads, minea, pipiads, advault. Result: clean except 2 code comments in `src/lib/insights-v3/types.ts:9,81` ("AdVault", not rendered). Rendered-text scans on 5 surfaces are clean.
- **Likes / comments / shares sort or filter.** None. Sort maps contain no engagement key (`selectors/sorts.ts`, `types.ts:418+`). Engagement is used only for the Winner-badge extra mark and the AI score (Q6 accepted).
- **"best" / "top-performing" / "works best" in AI copy.** None in summaries. The only hits are regex internals, comments, and kit preview copy ("not what performs best").
- **"Analysed / Not analysed / Analyse again / analysis queue".** None in V2 UI (only removal comments in `AdMetaPanel.tsx:7`, `AdDrawer.tsx:5`).

## Counts and design system

- **Counts:** sub-nav, tabs (0 → disabled), scope options (0 → `aria-disabled`), tag chips, view-more rows, search scopes. PASS.
- **Accent at rest:** lime count pills, KPI top border, AI summary block and bar fills are all visible at rest. PASS.
- **Tokens:** no raw hex, no raw Tailwind palette classes, no `g6-*` tokens, no `h-screen`, no emoji in V2 files. PASS.
- **Mono numerals:** KPIs, counts and table numerics are in Geist Mono. PASS.
- **No outside-click dismiss:** PASS.

§10 heuristic pass on Discover and the drawer:
- **Feedback:** toasts on save and download. OK.
- **Escape paths:** Esc over-closes (QA-01).
- **Consistency:** the same pattern holds across all 6 pages. OK.
- **Recognition over recall:** chips, counts and based-on notes. OK.
- **Edge cases:** KPI truncation (QA-04) and the Country gap (QA-03) are the misses.
- **Information hierarchy:** on Discover the ads grid starts about 2,100px down at 1440×2200 because 11 groups sit above it. That is per spec (overview first, collapsible), but worth a look for the demo.
- **Aesthetic minimalism:** the AI summary panel leaves a large empty lime area (QA-14).

---

## Issues

| ID | Sev | Page / component | Repro URL | Expected (spec) vs actual | Screenshot | Likely owner / file |
|---|---|---|---|---|---|---|
| QA-01 | major | Detail overlay stack | `/industry-insights/elements?tab=hook&detail=hook:callout~domain:dm-001` → press Esc | Expected: Esc closes the top layer only, so the user returns to "Callout" (QA brief; back chip for nested drill-down, 01 §Shared pattern). Actual: Esc wipes the whole `detail` stack to `?tab=hook`. The drawer behaves correctly. | `overlay-nested-backchip.png` | Orchestrator `src/components/insights-v3/InsightsOverlayHost.tsx:47-52` (`nav.onClose = close`; Esc should `pop` when `below` exists) and/or F2 `shared/DetailOverlay.tsx:43` (`onOpenChange → onClose`) |
| QA-02 | major | Genie handoff from drawer | `/industry-insights/discover?f_hookStyle=callout&ad=ad-0412` → "Use this script in Genie" | Expected: one Winner definition everywhere (PRD Data rules; non-negotiable #4). Actual: every ad defaults to `act=winner-as-reference`, so Genie says "Winner ad as reference … using this winner" for non-winners (ad-0412: 24 days, 0 clones). | `flow-market-4-genie-script.png` | E `src/components/insights-v3/genie/genieHandoff.ts:25-27` (`DEFAULT_GENIE_ACTION.ad`; pick by `isWinner(ad)`, else a neutral action such as `generate-variation` / use-as-reference) |
| QA-03 | major | Country top-10 group (Discover, My Feeds, Advertiser, Elements) | `/industry-insights/discover` | Expected: "Known gap … some ads have no country, so Country counts won't add up to Total ads" disclosed (02 §States; checklist "Country gap disclosed"). Actual: no note anywhere. 108/800 ads have no country, and multi-country ads push the sum above the total (US 605 + CA 190 + …). | `discover-desktop.png` | F2 `shared/TopTenGroup.tsx` (add a group note/hint slot), wired by A `discover/AdsMarketView.tsx`, B `pages/insights-v3/AdvertiserPage.tsx`, C `elements/useElementsData.ts`; or F1 adds group meta in `selectors/tags.ts` |
| QA-04 | major | KPI tiles (all pages) | `/industry-insights/elements?tab=hook` | Expected: long text truncates with a tooltip (non-negotiable #15). Actual: KPI label, value and sub use `truncate` with no title/tooltip. Values become unreadable: "Fastest rising **Before/…**", "Video vs image **47% / 4…**", concept tab "**UGC sel…**". Labels "Landing pages & o…" and subs "+50% launches vs th…" too. | `elements-hook.png`, `dark-elements-concept.jpg` | F2 `src/components/insights-v3/shared/KpiRow.tsx:35-52` (use `TruncatedText` / title); F1 `selectors/kpis.ts:288-317` (shorter `display` for split values) |
| QA-05 | minor | Overlay + drawer close | `/industry-insights/elements?tab=hook`, focus "Open Callout" row, Enter, then Esc (or Back) | Expected: focus returns to the trigger row (keyboard access, #15). Actual: `document.activeElement` = `<body>`. | — | F2 `shared/DetailOverlay.tsx` (`onCloseAutoFocus` / restore to opener); D `ad-drawer/AdDrawer.tsx` same |
| QA-06 | minor | Advertiser AI strategy summary | `/industry-insights/advertisers?tab=page&detail=page:pg-001`; `…tab=domain&detail=domain:dm-001` | Expected: one clean summary. Actual: the winner fact appears twice: "…and 1 passes the Winner rule. … 1 passes the Winner rule, but the framework isn't identified on it." / "…none pass the Winner rule yet. … None of these ads pass the Winner rule yet." | `overlay-page-pg-001-longname.png`, `overlay-nested-backchip.png` | F1 `src/lib/insights-v3/selectors/summaries.ts:80-99` (`winnersClause` repeats `liveAndWinners`) |
| QA-07 | minor | Advertiser Domain/Page table | `/industry-insights/advertisers?tab=domain` at 1440 with sub-nav open | Expected: Actions (Mark as competitor · Follow) visible. These are the way into My Feeds (02 §Advertiser columns). Actual: table is 1526px in a 1121px wrapper; "Landing pages / offers" and "Actions" need horizontal scroll. | `advertisers-domain-table.png` | B `src/components/insights-v3/advertiser/AdvertiserTable.tsx` (narrower columns or sticky Actions column) |
| QA-08 | minor | Element overlay "Where it works" bars | `/industry-insights/elements?tab=hook&detail=hook:callout` | Expected: every bar chart has a unit label + tooltip (#13). Actual: share bars have only an `aria-label`, with no "Unit:" line and no hover tooltip. | `overlay-hook-callout.png` | C `src/components/insights-v3/elements/detail/MixList.tsx` |
| QA-09 | minor | Ad drawer actions | `/industry-insights/discover?ad=ad-0106` | Expected: "Download sits next to Save on every element" (02 §Saved Ads and Boards). Actual: ad download is only in More → "Download creative and analysis". | `drawer-full-ad-0106.png` | D `src/components/insights-v3/ad-drawer/AdMetaPanel.tsx:156-189` |
| QA-10 | minor | URL tag parsing | `/industry-insights/discover?industry=vsl&f_country=fr` | Expected: unknown or miscased tag ids are ignored or normalised. Actual: filter applies with 0 matches; chip reads raw "Country: fr"; the real "France 4" tag shows unpressed. | `state-noresults-unknown-tag-fr.png` | F2 `src/components/insights-v3/shared/url.ts` (`useSelectedTags` validation) / F1 `selectors/tags.ts` (`tagLabel` fallback) |
| QA-11 | minor | My Feeds empty dev state | `/industry-insights/feeds?state=empty` | Expected: an empty state that is coherent. Actual: identity row still says "From 3 competitors · 4 followed pages · 1 followed industry" and sub-nav says 299, next to "Nothing feeds My Feeds yet". | `state-empty-feeds.png` | A `src/pages/insights-v3/MyFeedsPage.tsx` / `discover/MyFeedsIdentity.tsx` |
| QA-12 | minor | Element → Genie banner | `/industry-insights/elements?tab=hook&detail=hook:callout` → Use in Genie | Expected: user handed a hook sees that hook as the reference. Actual: banner REFERENCE = example ad headline "Cut your Home Insurance Bill — free qu…"; "Callout" isn't named. | `flow-element-3-genie-use-hook.png` | E `genie/genieHandoff.ts` + `src/genie6/flows/data/flowSources.ts` (V2 resolver label using `FlowSourceRef.elements`) |
| QA-13 | minor | Advertiser Domain overview | `/industry-insights/advertisers?tab=domain` | Expected: one base per overview ("every count honest"). Actual: "Total domains 100 · 800 ads in scope" while the same overview says "Based on 764 ads" (36 ads have no domain advertiser, unexplained). | `advertisers-domain.png` | F1 `src/lib/insights-v3/selectors/kpis.ts` (`advertiserKpis` sub) |
| QA-19 | minor | Saved Ads cards | `/industry-insights/saved` | Ads listed in Saved Ads show an empty bookmark (board count 0) next to "Unsave". The two "saved" concepts are visibly inconsistent. Accepted deviation in BUILD-LOG (D), flagged for Maalik. | `saved-desktop.png` | D `src/pages/insights-v3/SavedAdsPage.tsx`, `ad-card/AdCardActions.tsx` |
| QA-14 | cosmetic | Overview layout | `/industry-insights/discover` (also Advertiser, Elements) | AI summary card stretches to the right column's height, leaving about 300px of empty lime panel. | `discover-desktop.png` | A `discover/AdsMarketView.tsx` / F2 `shared/OverviewShell.tsx` |
| QA-15 | cosmetic | Elements table | `/industry-insights/elements?tab=hook` | Trend ChangeChip wraps "vs previous period" into a 3-line pill. The first glyph of wrapped description lines is clipped ("Puts", "or free" render cut). | `elements-hook-table.png` | C `elements/ElementTable.tsx`; F2 `shared/TrendBars.tsx` (`ChangeChip` nowrap) |
| QA-16 | cosmetic | Overlay open | `/industry-insights/advertisers?tab=lp&detail=lp:lp-001` | Initial focus lands on a tooltip trigger, so a tooltip auto-opens over the AI summary ("No screenshot was captured…"). Same for the long page name. | `overlay-lp-lp-001.png`, `overlay-page-pg-001-longname.png` | F2 `shared/DetailOverlay.tsx` (`onOpenAutoFocus` → heading or close button) |
| QA-17 | cosmetic | ScopeBar on mobile (375) | `/industry-insights/saved` on a phone | Scope bar wraps with a dangling "›" at a line start or end; search placeholder clipped ("Search ads, advertisers, ho"). | `mobile-saved.jpg`, `mobile-discover.jpg` | F2 `shared/ScopeBar.tsx` |
| QA-18 | cosmetic | Vocabulary | `/industry-insights/advertisers?tab=domain` (onwardrx.health row) | Hook "Before/after" and concept "Before / after" sit side by side with different spelling. | `advertisers-domain-table.png` | F1 `src/lib/insights-v3/data/vocab.ts` |
| QA-20 | cosmetic | Dummy data consistency | `/industry-insights/discover?ad=ad-0274`; first Newest card | ad-0274 has no country but "Transparency regions: AU". The top Newest card is "New — added since your last visit" yet "12 days live" (start predates first seen). | `drawer-sparse-ad-0274-tall.png` | F1 `src/lib/insights-v3/data/generate.ts` |
| QA-21 | cosmetic | Board item card | `/industry-insights/boards/board-seed-offers` | Only the small "Open X" control opens the item; clicking the card body does nothing. Discover and Saved cards open on click. | `flow-element-4-board-detail.png` | D `src/components/insights-v3/boards/BoardItemCard.tsx` |

(IDs QA-19 and later are grouped by severity in the table above, not by number.)

### Observations (not graded as issues)
- "My preferences only" on Discover yields exactly the My Feeds set (both 299), because preferences are defined as follows + competitor marks (`selectors/scope.ts:28-34`). This is consistent with the PRD, but the toggle duplicates My Feeds. Worth confirming with Maalik.
- The Creative Element Insights sub-nav count (13) is the Framework tab's count and doesn't change on other tabs (documented in `NavCount.tsx`).
- Console errors seen are only Supabase auth-refresh `ERR_INTERNET_DISCONNECTED` (environment); there are no app errors on V2 pages.
- No code, config or `src/` file was changed by QA. Test data written during the save-flow check (hook:warning on "Offers to watch") was removed. The in-app theme was reset to light.
