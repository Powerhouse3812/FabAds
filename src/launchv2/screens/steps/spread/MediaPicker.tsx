/**
 * MediaPicker — a compact stub picker that lets you choose one media item from
 * plan.creatives by id. Used by carousel cards and the collection cover. Renders
 * the selected creative's thumbnail (or a placeholder) and a small dropdown of
 * the available creatives. No real upload — selection is by existing creative id.
 */
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreativeRef } from "../../../types";

export default function MediaPicker({
  creatives,
  value,
  onChange,
  size = "md",
}: {
  creatives: CreativeRef[];
  value?: string;
  onChange: (id: string | undefined) => void;
  size?: "sm" | "md";
}) {
  const selected = creatives.find((c) => c.id === value);
  const box = size === "sm" ? "h-12 w-12" : "h-14 w-14";

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40",
          box,
        )}
      >
        {selected?.thumbnail ? (
          <img src={selected.thumbnail} alt={selected.name} className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Select value={value ?? ""} onValueChange={(v) => onChange(v || undefined)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Pick media…" />
          </SelectTrigger>
          <SelectContent>
            {creatives.length === 0 ? (
              <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
                Add media above first
              </div>
            ) : (
              creatives.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
