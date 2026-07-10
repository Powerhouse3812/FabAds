/* global React, FF, BB1 */
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
// CLEAR SPACE
// ============================================================
function ClearSpace() {
  // X = height of the lime tip (right end of the mid-bar)
  // In our viewBox, that piece is ~12px tall; we'll demo with 14px units.
  const X = 26;
  return (
    <div style={{ background: C.cream, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <Eyebrow>04 · Clear space</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>Always leave at least <span style={{ color: C.rich }}>X</span> of room.</H2>
        <div style={{ height: 10 }}/>
        <Body>X equals the height of the lime spout tip in the mark. No other element — text, edge, image — may enter this zone.</Body>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', padding: X, background: C.paper, borderRadius: 10 }}>
          {/* Clear-space frame */}
          <div style={{ position: 'absolute', inset: 0, border: `1.5px dashed ${C.rich}`, opacity: 0.55, borderRadius: 10, pointerEvents: 'none' }}/>
          {/* Inner mark zone outline */}
          <div style={{ position: 'absolute', top: X, left: X, right: X, bottom: X, border: `1px dotted ${C.muted2}`, opacity: 0.5, pointerEvents: 'none' }}/>
          {/* X markers */}
          <Mono style={{ position: 'absolute', top: X/2 - 6, left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: C.rich, fontWeight: 700 }}>X</Mono>
          <Mono style={{ position: 'absolute', bottom: X/2 - 6, left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: C.rich, fontWeight: 700 }}>X</Mono>
          <Mono style={{ position: 'absolute', left: X/2 - 6, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: C.rich, fontWeight: 700 }}>X</Mono>
          <Mono style={{ position: 'absolute', right: X/2 - 6, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: C.rich, fontWeight: 700 }}>X</Mono>
          <Lockup height={60} fab={C.ink} fun={C.rich}/>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
        {[
          ['Padding', 'Min X on every side'],
          ['Alignment', 'Anchor to mark baseline'],
          ['Crowding', 'No images or shapes inside the X frame'],
        ].map(([k, v]) => (
          <div key={k} style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
            <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{k}</Mono>
            <Body max={300}>{v}</Body>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MINIMUM SIZES & SCALE
// ============================================================
function MinSizes() {
  return (
    <div style={{ background: C.paper, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <Eyebrow>05 · Minimum sizes & scale</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>The detailing must remain visible.</H2>
        <div style={{ height: 10 }}/>
        <Body>If the spout notch on the mid-bar disappears, the mark is too small. Use the floors below.</Body>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
        <div style={{ background: C.cream, borderRadius: 10, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <Mark size={20} ink={C.ink} lime={C.lime} soft={C.soft}/>
          <div style={{ textAlign: 'center' }}>
            <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Mark · digital floor</Mono>
            <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 20, color: C.rich, marginTop: 4 }}>20 px</div>
          </div>
        </div>
        <div style={{ background: C.cream, borderRadius: 10, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <Lockup height={14} fab={C.ink} fun={C.rich}/>
          <div style={{ textAlign: 'center' }}>
            <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Lockup · digital floor</Mono>
            <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 20, color: C.rich, marginTop: 4 }}>14 px wordmark</div>
          </div>
        </div>
        <div style={{ background: C.cream, borderRadius: 10, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <Lockup height={20} fab={C.ink} fun={C.rich}/>
          <div style={{ textAlign: 'center' }}>
            <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Lockup · print floor</Mono>
            <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 20, color: C.rich, marginTop: 4 }}>18 px (≈ 6 pt)</div>
          </div>
        </div>
      </div>

      <div>
        <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Scale reference</Mono>
        <div style={{ marginTop: 18, background: C.cream, borderRadius: 10, padding: '40px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {[200, 120, 72, 48, 32, 24, 20, 16].map(s => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity: s < 20 ? 0.6 : 1 }}>
              <Mark size={s} ink={C.ink} lime={C.lime} soft={C.soft}/>
              <Mono style={{ fontSize: 9, color: s < 20 ? C.alert : C.mute, letterSpacing: '0.06em' }}>{s}px {s < 20 ? '· avoid' : ''}</Mono>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DO & DON'T
// ============================================================
function DoDont() {
  const Tile = ({ bg, ok, label, children, border }) => (
    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: border || 'none', background: bg, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        width: 22, height: 22, borderRadius: 22,
        background: ok ? C.ok : C.alert,
        color: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Geist', fontWeight: 800, fontSize: 12,
      }}>{ok ? '✓' : '✗'}</div>
      <Mono style={{ position: 'absolute', bottom: 10, left: 14, fontSize: 9, color: ok ? C.ok : C.alert, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>{label}</Mono>
    </div>
  );
  return (
    <div style={{ background: C.cream, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <Eyebrow>06 · Do & don't</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>Detail-first. Always.</H2>
        <div style={{ height: 10 }}/>
        <Body>The six-layer detailing of the mark must remain. Never flatten, recolor inconsistently, or restyle.</Body>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: '1fr 1fr', gap: 16, flex: 1 }}>
        <Tile bg={C.paper} ok label="Correct · full color" border={`1px solid ${C.line}`}>
          <Lockup height={28} fab={C.ink} fun={C.rich}/>
        </Tile>
        <Tile bg={C.graphite} ok label="Correct · dark bg">
          <Lockup height={28} fab={C.paper} fun={C.lime} ink={C.paper} soft={C.soft} tipInk={C.graphite}/>
        </Tile>
        <Tile bg={C.paper} ok label="Correct · mono knockout" border={`1px solid ${C.line}`}>
          {/* mono with opacity steps — detail preserved */}
          <Lockup height={28} fab={C.ink} fun={C.ink} mono={C.ink}/>
        </Tile>
        <Tile bg={C.rich} ok label="Correct · brand bg">
          <Lockup height={28} fab={C.paper} fun={C.paper} mono={C.paper}/>
        </Tile>

        <Tile bg={C.paper} label="Don't flatten the mark" border={`1px solid ${C.line}`}>
          {/* Flat silhouette: render with single fill, NO opacity steps */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
            <Mark size={56} mono={C.ink} monoOpacities={[1,1,1,1,1,1]}/>
            <Wordmark height={28} fab={C.ink} fun={C.rich}/>
          </div>
        </Tile>
        <Tile bg={C.paper} label="Don't recolor parts" border={`1px solid ${C.line}`}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
            <Mark size={56} ink="#FF4DCD" lime="#7B5BFF" soft="#FFC857"/>
            <Wordmark height={28} fab={C.ink} fun={C.rich}/>
          </div>
        </Tile>
        <Tile bg={C.paper} label="Don't stretch or skew" border={`1px solid ${C.line}`}>
          <div style={{ transform: 'scaleX(1.5)', display: 'inline-flex', alignItems: 'center', gap: 16 }}>
            <Mark size={56} ink={C.ink} lime={C.lime} soft={C.soft}/>
            <Wordmark height={28} fab={C.ink} fun={C.rich}/>
          </div>
        </Tile>
        <Tile bg={C.lime} label="Don't place on lime as-is">
          <Lockup height={28} fab={C.ink} fun={C.rich}/>
        </Tile>
      </div>
    </div>
  );
}

// ============================================================
// MONO USAGE — detailed even when single-color
// ============================================================
function MonoUsage() {
  return (
    <div style={{ background: C.paper, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <Eyebrow>07 · Monochrome with detail</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>Single color. Detail preserved.</H2>
        <div style={{ height: 10 }}/>
        <Body>When printing in a single ink (embroidery, foil, engraving, screen-print) use the opacity-stepped mark — 100%, 78%, 56% — so the layers stay legible. Never flatten to one solid silhouette.</Body>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        {[
          { bg: C.paper,    fg: C.ink,  label: 'Black on white',   border: `1px solid ${C.line}` },
          { bg: C.graphite, fg: C.paper,label: 'White on ink' },
          { bg: C.rich,     fg: C.paper,label: 'White on rich' },
          { bg: C.lime,     fg: C.ink,  label: 'Ink on lime' },
        ].map(t => (
          <div key={t.label} style={{ background: t.bg, borderRadius: 10, border: t.border || 'none', height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <Mark size={92} mono={t.fg}/>
            <Mono style={{ fontSize: 10, color: t.fg, opacity: 0.7, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{t.label}</Mono>
          </div>
        ))}
      </div>

      <div style={{ background: C.cream, borderRadius: 10, padding: 24, display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: 44, background: C.rich, color: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>!</div>
        <div>
          <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 18, color: C.ink }}>Detail rule</div>
          <Body max={900}>For 1-color usage where opacity is impossible (engraving, single-ink stamping), use a stroked outline at 0.5pt between the layers to preserve the funnel notch and flow shape. Never solid-fill the entire silhouette.</Body>
        </div>
      </div>
    </div>
  );
}

window.BB2 = { ClearSpace, MinSizes, DoDont, MonoUsage };
