import type { CSSProperties } from "react";
import { C } from "../tokens";
import { Mono, Eyebrow, H2, Body } from "../components/TextPrimitives";

// ============================================================
// TOKEN MIGRATION — v2.0
// 25 token updates across 7 sections + 6 usage rules
// ============================================================

type ColorState = { new: string; old: string | null };

type Tok = {
  section: string;
  name: string;
  path: string;
  light: ColorState;
  dark: ColorState;
  use: string;
  isNew?: boolean;
};

const TOKENS: Tok[] = [
  // §1 — PRIMARY PALETTE (10 updates)
  { section: "§1 · PRIMARY PALETTE", name: "fab-funnel/1",  path: "Colors/Base/fab-funnel/1",  light: { new: "#F5FBE2", old: "#fefff0" }, dark: { new: "#1D2A09", old: "#232915" }, use: "Lime-tinted surface bg / selected item bg" },
  { section: "§1 · PRIMARY PALETTE", name: "fab-funnel/2",  path: "Colors/Base/fab-funnel/2",  light: { new: "#EBF6BF", old: "#fdffeb" }, dark: { new: "#2C3F10", old: "#36401a" }, use: "Selected item hover bg" },
  { section: "§1 · PRIMARY PALETTE", name: "fab-funnel/3",  path: "Colors/Base/fab-funnel/3",  light: { new: "#DAED90", old: "#f7ffc2" }, dark: { new: "#3F5519", old: "#495522" }, use: "No longer aliased to colorPrimaryBorder" },
  { section: "§1 · PRIMARY PALETTE", name: "fab-funnel/4",  path: "Colors/Base/fab-funnel/4",  light: { new: "#C5E25A", old: "#eeff99" }, dark: { new: "#577222", old: "#637529" }, use: "colorPrimaryBorderHover (slider only)" },
  { section: "§1 · PRIMARY PALETTE", name: "fab-funnel/5",  path: "Colors/Base/fab-funnel/5",  light: { new: "#AACF32", old: "#dcf76d" }, dark: { new: "#75932D", old: "#86a032" }, use: "colorPrimaryHover light / Active dark" },
  { section: "§1 · PRIMARY PALETTE", name: "fab-funnel/6",  path: "Colors/Base/fab-funnel/6",  light: { new: "#8FB821", old: "#c3eb42" }, dark: { new: "#90BA24", old: "#a9cb3b" }, use: "THE brand color — primary button fill", isNew: false },
  { section: "§1 · PRIMARY PALETTE", name: "fab-funnel/7",  path: "Colors/Base/fab-funnel/7",  light: { new: "#749818", old: "#9cc42d" }, dark: { new: "#AACF38", old: "#c8e064" }, use: "colorPrimaryBorder light / Hover dark" },
  { section: "§1 · PRIMARY PALETTE", name: "fab-funnel/8",  path: "Colors/Base/fab-funnel/8",  light: { new: "#5B7611", old: "#779e1c" }, dark: { new: "#C3E165", old: "#e3f392" }, use: "colorPrimaryActive light / Border + Text dark" },
  { section: "§1 · PRIMARY PALETTE", name: "fab-funnel/9",  path: "Colors/Base/fab-funnel/9",  light: { new: "#3F530A", old: "#557810" }, dark: { new: "#D9EF92", old: "#f0f8bd" }, use: "Reserved (extra-dark)" },
  { section: "§1 · PRIMARY PALETTE", name: "fab-funnel/10", path: "Colors/Base/fab-funnel/10", light: { new: "#283506", old: "#37520a" }, dark: { new: "#EAFACE", old: "#fafee7" }, use: "Reserved (extra-dark)" },

  // §2 — BRAND CONTROL (1)
  { section: "§2 · BRAND CONTROL", name: "controlOutline", path: "Colors/Brand/Control/controlOutline", light: { new: "#8FB821 @10%", old: "#c3eb42 @10%" }, dark: { new: "#1D2A09", old: "#232915" }, use: "Input focus outline glow" },

  // §3 — BACKGROUND TOKENS (5, incl. 1 new)
  { section: "§3 · BACKGROUND TOKENS", name: "colorBgLayout",    path: "Colors/Neutral/Bg/colorBgLayout",    light: { new: "#f4f4f5", old: "#f5f5f5" }, dark: { new: "#141416", old: "#181818" }, use: "App shell / page background" },
  { section: "§3 · BACKGROUND TOKENS", name: "colorBgBase",      path: "Colors/Neutral/Bg/colorBgBase",      light: { new: "#FAFAF7", old: "#ffffff" }, dark: { new: "#18181b", old: "#121212" }, use: "Main content surfaces (cards, panels)" },
  { section: "§3 · BACKGROUND TOKENS", name: "colorBgElevated",  path: "Colors/Neutral/Bg/colorBgElevated",  light: { new: "#ffffff", old: null },      dark: { new: "#1e1e23", old: "#1f1f1f" }, use: "Modals, dropdowns, floating UI" },
  { section: "§3 · BACKGROUND TOKENS", name: "colorBgSubtle",    path: "Colors/Neutral/Bg/colorBgSubtle",    light: { new: "#F0F0EC", old: null },      dark: { new: "#1B1B1F", old: null },      use: "Subdued sub-surfaces — table headers, wells", isNew: true },
  { section: "§3 · BACKGROUND TOKENS", name: "colorBgSpotlight", path: "Colors/Neutral/Bg/colorBgSpotlight", light: { new: "#000 @85%", old: null },    dark: { new: "#2c2c34", old: "#424242" }, use: "Tooltips, spotlight overlays" },

  // §4 — TEXT ALPHA (1)
  { section: "§4 · TEXT ALPHA", name: "colorTextTertiary", path: "Colors/Neutral/Text/colorTextTertiary", light: { new: "#000 @55%", old: "#000 @45%" }, dark: { new: "#fff @55%", old: "#fff @45%" }, use: "Now passes AA body in light mode (4.55:1)" },

  // §5 — PRIMARY SEMANTIC (3 re-aliases + 1 new)
  { section: "§5 · PRIMARY SEMANTIC", name: "colorPrimaryBorder", path: "Colors/Brand/Primary/colorPrimaryBorder", light: { new: "#749818 (→ fab-funnel/7)", old: "(→ fab-funnel/3)" }, dark: { new: "#C3E165 (→ fab-funnel/8)", old: "(→ fab-funnel/3)" }, use: "Default primary border — passes 3:1" },
  { section: "§5 · PRIMARY SEMANTIC", name: "colorPrimaryActive", path: "Colors/Brand/Primary/colorPrimaryActive", light: { new: "#5B7611 (→ fab-funnel/8)", old: "(→ fab-funnel/7)" }, dark: { new: "#75932D (→ fab-funnel/5)", old: null }, use: "Shifted to /8 to avoid border clash" },
  { section: "§5 · PRIMARY SEMANTIC", name: "colorPrimaryText",   path: "Colors/Brand/Primary/colorPrimaryText",   light: { new: "#5B7611 (→ fab-funnel/8)", old: null }, dark: { new: "#C3E165 (→ fab-funnel/8)", old: null }, use: "Lime as text/border — passes AA at 4.97:1", isNew: true },

  // §6 — STATUS TEXT (3 re-aliases)
  { section: "§6 · STATUS TEXT", name: "colorErrorText",   path: "Colors/Brand/Error/colorErrorText",     light: { new: "#cf1322 (→ Red/7)",   old: "(→ Red/6)" }, dark: { new: "#f37370 (→ Red/8 dark)",   old: "(→ Red/6)" }, use: "Error text — passes AA body" },
  { section: "§6 · STATUS TEXT", name: "colorWarningText", path: "Colors/Brand/Warning/colorWarningText", light: { new: "#874d00 (→ Gold/9)",  old: "(→ Gold/6)" }, dark: { new: "#d89614 (→ Gold/6)",       old: null },         use: "Warning text — passes AA body" },
  { section: "§6 · STATUS TEXT", name: "colorSuccessText", path: "Colors/Brand/Success/colorSuccessText", light: { new: "#237804 (→ Green/8)", old: "(→ Green/6)" }, dark: { new: "#49aa19 (→ Green/6)",     old: null },         use: "Success text — passes AA body" },

  // §7 — COMPONENT OVERRIDES (2, dark only)
  { section: "§7 · COMPONENT OVERRIDES", name: "Table.headerBg", path: "Components/Table/headerBg", light: { new: "#fafafa", old: null }, dark: { new: "#1e1e23", old: "#1d1d1d" }, use: "Align dark to new colorBgElevated" },
  { section: "§7 · COMPONENT OVERRIDES", name: "Table.footerBg", path: "Components/Table/footerBg", light: { new: "#fafafa", old: null }, dark: { new: "#1e1e23", old: "#1d1d1d" }, use: "Align dark to new colorBgElevated" },
];

// §8 — USAGE RULES (rendered as a separate aside, not as token rows)
type Rule = { id: string; title: string; detail: string };
const RULES: Rule[] = [
  { id: "R1", title: "Lime button text",          detail: "Primary fill buttons MUST use dark text (#121212). Never white on lime — fails 2.32:1; dark passes 8.07:1." },
  { id: "R2", title: "Status color split",        detail: "colorError* = FILL only · colorErrorText* = TEXT only. Never base status as standalone text on light bg." },
  { id: "R3", title: "Lime as text/border",       detail: "Use colorPrimaryText (not colorPrimary). #8FB821 as text fails AA; #5B7611 passes 4.97:1 in light, #C3E165 11.29:1 in dark." },
  { id: "R4", title: "Tertiary text",             detail: "Now usable for body, paragraph copy, metadata, hints (passes AA body). Maintains clear gap from Secondary." },
  { id: "R5", title: "Border philosophy",         detail: "colorBorder intentionally subtle (~1.4-1.8:1). State communication via label + fill + focus, not border. Use colorPrimaryBorder when 3:1 UI is critical." },
  { id: "R6", title: "Intentional hex collisions", detail: "Light: colorPrimaryActive = colorPrimaryText (#5B7611). Dark: colorPrimaryBorder = colorPrimaryText (#C3E165). Different properties, no visual conflict." },
];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

// Extract a renderable backgroundColor from a value string.
// Handles: "#8FB821 (→ fab-funnel/8)", "#000 @85%", "#fff @55%", plain hex.
function swatchFill(raw: string): string {
  // Plain hex prefix
  const hexMatch = raw.match(/^#[0-9A-Fa-f]{3,8}/);
  if (!hexMatch) return "#cccccc";
  const hex = hexMatch[0];

  // Alpha annotation like "#000 @55%" or "#fff @85%"
  const alphaMatch = raw.match(/@\s*(\d+(?:\.\d+)?)\s*%/);
  if (alphaMatch) {
    const a = Math.max(0, Math.min(100, parseFloat(alphaMatch[1]))) / 100;
    const rgb = hexToRgb(hex);
    if (rgb) return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
  }
  return hex;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 && h.length !== 8) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b };
}

// Group tokens by section while preserving insertion order.
function groupBySection(toks: Tok[]): { section: string; rows: Tok[] }[] {
  const order: string[] = [];
  const map = new Map<string, Tok[]>();
  for (const t of toks) {
    if (!map.has(t.section)) {
      map.set(t.section, []);
      order.push(t.section);
    }
    map.get(t.section)!.push(t);
  }
  return order.map((s) => ({ section: s, rows: map.get(s)! }));
}

// ------------------------------------------------------------
// Sub-components (inline-style, matching brand-book convention)
// ------------------------------------------------------------

const monoFamily = `'Geist Mono', ui-monospace, monospace`;
const sansFamily = `'Geist', sans-serif`;

const NewPill = () => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      marginLeft: 6,
      padding: "1px 6px",
      borderRadius: 999,
      background: "rgba(143, 184, 33, 0.15)",
      color: C.rich,
      fontFamily: monoFamily,
      fontSize: 8.5,
      fontWeight: 600,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      lineHeight: "14px",
    }}
  >
    New
  </span>
);

function SwatchCell({
  mode,
  color,
}: {
  mode: "light" | "dark";
  color: ColorState;
}) {
  const fill = swatchFill(color.new);
  const isDark = mode === "dark";
  const frameBg = isDark ? "#18181b" : "transparent";
  const ringColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: isDark ? "4px 6px" : "4px 0",
        background: frameBg,
        borderRadius: 6,
        minWidth: 0,
      }}
    >
      <div
        style={{
          height: 22,
          width: 22,
          borderRadius: 5,
          background: fill,
          boxShadow: `inset 0 0 0 1px ${ringColor}`,
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
        <span
          style={{
            fontFamily: monoFamily,
            fontSize: 10.5,
            fontWeight: 600,
            color: isDark ? "#FAFAF7" : C.ink,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 220,
          }}
        >
          {color.new}
        </span>
        {color.old && (
          <span
            style={{
              fontFamily: monoFamily,
              fontSize: 9.5,
              color: isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.40)",
              textDecoration: "line-through",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 220,
              marginTop: 1,
            }}
          >
            {color.old}
          </span>
        )}
      </div>
    </div>
  );
}

const colHeaderStyle: CSSProperties = {
  fontFamily: monoFamily,
  fontSize: 9.5,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(0,0,0,0.45)",
};

const rowGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.35fr 1.2fr 1.2fr 1.45fr",
  alignItems: "center",
  columnGap: 16,
  padding: "9px 12px",
  borderTop: `1px solid ${C.line}`,
};

// ------------------------------------------------------------
// Slide
// ------------------------------------------------------------

export function TokensSlide() {
  const groups = groupBySection(TOKENS);

  return (
    <div
      style={{
        background: C.cream,
        width: "100%",
        height: "100%",
        padding: 56,
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      {/* Header */}
      <div>
        <Eyebrow>06 · Tokens</Eyebrow>
        <div style={{ height: 12 }} />
        <H2>Token migration · v2.0</H2>
        <div style={{ height: 8 }} />
        <Body max={820}>
          Primary <Mono style={{ fontSize: 13, color: C.ink }}>#c3eb42 → #8FB821</Mono> · 25 token updates across 7 sections, plus 6 usage rules. Each row shows the new value with the prior value struck through. Light and Dark are tracked independently.
        </Body>
      </div>

      {/* Token groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {groups.map((grp, gIdx) => (
          <div key={grp.section} style={{ marginTop: gIdx === 0 ? 0 : 14 }}>
            {/* Section header */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Mono
                style={{
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(0,0,0,0.62)",
                  fontWeight: 600,
                }}
              >
                {grp.section} — {grp.rows.length} {grp.rows.length === 1 ? "update" : "updates"}
              </Mono>
              <Mono style={{ fontSize: 10, color: C.muted2 }}>
                {grp.rows.filter((r) => r.isNew).length > 0
                  ? `incl. ${grp.rows.filter((r) => r.isNew).length} new`
                  : ""}
              </Mono>
            </div>

            {/* Column header row */}
            <div
              style={{
                ...rowGrid,
                borderTop: "none",
                padding: "6px 12px",
                background: "rgba(0,0,0,0.025)",
                borderRadius: 6,
              }}
            >
              <div style={colHeaderStyle}>Token</div>
              <div style={colHeaderStyle}>Light</div>
              <div style={colHeaderStyle}>Dark</div>
              <div style={colHeaderStyle}>Usage</div>
            </div>

            {/* Token rows */}
            <div
              style={{
                background: C.paper,
                border: `1px solid ${C.line}`,
                borderRadius: 8,
                overflow: "hidden",
                marginTop: 4,
              }}
            >
              {grp.rows.map((tok, rIdx) => (
                <div
                  key={tok.name}
                  style={{
                    ...rowGrid,
                    borderTop: rIdx === 0 ? "none" : `1px solid ${C.line}`,
                  }}
                >
                  {/* Token name + path */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                      <Mono
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: C.ink,
                        }}
                      >
                        {tok.name}
                      </Mono>
                      {tok.isNew && <NewPill />}
                    </div>
                    <Mono
                      style={{
                        fontSize: 9.5,
                        color: "rgba(0,0,0,0.45)",
                        display: "block",
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {tok.path}
                    </Mono>
                  </div>

                  {/* Light */}
                  <SwatchCell mode="light" color={tok.light} />

                  {/* Dark */}
                  <SwatchCell mode="dark" color={tok.dark} />

                  {/* Usage */}
                  <div
                    style={{
                      fontFamily: sansFamily,
                      fontSize: 11,
                      lineHeight: 1.35,
                      color: "rgba(0,0,0,0.65)",
                    }}
                  >
                    {tok.use}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* §8 — USAGE RULES (aside) */}
      <aside
        style={{
          marginTop: 8,
          background: C.paper,
          border: `1px solid ${C.line}`,
          borderRadius: 10,
          padding: 22,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <Mono
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(0,0,0,0.62)",
              fontWeight: 600,
            }}
          >
            §8 · Usage rules — 6 rules
          </Mono>
          <Mono style={{ fontSize: 10, color: C.muted2 }}>non-negotiable</Mono>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 24,
            rowGap: 14,
          }}
        >
          {RULES.map((rule) => (
            <div key={rule.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span
                style={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 28,
                  height: 22,
                  padding: "0 8px",
                  borderRadius: 999,
                  background: C.ink,
                  color: C.lime,
                  fontFamily: monoFamily,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                }}
              >
                {rule.id}
              </span>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: sansFamily,
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.ink,
                    lineHeight: 1.3,
                  }}
                >
                  {rule.title}
                </div>
                <div
                  style={{
                    fontFamily: sansFamily,
                    fontSize: 11.5,
                    color: "rgba(0,0,0,0.6)",
                    lineHeight: 1.45,
                    marginTop: 3,
                  }}
                >
                  {rule.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default TokensSlide;
