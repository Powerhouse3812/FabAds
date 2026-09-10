import { cn } from "@/lib/utils";
import { MODE_SCHEME, MODES, type AlphaMode } from "../data/modes";

/**
 * ModeThumb — a small, STATIC, designed "scene" for one of Studio's six live
 * Ad modes (`group: "now"` in data/modes.ts).
 *
 * Why this exists: the six mode cards on Studio home were reported as easy to
 * miss ("6 modes abhi ignore ho rhe hai, we can make big cards for them and
 * add static thumbnails but related and engaging"). The obvious fix — the
 * photography already in `src/assets/strategies`/`src/assets/templates` — was
 * checked and rejected: every one of those 45 images has AI-generated
 * gibberish text baked in ("Peermium nal seiecabrle", "We Understaind You
 * Need"...). Fine as tiny decorative art elsewhere; plainly readable and
 * broken-looking at hero-card size. So this renders designed, on-brand
 * compositions instead — Tailwind + inline SVG only, and deliberately STILL.
 * Motion on this screen belongs to the Trending row one section below, which
 * plays real bundled footage (`PreviewVideo` + `videoForSeed`); if the Ad
 * cards moved too, the page would lose its one deliberate hierarchy cue and
 * both rows would compete for the same attention.
 *
 * Each composition is semantic (guessable with the title covered), never
 * spells out real words/numbers (abstract placeholder bars only — the exact
 * failure mode the photos shipped), and stays in its own `MODE_SCHEME` tone
 * while carrying a small lime `text-primary`/`bg-primary` touch AT REST — the
 * repo's standing rule (CLAUDE.md's token-traps §1): a screen whose accent
 * lives only in hover/active states reads as dead. Here that touch is one
 * accent shape per composition (a catchlight, a quote mark, a peak-of-trend
 * dot, a "liked" reaction dot, a new-variation badge) rather than a wash,
 * so the six tones stay legible as six different modes and still read as one
 * lime-accented system.
 *
 * Fills its parent (`h-full w-full`) — the parent card owns the box and its
 * `aspect-[2/1]` (see ModeCard in ../screens/StudioHome.tsx). The internal
 * `viewBox` is tuned to that same 2:1 ratio (160x80) so `slice` covers with
 * no crop; if the box ratio ever drifts, `preserveAspectRatio="xMidYMid
 * slice"` still covers cleanly rather than letterboxing. An unrecognised
 * `modeId` — a Mode this file hasn't been taught yet — renders
 * `NeutralThumb`: calm, static, never a crash or a blank box.
 */

function ThumbShell({
  wash,
  className,
  children,
}: {
  wash: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden", wash, className)}>
      <svg
        viewBox="0 0 160 80"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {children}
      </svg>
    </div>
  );
}

/** Product Shoot — a product form on a pedestal under a studio light cone,
 *  with a soft floor shadow and a lime catchlight (the one highlight a real
 *  studio photo would have on the glass/plastic of the product itself). */
function ProductShootThumb({ toneText }: { toneText: string }) {
  return (
    <>
      <g className={toneText} fill="currentColor">
        <path d="M80 4 L44 44 L116 44 Z" opacity={0.14} />
        <ellipse cx="80" cy="68" rx="34" ry="5" opacity={0.16} />
        <rect x="52" y="56" width="56" height="9" rx="2.5" opacity={0.3} />
        <rect x="52" y="54" width="56" height="3" rx="1.5" opacity={0.5} />
        <rect x="65" y="28" width="30" height="27" rx="7" opacity={0.92} />
        <rect x="73" y="18" width="14" height="11" rx="3.5" opacity={0.92} />
      </g>
      <g className="text-primary" fill="currentColor">
        <rect x="66" y="29" width="2.5" height="24" rx="1.25" opacity={0.85} />
        <circle cx="72" cy="34" r="2.2" />
      </g>
    </>
  );
}

/** Brand Ad — a bold wordmark block with two tagline lines, a story-arc
 *  swoosh, and a lime quote mark standing in for brand voice/positioning. */
function BrandAdThumb({ toneText }: { toneText: string }) {
  return (
    <>
      <g className={toneText}>
        <path
          d="M98 14 C 124 24, 124 56, 98 66"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.4}
        />
      </g>
      <g className={toneText} fill="currentColor">
        <rect x="18" y="14" width="66" height="15" rx="4.5" opacity={0.88} />
        <rect x="18" y="34" width="48" height="6" rx="3" opacity={0.35} />
        <rect x="18" y="44" width="34" height="6" rx="3" opacity={0.35} />
      </g>
      <g className="text-primary" fill="currentColor">
        <rect x="120" y="10" width="7" height="9" rx="3" transform="rotate(-10 123.5 14.5)" />
        <rect x="130" y="10" width="7" height="9" rx="3" transform="rotate(-10 133.5 14.5)" />
      </g>
    </>
  );
}

/** Product Ad — a product tile with two description lines, an offer chip,
 *  and a solid CTA bar. Mode's own tone IS lime here, so the composition
 *  reads as the most emphatically "accent" of the six by design, not by
 *  accident — Product Ad is literally the conversion-driven one. */
function ProductAdThumb({ toneText }: { toneText: string }) {
  return (
    <>
      <g className={toneText} fill="currentColor">
        <rect x="14" y="14" width="42" height="42" rx="8" opacity={0.16} />
        <rect x="26" y="24" width="18" height="22" rx="4" opacity={0.75} />
        <rect x="64" y="44" width="42" height="5.5" rx="2.75" opacity={0.32} />
        <rect x="64" y="54" width="30" height="5.5" rx="2.75" opacity={0.32} />
      </g>
      <g className="text-primary" fill="currentColor">
        <rect x="100" y="10" width="26" height="12" rx="6" />
        <rect x="16" y="64" width="128" height="13" rx="6.5" />
      </g>
      <g fill="currentColor" className="text-background">
        <path d="M133 68 L138 70.5 L133 73 Z" opacity={0.9} />
      </g>
    </>
  );
}

/** Performance Ad — a rising bar chart with a trend line, a category chip,
 *  and a lime peak dot marking the tested-angle "winner" the mode chases. */
function PerformanceAdThumb({ toneText }: { toneText: string }) {
  return (
    <>
      <g className={toneText} fill="currentColor">
        <rect x="16" y="8" width="36" height="9" rx="4.5" opacity={0.3} />
        <rect x="24" y="58" width="11" height="14" rx="2.5" opacity={0.4} />
        <rect x="41" y="50" width="11" height="22" rx="2.5" opacity={0.52} />
        <rect x="58" y="40" width="11" height="32" rx="2.5" opacity={0.66} />
        <rect x="75" y="28" width="11" height="44" rx="2.5" opacity={0.82} />
        <rect x="92" y="14" width="11" height="58" rx="2.5" opacity={1} />
      </g>
      <g className={toneText}>
        <path
          d="M29.5 58 L46.5 50 L63.5 40 L80.5 28 L97.5 14"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.55}
        />
      </g>
      <g className="text-primary" fill="currentColor">
        <circle cx="97.5" cy="14" r="3.4" />
      </g>
    </>
  );
}

/** Social — a phone frame holding a feed post (image block + two caption
 *  lines) with a reaction-dot row, one dot lit lime for "liked". */
function SocialThumb({ toneText }: { toneText: string }) {
  return (
    <>
      <g className={toneText}>
        <rect
          x="50" y="6" width="60" height="68" rx="10"
          fill="none" stroke="currentColor" strokeWidth={3} opacity={0.75}
        />
      </g>
      <g className={toneText} fill="currentColor">
        <rect x="55" y="12" width="50" height="56" rx="6" opacity={0.1} />
        <rect x="59" y="16" width="42" height="22" rx="4" opacity={0.55} />
        <rect x="59" y="42" width="34" height="4.5" rx="2.25" opacity={0.32} />
        <rect x="59" y="49" width="20" height="4.5" rx="2.25" opacity={0.32} />
        <circle cx="72" cy="61" r="2.8" opacity={0.4} />
        <circle cx="81" cy="61" r="2.8" opacity={0.4} />
      </g>
      <g className="text-primary" fill="currentColor">
        <circle cx="63" cy="61" r="2.8" />
      </g>
    </>
  );
}

/** Generate Variations — one source frame fanning out into three offset
 *  copies, with a lime "new variation" badge on the front-most copy. */
function GenerateVariationsThumb({ toneText }: { toneText: string }) {
  return (
    <>
      <g className={toneText} fill="currentColor">
        <rect x="90" y="14" width="38" height="48" rx="6" opacity={0.22} transform="rotate(-7 109 38)" />
        <rect x="86" y="17" width="38" height="48" rx="6" opacity={0.36} transform="rotate(-3.5 105 41)" />
        <rect x="82" y="20" width="38" height="48" rx="6" opacity={0.58} />
        <rect x="14" y="16" width="40" height="48" rx="6" opacity={0.94} />
        <rect x="21" y="22" width="27" height="17" rx="3" opacity={0.3} />
        <rect x="21" y="43" width="19" height="5" rx="2.5" opacity={0.4} />
        <rect x="21" y="51" width="13" height="5" rx="2.5" opacity={0.4} />
      </g>
      <g className="text-primary" fill="currentColor">
        <circle cx="110" cy="24" r="5.5" />
      </g>
      <g className="text-background" fill="currentColor">
        <rect x="107.25" y="22.6" width="5.5" height="1.6" rx="0.8" />
        <rect x="109.2" y="20.75" width="1.6" height="5.5" rx="0.8" />
      </g>
    </>
  );
}

/** Calm, static-safe fallback for a live Mode this file hasn't been taught
 *  yet — new Modes land in data/modes.ts over time and must still render a
 *  complete card here, not a hole or a crash. */
function NeutralThumb() {
  return (
    <>
      <g className="text-muted-foreground" fill="currentColor">
        <rect x="46" y="20" width="52" height="40" rx="7" opacity={0.18} />
        <rect x="58" y="32" width="28" height="16" rx="4" opacity={0.35} />
      </g>
      <g className="text-primary" fill="currentColor">
        <circle cx="100" cy="24" r="3" opacity={0.9} />
      </g>
    </>
  );
}

export function ModeThumb({
  modeId,
  className,
}: {
  modeId: AlphaMode;
  className?: string;
}) {
  const mode = MODES.find((m) => m.id === modeId);
  const scheme = mode ? MODE_SCHEME[mode.tone] : undefined;
  const wash = scheme?.wash ?? "bg-muted/30";
  const toneText = scheme?.text ?? "text-muted-foreground";

  let content: React.ReactNode;
  switch (modeId) {
    case "product-shoot":
      content = <ProductShootThumb toneText={toneText} />;
      break;
    case "brand-ad":
      content = <BrandAdThumb toneText={toneText} />;
      break;
    case "product-ad":
      content = <ProductAdThumb toneText={toneText} />;
      break;
    case "performance-ad":
      content = <PerformanceAdThumb toneText={toneText} />;
      break;
    case "social":
      content = <SocialThumb toneText={toneText} />;
      break;
    case "generate-variations":
      content = <GenerateVariationsThumb toneText={toneText} />;
      break;
    default:
      content = <NeutralThumb />;
  }

  return (
    <ThumbShell wash={wash} className={className}>
      {content}
    </ThumbShell>
  );
}
