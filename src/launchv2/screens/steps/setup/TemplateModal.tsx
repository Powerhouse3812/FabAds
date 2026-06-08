/**
 * TemplateModal — the "Edit" reveal for the selected targeting template. Shows
 * the template's full ad-set settings (locations, age, gender, placements,
 * detailed targeting, exclusions). Read/edit surface for the mock; special ad
 * category locks age/gender/lookalikes, reflected here via `locked`.
 *
 * Wave 2 wiring:
 *   - controlled state for editable A+ toggles (audience, creative) +
 *     destinationType override; Done saves via flow.patch, Cancel reverts.
 *   - destinationType lives under an "Advanced" reveal inside the modal,
 *     options gated by DESTINATIONS_BY_OBJECTIVE[plan.objective].
 */
import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, Lock, Sparkles } from "lucide-react";
import type { TargetingTemplateV2 } from "../../../data";
import type { DestinationType } from "../../../types";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import { DESTINATIONS_BY_OBJECTIVE } from "../../../reducer";

/** Friendly labels for DestinationType — matches Step1/data conventions. */
const DEST_LABEL: Record<DestinationType, string> = {
  WEBSITE: "Website",
  APP: "App",
  MESSENGER: "Messenger",
  WHATSAPP: "WhatsApp",
  INSTAGRAM_DIRECT: "Instagram Direct",
  ON_AD: "On your ad (instant form)",
  ON_POST: "On your post",
  ON_PAGE: "On your Page",
  ON_EVENT: "On your event",
  ON_VIDEO: "On your video",
  PHONE_CALL: "Phone call",
  PRODUCT_CATALOG_SALES: "Product catalog",
};

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
  flow,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: TargetingTemplateV2;
  specialActive: boolean;
  flow: UseFlowV2;
}) {
  const { plan, patch } = flow;
  const s = template.settings;

  // Editable state — seeded from plan + template each time the modal opens.
  const [advAudience, setAdvAudience] = useState(plan.advantageAudience);
  const [advCreative, setAdvCreative] = useState(plan.advantageCreative);
  const [destinationType, setDestinationType] = useState<DestinationType | null>(
    plan.destinationType ?? template.destinationType ?? null,
  );
  const [advOpen, setAdvOpen] = useState(false);

  // Re-sync local state every time the modal opens so a Cancel→reopen shows
  // the latest committed values, not stale local edits.
  useEffect(() => {
    if (!open) return;
    setAdvAudience(plan.advantageAudience);
    setAdvCreative(plan.advantageCreative);
    setDestinationType(plan.destinationType ?? template.destinationType ?? null);
    setAdvOpen(false);
  }, [open, plan.advantageAudience, plan.advantageCreative, plan.destinationType, template.destinationType]);

  // Destination options gated by the current objective.
  const destOptions: DestinationType[] = plan.objective
    ? DESTINATIONS_BY_OBJECTIVE[plan.objective]
    : [];

  const handleDone = () => {
    patch({
      advantageAudience: advAudience,
      advantageCreative: advCreative,
      ...(destinationType ? { destinationType } : {}),
    });
    onOpenChange(false);
  };

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

          <Separator />

          {/* A+ toggles — editable, saved on Done */}
          <Row label="Advantage+ Audience">
            <div className="flex items-center gap-2">
              <Switch checked={advAudience} onCheckedChange={setAdvAudience} />
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                Start broad; Meta finds buyers.
              </span>
            </div>
          </Row>
          <Row label="Advantage+ Creative">
            <div className="flex items-center gap-2">
              <Switch checked={advCreative} onCheckedChange={setAdvCreative} />
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                Auto creative enhancements per placement.
              </span>
            </div>
          </Row>

          {/* Advanced reveal — destination override */}
          <Collapsible open={advOpen} onOpenChange={setAdvOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              <ChevronDown className={cn("h-4 w-4 transition-transform", advOpen && "rotate-180")} />
              Advanced — destination
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <Row label="Destination">
                <Select
                  value={destinationType ?? undefined}
                  onValueChange={(v) => setDestinationType(v as DestinationType)}
                >
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue placeholder="Pick a destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {(destOptions.length ? destOptions : (Object.keys(DEST_LABEL) as DestinationType[])).map(
                      (d) => (
                        <SelectItem key={d} value={d}>
                          {DEST_LABEL[d]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Overrides the plan destination. Options gated by current objective.
                </p>
              </Row>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDone}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
