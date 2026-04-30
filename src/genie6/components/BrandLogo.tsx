import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * BrandLogo — consistent brand-mark rendering across the app with graceful
 * onError fallback. The Clearbit Logo API was deprecated post-HubSpot
 * acquisition; we now resolve marks via Google's s2 favicon endpoint
 * (`google.com/s2/favicons?domain=…&sz=128`) which is universal, key-less,
 * and returns recognizable favicons at up to 128px for popular domains.
 *
 * If the request fails OR the brand has no logo URL on file, we render a
 * letter-mark in the brand's primary color (or neutral if absent).
 *
 * Single source of truth so the entire app shows a consistent brand mark
 * and we never get a broken-image icon.
 */

interface BrandLogoProps {
  /** The brand's name — used for the alt text + the letter fallback. */
  name: string;
  /** Logo URL (optional — falls back to letter mark if missing). */
  src?: string | null;
  /** Optional brand primary color, used as letter-mark bg. */
  tint?: string;
  /** Tailwind size class (e.g. "h-8 w-8"). Defaults to h-8 w-8. */
  size?: string;
  /** Border radius — `rounded` | `rounded-full` | other. */
  rounded?: string;
  className?: string;
}

export function BrandLogo({
  name,
  src,
  tint,
  size = "h-8 w-8",
  rounded = "rounded",
  className,
}: BrandLogoProps) {
  const [errored, setErrored] = useState(false);
  const showLetter = !src || errored;

  if (showLetter) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center bg-g6-bg-spotlight font-g6-mono font-bold text-g6-text-secondary",
          size,
          rounded,
          className
        )}
        style={tint ? { backgroundColor: `${tint}26`, color: tint } : undefined}
        aria-label={name}
      >
        {name.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src!}
      alt={name}
      onError={() => setErrored(true)}
      className={cn(
        "shrink-0 bg-g6-bg-spotlight object-contain p-0.5",
        size,
        rounded,
        className
      )}
    />
  );
}
