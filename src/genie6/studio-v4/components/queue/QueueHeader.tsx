import { ChevronLeft } from "lucide-react";
import type { QueueBatch } from "../../types/queue";
import { QueueStrip } from "./QueueStrip";
import { VariantToggle, type QueueVariant } from "./VariantToggle";

interface QueueHeaderProps {
  variant: QueueVariant;
  batches: QueueBatch[];
  activeBatchId: string | null;
  onSelectBatch: (id: string) => void;
  onBack?: () => void;
  onSwitchVariant: () => void;
  showVariantToggle: boolean;
}

/**
 * QueueHeader — V1 vs V2 layout switch for the top section.
 *
 * V1 (dense): title + subtitle pinned to the LEFT, queue strip occupies
 * the rest of the row. Two-column grid (auto | 1fr). Maximises vertical
 * space for results below.
 *
 * V2 (centered): "Back" link top-left → centered title + subtitle → queue
 * strip below at full width. Three vertical bands. More breathing room
 * but pushes results below the fold sooner.
 *
 * Density of the queue cards differs too: V1 uses `compact` (260px wide),
 * V2 uses `comfortable` (300px wide).
 */
export function QueueHeader({
  variant,
  batches,
  activeBatchId,
  onSelectBatch,
  onBack,
  onSwitchVariant,
  showVariantToggle,
}: QueueHeaderProps) {
  if (variant === "v1") {
    return (
      <section className="border-b border-border/40 bg-background/40 px-6 py-4">
        <div className="grid grid-cols-[auto_1fr] gap-6">
          <div className="flex flex-col justify-center">
            <h1 className="font-sans text-[20px] font-bold leading-tight text-foreground">
              Results queue
            </h1>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              You can Edit, Save and Regeneration, etc.
            </p>
            {showVariantToggle && (
              <div className="mt-2">
                <VariantToggle active={variant} onSwitch={onSwitchVariant} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <QueueStrip
              batches={batches}
              activeBatchId={activeBatchId}
              onSelect={onSelectBatch}
              density="compact"
            />
          </div>
        </div>
      </section>
    );
  }

  // V2 — centered + Back nav + comfortable strip
  return (
    <section className="border-b border-border/40 bg-background/40 px-6 pt-3 pb-4">
      {/* Top row — Back link (left) + variant toggle (right) */}
      <div className="flex items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>
        ) : (
          <span />
        )}
        {showVariantToggle && (
          <VariantToggle active={variant} onSwitch={onSwitchVariant} />
        )}
      </div>

      {/* Centered title + subtitle */}
      <div className="mt-1 flex flex-col items-center text-center">
        <h1 className="font-sans text-[22px] font-bold leading-tight text-foreground">
          Results queue
        </h1>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          You can Edit, Save and Regeneration, and many more actions
        </p>
      </div>

      {/* Strip — full width, comfortable density */}
      <div className="mt-4">
        <QueueStrip
          batches={batches}
          activeBatchId={activeBatchId}
          onSelect={onSelectBatch}
          density="comfortable"
        />
      </div>
    </section>
  );
}
