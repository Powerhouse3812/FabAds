import { useCallback, useEffect, useState } from "react";
import { Chrome, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * InsightsExtensionCard — footer-pinned install nudge for the FabAds
 * Industry Insights Chrome extension. Lives at the bottom of the
 * Insights sub-nav, dismissible (persists in localStorage), and tuned
 * to read as a quiet product vignette rather than an ad banner.
 *
 * Design grammar (Maalik A-12.42 — "no generic"):
 *  - Taller card (~160–185px), full sub-nav width minus 12px inset.
 *  - Hero is a custom SVG mock of a browser window: chrome bar with
 *    traffic-light dots + address bar, a lime extension pin at the
 *    address-bar end, and two faint "ad card" rects in the body — one
 *    lifted with a lime border + clip glyph, a dotted arc tracing the
 *    clip motion up to the pin. Theme-aware: currentColor + opacity for
 *    neutrals, `text-primary` (lime) for the extension accent only.
 *  - At rest: hairline border on `bg-foreground/[0.03]`, no shadow.
 *  - On hover: hairline lifts to a lime tint, card translates up 1px,
 *    the dismiss X reveals at 60% opacity.
 *  - Typography: Geist Mono caps eyebrow (10px / wide tracking), Geist
 *    Sans single-line pitch at 11px. The CTA is a lime-fill chip.
 *
 * Reference points: Linear command-bar hint chips, Mercury banking
 * footer cards. Explicitly NOT: AdCreative.ai install banners.
 */

// TODO: replace once the FabAds Insights extension is published — the
// current placeholder points at the canonical Chrome Web Store path so
// the link still resolves to a "not found" page rather than 404.
const EXTENSION_URL = "https://chromewebstore.google.com/detail/fabads-insights";

const STORAGE_KEY = "genie6:insights:ext-card-dismissed";

function useDismissedExtensionCard(): [boolean, () => void] {
  // SSR-safe initial read — we only touch localStorage on the client.
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  // Cross-tab sync: if the user dismisses in another tab, this tab
  // hides too. Cheap subscription, no listener leaks because Insights
  // is a single mount under SecondaryNavigationPanel.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue === "1") {
        setDismissed(true);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // localStorage may be disabled (private mode, quota) — fall back
      // to in-memory dismissal for the rest of the session so the user
      // still sees the X take effect.
    }
    setDismissed(true);
  }, []);

  return [dismissed, dismiss];
}

/**
 * BrowserMock — the hero illustration. A miniature browser window that
 * shows the extension clipping a competitor ad to a board.
 *
 * Coordinate system is 168×84 (viewBox); the SVG scales to the card
 * width via `w-full`. Neutrals ride `currentColor` (inherited from the
 * card's foreground) at low opacity so the mock follows light/dark; the
 * extension pin + clipped-ad accents use the lime `text-primary` token.
 */
function BrowserMock() {
  return (
    <svg
      viewBox="0 0 168 84"
      className="w-full"
      role="img"
      aria-label="A browser window with the FabAds extension clipping a competitor ad to a board"
      fill="none"
    >
      {/* Window frame */}
      <rect
        x="1"
        y="1"
        width="166"
        height="82"
        rx="7"
        className="stroke-current text-foreground/15"
        strokeWidth="1"
      />
      {/* Chrome bar fill + divider under it */}
      <path
        d="M1 8a7 7 0 0 1 7-7h152a7 7 0 0 1 7 7v11H1V8Z"
        className="fill-current text-foreground/[0.04]"
      />
      <line
        x1="1"
        y1="19"
        x2="167"
        y2="19"
        className="stroke-current text-foreground/10"
        strokeWidth="1"
      />
      {/* Traffic-light dots (neutral) */}
      <circle cx="11" cy="10" r="2" className="fill-current text-foreground/25" />
      <circle cx="19" cy="10" r="2" className="fill-current text-foreground/25" />
      <circle cx="27" cy="10" r="2" className="fill-current text-foreground/25" />
      {/* Address bar */}
      <rect
        x="38"
        y="6"
        width="104"
        height="8"
        rx="4"
        className="fill-current text-foreground/[0.06]"
      />
      {/* Extension pin — lime square badge with a "+" glyph */}
      <rect
        x="148"
        y="5"
        width="11"
        height="11"
        rx="2.5"
        className="fill-current text-primary"
      />
      <path
        d="M153.5 8v5M151 10.5h5"
        className="stroke-current text-primary-foreground"
        strokeWidth="1.25"
        strokeLinecap="round"
      />

      {/* Faint background ad card (not clipped) */}
      <rect
        x="14"
        y="30"
        width="60"
        height="44"
        rx="4"
        className="fill-current text-foreground/[0.05]"
      />
      <rect
        x="20"
        y="36"
        width="48"
        height="18"
        rx="2"
        className="fill-current text-foreground/[0.06]"
      />
      <rect
        x="20"
        y="58"
        width="40"
        height="3"
        rx="1.5"
        className="fill-current text-foreground/10"
      />
      <rect
        x="20"
        y="64"
        width="28"
        height="3"
        rx="1.5"
        className="fill-current text-foreground/[0.08]"
      />

      {/* Dotted clip-motion arc from the highlighted ad up to the pin */}
      <path
        d="M128 32C140 24 150 22 153 17"
        className="stroke-current text-primary/45"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="1.5 3"
      />

      {/* Highlighted / clipped ad card — lifted, lime border */}
      <rect
        x="88"
        y="28"
        width="60"
        height="44"
        rx="4"
        className="fill-current text-foreground/[0.04] stroke-[hsl(var(--primary))]"
        strokeWidth="1.25"
      />
      <rect
        x="94"
        y="34"
        width="48"
        height="18"
        rx="2"
        className="fill-current text-primary/15"
      />
      <rect
        x="94"
        y="56"
        width="40"
        height="3"
        rx="1.5"
        className="fill-current text-foreground/15"
      />
      <rect
        x="94"
        y="62"
        width="28"
        height="3"
        rx="1.5"
        className="fill-current text-foreground/10"
      />
      {/* Clip / bookmark glyph anchored to the clipped ad's top-right
          (lime) — reads as "saved to a board". */}
      <path
        d="M133 28h9v12l-4.5-3.4L133 40V28Z"
        className="fill-current text-primary"
      />
    </svg>
  );
}

export function InsightsExtensionCard() {
  const [dismissed, dismiss] = useDismissedExtensionCard();
  if (dismissed) return null;

  return (
    <div
      className={cn(
        // Outer wrapper: 8px horizontal inset, 8px vertical, sits
        // directly below the sub-nav body inside the same aside.
        "shrink-0 px-2 py-2",
      )}
    >
      <div
        className={cn(
          // The card itself — group for hover-coordinated children.
          "group relative flex flex-col gap-2 rounded-md px-2.5 py-2.5",
          "border border-foreground/[0.06] bg-foreground/[0.03]",
          // Hover: lime hairline + barely-there elevation lift. No
          // shadow — keeps it from feeling like a corporate banner.
          "transition-[transform,border-color,background-color] duration-200 ease-out",
          "hover:-translate-y-[1px] hover:border-primary/30 hover:bg-foreground/[0.045]",
          // Focus-within ring (keyboard reachability via the dismiss X
          // and the CTA link). Lime token, low opacity, tight offset.
          "focus-within:border-primary/40",
        )}
      >
        {/* Dismiss X — hidden at rest, opacity-60 on group hover or
            when the X itself is focused. Sits in tab order so keyboard
            users can dismiss without reaching for the mouse. */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss extension prompt"
          title="Dismiss"
          className={cn(
            "absolute right-1 top-1 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full",
            "text-foreground/45 opacity-0 transition-opacity duration-150",
            "group-hover:opacity-60 hover:!opacity-100 focus-visible:opacity-100",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
          )}
        >
          <X className="h-3 w-3" strokeWidth={2.25} />
        </button>

        {/* Eyebrow row: tiny Chrome glyph + caps label in Geist Mono.
            Chrome icon stays neutral (foreground/55) — lime is reserved
            for the CTA chip + the in-mock extension accent. */}
        <div className="flex items-center gap-1.5 pr-5">
          <Chrome
            className="h-3.5 w-3.5 shrink-0 text-foreground/55"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-foreground/55">
            Browser Extension
          </span>
        </div>

        {/* Hero: the browser-window mock. Inherits the card's foreground
            via currentColor; the lime accents come from text-primary. */}
        <BrowserMock />

        {/* One-line ambient pitch. 11px Geist Sans, snug leading. */}
        <p className="text-[11px] leading-snug text-foreground/70">
          Clip any competitor ad straight to your boards.
        </p>

        {/* CTA chip — lime fill, 11px text, sits left-aligned. The
            arrow nudges 1px right on hover for a hint of motion. */}
        <a
          href={EXTENSION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex w-fit items-center gap-1 rounded-sm px-2 py-[4px]",
            "bg-primary text-[11px] font-medium tracking-tight text-primary-foreground",
            "transition-colors duration-150 hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          )}
        >
          <span>Add to Chrome</span>
          <span
            aria-hidden
            className="inline-block transition-transform duration-150 group-hover:translate-x-[1px]"
          >
            →
          </span>
        </a>
      </div>
    </div>
  );
}
