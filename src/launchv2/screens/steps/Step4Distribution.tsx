/**
 * Step 4 — Distribution (Variant V2, 5-step flow).
 * Preview-first: ad-tree visualization on top, unified controls below.
 *   - Tree shows: campaign structure + per-page cap allocation
 *   - Controls: Structure × Creative spread × Page split × Cap fixes
 */
import type { UseFlowV2 } from "../../state/useFlowV2";
import AdTreeVisualization from "./distribution/AdTreeVisualization";
import DistributionSurface from "./distribution/DistributionSurface";

export default function Step4Distribution({ flow }: { flow: UseFlowV2 }) {
  return (
    <div data-screen="lv2-step4-distribution" className="space-y-4">
      <AdTreeVisualization flow={flow} />
      <DistributionSurface flow={flow} />
    </div>
  );
}
