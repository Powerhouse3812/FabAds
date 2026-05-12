import { C } from "../tokens";
import { Mark } from "../components/Mark";
import { Wordmark } from "../components/Wordmark";
import { Lockup } from "../components/Lockup";
import { Mono, Eyebrow, H2, Body } from "../components/TextPrimitives";

export function InContextApp() {
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
            {([['ROAS', '4.2×'], ['CPA', '$12.40'], ['CTR', '3.1%']] as const).map(([k, v]) => (
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
