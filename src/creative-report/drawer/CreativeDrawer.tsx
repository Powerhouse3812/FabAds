/**
 * CreativeDrawer — the right-side detail panel (handoff §5.2).
 * Opens/closes via the ?creative=:id URL param so it's shareable and the back
 * button works. Composes the section bands (preview, funnel, trend, fatigue,
 * component breakdown, script/elements, benchmarks, demographics,
 * where-it's-running, variants) with a sticky action bar.
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
import { ScriptElementsPanel } from "@/creative-report/drawer/ScriptElementsPanel";
import { BenchmarkPanel } from "@/creative-report/drawer/BenchmarkPanel";
import { DemographicsPanel } from "@/creative-report/drawer/DemographicsPanel";
import { RunningInTable } from "@/creative-report/drawer/RunningInTable";
import { SyncStatusPanel } from "@/creative-report/drawer/SyncStatusPanel";
import { VariantsList } from "@/creative-report/drawer/VariantsList";
import { DrawerActionBar } from "@/creative-report/drawer/DrawerActionBar";
import { useCreativeActions } from "@/creative-report/actions/useCreativeActions";
import { useReportWorkflowsEnabled } from "@/creative-report/state/ReportBasePathContext";
import { truncate, NAME_MAX } from "@/creative-report/lib/format";
import { getBrand } from "@/mocks/shared/brands";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

function Band({ children }: { children: React.ReactNode }) {
  return <section className="border-b border-border px-4 py-4">{children}</section>;
}

export function CreativeDrawer({ rollup }: { rollup: CreativeRollup | null }) {
  const a = useCreativeActions();
  // Gate the sync Band here, not just inside SyncStatusPanel: `Band` renders a
  // bordered `py-4` section, so gating only the child left v2 with an empty
  // bordered strip on every drawer open.
  const workflowsEnabled = useReportWorkflowsEnabled();
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
                <span className="text-xs text-muted-foreground">
                  {rollup.creative.brandId
                    ? `${getBrand(rollup.creative.brandId)?.name ?? rollup.creative.brandId} · ${rollup.creative.product}`
                    : rollup.creative.product}
                </span>
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
                <ScriptElementsPanel rollup={rollup} />
              </Band>
              <Band>
                <BenchmarkPanel rollup={rollup} />
              </Band>
              <Band>
                <DemographicsPanel rollup={rollup} />
              </Band>
              <Band>
                <RunningInTable
                  rollup={rollup}
                  onCompareContexts={() => a.compare([rollup.creative.id])}
                />
              </Band>
              {/* Sits directly after RunningInTable on purpose: that band means
                  "where this creative is currently RUNNING", this one means
                  "where its asset has been PUSHED into an ad library". Adjacent
                  so the distinction reads; conflating them would make both lie.
                  Returns null outside v3. */}
              {workflowsEnabled && (
                <Band>
                  <SyncStatusPanel rollup={rollup} />
                </Band>
              )}
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
