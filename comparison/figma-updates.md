# Figma Design System — Update list

Sync the **"Design System - FF"** Figma file to the Genie 6.0 design language. Apply these as **Figma Variables** + **Component updates** so every linked frame across Catalogue / Industry Insights / Onboarding / Brand Book / Genie / Video Sage / AI bot / Ad-board pages auto-updates.

**Source of truth:** `src/genie6/styles/tokens.css` + `tailwind.config.ts` in the FabAds Claude sandbox.

**Visual reference:** open `design-system-comparison.html` in this folder for a side-by-side render of every component.

---

## A. Variables (Foundation collection)

### A.1 Brand colours

| Variable | New value | Use |
|---|---|---|
| `brand/primary` | `#c3eb42` | Primary CTA, focus rings, active states |
| `brand/primary-hover` | `#d4f267` | Hover |
| `brand/primary-active` | `#9cc42d` | Pressed |
| `brand/primary-bg` | `#f9ffe2` | Tinted surface bg (light) |
| `brand/primary-bg-hover` | `#f3ffce` | Tinted hover (light) |
| `brand/primary-border` | `#e6f4a3` | Tinted border (light) |
| `brand/primary-on` | `#121212` | **Text ON lime fill — NOT white** (contrast call) |
| `brand/primary-dark/bg` | `#232915` | Dark-mode lime tint bg |
| `brand/primary-dark/bg-hover` | `#36401a` | Dark-mode lime tint hover |
| `brand/primary-dark/border` | `#495522` | Dark-mode lime tint border |

### A.2 Surfaces — light

| Variable | New value |
|---|---|
| `surface/bg-base` | `#fbfbf9` |
| `surface/bg-container` | `#ffffff` |
| `surface/bg-elevated` | `#ffffff` |
| `surface/bg-spotlight` | `#f4f4f0` |
| `surface/bg-muted` | `#f7f7f4` |

### A.3 Surfaces — dark

| Variable | New value |
|---|---|
| `surface/dark/bg-base` | `#0d0d0d` |
| `surface/dark/bg-container` | `#161616` |
| `surface/dark/bg-elevated` | `#1e1e1e` |
| `surface/dark/bg-spotlight` | `#2a2a2a` |
| `surface/dark/bg-muted` | `#1a1a1a` |

### A.4 Text — uses alpha-channel (warm)

| Variable | Light | Dark |
|---|---|---|
| `text/primary` | `rgba(15,15,12,0.92)` | `rgba(255,255,255,0.92)` |
| `text/secondary` | `rgba(15,15,12,0.62)` | `rgba(255,255,255,0.62)` |
| `text/tertiary` | `rgba(15,15,12,0.42)` | `rgba(255,255,255,0.42)` |
| `text/disabled` | `rgba(15,15,12,0.22)` | `rgba(255,255,255,0.22)` |
| `text/on-accent` | `#121212` | `#121212` |

### A.5 Borders

| Variable | Light | Dark |
|---|---|---|
| `border/primary` | `#e7e5dc` | `#2a2a2a` |
| `border/secondary` | `#efeee7` | `#1f1f1f` |

### A.6 Status colours

| Variable | Light | Dark |
|---|---|---|
| `status/success` | `#52c41a` | `#49aa19` |
| `status/warning` | `#faad14` | `#d89614` |
| `status/error` | `#ff4d4f` | `#dc4446` |
| `status/info` | `#1677ff` | `#1677ff` |

### A.7 Typography — replace Inter with Geist

| Variable | New value |
|---|---|
| `font/family/sans` | `Geist` |
| `font/family/mono` | `Geist Mono` |
| `font/size/xs` | `11px` |
| `font/size/sm` | `12px` |
| `font/size/base` | `14px` |
| `font/size/lg` | `16px` |
| `font/size/xl` | `20px` |
| `font/size/h5` | `16px` |
| `font/size/h4` | `20px` |
| `font/size/h3` | `24px` |
| `font/size/h2` | `30px` |
| `font/size/h1` | `38px` |
| `font/size/display` | `56px` |
| `font/size/display-lg` | `72px` |
| `font/lineheight/xs` | `16px` |
| `font/lineheight/sm` | `20px` |
| `font/lineheight/base` | `22px` |
| `font/lineheight/lg` | `24px` |
| `font/lineheight/xl` | `28px` |
| `font/lineheight/h3` | `32px` |
| `font/lineheight/h2` | `38px` |
| `font/lineheight/h1` | `46px` |
| `font/lineheight/display` | `60px` |
| `font/weight/heading` | `700` (was 600) |
| `font/tracking/display` | `-0.01em` |

**Add an Eyebrow text style:** `Geist Mono · 11px · uppercase · letter-spacing 0.05em · weight 600 · colour text/tertiary`.

### A.8 Spacing (4pt scale)

| Variable | Value |
|---|---|
| `space/1` | `4px` |
| `space/2` | `8px` |
| `space/3` | `12px` |
| `space/4` | `16px` |
| `space/5` | `20px` |
| `space/6` | `24px` |
| `space/8` | `32px` |
| `space/10` | `40px` |
| `space/12` | `48px` |
| `space/16` | `64px` |
| `space/20` | `80px` |

### A.9 Border radius — expand scale

| Variable | Value | Use |
|---|---|---|
| `radius/xs` | `2px` | Micro tags |
| `radius/sm` | `4px` | Smallest |
| `radius/base` | `6px` | Default — buttons, small surfaces |
| `radius/lg` | `8px` | Sub-cards |
| `radius/card` | `16px` | **Cards, modals — was 8px** |
| `radius/xl` | `20px` | Output / elevated cards |
| `radius/2xl` | `28px` | **Inputs — much rounder than typical 6px** |
| `radius/pill` | `100px` | Pills, badges, segmented controls |

### A.10 Shadows — compose as Figma drop-shadow effects

| Variable | Composition |
|---|---|
| `shadow/sm` (light) | y=1 blur=2 spread=0 rgba(15,15,12,0.04) |
| `shadow/md` (light) | y=1 blur=3 + y=8 blur=24 rgba(15,15,12,0.04 + 0.06) — stacked |
| `shadow/lg` (light) | y=2 blur=4 + y=12 blur=40 rgba(15,15,12,0.04 + 0.08) |
| `shadow/xl` (light) | y=4 blur=8 + y=24 blur=64 rgba(15,15,12,0.04 + 0.10) |
| `shadow/primary-btn` | y=1 blur=2 rgba(0,0,0,0.04) + 0 spread 4 rgba(195,235,66,0.22) |
| `shadow/input-active` | 0 spread 4 rgba(195,235,66,0.18) — lime focus halo |
| `shadow/glow` | 0 spread 1 rgba(195,235,66,0.4) + 0 blur 24 rgba(195,235,66,0.18) |
| `shadow/sm` (dark) | y=1 blur=2 rgba(0,0,0,0.4) |
| `shadow/md` (dark) | y=1 blur=3 + y=8 blur=24 rgba(0,0,0,0.5 + 0.4) |
| `shadow/lg` (dark) | y=2 blur=4 + y=12 blur=40 rgba(0,0,0,0.5 + 0.5) |
| `shadow/glow` (dark) | 0 spread 1 rgba(195,235,66,0.5) + 0 blur 32 rgba(195,235,66,0.25) |

### A.11 Heights (interactive elements)

| Variable | Value | Use |
|---|---|---|
| `height/xs` | `16px` | Micro elements |
| `height/sm` | `24px` | Compact rows |
| `height/base` | `32px` | Buttons, badges (default) |
| `height/lg` | `40px` | Inputs, prominent CTAs |
| `height/xl` | `52px` | Hero CTA |

### A.12 Motion — Smart Animate presets / labels

| Token | Value |
|---|---|
| `duration/fast` | `200ms` |
| `duration/base` | `300ms` |
| `duration/slow` | `500ms` |
| `duration/slower` | `700ms` |
| `duration/lift` | `220ms` |
| `duration/pop-in` | `320ms` |
| `easing/standard` | `cubic-bezier(0.32, 0.72, 0, 1)` |
| `easing/pop` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `easing/pulse` | `cubic-bezier(0.4, 0, 0.6, 1)` |

---

## B. Components — what to update on each DS component frame

### B.1 Button

- **Variants**: primary · default · outline · ghost · link · destructive (drop "dashed" as a separate variant if it exists — fold into a property of default).
- **Sizes**: sm (h 28 · px 12) · default (h 32 · px 12) · lg (h 40 · px 16) · icon (32×32).
- **Radius**: `radius/base` (6px).
- **Primary fill**: `brand/primary`. Text: `brand/primary-on` (#121212). DO NOT use white text on lime — too low contrast.
- **Primary hover shadow**: `shadow/primary-btn` (lime ring).
- **Outline border**: `border/primary`.
- **Font**: Geist · 14px · weight **500** (was 400).
- **Icon gap**: 8px.
- **Disabled**: opacity 0.5, pointer-events none.

### B.2 Card

- **Standard card**: radius `radius/card` (**16px — was 8px**), border `border/secondary`, bg `surface/bg-container`, padding 20px.
- **Elevated / hoverable variant**: same + `shadow/sm` base. Hover state → `shadow/lg` + translate-y(-2px) over 220ms (motion/lift preset).
- **Output card** (Genie generation card — Genie-exclusive): radius `radius/xl` (20px), aspect-ratio 4:5 thumbnail at `surface/bg-spotlight`, body padding 12px.

### B.3 Input

- **Radius**: `radius/2xl` (**28px — was 6px**). This is the most distinguishing change.
- **Height**: 40px (default) / 32px (compact).
- **Border**: `border/secondary` default → `brand/primary-border` focus.
- **Focus shadow**: `shadow/input-active` (lime spread-4 halo).
- **Padding**: 14px horizontal, 8px vertical.
- **Font**: Geist · 14px.
- **Placeholder colour**: `text/tertiary`.

### B.4 Select / Dropdown

- Trigger matches Input (radius `radius/2xl`).
- Option list container: radius `radius/lg` (8px), `shadow/md`.
- Active option: bg `brand/primary-bg` (#f9ffe2), text `brand/primary-on`, weight 600. **NOT** blue tint.

### B.5 Textarea

- Same as Input (radius 28px, lime focus halo).
- Genie's **hero-prompt** variant adds:
  - Radial-gradient backdrop on focus: `radial-gradient(ellipse, rgba(195,235,66,0.25) 0%, rgba(195,235,66,0.08) 35%, transparent 65%)` filtered with `blur(28px)`.
  - Outer `shadow/glow` on focus.
  - Suggestion pill row below the textarea (each pill: `radius/pill`, bg `surface/bg-spotlight` → `brand/primary-bg` on hover).

### B.6 Checkbox · Radio · Switch

- **Checkbox**: 16×16, border-width **1.5px** (was 1px), checked state bg `brand/primary` + text `brand/primary-on`.
- **Radio**: same dimensions; inner dot uses `brand/primary`.
- **Switch**: width 44px, height 24px (was 22px), bg `surface/bg-spotlight` (off) → `brand/primary` (on). Knob 18×18 white, shadow `0 2px 4px rgba(15,15,12,0.16)`. Border-radius pill (100px).

### B.7 Modal / Dialog

- **Container**: radius `radius/card` (**16px — was 8px**), shadow `shadow/xl`, border `border/secondary`. Max-widths: 480px sm · 720px md · 960px lg.
- **Header**: padding 24px (no bottom border).
- **Title**: 18px weight 600 (was 16px).
- **Body**: padding 16px 24px 24px.
- **Footer**: padding 16px 24px, bg `surface/bg-base`, top border `border/secondary`. Right-aligned action row.
- **Backdrop**: `rgba(0,0,0,0.7)` + `backdrop-filter: blur(4px)`. Was `rgba(0,0,0,0.45)` plain.

### B.8 Drawer / Sheet

- Side panel — 400px default width (was 360px).
- Inner-edge radius `radius/card` (16px) — outer edge flush with viewport.
- Border `border/secondary` on inner edge.
- Shadow `shadow/lg` (compound).
- Header padding 20px 24px, body padding 24px.

### B.9 Tag · Badge · Pill

- **Radius**: `radius/pill` (100px). (Was 4px.)
- **Height**: 20px (sm) / 22-24px (default).
- **Padding**: 10px horizontal.
- **Font**: Geist Mono · 11px · weight 600 · uppercase · letter-spacing 0.06em.
- **Status variants** — bg at status colour 10% alpha, text at status colour full alpha, border at 30% alpha.
- **Count badge**: pill-shaped, mono weight 700 white-on-error.

### B.10 Tabs

- Active underline: `brand/primary` (lime), 2px thickness, 1px border-radius for soft edge.
- Active text: weight 600 (was 400), colour `text/primary`.
- Inactive text: `text/secondary`, weight 500.
- Tab gap: 24px (was 32px — tighter).

### B.11 Segmented control

- **Container radius**: `radius/pill` (100px — was `radius/base` 6px).
- **Container bg**: `surface/bg-spotlight`.
- **Active segment**: bg `brand/primary-bg` (#f9ffe2), text `brand/primary-on`, weight 600.
- **Inactive segment**: text `text/secondary`, weight 500.

### B.12 Table

- **Wrapping radius**: `radius/card` (16px — was 8px).
- **Header bg**: `surface/bg-spotlight` (warm) — NOT neutral grey.
- **Header text**: Geist Mono · **11px** uppercase letter-spacing 0.08em · weight 600 · colour `text/secondary`. (Was Geist Sans 14px regular.)
- **Header padding**: 12px (was 16px).
- **Row padding**: 14px (was 16px).
- **Row hover bg**: `surface/bg-muted`.

### B.13 Empty state

- **Motif image slot**: 64×64 rounded square (`radius/card`), bg `brand/primary-bg`, border `brand/primary-border`. Hosts a lime SVG icon. (Was Ant's generic line drawing.)
- **Title**: 16px weight 700 colour `text/primary`. (Was small grey-only.)
- **Description**: 13px colour `text/secondary`.
- **Optional CTA row**: 16px gap below description.
- **Optional bg**: `DotGridPattern` (32px grid lines at 4% opacity).

### B.14 Tooltip · Popover

- **Tooltip**: bg `rgba(15,15,12,0.92)` (was 0.85), radius `radius/base` (6px), font 11px (was 14px).
- **Popover**: bg `surface/bg-container`, border `border/secondary`, radius `radius/lg` (8px), shadow `shadow/md`. Title 14px weight 600, body 13px colour `text/secondary`.

### B.15 Alert · Status banner

- **Radius**: `radius/card` (16px — was 8px).
- **Tints**: bg at status colour 6% alpha (was solid pastels), border at 25% alpha.
- **Icon slot**: 18×18 circle with status colour bg, white symbol inside (was Ant's outline-icon).

### B.16 Skeleton

- **Animation**: `shimmer` keyframe — background-position -200% → 200% loop 2.4s linear (was 1.4s).
- **Gradient**: mid-band uses `rgba(195,235,66,0.12)` (lime tint) instead of pure grey.
- **Radius**: matches component being mocked (skeleton image → `radius/card` 16px, skeleton text-line → `radius/base` 6px).

### B.17 Typography

- **Family**: Geist sans + Geist Mono (replace Inter).
- **Heading weight**: 700 (was 600).
- **Heading tracking**: -0.01em.
- **Code**: bg `surface/bg-spotlight` (warm) + `radius/sm` (4px) — was grey + 3px radius.
- **Add Eyebrow style** as a Text Style: Geist Mono · 11px · uppercase · letter-spacing 0.05em · colour `text/tertiary`.

---

## C. Genie-exclusive patterns — ADD as new DS components

These don't exist in standard Ant; add them as fresh DS components:

| Component | Spec |
|---|---|
| **Hero prompt input** | Large rounded-2xl textarea with lime focus halo + radial-gradient backdrop. Suggestion pill row below. |
| **Mode pill** | `radius/pill`, 24px height, lime-tint bg when active, mono 11px uppercase. |
| **Quality score chip** | `radius/pill`, mono 10px uppercase weight 700, status colours (success/warn/error variants), backdrop-blur(8px), bg rgba(255,255,255,0.95). |
| **Glass surface** | `backdrop-filter: blur(20px) saturate(140%)`, bg `rgba(255,255,255,0.72)` light / `rgba(22,22,22,0.62)` dark, border 1px subtle, radius `radius/lg`. Used for floating chrome over generation grid. |
| **Lime glow halo** | Box-shadow `shadow/glow` applied to selected/focused cards. |
| **Pulse ring animation** | 0 → 8px lime box-shadow loop, 1.6s `easing/pulse`. Used on "in progress" status dots. |
| **DotGridPattern** | 32px grid lines at `rgba(15,15,12,0.04)` light / `rgba(255,255,255,0.04)` dark. Background overlay for empty states + canvas surfaces. |
| **Output card** (generation result) | Radius `radius/xl` (20px), 4:5 aspect thumbnail, hover-lift, quality-chip in top-right corner. |
| **MicroMotif icons** | 6 per-mode SVG icons at 32px, `currentColor` inheritance. Used in mode-picker cards. |

---

## D. Effects / Motion presets — define in Figma

Define as Smart Animate keyframe presets so frames can apply them by name:

| Preset | Animation |
|---|---|
| `motion/lift` | y(-2px) + `shadow/sm` → `shadow/lg` over 220ms `easing/standard` |
| `motion/pop-in` | opacity 0→1 + scale 0.98→1 over 320ms `easing/pop` |
| `motion/fade-up` | opacity 0→1 + y(+8px → 0) over 360ms `easing/standard` |
| `motion/shimmer` | bg-position -200% → 200% loop 2.4s linear |
| `motion/sheen` | x(-120% → 220%) + skew(-20deg), 1.4s ease-in-out |
| `motion/float` | y(0 → -2px) loop 3s ease-in-out |
| `motion/pulse-ring` | lime shadow 0 → 8px loop 1.6s `easing/pulse` |

---

## E. Migration order (recommended)

1. Replace **Foundation variables** first (Sections A.1–A.12). All linked frames pick up the new colour, type, spacing, radius, shadow values immediately.
2. Update the **20 DS components** (B.1–B.17) — once variables are correct, components are mostly re-binding properties.
3. **Add new Genie-exclusive components** (Section C) — these are fresh.
4. Set up **motion presets** (Section D).
5. Audit each page in the file (New genie / Catalogue / Industry Insights / Onboarding / Brand Book / Genie / Video Sage / AI bot / Ad-board / Bin) for any one-off styling that bypassed components — relink to the updated components.

## F. Cross-check

Compare your final Figma DS against `design-system-comparison.html` (right-hand "Genie 6.0" column) in this folder. The visual should be 1:1 — if anything in Figma doesn't match, file a delta and adjust.
