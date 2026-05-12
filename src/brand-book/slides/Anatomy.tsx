import { C } from "../tokens";
import { Mark } from "../components/Mark";
import { Wordmark } from "../components/Wordmark";
import { Lockup } from "../components/Lockup";
import { Mono, Eyebrow, H1, H2, Body } from "../components/TextPrimitives";

// ============================================================
// ANATOMY — the layers of the mark, every detail labeled
// ============================================================
export function Anatomy() {
  const layers: { n: string; name: string; color: string; swatch: string; note: string }[] = [
    { n: '1', name: 'Top banner', color: C.ink, swatch: C.ink, note: 'Ink. Top crossbar of the F.' },
    { n: '2', name: 'Bottom wedge', color: C.lime, swatch: C.lime, note: 'Lime. F-foot, anchors the base.' },
    { n: '3', name: 'Flow', color: C.soft, swatch: C.soft, note: 'Soft green. Connects top to spout — gives the mark depth.' },
    { n: '4', name: 'Top flag', color: C.lime, swatch: C.lime, note: 'Lime. Completes the F-top corner.' },
    { n: '5', name: 'Spout outline', color: C.ink, swatch: C.ink, note: 'Ink. Defines the funnel spout notch — critical detail.' },
    { n: '6', name: 'Spout fill', color: C.lime, swatch: C.lime, note: 'Lime overlay. Fills the spout — completes the funnel read.' },
  ];
  return (
    <div style={{ background: C.cream, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <Eyebrow>02 · Mark anatomy</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>Six layers. Every one essential.</H2>
        <div style={{ height: 10 }}/>
        <Body>Removing or simplifying any layer breaks the silhouette. In monochrome we preserve detail with opacity steps — never by collapsing layers.</Body>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 48, alignItems: 'center' }}>
        <div style={{ background: C.paper, borderRadius: 12, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: '100%' }}>
          <Mark size={360} ink={C.ink} lime={C.lime} soft={C.soft}/>
          {/* Numbered call-outs */}
          {([
            { n: '1', top: '6%',  left: '60%' },
            { n: '2', top: '78%', left: '14%' },
            { n: '3', top: '52%', left: '32%' },
            { n: '4', top: '24%', left: '18%' },
            { n: '5', top: '44%', left: '74%' },
            { n: '6', top: '54%', left: '82%' },
          ] as { n: string; top: string; left: string }[]).map(p => (
            <div key={p.n} style={{
              position: 'absolute', top: p.top, left: p.left,
              width: 26, height: 26, borderRadius: 26,
              background: C.rich, color: C.paper,
              fontFamily: 'Geist', fontWeight: 800, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>{p.n}</div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {layers.map(l => (
            <div key={l.n} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: C.paper, borderRadius: 8, border: `1px solid ${C.line}` }}>
              <div style={{ width: 28, height: 28, borderRadius: 28, background: C.rich, color: C.paper, fontFamily: 'Geist', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{l.n}</div>
              <div style={{ width: 22, height: 22, background: l.swatch, borderRadius: 4, border: l.swatch === C.paper ? `1px solid ${C.line}` : 'none', flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Geist', fontWeight: 700, fontSize: 14, color: C.ink }}>{l.name}</div>
                <div style={{ fontFamily: 'Geist', fontSize: 12, color: C.mute, marginTop: 2 }}>{l.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
