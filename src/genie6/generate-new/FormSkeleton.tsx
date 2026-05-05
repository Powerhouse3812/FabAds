import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * FormSkeleton — chassis for every form (A-11.20 fix).
 *
 * A-11.20 change: prompt bar moved from `absolute bottom-X` (which
 * overlapped body content and caused the "References hidden behind
 * prompt bar" bug Maalik flagged twice) to a flex FOOTER SLOT. Body now
 * shrinks to fit between header and footer — prompt bar can NEVER overlap
 * any body section. Glass card chrome on the bar is preserved (rounded,
 * blurred, ringed, lifted shadow) so it still looks elevated.
 *
 * Body padding-bottom dropped — no longer needed since the bar is in a
 * flex slot, not an absolute layer above.
 */

export interface FormSkeletonProps {
  /** Optional eyebrow over the title (e.g. "Studio v3 · Brand Ad"). */
  eyebrow?: string;
  /** Optional H1 title. */
  title?: string;
  /** Optional one-line sub under the title. */
  sub?: string;
  /** Scrollable form body. */
  body: ReactNode;
  /** Sticky bottom prompt bar — typically <PromptBar />. */
  promptBar: ReactNode;
  /** Outer container classes override. */
  className?: string;
  /** Where the back button routes. Defaults to GenerateLanding. */
  backTo?: string;
  /** Override back-button label. Default: "Picker". */
  backLabel?: string;
}

export function FormSkeleton({
  eyebrow,
  title,
  sub,
  body,
  promptBar,
  className,
  backTo = "/iq/genie6/generate",
  backLabel = "Picker",
}: FormSkeletonProps) {
  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      {/* Slim header — back + title only */}
      <header className="shrink-0 flex items-start gap-3 border-b border-border/60 bg-background px-4 py-3 sm:px-6">
        <Link
          to={backTo}
          aria-label={`Back to ${backLabel.toLowerCase()}`}
          className={cn(
            "shrink-0 inline-flex items-center gap-1 h-8 rounded-md border border-border bg-card px-2 text-xs text-muted-foreground transition-colors",
            "hover:border-foreground/30 hover:text-foreground",
            "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1",
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
        {(eyebrow || title) && (
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                {eyebrow}
              </p>
            )}
            {title && (
              <h1 className="text-base font-semibold tracking-tight text-foreground leading-tight">
                {title}
              </h1>
            )}
            {sub && (
              <p className="text-xs text-muted-foreground leading-snug">{sub}</p>
            )}
          </div>
        )}
      </header>

      {/* Form body — scrolls between header + footer (no padding tricks
          needed; footer is a real flex slot, not an absolute overlay). */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-7 space-y-6">
          {body}
        </div>
      </main>

      {/* Sticky bottom prompt bar — flex footer slot. CANNOT overlap body. */}
      <footer className="shrink-0 border-t border-border/40 bg-background/85 backdrop-blur-md backdrop-saturate-150 px-3 py-2.5 sm:px-6">
        <div
          className={cn(
            "mx-auto max-w-3xl rounded-2xl",
            "bg-background/70 supports-[backdrop-filter]:bg-background/55",
            "backdrop-blur-xl backdrop-saturate-150",
            "border border-border/60",
            // Upward shadow keeps the "lifted glass" feel without absolute pos
            "shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.10),0_2px_4px_-2px_rgba(0,0,0,0.05)]",
            "ring-1 ring-foreground/[0.04]",
            "overflow-hidden",
          )}
        >
          {promptBar}
        </div>
      </footer>
    </div>
  );
}
