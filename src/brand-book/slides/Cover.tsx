import { C } from "../tokens";
import { Mark } from "../components/Mark";
import { Wordmark } from "../components/Wordmark";
import { Lockup } from "../components/Lockup";
import { Mono, Eyebrow, H1, H2, Body } from "../components/TextPrimitives";

// ============================================================
// COVER
// ============================================================
export function Cover() {
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
        {([
          ['01', 'Logo system', 'Mark, wordmark, lockups'],
          ['02', 'Usage rules', 'Clear space, sizes, misuse'],
          ['03', 'Color & type', 'Palette, hierarchy, pairings'],
          ['04', 'In context', 'App, web, print, swag'],
        ] as const).map(([n, t, s]) => (
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
