/**
 * ComposerBar — the persistent "what's assembled so far" strip at the
 * bottom of Compare (creatives mode, cards view). Sticky within the
 * module's own scroll region (CreativeReportLayout's `<main
 * overflow-y-auto>`), so it stays visible without scrolling away per the
 * handoff spec — replaces the standalone Brief Builder screen entirely.
 *
 * Empty state explains what the composer is for instead of showing an empty
 * box (per the handoff's honesty/empty-state rule). Once anything is
 * picked, it becomes a compact row of removable chips + one "Review & send"
 * action that opens the full editable sheet.
 *
 * Only rendered when it can actually be acted on — `pickersAvailable` tells
 * it whether pick affordances are on screen right now (creatives mode +
 * cards view). Picks PERSIST across mode/view switches, so the three states
 * are deliberately different:
 *   empty + no pickers  → render nothing (an instruction to "pick from the
 *                         columns above" would point at columns that have no
 *                         pick chips — a dead-end instruction)
 *   empty + pickers     → the instructional empty state
 *   has picks           → chips + "Review & send", anywhere, because sending
 *                         what's already assembled stays valid; when the
 *                         pickers aren't on screen it says where they are
 *                         instead of implying you can pick more right here.
 */
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { truncate } from "@/creative-report/lib/format";
import type { CreativeRollup } from "@/creative-report/lib/selectors";
import { ComposerReviewSheet } from "./ComposerReviewSheet";
import { ELEMENT_LABELS, ELEMENT_ORDER } from "./types";
import type { ElementComposer } from "./useElementComposer";

export function ComposerBar({
  composer,
  rollupsById,
  onSend,
  pickersAvailable,
}: {
  composer: ElementComposer;
  rollupsById: Map<string, CreativeRollup>;
  onSend: () => void;
  /** Whether element pick affordances are currently on screen (creatives
   *  mode + cards view). Drives whether the instructional empty state is
   *  honest to show at all. */
  pickersAvailable: boolean;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);

  // Nothing picked AND nothing to pick from → no bar. Showing the "pick
  // elements from any column above" copy here would reference affordances
  // that don't exist in contexts mode or the line/bar chart views.
  if (composer.isEmpty && !pickersAvailable) return null;

  if (composer.isEmpty) {
    return (
      <div className="sticky bottom-0 z-10 mt-4 rounded-xl border border-dashed border-border bg-card/95 p-4 text-center backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <p className="text-sm text-muted-foreground">
          Pick elements from any column above — hook from one, CTA from another, the whole ad
          from a third — to assemble a mixed set here, then send it all to Genie in one go.
        </p>
      </div>
    );
  }

  const filledKeys = ELEMENT_ORDER.filter((k) => composer.picks[k]);

  return (
    <>
      <div className="sticky bottom-0 z-10 mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {filledKeys.map((key) => {
            const pick = composer.picks[key]!;
            const { text: nameText } = truncate(pick.creativeName, 20);
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-[11px]"
              >
                <span className="font-medium text-foreground">{ELEMENT_LABELS[key]}</span>
                <span className="text-muted-foreground">· {nameText}</span>
                <button
                  type="button"
                  onClick={() => composer.clear(key)}
                  aria-label={`Remove ${ELEMENT_LABELS[key]}`}
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
        <Button
          size="sm"
          onClick={() => setReviewOpen(true)}
          className="shrink-0 gap-1.5 text-[13px]"
        >
          Review &amp; send ({composer.filledCount})
        </Button>
        {/* Picks survive a mode/view switch, so the bar stays actionable here
            — but the pick chips are not on screen, so say where they are
            rather than implying anything above can be picked from. */}
        {!pickersAvailable && (
          <p className="w-full text-[11px] text-muted-foreground">
            Kept from your earlier picks. Switch to creatives mode in cards view to add or
            change elements.
          </p>
        )}
      </div>

      <ComposerReviewSheet
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        composer={composer}
        rollupsById={rollupsById}
        onSend={() => {
          onSend();
          setReviewOpen(false);
        }}
      />
    </>
  );
}
