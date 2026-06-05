# Launch 2.0 — Build Conventions (agent contract)

> Read this before touching any `src/launch2/*` file. These rules keep the
> parallel-built surfaces visually + structurally consistent. Source of truth:
> the planning handoff (00_README / 01_Spec / 02_IA / 03_Flow).

## The thesis (don't lose sight)
"The launcher that doesn't lose to Ads Manager." Win on **reliability + account
survival**, not speed. Every screen should *feel* trustworthy and legible.

## Reliability spine (invariants — these are acceptance criteria)
- **Idempotent launch:** N requested = N created. Dispatch carries a `dedupeKey`.
- **Autosave every step** — flow state persists to localStorage; refresh never loses it.
- **failed ≠ launched** — only `ok` dispatch results count as live. Failures are attributable + retryable.
- **Retry-failed-only** — never re-run the whole batch.
- **Cap pre-check** — 250 ads/Page checked inline (Step 2) + authoritatively (Review).

## Design tokens (FabFunnel v1.2.1 — use class names, never raw values)
- Surfaces: `bg-background` (page), `bg-card` (elevated), `bg-muted` / `bg-secondary` (tier).
- Text: `text-foreground`, `text-muted-foreground`. Never use lime for body text.
- Borders: `border-border`.
- **Primary lime = FILL ONLY.** Buttons: `bg-primary text-primary-foreground` (dark text on lime).
- Lime as text/border (rare, e.g. active label): `text-[hsl(var(--primary-text))]`.
- Status **text**: `text-[hsl(var(--error-text))]` / `--warning-text` / `--success-text`.
- Status **fills/dots**: error `#ff4d4f`, warning `#faad14`, success `#52c41a` — use the
  `StatusPill` / `HealthDot` components, don't hand-roll.
- Type: apply `font-g6-sans` (Geist) on containers; `font-g6-mono` for numeric / code / labels.
- Radius: `rounded-lg`/`md`/`sm`. Shadow: `shadow-sm`/`md`/`lg`. Icons: `lucide-react`, 2px stroke (default).
- **Light + dark parity is mandatory.** Test both. Use tokens so dark "just works".

## Reuse — DO NOT rebuild these (import from `../components`)
`StatusPill` · `HealthDot` · `CapMeter` · `StrategyBadge` · `WinnerCard` ·
`LaunchCard` · `KpiTile` · `SectionHeader` · `Shelf` · `EmptyState` · `AdvancedDrawer` · `StepNav`.
Shared util: `../lib/format` (currency/number/relative-time), `../lib/strategyPresets`.

## State + data
- Flow state: `useLaunchFlow()` from `../store/launchFlowStore` → `{ state, dispatch, ...helpers }`.
- Variant: `useLaunch2Variant()` → `{ variant, setVariant }` (mission | ops | launchpad).
- Entry overlay: `useLaunch2Overlay()` → `{ open, close }`.
- Mock data: import from `../mocks` (accounts, pages, pixels, winners, launches, drafts, activity, audiences, templates).
- Launch execution: `mockMetaLaunchService` implements `MetaLaunchService` — `validate / dispatch / retryFailed`.

## State coverage (NON-NEGOTIABLE — every screen ships all three)
- **Zero-data / empty** (new user — setup nudges dominate)
- **Partial** (in-flight: launching / partial-fail / restricted)
- **Populated** (the happy steady-state)
Plus loading (skeleton) + error where data is fetched.

## Variants (home only, dev-only toggle — Maalik, hidden from users)
3 home variants differ in **layout/composition**, not primitive styling:
1. **mission** — Mission Control: Studio-style hub, greeting + KPI row + live feed + shelves.
2. **ops** — Ops Console: dense, table-first, `font-g6-mono` accents, integrity counters foregrounded.
3. **launchpad** — fresh bespoke, **editorial-minimal**: calm, generous whitespace, single focal
   `+ New Launch`, named-playbook cards, quiet typography. Restraint is the brief.
Switch: `⌘1/2/3` (bound in Launch2Bridge) or FabAds-logo-style toggle. Persist via `localStorage: launch2-home-variant`.

## Boundaries (do NOT build)
No ban-evasion tooling. Account-Health = legit recovery only (surface reason → fix → clean relaunch).
Meta-only. Not an optimization engine. **Winners shelf shows NO performance metrics** (no ROAS/CTR) —
only proven-badge + last-launched + relaunch-count (ops signal only).
