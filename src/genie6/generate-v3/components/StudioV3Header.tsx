import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CATEGORIES, type CategoryId } from "@/genie6/generate-v3/types";

/**
 * StudioV3Header — minimal blended header (A-11.25 update per Maalik).
 *
 * Earlier cuts had glass + shadow + sub + sub-mode quick-switch dropdown —
 * Maalik flagged: "ye alag sa section lag rha hai, blend it in the form
 * itself ... too much space wasteage in it. make it simple and elegant,
 * user ka jyada dhyan nahi dalna ispe, form is the main content."
 *
 * Strip down to: back button + breadcrumb + title. No glass, no shadow,
 * no sub line, no switch-sub-mode button. Single thin line of header
 * that visually disappears so the form is the visible thing.
 */

export interface StudioV3HeaderProps {
  /** Current category id — for breadcrumb display. */
  categoryId: CategoryId;
  /** Current sub-mode id — for the active breadcrumb pill. */
  subModeId: string;
  /** Form title (e.g. "Product-focused brand ad"). */
  title: string;
  /** Where the back button routes. Defaults to the v3 picker. */
  backTo?: string;
}

export function StudioV3Header({
  categoryId,
  subModeId,
  title,
  backTo = "/iq/genie6/generate-v3",
}: StudioV3HeaderProps) {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  const currentSub = category?.subModes.find((s) => s.id === subModeId);

  return (
    <header
      className={cn(
        "shrink-0 flex items-center gap-3 px-4 sm:px-6 py-2",
        // Blend into the page — no glass, no shadow. Just a hairline border.
        "bg-transparent border-b border-border/40",
      )}
    >
      <Link
        to={backTo}
        aria-label="Back to picker"
        className={cn(
          "shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md",
          "text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors",
          "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1",
        )}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Link>

      {/* Breadcrumb + title on a single line */}
      <div className="min-w-0 flex-1 flex items-center gap-2">
        <nav
          aria-label="Breadcrumb"
          className="hidden sm:flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.16em] shrink-0"
        >
          <Link
            to="/iq/genie6/generate-v3"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Studio v3
          </Link>
          {category?.label && (
            <>
              <span className="text-muted-foreground/40">/</span>
              <Link
                to="/iq/genie6/generate-v3"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {category.label}
              </Link>
            </>
          )}
          {currentSub?.label && (
            <>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-foreground">{currentSub.label}</span>
            </>
          )}
        </nav>
        <span className="text-muted-foreground/40 hidden sm:inline">·</span>
        <h1 className="text-sm font-semibold tracking-tight text-foreground leading-tight truncate">
          {title}
        </h1>
      </div>
    </header>
  );
}
