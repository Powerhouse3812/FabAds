import type { CSSProperties } from "react";
import { C } from "../tokens";
import { Mono, Eyebrow, H2, Body } from "../components/TextPrimitives";

// ============================================================
// TOKEN MIGRATION — 1 of 3 · Primary palette + brand control
// §1 (10 tokens) + §2 (1 token) = 11 token rows
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
  { section: "§1 · PRIMARY PALETTE", name: "fab-funnel/6",  path: "Colors/Base/fab-funnel/6",  light: { new: "#8FB821", old: "#c3eb42" }, dark: { new: "#90BA24", old: "#a9cb3b" }, use: "THE brand color — primary button fill" },
  { section: "§1 · PRIMARY PALETTE", name: "fab-funnel/7",  path: "Colors/Base/fab-funnel/7",  light: { new: "#749818", old: "#9cc42d" }, dark: { new: "#AACF38", old: "#c8e064" }, use: "colorPrimaryBorder light / Hover dark" },
  { section: "§1 · PRIMARY PALETTE", name: "fab-funnel/8",  path: "Colors/Base/fab-funnel/8",  light: { new: "#5B7611", old: "#779e1c" }, dark: { new: "#C3E165", old: "#e3f392" }, use: "colorPrimaryActive light / Border + Text dark" },
  { section: "§1 · PRIMARY PALETTE", name: "fab-funnel/9",  path: "Colors/Base/fab-funnel/9",  light: { new: "#3F530A", old: "#557810" }, dark: { new: "#D9EF92", old: "#f0f8bd" }, use: "Reserved (extra-dark)" },
  { section: "§1 · PRIMARY PALETTE", name: "fab-funnel/10", path: "Colors/Base/fab-funnel/10", light: { new: "#283506", old: "#37520a" }, dark: { new: "#EAFACE", old: "#fafee7" }, use: "Reserved (extra-dark)" },

  // §2 — BRAND CONTROL (1)
  { section: "§2 · BRAND CONTROL", name: "controlOutline", path: "Colors/Brand/Control/controlOutline", light: { new: "#8FB821 @10%", old: "#c3eb42 @10%" }, dark: { new: "#1D2A09", old: "#232915" }, use: "Input focus outline glow" },
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
        continued · §3 surfaces →
      </Mono>
    </div>
  );
}

// ------------------------------------------------------------
// Slide
// ------------------------------------------------------------

export function TokensPrimary() {
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
        <H2>Token Migration · 1 of 3</H2>
        <div style={{ height: 8 }} />
        <Body max={820}>
          Primary palette (§1) and brand control (§2). 11 tokens · cascades to ~930 component tokens.
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

      <Pager active={1} />
    </div>
  );
}

export default TokensPrimary;
