/**
 * Generalized "best on desktop" card.
 *
 * Extracted from the mobile gate in `src/launchv2/LaunchV2Layout.tsx`
 * (lines 26-52) — that gate was Launch v2-specific and hardcoded its own
 * markup inline. This component lifts the same visual language (Monitor
 * icon, rounded-2xl card, centered copy) so it can be reused by:
 *   - the Tailwind-only `md:hidden` route gate pattern (LaunchV2Layout style)
 *   - a JS/viewport-hook mobile gate
 *   - an in-page inline gate for a single desktop-only section
 *
 * CRITICAL: this component must stay viewport-agnostic. It must NEVER call
 * `useIsMobile()` or read `window.innerWidth`/matchMedia/etc. The caller
 * alone decides *when* to render it (CSS breakpoint, JS hook, or always in
 * an inline slot) — that separation is the entire point of extracting it.
 * Baking in a viewport check here would break every caller that isn't a
 * full-screen route gate.
 */
import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Monitor } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BestOnDesktopProps {
  /** e.g. "Competitors", "New launch" — used in the heading. */
  label: string;
  /** One sentence body copy. Falls back to a sensible generic message. */
  reason?: string;
  /** Optional escape hatch rendered as a secondary link. */
  fallback?: { label: string; to: string };
  /** "screen" = full-height centered (route gate). "inline" = in-flow card. */
  variant?: "screen" | "inline";
  /** URL to copy. Defaults to the current page URL. */
  shareUrl?: string;
  className?: string;
}

export default function BestOnDesktop({
  label,
  reason,
  fallback,
  variant = "screen",
  shareUrl,
  className,
}: BestOnDesktopProps) {
  const url = shareUrl ?? (typeof window !== "undefined" ? window.location.href : "");

  const handleCopyLink = useCallback(() => {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } else {
      toast.error("Clipboard unavailable");
    }
  }, [url]);

  const card = (
    <div
      role="region"
      aria-label={`${label} is best on desktop`}
      className={cn(
        "flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-card text-center",
        variant === "screen" ? "p-8" : "p-6",
        className,
      )}
    >
      <Monitor className="h-12 w-12 text-primary" />
      <div className="space-y-1.5">
        <h2 className="text-base font-semibold text-foreground">
          {label} is best on desktop
        </h2>
        <p className="text-sm text-muted-foreground">
          {reason ?? "This experience is designed for a larger screen. Open this link on a laptop or larger display."}
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-2">
        <Button
          type="button"
          onClick={handleCopyLink}
          aria-label={`Copy link to ${label}`}
          className="min-h-11 w-full"
        >
          Copy link
        </Button>
        {fallback && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="min-h-11 w-full"
          >
            <Link to={fallback.to}>{fallback.label}</Link>
          </Button>
        )}
      </div>

      {url && (
        <p className="w-full truncate break-all text-xs text-muted-foreground/80" title={url}>
          {url}
        </p>
      )}
    </div>
  );

  if (variant === "inline") {
    return <div className="flex w-full justify-center px-4 py-6">{card}</div>;
  }

  return (
    <div className="flex h-full min-h-0 items-center justify-center px-6">
      {card}
    </div>
  );
}
