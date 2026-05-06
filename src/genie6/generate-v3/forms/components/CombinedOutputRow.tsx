import { Image as ImageIcon, Video, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AspectRatioMulti, type AspectRatio } from "./AspectRatioMulti";

/**
 * CombinedOutputRow — A-11.24.
 *
 * Studio v3 setup row consolidation. Output toggle + Aspect ratios + the
 * AI Model Photoshoot toggle live on a SINGLE horizontal row as 3 sub-clusters
 * flowing left-to-right. Each cluster reads as `[label] [control]` with a
 * normal-styled label (not the old mono-uppercase mini-label). AI Model
 * Photoshoot only renders in video mode.
 */

export interface CombinedOutputRowProps {
  output: "image" | "video";
  onOutputChange: (next: "image" | "video") => void;
  aspectRatios: AspectRatio[];
  onAspectRatiosChange: (next: AspectRatio[]) => void;
  /** Only consumed when `output === "video"`. */
  useAiModel: boolean;
  onUseAiModelChange: (next: boolean) => void;
}

export function CombinedOutputRow({
  output,
  onOutputChange,
  aspectRatios,
  onAspectRatiosChange,
  useAiModel,
  onUseAiModelChange,
}: CombinedOutputRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {/* Output cluster */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-foreground">Output</span>
        <div
          role="radiogroup"
          aria-label="Output format"
          className="inline-flex rounded-md border border-border bg-card p-0.5"
        >
          <FormatBtn
            active={output === "image"}
            onClick={() => onOutputChange("image")}
            icon={ImageIcon}
            label="Image"
          />
          <FormatBtn
            active={output === "video"}
            onClick={() => onOutputChange("video")}
            icon={Video}
            label="Video"
          />
        </div>
      </div>

      {/* Aspect cluster */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-foreground">Aspect</span>
        <AspectRatioMulti value={aspectRatios} onChange={onAspectRatiosChange} />
      </div>

      {/* AI Model Photoshoot — only in video */}
      {output === "video" && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-foreground">
            AI Model Photoshoot
          </span>
          <UseAiModelToggle
            enabled={useAiModel}
            onToggle={onUseAiModelChange}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function FormatBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof ImageIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

function UseAiModelToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="AI Model Photoshoot"
      onClick={() => onToggle(!enabled)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        enabled
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "relative h-3.5 w-6 rounded-full transition-colors",
          enabled ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-2.5 w-2.5 rounded-full bg-card shadow transition-transform",
            enabled && "translate-x-2.5",
          )}
        />
      </span>
      <Sparkles className="h-3 w-3 text-primary" />
      AI Model Photoshoot
    </button>
  );
}
