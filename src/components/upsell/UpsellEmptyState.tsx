import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * UpsellEmptyState — feature-locked replacement for generic "no data"
 * empty states. Shown when an AI-plan user lands on a Growth-only
 * feature surface (RRM / Reports / Autopilot / Industry Insights Pro
 * / Launch History).
 *
 * Design grammar (Maalik A-12.175 — "Linear-clean, feature-led"):
 *  - Vertical stack, generous breathing room, no sales theatre
 *  - Small lime-tinted lock chip at top
 *  - Feature name (Geist Sans 18px semibold, foreground)
 *  - One-line value prop (Geist Sans 13px, foreground/70)
 *  - Lime CTA → /plans-v2 with the right tier query
 *  - Subtle "Stay on AI plan" text link as exit (no destination, just
 *    closes the upsell — caller can wire an onDismiss to render the
 *    generic empty state instead)
 *
 * Reference points: Linear in-product upsells, Notion's "Upgrade to
 * use this block" inline cards. NOT: AdCreative.ai's full-takeover
 * paywall screens.
 */

export interface UpsellEmptyStateProps {
  /** Feature name shown as headline (e.g. "Recovery & Retention Manager"). */
  featureName: string;
  /** One-line outcome benefit (e.g. "Recover 1:1:250 retention patterns automatically."). */
  valueProp: string;
  /** Which plan tier the CTA upgrades to. Drives the /plans-v2 query param. */
  targetTier: "ai-team" | "growth";
  /** Optional inline illustration above the lock chip — a feature glyph or static preview. */
  previewIllustration?: ReactNode;
  /** Optional bullet list of secondary benefits. Max 3 — keeps the card uncluttered. */
  bullets?: string[];
  className?: string;
}

const CTA_LABEL: Record<UpsellEmptyStateProps["targetTier"], string> = {
  "ai-team": "Upgrade to AI Team",
  growth: "Start 14-day Growth trial",
};

const CTA_HREF: Record<UpsellEmptyStateProps["targetTier"], string> = {
  "ai-team": "/plans-v2?tier=ai&view=direct",
  growth: "/plans-v2?tier=growth&view=trial",
};

export function UpsellEmptyState({
  featureName,
  valueProp,
  targetTier,
  previewIllustration,
  bullets,
  className,
}: UpsellEmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-12 text-center",
        className,
      )}
    >
      {previewIllustration ? (
        <div className="mb-1">{previewIllustration}</div>
      ) : (
        // Default illustration: a soft 64px disc with the Lock icon inside.
        // Quiet, not promotional. Locks are universally recognized; no
        // explanation copy required.
        <div
          className={cn(
            "inline-flex h-14 w-14 items-center justify-center rounded-full",
            "bg-primary/10 ring-1 ring-primary/20",
          )}
          aria-hidden
        >
          <Lock className="h-6 w-6 text-primary" strokeWidth={1.75} />
        </div>
      )}

      <div className="space-y-1.5">
        <h2 className="text-[18px] font-semibold leading-snug text-foreground">
          {featureName}
        </h2>
        <p className="text-[13px] leading-relaxed text-foreground/70">
          {valueProp}
        </p>
      </div>

      {bullets && bullets.length > 0 && (
        <ul className="space-y-1.5 text-left">
          {bullets.slice(0, 3).map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 text-[12.5px] leading-snug text-foreground/65"
            >
              <span
                aria-hidden
                className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-primary"
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col items-center gap-2 pt-1">
        <Button asChild size="sm" className="gap-1.5">
          <Link to={CTA_HREF[targetTier]}>
            {CTA_LABEL[targetTier]}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Link
          to="/"
          className={cn(
            "text-[11px] text-foreground/45 underline-offset-2 transition-colors",
            "hover:text-foreground/70 hover:underline",
            "focus-visible:outline-none focus-visible:text-foreground focus-visible:underline",
          )}
        >
          Stay on AI plan
        </Link>
      </div>
    </div>
  );
}
