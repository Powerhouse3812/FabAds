import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * FormSkeleton — chassis for every New Studio Type form.
 *
 * A-11.11 redesign per Maalik's UI feedback:
 *   - Back button slot (top-left of header) routes to /iq/genie6/generate
 *     so users can return to the GenerateLanding picker without browser-back.
 *   - Floating prompt bar — was a flush bg-card border-t footer; now wrapped
 *     with mx-3 mb-3 rounded-2xl shadow-lg ring (Fabfunnel-grade detached
 *     chrome). Form Specs §0.3 explicitly says "Floating prompt bar".
 *   - Outer chrome stays minimal so V7 merged shell's white surface shows
 *     through — only the floating bar has its own visible card chrome.
 *   - Optional eyebrow + title slots for tier-1 form heading (passed by
 *     each Type form via the new `eyebrow` + `title` props).
 *
 * Per Form Specs §0.3 — universal layout:
 *   ┌─ Header (sticky): back · eyebrow + title · top-zone slot ──┐
 *   ┌─ Form body (scrollable, max-w-4xl) ─ slot for sections ──┐
 *   ┌─ Floating PromptBar (sticky bottom, detached chrome) ────┐
 */

export interface FormSkeletonProps {
  /** Optional eyebrow over the title (e.g. "Studio · Brand Ad"). */
  eyebrow?: string;
  /** Optional H1 title (e.g. "Generate a brand ad"). */
  title?: string;
  /** Optional one-line sub under the title. */
  sub?: string;
  /** Top sticky zone — required pickers, output chip, format toggle, etc. */
  top: ReactNode;
  /** Optional small status read-out slot — typically a row of tiny pills
   *  showing "Brand ✓ · Output ✗ · 4 variants ready". */
  status?: ReactNode;
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
  top,
  status,
  body,
  promptBar,
  className,
  backTo = "/iq/genie6/generate",
  backLabel = "Picker",
}: FormSkeletonProps) {
  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      {/* Header — sticky, contains back + title + top zone */}
      <header className="shrink-0 border-b border-border bg-card">
        <div className="flex items-start gap-3 px-4 pt-3 sm:px-5">
          <Link
            to={backTo}
            aria-label={`Back to ${backLabel.toLowerCase()}`}
            className={cn(
              "shrink-0 inline-flex items-center gap-1 h-8 rounded-md border border-border bg-background px-2 text-xs text-muted-foreground transition-colors",
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
        </div>
        <div className="px-4 pb-3 pt-2 sm:px-5">{top}</div>
        {status && (
          <div className="border-t border-border/60 px-4 py-1.5 sm:px-5">
            {status}
          </div>
        )}
      </header>

      {/* Form body — scrolls between header + floating bar */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-5 sm:py-5 space-y-5">
          {body}
        </div>
      </main>

      {/* Floating PromptBar — detached card chrome */}
      <div className="shrink-0 px-3 pb-3 pt-1">
        <div className="rounded-2xl border border-border bg-card shadow-lg ring-1 ring-border/40 overflow-hidden">
          {promptBar}
        </div>
      </div>
    </div>
  );
}
