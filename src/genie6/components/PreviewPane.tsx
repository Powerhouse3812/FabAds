import { X, ChevronDown, Download, Rocket, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EllipsisAction, OutputData } from "../types/output";
import { OutputCard } from "./OutputCard";
import { ModeBadge } from "./OutputCard/ModeBadge";
import { QualityScoreChip } from "./OutputCard/QualityScoreChip";
import { LineageChip } from "./OutputCard/LineageChip";

/**
 * Right-rail preview pane — slides in 320px wide on output-card click.
 * Same component used by Library, Generate Results, Workspace right rail.
 *
 * Composition: full preview (image/video) + headline/body/CTA + meta + ALL actions
 * accessible (no ellipsis collapsing — primary actions promoted, more in dropdown).
 */

type Props = {
  output: OutputData | null;
  onClose: () => void;
  onSave?: () => void;
  onLaunch?: () => void;
  onDownload?: () => void;
  onEllipsisAction?: (action: EllipsisAction) => void;
  className?: string;
};

export function PreviewPane({
  output,
  onClose,
  onSave,
  onLaunch,
  onDownload,
  onEllipsisAction,
  className,
}: Props) {
  if (!output) return null;

  return (
    <aside
      role="complementary"
      aria-label="Output preview"
      className={cn(
        "flex h-full w-[320px] flex-shrink-0 flex-col border-l border-g6-border-secondary bg-g6-bg-container",
        className
      )}
    >
      <header className="flex items-center justify-between border-b border-g6-border-secondary px-4 py-3">
        <ModeBadge mode={output.mode} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="inline-flex h-7 w-7 items-center justify-center rounded-g6-base text-g6-text-secondary hover:bg-g6-bg-spotlight hover:text-g6-text"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Use compact OutputCard for the visual + metadata block */}
        <OutputCard
          {...output}
          variant="compact"
          selectable={false}
        />

        <div className="mt-3 flex items-center justify-between gap-2 px-1">
          {output.qualityScore !== undefined && <QualityScoreChip score={output.qualityScore} />}
          <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">
            #{output.id.slice(-8).toUpperCase()}
          </span>
        </div>

        {output.parentWinnerId && (
          <div className="mt-3">
            <LineageChip parentWinnerId={output.parentWinnerId} variant="full" />
          </div>
        )}
      </div>

      {/* Action stack */}
      <footer className="flex flex-col gap-2 border-t border-g6-border-secondary p-4">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-g6-base bg-g6-primary font-g6-sans text-g6-sm font-semibold text-g6-text-on-accent transition-colors hover:bg-g6-primary-hover active:bg-g6-primary-active"
        >
          <Save className="h-4 w-4" /> Save
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onLaunch}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-g6-base border border-g6-border-secondary bg-g6-bg-base font-g6-sans text-g6-sm font-medium text-g6-text transition-colors hover:bg-g6-bg-spotlight"
          >
            <Rocket className="h-3.5 w-3.5" /> Launch
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-g6-base border border-g6-border-secondary bg-g6-bg-base font-g6-sans text-g6-sm font-medium text-g6-text transition-colors hover:bg-g6-bg-spotlight"
          >
            <Download className="h-3.5 w-3.5" /> Download
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {[
            { label: "Edit", action: "edit" as const },
            { label: "Forge more", action: "forgeMore" as const },
            { label: "Save text-only", action: "saveTextOnly" as const },
            { label: "Save media-only", action: "saveMediaOnly" as const },
            { label: "Add feedback", action: "addFeedback" as const },
            { label: "Regenerate", action: "regenerate" as const },
          ].map((item) => (
            <button
              key={item.action}
              type="button"
              onClick={() => onEllipsisAction?.(item.action)}
              className="rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base px-2.5 py-1 font-g6-sans text-g6-xs text-g6-text-secondary transition-colors hover:border-g6-primary-border hover:bg-g6-primary-bg hover:text-g6-text"
            >
              {item.label}
            </button>
          ))}
        </div>
      </footer>
    </aside>
  );
}
