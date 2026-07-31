# FabAds — Project Operating Principles

> Auto-loaded by Codex when working in this repo. Defines the operating
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

**Future variant idea (deferred)**: a Codex-original variant. To add:
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
3. **This `AGENTS.md`** — operating rule changes if any
4. **Auto-memory** at `~/.Codex/projects/-Users-powerhouse-Documents-Genie-6-0/memory/MEMORY.md`
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
