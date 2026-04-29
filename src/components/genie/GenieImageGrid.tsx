import { useMemo, useState, useCallback } from "react";
import { RefreshCw, Loader2, AlertTriangle, ChevronRight, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GenieImageCard } from "./GenieImageCard";
import { BatchProgressRow } from "./BatchProgressRow";
import type { GenieGeneration, BatchState } from "@/hooks/use-genie-generations";
import { format } from "date-fns";

interface Props {
  generations: GenieGeneration[];
  isLoading: boolean;
  onRefresh: () => void;
  selectedIds: Set<string>;
  onSelectChange: (id: string, checked: boolean) => void;
  onEdit: (gen: GenieGeneration) => void;
  onVariation: (gen: GenieGeneration) => void;
  onLaunch: (gen: GenieGeneration) => void;
  onDelete: (id: string) => void;
  onSaveToLibrary: (gen: GenieGeneration) => void;
  onAIEdit: (gen: GenieGeneration) => void;
  deletingId: string | null;
  activeBatches?: BatchState[];
  onRetry?: (gen: GenieGeneration) => void;
  onClearFailed?: () => void;
  onDismissBatch?: (batchId: string) => void;
}

const PLATFORM_FILTERS = [
  { value: "all", label: "All" },
  { value: "newsbreak", label: "NB" },
  { value: "meta", label: "Meta" },
  { value: "tiktok", label: "TT" },
];

export function GenieImageGrid({
  generations,
  isLoading,
  onRefresh,
  selectedIds,
  onSelectChange,
  onEdit,
  onVariation,
  onLaunch,
  onDelete,
  onSaveToLibrary,
  onAIEdit,
  deletingId,
  activeBatches = [],
  onRetry,
  onClearFailed,
  onDismissBatch,
}: Props) {
  const [ownerFilter, setOwnerFilter] = useState<"my" | "all">("my");
  const [platformFilter, setPlatformFilter] = useState("all");

  // Build a set of all IDs claimed by active/completed batches
  const batchClaimedIds = useMemo(() => {
    const set = new Set<string>();
    for (const b of activeBatches) {
      for (const id of b.completedIds) set.add(id);
    }
    return set;
  }, [activeBatches]);

  const { successful: filtered, failed } = useMemo(() => {
    const platformFiltered = platformFilter === "all"
      ? generations
      : generations.filter((g) => {
          const sources = g.settings?.traffic_sources || [];
          return sources.includes(platformFilter);
        });
    const successful: GenieGeneration[] = [];
    const failed: GenieGeneration[] = [];
    for (const g of platformFiltered) {
      if (g.status === "completed" && g.output_url) successful.push(g);
      else failed.push(g);
    }
    return { successful, failed };
  }, [generations, platformFilter]);

  // Generations NOT claimed by any batch → show in normal grid
  const unclaimedGenerations = useMemo(
    () => filtered.filter((g) => !batchClaimedIds.has(g.id)),
    [filtered, batchClaimedIds]
  );

  // For each batch, resolve its completed generations from the full list
  const batchGenMap = useMemo(() => {
    const genById = new Map(generations.map((g) => [g.id, g]));
    const map = new Map<string, GenieGeneration[]>();
    for (const b of activeBatches) {
      map.set(b.id, b.completedIds.map((id) => genById.get(id)).filter(Boolean) as GenieGeneration[]);
    }
    return map;
  }, [activeBatches, generations]);

  const batches = useMemo(() => {
    const map = new Map<string, GenieGeneration[]>();
    for (const g of unclaimedGenerations) {
      const batchKey = format(new Date(g.created_at), "yyyy-MM-dd HH:mm") + "|" + g.prompt;
      if (!map.has(batchKey)) map.set(batchKey, []);
      map.get(batchKey)!.push(g);
    }
    return Array.from(map.entries());
  }, [unclaimedGenerations]);

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Recently generated images</h2>

        <div className="flex items-center gap-3">
          {/* Owner toggle */}
          <div className="flex rounded-md border border-border overflow-hidden">
            {(["my", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setOwnerFilter(f)}
                className={`px-3 py-1 text-xs transition-colors ${
                  ownerFilter === f
                    ? "bg-muted text-foreground font-medium"
                    : "bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                {f === "my" ? "My Creatives" : "All Creatives"}
              </button>
            ))}
          </div>

          {/* Platform filter icons */}
          <div className="flex gap-1">
            {PLATFORM_FILTERS.map((pf) => (
              <button
                key={pf.value}
                onClick={() => setPlatformFilter(pf.value)}
                className={`h-7 w-7 flex items-center justify-center text-[10px] font-medium rounded-md border transition-colors ${
                  platformFilter === pf.value
                    ? "bg-muted text-foreground border-border"
                    : "bg-background text-muted-foreground border-border hover:bg-accent"
                }`}
                title={pf.label}
              >
                {pf.label}
              </button>
            ))}
          </div>

          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Active & completed batch progress rows */}
      {activeBatches.map((batch) => (
        <BatchProgressRow
          key={batch.id}
          batch={batch}
          completedGenerations={batchGenMap.get(batch.id) || []}
          selectedIds={selectedIds}
          onSelectChange={onSelectChange}
          onEdit={onEdit}
          onVariation={onVariation}
          onLaunch={onLaunch}
          onDelete={onDelete}
          onSaveToLibrary={onSaveToLibrary}
          onAIEdit={onAIEdit}
          deletingId={deletingId}
          onDismiss={onDismissBatch}
        />
      ))}

      {/* Empty state */}
      {batches.length === 0 && failed.length === 0 && activeBatches.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No images generated yet. Start by entering a prompt above.</p>
        </div>
      )}

      {/* Unclaimed generation batches (older / from previous sessions) */}
      {batches.map(([batchKey, items]) => {
        const first = items[0];
        const date = format(new Date(first.created_at), "MMM d, yyyy · h:mm a");
        const settings = first.settings || {};

        return (
          <div key={batchKey} className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">{date}</span>
              {settings.category && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{settings.category}</Badge>
              )}
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {items.length} variation{items.length > 1 ? "s" : ""}
              </Badge>
              {settings.aspect_ratio && settings.aspect_ratio !== "auto" && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{settings.aspect_ratio}</Badge>
              )}
              {(settings.traffic_sources || []).map((ts: string) => (
                <Badge key={ts} variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{ts}</Badge>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {items.map((gen) => (
                <GenieImageCard
                  key={gen.id}
                  generation={gen}
                  selected={selectedIds.has(gen.id)}
                  onSelect={onSelectChange}
                  onEdit={onEdit}
                  onVariation={onVariation}
                  onLaunch={onLaunch}
                  onDelete={onDelete}
                  onSaveToLibrary={onSaveToLibrary}
                  onAIEdit={onAIEdit}
                  isDeleting={deletingId === gen.id}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Failed generations collapsed section */}
      {failed.length > 0 && (
        <Collapsible>
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-1.5">
            <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
              <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span>{failed.length} failed generation{failed.length > 1 ? "s" : ""}</span>
            </CollapsibleTrigger>
            {onClearFailed && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={onClearFailed}>
                <Trash2 className="h-3 w-3 mr-1" />Clear all
              </Button>
            )}
          </div>
          <CollapsibleContent>
            <div className="mt-1 rounded-md border border-border divide-y divide-border bg-background">
              {failed.map((gen) => {
                const isCredits = gen.status === "failed" && gen.prompt?.toLowerCase().includes("credit");
                return (
                  <div key={gen.id} className="flex items-center gap-3 px-3 py-1.5 text-xs">
                    <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
                    <span className="truncate flex-1 text-muted-foreground" title={gen.prompt}>
                      "{gen.prompt}"
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {format(new Date(gen.created_at), "MMM d")}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                      {isCredits ? "Credits" : "Error"}
                    </Badge>
                    {onRetry && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => onRetry(gen)}
                        title="Retry"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
