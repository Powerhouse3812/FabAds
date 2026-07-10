/* global React, FF */
const { C, Mark, Wordmark, Lockup } = window.FF;

const Mono = ({ children, style }) => (
  <span style={{ fontFamily: `'Geist Mono', ui-monospace, monospace`, ...style }}>{children}</span>
);
const Eyebrow = ({ children, color = C.mute }) => (
  <Mono style={{ fontSize: 11, letterSpacing: '0.18em', color, textTransform: 'uppercase' }}>{children}</Mono>
);
const H2 = ({ children, color = C.ink }) => (
  <div style={{ fontFamily: `'Geist', sans-serif`, fontWeight: 800, fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.02em', color }}>{children}</div>
);
const Body = ({ children, color = '#3a3a35', max = 720 }) => (
  <div style={{ fontFamily: `'Geist', sans-serif`, fontSize: 15, color, maxWidth: max, lineHeight: 1.6 }}>{children}</div>
);

// ============================================================
// COLOR SYSTEM
// ============================================================
function ColorSystem() {
  const Swatch = ({ hex, name, role, light, codes }) => (
    <div style={{ background: C.paper, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.line}` }}>
      <div style={{ height: 120, background: hex }}/>
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 18, color: C.ink }}>{name}</div>
          <Mono style={{ fontSize: 11, color: C.mute }}>{hex}</Mono>
        </div>
        <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginTop: 6 }}>{role}</Mono>
        <Body max={300} color={C.mute}>{light}</Body>
        {codes && <Mono style={{ fontSize: 10, color: C.muted2, display: 'block', marginTop: 8, lineHeight: 1.6 }}>{codes}</Mono>}
      </div>
    </div>
  );

  return (
    <div style={{ background: C.cream, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <Eyebrow>08 · Color system</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>Two greens. One ink. Held together by paper.</H2>
        <div style={{ height: 10 }}/>
        <Body>Rich is the brand voice. Lime is the accent. Soft-green lives only inside the mark.</Body>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        <Swatch hex={C.rich} name="Rich" role="Primary brand · wordmark"
          light="The voice of the brand. Used on the wordmark, links, accents, buttons."
          codes={`RGB 143 184 33  ·  CMYK 27 0 95 22  ·  PMS 369 C`}/>
        <Swatch hex={C.lime} name="Lime" role="Accent · mark"
          light="High-energy accent. Lives inside the mark and on dark UI as the click-state."
          codes={`RGB 195 235 66  ·  CMYK 22 0 81 0  ·  PMS 374 C`}/>
        <Swatch hex={C.ink} name="Ink" role="Type · banner · spout"
          light="Near-black. Type and structural mark elements."
          codes={`RGB 23 23 23  ·  CMYK 0 0 0 91`}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        <Swatch hex={C.soft}   name="Soft green" role="Mark-only · flow layer" light="Inside the mark only. Never use in UI or type."/>
        <Swatch hex={C.cream}  name="Cream"    role="Surface · warm" light="Default off-white for editorial and book surfaces."/>
        <Swatch hex={C.paper}  name="Paper"    role="Surface · pure" light="UI and product backgrounds."/>
        <Swatch hex={C.graphite} name="Graphite" role="Surface · dark" light="Dashboard, dark mode, hero panels."/>
      </div>

      <div style={{ background: C.paper, borderRadius: 10, padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, border: `1px solid ${C.line}` }}>
        <div>
          <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Rich on white</Mono>
          <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 22, color: C.rich, marginTop: 6 }}>3.6 : 1</div>
          <Body color={C.mute}>AA for large text (≥18pt) and graphics. Use Ink for small body copy.</Body>
        </div>
        <div>
          <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Ink on white</Mono>
          <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 22, color: C.ink, marginTop: 6 }}>16.9 : 1</div>
          <Body color={C.mute}>AAA. Safe for all type sizes.</Body>
        </div>
        <div>
          <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Lime on Graphite</Mono>
          <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 22, color: C.lime, marginTop: 6 }}>11.4 : 1</div>
          <Body color={C.mute}>AAA. Primary accent on dark UI.</Body>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TYPOGRAPHY
// ============================================================
function Typography() {
  return (
    <div style={{ background: C.paper, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <Eyebrow>09 · Typography</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>Geist. One family. Mono accent.</H2>
        <div style={{ height: 10 }}/>
        <Body>Geist 900 for the wordmark and display. Geist 400–500 for UI and body. Geist Mono for codes, eyebrows, and data.</Body>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, flex: 1 }}>
        <div style={{ background: C.cream, borderRadius: 10, padding: 36, display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center' }}>
          <div>
            <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Display · Geist 900</Mono>
            <div style={{ fontFamily: 'Geist', fontWeight: 900, fontSize: 64, lineHeight: 0.95, letterSpacing: '-0.025em', color: C.ink, marginTop: 8 }}>
              Bulk launch. <span style={{ color: C.rich }}>Win the auction.</span>
            </div>
          </div>
          <div>
            <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Heading · Geist 800</Mono>
            <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 28, lineHeight: 1.1, letterSpacing: '-0.02em', color: C.ink, marginTop: 8 }}>
              Performance marketing, automated end-to-end.
            </div>
          </div>
          <div>
            <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Body · Geist 400 / 500</Mono>
            <div style={{ fontFamily: 'Geist', fontSize: 15, lineHeight: 1.6, color: '#3a3a35', marginTop: 8 }}>
              Generate creative variations, launch campaigns in bulk, route budget toward the winners. FabFunnel runs the full ad cycle so your operators can focus on strategy, not spreadsheets.
            </div>
          </div>
          <div>
            <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Data · Geist Mono</Mono>
            <Mono style={{ fontSize: 16, color: C.ink, display: 'block', marginTop: 8 }}>
              ROAS 4.2× &nbsp; CPA $12.40 &nbsp; CTR 3.1%
            </Mono>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { name: 'Geist', weight: 900, role: 'Wordmark · Display', sample: 'Aa Bb 01' },
            { name: 'Geist', weight: 800, role: 'Headings',           sample: 'Aa Bb 01' },
            { name: 'Geist', weight: 500, role: 'Wordmark · funnel',  sample: 'Aa Bb 01' },
            { name: 'Geist', weight: 500, role: 'UI · labels',        sample: 'Aa Bb 01' },
            { name: 'Geist', weight: 400, role: 'Body',               sample: 'Aa Bb 01' },
            { name: 'Geist Mono', weight: 500, role: 'Code · data · eyebrows', sample: 'Aa Bb 01' },
          ].map((f, i) => (
            <div key={i} style={{ background: C.cream, borderRadius: 8, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: f.name, fontWeight: f.weight, fontSize: 16, color: C.ink, letterSpacing: f.weight >= 800 ? '-0.01em' : '0' }}>{f.name} · {f.weight}</div>
                <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2, display: 'block' }}>{f.role}</Mono>
              </div>
              <div style={{ fontFamily: f.name, fontWeight: f.weight, fontSize: 28, color: C.ink, letterSpacing: '-0.01em' }}>{f.sample}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// APP ICONS
// ============================================================
function AppIcons() {
  return (
    <div style={{ background: C.cream, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <Eyebrow>10 · App icons & favicons</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>The mark — never the lockup — for app icons.</H2>
        <div style={{ height: 10 }}/>
        <Body>Always use the full-detail mark, centered, with 14% padding on all sides. Backgrounds approved: Ink, Paper, Rich, Lime.</Body>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, flex: 1, alignItems: 'center' }}>
        {[
          { bg: C.ink,      shadow: '0 30px 60px -20px rgba(0,0,0,0.4)', label: 'iOS · Ink',    markProps: { ink: C.paper, lime: C.lime, soft: C.soft, tipInk: C.ink } },
          { bg: C.rich,     shadow: '0 30px 60px -20px rgba(143,184,33,0.35)', label: 'iOS · Rich',  markProps: { ink: C.paper, lime: C.lime, soft: C.soft, tipInk: C.rich } },
          { bg: C.lime,     shadow: '0 30px 60px -20px rgba(195,235,66,0.35)', label: 'iOS · Lime',  markProps: { ink: C.ink, lime: C.ink, soft: C.ink, mono: C.ink } },
          { bg: C.paper,    shadow: '0 16px 32px -16px rgba(0,0,0,0.15)', label: 'iOS · Paper', border: `1px solid ${C.line}`, markProps: { ink: C.ink, lime: C.lime, soft: C.soft } },
        ].map(t => (
          <div key={t.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 200, height: 200, background: t.bg, borderRadius: 44, boxShadow: t.shadow, border: t.border || 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mark size={130} {...t.markProps}/>
            </div>
            <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t.label}</Mono>
          </div>
        ))}
      </div>

      <div style={{ background: C.paper, borderRadius: 10, padding: 28, border: `1px solid ${C.line}` }}>
        <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Favicons · detail-preserving sizes</Mono>
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 28 }}>
          {[64, 48, 32, 24, 20].map(s => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 4, width: s + 8, height: s + 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mark size={s} ink={C.ink} lime={C.lime} soft={C.soft}/>
              </div>
              <Mono style={{ fontSize: 9, color: C.mute }}>{s}px</Mono>
            </div>
          ))}
          <div style={{ width: 1, alignSelf: 'stretch', background: C.line, margin: '0 8px' }}/>
          <div>
            <Mono style={{ fontSize: 10, color: C.alert, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Below 20px</Mono>
            <Body max={400} color={C.mute}>Use the simplified mono mark (still preserves layered opacity, no detail removed).</Body>
          </div>
        </div>
      </div>
    </div>
  );
}

window.BB3 = { ColorSystem, Typography, AppIcons };
