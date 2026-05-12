import { C } from "../tokens";
import { Mark } from "../components/Mark";
import { Wordmark } from "../components/Wordmark";
import { Lockup } from "../components/Lockup";
import { Mono, Eyebrow, H2, Body } from "../components/TextPrimitives";

export function PrintApps() {
  return (
    <div style={{ background: '#EDEDE5', width: '100%', height: '100%', padding: 56, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
      {/* Letterhead */}
      <div style={{ background: C.paper, borderRadius: 8, padding: 36, boxShadow: '0 20px 40px -20px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Lockup height={18} fab={C.ink} fun={C.rich}/>
          <Mono style={{ fontSize: 9, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>fabfunnel.com</Mono>
        </div>
        <div style={{ flex: 1, padding: '32px 0' }}>
          <Mono style={{ fontSize: 9, color: C.mute, letterSpacing: '0.14em', textTransform: 'uppercase' }}>May 11, 2026</Mono>
          <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 22, color: C.ink, letterSpacing: '-0.02em', marginTop: 14 }}>To: Maya Ortega, Head of Performance</div>
          <Body max={520}>
            Welcome to FabFunnel. Your workspace is live. Below you'll find your bulk-launch templates and your first creative batch from the automation queue. Hit us anytime — we ship updates weekly.
          </Body>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
          <Mono style={{ fontSize: 9, color: C.mute, letterSpacing: '0.12em' }}>
            FabFunnel, Inc.  ·  San Francisco, CA<br/>
            hello@fabfunnel.com
          </Mono>
          <Mark size={28} ink={C.ink} lime={C.lime} soft={C.soft}/>
        </div>
      </div>

      {/* Business cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, justifyContent: 'center' }}>
        <div style={{ background: C.graphite, color: C.paper, borderRadius: 8, padding: 22, height: 168, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 16px 32px -16px rgba(0,0,0,0.4)' }}>
          <Mark size={36} ink={C.paper} lime={C.lime} soft={C.soft} tipInk={C.graphite}/>
          <div>
            <div style={{ fontFamily: 'Geist', fontWeight: 800, fontSize: 17 }}>Maya Ortega</div>
            <Mono style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4, display: 'block' }}>Head of Performance · maya@fabfunnel.com</Mono>
          </div>
        </div>
        <div style={{ background: C.rich, color: C.paper, borderRadius: 8, padding: 22, height: 168, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Wordmark height={22} fab={C.paper} fun={C.paper}/>
          <Mono style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
            fabfunnel.com<br/>
            hello@fabfunnel.com<br/>
            San Francisco, CA
          </Mono>
        </div>
      </div>
    </div>
  );
}
