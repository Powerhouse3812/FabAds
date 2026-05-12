import type { ComponentProps } from "react";
import { C } from "../tokens";
import { Mark } from "../components/Mark";
import { Wordmark } from "../components/Wordmark";
import { Lockup } from "../components/Lockup";
import { Mono, Eyebrow, H2, Body } from "../components/TextPrimitives";

// ============================================================
// APP ICONS
// ============================================================
export function AppIcons() {
  const tiles: { bg: string; shadow: string; label: string; border?: string; markProps: Partial<ComponentProps<typeof Mark>> }[] = [
    { bg: C.ink,      shadow: '0 30px 60px -20px rgba(0,0,0,0.4)', label: 'iOS · Ink',    markProps: { ink: C.paper, lime: C.lime, soft: C.soft, tipInk: C.ink } },
    { bg: C.rich,     shadow: '0 30px 60px -20px rgba(143,184,33,0.35)', label: 'iOS · Rich',  markProps: { ink: C.paper, lime: C.lime, soft: C.soft, tipInk: C.rich } },
    { bg: C.lime,     shadow: '0 30px 60px -20px rgba(195,235,66,0.35)', label: 'iOS · Lime',  markProps: { ink: C.ink, lime: C.ink, soft: C.ink, mono: C.ink } },
    { bg: C.paper,    shadow: '0 16px 32px -16px rgba(0,0,0,0.15)', label: 'iOS · Paper', border: `1px solid ${C.line}`, markProps: { ink: C.ink, lime: C.lime, soft: C.soft } },
  ];

  return (
    <div style={{ background: C.cream, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <Eyebrow>10 · App icons & favicons</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>The mark — never the lockup — for app icons.</H2>
        <div style={{ height: 10 }}/>
        <Body>Always use the full-detail mark, centered, with 14% padding on all sides. Backgrounds approved: Ink, Paper, Rich, Lime.</Body>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, flex: 1, alignItems: 'center' }}>
        {tiles.map(t => (
          <div key={t.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 200, height: 200, background: t.bg, borderRadius: 44, boxShadow: t.shadow, border: t.border || 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mark size={130} {...t.markProps}/>
            </div>
            <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t.label}</Mono>
          </div>
        ))}
      </div>

      <div style={{ background: C.paper, borderRadius: 10, padding: 28, border: `1px solid ${C.line}` }}>
        <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Favicons · detail-preserving sizes</Mono>
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 28 }}>
          {[64, 48, 32, 24, 20].map(s => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 4, width: s + 8, height: s + 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mark size={s} ink={C.ink} lime={C.lime} soft={C.soft}/>
              </div>
              <Mono style={{ fontSize: 9, color: C.mute }}>{s}px</Mono>
            </div>
          ))}
          <div style={{ width: 1, alignSelf: 'stretch', background: C.line, margin: '0 8px' }}/>
          <div>
            <Mono style={{ fontSize: 10, color: C.alert, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Below 20px</Mono>
            <Body max={400} color={C.mute}>Use the simplified mono mark (still preserves layered opacity, no detail removed).</Body>
          </div>
        </div>
      </div>
    </div>
  );
}
