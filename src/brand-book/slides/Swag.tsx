import { C } from "../tokens";
import { Mark } from "../components/Mark";
import { Wordmark } from "../components/Wordmark";
import { Lockup } from "../components/Lockup";
import { Mono, Eyebrow, H2, Body } from "../components/TextPrimitives";

export function Swag() {
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
