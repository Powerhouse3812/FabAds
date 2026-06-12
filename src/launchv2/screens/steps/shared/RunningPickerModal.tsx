/**
 * RunningPickerModal — Dialog-based picker for existing running campaigns / ad sets / ads.
 * Replaces the old Popover in CopyFromRunning.
 *
 * Features:
 *  - Search bar (filters by entity name, case-insensitive)
 *  - Status filter chips (All / Active / Paused)
 *  - Date range label Popover (visual only — Last 7d / 14d / 30d / This month; metrics don't change)
 *  - Per-type mini table: campaign, adset, or ad columns
 *  - Single-select radio pattern (click row to select)
 *  - Footer: Cancel + "Use [type]" CTA (disabled until row selected)
 */
import { useState } from "react";
import { Search, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RUNNING_CAMPAIGNS, RUNNING_ADSETS, RUNNING_ADS } from "../../../data";
import type { RunningCampaignV2, RunningAdSetV2, RunningAdV2 } from "../../../types";

/* ── Types ──────────────────────────────────────────────────────────────────── */

export type PickerType = "campaign" | "adset" | "ad";

export interface RunningPickerModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  type: PickerType;
  onPick: (id: string) => void;          // single-select callback
  onPickMultiple?: (ids: string[]) => void; // multi-select callback
  pickedId?: string | null;
  multiSelect?: boolean;
}

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

function fmtINR(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

function fmtRoas(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `${n}x`;
}

function fmtPct(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `${n}%`;
}

function fmtFreq(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `${n.toFixed(1)}x`;
}

function fmtReach(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return `${n}`;
}

/* ── Label maps ──────────────────────────────────────────────────────────────── */

const FORMAT_LABELS: Record<string, string> = {
  single_image: "Image",
  single_video: "Video",
  carousel: "Carousel",
  collection: "Collection",
  dpa: "Catalogue",
  stories: "Stories",
};

const OBJ_LABELS: Record<string, string> = {
  OUTCOME_SALES: "Sales",
  OUTCOME_TRAFFIC: "Traffic",
  OUTCOME_AWARENESS: "Awareness",
  OUTCOME_LEADS: "Leads",
  OUTCOME_ENGAGEMENT: "Engagement",
  OUTCOME_APP_PROMOTION: "App",
};

const DATE_RANGE_OPTIONS = [
  { id: "7d", label: "Last 7 days" },
  { id: "14d", label: "Last 14 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "month", label: "This month" },
];

/* ── Sub-components ──────────────────────────────────────────────────────────── */

function StatusDot({ status }: { status: "active" | "paused" | undefined }) {
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
        status === "active" ? "bg-green-500" : "bg-amber-500",
      )}
    />
  );
}

function RadioCircle({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors",
        selected
          ? "border-primary bg-primary"
          : "border-border bg-transparent",
      )}
    >
      {selected && <span className="h-1.5 w-1.5 rounded-full bg-[#121212]" />}
    </span>
  );
}

function CheckboxCircle({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border-[1.5px] transition-all",
        checked ? "border-primary bg-primary" : "border-border",
      )}
    >
      {checked && (
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
          <path
            d="M1 3L2.8 5L7 1"
            stroke="#121212"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

type StatusFilter = "all" | "active" | "paused";

function StatusChips({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  const chips: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "paused", label: "Paused" },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {chips.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className={cn(
            "flex h-7 cursor-pointer items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
            c.id === "all" && value === "all" &&
              "border-primary/30 bg-primary/10 text-foreground",
            c.id === "all" && value !== "all" &&
              "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            c.id === "active" && value === "active" &&
              "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
            c.id === "active" && value !== "active" &&
              "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            c.id === "paused" && value === "paused" &&
              "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
            c.id === "paused" && value !== "paused" &&
              "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
          )}
        >
          {c.id === "active" && (
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
          )}
          {c.id === "paused" && (
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
          )}
          {c.label}
        </button>
      ))}
    </div>
  );
}

/* ── Table header cell ───────────────────────────────────────────────────────── */

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "sticky top-0 z-10 bg-card px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("px-3 py-2.5", className)}>{children}</td>
  );
}

function MonoCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-foreground">
      {children}
    </td>
  );
}

/* ── Campaign table ──────────────────────────────────────────────────────────── */

function CampaignTable({
  items,
  selectedId,
  onSelect,
}: {
  items: RunningCampaignV2[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[13px] text-muted-foreground">
        No campaigns match your search.
      </div>
    );
  }
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr className="border-b border-border">
          <Th className="w-6 pl-4" />
          <Th>Name</Th>
          <Th>Objective</Th>
          <Th>Budget/day</Th>
          <Th>Mode</Th>
          <Th>Status</Th>
          <Th>Spend</Th>
          <Th>ROAS</Th>
          <Th>CPM</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/40">
        {items.map((c) => {
          const sel = c.id === selectedId;
          return (
            <tr
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                "cursor-pointer transition-colors hover:bg-muted/30",
                sel && "border-l-2 border-primary bg-primary/5",
              )}
            >
              <Td className="w-6 pl-4">
                <RadioCircle selected={sel} />
              </Td>
              <Td>
                <span className="block max-w-[180px] truncate font-medium text-foreground">
                  {c.name}
                </span>
              </Td>
              <Td>
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-foreground">
                  {OBJ_LABELS[c.objective] ?? c.objective}
                </span>
              </Td>
              <MonoCell>₹{c.budgetAmount.toLocaleString("en-IN")}</MonoCell>
              <Td>
                <span className="font-mono text-xs text-muted-foreground">{c.budgetMode}</span>
              </Td>
              <Td>
                <span className="inline-flex items-center gap-1.5">
                  <StatusDot status={c.status} />
                  <span className="text-xs capitalize text-muted-foreground">{c.status}</span>
                </span>
              </Td>
              <MonoCell>{fmtINR(c.spend30d)}</MonoCell>
              <MonoCell>{fmtRoas(c.roas30d)}</MonoCell>
              <MonoCell>{fmtINR(c.cpm30d)}</MonoCell>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ── Ad set table ────────────────────────────────────────────────────────────── */

function AdSetTable({
  items,
  selectedId,
  onSelect,
}: {
  items: RunningAdSetV2[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[13px] text-muted-foreground">
        No ad sets match your search.
      </div>
    );
  }
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr className="border-b border-border">
          <Th className="w-6 pl-4" />
          <Th>Name</Th>
          <Th>Campaign</Th>
          <Th>Audience</Th>
          <Th>Status</Th>
          <Th>Spend</Th>
          <Th>CPA</Th>
          <Th>Reach</Th>
          <Th>Freq.</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/40">
        {items.map((a) => {
          const sel = a.id === selectedId;
          return (
            <tr
              key={a.id}
              onClick={() => onSelect(a.id)}
              className={cn(
                "cursor-pointer transition-colors hover:bg-muted/30",
                sel && "border-l-2 border-primary bg-primary/5",
              )}
            >
              <Td className="w-6 pl-4">
                <RadioCircle selected={sel} />
              </Td>
              <Td>
                <span className="block max-w-[160px] truncate font-medium text-foreground">
                  {a.name}
                </span>
              </Td>
              <Td>
                <span className="block max-w-[140px] truncate font-mono text-[11px] text-muted-foreground">
                  {a.campaignName}
                </span>
              </Td>
              <Td>
                <span className="block max-w-[140px] truncate text-xs text-muted-foreground">
                  {a.audienceName}
                </span>
              </Td>
              <Td>
                <span className="inline-flex items-center gap-1.5">
                  <StatusDot status={a.status} />
                  <span className="text-xs capitalize text-muted-foreground">{a.status}</span>
                </span>
              </Td>
              <MonoCell>{fmtINR(a.spend30d)}</MonoCell>
              <MonoCell>{fmtINR(a.cpa30d)}</MonoCell>
              <MonoCell>{fmtReach(a.reach30d)}</MonoCell>
              <MonoCell>{fmtFreq(a.frequency30d)}</MonoCell>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ── Ad table ────────────────────────────────────────────────────────────────── */

function AdTable({
  items,
  selectedId,
  selectedIds,
  multiSelect,
  onSelect,
  onToggle,
}: {
  items: RunningAdV2[];
  selectedId: string | null;
  selectedIds?: Set<string>;
  multiSelect?: boolean;
  onSelect: (id: string) => void;
  onToggle?: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[13px] text-muted-foreground">
        No ads match your search.
      </div>
    );
  }
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr className="border-b border-border">
          <Th className="w-6 pl-4" />
          <Th className="w-10"> </Th>
          <Th>Name</Th>
          <Th>Page</Th>
          <Th>Format</Th>
          <Th>Status</Th>
          <Th>Spend</Th>
          <Th>CTR</Th>
          <Th>ROAS</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/40">
        {items.map((a) => {
          const sel = multiSelect
            ? (selectedIds?.has(a.id) ?? false)
            : a.id === selectedId;
          return (
            <tr
              key={a.id}
              onClick={() => multiSelect ? onToggle?.(a.id) : onSelect(a.id)}
              className={cn(
                "cursor-pointer transition-colors hover:bg-muted/30",
                sel && "border-l-2 border-primary bg-primary/5",
              )}
            >
              <Td className="w-6 pl-4">
                {multiSelect
                  ? <CheckboxCircle checked={sel} />
                  : <RadioCircle selected={sel} />}
              </Td>
              <Td className="w-10 pr-0">
                <img
                  src={a.thumbnail}
                  alt=""
                  className="h-10 w-10 rounded-md object-cover"
                />
              </Td>
              <Td>
                <span className="block max-w-[160px] truncate font-medium text-foreground">
                  {a.name}
                </span>
              </Td>
              <Td>
                <span className="block max-w-[120px] truncate font-mono text-[11px] text-muted-foreground">
                  {a.pageName}
                </span>
              </Td>
              <Td>
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-foreground">
                  {FORMAT_LABELS[a.format] ?? a.format}
                </span>
              </Td>
              <Td>
                {a.status ? (
                  <span className="inline-flex items-center gap-1.5">
                    <StatusDot status={a.status} />
                    <span className="text-xs capitalize text-muted-foreground">{a.status}</span>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </Td>
              <MonoCell>{fmtINR(a.spend30d)}</MonoCell>
              <MonoCell>{fmtPct(a.ctr30d)}</MonoCell>
              <MonoCell>{fmtRoas(a.roas30d)}</MonoCell>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ── Main component ──────────────────────────────────────────────────────────── */

export default function RunningPickerModal({
  open,
  onOpenChange,
  type,
  onPick,
  onPickMultiple,
  pickedId,
  multiSelect = false,
}: RunningPickerModalProps) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState("30d");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  // Single-select state
  const [selectedId, setSelectedId] = useState<string | null>(pickedId ?? null);
  // Multi-select state (used when multiSelect=true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const titleMap: Record<PickerType, string> = {
    campaign: "Running campaigns",
    adset: "Running ad sets",
    ad: "Running ads & posts",
  };

  const selectedDateLabel =
    DATE_RANGE_OPTIONS.find((d) => d.id === dateRange)?.label ?? "Last 30 days";

  // Filter + search logic per type
  const filteredCampaigns = RUNNING_CAMPAIGNS.filter((c) => {
    const matchesQ = c.name.toLowerCase().includes(q.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || c.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  const filteredAdSets = RUNNING_ADSETS.filter((a) => {
    const matchesQ = a.name.toLowerCase().includes(q.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || a.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  const filteredAds = RUNNING_ADS.filter((a) => {
    const matchesQ = a.name.toLowerCase().includes(q.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || !a.status || a.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  function toggleMultiId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    if (multiSelect) {
      if (selectedIds.size === 0) return;
      onPickMultiple?.(Array.from(selectedIds));
    } else {
      if (!selectedId) return;
      onPick(selectedId);
    }
    onOpenChange(false);
  }

  const ctaLabel = multiSelect
    ? (selectedIds.size === 0
        ? "Select posts"
        : `Use ${selectedIds.size} post${selectedIds.size !== 1 ? "s" : ""}`)
    : type === "campaign"
      ? "Use campaign"
      : type === "adset"
        ? "Use ad set"
        : "Use ad";

  const ctaDisabled = multiSelect ? selectedIds.size === 0 : !selectedId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-2xl p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-[17px] font-bold tracking-[-0.01em]">
            {titleMap[type]}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            {multiSelect
              ? "Select one or more posts to use as existing post IDs."
              : "Select one to copy its settings into this launch."}
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 pb-3">
          {/* Search */}
          <div className="relative flex h-8 flex-1 items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="h-8 w-full max-w-xs rounded-full border border-border bg-card pl-8 pr-3 text-[13px] outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Status chips */}
          <StatusChips value={statusFilter} onChange={setStatusFilter} />

          {/* Date range popover */}
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                <Calendar className="h-3.5 w-3.5" />
                {selectedDateLabel}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 rounded-xl p-1" align="end">
              {DATE_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setDateRange(opt.id);
                    setDatePopoverOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                    dateRange === opt.id
                      ? "bg-primary/10 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {/* Table area */}
        <div className="max-h-[380px] overflow-auto">
          {type === "campaign" && (
            <CampaignTable
              items={filteredCampaigns}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
          {type === "adset" && (
            <AdSetTable
              items={filteredAdSets}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
          {type === "ad" && (
            <AdTable
              items={filteredAds}
              selectedId={selectedId}
              selectedIds={selectedIds}
              multiSelect={multiSelect}
              onSelect={setSelectedId}
              onToggle={toggleMultiId}
            />
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={ctaDisabled}
            onClick={handleConfirm}
            className="rounded-full bg-primary px-5 text-[13px] font-medium text-[#121212] hover:bg-primary/90 disabled:opacity-40"
          >
            {ctaLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
