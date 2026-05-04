import { Link } from "react-router-dom";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * IndustryInsightsAnchor — TOP item in the Advanced drawer for Brand /
 * Product / Affiliate forms (A-11.3).
 *
 * Per Form Specs §1, §2, §3: "Industry Insights anchor (TOP — first item)"
 * inside the Advanced drawer. Surface is a compact link card that:
 *   - Shows context (current brand/category + 1-line reason)
 *   - Routes to /insights/discover with the relevant filter pre-applied
 *
 * Exists in scope=A as a UI shell. Real Industry Insights query / filter-by-
 * brand wiring lands when the backend is ready (TODO).
 */

export interface IndustryInsightsAnchorProps {
  /** Optional context slug — drives the deep-link filter */
  filter?: { kind: "brand"; brandId: string } | { kind: "category"; categoryId: string };
  /** Optional override headline */
  headline?: string;
  /** Optional override sub-line */
  sub?: string;
}

export function IndustryInsightsAnchor({
  filter,
  headline,
  sub,
}: IndustryInsightsAnchorProps = {}) {
  // Build deep-link query for Insights Discover
  const params = new URLSearchParams();
  if (filter?.kind === "brand") params.set("brand", filter.brandId);
  if (filter?.kind === "category") params.set("industry", filter.categoryId);
  const href = `/insights/discover${params.toString() ? `?${params.toString()}` : ""}`;

  const defaultHeadline = headline
    ?? (filter
      ? `What's working in ${filter.kind === "brand" ? "this brand's" : "this category's"} ads right now`
      : "What's working in your industry right now");
  const defaultSub = sub
    ?? "Trending angles, hooks, and formats — pulled from competitor ads in the last 14 days.";

  return (
    <Link
      to={href}
      className={cn(
        "group flex items-start gap-3 rounded-md border border-border bg-card p-3 transition-colors",
        "hover:border-primary/40 hover:bg-card/80",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <TrendingUp className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground leading-snug">
            {defaultHeadline}
          </h3>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {defaultSub}
        </p>
        <p className="pt-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80">
          Open in Insights →
        </p>
      </div>
    </Link>
  );
}
