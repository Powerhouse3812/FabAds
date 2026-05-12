import { C } from "../tokens";
import { Mark } from "../components/Mark";
import { Wordmark } from "../components/Wordmark";
import { Lockup } from "../components/Lockup";
import { Mono, Eyebrow, H2, Body } from "../components/TextPrimitives";

// ============================================================
// COLOR SYSTEM
// ============================================================
export function ColorSystem() {
  const Swatch = ({ hex, name, role, light, codes }: { hex: string; name: string; role: string; light: string; codes?: string }) => (
    <div style={{ background: C.paper, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.line}` }}>
      <div style={{ height: 120, background: hex }}/>
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 18, color: C.ink }}>{name}</div>
          <Mono style={{ fontSize: 11, color: C.mute }}>{hex}</Mono>
        </div>
        <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginTop: 6 }}>{role}</Mono>
        <Body max={300} color={C.mute}>{light}</Body>
        {codes && <Mono style={{ fontSize: 10, color: C.muted2, display: 'block', marginTop: 8, lineHeight: 1.6 }}>{codes}</Mono>}
      </div>
    </div>
  );

  return (
    <div style={{ background: C.cream, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <Eyebrow>08 · Color system</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>Two greens. One ink. Held together by paper.</H2>
        <div style={{ height: 10 }}/>
        <Body>Rich is the brand voice. Lime is the accent. Soft-green lives only inside the mark.</Body>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        <Swatch hex={C.rich} name="Rich" role="Primary brand · wordmark"
          light="The voice of the brand. Used on the wordmark, links, accents, buttons."
          codes={`RGB 143 184 33  ·  CMYK 27 0 95 22  ·  PMS 369 C`}/>
        <Swatch hex={C.lime} name="Lime" role="Accent · mark"
          light="High-energy accent. Lives inside the mark and on dark UI as the click-state."
          codes={`RGB 195 235 66  ·  CMYK 22 0 81 0  ·  PMS 374 C`}/>
        <Swatch hex={C.ink} name="Ink" role="Type · banner · spout"
          light="Near-black. Type and structural mark elements."
          codes={`RGB 23 23 23  ·  CMYK 0 0 0 91`}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        <Swatch hex={C.soft}   name="Soft green" role="Mark-only · flow layer" light="Inside the mark only. Never use in UI or type."/>
        <Swatch hex={C.cream}  name="Cream"    role="Surface · warm" light="Default off-white for editorial and book surfaces."/>
        <Swatch hex={C.paper}  name="Paper"    role="Surface · pure" light="UI and product backgrounds."/>
        <Swatch hex={C.graphite} name="Graphite" role="Surface · dark" light="Dashboard, dark mode, hero panels."/>
      </div>

      <div style={{ background: C.paper, borderRadius: 10, padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, border: `1px solid ${C.line}` }}>
        <div>
          <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Rich on white</Mono>
          <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 22, color: C.rich, marginTop: 6 }}>3.6 : 1</div>
          <Body color={C.mute}>AA for large text (≥18pt) and graphics. Use Ink for small body copy.</Body>
        </div>
        <div>
          <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Ink on white</Mono>
          <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 22, color: C.ink, marginTop: 6 }}>16.9 : 1</div>
          <Body color={C.mute}>AAA. Safe for all type sizes.</Body>
        </div>
        <div>
          <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Lime on Graphite</Mono>
          <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 22, color: C.lime, marginTop: 6 }}>11.4 : 1</div>
          <Body color={C.mute}>AAA. Primary accent on dark UI.</Body>
        </div>
      </div>
    </div>
  );
}
