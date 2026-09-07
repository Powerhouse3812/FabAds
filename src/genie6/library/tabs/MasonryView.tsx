import { OutputCard } from "../../components/OutputCard";
import type { OutputData } from "../../types/output";
import type { GetOutputCardActions } from "../useOutputCardActions";
import { originLabel } from "../originLabels";
import { useOutputBatchIndex } from "../useOutputBatchIndex";

interface MasonryViewProps {
  outputs: OutputData[];
  selected: Set<string>;
  onSelect: (id: string) => void;
  onCardClick: (output: OutputData) => void;
  /**
   * Per-output ellipsis/footer handlers (bookmark, launch, regenerate,
   * variation, save-as-*, etc). Optional so existing callers that don't
   * wire actions (AngleViewMoreDrawer) keep compiling untouched — cards
   * just render with no-op footer buttons in that case, same as before.
   */
  getActions?: GetOutputCardActions;
}

/**
 * MasonryView — Pinterest-style masonry layout via CSS columns.
 *
 * Why CSS columns (not a JS-coordinated masonry lib):
 *  - The codebase has no current dependency on `react-masonry-css`,
 *    `masonic`, or similar. Adding one is overkill for a static-after-
 *    paint grid where the only dynamic input is filter/sort.
 *  - `column-count` + `break-inside: avoid` give us true masonry rhythm
 *    where each card breaks the next column naturally to its variable
 *    height. Supported back to Safari 14 / FF 78 / Chromium.
 *  - Caveat: CSS columns flow top-to-bottom within each column, so
 *    visual reading order is column-major, not row-major. For a
 *    Pinterest-like browse surface that's the right call (matches the
 *    Figma reference + how users scan an image grid).
 *
 * Cards are rendered with the default `size="full"` (~272px wide ×
 * variable height) — same OutputCard component the Group-by-Angle row
 * uses with `size="compact"`.
 */
export function MasonryView({ outputs, selected, onSelect, onCardClick, getActions }: MasonryViewProps) {
  // §11 — Masonry mixes batch-tracked and pre-tracking outputs in one grid
  // (no separate "Earlier generations" section like BatchGroupedView), so
  // every card resolves its own attribution against the one run-store index:
  // a hit gets the real module name, a miss is a KNOWN pre-tracking output
  // (the index covers every batch there is), not an unknown — hence
  // "Not tracked" rather than no badge.
  const batchIndex = useOutputBatchIndex();

  return (
    <div
      className="
        columns-1 gap-4
        sm:columns-2
        lg:columns-3
        xl:columns-4
        [&>*]:mb-4
        [&>*]:break-inside-avoid
      "
    >
      {outputs.map((o) => {
        const batch = batchIndex.get(o.id);
        return (
          <OutputCard
            key={o.id}
            {...o}
            {...getActions?.(o)}
            moduleLabel={batch ? originLabel(batch.origin) : "Not tracked"}
            selected={selected.has(o.id)}
            onSelect={() => onSelect(o.id)}
            onClick={() => onCardClick(o)}
          />
        );
      })}
    </div>
  );
}
