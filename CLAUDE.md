# FabAds — Project Operating Principles

> Auto-loaded by Claude Code when working in this repo. Defines the operating
> rules that supplement the user's global memory and the `fabfunnel-design-system`
> + `ui-ux-pro-max` skills.

---

## Research-first mandate

Before any **non-trivial** UI/feature work — new screens, new components,
redesigns, IA changes — run the **full research loop**.
For **fixes** (bug repairs, copy tweaks, single-line changes), run the
**abbreviated 4-step**.
**No shipping on assumption.**

### Full research loop (new + redesign work)

1. **Inventory existing patterns** — grep the FabAds codebase for similar
   components/utilities. Reuse > rebuild. Cite the file paths found.
2. **External reference scan** — find 3+ products in the same category solving
   the same problem (Mobbin, Pageflows, real product screenshots). Name them
   with one-line takeaway each. Reject anti-pattern matches (§7 of
   `fabfunnel-design-system` skill).
3. **Heuristic + cognitive cross-check** — name the NN/g heuristics (#1–#10)
   and cognitive laws (Hick's, Fitts's, Recognition over Recall, Miller's 7±2)
   that apply.
4. **Use-case enumeration** — list 3–6 concrete user journeys, not abstractions.
   Use real personas (Solo creator, Agency lead, Performance marketer, Brand
   manager).
5. **Edge-case enumeration** — minimum coverage:
   - Long names (60+ chars), 0 / 1 / 1000+ items
   - Slow network, offline, partial data, validation errors, permission denied
   - Mobile/narrow viewport, RTL/long-language, dark + light parity
   - Keyboard-only, screen-reader, color-blind safe
6. **Stress test** — what breaks at 10× expected scale? (10K rows, 50K outputs,
   100 brands).
7. **Q&A round with Maalik** — surface ambiguities. Don't assume IA, naming, or
   persona priority.
8. **Heuristic checklist** (§10 of `fabfunnel-design-system` skill) — before any
   "ready" call.
9. **State coverage** (§3 of design system) — populated / partial / zero-data,
   all three present.
10. **Only then write code.**

### Abbreviated loop (fixes only)

1. Inventory existing patterns (step 1 above)
2. Heuristic + cognitive cross-check (step 3 above)
3. Edge cases for the surface being changed (step 5, scoped)
4. State coverage check (step 9 above)

### Skip the loop entirely for

- Typo fixes
- Single-line bug repairs
- Direct copy edits with no IA implication

---

## Orchestration mandate — fan out wide, monitor always, tier models

**Standing rule (Maalik):** Use as many agents as possible for **every** task — fast,
parallel, no quality loss. Keep **one agent always monitoring** the fleet + the
changes. Pick models per task.

- **Fan out by default.** Split any non-trivial task into the maximum number of
  independent units and run them as parallel agents. One agent per **target file**
  (avoids merge conflicts). Cross-file wiring that imports from a new file → do it
  sequentially after the parallel workers finish.
- **Always end with a monitor/reviewer agent — FINAL GATE only** (not concurrent).
  Workers all finish, then one dedicated agent does a single adversarial review
  pass: runs `tsc`/build, checks design-system + NN/g compliance, hunts
  regressions, confirms each worker actually completed its slice. The batch is not
  "done" until the monitor signs off. Adversarial verification, not a rubber stamp.
  For large orchestration use the Workflow tool (parallel/pipeline workers + a
  final verify stage = workers + monitor).
- **Model tiering:**
  - **Opus** — hard reasoning, architecture/design thinking, tricky debugging, the
    monitor/reviewer role. Bring an Opus agent in whenever real thinking is needed.
  - **Sonnet** — default for normal build/edit/research work.
  - **Haiku** — minor/basic mechanical tasks (simple edits, data swaps, single-file
    find-replace, label/format changes).
  - Pass the model via Agent `model` / Workflow `opts.model`. Decide per task.
- **Exception:** trivial one-liners don't need a fleet — but still get a quick
  monitor pass before commit.

---

## Operating reminders

- **Address Maalik as "Maalik"**. Open or close with "Ji Maalik" when natural.
- **Concise, direct, slightly informal.** No flattery. No blind agreement.
  Analysis before agreement. Weak proposals get honest critique with reasons.
- **Prefer mockup-style visual responses** over text walls (per
  `ui-ux-pro-max` skill rule 6).
- **Quote design tokens by name**, never raw values. The token catalogue is in
  the `fabfunnel-design-system` skill.
- **Hindi/English mixing welcome** when natural. Match the user's register.
- **Never include code examples in design responses** unless explicitly
  requested.
- **State coverage is non-negotiable** — populated, partial, zero-data on
  every new screen.

---

## Multi-variant precedent

This project ships multiple visual variants for two surfaces. New components
must work in **both shell variants**, not just whichever is convenient.

### Genie 6 — 4 internal variants

`Studio` / `Canvas` / `Command` / `Modular`. Switched via the variant pill
inside the Genie sub-panel. Each variant is a **complete UI architecture
fork**, not a token swap. Hook: `src/genie6/hooks/useGenie6Theme.ts`.

### FabAds shell — nav with 6 STRUCTURALLY DISTINCT variants (as of iter-6 A-9, 2026-05-01)

The nav is a **single component** (`src/components/AppSidebar.tsx`) that
renders in **6 structurally distinct variants**. Variants are a **dev tool
for Maalik** — hidden from end users, toggled by FabAds-logo click
(Shift+Click for picker).

**The variants differ in shape, chrome, and visual hierarchy — not just paint.**
Token bag carries `shape` (flush/floating/cards) + chrome flags
(`showChevrons`, `showSubItemDots`, `showActiveBar`, `showModuleIcons`) +
shell-feature flags (`internalOrbs`, `glassOverlay`, `profileBlock`,
`brandsStrip`, `ctaCard`).

| # | Key | Distinction |
|---|---|---|
| 1 | `sections` | **Classic flush panel** (240px). Lime accent. Full chrome (chevrons + dots + left-bar). Linear/Vercel pattern. |
| 2 | `darkAlways` | **Always-dark monochromatic** (no lime!) **+ stripped chrome**. Industry Insights moves to a separate **EXTENSIONS** group at the bottom (lock-icon decoration). Editorial / serious-tool feel. |
| 3 | `glass` | **Detached floating panel** (`m-2` margin + `rounded-2xl` + soft shadow). Apple liquid-glass — internal gradient orbs (z:0) + backdrop-blur plate (z:1) inside the aside. Auto-theme. Subtle. |
| 4 | `workbench` | **Discrete cards per group**. Each group renders as its own `rounded-lg` card with gap between them. Notion-blocks pattern. |
| 5 | `glassDark` | **NEW**. Deep navy gradient glass with profile block at top + brands strip + bottom CTA card. Cinematic. Always-dark. |
| 6 | `glassLight` | **NEW**. Soft warm-pink frosty glass with profile block + brands strip + bottom CTA card. Always-light. |

**EXTENSIONS group** is V2-only (`MODULE_GROUPS_V2_DARKALWAYS` + `GROUP_ORDER_V2_DARKALWAYS` in `modules.ts`). Industry Insights moves out of RUN into EXTENSIONS only when the active variant is darkAlways. `MODULE_EXTENSION_KEYS` decides which modules render with the lock-icon decoration.

**Internal orbs architecture** (V3/V5/V6): orbs at `z:0` inside the aside (clipped by `overflow-hidden`), backdrop-blur plate at `z:1`, content at `z:10`. The blur captures the orbs because they sit below in stacking order, producing real glass smear without the bleed-as-shadow artifact that the previous body::before approach caused.

**Genie sub-nav** (iter-6 A-9): Overview / Generations / Assets / Studio / Settings. The lime `[+ New Generation]` CTA is **gone** from the sub-nav — the new "Studio" sub-item (`/iq/genie6/generate`) is the new-gen entry-point. Genie's variant icon-toggle (Studio/Canvas/Command/Modular pill) stays inline next to the "Genie" label.

**Launch sub-nav**: Launches · Targeting Template · AutoPilot · Clones · Launch Settings · RRM (6 items).

Hook: `src/components/sidebar/useFabAdsNavVariant.ts`. Persists via
localStorage key `fabads-nav-variant`. Default: `"sections"`.

**Variant indicator**: a small lime numeric badge in the top-right corner of
the FabAds logo (notification-style) shows which variant is live (1/2/3).

**Pattern (all variants share)**: sectioned single-pane (240px expanded /
60px collapsed) with group labels (RUN / CREATE / TOOLS) and inline
accordion sub-items. Cmd+B toggles collapsed state (persisted via
`fabads-nav-collapsed`).

**Cmd+K command palette**: global keyboard-driven nav surface. Mounted by
`AppLayout`. Reachable from the inline "Search · ⌘K" field at the top of
the sidebar body. Implementation: `src/components/sidebar/CommandPalette.tsx`.
v1 lists every module + sub-item path; future scope: brands, generations,
recent paths, AI actions.

**Genie variant theming**: on `/iq/genie6/*`, all variants use g6 tokens
(`bg-g6-bg-container`, `text-g6-text`). The active Genie variant cascades
via `data-genie6-variant` on `<html>`. Genie variant toggle now lives as a
**small icon next to the "Genie" label** (not as a pill in sub-menu) —
click cycles studio → canvas → command → modular. Each variant has a
distinct lucide icon (Sparkles / Maximize2 / Terminal / Grid3x3) that
cross-fades on switch.

**IA (locked iter-6 A-5)**:
```
RUN     Dashboard, Reports, Industry Insights, Launch, Automation
CREATE  Genie, Catalogue, Creative Library
TOOLS   Video Sage, Copilot, BG Remover (Soon), Object Remover (Soon)
```
TOOLS entries are independent top-level modules (NOT children of a "Tools"
parent). They share the TOOLS group label but no other visual grouping —
no shared border, left rail, or bracket. If new shared visual decoration is
added for accordion sub-items, gate it behind `hasSubItems(mod)` so it
doesn't accidentally apply to TOOLS rows.

**Future variant idea (deferred)**: a Claude-original variant. To add:
extend `VARIANT_CYCLE` in the hook, add token branch in `getTokens()`,
update `VARIANT_META` for the picker.

---

## Path conventions for the FabAds repo

- `src/components/sidebar/*` — all sidebar variants + hooks + shared MODULES
- `src/components/AppSidebar.tsx` — variant router (thin)
- `src/genie6/*` — Genie 6.0 module (variant shell, hooks, mocks, modes, components)
- `src/genie6/variants/{studio,canvas,command,modular}/*` — per-variant pages
- `src/catalogue/*` — Catalogue module (Brands / Categories / Products)
- `src/components/ui/*` — shadcn primitives. Do not modify these directly;
  wrap in Fabfunnel-styled components (per design system §4.1).
- `src/pages/*` — top-level routed pages (Dashboard, Reports, etc.)

---

## Sync discipline

When a change ships, propagate it across:

1. **Code** — the change itself
2. **Design system skill** — token / pattern / anti-pattern updates if any
3. **This `CLAUDE.md`** — operating rule changes if any
4. **Auto-memory** at `~/.claude/projects/-Users-powerhouse-Documents-Genie-6-0/memory/MEMORY.md`
5. **Git commit message** — describes the iter+batch (e.g. "Genie 6 iter-6 A-2: …")

Daily check-in window: 5–6 PM IST.

---

## Anti-patterns specific to this repo

Do not regress on any of these. They have been deliberately dropped:

- **Standalone dark/light toggle in the sidebar** — removed in iter-6 A-2.
  The toggle lives in UserMenu only. Don't re-add it.
- **Multi-variant nav as a user-facing setting** — explored in A-2/A-3,
  retired. As of A-5 the variant cycler is back, but **as a dev tool only**
  (Maalik-only, hidden from users — toggled via FabAds logo click). Don't
  surface variant choice in UserMenu or anywhere user-discoverable.
- **Putting Tools as a parent module with sub-items** — flattened in A-4.
  Each tool (Video Sage / Copilot / BG Remover / Object Remover) is its own
  top-level module under the TOOLS group label. Don't re-nest them.
- **Lonely groups** (a group label with only one module) — explored DISCOVER
  in A-2 (Industry Insights alone), reads as a layout glitch. Fold a single-
  module group into a neighbour or kill the group label.
- **Mismatched nav vs content bg** — fixed in A-4. Both use `bg-background`
  (or g6 tokens on Genie routes). Don't reintroduce a separate
  `bg-sidebar-background` token.
- **Tour as a sub-nav item under Genie** — removed in iter-6 A-1.
  Tour CTA lives on each variant's Overview/Home page only.
- **IQ module group in the sidebar** — removed in iter-6 A-1.
  Genie 2/3/4/5 routes are kept for old bookmarks; no nav surface.
- **Activity Log as a top-level nav item** — removed in iter-6 A-1.
  Activity lives in NotificationBell + per-entity detail pages.
- **Standalone RRM module** — moved under Launch in iter-6 A-1.
  `/rrm` route still works.
- **Sub-menus in UserMenu** — flattened in iter-6 A-1. All items are
  flat `DropdownMenuItem` with `DropdownMenuSeparator` only.

---

## Genie 2.0 (Sep 2026) — read before touching Genie

Genie stopped being a place you *go to* and became a place other modules
*feed into*. Spec: `~/Downloads/genie-2.0-planning-handoff.md` (locked, reviewed).
Sub-nav IA is **locked**: Overview · Studio · **Other Flows** · **Other Apps** ·
Concepts · Library · Settings.

### The three structural changes
1. **Other Flows** (`src/genie6/flows/`) — 11 source modules (7 live) hand work
   into Studio. **The flow context lives in three URL params — `?src` / `?ref` /
   `?act`** — not a store, because §6 Rule 5 requires the banner to survive every
   step *and* a refresh *and* a shared link. Everything else (labels, thumbnails,
   produced-output copy) is DERIVED from `flows/data/flowRegistry.ts`, so copy can
   never drift from data. `resolveFlowContext(sp)` returns null for an unknown
   ref, degrading to plain Studio — never throw on a hand-edited URL.
2. **Other Apps** (`src/genie6/apps/`) — 15 apps, 7 live, **declarative**: one
   screen anatomy in `AppRunner`, each app a registry entry in
   `apps/data/appRegistry.ts`. A new app is data, not a file.
3. **Two predictable homes** — Catalogue holds every INPUT (14 asset types,
   two groups), Library holds every OUTPUT under one Batch ID.

### Invariants — do not regress these
- **§7.2 the competitor rule.** Industry Insights ads belong to a COMPETITOR.
  The Step-2 picker must highlight the user's OWN default brand
  (`DEFAULT_BRAND_ID`), never the source's. `ctx.highlight` is the ONLY source
  for what gets highlighted; **`ctx.ref.sourceBrandName` must never set an
  entity id** — it is display text only. Getting this wrong tells the user to
  make an ad for a rival.
- **Highlighted ≠ selected** (§6 Rule 4). The suggested entity is a band pinned
  above the picker with a "Use this" button and nothing written to state.
  Only Campaign URLs pre-selects — the single documented exception.
- **Rule 1 / Rule 2.** A variation asks nothing → lands on Configure. A "use X"
  always asks who it's for → lands on Step 2, *even when the source already
  carries the entity*.
- **ONE progress + failure pattern** (`src/genie6/progress/`, §18): stage-wise
  with an *updating* estimate, never a fixed countdown; a failure STAYS in the
  list with a Retry that states its credit cost, never a toast. Studio, Flows
  and Apps all import these components — two systems must not exist.
- **ONE run store** (`src/genie6/lib/genieRunStore.ts`). Batch ID = Job ID.
  Per-app history is `useRunsForApp()`, a VIEW, never a second array. Seeded by
  consuming `sample-outputs.ts` — never fork or mutate that array, 15+ importers
  depend on its reference. `RunItem.outputId` is the join key back to the rich
  `OutputData`.
- **ONE credit formula** (`src/genie6/lib/credits.ts`). `computeBreakdown()` is
  the only path to a charged total, so Configure and Results cannot disagree —
  that divergence (4 vs 24 credits) is the defect §21.2 exists to fix. Always
  show the multipliers, not just a number.
- **Never hardcode an output count** (§5). The stepper owns `count`, including
  from entry points that name a number ("Make 10 more").
- **Approaches filter by format, they are not deleted.** All 7 stay in
  `Step3Approach`; `APPROACHES_BY_FORMAT` decides what's offerable. §8's
  "BG Remover / Resize / Create Variations / Image to Video are apps" governs
  the *app registry*, not this step — none of those four is among the locked 15
  apps, so deleting them leaves the capability nowhere.
- **Two concept id universes exist.** Studio's `c-*`
  (`studio-v4/data/concepts.ts`) and the shared `concept-*` / `kc-*`.
  `getConceptById` bridges them; `?concepts=` carries either. Don't duplicate
  the shared set into Studio.
- **Dark mode and mobile are explicit NON-GOALS** for this release (§21.2).
  New Genie routes are unlisted in `mobileRoutePolicy.ts`, so they fail closed
  to `BestOnDesktop` — that is correct, not a bug.

### Deliberately open (§22) — don't "fix" these by guessing
Empty/failed-state screens (deferred last by instruction) · Mode list vs ad
types · Storyboard for Image: one carousel or N ads · Client management · and
five backend questions for Pranav, of which two shape real code: can the
pipeline return per-section time ranges and regenerate ONE section (gates the
editor being edit-and-see vs queue-and-notify), and what failure reasons does
generation actually return (gates the failure matrix).

### Known accepted duplication
Two asset cards to the §21.2 grammar: `src/catalogue/AssetCard.tsx` (CRUD grid)
and `src/genie6/brain/AssetCard.tsx` (read-mostly browsing). Different use
cases; left as-is on purpose. Don't "discover" it as a bug.

### Pre-existing drift, out of this release's scope
Raw `amber-*` Tailwind classes survive in ~14 older `genie6` files
(`generate-new/*`, `generate-v3/*`, `Step1Setup`, `data/modes.ts`,
`AnglePlaybookPanel`). New surfaces use the `warning-text` token. Converting the
rest is its own cleanup.

---

## Mobile shell (FB-7109) — read before touching the shell

The app rendered **nothing** below 768px until this work: `AppShell` and
`ParentNavigationRail` were `hidden md:flex`. Mobile is now an **opt-in
allowlist**, not a general responsive pass.

- **Policy**: `src/components/shell/mobileRoutePolicy.ts`. First match wins **in
  declaration order** (that's how an exact rule beats its own `/*` sibling), and
  `CATCH_ALL` **fails closed** — an unlisted route is blocked, never shipped
  broken. Do not casually reorder that array.
- **INV-1 — one `<Outlet/>`, ever.** Never
  `isMobile ? <MobileShell> : <AppShell>`; that remounts every page on a 768px
  crossing and destroys the Insights feed's accumulated scroll state. Layout is
  Tailwind-responsive on the single existing shell.
- **INV-2 — the JS breakpoint equals Tailwind `md` (768).** No custom screens.
  If the CSS gate and `useIsMobile` ever disagree there's a viewport band that
  paints mobile chrome while the gate thinks desktop.
- **JS branching is allowed at exactly three leaves**: `MobileRouteGate` (a
  blocked page must not *mount* — `display:none` still runs data hooks and
  measures 0×0), `NotificationBell` (Popover→Sheet), `CopilotPanel`
  (forceOverlay). Everything else is pure Tailwind.
- **Desktop-regression rule**: you may *add* base and `md:`-prefixed utilities.
  Never remove or alter a utility that already applies at ≥768px.
- Surfaces read capability from `useMobileCapability()` /
  `useIsReadOnly()` — never re-derive from `pathname`.
- Blocked routes render `BestOnDesktop` (generalized from the old
  `LaunchV2Layout` card) and **keep their URL** — the copy-link flow depends on
  it. Never redirect.
- Blocked modules stay **visible but dimmed with a "Desktop" chip** in the More
  sheet; hiding 80% of the product reads as broken.

### TYPECHECK GOTCHA
Root `tsconfig.json` has `"files": []` and only project references, so
**`npx tsc --noEmit` checks nothing and always exits 0.** Always use:
`npx tsc --noEmit -p tsconfig.app.json`. Note `strict`, `strictNullChecks` and
`noImplicitAny` are all **off** — types are a weak net here; verify in the
browser.

### Ad-entity writes
`src/lib/ad-entity-write-store.ts` is the single optimistic store for
status/budget/duplicate, shared by the mobile list and the desktop table (it
replaced ~8 `toast.success` buttons that changed nothing). In-memory, resets on
reload, disclosed in the UI. Duplicate **fabricates** a Paused zero-metric row
pinned under its source. Confirmation policy: friction where money *starts*
flowing — pause = undo toast only, Activate/Archive/bulk = confirm, budget = the
Save button *is* the confirm.

**Reports has its own 5-account universe** (`reports-dummy-data.ts`), disjoint
from Launch's 7 (`launchv2/data.ts`). Never cross them.

### Mobile tabs + the two new-user flows (2026-08-11)

Tab bar is **Home · Insights · Reports · Genie · More**. Genie took Launch's
slot; Launch is still reachable from More as the read-only Hub.

Genie's mobile allowlist is exactly three surfaces — `/iq/genie6` (Studio home
variant, made responsive), `/iq/genie6/library/*`, `/iq/genie6/studio-alpha/*`
(5-step wizard, one screen per step, context rail → bottom sheet). Everything
else under `/iq/genie6` stays gated.

Two **separate** menu-launched new-user flows, deliberately not merged:
- `src/mobile-onboarding/` — Flow A "Set up my feed & Genie". Welcome (no
  payment-status variants) → Product Chooser → Genie 0–4 *or* the Insights
  3-tab picker as a stepper. **PERSISTS NOTHING** — read-only seed of existing
  preferences for "Replay", empty for "Start fresh". Don't wire persistence in.
- `src/mobile-tour/` — Flow B "Mobile tour". 3 welcome screens + a 4-item
  checklist. Checklist progress DOES persist (`fabads.mobileTour.v1`); ticking
  is manual by design (the only cheap completion signal is "count > 0", already
  true for existing users). Screen 2's desktop-only examples resolve through
  `resolveMobilePolicy` at module load, so the copy can't drift from the policy.

Both are mounted in `MobileTabBar`, NOT in `MobileNavContent` — that component
unmounts with the sheet, so a flow mounted there dies the moment the menu
closes.

**Constants that other modules read must not live in a component file.**
`MOBILE_HOME_PATH` moved to `shell/mobileNavConstants.ts` after
`MobileTabBar → mobile-tour → tourContent → MobileTabBar` produced a TDZ
`ReferenceError` that blanked the app. It type-checked fine; only running it
failed.
