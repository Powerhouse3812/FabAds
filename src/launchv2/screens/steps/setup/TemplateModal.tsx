/**
 * TemplateModal — the "Edit" reveal for the selected targeting template. Shows
 * the template's full ad-set settings (locations, age, gender, placements,
 * detailed targeting, exclusions). Read/edit surface for the mock; special ad
 * category locks age/gender/lookalikes, reflected here via `locked`.
 */
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Lock } from "lucide-react";
import type { TargetingTemplateV2 } from "../../../data";

function Row({
  label,
  locked,
  reason,
  children,
}: {
  label: string;
  locked?: boolean;
  reason?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 items-center gap-3">
      <Label className="flex items-center gap-1 text-xs text-muted-foreground">
        {label}
        {locked && <Lock className="h-3 w-3" />}
      </Label>
      <div className="col-span-2">
        {children}
        {locked && reason && <p className="mt-0.5 text-[11px] text-muted-foreground">{reason}</p>}
      </div>
    </div>
  );
}

function Chips({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <span className="text-xs text-muted-foreground">{empty}</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((i) => (
        <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground">
          {i}
        </span>
      ))}
    </div>
  );
}

export function TemplateModal({
  open,
  onOpenChange,
  template,
  specialActive,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: TargetingTemplateV2;
  specialActive: boolean;
}) {
  const s = template.settings;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>Targeting template — ad-set level settings.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <Row label="Locations">
            <Input defaultValue={s.locations} className="h-8 text-sm" />
          </Row>
          <Row
            label="Age range"
            locked={specialActive}
            reason={specialActive ? "Fixed 18–65+ for special ad category" : undefined}
          >
            <div className="flex items-center gap-2">
              <Input
                defaultValue={specialActive ? 18 : s.ageMin}
                disabled={specialActive}
                className="h-8 w-20 text-sm font-mono tabular-nums"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                defaultValue={specialActive ? 65 : s.ageMax}
                disabled={specialActive}
                className="h-8 w-20 text-sm font-mono tabular-nums"
              />
            </div>
          </Row>
          <Row
            label="Gender"
            locked={specialActive}
            reason={specialActive ? "All genders for special ad category" : undefined}
          >
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs capitalize",
                "bg-muted text-foreground",
              )}
            >
              {specialActive ? "all" : s.gender}
            </span>
          </Row>

          <Separator />

          <Row label="Placements">
            <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
              {s.placements === "advantage" ? "Advantage+ (auto)" : "Manual"}
            </span>
          </Row>
          <Row label="Detailed targeting">
            <Chips items={s.detailedTargeting} empty="Broad — no detailed targeting" />
          </Row>
          <Row
            label="Lookalikes / exclusions"
            locked={specialActive}
            reason={specialActive ? "Lookalikes unavailable for special ad category" : undefined}
          >
            <Chips items={specialActive ? [] : s.exclusions} empty={specialActive ? "Unavailable" : "None"} />
          </Row>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
