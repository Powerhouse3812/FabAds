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

### FabAds shell — single sectioned nav (as of iter-6 A-4, 2026-05-01)

After A-2/A-3 explored 3 variants, Maalik picked the **Sections** variant as
the canonical shell. Rail and Focus were deleted; the variant toggle is gone.
The sole nav lives in `src/components/AppSidebar.tsx`. Mobile sheet content is
extracted to `src/components/sidebar/MobileNavContent.tsx` (variant-agnostic).
Module config + helpers shared at `src/components/sidebar/modules.ts`.

**Pattern**: sectioned single-pane (240px expanded / 60px collapsed) with
group labels (RUN / CREATE / AUTOMATE / TOOLS) and inline accordion sub-items.
Cmd+B toggles the collapsed state (state persisted via localStorage key
`fabads-nav-collapsed`).

**BG matching**: nav uses `bg-background` (= content bg) — the only visual
separator is the thin `border-r border-border`. No more sidebar-vs-content
bg mismatch.

**Genie variant theming**: when on `/iq/genie6/*`, the nav swaps to g6 tokens
(`bg-g6-bg-container`, `text-g6-text`, etc.). The active Genie variant
(`data-genie6-variant` on `<html>`) cascades through these tokens
automatically — Studio / Canvas / Command / Modular each give the nav a
slightly different visual character without per-variant code.

**Genie variant pill** lives inline under [+ New Generation] when the Genie
group is expanded. Switching Genie variants from there re-renders the nav
with the new variant's surface treatment.

**Future variant idea (deferred)**: dark-always nav — sidebar stays dark
even when shell theme is light. To add later, branch on a new mode setting
inside `getTokens()` and surface the toggle as a UserMenu entry, not a dock
icon. Don't reintroduce the in-dock variant cycle — that pattern is
intentionally retired.

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
- **Reintroducing the multi-variant nav toggle** — explored in A-2/A-3, retired
  in A-4. If you need a new nav variant, branch on a setting inside
  `getTokens()` in `AppSidebar.tsx` (or fork the file if structurally
  different) and surface the toggle in UserMenu — not as an icon in the
  bottom dock.
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
