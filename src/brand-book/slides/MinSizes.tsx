import { C } from "../tokens";
import { Mark } from "../components/Mark";
import { Wordmark } from "../components/Wordmark";
import { Lockup } from "../components/Lockup";
import { Mono, Eyebrow, H2, Body } from "../components/TextPrimitives";

export function MinSizes() {
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
