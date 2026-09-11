import { cn } from "@/lib/utils";
import type { AlphaMode } from "../data/modes";

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
 * failure mode the photos shipped).
 *
 * Colour history (read before "fixing" this again): this used to give each
 * composition its own `MODE_SCHEME` tone — a full-bleed tinted `wash` behind
 * saturated tone-coloured shapes. That worked at the old small-icon-tile
 * scale; at full hero-card scale, six large, differently-hued cards side by
 * side was called out by the product owner as "too much colors in it,
 * creating distraction for user" (2026-09-10) — six competing hues with no
 * hierarchy, the eye has nowhere to land. So the six now share ONE calm
 * neutral ground and NEUTRAL structural shapes (`text-foreground` at varying
 * opacities for near/far and emphasis, no hue at all), and keep exactly ONE
 * lime `text-primary`/`bg-primary` accent shape each — a catchlight, a quote
 * mark, an offer chip + CTA bar, a peak-of-trend dot, a "liked" reaction dot,
 * a new-variation badge — per the repo's standing rule (CLAUDE.md's
 * token-traps §1): a screen whose accent lives only in hover/active states
 * reads as dead, so lime must still show up at rest. Differentiation across
 * the six now comes from composition/silhouette (plus the small tone-coloured
 * icon chip the parent card renders over this artwork, `MODE_SCHEME[tone]` in
 * `StudioHome.tsx` — untouched by this file) rather than from six big colour
 * fields.
 *
 * Fills its parent (`h-full w-full`) — the parent card owns the box and its
 * `aspect-[2/1]` (see ModeCard in ../screens/StudioHome.tsx). The internal
 * `viewBox` is tuned to that same 2:1 ratio (160x80) so `slice` covers with
 * no crop; if the box ratio ever drifts, `preserveAspectRatio="xMidYMid
 * slice"` still covers cleanly rather than letterboxing. An unrecognised
 * `modeId` — a Mode this file hasn't been taught yet — renders
 * `NeutralThumb`: calm, static, never a crash or a blank box.
 */

/** Shared neutral ground for all six compositions — replaces the old
 *  per-tone `wash`. Built from `bg-muted`/`bg-background` only, no hue. */
const NEUTRAL_GROUND = "bg-gradient-to-br from-muted/70 via-muted/35 to-background";

/** Shared neutral class for structural shapes — replaces the old per-tone
 *  `text-{tone}-600`. Depth/emphasis comes from each shape's own opacity. */
const NEUTRAL = "text-foreground";

function ThumbShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden", NEUTRAL_GROUND, className)}>
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
function ProductShootThumb() {
  return (
    <>
      <g className={NEUTRAL} fill="currentColor">
        <path d="M80 4 L44 44 L116 44 Z" opacity={0.08} />
        <ellipse cx="80" cy="68" rx="34" ry="5" opacity={0.1} />
        <rect x="52" y="56" width="56" height="9" rx="2.5" opacity={0.18} />
        <rect x="52" y="54" width="56" height="3" rx="1.5" opacity={0.28} />
        <rect x="65" y="28" width="30" height="27" rx="7" opacity={0.8} />
        <rect x="73" y="18" width="14" height="11" rx="3.5" opacity={0.8} />
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
function BrandAdThumb() {
  return (
    <>
      <g className={NEUTRAL}>
        <path
          d="M98 14 C 124 24, 124 56, 98 66"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.22}
        />
      </g>
      <g className={NEUTRAL} fill="currentColor">
        <rect x="18" y="14" width="66" height="15" rx="4.5" opacity={0.78} />
        <rect x="18" y="34" width="48" height="6" rx="3" opacity={0.22} />
        <rect x="18" y="44" width="34" height="6" rx="3" opacity={0.22} />
      </g>
      <g className="text-primary" fill="currentColor">
        <rect x="120" y="10" width="7" height="9" rx="3" transform="rotate(-10 123.5 14.5)" />
        <rect x="130" y="10" width="7" height="9" rx="3" transform="rotate(-10 133.5 14.5)" />
      </g>
    </>
  );
}

/** Product Ad — a product tile with two description lines, an offer chip,
 *  and a solid CTA bar. Product Ad's own tone IS lime (it's the
 *  conversion-driven mode), so it legitimately carries slightly more lime
 *  than the other five — that's intentional, not a regression back to a
 *  per-mode colour scheme. */
function ProductAdThumb() {
  return (
    <>
      <g className={NEUTRAL} fill="currentColor">
        <rect x="14" y="14" width="42" height="42" rx="8" opacity={0.1} />
        <rect x="26" y="24" width="18" height="22" rx="4" opacity={0.5} />
        <rect x="64" y="44" width="42" height="5.5" rx="2.75" opacity={0.2} />
        <rect x="64" y="54" width="30" height="5.5" rx="2.75" opacity={0.2} />
        {/* The offer chip is NEUTRAL, deliberately. It used to be solid lime
            alongside the CTA bar, which gave this one card two full-strength
            accents while its five neighbours had a single small dot each —
            Product Ad then pulled the eye across the whole grid, re-creating
            in one card the "too much colors... distraction" the neutral pass
            set out to fix. One accent per composition, same as the rest. */}
        <rect x="100" y="10" width="26" height="12" rx="6" opacity={0.28} />
      </g>
      <g className="text-primary" fill="currentColor">
        {/* The single accent, and it earns it: this Mode IS "offer + CTA", so
            the button is the one thing the picture has to say. Narrowed from
            a near-full-bleed 128 slab to a button-shaped 100 so it reads as a
            CTA rather than a colour band. */}
        <rect x="16" y="64" width="100" height="12" rx="6" />
      </g>
      <g fill="currentColor" className="text-background">
        <path d="M105 67.5 L110 70 L105 72.5 Z" opacity={0.9} />
      </g>
    </>
  );
}

/** Performance Ad — a rising bar chart with a trend line, a category chip,
 *  and a lime peak dot marking the tested-angle "winner" the mode chases. */
function PerformanceAdThumb() {
  return (
    <>
      <g className={NEUTRAL} fill="currentColor">
        <rect x="16" y="8" width="36" height="9" rx="4.5" opacity={0.18} />
        <rect x="24" y="58" width="11" height="14" rx="2.5" opacity={0.26} />
        <rect x="41" y="50" width="11" height="22" rx="2.5" opacity={0.36} />
        <rect x="58" y="40" width="11" height="32" rx="2.5" opacity={0.48} />
        <rect x="75" y="28" width="11" height="44" rx="2.5" opacity={0.62} />
        <rect x="92" y="14" width="11" height="58" rx="2.5" opacity={0.8} />
      </g>
      <g className={NEUTRAL}>
        <path
          d="M29.5 58 L46.5 50 L63.5 40 L80.5 28 L97.5 14"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.32}
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
function SocialThumb() {
  return (
    <>
      <g className={NEUTRAL}>
        <rect
          x="50" y="6" width="60" height="68" rx="10"
          fill="none" stroke="currentColor" strokeWidth={3} opacity={0.5}
        />
      </g>
      <g className={NEUTRAL} fill="currentColor">
        <rect x="55" y="12" width="50" height="56" rx="6" opacity={0.06} />
        <rect x="59" y="16" width="42" height="22" rx="4" opacity={0.38} />
        <rect x="59" y="42" width="34" height="4.5" rx="2.25" opacity={0.2} />
        <rect x="59" y="49" width="20" height="4.5" rx="2.25" opacity={0.2} />
        <circle cx="72" cy="61" r="2.8" opacity={0.26} />
        <circle cx="81" cy="61" r="2.8" opacity={0.26} />
      </g>
      <g className="text-primary" fill="currentColor">
        <circle cx="63" cy="61" r="2.8" />
      </g>
    </>
  );
}

/** Generate Variations — one source frame fanning out into three offset
 *  copies, with a lime "new variation" badge on the front-most copy. */
function GenerateVariationsThumb() {
  return (
    <>
      <g className={NEUTRAL} fill="currentColor">
        <rect x="90" y="14" width="38" height="48" rx="6" opacity={0.14} transform="rotate(-7 109 38)" />
        <rect x="86" y="17" width="38" height="48" rx="6" opacity={0.22} transform="rotate(-3.5 105 41)" />
        <rect x="82" y="20" width="38" height="48" rx="6" opacity={0.4} />
        <rect x="14" y="16" width="40" height="48" rx="6" opacity={0.82} />
        <rect x="21" y="22" width="27" height="17" rx="3" opacity={0.2} />
        <rect x="21" y="43" width="19" height="5" rx="2.5" opacity={0.28} />
        <rect x="21" y="51" width="13" height="5" rx="2.5" opacity={0.28} />
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
 *  complete card here, not a hole or a crash. Neutralised the same way as
 *  the six named compositions: neutral structure, one lime accent dot. */
function NeutralThumb() {
  return (
    <>
      <g className={NEUTRAL} fill="currentColor">
        <rect x="46" y="20" width="52" height="40" rx="7" opacity={0.14} />
        <rect x="58" y="32" width="28" height="16" rx="4" opacity={0.24} />
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
  let content: React.ReactNode;
  switch (modeId) {
    case "product-shoot":
      content = <ProductShootThumb />;
      break;
    case "brand-ad":
      content = <BrandAdThumb />;
      break;
    case "product-ad":
      content = <ProductAdThumb />;
      break;
    case "performance-ad":
      content = <PerformanceAdThumb />;
      break;
    case "social":
      content = <SocialThumb />;
      break;
    case "generate-variations":
      content = <GenerateVariationsThumb />;
      break;
    default:
      content = <NeutralThumb />;
  }

  return <ThumbShell className={className}>{content}</ThumbShell>;
}
