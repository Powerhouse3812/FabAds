import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StudioV3Header } from "@/genie6/generate-v3/components/StudioV3Header";
import type { CategoryId } from "@/genie6/generate-v3/types";

/**
 * FormSkeleton — chassis for every form.
 *
 * A-11.20: prompt bar moved from `absolute bottom-X` (which overlapped body
 * content and caused the "References hidden behind prompt bar" bug Maalik
 * flagged twice) to a flex FOOTER SLOT. Body shrinks to fit between header
 * and footer — prompt bar can NEVER overlap any body section.
 *
 * A-11.22: Studio v3 forms can now opt into the V2 header (sub-mode
 * quick-switch + breadcrumb + glass surface) by passing the `v3` prop
 * instead of eyebrow/title/sub. Backwards-compat preserved — old call
 * sites still work.
 *
 * A-11.24-v2 (A-11.25): Studio v3 Finder-style column view. When `drawer`
 * (now: <PickerColumn>) is passed, the layout becomes a 55/45 split — form
 * on the left, content column on the right. NOT a slide-over drawer —
 * a structural sibling column with a thin `border-l` divider. Both columns
 * scroll independently. Below `lg` viewport, the column takes full width
 * and the form is hidden behind it.
 */

export interface StudioV3HeaderConfig {
  categoryId: CategoryId;
  subModeId: string;
  title: string;
}

export interface FormSkeletonProps {
  /** Optional eyebrow over the title (legacy slim header). */
  eyebrow?: string;
  /** Optional H1 title (legacy slim header). */
  title?: string;
  /** Optional one-line sub under the title (legacy slim header). */
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
  /**
   * A-11.22: Studio v3 V2 header. When provided, replaces the legacy slim
   * header with the glass + breadcrumb + sub-mode quick-switch header.
   */
  v3?: StudioV3HeaderConfig;
  /**
   * A-11.25: Studio v3 Finder-style content column. When provided, the
   * layout becomes a 55/45 split — form on the left, this content on the
   * right. Pass `null`/falsy to hide the right column (form fills 100%).
   */
  drawer?: ReactNode;
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
  v3,
  drawer,
}: FormSkeletonProps) {
  const isV3 = !!v3;
  const drawerActive = !!drawer;
  return (
    <div
      className={cn(
        "flex h-full flex-col",
        // A-11.25 update: page mesh (off-white gradient + dot grid) is back
        // as a SINGLE shared background spanning both the form column and
        // the side picker column. Inner columns are bg-transparent so the
        // mesh flows through unbroken — only a hairline divider between.
        isV3 ? "v3-page-mesh bg-transparent" : "bg-background",
        className,
      )}
    >
      {isV3 ? (
        <StudioV3Header
          categoryId={v3.categoryId}
          subModeId={v3.subModeId}
          title={v3.title}
          backTo={backTo}
        />
      ) : (
        /* Slim legacy header — back + title only (used by /generate forms) */
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
      )}

      {/* Layout grid — Finder-style 55/45 split when right column is active.
          A-11.25-v2: prompt bar moved OUT of the form column into a
          page-level footer that spans BOTH columns (full screen width,
          like a pagination/header). Form body scrolls under it. */}
      <div
        className={cn(
          "flex-1 min-h-0 grid",
          drawerActive
            ? "grid-cols-1 lg:grid-cols-[55fr_45fr]"
            : "grid-cols-1",
        )}
      >
        {/* FORM COLUMN — body only now. Independent scroll. */}
        <div
          className={cn(
            "min-w-0 flex flex-col overflow-hidden",
            drawerActive && "hidden lg:flex",
          )}
        >
          <main className="flex-1 min-h-0 overflow-y-auto">
            <div
              className={cn(
                // Bottom padding so the last form item clears the
                // page-level prompt bar.
                "mx-auto px-4 pt-6 pb-10 sm:px-6 sm:pt-7 sm:pb-12 space-y-6 transition-[max-width] duration-200",
                drawerActive ? "max-w-2xl" : "max-w-3xl",
              )}
            >
              {body}
            </div>
          </main>
        </div>

        {/* CONTENT COLUMN */}
        {drawerActive && drawer}
      </div>

      {/* PROMPT BAR — page-level sticky footer, full screen width. */}
      <footer
        className={cn(
          "shrink-0 px-3 py-2.5 sm:px-6",
          isV3
            ? "border-t border-foreground/8 bg-transparent"
            : "border-t border-border/40 bg-background/85 backdrop-blur-md backdrop-saturate-150",
        )}
      >
        <div
          className={cn(
            "mx-auto rounded-2xl overflow-hidden max-w-3xl",
            isV3
              ? "v3-glass shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.18)]"
              : cn(
                  "bg-background/70 supports-[backdrop-filter]:bg-background/55",
                  "backdrop-blur-xl backdrop-saturate-150",
                  "border border-border/60",
                  "shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.10),0_2px_4px_-2px_rgba(0,0,0,0.05)]",
                  "ring-1 ring-foreground/[0.04]",
                ),
          )}
        >
          {promptBar}
        </div>
      </footer>
    </div>
  );
}
