/**
 * DetailUnitTree — the per-run ad-unit breakdown on the Launch v2 Detail screen,
 * grouped campaign → ad set → unit. Reads run.units (re-renders live as the mock
 * ticks). Each leaf shows the creative, destination Page, live status and — for
 * failed units — the failure code + message + a retryable / won't-retry tag.
 * Failed groups default open so problems are never hidden.
 */
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { AdUnitV2, UnitStatus } from "../../types";
import { ERR, ERR_TEXT, OK, WARN_TEXT } from "./reviewParts";

export type UnitFilter = "all" | "failed" | "created" | "pending";

export function matchesFilter(u: AdUnitV2, filter: UnitFilter): boolean {
  switch (filter) {
    case "failed":
      return u.status === "failed";
    case "created":
      return u.status === "created";
    case "pending":
      return u.status === "pending" || u.status === "creating";
    default:
      return true;
  }
}

interface AdSetGroup {
  adSetName: string;
  units: AdUnitV2[];
  failed: number;
}
interface CampaignGroup {
  campaignName: string;
  adSets: AdSetGroup[];
  total: number;
  failed: number;
}

function groupUnits(units: AdUnitV2[]): CampaignGroup[] {
  const campaigns = new Map<string, Map<string, AdUnitV2[]>>();
  for (const u of units) {
    let adSets = campaigns.get(u.campaignName);
    if (!adSets) {
      adSets = new Map();
      campaigns.set(u.campaignName, adSets);
    }
    const arr = adSets.get(u.adSetName);
    if (arr) arr.push(u);
    else adSets.set(u.adSetName, [u]);
  }
  return [...campaigns.entries()].map(([campaignName, adSets]) => {
    const groups: AdSetGroup[] = [...adSets.entries()].map(([adSetName, us]) => ({
      adSetName,
      units: us,
      failed: us.filter((u) => u.status === "failed").length,
    }));
    return {
      campaignName,
      adSets: groups,
      total: groups.reduce((n, g) => n + g.units.length, 0),
      failed: groups.reduce((n, g) => n + g.failed, 0),
    };
  });
}

function UnitStatusTag({ status }: { status: UnitStatus }) {
  const meta: Record<UnitStatus, { label: string; color: string; pulse?: boolean }> = {
    pending: { label: "Pending", color: "rgba(15,15,12,0.45)" },
    creating: { label: "Creating", color: "#5B7611", pulse: true },
    created: { label: "Created", color: OK },
    failed: { label: "Failed", color: ERR },
  };
  const m = meta[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: m.color }}>
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", m.pulse && "animate-pulse")}
        style={{ backgroundColor: m.color }}
      />
      {m.label}
    </span>
  );
}

function RetryableTag({ retryable }: { retryable: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={
        retryable
          ? { color: WARN_TEXT, backgroundColor: "rgba(250,173,20,0.16)" }
          : { color: ERR_TEXT, backgroundColor: "rgba(255,77,79,0.12)" }
      }
    >
      {retryable ? "Retryable" : "Won't retry"}
    </span>
  );
}

function FailureDetail({ unit }: { unit: AdUnitV2 }) {
  if (!unit.failure) return null;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-tight">
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
        {unit.failure.code}
      </code>
      <span className="text-muted-foreground">{unit.failure.message}</span>
      <RetryableTag retryable={unit.failure.retryable} />
    </div>
  );
}

function UnitRow({ unit }: { unit: AdUnitV2 }) {
  const failed = unit.status === "failed";
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg px-2.5 py-2 hover:bg-muted/60",
        failed && "bg-[color:rgba(255,77,79,0.04)]",
      )}
    >
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium">{unit.creativeName}</div>
        <div className="truncate text-[11px] text-muted-foreground">{unit.target.pageName}</div>
        {failed && <FailureDetail unit={unit} />}
      </div>
      <div className="shrink-0 pt-0.5">
        <UnitStatusTag status={unit.status} />
      </div>
    </div>
  );
}

function AdSetBlock({ group }: { group: AdSetGroup }) {
  const [open, setOpen] = useState(group.failed > 0);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="ml-3 border-l pl-3">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted/60">
        <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
        <span className="text-[13px] font-medium">{group.adSetName}</span>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{group.units.length}</span>
        {group.failed > 0 && (
          <span className="font-mono text-[11px] tabular-nums" style={{ color: ERR_TEXT }}>
            · {group.failed} failed
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 pb-1 pl-6 pt-0.5">
        {group.units.map((u) => (
          <UnitRow key={u.id} unit={u} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function CampaignBlock({ group }: { group: CampaignGroup }) {
  const [open, setOpen] = useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border bg-card">
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left hover:bg-muted/40">
        <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
        <span className="text-sm font-semibold">{group.campaignName}</span>
        <span className="ml-auto font-mono text-[11px] tabular-nums text-muted-foreground">
          {group.total} {group.total === 1 ? "ad" : "ads"}
        </span>
        {group.failed > 0 && (
          <span className="font-mono text-[11px] tabular-nums" style={{ color: ERR_TEXT }}>
            {group.failed} failed
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 px-2 pb-2">
        {group.adSets.map((g) => (
          <AdSetBlock key={g.adSetName} group={g} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DetailUnitTree({ units, filter }: { units: AdUnitV2[]; filter: UnitFilter }) {
  const filtered = useMemo(() => units.filter((u) => matchesFilter(u, filter)), [units, filter]);
  const groups = useMemo(() => groupUnits(filtered), [filtered]);

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        No ads match this filter.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <CampaignBlock key={g.campaignName} group={g} />
      ))}
    </div>
  );
}
