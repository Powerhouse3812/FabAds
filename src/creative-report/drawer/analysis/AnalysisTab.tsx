/**
 * AnalysisTab — the drawer's "Analysis" tab (modelled on the Video Sage
 * Figma: Visual summary · Framework · Cognitive Insights sub-tabs, a credit
 * balance pill, and a Regenerate control top-right).
 *
 * Visual summary is always free (real, folded FB data — see
 * VisualSummaryPanel). Framework and Cognitive Insights are one shared
 * credit-gated reveal (analysisStore's idle→analysing→analysed machine) —
 * revealing either unlocks both, since Video Sage's own analysis is a single
 * job that produces both outputs together.
 */
import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BALANCE_CEILING,
  getStatus,
  regenerateAnalysis,
  useAnalysisStore,
} from "@/creative-report/lib/analysisStore";
import { VisualSummaryPanel } from "@/creative-report/drawer/analysis/VisualSummaryPanel";
import { FrameworkPanel } from "@/creative-report/drawer/analysis/FrameworkPanel";
import { CognitiveInsightsPanel } from "@/creative-report/drawer/analysis/CognitiveInsightsPanel";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

export function AnalysisTab({ rollup }: { rollup: CreativeRollup }) {
  const store = useAnalysisStore();
  const creativeId = rollup.creative.id;
  const status = useMemo(() => getStatus(store, creativeId), [store, creativeId]);
  const isVideo = rollup.creative.format === "video";

  return (
    <Tabs defaultValue={status === "idle" ? "visual-summary" : "framework"}>
      <div className="flex items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="visual-summary">Visual summary</TabsTrigger>
          <TabsTrigger value="framework">Framework</TabsTrigger>
          <TabsTrigger value="cognitive">Cognitive insights</TabsTrigger>
        </TabsList>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {store.balance}/{BALANCE_CEILING} credits (simulated)
          </span>
          {isVideo && status === "analysed" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => regenerateAnalysis(creativeId)}
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </Button>
          )}
        </div>
      </div>

      <TabsContent value="visual-summary" className="mt-4">
        <VisualSummaryPanel rollup={rollup} />
      </TabsContent>
      <TabsContent value="framework" className="mt-4">
        <FrameworkPanel rollup={rollup} status={status} balance={store.balance} />
      </TabsContent>
      <TabsContent value="cognitive" className="mt-4">
        <CognitiveInsightsPanel rollup={rollup} status={status} balance={store.balance} />
      </TabsContent>
    </Tabs>
  );
}
