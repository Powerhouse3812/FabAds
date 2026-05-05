import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * FormSkeleton — chassis for every New Studio Type form.
 *
 * A-11.12 redesign per Maalik's UI feedback:
 *   - Slim header — back button + title only. The sticky "top zone" with
 *     pickers is GONE; pickers move into the form body as the first section.
 *     Each form composes its own picker UI as the first body block.
 *   - PromptBar wrapper now uses GLASS chrome — backdrop-blur + translucent
 *     bg + subtle ring/shadow. Apple-style liquid glass aesthetic.
 *   - Single-column scroll body — eye flow becomes vertical (header → picker
 *     → templates → references → suggestions → advanced → generate).
 *
 * The previous `top` and `status` slots are dropped. Caller composes
 * everything in the body slot.
 */

export interface FormSkeletonProps {
  /** Optional eyebrow over the title (e.g. "Studio · Brand Ad"). */
  eyebrow?: string;
  /** Optional H1 title (e.g. "Generate a brand ad"). */
  title?: string;
  /** Optional one-line sub under the title. */
  sub?: string;
  /** Scrollable form body — strips, sections, drawers. */
  body: ReactNode;
  /** Floating bottom prompt bar — typically <PromptBar />. */
  promptBar: ReactNode;
  /** Optional className for outer container customization. */
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
    <div className={cn("flex h-full flex-col bg-background relative", className)}>
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

      {/* Form body — scrolls between header + floating prompt bar.
          Generous bottom padding so the floating PromptBar doesn't cover
          the last body section. */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 pb-32 space-y-6">
          {body}
        </div>
      </main>

      {/* Floating PromptBar — glass chrome, sits absolute over the body's
          bottom. backdrop-blur + translucent + ring + shadow = Apple liquid
          glass aesthetic. */}
      <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-6 sm:right-6 z-10">
        <div
          className={cn(
            "mx-auto max-w-3xl rounded-2xl",
            "bg-background/70 supports-[backdrop-filter]:bg-background/55",
            "backdrop-blur-xl backdrop-saturate-150",
            "border border-border/60",
            "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.20),0_4px_12px_-4px_rgba(0,0,0,0.10)]",
            "ring-1 ring-foreground/[0.04]",
            "overflow-hidden",
          )}
        >
          {promptBar}
        </div>
      </div>
    </div>
  );
}
