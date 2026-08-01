/**
 * useElementComposer — owns the assembled cross-creative element set for
 * Compare. Lives here (not in CompareColumn, which stays presentational —
 * see CompareColumn's doc-comment) so Compare.tsx is the single source of
 * truth for "which creative supplies which slot."
 *
 * Carries over Brief Builder's touched-tracking: hand-editing a value marks
 * it `edited`, so re-picking a DIFFERENT slot never clobbers an edit already
 * made elsewhere. Unlike Brief Builder (which re-prefilled untouched blocks
 * whenever the primary reference changed), each slot here is independently
 * owned by whichever creative last supplied it — there's no single "primary"
 * to re-derive from.
 */
import { useCallback, useMemo, useState } from "react";
import type { Creative } from "@/data/model";
import { TEXT_ELEMENT_META, frameworkPrefill } from "./elementMeta";
import type { ComposerState, ElementKey, ElementPick } from "./types";

interface SourceMetrics {
  roas: number;
  spend: number;
}

export function useElementComposer() {
  const [picks, setPicks] = useState<ComposerState>({});

  const pickText = useCallback(
    (key: ElementPick["key"], creative: Creative, value: string, metrics: SourceMetrics) => {
      setPicks((prev) => ({
        ...prev,
        [key]: {
          key,
          creativeId: creative.id,
          creativeName: creative.name,
          sourceRoas: metrics.roas,
          sourceSpend: metrics.spend,
          value,
          edited: false,
        },
      }));
    },
    [],
  );

  const pickMedia = useCallback((creative: Creative, metrics: SourceMetrics) => {
    setPicks((prev) => ({
      ...prev,
      media: {
        key: "media",
        creativeId: creative.id,
        creativeName: creative.name,
        sourceRoas: metrics.roas,
        sourceSpend: metrics.spend,
      },
    }));
  }, []);

  const pickFramework = useCallback((creative: Creative, metrics: SourceMetrics) => {
    setPicks((prev) => ({
      ...prev,
      framework: {
        key: "framework",
        creativeId: creative.id,
        creativeName: creative.name,
        sourceRoas: metrics.roas,
        sourceSpend: metrics.spend,
        value: frameworkPrefill(creative),
        edited: false,
      },
    }));
  }, []);

  /** "Whole ad" — fills every text slot + media from one creative in one go.
   *  Framework is included only when `frameworkAnalysed` is true; it is
   *  NEVER force-unlocked by this shortcut. */
  const pickWholeAd = useCallback(
    (creative: Creative, metrics: SourceMetrics, frameworkAnalysed: boolean) => {
      setPicks(() => {
        const next: ComposerState = {};
        for (const meta of TEXT_ELEMENT_META) {
          next[meta.key] = {
            key: meta.key,
            creativeId: creative.id,
            creativeName: creative.name,
            sourceRoas: metrics.roas,
            sourceSpend: metrics.spend,
            value: meta.prefill(creative),
            edited: false,
          };
        }
        next.media = {
          key: "media",
          creativeId: creative.id,
          creativeName: creative.name,
          sourceRoas: metrics.roas,
          sourceSpend: metrics.spend,
        };
        if (frameworkAnalysed) {
          next.framework = {
            key: "framework",
            creativeId: creative.id,
            creativeName: creative.name,
            sourceRoas: metrics.roas,
            sourceSpend: metrics.spend,
            value: frameworkPrefill(creative),
            edited: false,
          };
        }
        return next;
      });
    },
    [],
  );

  const updateValue = useCallback((key: ElementKey, value: string) => {
    setPicks((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return { ...prev, [key]: { ...existing, value, edited: true } };
    });
  }, []);

  const clear = useCallback((key: ElementKey) => {
    setPicks((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setPicks({}), []);

  const filledCount = useMemo(() => Object.keys(picks).length, [picks]);

  return {
    picks,
    pickText,
    pickMedia,
    pickFramework,
    pickWholeAd,
    updateValue,
    clear,
    clearAll,
    filledCount,
    isEmpty: filledCount === 0,
  };
}

export type ElementComposer = ReturnType<typeof useElementComposer>;
