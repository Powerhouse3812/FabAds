/**
 * CreativeDrawer — the right-side detail panel (handoff §5.2).
 * Opens/closes via the ?creative=:id URL param so it's shareable and the back
 * button works. Composes the section bands (preview, funnel, trend, fatigue,
 * component breakdown, where-it's-running, variants) with a sticky action bar.
 * Sections are hairline-divided bands — never nested cards (one sub-container
 * level max).
 */
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BucketChip } from "@/creative-report/components/BucketChip";
import { AdPreviewMock } from "@/creative-report/drawer/AdPreviewMock";
import { FunnelStrip } from "@/creative-report/drawer/FunnelStrip";
import { TrendChart } from "@/creative-report/drawer/TrendChart";
import { FatiguePanel } from "@/creative-report/drawer/FatiguePanel";
import { ComponentBreakdown } from "@/creative-report/drawer/ComponentBreakdown";
import { RunningInTable } from "@/creative-report/drawer/RunningInTable";
import { VariantsList } from "@/creative-report/drawer/VariantsList";
import { DrawerActionBar } from "@/creative-report/drawer/DrawerActionBar";
import { useCreativeActions } from "@/creative-report/actions/useCreativeActions";
import { truncate, NAME_MAX } from "@/creative-report/lib/format";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

function Band({ children }: { children: React.ReactNode }) {
  return <section className="border-b border-border px-4 py-4">{children}</section>;
}

export function CreativeDrawer({ rollup }: { rollup: CreativeRollup | null }) {
  const a = useCreativeActions();
  const open = rollup !== null;
  const name = rollup ? truncate(rollup.creative.name, NAME_MAX) : { text: "", truncated: false };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && a.closeDrawer()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[720px]"
      >
        {rollup && (
          <>
            <SheetHeader className="border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                {rollup.bucket && <BucketChip bucket={rollup.bucket} size="xs" />}
                <span className="text-xs text-muted-foreground">{rollup.creative.product}</span>
              </div>
              <SheetTitle
                className="truncate text-left text-base"
                title={name.truncated ? rollup.creative.name : undefined}
              >
                {name.text}
              </SheetTitle>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <Band>
                <AdPreviewMock rollup={rollup} />
              </Band>
              <Band>
                <FunnelStrip rollup={rollup} />
              </Band>
              <Band>
                <TrendChart rollup={rollup} />
              </Band>
              <Band>
                <FatiguePanel rollup={rollup} />
              </Band>
              <Band>
                <ComponentBreakdown rollup={rollup} />
              </Band>
              <Band>
                <RunningInTable
                  rollup={rollup}
                  onCompareContexts={() => a.compare([rollup.creative.id])}
                />
              </Band>
              <Band>
                <VariantsList rollup={rollup} />
              </Band>
            </div>

            <DrawerActionBar rollup={rollup} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
