/**
 * DistributionSurface — composed editor for Step 4 Distribution.
 * Bundles: Structure + Creative spread + Page split + Cap meter with fixes.
 */
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import PageSplitPicker from "./PageSplitPicker";
import CapMeterWithFixes from "./CapMeterWithFixes";
import SpreadPicker from "../spread/SpreadPicker";

export default function DistributionSurface({ flow }: { flow: UseFlowV2 }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-4 p-4">
        <SpreadPicker flow={flow} />
        <Separator />
        <PageSplitPicker flow={flow} />
        <CapMeterWithFixes flow={flow} />
      </CardContent>
    </Card>
  );
}
