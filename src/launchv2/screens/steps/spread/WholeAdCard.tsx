/**
 * WholeAdCard — compact card for a selected "whole ad" creative.
 * Design inspired by Industry Insights ad cards.
 */
import { X, Image, Video, Layers, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreativeRef, AdFormat } from "../../../types";
import { FORMAT_ICON } from "./meta";

interface WholeAdCardProps {
  creative: CreativeRef;
  onRemove: (id: string) => void;
}

export default function WholeAdCard({ creative, onRemove }: WholeAdCardProps) {
  const Icon = FORMAT_ICON[creative.format] ?? Image;

  return (
    <div className="group relative rounded-2xl border border-border bg-card overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        {creative.thumbnail ? (
          <img
            src={creative.thumbnail}
            alt={creative.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Icon className="h-8 w-8 opacity-40" />
          </div>
        )}
        {/* Remove overlay on hover */}
        <button
          type="button"
          onClick={() => onRemove(creative.id)}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Remove"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        {/* Source chip */}
        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
          {creative.source}
        </span>
      </div>
      {/* Info row */}
      <div className="p-2 space-y-1">
        <p className="text-xs font-medium text-foreground truncate leading-tight">{creative.name}</p>
        <span className="inline-block rounded-full border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {creative.format.replace(/_/g, " ")}
        </span>
      </div>
    </div>
  );
}

export function WholeAdGrid({
  creatives,
  onRemove,
  onAdd,
}: {
  creatives: CreativeRef[];
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {creatives.length} whole ad{creatives.length !== 1 ? "s" : ""} selected
        </span>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs text-primary hover:underline"
        >
          + Add more
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {creatives.map((c) => (
          <WholeAdCard key={c.id} creative={c} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}
