import { C } from "../tokens";
import { Mark } from "../components/Mark";
import { Wordmark } from "../components/Wordmark";
import { Lockup } from "../components/Lockup";
import { Mono, Eyebrow, H2, Body } from "../components/TextPrimitives";

export function ClearSpace() {
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
