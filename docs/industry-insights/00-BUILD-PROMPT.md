# Build prompt — Industry Insights v3 (FabAds prototype)

You are the **orchestrator and monitor** for this build. You plan, split, assign, review, merge and verify. You don't write feature code yourself except the shared contracts in Phase 0. Sub-agents write the code.

Speed matters: run agents in parallel wherever file ownership allows. But **never build on a guess**. If something is unclear, missing or contradicts the docs, stop that piece and ask Maalik.

---

## 1. Context

- **Repo:** FabAds prototype (React + Vite + Tailwind + Supabase on Lovable). It's a demo on dummy data. No backend or Supabase changes.
- **Goal:** rebuild Industry Insights to the approved docs. AdVault is only a reference.
- **Source of truth** (read fully before anything else):
  - `docs/industry-insights/README.md`
  - `docs/industry-insights/01-prd-and-ia.md`: goals, scope, IA, flows, data rules, list of prototype surfaces that change
  - `docs/industry-insights/02-page-specs.md`: every page, overlay, drawer and state
  - `docs/industry-insights/img/*.png`: sitemap, user flows, shared page pattern
  - `docs/industry-insights/reference/advault-*.md`: data reference only (vocabularies, AI score model, fields)
- **Also follow:** `CLAUDE.md`, `AGENTS.md`, and the `fabfunnel-design-system` + `ui-ux-pro-max` skills.
- **Research is already done.** The docs cover the research loop's IA, use cases and Q&A steps (CLAUDE.md steps 2–4 and 7). Skip the external reference scan. Still do these: inventory existing patterns (step 1), edge cases (step 5) and the heuristic checklist (step 8).

## 2. Non-negotiables (every agent, every file)

1. **Scope bar on every page:** Industry › Category › Period, default All. Everything follows it. No Industry or Category tabs anywhere.
2. **Counts on every filter, menu and tag**, for the current scope. 0 = visible but disabled.
3. **Top-10 tag filters add up (union).** This holds within a group and across groups. Picking a tag never changes other tags' counts. Only the total result count changes, and each ad is counted once.
4. **Winner** = running days + clones/similar ads + status. Never likes.
5. **Engagement** (likes, comments, shares): no filter, no sort. Show it only inside a grouped block, with "Not reported" when missing.
6. **Analysis data is on by default.** No "analysed only" toggle. No "Analysed / Not analysed" badge, no "Analyse again" or "Add to analysis queue" buttons.
7. **Missing data never breaks the layout.** A section with no data shows disabled with a tooltip.
8. **"Based on X ads"** goes on every overview, summary and analysis block.
9. **AI copy never presents "most common" as "best".**
10. **Never show spy-tool or source names** (AdSpy, ForePlay, BigSpy, Meta Ad Library…) in the UI or in dummy data shown to users.
11. **Save to board + download on every element type** (ads, hooks, frameworks, angles, concepts, landing pages).
12. **Keep from the prototype:** URL-backed state (filters, tabs, drawer, overlays, modals), compact header on scroll, Follow brand, pinned boards, Genie handoff.
13. **Every bar/trend chart has a unit label and a tooltip.**
14. **"New" = added since the user's last visit.**
15. **Dark + light parity, keyboard access, narrow viewport.** Long names truncate with a tooltip.

## 3. Git and isolation

- Branch `industry-insights-v3` from `main`. Every sub-agent works in its **own git worktree** (Agent tool, `isolation: "worktree"`) branched from it. You merge into `industry-insights-v3`.
- **`main` has uncommitted work that isn't ours:** `src/dashboard-variants/ClassicDarkDashboard.tsx`, `AGENTS.md`, `.codex/`, `docs/research/`, `_claude_stage.tgz`. Never stage, commit, revert or delete these. Stage files by explicit path only; never `git add -A` or `git add .`.
- **Don't push and don't merge to `main`** (it may deploy to Lovable) until Maalik says so.

## 4. Phases

### Phase 0 — Orchestrator only (blocks everything)

1. Read every file in §1.
2. **Inventory** the current Industry Insights code and note file paths:
   - routes in `src/App.tsx`
   - sidebar modules
   - `src/pages/insights/*` and `src/pages/insights-v2/*`, plus the dummy data in `src/pages/insights-v2/insights-dummy-data.ts`
   - `src/components/insights/*` and `src/components/insights-v2/*`: ad card, ad detail drawer, competitor detail, boards, saved ads, search popover
   - every other surface listed in the PRD's "Prototype surfaces that change": dashboard tiles, onboarding quick setup, Genie Industry Insights picker, Reports cross-sell card
3. **Decisions:** every question in `02-page-specs.md` → Open questions is decided (Oct 10, 2026), and the sections already reflect the answers. Don't reopen them. If code reality conflicts with a decision, ask Maalik.
4. **Discover sketch:** ask Maalik to share his Discover wireframe sketch. Compare it with the Discover spec (and the shared page pattern). Bring back **only the differences**, each as a decision question. If the sketch never comes, build to the spec.
5. Collect every other doubt you have (naming, data you can't find a definition for, conflicts between docs and code). Put them in the same batch or one follow-up batch. **No silent assumptions.**
6. Write the **shared contracts**, so the parallel agents don't collide:
   - `src/lib/insights-v3/types.ts`: Ad (with analysis, LP/offer/funnel, clones, days live, status, first seen, AI score + breakdown), Advertiser, Element, LandingPage, Scope, TopTenGroup, SortOption, KPI.
   - **Folder ownership map:** which agent owns which folders/files. Shared files are touched only by the owner.
7. Write the plan to `docs/industry-insights/BUILD-LOG.md`: agents, owned files, spec sections each covers, order, and a checklist with one line per spec section. Show Maalik a 10-line summary and **wait for his go**.

### Phase 1 — Foundation (2 agents in parallel)

- **Agent F1 — Data layer.** Owns `src/lib/insights-v3/data/*` and `selectors/*`.
  - Extend the dummy data (keep ~800 ads):
    - real industries and the A–Z categories from `reference/advault-A`
    - framework, framework element, hook, angle, concept, keyword, CTA, script / storyboard / timeline / transcript
    - LP + offer + funnel, clones, days live, status, first seen, country (some missing on purpose)
    - engagement on only ~20% of ads
    - AI score + breakdown using the model in reference A
  - Selectors:
    - scope filtering
    - KPIs per page
    - top-10 aggregations with counts
    - union filter + total
    - Winner rule
    - "new since last visit" (last visit stored per user in localStorage, read safely)
    - trends / rising / scaling
    - per-element and per-advertiser aggregates
    - all sort options from the specs
  - Unit tests (vitest) for the union total, the Winner rule, counts per scope and New since last visit.
- **Agent F2 — Shared UI kit.** Owns `src/components/insights-v3/shared/*`. Build from existing prototype components wherever possible:
  - ScopeBar
  - collapsible OverviewShell, KpiRow, AI summary block with the "based on X ads" note
  - TopTenGroup + ViewMoreModal
  - SelectedChips + total count
  - SortControl
  - DisabledSection (with tooltip)
  - TrendBars (unit + tooltip)
  - DetailOverlay shell (like today's competitor detail, URL-backed, back chip for nested drill-down)
  - Save + Download actions
  - New / Winner badges
- You (orchestrator) add the **route + sidebar skeleton**: six menu items (My Feeds, Discover, Advertiser, Creative Element Insights, Saved Ads, Boards), placeholder pages, and redirects from old routes. Domains and Competitors leave the sub-nav.

### Phase 2 — Features (5 agents in parallel, after Phase 1 merges)

| Agent | Builds | Spec sections |
|---|---|---|
| A — Discover + My Feeds | Both pages on the shared pattern; "My preferences only" toggle on Discover; new ad card | Discover, My Feeds |
| B — Advertiser | Domain / Page / LP & Offers tabs; Mark as competitor / Follow; Advertiser and LP & Offers detail overlays (replacing the competitor detail) | Advertiser, Detail overlays |
| C — Creative Element Insights | Framework / Hook / Angle / Concept tabs; Element detail overlay with Use in Genie + Save | Creative Element Insights, Detail overlays |
| D — Ad drawer + saving | Upgraded ad drawer (keep everything existing, add the specced sections); Saved Ads and Boards accept every element type; download | Ad drawer, Saved Ads and Boards |
| E — Cross-surface | Search popover scopes, dashboard tile labels, onboarding quick setup, Genie picker (elements as well as ads), Reports cross-sell copy, old-route redirects | PRD → Prototype surfaces that change |

Every agent also implements the **States** section (missing data, empty, loading, New, trends) for its own screens.

### Phase 3 — Integrate and verify

1. Merge each branch after review (see §5). Run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` after every merge. Fix or send back before the next merge.
2. **Agent Q — QA** (fresh context) checks the merged branch against the specs:
   - every checklist line in BUILD-LOG
   - both key user flows end to end (Market first, Element first)
   - edge cases: 0 results, partial analysis, no engagement, no country, 60+ char names, dark/light, narrow viewport, keyboard-only
   - forbidden-text checks: spy-tool names (grep), any likes/comments/shares sort or filter
   - Playwright screenshots of every page, overlay and drawer, saved to `docs/industry-insights/qa/`
   - QA reports issues; it doesn't fix them. You route each fix to the owning agent.
3. Final report to Maalik:
   - what's built
   - spec lines not met and why
   - decisions taken during the build
   - how to run the demo
   - screenshots folder

## 5. Monitoring rules (you, the whole time)

- **Track every agent's task** in the task list and in BUILD-LOG.md. Keep BUILD-LOG current so Maalik can check progress anytime.
- **Every agent finishes with a report:** files changed, spec sections covered, deviations, open questions. No report = not done.
- **Review each diff against the spec section before merging.** Check that only owned files changed and nothing extra was built. Check the existing patterns were reused.
- **When an agent hits a doubt, it stops that piece and reports it.** You batch doubts and ask Maalik; don't let agents guess. Meanwhile the agent continues on unblocked work.
- **If an agent stalls or loops** (same error twice), stop it, read its state, and either unblock it or reassign the work.
- **Keep the agent count under 10** (current plan: 2 + 5 + 1 = 8).

## 6. Definition of done

- Every spec checklist line is ticked in BUILD-LOG, or listed with a reason.
- Typecheck, lint, tests and build all pass on `industry-insights-v3`.
- Both key flows work in the running app on dummy data.
- QA screenshots are saved; no forbidden text.
- Nothing is pushed or merged to `main` without Maalik's OK.
