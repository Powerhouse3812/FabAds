import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * FauxHeader — minimal blended header for Studio v4 Flow.
 *
 * Mirrors the StudioV3Header pattern (back + breadcrumb + title on a
 * single thin line, no glass, no shadow) but stripped of v3-specific
 * category/sub-mode breadcrumb wiring since the Flow shell drives its
 * own sub-mode chip row beneath this header.
 *
 * Stays bg-transparent so the page mesh / parent background flows
 * through unbroken — only a hairline border separates it from the body.
 */

export interface FauxHeaderProps {
  /** Form title shown after the breadcrumb. */
  title: string;
  /** Where the back button routes. Defaults to the v3 picker. */
  backTo?: string;
  /** Breadcrumb segments rendered before the title. */
  breadcrumb?: { label: string; to?: string }[];
}

export function FauxHeader({
  title,
  backTo = "/iq/genie6/generate-v3",
  breadcrumb = [{ label: "Studio v4" }],
}: FauxHeaderProps) {
  return (
    <header
      className={cn(
        "shrink-0 flex items-center gap-3 px-4 sm:px-6 py-2",
        "bg-transparent border-b border-border/40",
      )}
    >
      <Link
        to={backTo}
        aria-label="Back"
        className={cn(
          "shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md",
          "text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors",
          "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1",
        )}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Link>

      <div className="min-w-0 flex-1 flex items-center gap-2">
        {breadcrumb.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="hidden sm:flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.16em] shrink-0"
          >
            {breadcrumb.map((seg, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-muted-foreground/40">/</span>}
                {seg.to ? (
                  <Link
                    to={seg.to}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {seg.label}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">{seg.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {breadcrumb.length > 0 && (
          <span className="text-muted-foreground/40 hidden sm:inline">·</span>
        )}
        <h1 className="text-sm font-semibold tracking-tight text-foreground leading-tight truncate">
          {title}
        </h1>
      </div>
    </header>
  );
}
