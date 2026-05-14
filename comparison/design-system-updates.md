# Design System Updates — Genie 6.0 sync

**One master list.** Both designer (Figma) and devs (React + Ant Design) read the same doc. Each row tells you the **change** + the **Figma hook** + the **Code hook**.

**Source of truth:** Genie 6.0 in the FabAds Claude sandbox (`src/genie6/styles/tokens.css`, `tailwind.config.ts`, all components scanned).

**Visual reference:** `design-system-comparison.html` in this folder — open in browser for side-by-side render of every change.

**How to read:**
- 🎨 Designer: scan the "Figma" column to know where each change lands (Variable name, Component name, Effect, Text Style).
- 💻 Dev: scan the "Code" column to know where each change lands (Ant token, CSS variable, utility class, wrapper component).

**No code blocks in this doc — just specs.** Devs implement using their existing Ant + React stack; spec values are exact.

---

## 1. Headline summary

| # | What changed | Old (Ant default) | New (Genie 6.0) |
|---|---|---|---|
| 1 | Primary colour | `#1677ff` blue | **`#c3eb42` lime** |
| 2 | Text on primary | `#fff` white | **`#121212` dark** (high contrast on lime) |
| 3 | Border colour | `#d9d9d9` cool grey | **`#e7e5dc` warm beige** |
| 4 | Bg-layout | `#fafafa` cool grey | **`#fbfbf9` warm off-white** |
| 5 | Button radius (text) | `6px` square | **`100px` pill** |
| 6 | Input radius | `6px` | **`28px` rounded-2xl** |
| 7 | Card / Modal radius | `8px` | **`16px` rounded-card** |
| 8 | Badge / Tag radius | `4px` | **`100px` pill** |
| 9 | All font sizes | base 14px | **base 13px (every size −1px)** |
| 10 | Heading weight | 600 | **700** |
| 11 | Heading font | system sans-serif | **Geist** |
| 12 | Mono font | system mono | **Geist Mono** |
| 13 | Mono usage scope | code blocks only | **numbers, descriptions, info, eyebrows, table headers, tooltips, alerts** |
| 14 | Focus halo | 2px blue ring | **4px lime spread** |
| 15 | Modal backdrop | `rgba(0,0,0,0.45)` no blur | **`rgba(0,0,0,0.7)` + blur(4px)** |
| 16 | Hover lift | none | **translateY(-2px) + shadow upgrade** |
| 17 | Shimmer cadence | grey, 1.4s | **lime mid-band, 2.4s** |
| 18 | Genie-exclusive patterns | n/a | **15 new patterns added** (see Section 4) |

---

## 2. Foundation tokens

### 2.1 Brand colours

| Token | Old → New | Figma | Code (Ant + CSS) |
|---|---|---|---|
| Primary | `#1677ff` → `#c3eb42` | `brand/primary` | `token.colorPrimary` |
| Primary hover | n/a → `#d4f267` | `brand/primary-hover` | `token.colorPrimaryHover` |
| Primary active | n/a → `#9cc42d` | `brand/primary-active` | `token.colorPrimaryActive` |
| Primary bg (tint) | n/a → `#f9ffe2` | `brand/primary-bg` | CSS var `--primary-bg` |
| Primary border (tint) | n/a → `#e6f4a3` | `brand/primary-border` | CSS var `--primary-border` |
| Text on primary | `#fff` → `#121212` | `brand/primary-on` | `Button.primaryColor: '#121212'` |
| Primary bg (dark) | n/a → `#232915` | `brand/primary-dark/bg` | `[data-theme="dark"] --primary-bg` |
| Primary border (dark) | n/a → `#495522` | `brand/primary-dark/border` | `[data-theme="dark"] --primary-border` |

### 2.2 Surface colours

| Token | Old → New (light) | Old → New (dark) | Figma | Code |
|---|---|---|---|---|
| Bg-base | `#fff` → `#fbfbf9` | `#000` → `#0d0d0d` | `surface/bg-base` | `token.colorBgBase` |
| Bg-container | `#fff` → `#fff` | `#1f1f1f` → `#161616` | `surface/bg-container` | `token.colorBgContainer` |
| Bg-elevated | `#fff` → `#fff` | `#1f1f1f` → `#1e1e1e` | `surface/bg-elevated` | `token.colorBgElevated` |
| Bg-spotlight | n/a → `#f4f4f0` | n/a → `#2a2a2a` | `surface/bg-spotlight` | `token.colorBgSpotlight` |
| Bg-layout | `#fafafa` → `#fbfbf9` | `#000` → `#0d0d0d` | `surface/bg-layout` | `token.colorBgLayout` |

### 2.3 Border colours

| Token | Old → New (light) | Old → New (dark) | Figma | Code |
|---|---|---|---|---|
| Border primary | `#d9d9d9` → `#e7e5dc` | `#424242` → `#2a2a2a` | `border/primary` | `token.colorBorder` |
| Border secondary | `#f0f0f0` → `#efeee7` | `#303030` → `#1f1f1f` | `border/secondary` | `token.colorBorderSecondary` |

### 2.4 Text colours (alpha-channel warm blacks)

| Token | Old (Ant) | New (Genie) | Figma | Code |
|---|---|---|---|---|
| Text primary | `rgba(0,0,0,0.88)` | `rgba(15,15,12,0.92)` | `text/primary` | `token.colorText` |
| Text secondary | `rgba(0,0,0,0.65)` | `rgba(15,15,12,0.62)` | `text/secondary` | `token.colorTextSecondary` |
| Text tertiary | `rgba(0,0,0,0.45)` | `rgba(15,15,12,0.42)` | `text/tertiary` | `token.colorTextTertiary` |
| Text disabled | `rgba(0,0,0,0.25)` | `rgba(15,15,12,0.22)` | `text/disabled` | `token.colorTextQuaternary` |

### 2.5 Status colours

| Token | Light | Dark | Figma | Code |
|---|---|---|---|---|
| Success | `#52c41a` (same) | `#49aa19` | `status/success` | `token.colorSuccess` |
| Warning | `#faad14` (same) | `#d89614` | `status/warning` | `token.colorWarning` |
| Error | `#ff4d4f` (same) | `#dc4446` | `status/error` | `token.colorError` |
| Info | `#1677ff` (same) | `#1677ff` | `status/info` | `token.colorInfo` |

### 2.6 Typography — Geist family + ALL sizes −1px

**Font swap**: replace Inter/system → **Geist** (sans) + **Geist Mono**.

| Token | Old | New (−1px) | Line-height | Figma | Code |
|---|---|---|---|---|---|
| `xs` | 11px | **10px** | 15px | `font/size/xs` | `token.fontSizeXS` (alias) |
| `sm` | 12px | **11px** | 19px | `font/size/sm` | `token.fontSizeSM: 11` |
| `base` | 14px | **13px** | 21px | `font/size/base` | `token.fontSize: 13` |
| `lg` | 16px | **15px** | 23px | `font/size/lg` | `token.fontSizeLG: 15` |
| `xl` | 20px | **19px** | 27px | `font/size/xl` | `token.fontSizeXL: 19` |
| `h5` | 16px | **15px** | 23px | `font/size/h5` | `token.fontSizeHeading5: 15` |
| `h4` | 20px | **19px** | 27px | `font/size/h4` | `token.fontSizeHeading4: 19` |
| `h3` | 24px | **23px** | 31px | `font/size/h3` | `token.fontSizeHeading3: 23` |
| `h2` | 30px | **29px** | 37px | `font/size/h2` | `token.fontSizeHeading2: 29` |
| `h1` | 38px | **37px** | 45px | `font/size/h1` | `token.fontSizeHeading1: 37` |
| `display` | 56px | **55px** | 59px | `font/size/display` | CSS var `--font-size-display` |
| `display-lg` | 72px | **71px** | 75px | `font/size/display-lg` | CSS var `--font-size-display-lg` |
| Heading weight | 600 | **700** | — | `font/weight/heading` | `token.fontWeightStrong: 700` |
| Heading tracking | 0 | **-0.01em** | — | `font/tracking/display` | global CSS on `h1..h5` |
| Font family (sans) | system | **Geist** | — | `font/family/sans` | `token.fontFamily: 'Geist'` |
| Font family (mono) | system | **Geist Mono** | — | `font/family/mono` | global CSS `'Geist Mono'` |

### 2.7 Geist Mono — usage rules (NEW)

Mono is no longer code-only. Apply it as the **primary** font for these categories:

| Category | Style | Figma | Code |
|---|---|---|---|
| Numbers (counts, prices, %, IDs, dates, dimensions) | Mono · same size · tabular-nums · weight 500-600 | Text style `num` | `.num` utility class |
| Descriptions / captions under titles | Mono · 11px / 16px · text-tertiary | Text style `meta` | `.meta` utility class |
| Info / helper / tooltip text | Mono · 11px · text-secondary | Text style `info` | `.info` utility class |
| Eyebrow titles above cards / sections | Mono · 11px · uppercase · letter-spacing 0.05em · weight 600 · text-tertiary | Text style `eyebrow` | `.eyebrow` utility class |
| Inline metadata chips (`v3 · 1024×1280 · 2.3s ago`) | Mono · 10-11px · text-tertiary | `meta` (reuse) | `.meta` (reuse) |
| Status labels in alerts | Mono · 12px · text-secondary | inline override | inline override |
| Table column headers | Mono · 11px · uppercase · letter-spacing 0.08em · weight 600 | Table component spec | `Table.headerColor` + global CSS |
| Quality chips / status pills | Mono · 10-11px · uppercase · weight 700 | Quality chip component | custom React `<QualityScoreChip>` |
| Domain / URL displays | Mono · base size · text-secondary | inline | inline |
| Search keyboard hints (⌘K) | Mono · 10px · text-tertiary | inline | inline |

**Rule of thumb:** secondary info → Mono. Primary content (titles, body, button labels, form input values) → Sans.

### 2.8 Spacing (4pt scale)

| Token | Value | Figma | Code |
|---|---|---|---|
| `space/1` | 4px | Variable `space/1` | tailwind `gap-1` / Ant default |
| `space/2` | 8px | `space/2` | `gap-2` |
| `space/3` | 12px | `space/3` | `gap-3` |
| `space/4` | 16px | `space/4` | `gap-4` |
| `space/5` | 20px | `space/5` | `gap-5` |
| `space/6` | 24px | `space/6` | `gap-6` |
| `space/8` | 32px | `space/8` | `gap-8` |
| `space/10` | 40px | `space/10` | `gap-10` |
| `space/12` | 48px | `space/12` | `gap-12` |
| `space/16` | 64px | `space/16` | `gap-16` |
| `space/20` | 80px | `space/20` | `gap-20` |

### 2.9 Border radius — expanded scale

| Token | Old → New | Figma | Code |
|---|---|---|---|
| `xs` | 2px (same) | `radius/xs` | `token.borderRadiusXS: 2` |
| `sm` | 4px (same) | `radius/sm` | `token.borderRadiusSM: 4` |
| `base` | 6px (same) | `radius/base` | `token.borderRadius: 6` |
| `lg` | 8px (same) | `radius/lg` | `token.borderRadiusLG: 8` |
| **`card`** | n/a → **16px** | `radius/card` | CSS var `--radius-card: 16px` |
| **`xl`** | n/a → **20px** | `radius/xl` | CSS var `--radius-xl: 20px` |
| **`2xl`** | n/a → **28px** | `radius/2xl` | CSS var `--radius-2xl: 28px` |
| **`pill`** | n/a → **100px** | `radius/pill` | CSS var `--radius-pill: 100px` |

### 2.10 Shadows

| Token | Composition | Figma | Code |
|---|---|---|---|
| `sm` (light) | y=1 blur=2 rgba(15,15,12,0.04) | `shadow/sm` | `token.boxShadowTertiary` |
| `md` (light) | y=1 blur=3 + y=8 blur=24, stacked | `shadow/md` | `token.boxShadow` |
| `lg` (light) | y=2 blur=4 + y=12 blur=40, stacked | `shadow/lg` | `token.boxShadowSecondary` |
| `xl` (light) | y=4 blur=8 + y=24 blur=64, stacked | `shadow/xl` | CSS var `--shadow-xl` |
| `primary-btn` | y=1 blur=2 rgba(0,0,0,0.04) + 0 spread 4 rgba(195,235,66,0.22) | `shadow/primary-btn` | `Button.primaryShadow` |
| `input-active` | 0 spread 4 rgba(195,235,66,0.18) — lime focus halo | `shadow/input-active` | `Input.activeShadow` |
| `glow` | 0 spread 1 rgba(195,235,66,0.4) + 0 blur 24 rgba(195,235,66,0.18) | `shadow/glow` | CSS var `--shadow-glow` |
| `sm/md/lg` (dark) | heavier rgba(0,0,0,0.4-0.5) variants | `shadow/dark/*` | dark-mode overrides |

### 2.11 Heights

| Token | Value | Use | Figma | Code |
|---|---|---|---|---|
| `xs` | 16px | Micro | `height/xs` | `token.controlHeightXS: 16` |
| `sm` | 24px | Compact rows | `height/sm` | `token.controlHeightSM: 24` |
| `base` | 32px | Buttons, badges | `height/base` | `token.controlHeight: 32` |
| `lg` | 40px | Inputs, primary CTAs | `height/lg` | `token.controlHeightLG: 40` |
| `xl` | 52px | Hero CTA | `height/xl` | CSS var |

### 2.12 Motion

| Token | Value | Figma | Code |
|---|---|---|---|
| `duration/fast` | 200ms | Smart Animate preset | `token.motionUnitFast: '0.2s'` |
| `duration/base` | 300ms | preset | `token.motionBase: '0.3s'` |
| `duration/slow` | 500ms | preset | inline transitions |
| `duration/lift` | 220ms | preset | `.lift` utility class |
| `duration/pop-in` | 320ms | preset | `.pop-in` utility class |
| `easing/standard` | cubic-bezier(0.32, 0.72, 0, 1) | preset | CSS var `--ease-standard` |
| `easing/pop` | cubic-bezier(0.2, 0.8, 0.2, 1) | preset | CSS var `--ease-pop` |
| `easing/pulse` | cubic-bezier(0.4, 0, 0.6, 1) | preset | CSS var `--ease-pulse` |

---

## 3. Component changes

One row per change. Multi-row entries when a single component has several changes.

### 3.1 Button

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| **Radius (text buttons)** | 6px → **100px (pill)** | Button component → radius/pill | `Button.borderRadius: 100` + `borderRadiusLG: 100` + `borderRadiusSM: 100` |
| Radius (icon-only buttons) | 6px → 6px (unchanged) | Button "icon" variant → radius/base | Override via className `.btn-icon-square { border-radius: 6px !important }` |
| Primary fill | blue → lime | Component prop | `token.colorPrimary` (already set globally) |
| Primary text colour | white → dark | Component prop | `Button.primaryColor: '#121212'` |
| Primary hover shadow | none → lime ring | Effects | `Button.primaryShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 4px rgba(195,235,66,0.22)'` |
| Default shadow | subtle → none | Drop shadow off | `Button.defaultShadow: 'none'` |
| Padding inline (default) | 15px → **16px** | Component spec | `Button.paddingInline: 16` |
| Padding inline (lg) | 15px → **22px** | Component spec | `Button.paddingInlineLG: 22` |
| Padding inline (sm) | 7px → **12px** | Component spec | `Button.paddingInlineSM: 12` |
| Font size (default) | 14px → **13px** | Type binding | `Button.contentFontSize: 13` |
| Font size (lg) | 16px → **13px** | Type binding | `Button.contentFontSizeLG: 13` |
| Font size (sm) | 14px → **12px** | Type binding | `Button.contentFontSizeSM: 12` |
| Font weight | 400 → **500** | Type binding | `Button.fontWeight: 500` |
| Icon gap | 8px (same) | — | `Button.iconGap: 8` |

### 3.2 Card

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| Radius | 8px → **16px** | Card → radius/card | `Card.borderRadiusLG: 16` |
| Padding | 24px → **20px** | Spec | `Card.paddingLG: 20` |
| Header bg | grey → transparent | Component prop | `Card.headerBg: 'transparent'` |
| Hover lift | none → translate-y(-2px) + shadow upgrade | Smart Animate `motion/lift` | `.lift` utility class on Card |
| Body font size | 14px → **13px** | Inherits from token | (auto via `token.fontSize`) |

### 3.3 Input

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| **Radius** | 6px → **28px (rounded-2xl)** | Input → radius/2xl | `Input.borderRadius: 28` |
| Height (default) | 32px → **40px** | Component spec | `token.controlHeight: 32` (Ant default is 32, Genie inputs use h-10 → 40px via `controlHeightLG: 40` applied at large size) |
| Focus border | blue → lime tint | Component prop | `Input.activeBorderColor: '#e6f4a3'` |
| Focus shadow | 2px blue ring → 4px lime halo | Effects | `Input.activeShadow: '0 0 0 4px rgba(195,235,66,0.18)'` |
| Hover border | blue → lime | Component prop | `Input.hoverBorderColor: '#c3eb42'` |
| Padding block | 4px → **8px** | Spec | `Input.paddingBlock: 8` |
| Padding inline | 11px → **14px** | Spec | `Input.paddingInline: 14` |
| Font size | 14px → **13px** | Type binding | auto via `token.fontSize: 13` |

### 3.4 Select / Cascader

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| Radius | 6px → **28px** | radius/2xl | `Select.borderRadius: 28` |
| Active option bg | blue tint → lime tint `#f9ffe2` | Component spec | `Select.optionSelectedBg: '#f9ffe2'` |
| Active option text | blue → dark | Component spec | `Select.optionSelectedColor: '#121212'` |
| Active option weight | 400 → 600 | Type | `Select.optionSelectedFontWeight: 600` |

### 3.5 Textarea

Same as Input (radius 28px, lime focus halo). PLUS:

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| **Hero variant** | Doesn't exist | Lime focus halo + radial-gradient backdrop on `:focus-within` | New `<HeroPromptInput>` React wrapper + `.hero-prompt::before` CSS pseudo-element |
| Suggestion pill row | Doesn't exist | New variant feature | Built into `<HeroPromptInput>` wrapper |

### 3.6 Checkbox · Radio · Switch

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| Checkbox border-width | 1px → **1.5px** | Component spec | `Checkbox.lineWidth: 1.5` |
| Checkbox checked colour | blue → lime | Component prop | `Checkbox.colorPrimary: '#c3eb42'` |
| Checkbox check text | white → dark | Component spec | (auto, via primary text colour) |
| Radio active colour | blue → lime | Component prop | `Radio.colorPrimary: '#c3eb42'` |
| Switch on colour | blue → lime | Component prop | `Switch.colorPrimary: '#c3eb42'` |
| Switch height | 22px → **24px** | Spec | `Switch.trackHeight: 24` |
| Switch knob shadow | 0 2px 4px rgba(0,0,0,0.16) (same) | — | (auto) |

### 3.7 Modal · Dialog

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| Radius | 8px → **16px** | Modal → radius/card | `Modal.borderRadiusLG: 16` |
| Title font size | 16px → **17px** | Spec | `Modal.titleFontSize: 17` (was 16; weight 600) |
| Header bg | grey → transparent | Spec | `Modal.headerBg: 'transparent'` |
| Footer bg | white → `#fbfbf9` (warm) | Spec | global CSS `.ant-modal-footer { background: #fbfbf9 }` |
| **Backdrop** | `rgba(0,0,0,0.45)` no blur → **`rgba(0,0,0,0.7)` + blur(4px)** | Effect on overlay | global CSS `.ant-modal-mask { backdrop-filter: blur(4px); background: rgba(0,0,0,0.7) }` |

### 3.8 Drawer / Sheet

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| Default width | 360px → **400px** | Spec | `Drawer.width` (or per-instance prop) |
| Inner-edge radius | 0 → **16px** | Spec | `Drawer.borderRadiusLG: 16` |
| Header padding | 16px → **20px 24px** | Spec | inline override |
| Body padding | 24px (same) | — | `Drawer.paddingLG: 24` |

### 3.9 Tag / Badge / Pill

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| **Radius** | 4px → **100px (pill)** | Tag → radius/pill | `Tag.borderRadiusSM: 100` + global CSS `.ant-tag { border-radius: 100px !important }` |
| Default bg | `#fafafa` → `#f4f4f0` | Spec | `Tag.defaultBg: '#f4f4f0'` |
| Padding | 0 7px → **0 10px** | Spec | global CSS `.ant-tag { padding: 0 10px !important; height: 22px }` |
| Font | system sans → **Geist Mono** | Type binding | `Tag.fontFamily: "'Geist Mono', monospace"` |
| Font weight | 400 → 600 | Type | global CSS override (Tag doesn't expose weight token) |
| Text case | mixed → **uppercase** | Component spec | global CSS `.ant-tag { text-transform: uppercase; letter-spacing: 0.06em }` |
| Status variants | bg solid pastels → **bg 10% alpha + border 30% alpha** | Spec | global CSS overrides per status |
| Count badge | sharp 10px → **pill, mono 11px weight 700** | Badge component spec | `Badge.fontFamily: "'Geist Mono'"` + `Badge.fontWeight: 700` |

### 3.10 Tabs

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| Active underline colour | blue → **lime** | Component prop | `Tabs.inkBarColor: '#c3eb42'` |
| Active text weight | 400 → **600** | Spec | global CSS `.ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn { font-weight: 600 !important }` |
| Item gap | 32px → **24px** | Spec | `Tabs.horizontalItemGutter: 24` |
| Item font size | 14px → **13px** | Spec | `Tabs.titleFontSize: 13` |

### 3.11 Segmented control

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| **Container radius** | 6px → **100px (pill)** | radius/pill | `Segmented.borderRadius: 100` |
| Container bg | `rgba(0,0,0,0.04)` → `#f4f4f0` (warm spotlight) | Spec | `Segmented.trackBg: '#f4f4f0'` |
| Active segment bg | white → **lime tint `#f9ffe2`** | Spec | `Segmented.itemSelectedBg: '#f9ffe2'` |
| Active segment text | dark (same) → dark | — | `Segmented.itemSelectedColor: '#121212'` |
| Active segment weight | 400 → **600** | Spec | global CSS override |

### 3.12 Table

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| Wrapping radius | 8px → **16px** | radius/card | `Table.borderRadiusLG: 16` |
| Header bg | `#fafafa` → `#f4f4f0` (warm) | Spec | `Table.headerBg: '#f4f4f0'` |
| Header font | sans 14px → **Mono 11px uppercase letter-spacing 0.08em weight 600** | Spec | global CSS `.ant-table-thead > tr > th { font-family: 'Geist Mono' !important; font-size: 11px !important; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600 }` |
| Header padding | 16px → **12px** | Spec | global CSS override |
| Row padding | 16px → **14px** | Spec | `Table.cellPaddingBlock: 14` |
| Row font size | 14px → **13px** | Spec | `Table.cellFontSize: 13` |
| Row hover bg | grey → `#f7f7f4` (warm muted) | Spec | `Table.rowHoverBg: '#f7f7f4'` |

### 3.13 Empty state

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| **Image slot** | Generic line drawing → **64×64 lime motif card** | New Empty component variant | Custom `<LimeMotifEmpty>` React wrapper that overrides Ant Empty's `image` prop |
| Title (new) | None → **15px weight 700** | New text style | inline override in wrapper |
| Description | grey 14px → **Mono 11px text-secondary** | Spec | `.meta` class applied via wrapper |
| Optional bg | None → **Dot-grid pattern overlay** | New utility | `.dot-grid` utility class applied as wrapper bg |

### 3.14 Tooltip · Popover

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| **Tooltip font size** | 14px → **10-11px Mono** | Spec | `Tooltip.fontSize: 11` + global CSS `.ant-tooltip-inner { font-family: 'Geist Mono' }` |
| Tooltip bg | `rgba(0,0,0,0.85)` → `rgba(15,15,12,0.92)` | Spec | `Tooltip.colorBgSpotlight: 'rgba(15,15,12,0.92)'` |
| Popover radius | 6px → **8px** | radius/lg | `Popover.borderRadius: 8` |
| Popover shadow | `0 6px 16px rgba(0,0,0,0.08)` → new stacked shadow | Spec | `Popover.boxShadow: '0 1px 3px rgba(15,15,12,0.04), 0 8px 24px rgba(15,15,12,0.06)'` |
| Popover title weight | 500 → 600 | Spec | `Popover.titleFontWeight: 600` |
| Popover body | sans → **Mono 11px** | Spec | inline overrides |

### 3.15 Alert · Status banner

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| Radius | 8px → **16px** | radius/card | `Alert.borderRadiusLG: 16` |
| Tint alpha (bg) | solid pastels → **6% alpha** | Spec | global CSS per-status overrides |
| Tint alpha (border) | n/a → **25% alpha** | Spec | global CSS per-status overrides |
| Icon slot | inline outline-icon → **18×18 circle in status colour** | New component variant | custom JSX inside Alert |
| Font | sans 14px → **Mono 12px** | Type binding | `Alert.fontSize: 12` + global override for font-family |

### 3.16 Skeleton

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| Shimmer cadence | 1.4s → **2.4s** | Motion preset | `Skeleton.gradientFromColor` + custom keyframe |
| Shimmer mid-band | grey → **lime `rgba(195,235,66,0.12)`** | Spec | `Skeleton.gradientToColor: 'rgba(195,235,66,0.12)'` |
| Block radius | 4px → **6px (base)** | Spec | `Skeleton.blockRadius: 6` |

### 3.17 Typography

| What changed | Old → New | Figma | Code |
|---|---|---|---|
| **All sizes** | `14 / 16 / 20 / 24 / 30 / 38` | **−1px each: 13 / 15 / 19 / 23 / 29 / 37** | Foundation tokens (Section 2.6) | Foundation tokens (Section 2.6) |
| Heading weight | 600 → **700** | `font/weight/heading` | `token.fontWeightStrong: 700` |
| Heading tracking | 0 → **-0.01em** | spec | global CSS on `h1..h5` |
| Code bg | grey → **`#f4f4f0` warm spotlight** | Spec | global CSS `.ant-typography code` |
| **Eyebrow style** (NEW) | n/a → Mono 11px uppercase weight 600 letter-spacing 0.05em | `eyebrow` text style | `.eyebrow` utility class |
| **Number style** (NEW) | n/a → Mono tabular-nums weight 500-600 | `num` text style | `.num` utility class |
| **Meta style** (NEW) | n/a → Mono 11px text-tertiary | `meta` text style | `.meta` utility class |
| **Info style** (NEW) | n/a → Mono 11px text-secondary | `info` text style | `.info` utility class |

---

## 4. Genie-exclusive patterns (15 NEW — not in Ant)

These do NOT exist in Ant Design's library. Add each as: a new DS component in Figma + a new React wrapper or CSS utility in code.

### 4.1 Output card (generation result)

**What it is:** card showing a generated ad / image / video output in Genie's grid view.
**Spec:** radius `radius/xl` (20px) · border `border/secondary` · shadow `shadow/sm` base · thumbnail aspect 4:5 bg `bg-spotlight` · quality chip slot absolute top-right · body padding 12px · title Geist 13px weight 600 · meta Mono 10px · hover `motion/lift` · selected `motion/glow`.
**Figma:** new component `Output card` with thumbnail / quality-chip / title / meta slots.
**Code:** new `<OutputCard>` React component.

### 4.2 Quality score chip

**What it is:** pill that floats over output thumbnails showing AI quality score.
**Spec:** radius pill (100px) · height 20px · padding 2px 8px · Geist Mono 10px uppercase weight 700 letter-spacing 0.06em · bg `rgba(255,255,255,0.95)` + backdrop-blur(8px) · 3 variants: success/warning/error · border 1px status-colour 30% alpha.
**Figma:** new component `Quality score chip`, 3 variants.
**Code:** new `<QualityScoreChip variant="success|warning|error">` React component.

### 4.3 Pulse ring indicator

**What it is:** ambient "something is happening" indicator. Lime dot with expanding ring.
**Spec:** 12×12 dot bg `primary` · `@keyframes pulse-ring` box-shadow 0 → 8px lime fade · 1.6s `easing/pulse` infinite.
**Figma:** new component `Pulse ring` with motion preset.
**Code:** `.pulse-ring` utility class in `genie-tokens.css` + optional `<PulseDot>` wrapper.

### 4.4 Glass surface

**What it is:** floating chrome element with frosted-glass effect.
**Spec:** bg `rgba(255,255,255,0.72)` light / `rgba(22,22,22,0.62)` dark · `backdrop-filter: blur(20px) saturate(140%)` · 1px subtle border · radius `radius/lg` or `radius/card`.
**Figma:** new effect style `Glass surface`. Use Figma's Background Blur.
**Code:** `.glass` utility class.

### 4.5 Lime glow halo

**What it is:** highlight marking "active / selected / focused" element.
**Spec:** composite shadow `0 0 0 1px rgba(195,235,66,0.4)` (1px lime ring) + `0 0 24px rgba(195,235,66,0.18)` (soft corona). Dark mode: 32px corona at 0.25 alpha.
**Figma:** new effect style `Glow halo`.
**Code:** `.glow` utility class.

### 4.6 Hero prompt input

**What it is:** signature large textarea for generation prompts.
**Spec:** radius `radius/2xl` (28px) · 1px border · padding 16-20px · on `:focus-within` apply `shadow/glow` + `::before` pseudo-element with radial-gradient lime backdrop blurred 28px · suggestion pill row below.
**Figma:** new component `Hero prompt input` with focused state variant.
**Code:** new `<HeroPromptInput>` React wrapper around Ant `Input.TextArea` + `.hero-prompt` CSS class with `::before` pseudo-element.

### 4.7 Eyebrow text style

**What it is:** micro-caption above cards / sections for category labels.
**Spec:** Geist Mono 11px / 16px line-height · uppercase · letter-spacing 0.05em · weight 600 · text-tertiary.
**Figma:** new Text Style `eyebrow`.
**Code:** `.eyebrow` utility class.

### 4.8 Dot-grid pattern

**What it is:** background pattern for "empty canvas" / "AI workspace" surfaces.
**Spec:** CSS `background-image: radial-gradient(rgba(15,15,12,0.04) 1px, transparent 1px); background-size: 32px 32px`. Often combined with centered lime radial-gradient.
**Figma:** new fill pattern `Dot grid`. Use Figma's pattern fill.
**Code:** `.dot-grid` utility class.

### 4.9 Lift hover utility

**What it is:** hover treatment lifting cards 2px with shadow upgrade.
**Spec:** transition transform 220ms `easing/standard` + box-shadow 220ms · hover: translateY(-2px) + shadow-sm → shadow-lg.
**Figma:** Smart Animate preset `motion/lift`.
**Code:** `.lift` utility class.

### 4.10 Sheen animation

**What it is:** one-off shine across hero CTA on mount.
**Spec:** `::after` pseudo-element with 90deg linear-gradient highlight · translateX(-120% → 220%) + skewX(-20deg) · 1.4s ease-in-out · fires ONCE.
**Figma:** Smart Animate preset `motion/sheen`.
**Code:** `.sheen` utility class (parent must be `position: relative; overflow: hidden`).

### 4.11 Float idle bob

**What it is:** subtle ambient life on idle hero elements.
**Spec:** translateY(0 → -2px) loop 3s ease-in-out infinite.
**Figma:** Smart Animate preset `motion/float`.
**Code:** `.float` utility class.

### 4.12 Shimmer (custom skeletons)

**What it is:** shimmer animation applicable to any element (not just Ant Skeleton).
**Spec:** bg linear-gradient(90deg, transparent, rgba(195,235,66,0.12), transparent) + background-size 200% 100% · background-position -200% → 200% loop 2.4s linear.
**Figma:** Smart Animate preset `motion/shimmer`.
**Code:** `.shimmer` utility class.

### 4.13 Fade-up entrance

**What it is:** standard mount animation for cards / list items.
**Spec:** opacity 0 → 1 + translateY(+8px → 0) · 360ms `easing/standard`. Often staggered (+60ms per child).
**Figma:** Smart Animate preset `motion/fade-up`.
**Code:** `.fade-up` utility class.

### 4.14 Pop-in entrance

**What it is:** standard mount animation for floating elements (toasts, badges, popovers).
**Spec:** opacity 0 → 1 + scale 0.98 → 1 · 320ms `easing/pop`.
**Figma:** Smart Animate preset `motion/pop-in`.
**Code:** `.pop-in` utility class.

### 4.15 MicroMotif icons (per-mode)

**What it is:** 6 abstract glyph SVGs, one per Genie generation mode.
**Spec:** 32×32 · `currentColor` inheritance · semantic stroke-width. Modes: Brand Ad, Product Ad, Affiliate Ad, UGC Video, Forge, Image-to-Ad.
**Figma:** 6 new icon components, each as a separate variant of a `MicroMotif` master.
**Code:** 6 inline SVG React components inside one `<MicroMotif mode="..." />` wrapper.

---

## 5. Migration order

Apply in this sequence — each step builds on the previous.

1. **Foundation tokens first** — Section 2 (colours, type, spacing, radius, shadows, motion).
   - Designer: replace Variables.
   - Devs: update `ConfigProvider` `theme.token` + add CSS vars in `genie-tokens.css`.

2. **Install Geist + Geist Mono** — across both Figma (link the font in DS file) and code (`@fontsource/geist` or Google Fonts link).

3. **Component changes** — Section 3, in any order. Each row is independent.
   - Designer: re-link components to updated tokens.
   - Devs: add per-component overrides in `theme.components` + global CSS where Ant doesn't expose tokens.

4. **Genie-exclusive patterns** — Section 4, in any order. These are NEW additions.
   - Designer: build 15 new DS components.
   - Devs: implement 5 React wrappers + 11 CSS utility classes (Mono/glass/lift/glow/dot-grid/pulse-ring/pop-in/fade-up/shimmer/sheen/float) + 6 SVG motif components.

5. **Dark mode setup** — apply `[data-theme="dark"]` overrides (both reports cover this in Section G of the older dev list — now folded into Section 2 dark colour entries).

6. **Cross-check** — open `design-system-comparison.html` in a browser. The right-hand "Genie 6.0" column is the visual target. Both Figma + shipped app should match it after migration.

---

## 6. Out of scope

- Comparison against current Figma DS values (designer diffs manually as they apply the new values).
- Ant components NOT used in Genie (DatePicker, TimePicker, Calendar, Steps, etc.) — defaults stay.
- Page-level designs in Figma — only the foundation DS is updated. Page frames auto-pick up the new tokens once components are re-linked.
- Localisation / RTL.
- Accessibility audit (separate task — should be done after sync).
- Performance audit of new motion presets on low-end devices.
- The actual SVG paths for the 6 MicroMotif icons — designer to produce.
