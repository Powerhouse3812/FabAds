/**
 * genieHandoff — builds the /genie/new URL from an assembled ComposerState.
 *
 * Reuses Brief Builder's exact handoff contract instead of reinventing it:
 * same `/genie/new` destination, same `?from=<basePath>` stamping so the
 * stub's "Back to Creative Report" link returns to whichever version (2.0 /
 * 3.0) the buyer was on (see GenieHandoffStub + ReportBasePathContext).
 *
 * The payload is a superset of Brief Builder's `brief=` shape: `elements=`
 * carries the full per-slot { creative, value } set so the receiving screen
 * can show exactly which column each piece came from. `concept` / `angle` /
 * `hook` are also set, for backward-compatible display in the stub's
 * existing header rows — derived from an "anchor" creative (whichever
 * source supplies the most picked slots) purely for that header, not a
 * claim that one creative "owns" the assembled set.
 */
import { ELEMENT_ORDER, type ComposerState, type ElementKey } from "./types";

export interface GenieElementPayload {
  creativeId: string;
  creativeName: string;
  value?: string;
}

export type GenieElementsMap = Partial<Record<ElementKey, GenieElementPayload>>;

function pickAnchorId(picks: ComposerState): string | undefined {
  const counts = new Map<string, number>();
  for (const key of ELEMENT_ORDER) {
    const p = picks[key];
    if (!p) continue;
    counts.set(p.creativeId, (counts.get(p.creativeId) ?? 0) + 1);
  }
  let bestId: string | undefined;
  let bestCount = -1;
  for (const [id, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestId = id;
    }
  }
  return bestId;
}

export function buildGenieHandoffUrl(
  picks: ComposerState,
  basePath: string,
  angleIdByCreativeId: Map<string, string>,
): string {
  const anchorId = pickAnchorId(picks);
  const elements: GenieElementsMap = {};
  for (const key of ELEMENT_ORDER) {
    const p = picks[key];
    if (!p) continue;
    elements[key] = { creativeId: p.creativeId, creativeName: p.creativeName, value: p.value };
  }

  const params = new URLSearchParams();
  if (anchorId) {
    params.set("concept", anchorId);
    const angleId = angleIdByCreativeId.get(anchorId);
    if (angleId) params.set("angle", angleId);
  }
  const hookValue = picks.hook?.value;
  if (hookValue) params.set("hook", hookValue);
  params.set("elements", JSON.stringify(elements));
  // Tells the app-level /genie/new stub which Creative Report version to
  // send the buyer back to — same param BriefBuilder used.
  params.set("from", basePath);
  return `/genie/new?${params.toString()}`;
}
