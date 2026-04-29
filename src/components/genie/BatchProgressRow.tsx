import { useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GenieImageCard } from "./GenieImageCard";
import type { GenieGeneration, BatchState } from "@/hooks/use-genie-generations";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  batch: BatchState;
  completedGenerations: GenieGeneration[];
  selectedIds: Set<string>;
  onSelectChange: (id: string, checked: boolean) => void;
  onEdit: (gen: GenieGeneration) => void;
  onVariation: (gen: GenieGeneration) => void;
  onLaunch: (gen: GenieGeneration) => void;
  onDelete: (id: string) => void;
  onSaveToLibrary: (gen: GenieGeneration) => void;
  onAIEdit: (gen: GenieGeneration) => void;
  deletingId: string | null;
  onDismiss?: (batchId: string) => void;
}

const MODEL_SHORT: Record<string, string> = {
  "google/gemini-3.1-flash-image-preview": "Gemini Flash",
  "google/gemini-3-pro-image-preview": "Gemini Pro",
  "openai/gpt-5": "GPT-5",
  auto: "Auto",
};

const PLATFORM_SHORT: Record<string, string> = {
  newsbreak: "NB",
  meta: "Meta",
  tiktok: "TT",
};

export function BatchProgressRow({
  batch,
  completedGenerations,
  selectedIds,
  onSelectChange,
  onEdit,
  onVariation,
  onLaunch,
  onDelete,
  onSaveToLibrary,
  onAIEdit,
  deletingId,
  onDismiss,
}: Props) {
  const [open, setOpen] = useState(batch.status === "generating");
  const settings = batch.settings || {};
  const isGenerating = batch.status === "generating";
  const hasFailed = batch.failed > 0;
  const allFailed = batch.failed === batch.total;
  const progressPct = batch.total > 0 ? ((batch.completed + batch.failed) / batch.total) * 100 : 0;
  const remaining = batch.total - batch.completed - batch.failed;

  const dateStr = format(new Date(batch.startedAt), "dd MMM, yyyy");
  const timeStr = format(new Date(batch.startedAt), "hh:mm a");
  const modelLabel = MODEL_SHORT[settings.model || "auto"] || settings.model || "Auto";
  const platforms = settings.traffic_sources || [];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "rounded-lg border transition-colors",
          isGenerating
            ? "border-primary/30 bg-primary/5"
            : allFailed
              ? "border-destructive/30 bg-destructive/5"
              : hasFailed
                ? "border-amber-400/30 bg-amber-50/50 dark:bg-amber-900/10"
                : "border-border bg-muted/30"
        )}
      >
        {/* Row header */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent/30 transition-colors rounded-lg">
            {/* Status icon */}
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
            ) : allFailed ? (
              <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
            ) : hasFailed ? (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            )}

            {/* Date / time */}
            <span className="text-muted-foreground whitespace-nowrap">{dateStr}</span>
            <span className="text-muted-foreground whitespace-nowrap">{timeStr}</span>

            {/* Metadata badges */}
            {platforms.map((p: string) => (
              <Badge key={p} variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                {PLATFORM_SHORT[p] || p}
              </Badge>
            ))}
            {settings.category && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 capitalize">
                {settings.category}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
              {batch.total} variation{batch.total > 1 ? "s" : ""}
            </Badge>
            {settings.aspect_ratio && settings.aspect_ratio !== "auto" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                {settings.aspect_ratio}
              </Badge>
            )}
            {batch.referenceMode && batch.referenceMode !== "merge" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 capitalize">
                {batch.referenceMode}
              </Badge>
            )}
            {settings.sentiment && settings.sentiment !== "auto" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 capitalize">
                {settings.sentiment}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
              {modelLabel}
            </Badge>

            {/* Spacer */}
            <span className="flex-1" />

            {/* Credits exhausted warning */}
            {batch.failReason === "credits_exhausted" && (
              <span className="text-[10px] text-amber-600 font-medium whitespace-nowrap">Credits exhausted</span>
            )}

            {/* Progress bar + count */}
            <div className="flex items-center gap-2 shrink-0 min-w-[120px]">
              <Progress value={progressPct} className="h-1.5 flex-1" />
              <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                {batch.completed}/{batch.total}
              </span>
            </div>

            {/* Expand chevron */}
            <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />

            {/* Dismiss (only for completed) */}
            {!isGenerating && onDismiss && (
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onDismiss(batch.id); }}
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </button>
        </CollapsibleTrigger>

        {/* Expanded grid */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1">
            <p className="text-[11px] text-muted-foreground truncate mb-2" title={batch.prompt}>
              "{batch.prompt}"
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {/* Completed real images */}
              {completedGenerations.map((gen) => (
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
              {/* Pending skeletons */}
              {Array.from({ length: remaining }).map((_, i) => (
                <Skeleton key={`pending-${i}`} className="aspect-square rounded-md" />
              ))}
              {/* Failed slots */}
              {Array.from({ length: batch.failed }).map((_, i) => (
                <div key={`fail-${i}`} className="aspect-square rounded-md bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-destructive/60" />
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
