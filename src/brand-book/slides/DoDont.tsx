import type { ReactNode } from "react";
import { C } from "../tokens";
import { Mark } from "../components/Mark";
import { Wordmark } from "../components/Wordmark";
import { Lockup } from "../components/Lockup";
import { Mono, Eyebrow, H2, Body } from "../components/TextPrimitives";

export function DoDont() {
  const Tile = ({ bg, ok, label, children, border }: { bg: string; ok?: boolean; label: string; children: ReactNode; border?: string }) => (
    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: border || 'none', background: bg, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        width: 22, height: 22, borderRadius: 22,
        background: ok ? C.ok : C.alert,
        color: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Geist', fontWeight: 800, fontSize: 12,
      }}>{ok ? '✓' : '✗'}</div>
      <Mono style={{ position: 'absolute', bottom: 10, left: 14, fontSize: 9, color: ok ? C.ok : C.alert, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>{label}</Mono>
    </div>
  );
  return (
    <div style={{ background: C.cream, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <Eyebrow>06 · Do & don't</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>Detail-first. Always.</H2>
        <div style={{ height: 10 }}/>
        <Body>The six-layer detailing of the mark must remain. Never flatten, recolor inconsistently, or restyle.</Body>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: '1fr 1fr', gap: 16, flex: 1 }}>
        <Tile bg={C.paper} ok label="Correct · full color" border={`1px solid ${C.line}`}>
          <Lockup height={28} fab={C.ink} fun={C.rich}/>
        </Tile>
        <Tile bg={C.graphite} ok label="Correct · dark bg">
          <Lockup height={28} fab={C.paper} fun={C.lime} ink={C.paper} soft={C.soft} tipInk={C.graphite}/>
        </Tile>
        <Tile bg={C.paper} ok label="Correct · mono knockout" border={`1px solid ${C.line}`}>
          {/* mono with opacity steps — detail preserved */}
          <Lockup height={28} fab={C.ink} fun={C.ink} mono={C.ink}/>
        </Tile>
        <Tile bg={C.rich} ok label="Correct · brand bg">
          <Lockup height={28} fab={C.paper} fun={C.paper} mono={C.paper}/>
        </Tile>

        <Tile bg={C.paper} label="Don't flatten the mark" border={`1px solid ${C.line}`}>
          {/* Flat silhouette: render with single fill, NO opacity steps */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
            <Mark size={56} mono={C.ink} monoOpacities={[1,1,1,1,1,1]}/>
            <Wordmark height={28} fab={C.ink} fun={C.rich}/>
          </div>
        </Tile>
        <Tile bg={C.paper} label="Don't recolor parts" border={`1px solid ${C.line}`}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
            <Mark size={56} ink="#FF4DCD" lime="#7B5BFF" soft="#FFC857"/>
            <Wordmark height={28} fab={C.ink} fun={C.rich}/>
          </div>
        </Tile>
        <Tile bg={C.paper} label="Don't stretch or skew" border={`1px solid ${C.line}`}>
          <div style={{ transform: 'scaleX(1.5)', display: 'inline-flex', alignItems: 'center', gap: 16 }}>
            <Mark size={56} ink={C.ink} lime={C.lime} soft={C.soft}/>
            <Wordmark height={28} fab={C.ink} fun={C.rich}/>
          </div>
        </Tile>
        <Tile bg={C.lime} label="Don't place on lime as-is">
          <Lockup height={28} fab={C.ink} fun={C.rich}/>
        </Tile>
      </div>
    </div>
  );
}
