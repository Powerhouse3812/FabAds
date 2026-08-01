/**
 * ComposerReviewSheet — full review/edit surface for the assembled element
 * set, opened from ComposerBar's "Review & send". Reuses BriefBlock for
 * every editable text slot (same as Brief Builder), so the buyer can rewrite
 * any picked element before sending — exactly the editability Brief Builder
 * offered, just per-slot instead of per-reference.
 *
 * Honesty rules carried over from Brief Builder: the assembled set is never
 * scored or predicted, and the Genie handoff is simulated (same
 * GenieHandoffStub destination/labeling as every other exit in this module).
 */
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BriefBlock } from "@/creative-report/components/BriefBlock";
import { CreativeThumb } from "@/creative-report/components/CreativeThumb";
import { fmtMultiple } from "@/creative-report/lib/format";
import type { CreativeRollup } from "@/creative-report/lib/selectors";
import { TEXT_ELEMENT_META } from "./elementMeta";
import { ELEMENT_LABELS, ELEMENT_ORDER, type ElementKey } from "./types";
import type { ElementComposer } from "./useElementComposer";

function SlotFrame({
  label,
  onClear,
  children,
}: {
  label: string;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove ${label}`}
        className="absolute -right-2 -top-2 z-10 rounded-full border border-border bg-background p-1 text-muted-foreground shadow-sm hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
      {children}
    </div>
  );
}

export function ComposerReviewSheet({
  open,
  onOpenChange,
  composer,
  rollupsById,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  composer: ElementComposer;
  rollupsById: Map<string, CreativeRollup>;
  onSend: () => void;
}) {
  const filledKeys = ELEMENT_ORDER.filter((k) => composer.picks[k]);
  const textMetaByKey = new Map(TEXT_ELEMENT_META.map((m) => [m.key, m]));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[85vh] flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-6 py-4 text-left">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-base">Assembled brief</SheetTitle>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <Sparkles className="h-3 w-3" />
              Simulated handoff
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Edit anything below before sending — each piece is tagged with the column it came
            from.
          </p>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {filledKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing picked yet.</p>
          ) : (
            filledKeys.map((key) => {
              const pick = composer.picks[key]!;
              const fromLabel = `From: ${pick.creativeName}`;

              if (key === "media") {
                const rollup = rollupsById.get(pick.creativeId);
                return (
                  <SlotFrame key={key} label={ELEMENT_LABELS.media} onClear={() => composer.clear(key)}>
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                      {rollup && <CreativeThumb creative={rollup.creative} size={40} />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {ELEMENT_LABELS.media}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {fromLabel} · {fmtMultiple(pick.sourceRoas)} ROAS
                        </p>
                      </div>
                    </div>
                  </SlotFrame>
                );
              }

              const meta = textMetaByKey.get(key as (typeof TEXT_ELEMENT_META)[number]["key"]);
              const rows = key === "framework" ? 1 : meta?.rows ?? 2;
              return (
                <SlotFrame key={key} label={ELEMENT_LABELS[key]} onClear={() => composer.clear(key)}>
                  <BriefBlock
                    label={ELEMENT_LABELS[key as ElementKey]}
                    value={pick.value ?? ""}
                    onChange={(v) => composer.updateValue(key, v)}
                    fromLabel={`${fromLabel} · ${fmtMultiple(pick.sourceRoas)} ROAS`}
                    rows={rows}
                  />
                </SlotFrame>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border px-6 py-4">
          <p className="text-xs text-muted-foreground">
            The only numbers above are each source creative's real folded metrics, shown for
            context — this assembled set isn't scored or predicted.
          </p>
          <Button
            onClick={onSend}
            disabled={filledKeys.length === 0}
            className="shrink-0 gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            Send to Genie
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
