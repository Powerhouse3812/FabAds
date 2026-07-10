/* global React, FF */
// Brand book sections — split across files to keep them small.

const { C, Mark, Wordmark, Lockup } = window.FF;

const Mono = ({ children, style }) => (
  <span style={{ fontFamily: `'Geist Mono', ui-monospace, monospace`, ...style }}>{children}</span>
);

const Eyebrow = ({ children, color = C.mute }) => (
  <Mono style={{ fontSize: 11, letterSpacing: '0.18em', color, textTransform: 'uppercase' }}>{children}</Mono>
);

const H1 = ({ children, color = C.ink, max = 1100 }) => (
  <div style={{ fontFamily: `'Geist', sans-serif`, fontWeight: 900, fontSize: 72, lineHeight: 0.95, letterSpacing: '-0.025em', color, maxWidth: max }}>{children}</div>
);

const H2 = ({ children, color = C.ink }) => (
  <div style={{ fontFamily: `'Geist', sans-serif`, fontWeight: 800, fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.02em', color }}>{children}</div>
);

const Body = ({ children, color = '#3a3a35', max = 720 }) => (
  <div style={{ fontFamily: `'Geist', sans-serif`, fontSize: 15, color, maxWidth: max, lineHeight: 1.6 }}>{children}</div>
);

// ============================================================
// COVER
// ============================================================
function Cover() {
  return (
    <div style={{ background: C.cream, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Lockup height={28} fab={C.ink} fun={C.rich}/>
        <Mono style={{ fontSize: 11, letterSpacing: '0.18em', color: C.mute, textTransform: 'uppercase' }}>Brand Identity · v1.0 · 2026</Mono>
      </div>

      <div>
        <Eyebrow color={C.ink}>FabFunnel · Brand Asset Book</Eyebrow>
        <div style={{ height: 24 }}/>
        <H1>
          One mark.<br/>
          <span style={{ color: C.rich }}>One green.</span><br/>
          Built to <span style={{ color: C.rich }}>convert.</span>
        </H1>
        <div style={{ height: 28 }}/>
        <Body max={820}>
          This book locks the FabFunnel identity. The mark and wordmark are final — every layer, color and proportion documented here is intentional. The detailing inside the F-as-funnel must remain visible at every scale, on every surface, in every color.
        </Body>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        {[
          ['01', 'Logo system', 'Mark, wordmark, lockups'],
          ['02', 'Usage rules', 'Clear space, sizes, misuse'],
          ['03', 'Color & type', 'Palette, hierarchy, pairings'],
          ['04', 'In context', 'App, web, print, swag'],
        ].map(([n, t, s]) => (
          <div key={n} style={{ borderTop: `1px solid ${C.ink}`, paddingTop: 14 }}>
            <Mono style={{ fontSize: 11, color: C.mute }}>{n}</Mono>
            <div style={{ fontFamily: 'Geist', fontWeight: 700, fontSize: 18, color: C.ink, marginTop: 6 }}>{t}</div>
            <Mono style={{ fontSize: 10, color: C.mute, marginTop: 4, display: 'block' }}>{s}</Mono>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// HERO LOCKUP — the canonical, primary brand asset
// ============================================================
function HeroLockup() {
  return (
    <div style={{ background: C.paper, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Eyebrow>01 · The Primary Lockup</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
        <Lockup height={130} fab={C.ink} fun={C.rich}/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, paddingTop: 24, borderTop: `1px solid ${C.line}` }}>
        <div>
          <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Wordmark</Mono>
          <div style={{ marginTop: 6 }}><Body max={400}>Geist 900 (FAB) + Geist 500 (FUNNEL). Tracked −2%.</Body></div>
        </div>
        <div>
          <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Funnel color</Mono>
          <div style={{ marginTop: 6 }}><Body max={400}><b style={{ color: C.rich }}>Rich #8FB821</b> · the locked brand green. AA-compliant on white for display sizes.</Body></div>
        </div>
        <div>
          <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Mark</Mono>
          <div style={{ marginTop: 6 }}><Body max={400}>Six-layer F-funnel · ink, lime, soft-green. Detail required at all scales.</Body></div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ANATOMY — the layers of the mark, every detail labeled
// ============================================================
function Anatomy() {
  const layers = [
    { n: '1', name: 'Top banner', color: C.ink, swatch: C.ink, note: 'Ink. Top crossbar of the F.' },
    { n: '2', name: 'Bottom wedge', color: C.lime, swatch: C.lime, note: 'Lime. F-foot, anchors the base.' },
    { n: '3', name: 'Flow', color: C.soft, swatch: C.soft, note: 'Soft green. Connects top to spout — gives the mark depth.' },
    { n: '4', name: 'Top flag', color: C.lime, swatch: C.lime, note: 'Lime. Completes the F-top corner.' },
    { n: '5', name: 'Spout outline', color: C.ink, swatch: C.ink, note: 'Ink. Defines the funnel spout notch — critical detail.' },
    { n: '6', name: 'Spout fill', color: C.lime, swatch: C.lime, note: 'Lime overlay. Fills the spout — completes the funnel read.' },
  ];
  return (
    <div style={{ background: C.cream, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <Eyebrow>02 · Mark anatomy</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>Six layers. Every one essential.</H2>
        <div style={{ height: 10 }}/>
        <Body>Removing or simplifying any layer breaks the silhouette. In monochrome we preserve detail with opacity steps — never by collapsing layers.</Body>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 48, alignItems: 'center' }}>
        <div style={{ background: C.paper, borderRadius: 12, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: '100%' }}>
          <Mark size={360} ink={C.ink} lime={C.lime} soft={C.soft}/>
          {/* Numbered call-outs */}
          {[
            { n: '1', top: '6%',  left: '60%' },
            { n: '2', top: '78%', left: '14%' },
            { n: '3', top: '52%', left: '32%' },
            { n: '4', top: '24%', left: '18%' },
            { n: '5', top: '44%', left: '74%' },
            { n: '6', top: '54%', left: '82%' },
          ].map(p => (
            <div key={p.n} style={{
              position: 'absolute', top: p.top, left: p.left,
              width: 26, height: 26, borderRadius: 26,
              background: C.rich, color: C.paper,
              fontFamily: 'Geist', fontWeight: 800, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>{p.n}</div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {layers.map(l => (
            <div key={l.n} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: C.paper, borderRadius: 8, border: `1px solid ${C.line}` }}>
              <div style={{ width: 28, height: 28, borderRadius: 28, background: C.rich, color: C.paper, fontFamily: 'Geist', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{l.n}</div>
              <div style={{ width: 22, height: 22, background: l.swatch, borderRadius: 4, border: l.swatch === C.paper ? `1px solid ${C.line}` : 'none', flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Geist', fontWeight: 700, fontSize: 14, color: C.ink }}>{l.name}</div>
                <div style={{ fontFamily: 'Geist', fontSize: 12, color: C.mute, marginTop: 2 }}>{l.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VARIANTS — the official lockup set
// ============================================================
function Variants() {
  const Cell = ({ bg, label, children, border }) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: bg, height: 200, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: border || 'none' }}>
        {children}
      </div>
      <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 10 }}>{label}</Mono>
    </div>
  );
  return (
    <div style={{ background: C.paper, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <Eyebrow>03 · Approved variants</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>Lockups, mark, wordmark.</H2>
        <div style={{ height: 10 }}/>
        <Body>The full-color horizontal lockup on white is primary. All other variants follow.</Body>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: '1fr 1fr', gap: 24 }}>
        <Cell bg={C.paper} label="A · Horizontal · light · PRIMARY" border={`1px solid ${C.line}`}>
          <Lockup height={42} fab={C.ink} fun={C.rich}/>
        </Cell>
        <Cell bg={C.graphite} label="B · Horizontal · dark">
          <Lockup height={42} fab={C.paper} fun={C.lime} ink={C.paper} soft={C.soft} tipInk={C.graphite}/>
        </Cell>
        <Cell bg={C.lime} label="C · Horizontal · lime">
          <Lockup height={42} fab={C.ink} fun={C.ink} ink={C.ink} lime={C.ink} soft={C.ink} mono={C.ink}/>
        </Cell>
        <Cell bg={C.rich} label="D · Horizontal · rich">
          <Lockup height={42} fab={C.paper} fun={C.paper} mono={C.paper}/>
        </Cell>

        <Cell bg={C.paper} label="E · Stacked · light" border={`1px solid ${C.line}`}>
          <Lockup height={26} stack fab={C.ink} fun={C.rich}/>
        </Cell>
        <Cell bg={C.graphite} label="F · Stacked · dark">
          <Lockup height={26} stack fab={C.paper} fun={C.lime} ink={C.paper} soft={C.soft} tipInk={C.graphite}/>
        </Cell>
        <Cell bg={C.paper} label="G · Mark only" border={`1px solid ${C.line}`}>
          <Mark size={120} ink={C.ink} lime={C.lime} soft={C.soft}/>
        </Cell>
        <Cell bg={C.paper} label="H · Wordmark only" border={`1px solid ${C.line}`}>
          <Wordmark height={48} fab={C.ink} fun={C.rich}/>
        </Cell>
      </div>
    </div>
  );
}

window.BB1 = { Cover, HeroLockup, Anatomy, Variants };
