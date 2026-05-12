import { C } from "../tokens";
import { Mark } from "../components/Mark";
import { Wordmark } from "../components/Wordmark";
import { Lockup } from "../components/Lockup";
import { Mono, Eyebrow, H2, Body } from "../components/TextPrimitives";

export function MonoUsage() {
  return (
    <div style={{ background: C.paper, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <Eyebrow>07 · Monochrome with detail</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>Single color. Detail preserved.</H2>
        <div style={{ height: 10 }}/>
        <Body>When printing in a single ink (embroidery, foil, engraving, screen-print) use the opacity-stepped mark — 100%, 78%, 56% — so the layers stay legible. Never flatten to one solid silhouette.</Body>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        {[
          { bg: C.paper,    fg: C.ink,  label: 'Black on white',   border: `1px solid ${C.line}` },
          { bg: C.graphite, fg: C.paper,label: 'White on ink' },
          { bg: C.rich,     fg: C.paper,label: 'White on rich' },
          { bg: C.lime,     fg: C.ink,  label: 'Ink on lime' },
        ].map(t => (
          <div key={t.label} style={{ background: t.bg, borderRadius: 10, border: t.border || 'none', height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <Mark size={92} mono={t.fg}/>
            <Mono style={{ fontSize: 10, color: t.fg, opacity: 0.7, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{t.label}</Mono>
          </div>
        ))}
      </div>

      <div style={{ background: C.cream, borderRadius: 10, padding: 24, display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: 44, background: C.rich, color: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Geist', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>!</div>
        <div>
          <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 18, color: C.ink }}>Detail rule</div>
          <Body max={900}>For 1-color usage where opacity is impossible (engraving, single-ink stamping), use a stroked outline at 0.5pt between the layers to preserve the funnel notch and flow shape. Never solid-fill the entire silhouette.</Body>
        </div>
      </div>
    </div>
  );
}
