/**
 * Edit targeting modal — iter-2 P5 "fuller Launch actions". Reviews the
 * creative's CURRENT targeting (the most-spend-weighted real age/gender/geo
 * slice from its own instances — not a guess), lets the buyer adjust before
 * relaunching. Same friction-then-toast pattern as LaunchConfirmModal:
 * queues in Launch 2.0, clearly simulated.
 */
import { useEffect, useState } from "react";
import { Loader2, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { setQueuedInLaunch } from "@/creative-report/actions/actionStore";
import { demographicSplit, type CreativeRollup } from "@/creative-report/lib/selectors";
import { AGE_OPTIONS, GENDER_OPTIONS, GEO_OPTIONS, PLACEMENT_OPTIONS } from "@/creative-report/lib/paramSchema";

function topKey(slices: { key: string; metrics: { spend: number } }[], fallback: string): string {
  return slices[0]?.key ?? fallback;
}

export function EditTargetingModal({
  rollup,
  open,
  onOpenChange,
}: {
  rollup: CreativeRollup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [age, setAge] = useState<string>(AGE_OPTIONS[0]);
  const [gender, setGender] = useState<string>(GENDER_OPTIONS[0]);
  const [geo, setGeo] = useState<string>(GEO_OPTIONS[0]);
  const [placement, setPlacement] = useState<string>(PLACEMENT_OPTIONS[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!rollup || !open) return;
    const split = demographicSplit(rollup);
    setAge(topKey(split.byAge, AGE_OPTIONS[0]));
    setGender(topKey(split.byGender, GENDER_OPTIONS[0]));
    setGeo(topKey(split.byGeo, GEO_OPTIONS[0]));
    // Placement isn't part of demographicSplit's three dimensions — default
    // to the current filter's first option rather than inventing a "top"
    // placement from data this function doesn't fold.
    setPlacement(PLACEMENT_OPTIONS[0]);
  }, [rollup, open]);

  if (!rollup) return null;
  const { creative } = rollup;

  const confirm = () => {
    setSubmitting(true);
    window.setTimeout(() => {
      setQueuedInLaunch(creative.id);
      setSubmitting(false);
      onOpenChange(false);
      toast({
        title: "Relaunched with updated targeting (simulated)",
        description: `${creative.product} queued in Launch 2.0 — ${age}, ${gender === "all" ? "All genders" : gender}, ${geo}, ${placement}.`,
      });
    }, 450);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Edit targeting
          </DialogTitle>
          <DialogDescription>
            Starting point is this creative's own highest-spend age/gender/geo slice.
            Adjust, then relaunch with the new targeting.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Age</span>
            <Select value={age} onValueChange={setAge}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGE_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Gender</span>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>{o === "all" ? "All genders" : o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Geo</span>
            <Select value={geo} onValueChange={setGeo}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GEO_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Placement</span>
            <Select value={placement} onValueChange={setPlacement}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLACEMENT_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={submitting} className="gap-1.5">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
            Save &amp; relaunch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
