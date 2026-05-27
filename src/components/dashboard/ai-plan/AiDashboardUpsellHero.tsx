import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlan } from "@/contexts/PlanContext";

/**
 * AiDashboardUpsellHero — "Why most agencies upgrade" full-width banner.
 *
 * Per Maalik's finalised Figma (2026-05-26 override): single full-width
 * horizontal card (NOT a 2-column hero). Left col carries eyebrow +
 * headline + brand-monogram social-proof row including "Trusted by
 * 12,000+ agencies" mono-caps strap. Right col is two CTAs (lime primary
 * + ghost). Maalik has explicitly authorised the 12,000+ stat per Figma —
 * it is restored as designed.
 *
 * Gating: AI-plan users only. Growth users hide this entirely.
 * Dismiss X reveals on hover · localStorage persistence · cross-tab sync.
 */

const STORAGE_KEY = "genie6:dashboard:upsell-hero-dismissed";

function useDismissed(): [boolean, () => void] {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

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
      // Silent fail — in-memory dismiss still applies for the session.
    }
    setDismissed(true);
  }, []);

  return [dismissed, dismiss];
}

interface Monogram {
  initials: string;
  brand: string;
  fontSizePx: number;
}

const MONOGRAMS: Monogram[] = [
  { initials: "M", brand: "Mamaearth", fontSizePx: 7.7 },
  { initials: "N", brand: "Noise", fontSizePx: 9 },
  { initials: "b", brand: "boAt", fontSizePx: 9 },
  { initials: "S", brand: "Sleepyhead", fontSizePx: 9 },
  { initials: "MB", brand: "Mensa Brands", fontSizePx: 7.3 },
];

export function AiDashboardUpsellHero() {
  const { plan } = usePlan();
  const [dismissed, dismiss] = useDismissed();

  if (plan !== "ai" || dismissed) return null;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "border border-primary/25 bg-foreground/[0.03]",
      )}
    >
      {/* Lime accent bar at left edge */}
      <span
        aria-hidden
        className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-primary"
      />

      {/* Dismiss X */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss upgrade banner"
        title="Dismiss"
        className={cn(
          "absolute right-2 top-2 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full",
          "text-foreground/45 opacity-0 transition-opacity duration-150",
          "group-hover:opacity-60 hover:!opacity-100 focus-visible:opacity-100",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
        )}
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>

      <div className="relative z-10 flex items-center gap-5 px-6 py-4">
        {/* LEFT col */}
        <div className="flex-1 min-w-0">
          {/* Eyebrow row */}
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={2.25} aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Why most agencies upgrade
            </span>
          </div>

          {/* Headline */}
          <h3 className="mt-1 text-[16px] font-bold leading-snug text-foreground">
            One plan stops at generation. Growth ships the ads.
          </h3>

          {/* Sub */}
          <p className="mt-1 text-[13px] font-normal leading-snug text-muted-foreground">
            Reports across accounts, multi-account launches, rules-based automation. The work you do after the ad is generated.
          </p>

          {/* Social-proof row: 12,000+ strap + divider + brand monograms */}
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.5px] text-foreground/55 tabular-nums">
              12,000+ agencies on Growth
            </span>
            <span aria-hidden className="h-3 w-px bg-foreground/10" />
            <div className="flex items-center" aria-hidden>
              {MONOGRAMS.map((m, i) => (
                <span
                  key={m.brand}
                  title={m.brand}
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full",
                    "bg-foreground/[0.06] ring-1 ring-card text-foreground/70 font-bold",
                    i > 0 && "-ml-1.5",
                  )}
                  style={{ fontSize: `${m.fontSizePx}px` }}
                >
                  {m.initials}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT col — CTAs */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/plans-v2?tier=growth-pro&view=trial"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-2xl bg-primary px-3 py-2",
              "text-[14px] font-semibold text-foreground transition-colors hover:bg-primary/90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            )}
          >
            Start 14-day Growth Pro trial
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          </Link>
          <Link
            to="/plans-v2?tier=growth-pro&view=sales"
            className={cn(
              "inline-flex items-center justify-center rounded-2xl px-3 py-2",
              "text-[14px] text-foreground/65 transition-colors",
              "hover:bg-muted/40 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
            )}
          >
            Talk to sales
          </Link>
        </div>
      </div>
    </div>
  );
}
