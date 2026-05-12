import { C } from "../tokens";
import { Mark } from "../components/Mark";
import { Wordmark } from "../components/Wordmark";
import { Lockup } from "../components/Lockup";
import { Mono, Eyebrow, H2, Body } from "../components/TextPrimitives";

export function FileInventory() {
  const Row = ({ name, format, use }: { name: string; format: string; use: string }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr', padding: '14px 18px', borderTop: `1px solid ${C.line}`, alignItems: 'center' }}>
      <Mono style={{ fontSize: 12, color: C.ink }}>{name}</Mono>
      <Mono style={{ fontSize: 11, color: C.rich, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{format}</Mono>
      <div style={{ fontFamily: 'Geist', fontSize: 13, color: C.mute }}>{use}</div>
    </div>
  );
  return (
    <div style={{ background: C.paper, width: '100%', height: '100%', padding: 64, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>14 · File inventory</Eyebrow>
        <div style={{ height: 12 }}/>
        <H2>What to ship to vendors.</H2>
        <div style={{ height: 10 }}/>
        <Body>Always send vector first. PNG only for fixed-size raster needs. Every file ships at full detail.</Body>
      </div>
      <div style={{ background: C.cream, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr', padding: '14px 18px', background: C.ink }}>
          <Mono style={{ fontSize: 10, color: C.paper, letterSpacing: '0.14em', textTransform: 'uppercase' }}>File</Mono>
          <Mono style={{ fontSize: 10, color: C.paper, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Format</Mono>
          <Mono style={{ fontSize: 10, color: C.paper, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Use</Mono>
        </div>
        <Row name="logo-primary.svg"          format="SVG · vector"  use="Default. Web, screen, anywhere scalable."/>
        <Row name="logo-primary.pdf"          format="PDF · vector"  use="Print. Stationery, decks, vendor handoff."/>
        <Row name="logo-stacked.svg"          format="SVG · vector"  use="Vertical/square layouts."/>
        <Row name="mark-only.svg"             format="SVG · vector"  use="App icons, avatars, watermarks."/>
        <Row name="wordmark-only.svg"         format="SVG · vector"  use="Type-only contexts."/>
        <Row name="logo-mono-ink.svg"         format="SVG · vector"  use="Single-ink black. Opacity-stepped — detail preserved."/>
        <Row name="logo-mono-white.svg"       format="SVG · vector"  use="White knockout on color or dark surfaces."/>
        <Row name="logo-512.png · 1024.png"   format="PNG · raster"  use="Social avatars, OG, app store."/>
        <Row name="favicon-32.png · 16.png"   format="PNG · raster"  use="Browser favicons. Use mono mark below 20px."/>
      </div>
    </div>
  );
}
