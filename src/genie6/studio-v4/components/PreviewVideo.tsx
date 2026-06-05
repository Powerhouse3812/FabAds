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
 * Mock note: clips are a placeholder pool (data/studio-visuals.ts). Swap to
 * real UGC preview URLs when the generation backend lands — no change here.
 */
export function PreviewVideo({ src, poster, className }: PreviewVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    setPlaying(false);
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
  }, [src]);

  // Ken-Burns the poster while the real video isn't playing — guarantees the
  // tile is never frozen. Web Animations API so we don't need global keyframes.
  useEffect(() => {
    const el = posterRef.current;
    if (!el || playing) return;
    const anim = el.animate(
      [
        { transform: "scale(1) translateY(0)" },
        { transform: "scale(1.08) translateY(-2%)" },
      ],
      { duration: 9000, direction: "alternate", iterations: Infinity, easing: "ease-in-out" },
    );
    return () => anim.cancel();
  }, [playing]);

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
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        className={cn(
          "relative h-full w-full object-cover transition-opacity duration-500",
          playing ? "opacity-100" : "opacity-0",
        )}
      />

      {/* "Preview" badge while falling back to the animated poster. */}
      {!playing && (
        <span className="pointer-events-none absolute bottom-1 right-1 inline-flex items-center gap-1 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wider text-foreground/70 backdrop-blur">
          <span className="h-1 w-1 animate-pulse rounded-full bg-primary" />
          Preview
        </span>
      )}
    </div>
  );
}
