import type { ReactNode } from "react";
import { C } from "../tokens";
import { Mark } from "../components/Mark";
import { Wordmark } from "../components/Wordmark";
import { Lockup } from "../components/Lockup";
import { Mono, Eyebrow, H1, H2, Body } from "../components/TextPrimitives";

// ============================================================
// VARIANTS — the official lockup set
// ============================================================
export function Variants() {
  const Cell = ({ bg, label, children, border }: { bg: string; label: string; children: ReactNode; border?: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: bg, height: 200, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: border || 'none' }}>
        {children}
      </div>
      <Mono style={{ fontSize: 10, color: C.mute, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 10 }}>{label}</Mono>
    </div>
  );
  return (
    <div style={{ background: C.paper, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <Eyebrow>03 · Approved variants</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>Lockups, mark, wordmark.</H2>
        <div style={{ height: 10 }}/>
        <Body>The full-color horizontal lockup on white is primary. All other variants follow.</Body>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: '1fr 1fr', gap: 24 }}>
        <Cell bg={C.paper} label="A · Horizontal · light · PRIMARY" border={`1px solid ${C.line}`}>
          <Lockup height={42} fab={C.ink} fun={C.rich}/>
        </Cell>
        <Cell bg={C.graphite} label="B · Horizontal · dark">
          <Lockup height={42} fab={C.paper} fun={C.lime} ink={C.paper} soft={C.soft} tipInk={C.graphite}/>
        </Cell>
        <Cell bg={C.lime} label="C · Horizontal · lime">
          <Lockup height={42} fab={C.ink} fun={C.ink} ink={C.ink} lime={C.ink} soft={C.ink} mono={C.ink}/>
        </Cell>
        <Cell bg={C.rich} label="D · Horizontal · rich">
          <Lockup height={42} fab={C.paper} fun={C.paper} mono={C.paper}/>
        </Cell>

        <Cell bg={C.paper} label="E · Stacked · light" border={`1px solid ${C.line}`}>
          <Lockup height={26} stack fab={C.ink} fun={C.rich}/>
        </Cell>
        <Cell bg={C.graphite} label="F · Stacked · dark">
          <Lockup height={26} stack fab={C.paper} fun={C.lime} ink={C.paper} soft={C.soft} tipInk={C.graphite}/>
        </Cell>
        <Cell bg={C.paper} label="G · Mark only" border={`1px solid ${C.line}`}>
          <Mark size={120} ink={C.ink} lime={C.lime} soft={C.soft}/>
        </Cell>
        <Cell bg={C.paper} label="H · Wordmark only" border={`1px solid ${C.line}`}>
          <Wordmark height={48} fab={C.ink} fun={C.rich}/>
        </Cell>
      </div>
    </div>
  );
}
