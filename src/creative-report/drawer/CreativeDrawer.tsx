/**
 * CreativeDrawer — the creative detail overlay (handoff §5.2, redesigned per
 * Maalik's two references: a 1100px centred overlay, not a 720px side sheet).
 * Opens/closes via the ?creative=:id URL param so it's shareable and the back
 * button works.
 *
 * Layout — hybrid of the two references Maalik gave:
 *   Header      — name, bucket, brand·product meta line, the core action
 *                 loop promoted up top (Ref A puts its primary actions in
 *                 the header), close X.
 *   Top zone    — 2 columns: ad preview (left) + real-fact metadata grid
 *                 (right) — Ref A's ad-detail top.
 *   KPI strip   — outcome numbers in one row with hairline dividers — Ref B.
 *   Funnel      — the existing stage-by-stage funnel, kept full-width (6
 *                 cells need the room; KpiStrip and FunnelStrip never repeat
 *                 the same number — see each file's own header comment).
 *   2-col rows  — existing bands paired side by side instead of stacked
 *                 full-width — Ref B's chart-card rhythm.
 *   Full-width  — RunningInTable (5-column table with 40-char campaign
 *                 names — genuinely needs the room) and VariantsList (the
 *                 merge/split dedup control deserves full attention, not a
 *                 520px squeeze) stay full-width by design, not stacked here
 *                 out of neglect.
 *   Related     — the new bottom "similar ads" grid (Ref A's role), fed only
 *                 by variants + dedup pair — no new data.
 *
 * Sections are hairline-divided bands — never nested cards (one sub-container
 * level max). The secondary action bar (Compare/Duplicate/Edit targeting/
 * Pause) stays pinned at the bottom — see DrawerActionBar's own header
 * comment for why the loop was split instead of duplicated.
 */
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BucketChip } from "@/creative-report/components/BucketChip";
import { AdPreviewMock } from "@/creative-report/drawer/AdPreviewMock";
import { MetadataGrid } from "@/creative-report/drawer/MetadataGrid";
import { KpiStrip } from "@/creative-report/drawer/KpiStrip";
import { FunnelStrip } from "@/creative-report/drawer/FunnelStrip";
import { TrendChart } from "@/creative-report/drawer/TrendChart";
import { FatiguePanel } from "@/creative-report/drawer/FatiguePanel";
import { ComponentBreakdown } from "@/creative-report/drawer/ComponentBreakdown";
import { ScriptElementsPanel } from "@/creative-report/drawer/ScriptElementsPanel";
import { BenchmarkPanel } from "@/creative-report/drawer/BenchmarkPanel";
import { DemographicsPanel } from "@/creative-report/drawer/DemographicsPanel";
import { RunningInTable } from "@/creative-report/drawer/RunningInTable";
import { VariantsList } from "@/creative-report/drawer/VariantsList";
import { RelatedCreativesGrid } from "@/creative-report/drawer/RelatedCreativesGrid";
import { DrawerActionBar } from "@/creative-report/drawer/DrawerActionBar";
import { FrameworkTeaserBand } from "@/creative-report/drawer/analysis/FrameworkTeaserBand";
import { AnalysisTab } from "@/creative-report/drawer/analysis/AnalysisTab";
import { useCreativeActions } from "@/creative-report/actions/useCreativeActions";
import { truncate, NAME_MAX } from "@/creative-report/lib/format";
import { getBrand } from "@/mocks/shared/brands";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

function Band({ children }: { children: React.ReactNode }) {
  return <section className="border-b border-border px-6 py-5">{children}</section>;
}

/** Two existing bands laid out side by side (Ref B's chart-card rhythm)
 *  instead of each taking the full 1100px width on its own line. */
function TwoCol({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

export function CreativeDrawer({ rollup }: { rollup: CreativeRollup | null }) {
  const a = useCreativeActions();
  const open = rollup !== null;
  const name = rollup ? truncate(rollup.creative.name, NAME_MAX) : { text: "", truncated: false };
  // Controlled so FrameworkTeaserBand's "start analysis" shortcut can jump
  // straight into the Analysis tab. Reset to Overview whenever a different
  // creative opens, so the previous creative's tab choice never leaks in.
  const [tab, setTab] = useState<"overview" | "analysis">("overview");
  useEffect(() => {
    setTab("overview");
  }, [rollup?.creative.id]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && a.closeDrawer()}>
      <DialogContent
        className="flex w-[calc(100%-2rem)] max-w-[1100px] flex-col gap-0 overflow-hidden p-0 sm:rounded-xl"
        style={{ maxHeight: "min(880px, calc(100vh - 4rem))" }}
      >
        {rollup && (
          <>
            {/* Header — identity + meta line + the core action loop, all up top (Ref A). */}
            <div className="shrink-0 border-b border-border px-6 py-4 pr-14">
              <div className="flex items-center gap-2">
                {rollup.bucket && <BucketChip bucket={rollup.bucket} size="xs" />}
                <span className="text-xs text-muted-foreground">
                  {rollup.creative.brandId
                    ? `${getBrand(rollup.creative.brandId)?.name ?? rollup.creative.brandId} · ${rollup.creative.product}`
                    : rollup.creative.product}
                </span>
              </div>
              <DialogTitle
                className="mt-0.5 truncate text-lg font-semibold text-foreground"
                title={name.truncated ? rollup.creative.name : undefined}
              >
                {name.text}
              </DialogTitle>
              <div className="mt-3">
                <DrawerActionBar rollup={rollup} slot="primary" />
              </div>
            </div>

            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as "overview" | "analysis")}
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList className="mx-6 mt-3 w-fit shrink-0">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0 min-h-0 flex-1 overflow-y-auto">
                {/* Top zone — ad preview (left) + real-fact metadata grid (right). Ref A. */}
                <Band>
                  <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
                    <AdPreviewMock rollup={rollup} />
                    <MetadataGrid rollup={rollup} />
                  </div>
                </Band>

                {/* KPI strip — outcome numbers, hairline-divided. Ref B. */}
                <Band>
                  <KpiStrip rollup={rollup} />
                </Band>

                {/* Full-funnel detail — kept full-width; 6 stages need the room,
                    and it shares no number with KpiStrip above. */}
                <Band>
                  <FunnelStrip rollup={rollup} />
                </Band>

                <Band>
                  <TwoCol left={<TrendChart rollup={rollup} />} right={<FatiguePanel rollup={rollup} />} />
                </Band>

                <Band>
                  <TwoCol
                    left={<ComponentBreakdown rollup={rollup} />}
                    right={<ScriptElementsPanel rollup={rollup} />}
                  />
                </Band>

                <Band>
                  <TwoCol
                    left={<BenchmarkPanel rollup={rollup} />}
                    right={<DemographicsPanel rollup={rollup} />}
                  />
                </Band>

                {/* Full-width by design — a 5-column table with long campaign
                    names would be crushed at ~520px. */}
                <Band>
                  <RunningInTable
                    rollup={rollup}
                    onCompareContexts={() => a.compare([rollup.creative.id])}
                  />
                </Band>

                {/* Full-width by design — the merge/split dedup control is an
                    action surface, not a stat card; it deserves full attention. */}
                <Band>
                  <VariantsList rollup={rollup} />
                </Band>

                <Band>
                  <FrameworkTeaserBand rollup={rollup} onOpenAnalysis={() => setTab("analysis")} />
                </Band>

                {/* Bottom "similar ads" grid — Ref A's role, fed only by
                    variants + the dedup pair already shown above. */}
                <div className="px-6 py-5">
                  <RelatedCreativesGrid rollup={rollup} />
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <AnalysisTab rollup={rollup} />
              </TabsContent>
            </Tabs>

            {/* Secondary action bar — Compare / Duplicate / Edit targeting /
                Pause. Slimmer and less frequent than the header's core loop. */}
            <div className="shrink-0 border-t border-border bg-card/95 px-6 py-2.5 backdrop-blur">
              <DrawerActionBar rollup={rollup} slot="secondary" />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
