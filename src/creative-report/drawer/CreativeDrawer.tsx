/**
 * CreativeDrawer — the creative detail overlay (handoff §5.2), rebuilt per
 * Maalik's two complaints on the first redesign pass:
 *   1. It shipped as a centred `Dialog` when the references call for a
 *      right-side panel — Ref A is an edge-attached panel with the app nav
 *      staying visible and dimmed behind it, not a centred overlay. Now a
 *      shadcn `Sheet` (`side="right"`), fixed at 1100px.
 *   2. The layout read flat next to the references — hairline-divided bands
 *      is the old 720px-drawer convention (see creative-report-v2's
 *      CreativeDrawer for that original pattern). Ref B's quality bar is
 *      discrete rounded cards, generous padding, real gaps, sitting on a
 *      subtly-tinted page background — so the scroll body is now `bg-muted/30`
 *      and each section is its own `rounded-xl border bg-card` card.
 * Opens/closes via the ?creative=:id URL param so it's shareable and the back
 * button works.
 *
 * Layout — hybrid of the two references Maalik gave:
 *   Header      — bucket + brand·product eyebrow, name, a new meta line
 *                 (platform(s) · format · first-seen · account count — Ref
 *                 B's "Advertiser · First seen Apr 26 · 53 days running · 16
 *                 regions" line, built only from facts CreativeRollup has),
 *                 the core action loop (Ref A puts its primary actions in the
 *                 header), close X (Sheet's built-in one — no second X).
 *   Top zone    — 2 columns: ad preview (left) + real-fact metadata (right)
 *                 — Ref A's ad-detail top. AdPreviewMock already renders
 *                 itself as one rounded-xl bordered card (its own "Ad
 *                 preview" label sits above that box) — it is NOT re-wrapped
 *                 in a Card here, only MetadataGrid is, so the row still
 *                 reads as a matched pair without nesting two borders of the
 *                 same shape.
 *   KPI card    — outcome numbers in one row with hairline dividers (Ref B),
 *                 wrapped in a single Card — KpiStrip itself has no self-card.
 *   Funnel      — the existing stage-by-stage funnel, kept full-width in its
 *                 own Card (6 cells need the room; KpiStrip and FunnelStrip
 *                 never repeat the same number — see each file's own header
 *                 comment).
 *   2-card rows — existing bands paired side by side as two Cards with a real
 *                 gap between them, instead of stacked full-width — Ref B's
 *                 chart-card rhythm.
 *   Full-width  — RunningInTable (5-column table with 40-char campaign
 *                 names — genuinely needs the room), SyncStatusPanel (right
 *                 after RunningInTable — see that band's own comment for why
 *                 the adjacency is deliberate, not a two-card pairing), and
 *                 VariantsList (the merge/split dedup control deserves full
 *                 attention, not a 520px squeeze) stay full-width by design,
 *                 each its own Card.
 *   Framework   — teaser Card, but only rendered for video creatives (the
 *                 component itself returns null for static/carousel — gating
 *                 it here too, before the Card wrapper, so a non-video
 *                 creative never shows an empty bordered box).
 *   Related     — the bottom "similar ads" grid (Ref A's role), fed only by
 *                 variants + dedup pair — no new data. NOT wrapped in a Card:
 *                 it already renders its own per-item bordered tiles, and
 *                 Ref A shows this as a full-bleed grid section, not a single
 *                 enclosing card.
 *
 * One-sub-container rule: a card must never contain another bordered card.
 * Every section below is exactly one card deep — see the per-band notes
 * above for which bands were already self-carding (AdPreviewMock only, of
 * the components this file composes) versus which get a Card here.
 *
 * The secondary action bar (Compare/Duplicate/Edit targeting/Pause) stays
 * pinned at the bottom — see DrawerActionBar's own header comment for why
 * the loop was split instead of duplicated.
 */
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
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
import { SyncStatusPanel } from "@/creative-report/drawer/SyncStatusPanel";
import { VariantsList } from "@/creative-report/drawer/VariantsList";
import { RelatedCreativesGrid } from "@/creative-report/drawer/RelatedCreativesGrid";
import { DrawerActionBar } from "@/creative-report/drawer/DrawerActionBar";
import { FrameworkTeaserBand } from "@/creative-report/drawer/analysis/FrameworkTeaserBand";
import { AnalysisTab } from "@/creative-report/drawer/analysis/AnalysisTab";
import { useCreativeActions } from "@/creative-report/actions/useCreativeActions";
import { truncate, pluralize, fmtDate, NAME_MAX } from "@/creative-report/lib/format";
import { PLATFORM_LABELS, FORMAT_LABELS } from "@/creative-report/lib/paramSchema";
import { getBrand } from "@/mocks/shared/brands";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

/** A section rendered as its own discrete rounded card on the tinted scroll
 *  body — replaces the old hairline-divided Band (Ref B's chart-card
 *  rhythm). Never nest another bordered card inside one of these. */
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
      {children}
    </section>
  );
}

/** Two cards side by side with a real gap (Ref B), instead of each band
 *  taking the full 1100px width on its own line. */
function TwoCardRow({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>{left}</Card>
      <Card>{right}</Card>
    </div>
  );
}

/** Meta line under the title (Ref B: "Advertiser · First seen Apr 26 · 53
 *  days running · 16 regions") — built only from facts CreativeRollup
 *  genuinely has: platform(s), format, first-seen date, account count. */
function metaLine(rollup: CreativeRollup): string {
  const parts = [
    rollup.platforms.length > 0
      ? rollup.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")
      : null,
    FORMAT_LABELS[rollup.creative.format],
    `First seen ${fmtDate(rollup.creative.createdAt)}`,
    rollup.accountIds.length > 0 ? pluralize(rollup.accountIds.length, "account") : null,
  ];
  return parts.filter(Boolean).join(" · ");
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
    <Sheet open={open} onOpenChange={(o) => !o && a.closeDrawer()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[1100px]"
      >
        {rollup && (
          <>
            {/* Header — identity + meta line + the core action loop, all up top (Ref A). */}
            <SheetHeader className="shrink-0 border-b border-border px-6 py-4 pr-14 text-left">
              <div className="flex items-center gap-2">
                {rollup.bucket && <BucketChip bucket={rollup.bucket} size="xs" />}
                <span className="text-xs text-muted-foreground">
                  {rollup.creative.brandId
                    ? `${getBrand(rollup.creative.brandId)?.name ?? rollup.creative.brandId} · ${rollup.creative.product}`
                    : rollup.creative.product}
                </span>
              </div>
              <SheetTitle
                className="mt-0.5 truncate text-lg font-semibold text-foreground"
                title={name.truncated ? rollup.creative.name : undefined}
              >
                {name.text}
              </SheetTitle>
              <p className="text-xs text-muted-foreground">{metaLine(rollup)}</p>
              <div className="mt-1">
                <DrawerActionBar rollup={rollup} slot="primary" />
              </div>
            </SheetHeader>

            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as "overview" | "analysis")}
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList className="mx-6 mt-3 w-fit shrink-0">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent
                value="overview"
                className="mt-0 min-h-0 flex-1 overflow-y-auto bg-muted/30"
              >
                <div className="flex flex-col gap-4 p-6">
                  {/* Top zone — ad preview (self-carding, passed through) +
                      real-fact metadata card. Ref A. */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <AdPreviewMock rollup={rollup} />
                    <Card>
                      <MetadataGrid rollup={rollup} />
                    </Card>
                  </div>

                  {/* KPI card — outcome numbers, hairline-divided. Ref B. */}
                  <Card>
                    <KpiStrip rollup={rollup} />
                  </Card>

                  {/* Full-funnel detail — kept full-width; 6 stages need the
                      room, and it shares no number with the KPI card above. */}
                  <Card>
                    <FunnelStrip rollup={rollup} />
                  </Card>

                  <TwoCardRow left={<TrendChart rollup={rollup} />} right={<FatiguePanel rollup={rollup} />} />

                  <TwoCardRow
                    left={<ComponentBreakdown rollup={rollup} />}
                    right={<ScriptElementsPanel rollup={rollup} />}
                  />

                  <TwoCardRow
                    left={<BenchmarkPanel rollup={rollup} />}
                    right={<DemographicsPanel rollup={rollup} />}
                  />

                  {/* Full-width by design — a 5-column table with long
                      campaign names would be crushed at ~520px. */}
                  <Card>
                    <RunningInTable
                      rollup={rollup}
                      onCompareContexts={() => a.compare([rollup.creative.id])}
                    />
                  </Card>

                  {/* Deliberately its own card right after RunningInTable's,
                      not paired into a two-card row: RunningInTable = where
                      this creative is currently running (live delivery);
                      SyncStatusPanel = where its asset has been pushed into
                      an ad account's creative *library* by the sync
                      automation. Kept adjacent so the two related-but-
                      distinct facts read together, never merged into one
                      card that would blur the difference. */}
                  <Card>
                    <SyncStatusPanel rollup={rollup} />
                  </Card>

                  {/* Full-width by design — the merge/split dedup control is
                      an action surface, not a stat card; it deserves full
                      attention. */}
                  <Card>
                    <VariantsList rollup={rollup} />
                  </Card>

                  {/* Video-only — gated here (not just inside the component)
                      so a static/carousel creative never shows an empty
                      bordered Card. */}
                  {rollup.creative.format === "video" && (
                    <Card>
                      <FrameworkTeaserBand rollup={rollup} onOpenAnalysis={() => setTab("analysis")} />
                    </Card>
                  )}

                  {/* Bottom "similar ads" grid — Ref A's role, fed only by
                      variants + the dedup pair already shown above. Not a
                      Card: it already renders its own per-item bordered
                      tiles, and Ref A shows this as a full-bleed grid, not
                      one more enclosing card. */}
                  <RelatedCreativesGrid rollup={rollup} />
                </div>
              </TabsContent>

              <TabsContent
                value="analysis"
                className="mt-0 min-h-0 flex-1 overflow-y-auto bg-muted/30 p-6"
              >
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
      </SheetContent>
    </Sheet>
  );
}
