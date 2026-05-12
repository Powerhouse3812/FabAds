import { C } from "../tokens";
import { Mark } from "../components/Mark";
import { Wordmark } from "../components/Wordmark";
import { Lockup } from "../components/Lockup";
import { Mono, Eyebrow, H2, Body } from "../components/TextPrimitives";

export function Social() {
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
