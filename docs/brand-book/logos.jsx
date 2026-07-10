/* global React */
// ============================================================
// FABFUNNEL — FINAL BRAND SYSTEM
// Locked: wordmark Rich #8FB821 · mark detailing PRESERVED at all sizes
// ============================================================

const C = {
  // Brand
  ink:     '#171717',      // near-black for type & primary mark
  paper:   '#FFFFFF',
  warm:    '#F7F7F4',
  cream:   '#FAF9F4',
  graphite:'#1A1A1A',      // dark background
  mute:    '#7A7A75',
  muted2:  '#9A9A93',
  line:    '#E5E5DF',
  // Logo
  lime:    '#C3EB42',      // primary lime accent (mark)
  soft:    '#A8D632',      // mid-green flow (between lime + rich — unifies the two-green family)
  rich:    '#8FB821',      // FUNNEL wordmark · FINAL
  // Functional
  alert:   '#C0312F',
  ok:      '#1B7A3E',
};

// ============================================================
// THE MARK — every path is essential detail and must be preserved.
// Six layered paths build the F-as-funnel:
//   1. Top banner (ink)
//   2. Bottom-left lime wedge (the F's foot)
//   3. Soft-green flow connecting top-left to mid-right (depth)
//   4. Top-left lime flag (the F's top-left corner)
//   5. Black mid-bar tip (the funnel spout outline)
//   6. Lime mid-bar tip overlay (the spout fill — completes the notch)
// In monochrome, we KEEP the detail by separating fills with subtle
// opacity steps so the silhouette never collapses to a flat blob.
// ============================================================
function Mark({
  size = 100,
  // Standard 3-color rendering
  ink = C.ink,            // top banner color (layer 1)
  lime = C.lime,
  soft = C.soft,
  tipInk = null,          // spout-outline color (layer 5) — defaults to ink
  // Mono override — single color; we still preserve detail by varying opacity
  mono = null,
  // For knockout (white-on-dark), pass mono = '#FFFFFF'
  // Layer opacity in mono mode (in this order): banner, wedge, flow, flag, tipBlack, tipLime
  monoOpacities = [1, 0.78, 0.56, 0.78, 1, 0.78],
}) {
  const _tip = tipInk == null ? ink : tipInk;
  const fills = mono
    ? Array(6).fill(mono)
    : [ink, lime, soft, lime, _tip, lime];

  const opacities = mono
    ? monoOpacities
    : [1, 1, 1, 1, 1, 1];

  return (
    <svg
      width={size}
      height={size * 102 / 128}
      viewBox="0 0 128 102"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="FabFunnel"
      role="img"
    >
      {/* 1 · Top banner */}
      <path d="M127.882 4.84577C127.882 6.0199 127.464 7.09453 126.768 7.93035L104.23 34.9453C104.23 34.9453 104.19 34.995 104.161 35.0249C104.151 35.0547 104.121 35.0746 104.111 35.0945C103.225 36.1294 101.902 36.796 100.419 36.796H44.8571L20.6183 8.5373L23.7625 4.85573L24.1307 4.4378C26.5088 1.62188 30.0014 0 33.6829 0H123.026C125.713 0 127.882 2.16916 127.882 4.85573V4.84577Z" fill={fills[0]} fillOpacity={opacities[0]}/>
      {/* 2 · Bottom-left lime wedge */}
      <path d="M49.4939 98.6169L47.683 100.746C47.0063 101.542 46.0013 102 44.9566 102H8.66802C5.99141 102 3.8123 99.8309 3.8123 97.1542C3.8123 95.9801 4.23021 94.9054 4.91678 94.0696L25.2352 70.388L49.4839 98.6069L49.4939 98.6169Z" fill={fills[1]} fillOpacity={opacities[1]}/>
      {/* 3 · Soft-green flow */}
      <path d="M83.663 58.8557L49.4939 98.6169L3.4939 45.0647C3.36455 44.9353 3.23518 44.806 3.12573 44.6468L2.77748 44.2388V44.2089C2.68793 44.1094 2.59837 43.9901 2.51876 43.8707C0.429211 40.9552 2.48892 36.786 6.23022 36.796H44.867L63.7327 58.7264C68.9964 64.8458 78.3794 64.8756 83.673 58.8557Z" fill={fills[2]} fillOpacity={opacities[2]}/>
      {/* 4 · Top-left lime flag */}
      <path d="M44.8571 36.786H6.22025C2.48891 36.786 0.429215 40.9652 2.50882 43.8707C-0.914068 39.612 -0.834461 33.5025 2.74763 29.3333L8.88693 22.1692L20.6183 8.52737L44.8571 36.786Z" fill={fills[3]} fillOpacity={opacities[3]}/>
      {/* 5 · Black mid-bar tip (creates the spout outline — DO NOT REMOVE) */}
      <path d="M87.9018 52.1492C87.9018 53.3234 87.4839 54.398 86.7874 55.2338L83.7824 58.7363C78.3496 64.8855 68.9665 64.8557 63.7128 58.7363L53.8819 47.3035H83.0362C85.7228 47.3035 87.8919 49.4726 87.8919 52.1592Z" fill={fills[4]} fillOpacity={opacities[4]}/>
      {/* 6 · Lime tip overlay (completes the spout — DO NOT REMOVE) */}
      <path d="M87.9018 52.1492C87.9018 53.3234 87.4839 54.398 86.7874 55.2338L83.7824 58.7363C78.3496 64.8855 68.9665 64.8557 63.7128 58.7363L53.8819 47.3035H83.0362C85.7228 47.3035 87.8919 49.4726 87.8919 52.1592Z" fill={fills[5]} fillOpacity={opacities[5]}/>
    </svg>
  );
}

function Wordmark({
  height = 64,
  fab = C.ink,
  fun = C.rich,
  font = `'Geist', sans-serif`,
  fabWeight = 900,
  funWeight = 500,
}) {
  return (
    <span style={{
      fontSize: height,
      lineHeight: 0.95,
      letterSpacing: '-0.02em',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'baseline',
      textTransform: 'uppercase',
      fontFamily: font,
    }}>
      <span style={{ fontWeight: fabWeight, color: fab }}>FAB</span>
      <span style={{ fontWeight: funWeight, color: fun, marginLeft: '0.04em' }}>FUNNEL</span>
    </span>
  );
}

// ============================================================
// LOCKUP — horizontal & stacked, always preserves mark detailing
// ============================================================
function Lockup({ height = 64, fab, fun, lime, soft, ink, tipInk, mono, gap, stack = false }) {
  const markSize = stack ? height * 2.8 : height * 1.55;
  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: stack ? 'column' : 'row',
      alignItems: 'center',
      gap: gap !== undefined ? gap : (stack ? height * 0.45 : height * 0.42),
    }}>
      <Mark size={markSize} lime={lime} soft={soft} ink={ink} tipInk={tipInk} mono={mono}/>
      <Wordmark height={height} fab={fab} fun={fun}/>
    </div>
  );
}

window.FF = { C, Mark, Wordmark, Lockup };
