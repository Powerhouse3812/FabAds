# Industry Insights V2 — final report

Oct 10, 2026 · branch `industry-insights-v3` (local, **not pushed, not merged to main**)

## What's built
A fresh module, **"Industry Insights V2"** (sidebar rail item with a "V2" chip), beside the old Industry Insights, which has **zero diff**. Routes are `/industry-insights/*`.

| Page | What's there |
|---|---|
| **My Feeds** | Discover pattern limited to competitors, followed pages and followed industries. The identity row lists them with inline unfollow. Empty state explains the sources and links to Advertiser. |
| **Discover** | Scope bar (Industry › Category › Period, all with counts) + "My preferences only" toggle (off). Overview: 7 KPIs, AI summary, launch frequency, trending tags, Rising + Scaling. 11 top-10 groups with View more. Union filter with chips + total. 5 sorts. Ad grid. Search with `q`. |
| **Advertiser** | Domain · Page · LP & Offers tabs. KPIs, groups, spec columns. Mark as competitor / Follow. Advertiser, landing page and offer overlays with nested drill-down and a back chip. |
| **Creative Element Insights** | Framework · Hook · Angle · Concept tabs. KPIs, groups minus the tab's own element, spec columns + "Market footprint". Element overlay (where it works, works well with, top ads, verbatim hooks) with **Use in Genie**. |
| **Saved Ads** | Ads only, scoped, sortable, unsave with undo. |
| **Boards** | Every element type can be saved (ad, framework, hook, angle, concept, domain, page, landing page, offer). Type chips with counts. An item opens in the same drawer or overlay it was saved from. Pinned boards (max 5) in the sub-nav. |
| **Ad drawer** | Everything kept from today's drawer, minus the analysed badge and Analyse buttons. Adds: chips, New/Winner, metrics + engagement ("Not reported"), AI score breakdown with reasons and examples, merged script/storyboard/timeline, LP + offer + funnel, Save/Download/Use in Genie on each element. |
| **Genie** | V2 ads and elements hand off to Studio (`iiv2:` refs). Winners go as "winner reference", other ads as variations, elements as use-hook/angle/framework/concept with the element carried. The banner names the element. Back link returns to V2 Discover. The Genie picker has a V2 tab. |

Every page has: URL-backed state for everything (deep links and refresh reproduce the exact view; Back peels one layer), a compact header on scroll, counts in the sub-nav that follow the scope, "Based on X ads" notes, gap notes ("108 ads have no country"), disabled-with-reason sections, loading/empty/no-results states, dark and light, and keyboard access.

**Data:** 800 deterministic dummy ads across 6 industries (VSL, Telehealth, Lead Gen, E-commerce incl. Amalfa's category, Search Arb, Others) and the A–Z category list.
- Analysis: hook style, angle, framework, framework elements, concept (37 formats), keywords, script beats, transcript.
- Landing pages: 265 with offers and 5 funnel types.
- Engagement on about 18% of ads. The AI score follows the reference model.
- Winner = seen live + ≥14 days + ≥2 clones.
- About 25 ads are "New since last visit" on a first visit.
- No spy-tool or source names anywhere.

## Quality gates (final)
- Two UI/UX crit passes followed QA: layout/hierarchy (`f8d0758`) and states/interaction/a11y (round 2). See BUILD-LOG › Agent reports.
- `npm run typecheck` passes.
- `npm run test` passes, **385/385**.
- `npm run build` passes. The only warning is the >500 kB chunk warning that existed before this build.
- eslint: **0 errors** in every V2 file and every touched file. Whole-repo lint still has its pre-existing errors (Q15).
- QA (independent agent): 0 blocker, 4 major, 10 minor, 7 cosmetic. **All 21 fixed and merged**, and the majors were re-checked in the browser.
- The union rule was verified against raw data: Callout + Curiosity question + PAS = 268 distinct ads, and no other count moved.
- Forbidden-text grep is clean in code, data and rendered pages.

## Spec lines met with a deviation (needs Maalik's call)
1. **No scope bar on Boards / Board detail.** Boards hold saved items, not market data. Saved Ads does have one.
2. **"Use this script in Genie"** sends the ad, not the script text. Genie has no way to carry an Industry Insights script (`use-script` isn't offered for the module, and `use-storyboard` carries no text). Hooks, angles, frameworks and concepts do travel.
3. **Saved Ads vs boards** are two "saved" concepts, per spec. The Saved Ads page explains that the bookmark means "add to board".
4. **"My preferences only" on Discover gives the same set as My Feeds** (both 299), because preferences = follows + competitor marks. Consistent with the PRD, but the two overlap.
5. **Element share %** is out of the ads where that element is identified, not all ads. This is honest under partial analysis, and the tooltip says so.
6. **Discover's overview is tall** (11 groups) before the ad grid. Collapsing the overview gets you to the grid quickly.

## Decisions taken during the build
All are recorded in `BUILD-LOG.md` → Decisions (Q1–Q17) and "Decisions taken during the build". Highlights:
- **Separate module and storage:**
  - Fresh module beside the old one; code under `insights-v3` folders (`insights-v2` was taken by the old feed).
  - V2's own localStorage stores, so V2 element items can't leak into the old module's Supabase boards (Q10 superseded).
- **Mobile:** Advertiser and Elements are blocked on mobile ("best on desktop"); the other 4 pages work at 375px.
- **Discover overview:** Rising = rising elements; Scaling = scaling pages.
- **Data rules:**
  - Tag counts are ad counts, including on the LP tab.
  - Unknown or miscased tag ids in a URL are normalised or ignored.
  - Unknown start dates fall back to the first-seen date for period membership; "Start date unknown" is still shown.
- **Genie:** the V2 ref prefix is `iiv2:`. There are two small additive Genie fields: `FlowSourceRef.elements` and `exitPath`. Old refs are unchanged.
- **Tests:** vitest timeout raised to 15s. Render tests timed out only when machine load hit ~113.

## Known cost
Genie's flow code now imports the V2 data module, so the V2 universe (~80 ms) builds the first time Genie loads.

## How to run the demo
1. In the orchestrator worktree, `npm run dev`. The `.env` is copied from the main checkout.
2. Open `http://localhost:3000/industry-insights/discover`, or click the **V2** rail item.
3. **Market first:** pick tags (e.g. Hook style "Callout" + Framework "PAS" gives 185 ads), then open an ad and use **Create Variations** or **Use in Genie**.
4. **Element first:** Creative Element Insights → Hook → Callout → **Use in Genie** (Studio opens with "Hook · Callout"), or **Save** to a board.
5. Dev states: add `?state=loading` or `?state=empty` to any page. The kit preview is at `/industry-insights/_kit`.

## Screenshots
- UI/UX crit round (after): `docs/industry-insights/qa/screens-ux-round/`
- QA pass: `docs/industry-insights/qa/screens/` (57)
- After fixes: `docs/industry-insights/qa/screens-after-fixes/`
- Full QA report: `docs/industry-insights/qa/QA-REPORT.md`

## Not done (by decision)
- Dashboard tiles, onboarding quick setup, the Reports cross-sell card and the old search popover still point to V1 (Q17).
- Old module files are left as they are, for a separate cleanup once V2 replaces V1.
