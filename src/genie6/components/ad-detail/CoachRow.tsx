import { Link } from "react-router-dom";
import { Beaker, RefreshCw, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoachRecommendation } from "../../types/output";

/**
 * CoachRow — single AI-coach recommendation row.
 *
 * Layout: lime icon circle + flex-1 title/sub block + mono-caps CTA link.
 * Stacks with sibling rows separated by a hairline border-top (except the
 * first row).
 *
 * The serialised `icon` field on `CoachRecommendation` maps to a lucide
 * icon via `iconFor()` so the type stays JSON-safe.
 */
interface CoachRowProps {
  rec: CoachRecommendation;
  className?: string;
}

export function CoachRow({ rec, className }: CoachRowProps) {
  const Icon = iconFor(rec.icon);

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2 border-t border-border/40 first:border-t-0",
        className,
      )}
    >
      <span className="h-6 w-6 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-3 w-3 text-primary" strokeWidth={2.2} aria-hidden />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold leading-tight text-foreground truncate">
          {rec.title}
        </p>
        <p className="text-[11px] leading-snug text-muted-foreground truncate">
          {rec.sub}
        </p>
      </div>
      <Link
        to={rec.ctaHref}
        className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:underline whitespace-nowrap"
      >
        {rec.ctaLabel} →
      </Link>
    </div>
  );
}

/** Map serialised icon name → lucide icon component. */
export function iconFor(name: CoachRecommendation["icon"]): LucideIcon {
  switch (name) {
    case "sparkles":
      return Sparkles;
    case "beaker":
      return Beaker;
    case "refresh-cw":
      return RefreshCw;
  }
}
