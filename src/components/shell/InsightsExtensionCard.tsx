import { useCallback, useEffect, useState } from "react";
import { Chrome, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * InsightsExtensionCard — quiet, footer-pinned install nudge for the
 * FabAds Industry Insights Chrome extension. Lives at the bottom of the
 * Insights sub-nav, dismissible (persists in localStorage), and tuned
 * to read as ambient rather than promotional.
 *
 * Design grammar (Maalik A-12.42 — "no generic"):
 *  - Compact (~96px tall), full sub-nav width minus 12px inset.
 *  - At rest: hairline border on `bg-foreground/[0.03]`, no shadow, no
 *    illustration. The Chrome glyph is neutral foreground; the lime is
 *    reserved for the small CTA chip — never floods the card.
 *  - On hover: hairline lifts to a lime tint, the whole card translates
 *    up by 1px, the dismiss X reveals at 60% opacity.
 *  - Typography: Geist Mono caps eyebrow (10px / wide tracking), Geist
 *    Sans single-line body at 11px. No multi-paragraph value prop.
 *  - The CTA is a chip, not a button — `text-[10px]` lime fill with the
 *    "Add to Chrome →" verb. The arrow nudges 1px right on hover.
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
          "group relative flex flex-col gap-1.5 rounded-md px-2.5 py-2",
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
            "absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full",
            "text-foreground/45 opacity-0 transition-opacity duration-150",
            "group-hover:opacity-60 hover:!opacity-100 focus-visible:opacity-100",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
          )}
        >
          <X className="h-3 w-3" strokeWidth={2.25} />
        </button>

        {/* Eyebrow row: tiny Chrome glyph + caps label in Geist Mono.
            Chrome icon stays neutral (foreground/55) — lime is reserved
            for the CTA chip below. */}
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

        {/* One-line ambient pitch. 11px Geist Sans, snug leading. No
            multi-paragraph copy — sub-nav is 200px, every word counts. */}
        <p className="text-[11px] leading-snug text-foreground/70">
          Clip ads from any site straight to your boards.
        </p>

        {/* CTA chip — lime fill, 10px text, sits left-aligned. The
            arrow nudges 1px right on hover for a hint of motion. */}
        <a
          href={EXTENSION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "mt-0.5 inline-flex w-fit items-center gap-1 rounded-sm px-1.5 py-[3px]",
            "bg-primary text-[10px] font-medium tracking-tight text-primary-foreground",
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
