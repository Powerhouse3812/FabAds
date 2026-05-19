import type { CSSProperties } from "react";
import { C } from "../tokens";
import { Mono, Eyebrow, H2, Body } from "../components/TextPrimitives";

// ============================================================
// TOKEN MIGRATION — 3 of 3 · Status, components, rules
// §6 (3 tokens) + §7 (2 tokens) = 5 token rows + §8 (6 rules)
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
  // §6 — STATUS TEXT (3 re-aliases)
  { section: "§6 · STATUS TEXT", name: "colorErrorText",   path: "Colors/Brand/Error/colorErrorText",     light: { new: "#cf1322 (→ Red/7)",   old: "(→ Red/6)" }, dark: { new: "#f37370 (→ Red/8 dark)",   old: "(→ Red/6)" }, use: "Error text — passes AA body" },
  { section: "§6 · STATUS TEXT", name: "colorWarningText", path: "Colors/Brand/Warning/colorWarningText", light: { new: "#874d00 (→ Gold/9)",  old: "(→ Gold/6)" }, dark: { new: "#d89614 (→ Gold/6)",       old: null },         use: "Warning text — passes AA body" },
  { section: "§6 · STATUS TEXT", name: "colorSuccessText", path: "Colors/Brand/Success/colorSuccessText", light: { new: "#237804 (→ Green/8)", old: "(→ Green/6)" }, dark: { new: "#49aa19 (→ Green/6)",     old: null },         use: "Success text — passes AA body" },

  // §7 — COMPONENT OVERRIDES (2, dark only)
  { section: "§7 · COMPONENT OVERRIDES", name: "Table.headerBg", path: "Components/Table/headerBg", light: { new: "#fafafa", old: null }, dark: { new: "#1e1e23", old: "#1d1d1d" }, use: "Align dark to new colorBgElevated" },
  { section: "§7 · COMPONENT OVERRIDES", name: "Table.footerBg", path: "Components/Table/footerBg", light: { new: "#fafafa", old: null }, dark: { new: "#1e1e23", old: "#1d1d1d" }, use: "Align dark to new colorBgElevated" },
];

// §8 — USAGE RULES
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
        End of migration · v2.0
      </Mono>
    </div>
  );
}

// ------------------------------------------------------------
// Slide
// ------------------------------------------------------------

export function TokensStatus() {
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
        gap: 18,
      }}
    >
      {/* Header */}
      <div>
        <Eyebrow>06 · TOKENS</Eyebrow>
        <div style={{ height: 12 }} />
        <H2>Token Migration · 3 of 3</H2>
        <div style={{ height: 8 }} />
        <Body max={820}>
          Status text (§6), component overrides (§7), and 6 usage rules (§8). 5 tokens + rules.
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

      {/* §8 — USAGE RULES (aside) */}
      <aside
        style={{
          marginTop: 4,
          background: C.paper,
          border: `1px solid ${C.line}`,
          borderRadius: 10,
          padding: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
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
            rowGap: 12,
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
                    fontSize: 12.5,
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
                    fontSize: 11,
                    color: "rgba(0,0,0,0.6)",
                    lineHeight: 1.4,
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

      <Pager active={3} />
    </div>
  );
}

export default TokensStatus;
