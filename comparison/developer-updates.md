# Developer Update list — React + Ant Design + custom theme

Sync the real-project codebase from **Default Ant Design v5 defaults** → **Genie 6.0 design language**. Apply these as `ConfigProvider` theme tokens + per-component overrides + a custom CSS file. No structural refactor required — change values + add utility CSS.

**Source of truth:** Genie 6.0 in the FabAds Claude sandbox (`src/genie6/styles/tokens.css`, `tailwind.config.ts`).

**Visual reference:** open `design-system-comparison.html` in this folder for a side-by-side render of every component.

---

## Quick summary — what's actually changing

| Area | Default Ant | Genie 6.0 | Delta |
|---|---|---|---|
| Primary colour | `#1677ff` (blue) | `#c3eb42` (lime) | Brand swap |
| Primary text colour | `#fff` on primary | `#121212` on primary | Dark text on lime — high contrast |
| Border colour | `#d9d9d9` (cool grey) | `#e7e5dc` (warm beige) | Warmer neutrals |
| Bg-layout | `#fafafa` (cool grey) | `#fbfbf9` (warm off-white) | Warmer neutrals |
| **Button radius** | 6px (square-ish) | **100px (PILL)** for text buttons / 6px for icon-only | **Pill buttons** |
| Input radius | 6px | 28px | Pill inputs |
| Card radius | 8px | 16px | Bigger |
| Modal radius | 8px | 16px | Bigger |
| Badge radius | 4px | 100px | Pill badges |
| **Typography scale** | base 14px | **base 13px (ALL sizes −1px)** | Tighter scale |
| Heading weight | 600 | 700 | Bumped |
| Tooltip font-size | 14px | 11px (Geist Mono) | Tighter + Mono |
| **Mono usage** | code only | **numbers + descriptions + info messages + eyebrows + table headers + tooltips** | Mono is everywhere now |
| Focus halo | 2px blue ring | 4px lime spread | Bigger softer ring |
| Backdrop blur | none | blur(4px) | New |
| Heading font | system fallback | Geist | Brand font |
| Mono font | system mono | Geist Mono | Brand font |
| Shimmer (skeleton) | grey, 1.4s | lime mid-band, 2.4s | Slower + branded |

---

## A. Install Geist fonts

Pick one of these methods.

### Option 1 — `@fontsource/geist`

```bash
npm i @fontsource/geist @fontsource/geist-mono
```

```ts
// main.tsx
import '@fontsource/geist/400.css';
import '@fontsource/geist/500.css';
import '@fontsource/geist/600.css';
import '@fontsource/geist/700.css';
import '@fontsource/geist/800.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
import '@fontsource/geist-mono/600.css';
import '@fontsource/geist-mono/700.css';
```

### Option 2 — Google Fonts `<link>`

```html
<!-- index.html <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600;700&display=swap">
```

---

## B. Update `ConfigProvider` — seed tokens

```ts
// src/theme.ts
import { ConfigProviderProps } from 'antd';

export const lightTheme: ConfigProviderProps['theme'] = {
  token: {
    // ─── Seeds ─────────────────────────────────────────────
    colorPrimary:  '#c3eb42',                                      // was '#1677ff'
    colorSuccess:  '#52c41a',
    colorWarning:  '#faad14',
    colorError:    '#ff4d4f',
    colorInfo:     '#1677ff',
    colorTextBase: '#0f0f0c',                                      // was '#000' — warm shift
    colorBgBase:   '#fbfbf9',                                      // was '#fff' — warm shift
    borderRadius: 6,
    fontSize: 14,
    fontFamily: "'Geist', system-ui, -apple-system, 'Segoe UI', sans-serif",
    lineWidth: 1,
    sizeUnit: 4,
    sizeStep: 4,
    motionUnitFast: '0.2s',
    motionBase: '0.3s',
  },
};
```

---

## C. Override map tokens

```ts
// add to token: { ... }
token: {
  // ... seeds above ...

  // ─── Surfaces ─────────────────────────────────────────────
  colorBgContainer:  '#ffffff',
  colorBgElevated:   '#ffffff',
  colorBgLayout:     '#fbfbf9',                                    // was '#fafafa' — warm shift
  colorBgSpotlight:  '#f4f4f0',                                    // NEW (Ant doesn't ship this)

  // ─── Borders ──────────────────────────────────────────────
  colorBorder:          '#e7e5dc',                                  // was '#d9d9d9' — warm
  colorBorderSecondary: '#efeee7',                                  // was '#f0f0f0'

  // ─── Text (alpha-channel warm blacks) ─────────────────────
  colorText:           'rgba(15,15,12,0.92)',                      // was 'rgba(0,0,0,0.88)'
  colorTextSecondary:  'rgba(15,15,12,0.62)',                      // was 'rgba(0,0,0,0.65)'
  colorTextTertiary:   'rgba(15,15,12,0.42)',                      // was 'rgba(0,0,0,0.45)'
  colorTextQuaternary: 'rgba(15,15,12,0.22)',                      // was 'rgba(0,0,0,0.25)'

  // ─── Radius (Ant only ships 3 — see Section E for the rest) ─
  borderRadiusLG: 8,
  borderRadiusSM: 4,
  borderRadiusXS: 2,

  // ─── Font sizes — ALL −1px from Ant defaults ─────────────
  fontSize: 13,                                                    // was 14 — base size −1
  fontSizeLG: 15,                                                  // was 16
  fontSizeSM: 11,                                                  // was 12
  fontSizeXL: 19,                                                  // was 20
  fontSizeHeading1: 37,                                            // was 38
  fontSizeHeading2: 29,                                            // was 30
  fontSizeHeading3: 23,                                            // was 24
  fontSizeHeading4: 19,                                            // was 20
  fontSizeHeading5: 15,                                            // was 16
  // Line heights re-derived from the −1px sizes
  lineHeight: 21 / 13,                                             // 21 / fontSize ratio
  lineHeightLG: 23 / 15,
  lineHeightSM: 19 / 11,
  lineHeightHeading1: 45 / 37,
  lineHeightHeading2: 37 / 29,
  lineHeightHeading3: 31 / 23,
  lineHeightHeading4: 27 / 19,
  lineHeightHeading5: 23 / 15,
  // Heading weight
  fontWeightStrong: 700,                                           // was 600

  // ─── Heights ──────────────────────────────────────────────
  controlHeight:    32,
  controlHeightLG:  40,
  controlHeightSM:  24,
  controlHeightXS:  16,

  // ─── Shadows (REPLACE Ant defaults — compound stacked) ────
  boxShadow:           '0 1px 3px rgba(15,15,12,0.04), 0 8px 24px rgba(15,15,12,0.06)',
  boxShadowSecondary:  '0 2px 4px rgba(15,15,12,0.04), 0 12px 40px rgba(15,15,12,0.08)',
  boxShadowTertiary:   '0 1px 2px rgba(15,15,12,0.04)',
}
```

---

## D. Per-component overrides — `theme.components`

```ts
components: {

  Button: {
    primaryColor: '#121212',                                       // text ON lime — NOT white
    defaultShadow: 'none',                                          // drop subtle shadow
    primaryShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 4px rgba(195,235,66,0.22)',
    fontWeight: 500,
    paddingInline: 16,                                              // was 15 — wider for pill
    paddingInlineLG: 22,                                            // was 15 — wider for pill
    paddingInlineSM: 12,                                            // was 7  — wider for pill
    contentFontSize: 13,                                            // was 14 — −1px scale
    contentFontSizeLG: 13,                                          // was 16
    contentFontSizeSM: 12,                                          // was 14
    iconGap: 8,
    borderRadius: 100,                                              // PILL — was 6
    borderRadiusLG: 100,                                            // PILL — was 8
    borderRadiusSM: 100,                                            // PILL — was 4
    // Icon-only buttons need 6px radius — apply via classname override
    // since Ant doesn't expose a per-shape token. See Section F.6.
  },

  Card: {
    headerBg: 'transparent',
    headerFontSize: 16,
    paddingLG: 20,                                                  // was 24
    borderRadiusLG: 16,                                             // was 8 — was Ant's `borderRadiusLG`; card override
  },

  Input: {
    borderRadius: 28,                                               // was 6 — rounded-2xl
    activeBg: '#ffffff',
    activeBorderColor: '#e6f4a3',                                  // lime-tinted border focus
    activeShadow: '0 0 0 4px rgba(195,235,66,0.18)',               // lime halo
    hoverBorderColor: '#c3eb42',
    paddingBlock: 8,                                                // was 4
    paddingBlockLG: 10,                                             // was 7
    paddingInline: 14,                                              // was 11
  },

  Select: {
    borderRadius: 28,                                               // match Input
    optionSelectedBg: '#f9ffe2',                                    // lime tint (was blue tint)
    optionSelectedColor: '#121212',
    optionSelectedFontWeight: 600,
  },

  Cascader: {
    optionSelectedBg: '#f9ffe2',
  },

  Modal: {
    borderRadiusLG: 16,                                             // was 8 — match Card
    headerBg: 'transparent',
    titleFontSize: 18,                                              // was 16
    titleColor: 'rgba(15,15,12,0.92)',
    contentBg: '#ffffff',
    paddingContentHorizontalLG: 24,
    paddingMD: 20,
  },

  Drawer: {
    borderRadiusLG: 16,
    paddingLG: 24,
  },

  Tag: {
    borderRadiusSM: 100,                                            // pill — was 4
    defaultBg: '#f4f4f0',
    defaultColor: 'rgba(15,15,12,0.92)',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "'Geist Mono', monospace",
  },

  Badge: {
    indicatorHeight: 20,
    indicatorHeightSM: 14,
    fontFamily: "'Geist Mono', monospace",
    fontWeight: 700,
  },

  Tabs: {
    inkBarColor: '#c3eb42',                                         // lime — was blue
    itemActiveColor: 'rgba(15,15,12,0.92)',
    itemSelectedColor: 'rgba(15,15,12,0.92)',
    titleFontSize: 14,
    horizontalItemPadding: '12px 0',
    horizontalItemGutter: 24,                                       // was 32
  },

  Segmented: {
    itemSelectedBg: '#f9ffe2',                                      // lime tint
    itemSelectedColor: '#121212',
    borderRadius: 100,                                              // pill
    itemHoverColor: 'rgba(15,15,12,0.92)',
    trackBg: '#f4f4f0',
  },

  Tooltip: {
    borderRadius: 6,
    fontSize: 11,
    colorBgSpotlight: 'rgba(15,15,12,0.92)',                       // bg
  },

  Popover: {
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(15,15,12,0.04), 0 8px 24px rgba(15,15,12,0.06)',
    titleMinWidth: 0,
    titleFontWeight: 600,
  },

  Table: {
    borderRadiusLG: 16,
    headerBg: '#f4f4f0',                                            // warm — was neutral
    headerColor: 'rgba(15,15,12,0.62)',
    headerSplitColor: '#efeee7',
    rowHoverBg: '#f7f7f4',
    cellPaddingBlock: 14,
    cellFontSize: 13,
  },

  Empty: {
    // Limited tokens — most styling done via Empty's `image` prop override
    // and CSS overrides on `.ant-empty-description`. See Section F.
  },

  Alert: {
    borderRadiusLG: 16,
    fontSize: 13,
    withDescriptionPadding: '12px 16px',
    defaultPadding: '12px 16px',
  },

  Skeleton: {
    blockRadius: 6,
    gradientFromColor: '#f4f4f0',
    gradientToColor: 'rgba(195,235,66,0.12)',                      // lime tint mid
  },

  Checkbox: {
    colorPrimary: '#c3eb42',
    controlInteractiveSize: 16,
    lineWidth: 1.5,                                                 // was 1
  },

  Radio: {
    colorPrimary: '#c3eb42',
    radioSize: 16,
    dotSize: 8,
  },

  Switch: {
    handleSize: 18,
    handleSizeSM: 12,
    trackHeight: 24,                                                // was 22
    trackHeightSM: 16,
    trackMinWidth: 44,
    colorPrimary: '#c3eb42',
    colorPrimaryHover: '#d4f267',
  },

  Typography: {
    titleMarginBottom: '0.5em',
    titleMarginTop: '0',
    fontWeightStrong: 700,                                          // was 600
  },
}
```

---

## D.2 Geist Mono — usage rules (NEW)

Geist Mono is no longer code-only. It's the **primary font** for several text categories. Add these helper classes in `genie-tokens.css` (next section) and use them across the app:

| Category | Class / pattern | Style |
|---|---|---|
| Numbers (counts, prices, %, IDs, dates, dimensions) | `.num` | Geist Mono · same size as context · tabular-nums · weight 500-600 |
| Descriptions / captions under titles | `.meta` | Geist Mono · 11px / 16px · text-tertiary |
| Info / helper / tooltip text | `.info` | Geist Mono · 11px · text-secondary |
| Eyebrow titles above cards | `.eyebrow` | Geist Mono · 11px · uppercase · letter-spacing 0.05em · weight 600 · text-tertiary |
| Inline metadata chips (e.g. `v3 · 1024×1280 · 2.3s ago`) | `.meta` | Geist Mono · 10-11px · text-tertiary |
| Status labels in alerts | inline | Geist Mono · 12px · text-secondary |
| Table column headers | Ant override | Geist Mono · 11px · uppercase · letter-spacing 0.08em · weight 600 |
| Quality chips / status pills | custom component | Geist Mono · 10-11px · uppercase · weight 700 |
| Domain / URL displays | inline | Geist Mono · base size · text-secondary |
| Search keyboard hints (⌘K) | inline | Geist Mono · 10px · text-tertiary |

**Rule of thumb:** secondary info (metadata, captions, hints, numbers as data) → Mono. Primary content (titles, body, button labels) → Sans.

In React component code, you'll see patterns like:
```tsx
<div>
  <h3 className="text-base font-semibold">Aurora Apparel</h3>
  <p className="meta">42 ads · last sync 2 hours ago</p>      {/* Mono */}
</div>

<div className="flex items-center gap-2">
  <span className="num">$12,847.50</span>                        {/* Mono */}
  <span className="meta">/ month</span>                          {/* Mono */}
</div>

<Alert message="Heads up — your trial ends in 5 days." />        {/* Body Mono via Ant override */}
```

---

## E. Custom CSS — add `src/styles/genie-tokens.css`

Ant tokens don't cover the full Genie palette (extra radii, lime tints, glass, motion utilities). Add this stylesheet and import it AFTER Ant's CSS:

```css
:root {
  /* ─── Radii Ant doesn't expose ───────────────────────────── */
  --radius-card: 16px;
  --radius-xl:   20px;
  --radius-2xl:  28px;
  --radius-pill: 100px;

  /* ─── Shadows beyond Ant ─────────────────────────────────── */
  --shadow-primary-btn:  0 1px 2px rgba(0,0,0,0.04), 0 0 0 4px rgba(195,235,66,0.22);
  --shadow-input-active: 0 0 0 4px rgba(195,235,66,0.18);
  --shadow-glow:         0 0 0 1px rgba(195,235,66,0.4), 0 0 24px rgba(195,235,66,0.18);

  /* ─── Glass surface ──────────────────────────────────────── */
  --glass-bg-light: rgba(255,255,255,0.72);
  --glass-bg-dark:  rgba(22,22,22,0.62);
  --glass-blur:     blur(20px) saturate(140%);

  /* ─── Brand tints (Ant doesn't expose these directly) ────── */
  --primary-bg:        #f9ffe2;
  --primary-bg-hover:  #f3ffce;
  --primary-border:    #e6f4a3;

  /* ─── Motion timings ─────────────────────────────────────── */
  --ease-standard: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-pop:      cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-pulse:    cubic-bezier(0.4, 0, 0.6, 1);
}

[data-theme="dark"] {
  --primary-bg:        #232915;
  --primary-bg-hover:  #36401a;
  --primary-border:    #495522;
  --shadow-glow:       0 0 0 1px rgba(195,235,66,0.5), 0 0 32px rgba(195,235,66,0.25);
}

/* ═══════════════════════════════════════════════════════════════════
   UTILITY CLASSES
   ═══════════════════════════════════════════════════════════════════ */

/* Glass surface */
.glass {
  background: var(--glass-bg-light);
  backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(15,15,12,0.06);
}
[data-theme="dark"] .glass {
  background: var(--glass-bg-dark);
  border-color: rgba(255,255,255,0.06);
}

/* Lift hover */
.lift {
  transition: transform 220ms var(--ease-standard),
              box-shadow 220ms var(--ease-standard);
}
.lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(15,15,12,0.04), 0 12px 40px rgba(15,15,12,0.08);
}

/* Eyebrow text style */
.eyebrow {
  font-family: 'Geist Mono', monospace;
  font-size: 11px;
  line-height: 16px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(15,15,12,0.42);
  font-weight: 600;
}

/* Numbers — counts, prices, percentages, IDs, dates */
.num {
  font-family: 'Geist Mono', monospace;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: rgba(15,15,12,0.92);
}

/* Descriptions / captions under titles */
.meta {
  font-family: 'Geist Mono', monospace;
  font-size: 11px;
  line-height: 16px;
  color: rgba(15,15,12,0.42);
}

/* Info / helper / tooltip text */
.info {
  font-family: 'Geist Mono', monospace;
  font-size: 11px;
  line-height: 16px;
  color: rgba(15,15,12,0.62);
}

/* Dot-grid background pattern */
.dot-grid {
  background-image:
    radial-gradient(circle at center, rgba(195,235,66,0.06) 0%, transparent 60%),
    radial-gradient(rgba(15,15,12,0.04) 1px, transparent 1px);
  background-size: 100% 100%, 32px 32px;
  background-position: center, center;
}
[data-theme="dark"] .dot-grid {
  background-image:
    radial-gradient(circle at center, rgba(195,235,66,0.06) 0%, transparent 60%),
    radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
}

/* Lime glow halo */
.glow {
  box-shadow: var(--shadow-glow);
}

/* ═══════════════════════════════════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════════════════════════════════ */

/* Pulse ring — used on "in progress" indicators */
@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 0 rgba(195,235,66,0.55); }
  50%      { box-shadow: 0 0 0 8px rgba(195,235,66,0); }
}
.pulse-ring {
  animation: pulse-ring 1.6s var(--ease-pulse) infinite;
}

/* Pop-in entrance */
@keyframes pop-in {
  from { opacity: 0; transform: scale(0.98); }
  to   { opacity: 1; transform: scale(1); }
}
.pop-in { animation: pop-in 320ms var(--ease-pop) both; }

/* Fade-up entrance */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-up { animation: fade-up 360ms var(--ease-standard) both; }

/* Shimmer (for custom skeletons) */
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}
.shimmer {
  background: linear-gradient(90deg, transparent, rgba(195,235,66,0.12), transparent);
  background-size: 200% 100%;
  animation: shimmer 2.4s linear infinite;
}

/* Sheen — one-off shine across hero CTAs */
@keyframes sheen {
  from { transform: translateX(-120%) skewX(-20deg); }
  to   { transform: translateX(220%) skewX(-20deg); }
}
.sheen { position: relative; overflow: hidden; }
.sheen::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: sheen 1.4s ease-in-out;
}

/* Float — subtle bob on idle elements */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-2px); }
}
.float { animation: float 3s ease-in-out infinite; }

/* ═══════════════════════════════════════════════════════════════════
   ANT GLOBAL OVERRIDES
   (where Ant tokens don't reach)
   ═══════════════════════════════════════════════════════════════════ */

/* Modal — backdrop blur + darker overlay */
.ant-modal-mask {
  backdrop-filter: blur(4px) !important;
  background: rgba(0,0,0,0.7) !important;
}

/* Modal — bigger title weight */
.ant-modal-title { font-weight: 600 !important; letter-spacing: -0.01em; }

/* Modal — warm footer */
.ant-modal-footer {
  background: var(--colorBgLayout, #fbfbf9);
  border-top: 1px solid #efeee7;
  margin-top: 0;
  padding: 16px 24px;
  border-radius: 0 0 16px 16px;
}

/* Table — mono uppercase header */
.ant-table-thead > tr > th {
  font-family: 'Geist Mono', monospace !important;
  font-size: 11px !important;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}

/* Tabs — firmer active state */
.ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
  font-weight: 600 !important;
}

/* Tag — pill shape */
.ant-tag {
  border-radius: 100px !important;
  font-family: 'Geist Mono', monospace !important;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  padding: 0 10px !important;
  height: 22px;
  display: inline-flex;
  align-items: center;
  border: none;
}

/* Empty description weight + size */
.ant-empty-description {
  color: rgba(15,15,12,0.62);
  font-size: 13px;
}

/* Headings via Typography — heavier weight */
.ant-typography h1, .ant-typography h2, .ant-typography h3,
.ant-typography h4, .ant-typography h5 {
  font-weight: 700 !important;
  letter-spacing: -0.01em;
}
```

---

## F. Custom React wrappers — for patterns Ant doesn't ship (DETAILED)

Below: 15 patterns that DO NOT exist in Ant Design's component library. Devs need to add each one. Each section explains: what's NOT in Ant, what to build, the spec, and the implementation code.

**Inventory:**
- F.1 ModeBadge — custom Tag variant
- F.2 QualityScoreChip — new component
- F.3 HeroPromptInput — new wrapper around Input.TextArea
- F.4 OutputCard — new component
- F.5 LimeMotifEmpty — Empty image override
- F.6 Icon-only button radius override
- F.7 Pulse ring indicator (CSS-only utility)
- F.8 Glass surface (CSS-only utility)
- F.9 Lime glow halo (CSS-only utility)
- F.10 Dot-grid pattern (CSS-only utility)
- F.11 Lift hover (CSS-only utility)
- F.12 Sheen animation (CSS-only utility)
- F.13 Float idle bob (CSS-only utility)
- F.14 Shimmer for custom skeletons (CSS-only utility)
- F.15 Fade-up / Pop-in entrance utilities (CSS-only utilities)
- F.16 MicroMotif SVG components — 6 per-mode icons

The CSS-only utilities (F.7 – F.15) are already defined in `genie-tokens.css` — see Section E. The components below need React code.

---


These need custom components built on top of (or alongside) Ant.

### F.1 ModeBadge

```tsx
// src/components/ModeBadge.tsx
import { Tag } from 'antd';

interface Props { children: React.ReactNode; }

export const ModeBadge = ({ children }: Props) => (
  <Tag
    style={{
      background: 'transparent',
      color: 'rgba(15,15,12,0.42)',
      border: 'none',
      fontFamily: "'Geist Mono', monospace",
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      padding: 0,
      height: 'auto',
    }}
  >
    {children}
  </Tag>
);
```

### F.2 QualityScoreChip

```tsx
// src/components/QualityScoreChip.tsx
type Variant = 'success' | 'warning' | 'error';

const COLORS: Record<Variant, { bg: string; color: string; border: string }> = {
  success: { bg: 'rgba(255,255,255,0.95)', color: '#52c41a', border: 'rgba(82,196,26,0.3)' },
  warning: { bg: 'rgba(255,255,255,0.95)', color: '#faad14', border: 'rgba(250,173,20,0.3)' },
  error:   { bg: 'rgba(255,255,255,0.95)', color: '#ff4d4f', border: 'rgba(255,77,79,0.3)' },
};

interface Props { variant: Variant; children: React.ReactNode; }

export const QualityScoreChip = ({ variant, children }: Props) => {
  const c = COLORS[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', height: 20,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 100,
      fontFamily: "'Geist Mono', monospace", fontSize: 10, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      backdropFilter: 'blur(8px)',
    }}>
      {children}
    </span>
  );
};
```

### F.3 HeroPromptInput

```tsx
// src/components/HeroPromptInput.tsx
import { Input } from 'antd';

const { TextArea } = Input;

interface Props {
  value: string;
  onChange: (v: string) => void;
  suggestions?: string[];
  onSuggestionClick?: (s: string) => void;
}

export const HeroPromptInput = ({ value, onChange, suggestions = [], onSuggestionClick }: Props) => (
  <div style={{
    position: 'relative',
    background: '#fff',
    border: '1px solid #efeee7',
    borderRadius: 28,
    padding: '16px 20px',
    transition: 'all 300ms cubic-bezier(0.32, 0.72, 0, 1)',
  }}
  className="hero-prompt"  /* triggers .hero-prompt:focus-within rule for glow */
  >
    <TextArea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Describe what you want to generate..."
      autoSize={{ minRows: 2, maxRows: 8 }}
      bordered={false}
      style={{ padding: 0 }}
    />
    {suggestions.length > 0 && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {suggestions.map(s => (
          <span
            key={s}
            onClick={() => onSuggestionClick?.(s)}
            style={{
              padding: '4px 10px',
              background: '#f4f4f0',
              border: '1px solid #efeee7',
              borderRadius: 100,
              fontSize: 11,
              color: 'rgba(15,15,12,0.62)',
              cursor: 'pointer',
            }}
          >{s}</span>
        ))}
      </div>
    )}
  </div>
);
```

Add to `genie-tokens.css`:

```css
.hero-prompt::before {
  content: '';
  position: absolute; inset: -10px;
  background: radial-gradient(ellipse at center,
              rgba(195,235,66,0.25) 0%,
              rgba(195,235,66,0.08) 35%,
              transparent 65%);
  border-radius: 32px;
  filter: blur(28px);
  opacity: 0;
  transition: opacity 500ms var(--ease-standard);
  pointer-events: none;
  z-index: -1;
}
.hero-prompt:focus-within { box-shadow: var(--shadow-glow); }
.hero-prompt:focus-within::before { opacity: 1; }
```

### F.4 OutputCard (generation result)

```tsx
// src/components/OutputCard.tsx
interface Props {
  thumbnail: React.ReactNode;
  title: string;
  meta: string;
  qualityChip?: React.ReactNode;
  onClick?: () => void;
}

export const OutputCard = ({ thumbnail, title, meta, qualityChip, onClick }: Props) => (
  <div
    onClick={onClick}
    className="lift"
    style={{
      background: '#fff',
      border: '1px solid #efeee7',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(15,15,12,0.04)',
      cursor: 'pointer',
      maxWidth: 220,
    }}
  >
    <div style={{ aspectRatio: '4/5', position: 'relative', background: '#f4f4f0' }}>
      {thumbnail}
      {qualityChip && <div style={{ position: 'absolute', top: 10, right: 10 }}>{qualityChip}</div>}
    </div>
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
      <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, color: 'rgba(15,15,12,0.42)', marginTop: 2 }}>
        {meta}
      </div>
    </div>
  </div>
);
```

### F.5 LimeMotifEmpty — replaces Ant's default Empty image



```tsx
// src/components/LimeMotifEmpty.tsx
import { Empty } from 'antd';

interface Props {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const LimeMotifEmpty = ({ title, description, action, icon = '◎' }: Props) => (
  <Empty
    image={
      <div style={{
        width: 64, height: 64, margin: '0 auto 16px',
        borderRadius: 16,
        background: '#f9ffe2',
        border: '1px solid #e6f4a3',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#121212', fontSize: 24, fontWeight: 700,
      }}>
        {icon}
      </div>
    }
    description={
      <div>
        {title && <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(15,15,12,0.92)', marginBottom: 6 }}>{title}</div>}
        {description && <div style={{ fontSize: 13, color: 'rgba(15,15,12,0.62)' }}>{description}</div>}
      </div>
    }
  >
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </Empty>
);
```

### F.6 Icon-only button radius override

**What's NOT in Ant:** Ant's Button radius applies uniformly. If you set `Button.borderRadius: 100`, text AND icon buttons both go pill. But Genie wants:
- Text buttons → pill (100px)
- Icon-only buttons → 6px square

**What to build:** Use a `className` override for icon buttons (or set `shape="default"` and override radius via CSS).

```tsx
// Use Ant's icon-only buttons with a className override
<Button icon={<SettingOutlined />} className="btn-icon-square" />

// In genie-tokens.css:
.btn-icon-square.ant-btn {
  border-radius: 6px !important;
  width: 32px;
  padding: 0;
}
```

Alternative — wrap as a custom component:

```tsx
// src/components/IconButton.tsx
import { Button, ButtonProps } from 'antd';

export const IconButton = (props: ButtonProps) => (
  <Button {...props} style={{ borderRadius: 6, width: 32, padding: 0, ...props.style }} />
);
```

### F.7 Pulse ring indicator — CSS-only

**What's NOT in Ant:** Ant ships Spin (spinner) — no expanding-ring pulse for ambient "in progress" state.

**Spec:** 12×12 lime dot with `@keyframes pulse-ring` looping box-shadow.

Already defined in `genie-tokens.css` as `.pulse-ring`:

```tsx
<div className="pulse-ring" style={{ width: 12, height: 12, borderRadius: '50%', background: '#c3eb42' }} />
<span className="eyebrow">Generating · stage 3 of 4</span>
```

Or wrap into a component:

```tsx
// src/components/PulseDot.tsx
export const PulseDot = ({ size = 12 }: { size?: number }) => (
  <div
    className="pulse-ring"
    style={{ width: size, height: size, borderRadius: '50%', background: '#c3eb42', display: 'inline-block' }}
  />
);
```

### F.8 Glass surface — CSS-only

**What's NOT in Ant:** No backdrop-blur utility, no glass surface pattern.

**Spec:** `backdrop-filter: blur(20px) saturate(140%)` + semi-transparent bg.

Already defined as `.glass` utility in `genie-tokens.css`. Use:

```tsx
<div className="glass" style={{ padding: '12px 16px', borderRadius: 12 }}>
  <span className="eyebrow">3 generations queued</span>
  <Button type="link">View →</Button>
</div>
```

### F.9 Lime glow halo — CSS-only

**What's NOT in Ant:** No glow utility. Focus rings are flat box-shadow.

**Spec:** Composite shadow — `0 0 0 1px rgba(195,235,66,0.4), 0 0 24px rgba(195,235,66,0.18)`.

Already defined as `.glow` utility. Use:

```tsx
<Card className="glow">Selected concept</Card>
```

### F.10 Dot-grid pattern — CSS-only

**What's NOT in Ant:** No pattern utilities. Empty states use a line-drawing illustration.

**Spec:** CSS background — radial gradient dots at 32px grid, often combined with a lime radial bg.

Already defined as `.dot-grid` utility. Use:

```tsx
<div className="dot-grid" style={{ padding: '48px 20px', borderRadius: 16, textAlign: 'center' }}>
  Empty canvas — nothing generated yet
</div>
```

### F.11 Lift hover — CSS-only

**What's NOT in Ant:** No lift utility. Hoverable cards just border-colour-change.

**Spec:** `translateY(-2px)` + shadow-sm → shadow-lg over 220ms.

Already defined as `.lift` utility. Use:

```tsx
<Card className="lift" hoverable={false}>...</Card>
```

### F.12 Sheen animation — CSS-only

**What's NOT in Ant:** No sheen animation utility.

**Spec:** `::after` pseudo-element with linear-gradient highlight + skewX(-20deg) translateX(-120 → 220) over 1.4s, fires ONCE.

Already defined as `.sheen` utility. Apply sparingly — climactic CTAs only:

```tsx
<Button type="primary" size="large" className="sheen">✦ Start Creating</Button>
```

### F.13 Float idle bob — CSS-only

**What's NOT in Ant:** No idle animation utilities.

**Spec:** `translateY(0 → -2px)` loop 3s.

Already defined as `.float` utility. Use on hero icons:

```tsx
<div className="float">
  <SparklesIcon size={48} />
</div>
```

### F.14 Shimmer for custom skeletons — CSS-only

**What's NOT in Ant:** Ant's Skeleton has shimmer but you can't apply it to custom elements (e.g. a custom thumbnail-shaped skeleton).

**Spec:** `background-position` animation with lime mid-band over 2.4s.

Already defined as `.shimmer` utility:

```tsx
<div className="shimmer" style={{ height: 80, width: 280, borderRadius: 20 }} />
```

### F.15 Fade-up + Pop-in entrance — CSS-only

**What's NOT in Ant:** Motion utilities are buried inside `motion` package + tied to specific components. Not exposed as reusable utilities.

**Specs:**
- `.fade-up` — opacity 0→1 + translateY(+8→0), 360ms.
- `.pop-in` — opacity 0→1 + scale 0.98→1, 320ms.

Already defined. Use on mount:

```tsx
<Card className="fade-up">List item appearing</Card>
<Toast className="pop-in">Generation complete</Toast>
```

For staggered list reveal:
```tsx
{items.map((item, i) => (
  <Card key={item.id} className="fade-up" style={{ animationDelay: `${i * 60}ms` }}>
    {item.title}
  </Card>
))}
```

### F.16 MicroMotif SVG components — per-mode icons

**What's NOT in Ant:** Ant ships its own icon set (`@ant-design/icons`) but no per-mode brand motifs.

**What to build:** 6 SVG components, one per Genie generation mode. Each is an abstract glyph using `currentColor` so it inherits the parent's text colour.

```tsx
// src/components/MicroMotifs.tsx

const motifs = {
  'brand-ad':       /* SVG path for Brand Ad */,
  'product-ad':     /* SVG path for Product Ad */,
  'affiliate-ad':   /* SVG path for Affiliate Ad */,
  'ugc-video':      /* SVG path for UGC Video */,
  'forge':          /* SVG path for Forge */,
  'image-to-ad':    /* SVG path for Image-to-Ad */,
};

export const MicroMotif = ({
  mode,
  size = 32,
}: {
  mode: keyof typeof motifs;
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    {motifs[mode]}
  </svg>
);
```

Each motif is hand-drawn — designer should produce them in Figma + export as SVG paths. They're abstract (not literal "shopping bag" icons) — semi-geometric, semi-flowing forms that visually distinguish modes without being too literal.

Used in:
- Mode-picker cards in the Generate surface
- Hero generation surface (the active mode shown larger)
- Mode badges in output cards

---

## G. Dark mode

Use Ant's `theme.darkAlgorithm` and override dark tokens:

```ts
import { theme } from 'antd';

export const darkTheme: ConfigProviderProps['theme'] = {
  algorithm: theme.darkAlgorithm,
  token: {
    // Re-apply seeds from light (most stay)
    colorPrimary: '#c3eb42',
    colorTextBase: '#ffffff',
    colorBgBase:  '#0d0d0d',

    // Dark-specific surfaces
    colorBgContainer: '#161616',
    colorBgElevated:  '#1e1e1e',
    colorBgLayout:    '#0d0d0d',

    // Dark borders
    colorBorder:          '#2a2a2a',
    colorBorderSecondary: '#1f1f1f',

    // Dark text
    colorText:           'rgba(255,255,255,0.92)',
    colorTextSecondary:  'rgba(255,255,255,0.62)',
    colorTextTertiary:   'rgba(255,255,255,0.42)',
    colorTextQuaternary: 'rgba(255,255,255,0.22)',

    // Heavier shadows in dark
    boxShadow: '0 1px 3px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.4)',

    fontFamily: "'Geist', system-ui, -apple-system, 'Segoe UI', sans-serif",
    borderRadius: 6,
    fontSize: 14,
  },
};
```

Add a theme switcher that sets `data-theme="dark"` on `<html>` so the CSS-variable overrides in `genie-tokens.css` also kick in.

---

## H. Migration checklist (do in order)

1. **Install Geist + Geist Mono fonts** (Section A).
2. **Wrap app in `ConfigProvider` with the new theme** (Sections B + C + D).
3. **Add `genie-tokens.css`** to global styles, imported AFTER Ant CSS (Section E).
4. **Build the 5 custom wrappers** (Section F) — replace usage of bare Ant components where these patterns appear.
5. **Verify Input radius**: open a screen heavy on forms (login, settings) — every Input/Select/Textarea should be pill-shaped (28px).
6. **Verify Card radius**: cards across the app should be visibly rounder (16px).
7. **Verify Modal backdrop**: open any modal — backdrop should have a slight blur + darker overlay.
8. **Verify Primary CTA**: the lime primary fill should have dark text + a soft lime ring on hover.
9. **Verify Tabs**: active tab should have lime underline + bolder weight.
10. **Verify Table**: header should be mono uppercase 11px tracking-wide.
11. **Empty states**: anywhere `<Empty>` is used, swap to `<LimeMotifEmpty>`.
12. **Test dark mode**: toggle `data-theme="dark"` on `<html>` and verify all surfaces + borders flip cleanly.
13. **Cross-check**: open `comparison/design-system-comparison.html` in a browser. The right-hand "Genie 6.0" column is the visual target — every page in the app should match this aesthetic.

---

## I. Known gotchas

- **`borderRadius` token cascades** — setting `Input.borderRadius: 28` affects Input but NOT Select/Cascader. Set each component override explicitly.
- **`borderRadiusLG` is used by Card, Modal, Drawer** — bumping to 16 affects all three. If you only want Card at 16 and Modal at 12, override `Modal.borderRadiusLG` separately.
- **Empty's `image` prop expects a ReactNode** — not a CSS class. Use `<LimeMotifEmpty>` wrapper instead of trying to override globally.
- **Tag colour customisation** — if you use `<Tag color="success">`, Ant applies its own status palette. Override `Tag.defaultBg` etc. for the default tag only; status tags need a custom helper.
- **`primaryColor` for Button** — this is the text colour ON primary, not the bg. Setting `'#121212'` here is intentional. If you set `colorPrimary` to lime but leave `primaryColor` as `#fff` (Ant default), the lime button will have white text → low contrast.

---

## J. Optional — Tailwind users

If the real project uses Tailwind alongside Ant, mirror the design tokens in `tailwind.config.ts`:

```ts
export default {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#c3eb42', hover: '#d4f267', active: '#9cc42d', bg: '#f9ffe2' },
        // ... all colours from Section A.1–A.6
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
        'xl':   '20px',
        '2xl':  '28px',
        'pill': '100px',
      },
      boxShadow: {
        'primary-btn':  '0 1px 2px rgba(0,0,0,0.04), 0 0 0 4px rgba(195,235,66,0.22)',
        'input-active': '0 0 0 4px rgba(195,235,66,0.18)',
        'glow':         '0 0 0 1px rgba(195,235,66,0.4), 0 0 24px rgba(195,235,66,0.18)',
      },
    },
  },
};
```

That keeps custom Tailwind utilities (used outside Ant components) on the same colour/radius/shadow vocabulary as the Ant theme.
