import type { CSSProperties } from "react";
import { C } from "../tokens";
import { Mono, Eyebrow, H2, Body } from "../components/TextPrimitives";

// ============================================================
// TOKEN MIGRATION — 2 of 3 · Surfaces, text alpha, semantic
// §3 (5 tokens) + §4 (1 token) + §5 (3 tokens) = 9 token rows
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
];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function swatchFill(raw: string): string {
  const hexMatch = raw.match(/^#[0-9A-Fa-f]{3,8}/);
  if (!hexMatch) return "#cccccc";
  const hex = hexMatch[0];

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
// Sub-components
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
// Pager footer
// ------------------------------------------------------------

function Pager({ active }: { active: 1 | 2 | 3 }) {
  const items: { n: 1 | 2 | 3; label: string }[] = [
    { n: 1, label: "primary" },
    { n: 2, label: "surfaces" },
    { n: 3, label: "status" },
  ];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        marginTop: "auto",
        paddingTop: 8,
      }}
    >
      {items.map((it) => {
        const isActive = it.n === active;
        return (
          <Mono
            key={it.n}
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: isActive ? C.rich : "rgba(0,0,0,0.40)",
              fontWeight: isActive ? 700 : 500,
              borderBottom: isActive ? `2px solid ${C.lime}` : "2px solid transparent",
              paddingBottom: 2,
            }}
          >
            {it.n} · {it.label}
          </Mono>
        );
      })}
      <Mono
        style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(0,0,0,0.40)",
          marginLeft: "auto",
        }}
      >
        continued · §6 status →
      </Mono>
    </div>
  );
}

// ------------------------------------------------------------
// Slide
// ------------------------------------------------------------

export function TokensSurfaces() {
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
        <Eyebrow>06 · TOKENS</Eyebrow>
        <div style={{ height: 12 }} />
        <H2>Token Migration · 2 of 3</H2>
        <div style={{ height: 8 }} />
        <Body max={820}>
          Surfaces (§3), text alpha (§4), and primary semantic aliases (§5). 9 tokens · 2 new tokens introduced.
        </Body>
      </div>

      {/* Token groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {groups.map((grp, gIdx) => (
          <div key={grp.section} style={{ marginTop: gIdx === 0 ? 0 : 14 }}>
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

                  <SwatchCell mode="light" color={tok.light} />
                  <SwatchCell mode="dark" color={tok.dark} />

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

      <Pager active={2} />
    </div>
  );
}

export default TokensSurfaces;
