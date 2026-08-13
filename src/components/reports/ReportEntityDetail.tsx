import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Copy, ExternalLink, Pencil, PlusCircle } from "lucide-react";
import { canDuplicate } from "@/lib/ad-entity-write-store";
import { currencyForCountry } from "@/lib/reports-accounts";
import { cn } from "@/lib/utils";
import type { EntityStatus, ReportEntity } from "@/lib/reports-dummy-data";

const statusColor: Record<EntityStatus, string> = {
  Active: "bg-chart-1/20 text-chart-1",
  Paused: "bg-muted text-muted-foreground",
  Archived: "bg-destructive/20 text-destructive",
};

/** Order drives both the segmented control's reading order and its DOM order. */
const STATUS_OPTIONS: EntityStatus[] = ["Active", "Paused", "Archived"];

export interface ReportEntityDetailProps {
  entity: ReportEntity;
  /** One body, two chromes: metrics/actions swap order and the actions row
   *  becomes a sticky footer on mobile. See ReportDetailDrawer for the shell
   *  that picks this based on viewport. */
  layout: "mobile" | "desktop";
  /** Closes the owning sheet. Used by Add Ad Set / Add Ad, which hand off to
   *  another drawer and must not leave this one open underneath it. */
  onClose: () => void;
  onAddAdset?: (entity: ReportEntity) => void;
  onAddAd?: (entity: ReportEntity) => void;
  /**
   * These four come from `useAdEntityActions()` in
   * src/components/reports/actions/useAdEntityActions.tsx. ReportDetailDrawer
   * calls the hook directly and passes the real functions through. Kept
   * optional here regardless, since other callers may not wire them up yet —
   * missing handlers render disabled controls rather than throwing.
   */
  setStatus?: (entities: ReportEntity[], next: EntityStatus) => void;
  editBudget?: (entity: ReportEntity) => void;
  duplicate?: (entity: ReportEntity) => void;
  /** Accepted for forward-compat with the hook's shape. This drawer has no
   *  surfaced entry point for it — Session changes lives in its own sheet
   *  (see ad-entity-write-store.ts's journal) opened from elsewhere. */
  openSessionChanges?: () => void;
}

export function ReportEntityDetail({
  entity,
  layout,
  onClose,
  onAddAdset,
  onAddAd,
  setStatus,
  editBudget,
  duplicate,
  openSessionChanges: _openSessionChanges,
}: ReportEntityDetailProps) {
  const isMobile = layout === "mobile";
  const isArchived = entity.status === "Archived";
  const m = entity.metrics;

  const metrics = [
    { label: "Spend", value: `$${m.spend.toLocaleString()}` },
    { label: "Revenue", value: `$${m.revenue.toLocaleString()}` },
    { label: "ROAS", value: m.roas.toFixed(2) },
    { label: "Impressions", value: m.impressions.toLocaleString() },
    { label: "Clicks", value: m.clicks.toLocaleString() },
    { label: "CTR", value: `${m.ctr}%` },
    { label: "CPA", value: `$${m.cpa}` },
    { label: "Margin", value: `$${m.margin.toLocaleString()}` },
  ];

  const { symbol } = currencyForCountry(entity.country);

  const handleAddAdset = onAddAdset
    ? () => {
        onClose();
        onAddAdset(entity);
      }
    : undefined;
  const handleAddAd = onAddAd
    ? () => {
        onClose();
        onAddAd(entity);
      }
    : undefined;

  const touchTarget = isMobile ? "min-h-11" : undefined;

  const header = (
    <SheetHeader className={cn(isMobile && "border-b px-4 py-4")}>
      <div className="flex items-center gap-2 flex-wrap">
        <SheetTitle className="text-lg">{entity.name}</SheetTitle>
        <Badge variant="outline" className={statusColor[entity.status]}>
          {entity.status}
        </Badge>
        <Badge variant="secondary">{entity.platform}</Badge>
      </div>
      {entity.parentName && (
        <p className="text-sm text-muted-foreground mt-1">{entity.parentName}</p>
      )}
    </SheetHeader>
  );

  const metricsGrid = (
    <div className={cn("grid grid-cols-2 gap-3", isMobile ? "px-4 py-4" : "mt-6")}>
      {metrics.map((item) => (
        <div key={item.label} className="rounded-md border bg-card p-3">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-lg font-semibold text-foreground">{item.value}</p>
        </div>
      ))}
    </div>
  );

  // Ad-set-only: campaigns/accounts/ads don't carry a budgetType, so this
  // section simply doesn't render for them.
  const budgetRow = entity.budgetType ? (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border bg-card p-3",
        isMobile ? "mx-4 mb-4" : "mt-3",
      )}
    >
      <div>
        <p className="text-xs text-muted-foreground">{entity.budgetType} Budget</p>
        <p className="text-lg font-semibold text-foreground">
          {symbol}
          {(entity.budgetValue ?? 0).toLocaleString()}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className={touchTarget}
        disabled={isArchived}
        title={isArchived ? "Unarchive to edit budget" : undefined}
        onClick={() => editBudget?.(entity)}
      >
        <Pencil className="h-3.5 w-3.5 mr-1" />
        Edit
      </Button>
    </div>
  ) : null;

  // Strictly better than three same-weight buttons: a segmented control makes
  // the CURRENT status legible and makes "Pause something already paused" a
  // disabled no-op instead of a button that fires a success toast for nothing.
  const statusControl = (
    <div role="group" aria-label="Status" className="inline-flex overflow-hidden rounded-md border">
      {STATUS_OPTIONS.map((option) => {
        const active = entity.status === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            disabled={active || !setStatus}
            className={cn(
              "border-r px-3 text-sm font-medium transition-colors last:border-r-0 disabled:cursor-default",
              isMobile ? "min-h-11 py-2" : "h-9 py-1.5",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:hover:bg-background",
            )}
            onClick={() => setStatus?.([entity], option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );

  const actions = (
    <div className={cn("flex flex-wrap items-center gap-2", isMobile ? "px-4 py-3" : "mt-6")}>
      {statusControl}
      {handleAddAdset && (
        <Button variant="default" size="sm" className={touchTarget} onClick={handleAddAdset}>
          <PlusCircle className="h-3.5 w-3.5 mr-1" />
          Add Ad Set
        </Button>
      )}
      {handleAddAd && (
        <Button variant="default" size="sm" className={touchTarget} onClick={handleAddAd}>
          <PlusCircle className="h-3.5 w-3.5 mr-1" />
          Add Ad
        </Button>
      )}
      {canDuplicate(entity.level) && (
        <Button
          variant="outline"
          size="sm"
          className={touchTarget}
          disabled={!duplicate}
          title="Choose how many copies and whether they publish Active or Paused"
          onClick={() => duplicate?.(entity)}
        >
          <Copy className="h-3.5 w-3.5 mr-1" />
          Duplicate…
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        className={touchTarget}
        onClick={() => window.open(window.location.href, "_blank")}
      >
        <ExternalLink className="h-3.5 w-3.5 mr-1" />
        New Tab
      </Button>
    </div>
  );

  if (isMobile) {
    // Mobile inverts desktop's order: metrics scroll in the body, actions sit
    // in a sticky footer. The user opened this sheet to act on the entity —
    // making them scroll past 8 metric tiles to reach a button before acting
    // would be backwards, and the sheet's bottom edge is the thumb zone.
    return (
      <>
        {header}
        <div className="flex-1 overflow-y-auto">
          {metricsGrid}
          {budgetRow}
        </div>
        <div className="sticky bottom-0 border-t bg-background">{actions}</div>
      </>
    );
  }

  // Desktop keeps today's order: header, metrics, budget (new), actions.
  return (
    <>
      {header}
      {metricsGrid}
      {budgetRow}
      {actions}
    </>
  );
}
