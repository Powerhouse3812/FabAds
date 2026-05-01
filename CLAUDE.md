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

### FabAds shell — 3 nav variants (as of iter-6 A-3, 2026-05-01)

`rail` (default) / `sections` / `focus`. Switched via the single-icon
`NavVariantToggle` in the bottom dock (mirrors dark/light toggle pattern —
one click cycles in order: rail → sections → focus → rail). Hook:
`src/components/sidebar/useFabAdsNavVariant.ts`. All variants share the
MODULES source of truth at `src/components/sidebar/modules.ts`.

| Variant | File | Pattern | Mental model |
|---|---|---|---|
| `rail` | `AppSidebarRail.tsx` | Two-tier (60px icon rail + 200px collapsible sub-panel) | Linear / Mercury — everything one click away |
| `sections` | `AppSidebarSections.tsx` | Sectioned single-pane (240px expanded / 60px collapsed) with RUN/DISCOVER/CREATE/AUTOMATE group labels and inline accordion sub-items | Vercel / Sana / Peec — full hierarchy always visible |
| `focus` | `AppSidebarFocus.tsx` | Drill-in pane (220px). Active module's sub-items foregrounded in a card; other modules demoted to a compact quick-jump strip below | Filing cabinet — open drawer foregrounded, closed drawers listed |

When designing a new shell-level component (anything in the sidebar, header,
or footer dock), test it in **all three** variants before shipping.

- The `sections` variant adds functional group labels (`MODULE_GROUPS` map in
  `modules.ts`) that components must be aware of.
- The `focus` variant treats the active module specially — its sub-items
  render in a foregrounded card. New modules that need always-visible state
  (e.g. badge counts) should expose that state via `ModuleDef` so all three
  variants can render it.

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
- **Hardcoded variant cycle to 2 entries** — the cycle is N-way. Adding a 4th
  variant means adding to `CYCLE_ORDER` in `useFabAdsNavVariant.ts` + a new
  icon + cross-fade slot in `NavVariantToggle.tsx`. Don't shortcut the toggle
  to "rail ↔ X" — it's `rail → sections → focus → ...` by design.
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
