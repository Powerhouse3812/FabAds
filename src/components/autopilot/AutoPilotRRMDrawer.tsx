import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AccountState, AccountRRMState } from "./AutoPilotAccountsTab";

const HEALTH_BADGE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  safe: { label: "Safe", variant: "default" },
  warning: { label: "Warning", variant: "secondary" },
  recovery: { label: "Recovery", variant: "secondary" },
  risk: { label: "Risk", variant: "destructive" },
  critical: { label: "Critical", variant: "destructive" },
  blocked: { label: "Blocked", variant: "outline" },
};

const GUARDRAIL_MODES = [
  { value: "off", label: "Off" },
  { value: "monitor", label: "Monitor Only" },
  { value: "auto_maintain", label: "Auto Maintain" },
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  account: AccountState | null;
  onUpdate: (a: AccountState) => void;
}

export function AutoPilotRRMDrawer({ open, onOpenChange, account, onUpdate }: Props) {
  if (!account) return null;

  const rrm = account.rrm;

  const setRRM = (partial: Partial<AccountRRMState>) => {
    onUpdate({ ...account, rrm: { ...rrm, ...partial } });
  };

  const health = HEALTH_BADGE_MAP[rrm.healthState] || HEALTH_BADGE_MAP.safe;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>RRM Settings — {account.name}</SheetTitle>
          <SheetDescription>Rejection Ratio Management configuration for this account.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Health State */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Health State</Label>
            <Badge variant={health.variant} className="text-xs">{health.label}</Badge>
          </div>

          <Separator />

          {/* Guardrail Mode */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Guardrail Mode</Label>
            <Select value={rrm.guardrailMode} onValueChange={(v) => setRRM({ guardrailMode: v })}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GUARDRAIL_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {rrm.guardrailMode === "auto_maintain"
                ? "Automatically dilutes and replaces when rejection thresholds are breached."
                : rrm.guardrailMode === "monitor"
                  ? "Monitors rejection ratios and alerts — no automatic actions."
                  : "RRM is disabled for this account."}
            </p>
          </div>

          <Separator />

          {/* Dilution */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Dilution</Label>
              <p className="text-xs text-muted-foreground">Auto-launch clean ads to lower rejection ratio.</p>
            </div>
            <Switch checked={rrm.dilutionEnabled} onCheckedChange={(v) => setRRM({ dilutionEnabled: v })} />
          </div>

          {/* Replacement */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Replacement</Label>
              <p className="text-xs text-muted-foreground">Replace rejected ads with approved creative.</p>
            </div>
            <Switch checked={rrm.replacementEnabled} onCheckedChange={(v) => setRRM({ replacementEnabled: v })} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
