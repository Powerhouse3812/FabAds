import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PreviewVideoProps {
  src: string;
  poster?: string;
  className?: string;
}

/**
 * PreviewVideo — autoplay-loop preview that is NEVER dead-static.
 *
 * Two problems this solves:
 *  1. React's JSX `muted` attribute doesn't reliably set the `video.muted`
 *     PROPERTY, so browsers BLOCK autoplay and the tile shows only its poster
 *     (the "visuals are static images" bug). Fix: set `muted` via ref + call
 *     `.play()` explicitly (and re-nudge on scroll-into-view).
 *  2. The clip host may be unreachable (offline / blocked network / headless
 *     preview that can't decode video). Fix: until the video actually fires
 *     `playing`, show the poster with a slow Ken-Burns motion (Web Animations
 *     API — no CSS keyframes needed) + a small "preview" badge, so the tile
 *     always reads as a live preview rather than a frozen image. When the real
 *     video starts, it cross-fades in over the animated poster.
 *
 * ONE deliberate exception to "never dead-static": a viewer who asks for
 * reduced motion gets a still poster and no playback at all. See the
 * `reduceMotion` note below — that stillness is the correct outcome there,
 * not the failure mode this component was built to avoid.
 *
 * Mock note: clips are a placeholder pool (data/studio-visuals.ts). Swap to
 * real UGC preview URLs when the generation backend lands — no change here.
 */
/**
 * Does this user ask for reduced motion? Read at call time, not cached at
 * module load, so a mid-session OS change is picked up on the next mount.
 * Guarded for SSR / very old browsers, where it degrades to "no preference"
 * — matching the behaviour before this check existed.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PreviewVideo({ src, poster, className }: PreviewVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);

  /* REDUCED MOTION (2026-09-10). Studio home now renders FOUR of these looping
     side by side above the fold, which is what turned a pre-existing gap into
     a real accessibility problem: autoplaying, endlessly looping video is
     exactly what this preference exists to suppress.
     Held in state, and the `autoPlay` attribute below is driven off it — a
     `pause()` inside the effect alone would NOT be enough, because the
     browser can still honour the `autoPlay` attribute and start the clip
     after that ran. Suppressing it at the attribute is the only way to be
     sure nothing ever starts.
     `playing` then stays false, which is already a complete designed state:
     the poster shows (static — the Ken-Burns effect bails on the same check)
     under the "Preview" badge, so the tile still reads as a preview. It
     simply doesn't move. */
  const [reduceMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    setPlaying(false);
    if (reduceMotion) {
      v.pause();
      return;
    }
    // Critical: set the muted PROPERTY (not just the attribute) so autoplay
    // isn't blocked.
    v.muted = true;
    v.defaultMuted = true;

    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    const onPlaying = () => setPlaying(true);
    v.addEventListener("playing", onPlaying);
    tryPlay();

    // Re-nudge play when the tile scrolls into view (browsers may not start
    // offscreen autoplay).
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) tryPlay();
      },
      { threshold: 0.1 },
    );
    io.observe(v);

    return () => {
      v.removeEventListener("playing", onPlaying);
      io.disconnect();
    };
  }, [src, reduceMotion]);

  // Ken-Burns the poster while the real video isn't playing — guarantees the
  // tile is never frozen. Web Animations API so we don't need global keyframes.
  useEffect(() => {
    const el = posterRef.current;
    if (!el || playing) return;
    // Same preference as above: with motion suppressed the poster is a plain
    // still rather than a slow pan. Nothing on this tile moves.
    if (reduceMotion) return;
    const anim = el.animate(
      [
        { transform: "scale(1) translateY(0)" },
        { transform: "scale(1.08) translateY(-2%)" },
      ],
      { duration: 9000, direction: "alternate", iterations: Infinity, easing: "ease-in-out" },
    );
    return () => anim.cancel();
  }, [playing, reduceMotion]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-muted", className)}>
      {/* Animated poster fallback — visible until the real video plays. */}
      {poster && (
        <div
          ref={posterRef}
          aria-hidden
          className={cn(
            "absolute inset-0 bg-cover bg-center transition-opacity duration-500",
            playing ? "opacity-0" : "opacity-100",
          )}
          style={{ backgroundImage: `url(${poster})` }}
        />
      )}

      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={!reduceMotion}
        muted
        loop
        playsInline
        /* `metadata`, not `auto` (2026-09-10): Studio home mounts four of
           these at once, and eager full-buffering meant ~3.4 MB fetched
           before the user does anything. The browser still buffers on
           `.play()`, so autoplay is unaffected — only the up-front cost
           goes. Step 3's approach grid, which mounts far more tiles than
           four, benefits by the same amount. */
        preload="metadata"
        aria-hidden
        className={cn(
          "relative h-full w-full object-cover transition-opacity duration-500",
          playing ? "opacity-100" : "opacity-0",
        )}
      />

      {/* "Preview" badge while falling back to the animated poster. */}
      {!playing && (
        <span className="pointer-events-none absolute bottom-1 right-1 inline-flex items-center gap-1 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wider text-foreground/70 backdrop-blur">
          <span className="h-1 w-1 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
          Preview
        </span>
      )}
    </div>
  );
}
