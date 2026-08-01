/**
 * Creative Report 2.0 — saved filters modal.
 * Opened from the filter icon in FilterBar (handoff §5.5, relocated per
 * Maalik's iter-7 decision: no standalone "Saved views" page — the option to
 * save/apply/manage lives in a modal next to the search bar, same tab).
 *
 * Apply is the key behaviour: it patches the CURRENT route's search params
 * in place via setSearchParams — it never navigates. The old standalone page
 * used to build a `${basePath}/creatives?...` link, which broke "stay on
 * this screen"; that's gone.
 */
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { Bookmark, Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AD_ACCOUNTS, ACCOUNT_BY_ID } from "@/data/accounts";
import { getBrand } from "@/mocks/shared/brands";
import {
  AD_STATUSES,
  ADVANCED_FILTERS,
  FORMATS,
  FORMAT_LABELS,
  P,
  PLATFORMS,
  PLATFORM_LABELS,
  STATUS_LABELS,
  parseCsv,
  parseCsvFree,
} from "@/creative-report/lib/paramSchema";
import { fmtDate, fmtDateRange } from "@/creative-report/lib/format";
import { useSavedFilters, type SavedFilterSet } from "@/creative-report/hooks/useSavedFilters";

const DATE_PRESET_DAYS = [7, 14, 30, 90];

function accountsSummary(ids: string[]): string {
  // Never fall back to the raw id — if the account can't be resolved (e.g.
  // deleted from mock data since this was saved), fall back to an honest
  // count instead of showing internal machinery.
  if (ids.length === 1) return ACCOUNT_BY_ID[ids[0]]?.name ?? "1 account";
  return `${ids.length} accounts`;
}

function brandsSummary(ids: string[]): string {
  if (ids.length === 1) return getBrand(ids[0])?.name ?? "1 brand";
  return `${ids.length} brands`;
}

/** Best-effort human-readable summary of a saved query string, e.g.
 *  "Last 14 days · Meta · Fatiguing". Falls back to the raw string only if
 *  it has no recognizable params (e.g. hand-edited/foreign query). */
function summarizeQuery(query: string): string {
  if (!query) return "No filters";
  const params = new URLSearchParams(query);
  const parts: string[] = [];

  const from = params.get(P.from);
  const to = params.get(P.to);
  if (from && to) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate(),
    ).padStart(2, "0")}`;
    const matchedPreset = DATE_PRESET_DAYS.find((days) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1));
      const expectedFrom = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`;
      return to === todayStr && from === expectedFrom;
    });
    parts.push(matchedPreset ? `Last ${matchedPreset} days` : fmtDateRange(from, to));
  }

  const accounts = parseCsvFree(params.get(P.accounts));
  if (accounts.length) parts.push(accountsSummary(accounts));

  const brands = parseCsvFree(params.get(P.brand));
  if (brands.length) parts.push(brandsSummary(brands));

  const statuses = parseCsv(params.get(P.status), AD_STATUSES);
  if (statuses.length) parts.push(statuses.map((s) => STATUS_LABELS[s]).join("/"));

  const platforms = parseCsv(params.get(P.platform), PLATFORMS);
  if (platforms.length) parts.push(platforms.map((p) => PLATFORM_LABELS[p]).join("/"));

  const formats = parseCsv(params.get(P.format), FORMATS);
  if (formats.length) parts.push(formats.map((f) => FORMAT_LABELS[f]).join("/"));

  for (const def of ADVANCED_FILTERS) {
    const values = parseCsvFree(params.get(def.key));
    if (values.length) parts.push(`${def.label}: ${values.join(", ")}`);
  }

  const q = params.get(P.q);
  if (q) parts.push(`"${q}"`);

  // A non-empty query with no recognisable params (hand-edited/foreign query
  // string) is honestly "custom filters" — never show the raw query string,
  // that's internal machinery, not a summary a buyer should see.
  if (parts.length === 0) return "Custom filters";
  return parts.join(" · ");
}

export function SavedFiltersModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { filterSets, save, rename, remove } = useSavedFilters();
  const [searchParams, setSearchParams] = useSearchParams();
  const [name, setName] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");

  const currentQuery = searchParams.toString();

  const handleSave = () => {
    save(name, currentQuery);
    setName("");
  };

  const startRename = (set: SavedFilterSet) => {
    setEditingId(set.id);
    setEditingName(set.name);
  };

  const confirmRename = () => {
    if (editingId) rename(editingId, editingName);
    setEditingId(null);
    setEditingName("");
  };

  const applyFilterSet = (set: SavedFilterSet) => {
    // Replace the current route's params in place — same tab, no navigate.
    setSearchParams(new URLSearchParams(set.query), { replace: true });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Saved filters</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name this filter set…"
              className="h-9 flex-1 text-[13px]"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
            <Button size="sm" className="h-9 gap-1.5" onClick={handleSave}>
              <Bookmark className="h-4 w-4" />
              Save current filters
            </Button>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Current: <span className="text-foreground">{summarizeQuery(currentQuery)}</span>
          </p>
        </div>

        {filterSets.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-[13px] text-muted-foreground">
              No saved filters yet — set some filters and save them here.
            </p>
          </div>
        ) : (
          <div className="max-h-80 divide-y divide-border overflow-y-auto rounded-lg border border-border">
            {filterSets.map((set) => {
              const isEditing = editingId === set.id;
              return (
                <div key={set.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-8 max-w-xs text-[13px]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") confirmRename();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={confirmRename}
                          aria-label="Confirm rename"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => applyFilterSet(set)}
                        className="truncate text-left text-[13px] font-medium text-foreground hover:underline"
                      >
                        {set.name}
                      </button>
                    )}
                    {!isEditing && (
                      <p className="truncate text-xs text-muted-foreground">
                        {summarizeQuery(set.query)}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {fmtDate(new Date(set.createdAt))}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    {!isEditing && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[13px]"
                        onClick={() => applyFilterSet(set)}
                      >
                        Apply
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => startRename(set)}
                      aria-label={`Rename ${set.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => remove(set.id)}
                      aria-label={`Delete ${set.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
