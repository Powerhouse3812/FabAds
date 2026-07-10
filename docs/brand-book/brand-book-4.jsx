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
// IN-CONTEXT · DASHBOARD
// ============================================================
function InContextApp() {
  return (
    <div style={{ background: '#EDEDE5', width: '100%', height: '100%', padding: 56, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
      {/* Dark dashboard */}
      <div style={{ background: C.graphite, borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 40px -20px rgba(0,0,0,0.4)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #2a2a26', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Lockup height={14} fab={C.paper} fun={C.lime} ink={C.paper} soft={C.soft} tipInk={C.graphite}/>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontSize: 11, color: '#888', fontFamily: 'Geist' }}>
            <span style={{ color: C.paper }}>Campaigns</span>
            <span>Creatives</span>
            <span>Audiences</span>
            <span style={{ background: C.lime, color: C.ink, padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>Launch</span>
          </div>
        </div>
        <div style={{ padding: '24px 22px' }}>
          <Mono style={{ fontSize: 9, color: C.lime, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Active · 47</Mono>
          <div style={{ fontFamily: 'Geist', fontWeight: 900, fontSize: 30, color: C.paper, letterSpacing: '-0.025em', marginTop: 10 }}>$184,302 <span style={{ color: C.lime }}>today</span></div>
          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[['ROAS', '4.2×'], ['CPA', '$12.40'], ['CTR', '3.1%']].map(([k, v]) => (
              <div key={k} style={{ background: '#141412', padding: '12px 14px', borderRadius: 8, border: '1px solid #1f1f1c' }}>
                <Mono style={{ fontSize: 9, color: '#666', letterSpacing: '0.12em' }}>{k}</Mono>
                <div style={{ color: C.paper, fontSize: 18, fontWeight: 800, marginTop: 4, fontFamily: 'Geist' }}>{v}</div>
              </div>
            ))}
          </div>
          <svg viewBox="0 0 400 60" style={{ marginTop: 14, width: '100%', height: 60 }}>
            <polyline fill="none" stroke={C.lime} strokeWidth="2" points="0,50 30,42 60,46 90,32 120,36 150,22 180,26 210,16 240,22 270,12 300,18 330,8 360,12 400,4"/>
          </svg>
        </div>
      </div>

      {/* Web landing on light */}
      <div style={{ background: C.paper, borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 40px -20px rgba(0,0,0,0.15)', border: `1px solid ${C.line}` }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Lockup height={14} fab={C.ink} fun={C.rich}/>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontSize: 11, color: '#888', fontFamily: 'Geist' }}>
            <span style={{ color: C.ink }}>Product</span>
            <span>Pricing</span>
            <span>Customers</span>
            <span style={{ background: C.ink, color: C.paper, padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Sign in</span>
          </div>
        </div>
        <div style={{ padding: '40px 22px 32px' }}>
          <Mono style={{ fontSize: 9, color: C.rich, letterSpacing: '0.18em', textTransform: 'uppercase' }}>OS for paid ads</Mono>
          <div style={{ fontFamily: 'Geist', fontWeight: 900, fontSize: 30, color: C.ink, letterSpacing: '-0.025em', marginTop: 10, lineHeight: 1.05 }}>
            Bulk launch.<br/>Automate. <span style={{ color: C.rich }}>Win the auction.</span>
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
            <div style={{ background: C.rich, color: C.paper, padding: '10px 18px', borderRadius: 999, fontSize: 12, fontWeight: 600, fontFamily: 'Geist' }}>Get a demo</div>
            <div style={{ background: 'transparent', color: C.ink, padding: '10px 18px', borderRadius: 999, fontSize: 12, fontWeight: 600, fontFamily: 'Geist', border: `1.5px solid ${C.ink}` }}>See it run</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PRINT — Business cards, letterhead
// ============================================================
function PrintApps() {
  return (
    <div style={{ background: '#EDEDE5', width: '100%', height: '100%', padding: 56, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
      {/* Letterhead */}
      <div style={{ background: C.paper, borderRadius: 8, padding: 36, boxShadow: '0 20px 40px -20px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Lockup height={18} fab={C.ink} fun={C.rich}/>
          <Mono style={{ fontSize: 9, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>fabfunnel.com</Mono>
        </div>
        <div style={{ flex: 1, padding: '32px 0' }}>
          <Mono style={{ fontSize: 9, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>May 11, 2026</Mono>
          <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 22, color: C.ink, letterSpacing: '-0.02em', marginTop: 14 }}>To: Maya Ortega, Head of Performance</div>
          <Body max={520}>
            Welcome to FabFunnel. Your workspace is live. Below you'll find your bulk-launch templates and your first creative batch from the automation queue. Hit us anytime — we ship updates weekly.
          </Body>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
          <Mono style={{ fontSize: 9, color: C.mute, letterSpacing: '0.12em' }}>
            FabFunnel, Inc.  ·  San Francisco, CA<br/>
            hello@fabfunnel.com
          </Mono>
          <Mark size={28} ink={C.ink} lime={C.lime} soft={C.soft}/>
        </div>
      </div>

      {/* Business cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, justifyContent: 'center' }}>
        <div style={{ background: C.graphite, color: C.paper, borderRadius: 8, padding: 22, height: 168, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 16px 32px -16px rgba(0,0,0,0.4)' }}>
          <Mark size={36} ink={C.paper} lime={C.lime} soft={C.soft} tipInk={C.graphite}/>
          <div>
            <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 17 }}>Maya Ortega</div>
            <Mono style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4, display: 'block' }}>Head of Performance · maya@fabfunnel.com</Mono>
          </div>
        </div>
        <div style={{ background: C.rich, color: C.paper, borderRadius: 8, padding: 22, height: 168, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Wordmark height={22} fab={C.paper} fun={C.paper}/>
          <Mono style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
            fabfunnel.com<br/>
            hello@fabfunnel.com<br/>
            San Francisco, CA
          </Mono>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SWAG — t-shirt, sticker, tote
// ============================================================
function Swag() {
  return (
    <div style={{ background: '#EDEDE5', width: '100%', height: '100%', padding: 56, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 28 }}>
      {/* T-shirt */}
      <div style={{ background: C.graphite, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          {/* Embroidery mock — single color thread, but detail preserved with opacity steps */}
          <Mark size={140} mono={C.lime}/>
        </div>
        <div style={{ padding: 18, borderTop: '1px solid #2a2a26' }}>
          <Mono style={{ fontSize: 10, color: '#888', letterSpacing: '0.14em', textTransform: 'uppercase' }}>T-shirt · embroidered</Mono>
          <div style={{ fontFamily: 'Geist', fontWeight: 700, fontSize: 14, color: C.paper, marginTop: 4 }}>Lime thread on graphite · single color, detail intact</div>
        </div>
      </div>
      {/* Sticker */}
      <div style={{ background: C.cream, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ position: 'relative', padding: 24, background: C.paper, borderRadius: 18, boxShadow: '0 8px 20px -8px rgba(0,0,0,0.2)' }}>
            <Lockup height={32} fab={C.ink} fun={C.rich}/>
          </div>
        </div>
        <div style={{ padding: 18, borderTop: `1px solid ${C.line}` }}>
          <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Sticker · die-cut</Mono>
          <div style={{ fontFamily: 'Geist', fontWeight: 700, fontSize: 14, color: C.ink, marginTop: 4 }}>Full color on paper · primary lockup</div>
        </div>
      </div>
      {/* Tote */}
      <div style={{ background: C.rich, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Mark size={140} mono={C.paper}/>
        </div>
        <div style={{ padding: 18, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <Mono style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Tote · screen print</Mono>
          <div style={{ fontFamily: 'Geist', fontWeight: 700, fontSize: 14, color: C.paper, marginTop: 4 }}>White ink on rich · single color, opacity-stepped</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SOCIAL — avatar + OG card
// ============================================================
function Social() {
  return (
    <div style={{ background: '#EDEDE5', width: '100%', height: '100%', padding: 56, display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 28, alignItems: 'center' }}>
      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
        <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase', alignSelf: 'flex-start' }}>Social avatar</Mono>
        <div style={{ width: 240, height: 240, background: C.ink, borderRadius: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px -20px rgba(0,0,0,0.4)' }}>
          <Mark size={140} ink={C.paper} lime={C.lime} soft={C.soft} tipInk={C.ink}/>
        </div>
        <Body color={C.mute} max={240}>Round avatar uses the mark on Ink. Padding tuned so the detailing reads at 32 × 32px.</Body>
      </div>
      {/* OG card */}
      <div>
        <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Open Graph · 1200 × 630</Mono>
        <div style={{ marginTop: 12, aspectRatio: '1200 / 630', background: C.cream, borderRadius: 12, padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 16px 32px -16px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative mark watermark */}
          <div style={{ position: 'absolute', right: -60, bottom: -40, opacity: 0.08 }}>
            <Mark size={420} ink={C.ink} lime={C.ink} soft={C.ink} mono={C.ink}/>
          </div>
          <Lockup height={22} fab={C.ink} fun={C.rich}/>
          <div>
            <Mono style={{ fontSize: 10, color: C.rich, letterSpacing: '0.18em', textTransform: 'uppercase' }}>NEW · BULK LAUNCH</Mono>
            <div style={{ fontFamily: 'Geist', fontWeight: 900, fontSize: 46, lineHeight: 1, letterSpacing: '-0.025em', color: C.ink, marginTop: 10 }}>
              Win the auction.
            </div>
            <Body max={400}>Generate creatives, launch in bulk, route budget toward the winners. FabFunnel runs the cycle.</Body>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FILE INVENTORY — what to download
// ============================================================
function FileInventory() {
  const Row = ({ name, format, use }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr', padding: '14px 18px', borderTop: `1px solid ${C.line}`, alignItems: 'center' }}>
      <Mono style={{ fontSize: 12, color: C.ink }}>{name}</Mono>
      <Mono style={{ fontSize: 11, color: C.rich, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{format}</Mono>
      <div style={{ fontFamily: 'Geist', fontSize: 13, color: C.mute }}>{use}</div>
    </div>
  );
  return (
    <div style={{ background: C.paper, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>14 · File inventory</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>What to ship to vendors.</H2>
        <div style={{ height: 10 }}/>
        <Body>Always send vector first. PNG only for fixed-size raster needs. Every file ships at full detail.</Body>
      </div>
      <div style={{ background: C.cream, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr', padding: '14px 18px', background: C.ink }}>
          <Mono style={{ fontSize: 10, color: C.paper, letterSpacing: '0.14em', textTransform: 'uppercase' }}>File</Mono>
          <Mono style={{ fontSize: 10, color: C.paper, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Format</Mono>
          <Mono style={{ fontSize: 10, color: C.paper, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Use</Mono>
        </div>
        <Row name="logo-primary.svg"          format="SVG · vector"  use="Default. Web, screen, anywhere scalable."/>
        <Row name="logo-primary.pdf"          format="PDF · vector"  use="Print. Stationery, decks, vendor handoff."/>
        <Row name="logo-stacked.svg"          format="SVG · vector"  use="Vertical/square layouts."/>
        <Row name="mark-only.svg"             format="SVG · vector"  use="App icons, avatars, watermarks."/>
        <Row name="wordmark-only.svg"         format="SVG · vector"  use="Type-only contexts."/>
        <Row name="logo-mono-ink.svg"         format="SVG · vector"  use="Single-ink black. Opacity-stepped — detail preserved."/>
        <Row name="logo-mono-white.svg"       format="SVG · vector"  use="White knockout on color or dark surfaces."/>
        <Row name="logo-512.png · 1024.png"   format="PNG · raster"  use="Social avatars, OG, app store."/>
        <Row name="favicon-32.png · 16.png"   format="PNG · raster"  use="Browser favicons. Use mono mark below 20px."/>
      </div>
    </div>
  );
}

window.BB4 = { InContextApp, PrintApps, Swag, Social, FileInventory };
