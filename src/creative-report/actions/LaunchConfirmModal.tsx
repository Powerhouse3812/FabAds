/**
 * Launch / Relaunch confirm modal — the "→ Launch 2.0" exit (handoff §6).
 * Shows a prefilled summary, adds intentional friction (a confirm step) before
 * a spend-affecting action, then optimistically flips the creative to
 * "Queued in Launch" + toasts. Clearly simulated.
 */
import { useState } from "react";
import { Rocket, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { setQueuedInLaunch } from "@/creative-report/actions/actionStore";
import { fmtCompactCurrency, fmtMultiple } from "@/creative-report/lib/format";
import { PLATFORM_LABELS, type Platform } from "@/creative-report/lib/paramSchema";
import type { CreativeRollup } from "@/creative-report/lib/selectors";
import { LaunchedBeforeCard } from "@/creative-report/components/LaunchedBeforeCard";

export function LaunchConfirmModal({
  rollup,
  open,
  onOpenChange,
}: {
  rollup: CreativeRollup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  if (!rollup) return null;
  const { creative, metrics, platforms } = rollup;

  const confirm = () => {
    setSubmitting(true);
    // Simulate a brief round-trip, then optimistically mark queued.
    window.setTimeout(() => {
      setQueuedInLaunch(creative.id);
      setSubmitting(false);
      onOpenChange(false);
      toast({
        title: "Sent to Launch (simulated)",
        description: `${creative.product} is queued in Launch 2.0.`,
      });
    }, 450);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Relaunch this creative?
          </DialogTitle>
          <DialogDescription>
            This queues the creative in Launch 2.0 with its current setup. Review
            the summary before you send — this affects spend.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
          <div className="truncate font-medium text-foreground" title={creative.name}>
            {creative.name}
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-y-1.5 text-[13px]">
            <dt className="text-muted-foreground">Product</dt>
            <dd className="text-right text-foreground">{creative.product}</dd>
            <dt className="text-muted-foreground">Platforms</dt>
            <dd className="text-right text-foreground">
              {platforms.map((p: Platform) => PLATFORM_LABELS[p]).join(", ")}
            </dd>
            <dt className="text-muted-foreground">Spend (range)</dt>
            <dd className="text-right tabular-nums text-foreground">
              {fmtCompactCurrency(metrics.spend)}
            </dd>
            <dt className="text-muted-foreground">ROAS</dt>
            <dd className="text-right tabular-nums text-foreground">
              {fmtMultiple(metrics.roas)}
            </dd>
          </dl>
        </div>

        <LaunchedBeforeCard
          brandId={creative.brandId}
          categoryId={creative.categoryId}
          excludeCreativeId={creative.id}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={submitting} className="gap-1.5">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Send to Launch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
