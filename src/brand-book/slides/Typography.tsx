import { C } from "../tokens";
import { Mark } from "../components/Mark";
import { Wordmark } from "../components/Wordmark";
import { Lockup } from "../components/Lockup";
import { Mono, Eyebrow, H2, Body } from "../components/TextPrimitives";

// ============================================================
// TYPOGRAPHY
// ============================================================
export function Typography() {
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
