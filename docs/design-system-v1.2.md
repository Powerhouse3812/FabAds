# Fabfunnel Design System — v1.2 (May 2026)

**Source of truth (code):** `src/index.css` + `src/genie6/styles/tokens.css` + `tailwind.config.ts`.
**Visual reference:** `docs/design-system-v1.2.html` (open in browser).
**Memory:** mirror updates here AND in the `fabfunnel-design-system` Claude skill so the two stay in sync.

This document is the project-local copy of the design-system update spec Maalik pushed in May 2026. It captures the accessibility + visual migration from v1.1 (April 2026) → v1.2.

---

## What changed at a glance (18 highest-impact)

| # | What | v1.1 → v1.2 |
|---|---|---|
| 1 | Primary lime | `#c3eb42` → **`#8FB821`** (May 2026 a11y migration — failed 2.32:1 white-on-lime; new passes 8.07:1 AAA dark-on-lime) |
| 2 | Text on primary | white → `#121212` (Rule R1) |
| 3 | Border colour | `#d9d9d9` cool → `#e7e5dc` warm beige |
| 4 | bg-layout | `#fafafa` → `#f4f4f5` |
| 5 | Button radius (text) | 6px square → **100px pill** |
| 6 | Input radius | 6px → **28px** (rounded-2xl) |
| 7 | Card / Modal radius | 8px → **16px** |
| 8 | Badge / Tag radius | 4px → **100px pill** |
| 9 | All font sizes | base 14px → **base 13px (every size −1px)** |
| 10 | Heading weight | 600 → **700** |
| 11 | Heading font | system sans-serif → **Geist** (Inter banned) |
| 12 | Mono font | system mono → **Geist Mono** |
| 13 | Mono usage scope | code blocks only → numbers, descriptions, info, eyebrows, table headers, tooltips, alerts |
| 14 | Focus halo | 2px blue ring → **4px lime spread** |
| 15 | Modal backdrop | `rgba(0,0,0,0.45)` no blur → **`rgba(0,0,0,0.7) + blur(4px)`** |
| 16 | Hover lift | none → `translateY(-2px) + shadow upgrade` (cards only) |
| 17 | Shimmer cadence | grey, 1.4s → **lime mid-band, 2.4s** |
| 18 | Genie-exclusive patterns | n/a → 15 new patterns (output card, quality chip, pulse ring, glass, glow, hero prompt, etc.) |

---

## Where the values live in code

| Token group | File | Notes |
|---|---|---|
| `--font-sans` / `--font-mono` | `src/index.css` (lines ~60) | Inter removed May 2026; Geist + Geist Mono only |
| Shadcn `--primary` / `--primary-foreground` / `--primary-text` | `src/index.css` (`:root` + `.dark`) | HSL 75 71% 43% light · 75 67% 44% dark |
| Status text variants `--error-text` / `--warning-text` / `--success-text` | `src/index.css` (`:root` + `.dark`) | NEW v1.2 — use for inline text per R2 |
| Genie 6.0 tokens (`--g6-color-*`) | `src/genie6/styles/tokens.css` | Light + dark blocks both migrated to v1.2 lime |

---

## Rules R1–R9 (must read before touching lime / status)

- **R1 · Lime button text** — Primary fills use dark text `#121212`. NEVER white on lime (fails 2.32:1). Dark on lime passes 8.07:1 (AAA).
- **R2 · Status FILL vs TEXT** — `colorError` / `colorWarning` / `colorSuccess` are FILL only. For inline text use `colorErrorText` / `colorWarningText` / `colorSuccessText`. Base status as standalone text on light bg fails AA.
- **R3 · Lime as text or border** — Use `colorPrimaryText` (#5B7611 light / #C3E165 dark), NOT `colorPrimary`. Base lime as text fails 2.22:1.
- **R4 · Border philosophy** — Default `border-primary` is intentionally subtle (~1.4–1.8:1). State communication = label + fill + focus, not border alone.
- **R5 · Surface hierarchy** — Adjacent surfaces in light at 1.04–1.09:1 luminance ratios. Depth = luminance shift, not heavy contrast.
- **R6 · Intentional hex collisions** — Light: `primaryActive` = `primaryText` (#5B7611). Dark: `primaryBorder` = `primaryText` (#C3E165). Different properties on different elements. Documented, not bugs.
- **R7 · Off-white bgBase** — Content uses `#FAFAF7`, never `#ffffff`. Pure white reserved for elevated surfaces (modals).
- **R8 · Bg-spotlight is a light-surface tier** — `#F0F0EC` light / `#1B1B1F` dark. For table headers, wells, alt rows. NOT tooltip overlays — use inline `rgba(15,15,12,0.92)`.
- **R9 · Text-tertiary now passes AA body** — May 2026 bumped 0.45 → 0.55. Usable for body, paragraph, metadata, hints.

---

## Migration order (when applying to new modules)

1. **Foundation tokens** — colours, type, spacing, radius, shadows, motion. Already done at `src/index.css` + `tokens.css`.
2. **Geist + Geist Mono** — loaded via Google Fonts in `src/index.css` line 1. Inter Google Fonts import removed.
3. **Component overrides** — Button pill radius, Input 28px, Card/Modal 16px, Tag pill + Mono, Tabs lime underline, Segmented pill, Table Mono header, Alert text variants, Skeleton lime mid-band.
4. **Genie-exclusive patterns** — 15 new (output card, quality chip, pulse ring, glass, glow halo, hero prompt input, eyebrow, dot-grid, lift, sheen, float, shimmer, fade-up, pop-in, micro-motif icons).
5. **Dark mode** — verify every token has its `[data-theme=dark]` counterpart.
6. **Accessibility verification** — WCAG contrast pass against each surface tier. Flag any base-status text usage (should be `-text` variant per R2). Flag any lime as body text (should be `primaryText` per R3).
7. **Cross-check** — compare shipped app against `docs/design-system-v1.2.html` reference.

---

The full HTML spec lives alongside this file at `docs/design-system-v1.2.html`. Open it in a browser for the complete token tables, component changes, and 15 Genie-exclusive patterns.
