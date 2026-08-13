import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ContextRail } from "./ContextRail";
import type { UseWizardReturn } from "../state/useWizard";
import type { AlphaMode } from "../screens/StudioHome";

interface MobileContextRailSheetProps {
  wizard: UseWizardReturn;
  studioMode?: AlphaMode;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}

/**
 * MobileContextRailSheet — below-`md` home for the wizard's ContextRail.
 *
 * The inline right rail is `hidden md:flex`, so on a phone the run context
 * (brand / product / angle summary, KB counts, winner ads, related products)
 * had no surface at all. This wraps the SAME <ContextRail /> in a bottom
 * sheet so nothing is re-implemented or forked — mount it from the wizard's
 * mobile chrome and it renders the identical rail content in a scrollable
 * tray.
 *
 * Rules honoured:
 *   - Standing app rule: overlays never dismiss on outside click. SheetContent
 *     already preventDefaults pointer-down/interact-outside; on top of that
 *     this sheet ships TWO explicit closes — the header X (from SheetContent)
 *     and a full-width 44px "Close" button pinned to the bottom (thumb reach).
 *   - `md:hidden` on the content so a viewport that grows past the breakpoint
 *     while the sheet is open falls back to the inline aside instead of
 *     double-rendering the rail.
 *   - Body scrolls internally (`max-h-[85dvh]` + `overflow-y-auto`), so a long
 *     rail (many related products / reference URLs) never pushes the close
 *     control off-screen.
 */
export function MobileContextRailSheet({
  wizard,
  studioMode,
  open,
  onOpenChange,
}: MobileContextRailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[85dvh] flex-col gap-0 rounded-t-2xl border-border p-0 md:hidden"
      >
        <SheetHeader className="shrink-0 space-y-0.5 border-b border-border/60 px-4 py-3 pr-14 text-left">
          <SheetTitle className="text-[15px] font-semibold tracking-tight">
            Run context
          </SheetTitle>
          <SheetDescription className="text-[12px]">
            What this generation will be built from.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <ContextRail
            wizard={wizard}
            studioMode={studioMode}
            onCollapse={() => onOpenChange(false)}
          />
        </div>

        <div className="shrink-0 border-t border-border/60 p-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-background text-[13px] font-semibold text-foreground transition-colors hover:bg-foreground/[0.06]"
          >
            Close
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MobileContextRailSheet;
