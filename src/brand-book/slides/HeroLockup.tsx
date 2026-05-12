import { C } from "../tokens";
import { Mark } from "../components/Mark";
import { Wordmark } from "../components/Wordmark";
import { Lockup } from "../components/Lockup";
import { Mono, Eyebrow, H1, H2, Body } from "../components/TextPrimitives";

// ============================================================
// HERO LOCKUP — the canonical, primary brand asset
// ============================================================
export function HeroLockup() {
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
