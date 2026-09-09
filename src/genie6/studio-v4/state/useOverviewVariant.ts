import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Which shape the wizard's Overview takes.
 *
 *   "rail" — the 300px right-hand aside (`ContextRail`). Default, unchanged.
 *   "band" — a full-width horizontal summary ABOVE the step content
 *            (`ContextOverviewBand`), with no aside, so the step's own
 *            column widens into the freed space.
 *
 * URL-driven for the same reason `?queue=` and `?rail=` are (Step5ResultsQueue,
 * StudioAlpha): a layout the user switched to must survive step navigation and
 * a hard refresh, and must be shareable as a link for design review. "rail" is
 * the default and therefore DELETES the param rather than writing `?overview=rail`
 * — same convention as the queue variant's v1.
 *
 * ONE reader, many consumers: StudioAlpha (which shape to mount) and
 * AlphaStep3Configure (how wide its column may grow) both call this hook rather
 * than parsing the param themselves, so a URL the shell reads as "band" can
 * never be a URL the step reads as "rail".
 */
export type OverviewVariant = "rail" | "band";

export const OVERVIEW_VARIANT_PARAM = "overview";

export function useOverviewVariant(): [OverviewVariant, (next: OverviewVariant) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const variant: OverviewVariant =
    searchParams.get(OVERVIEW_VARIANT_PARAM) === "band" ? "band" : "rail";

  const setVariant = useCallback(
    (next: OverviewVariant) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          // Default variant carries no param — keeps the common URL clean and
          // matches `setVariant` in Step5ResultsQueue.
          if (next === "rail") sp.delete(OVERVIEW_VARIANT_PARAM);
          else sp.set(OVERVIEW_VARIANT_PARAM, next);
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [variant, setVariant];
}

/**
 * The content width shared by the band layout's two halves — the band itself
 * (StudioAlpha) and the step column beneath it (AlphaStep3Configure).
 *
 * Defined ONCE, here, rather than as a literal in each file. Those two must
 * agree: if the band's content and the prompt card below it don't share a left
 * and right edge, the band stops reading as that column's header and starts
 * reading as an unrelated full-bleed slab — which is precisely the "breaking
 * visual hierarchy" the owner rejected the first cut for (2026-09-10).
 *
 * Sized deliberately. The rail layout's column is `max-w-2xl` (42rem); freeing
 * the 300px aside tempts a jump to `max-w-5xl` (64rem), but at that width the
 * prompt textarea's line length runs well past comfortable reading and every
 * element ends up equally wide, so nothing reads as primary. `max-w-4xl`
 * (56rem) still spends most of the freed space without flattening the page.
 */
export const BAND_CONTENT_MAX_W = "max-w-4xl";
