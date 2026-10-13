/**
 * "Suggested actions" for the Competitor detail Overview. Pure and deterministic.
 * Mirrors the ad drawer's AI-score actions (ad-drawer/scoreActionsModel): each row
 * = what we see (cites real numbers) + a one-line suggestion naming concrete
 * elements + a Genie CTA. Max 3 rows, in this order:
 *   1. Launching more ads than before (rising / scaling) → study their newest ad
 *   2. Their most-run angle / hook style / framework      → try it
 *   3. Their best winner                                  → use it as a reference
 *   4. Their longest-running ad                           → make a variation of it
 * When the best winner IS the longest-running ad, rows 3 and 4 merge into one row
 * with a second "Create a variation" button. Nothing qualifies → one muted row.
 */
import { launchMs } from "@/lib/insights-v3/selectors";
import type { AdvertiserDetail, RankedItem } from "@/lib/insights-v3/selectors";
import { INDEX } from "@/lib/insights-v3/data";
import type { DataIndex } from "@/lib/insights-v3/data";
import type { Ad, ElementType, SavedItemRef } from "@/lib/insights-v3/types";
import { fmtPct } from "../shared/format";

export const MAX_ADVERTISER_ACTIONS = 3;

export type AdvertiserActionKey = "rising" | "element" | "winner" | "longest" | "none";

export interface AdvertiserActionCta {
  target: SavedItemRef;
  label: string;
  /** Flow action override (e.g. "generate-variation"); omit for the default for this target. */
  action?: string;
}

export interface AdvertiserAction {
  key: AdvertiserActionKey;
  /** One line: what we see, with real numbers. */
  seen: string;
  /** One line: what to do, naming concrete elements. */
  suggestion: string;
  /** Primary CTA (lime). Null only on the "nothing to suggest" row. */
  cta: AdvertiserActionCta | null;
  /** Optional second, quieter CTA. */
  secondary?: AdvertiserActionCta;
}

type SuggestType = Extract<ElementType, "angle" | "hook" | "framework">;
const TYPE_ORDER: SuggestType[] = ["angle", "hook", "framework"];
const TYPE_WORD: Record<SuggestType, string> = { angle: "angle", hook: "hook style", framework: "framework" };

export const NOTHING_TO_SUGGEST: AdvertiserAction = {
  key: "none",
  seen: "Not enough ads in this scope to suggest anything.",
  suggestion: "Widen the industry, category or period to get suggestions.",
  cta: null,
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function elementLabel(data: DataIndex, type: ElementType, id: string | null | undefined): string | null {
  if (!id) return null;
  return data.elementById[type].get(id)?.label ?? null;
}

/** "the “Fear” angle and the “PAS” framework" for an ad; null when it carries neither. */
function adElements(ad: Ad, data: DataIndex): string | null {
  const angle = elementLabel(data, "angle", ad.analysis.angle);
  const framework = elementLabel(data, "framework", ad.analysis.framework);
  const parts = [angle && `the “${angle}” angle`, framework && `the “${framework}” framework`].filter(Boolean) as string[];
  return parts.length ? parts.join(" and ") : null;
}

interface Candidate {
  type: SuggestType;
  item: RankedItem;
  basedOn: number;
  next: RankedItem | undefined;
}

/** Their most-run element: the top item of angles / hooks / frameworks with the highest count. */
function topElement(detail: AdvertiserDetail, ads: Ad[]): Candidate | null {
  const blocks: Record<SuggestType, { basedOn: number; items: RankedItem[] }> = {
    angle: detail.angles,
    hook: detail.hooks,
    framework: detail.frameworks,
  };
  const found: Candidate[] = [];
  for (const type of TYPE_ORDER) {
    const { basedOn, items } = blocks[type];
    // A hook hand-off carries a quoted hook line, so a style no ad quotes is not offerable.
    const usable = items.filter(
      (i) => i.id !== "other" && i.count > 0 && (type !== "hook" || ads.some((a) => a.analysis.hookStyle === i.id && a.analysis.hookText?.trim())),
    );
    if (usable[0]) found.push({ type, item: usable[0], basedOn, next: usable[1] });
  }
  // Highest count wins; ties go to the larger share, then angle > hook > framework.
  found.sort((a, b) => b.item.count - a.item.count || b.item.sharePct - a.item.sharePct || TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));
  return found[0] ?? null;
}

export interface AdvertiserActionOpts {
  data?: DataIndex;
}

export function deriveAdvertiserActions(detail: AdvertiserDetail, ads: Ad[], opts: AdvertiserActionOpts = {}): AdvertiserAction[] {
  const data = opts.data ?? INDEX;
  const byId = new Map(ads.map((a) => [a.id, a]));
  const rows: AdvertiserAction[] = [];

  // 1. Launching more ads than before → their newest ad.
  if ((detail.isRising || detail.isScaling) && ads.length > 0) {
    const newest = ads.slice().sort((a, b) => launchMs(b) - launchMs(a) || (a.id < b.id ? -1 : 1))[0];
    const els = adElements(newest, data);
    const seen =
      detail.isRising && detail.changePct != null
        ? `Launching more ads than before: ${fmtPct(detail.changePct)} new ads vs the previous period.`
        : detail.isRising
          ? "Launching more ads than before: no new ads in the previous period."
          : "Launching more ads than before: more ads are live now than in the previous period, and at least one is a winner.";
    rows.push({
      key: "rising",
      seen,
      suggestion: `Study their newest ads${els ? `: the latest one uses ${els}` : ""}. Open it in Genie to see what they are testing now.`,
      cta: { target: { type: "ad", id: newest.id }, label: "Use their newest ad in Genie" },
    });
  }

  // 2. Their most-run angle / hook / framework → try it.
  const top = topElement(detail, ads);
  if (top) {
    const word = TYPE_WORD[top.type];
    const label = top.item.label;
    rows.push({
      key: "element",
      seen: `Their most-run ${word} is “${label}”: they use it in ${top.item.count} of ${plural(top.basedOn, "ad")}.`,
      suggestion: `Try “${label}” in your next ad${top.next ? `, then “${top.next.label}”, their next most-run ${word}` : ""}.`,
      cta: { target: { type: top.type, id: top.item.id }, label: `Try “${label}” in Genie` },
    });
  }

  // 3. Their best winner → reference.  4. Their longest-running ad → variation.
  const winner = byId.get(detail.winners.adIds[0] ?? "");
  const longest = byId.get(detail.longestRunning.adIds[0] ?? "");
  const longDays = longest?.daysLive != null && longest.daysLive >= 1 ? longest.daysLive : null;
  const merged = !!winner && !!longest && winner.id === longest.id;

  if (winner) {
    const els = adElements(winner, data);
    const days = winner.daysLive != null && winner.daysLive >= 1 ? plural(winner.daysLive, "day") : null;
    const copied = winner.clones > 0 ? `${plural(winner.clones, "competitor")} copied it` : "no competitor has copied it yet";
    const seen = merged && longDays
      ? `Their best winner is also their longest-running ad: live ${plural(longDays, "day")}, ${copied}.`
      : `Their best winner has run ${days ?? "for less than a day"} and ${copied}.`;
    rows.push({
      key: "winner",
      seen,
      suggestion: `Use it as a reference: keep ${els ?? "its angle and framework"} and change one thing at a time.`,
      cta: { target: { type: "ad", id: winner.id }, label: "Use their winner as a reference" },
      secondary: merged ? { target: { type: "ad", id: winner.id }, label: "Create a variation", action: "generate-variation" } : undefined,
    });
  }

  if (longest && longDays && !merged) {
    const known = ads.filter((a) => a.daysLive != null);
    const avg = known.length >= 2 ? Math.round(known.reduce((s, a) => s + (a.daysLive as number), 0) / known.length) : null;
    const els = adElements(longest, data);
    rows.push({
      key: "longest",
      seen: `Their longest-running ad has been live ${plural(longDays, "day")}${avg != null ? ` (their average is ${avg})` : ""}.`,
      suggestion: `Make a variation of the ad that has run longest: keep ${els ?? "its angle and framework"} and change only the hook.`,
      cta: { target: { type: "ad", id: longest.id }, label: "Create a variation", action: "generate-variation" },
    });
  }

  return rows.length ? rows.slice(0, MAX_ADVERTISER_ACTIONS) : [NOTHING_TO_SUGGEST];
}
