# Launch v2 — Sub-screens Plan (Strategies · Templates · History+Dashboard · Settings · Auto)

Source of truth for the remaining Launch v2 sub-menus. Created 2026-06-19. Planning only —
implementation gated on Maalik's per-screen greenlight.

## Locked decisions (Maalik, 2026-06-19)

1. **Data layer — extend the mock, swap-ready.** Keep the localStorage mock service contract;
   make it realistic (multi-run history + real CRUD for templates/strategies/settings). No backend
   this round. Swap to Supabase/Graph API later behind the same interface. Matches the standing
   "mock built against real Meta contract" rule.
2. **Navigation IA — flatten to top-level.** Sub-nav peers: `New launch · History · Templates ·
   Strategies · Launch settings · Auto launch`. Strategy stops being mislabeled under Templates.
   → edit `src/components/sidebar/modules.ts` launchv2 subItems; un-nest Strategy + Launch settings.
3. **Launch Settings — single global defaults profile.** One workspace-wide defaults profile that
   pre-fills every NEW launch (override per-launch as needed). PLUS global nomenclature for all 3
   levels (campaign / ad set / ad), not just ad.
4. **Dashboard — honest launch-ops metrics only.** # launches, success rate, ads created/failed,
   last launch, failure-reason breakdown. NO fake spend/ROAS/Meta-IDs until Graph API.
5. **Library layout — card grid + persistent preview RAIL** (not a drawer). Selecting a card updates
   a right-hand rail in place. Applies to both Strategies and Templates.
6. **Apply behavior — Apply spins up a fresh, pre-filled launch** and drops into the flow at step 1
   (or first incomplete step). Library and flow stay loosely coupled.
7. **Build order:** Strategies → Templates → History+Dashboard → Launch settings. Auto launch stays
   a "coming soon" stub throughout (polish the stub, don't build it).

## Current-state findings (from parallel Explore audit)

- **Routes already exist** for all of these (`/launchv2/settings[/audience|setup|distribution|strategy|launch]`,
  `/launchv2/auto`, `/launchv2/:id`) but every `/settings/*` path renders the SAME `LaunchV2Settings`
  (Templates-only). Wiring is mostly "give each route its real screen."
- **Sidebar sub-nav exists** in `modules.ts` (currently nests Strategy + Launch settings under Templates).
- **`strategiesService`** (localStorage `fabads:launchv2:strategies:v4`) — full CRUD: list/get/save/rename/
  remove/summarize. NO update/duplicate. `useCount`/`lastUsedAt` never updated at runtime.
- **`templatesService`** (localStorage `fabads:launchv2:templates:v1`) — Setup + Distribution kinds;
  list/get/save/rename/remove. Fork-only (no update). `TemplatesSection` lists + rename + delete; NO
  apply/preview/search/create-from-here. Targeting templates (8 static in `data.ts`) + ad-copy bundles
  (`bundlesService`) have NO management UI.
- **Settings/defaults** all hardcoded in `newPlanV2()` + `intentDefaults()`. No global defaults concept.
  Nomenclature is per-plan, ad-name only; `namingPatterns` (per-level) is dead code. `resolveName` tokens:
  `{brand} {intent} {objective} {date} {adset} {n}`.
- **History**: `LaunchRunV2` rich; `mockLaunchV2` runs/ticks/retries; `listRuns()` exists but is never
  called. ONLY the last run persists (single sessionStorage key `fabads_launchv2_run`, overwrites).
  Hub dashboard is 100% hardcoded mock. `LaunchV2Detail` (single run) is real.
- **Auto**: `/launchv2/auto` → 13-line "coming soon" stub. `scheduledFor` partially wired (data model +
  Detail `ScheduledCard`). Full v1 `AutoPilotLaunch` exists at `/launch/autopilot` as reference only.

---

## Build #1 — Strategies (`/launchv2/strategies`)

Fixes the dead "Manage strategies →" link (currently routes to Templates).

- **New route + screen** `screens/strategies/StrategiesLibrary.tsx`. Add `/launchv2/strategies` to
  `routes.tsx`; repoint Hub link + sub-nav.
- **Layout:** card grid (left) + preview rail (right). Search + tag rail (real tags from stored
  strategies) + sort (Recently used / Most used / Name). Reuse `StrategyCard` if salvageable.
- **Preview rail:** objective · budget · pages · format · spread · audience · used-count · partial flag.
  Actions: `Apply → new launch`, `Duplicate`, `Rename`, `Delete`.
- **Apply:** start fresh draft pre-filled via `applySavedStrategy`, navigate `/launchv2/new` at first
  incomplete step.
- **Service additions:** `duplicate(id)`, `markUsed(id)` (increment `useCount` + set `lastUsedAt` on
  apply). Wire existing `rename`/`remove`/`summarize` into UI.
- **Gaps to close:** delete UI, rename UI, preview, duplicate, useCount/lastUsedAt updates on apply.

## Build #2 — Templates (`/launchv2/templates`)

Same card-grid + preview-rail pattern as Strategies (shared components).

- **Upgrade** `TemplatesSection` → full `TemplatesLibrary` screen with tabs:
  Setup · Distribution · Targeting · Ad-copy bundles.
- **Add:** Apply (→ pre-filled new launch for Setup/Distribution; merge for targeting/bundle), preview
  rail, search, "Save current as template" entry.
- **Targeting tab:** surface the 8 static `TARGETING_TEMPLATES` (read-only/seed) + wire the stubbed
  "Save as new targeting template" path (currently `console.log`).
- **Bundles tab:** list/manage `bundlesService` ad-copy bundles (no UI today).
- **Service additions (as needed):** `duplicate` per kind. Keep fork-only edit policy.

## Build #3 — History + Dashboard (`/launchv2/history`)

- **Persistence foundation first:** extend `mockLaunchV2` to retain MULTIPLE runs in localStorage
  (array under e.g. `fabads:launchv2:runs:v1`), keep last-N (e.g. 50). Add `useRunsV2()` hook +
  wire `listRuns()`.
- **Screen** `screens/history/LaunchHistory.tsx`: honest KPI strip (launches · success rate · ads
  created · failed · last launch · failure-reason breakdown) ABOVE a runs table (launch · status ·
  ads created/requested · when · row → `/launchv2/:id`). Use `/build-dashboard` skill for KPI strip.
- **Replace** the Hub's hardcoded `RECENT`/`LIVE_LAUNCHES`/`OPS_KPIS` mock arrays with real
  service-derived data (or repoint "See all in History →" here).
- **Honest about mock:** no spend/ROAS; metrics derive only from persisted run data.

## Build #4 — Launch settings (`/launchv2/settings`)

- **Single global defaults profile** persisted in localStorage (e.g. `fabads:launchv2:defaults:v1`).
  Sections: budget/intent/bid, placements, attribution, UTM. `newPlanV2()` reads this profile (with
  hardcoded fallback) so a fresh launch starts from the saved defaults.
- **Global nomenclature (all 3 levels):** promote naming to a saved global config; extend
  `resolveName` + `planUnits` to apply campaign/adset patterns (today only ad-level). Revive/replace
  the dead `namingPatterns` field. Add `{audience}` token if useful.
- **Screen** `screens/settings/LaunchSettings.tsx`: defaults form (left) + nomenclature builder
  (right), live preview, Save. Reuse `NomenclatureBuilder` token-chip UX.

## Build #5 — Auto launch (stub polish only)

- Keep `/launchv2/auto` as "coming soon" but upgrade `LaunchV2Auto.tsx` from a bare centered message
  to a designed placeholder describing intended capability (re-launch from a previous run; schedule).
  No real functionality this round. Reference: v1 `AutoPilotLaunch` at `/launch/autopilot`.

---

## Execution method (per standing instruction)

- Fan out parallel Sonnet agents per file (one agent per target file, no merge conflicts).
- ONE persistent Opus monitor after each batch — runs `tsc -p tsconfig.app.json --noEmit` + `npm run
  build`, checks regressions + that earlier builds weren't broken. Batch not done until it signs off.
- `/batch` + `/frontend` where the user calls for them.
- Apply FabFunnel design system v1.2 (lime #8FB821, rounded-2xl, Geist Mono numerics, both modes).
