/**
 * "Suggested actions" for the AI score breakdown: pure, deterministic, no
 * randomness. Looks at the ad's weakest scoring parts and, for each, names real
 * replacement elements (angle / hook / framework) that are rising or have many
 * winning ads in the SAME industry. The ad's own element is never suggested and
 * the same element is never offered twice.
 *
 * Mapping (Maalik):
 *   longevity weak  → swap the angle or hook
 *   clones weak     → try a proven framework
 *   craft weak      → sharpen the hook (a hook style)
 *   branded penalty → open with the problem, not the brand (a hook style)
 * Engagement is not a score part any more, so it can never be "weak" here.
 */
import { ALL } from "@/lib/insights-v3/types";
import type { Ad, AiScorePart, ElementType } from "@/lib/insights-v3/types";
import { INDEX } from "@/lib/insights-v3/data";
import type { DataIndex } from "@/lib/insights-v3/data";
import { adsInBaseScope, isRisingComparison, trendItems } from "@/lib/insights-v3/selectors";
import { fmtPoints } from "./drawerUtils";

/** A part is "weak" below this share of its own max. */
export const WEAK_BELOW = 0.5;
export const MAX_ACTIONS = 3;
/** Period used to decide what is "rising" (winners are period-independent). */
const RISING_PERIOD = "90d" as const;

export type ActionKey = "longevity" | "clones" | "craft" | "branded-penalty" | "strong";
type SuggestType = Extract<ElementType, "angle" | "hook" | "framework">;

export interface ActionElement {
  type: SuggestType;
  id: string;
  label: string;
  /** Winning ads that use it in the ad's industry. */
  winners: number;
  rising: boolean;
  /** Short proof, e.g. "6 winners" or "rising". */
  evidence: string;
}

export interface AiScoreAction {
  key: ActionKey;
  /** One line that cites the part, e.g. "Longevity is 4 / 21.4: it ran 6 days". */
  problem: string;
  /** Concrete suggestion that names the replacement elements. */
  suggestion: string;
  /** 0–2 replacements, best first. The first one is the CTA target; empty = fall back to "Create a variation". */
  elements: ActionElement[];
}

const KEY_ORDER: Record<string, number> = { longevity: 0, clones: 1, craft: 2, "branded-penalty": 3 };

interface Weak {
  part: AiScorePart;
  /** Lower = worse. */
  rank: number;
}

/** The weakest available parts, worst first. The branded penalty only counts when it is negative. */
function weakParts(parts: AiScorePart[], ad: Ad): Weak[] {
  const out: Weak[] = [];
  for (const part of parts) {
    if (!part.available || !(part.key in KEY_ORDER)) continue;
    // An unknown start date scores 0, but that is missing data, not a weak angle: nothing to swap.
    if (part.key === "longevity" && ad.daysLive == null) continue;
    if (part.key === "branded-penalty") {
      // −12 → 0 (worst), −6 → 0.25
      if (part.value < 0) out.push({ part, rank: 0.5 + part.value / 24 });
      continue;
    }
    if (part.max <= 0) continue;
    const ratio = part.value / part.max;
    if (ratio < WEAK_BELOW) out.push({ part, rank: ratio });
  }
  return out.sort((a, b) => a.rank - b.rank || KEY_ORDER[a.part.key] - KEY_ORDER[b.part.key]);
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function longevityTail(ad: Ad): string {
  if (ad.daysLive == null || ad.daysLive <= 0) return "it ran for less than a day";
  return `it ran ${plural(ad.daysLive, "day")}`;
}

function clonesTail(ad: Ad): string {
  return ad.clones > 0 ? `only ${plural(ad.clones, "competitor clone")} so far` : "no competitor has copied it yet";
}

function craftTail(part: AiScorePart): string {
  return /^thin/i.test(part.reason) ? "thin direct-response signals" : `it only shows ${part.reason}`;
}

function penaltyTail(part: AiScorePart): string {
  const body = part.reason.replace(/^(branded ad|mostly branded):\s*/i, "");
  return `it has ${body}`;
}

function problemLine(part: AiScorePart, ad: Ad): string {
  switch (part.key) {
    case "longevity":
      return `${part.label} is ${fmtPoints(part.value)} / ${fmtPoints(part.max)}: ${longevityTail(ad)}`;
    case "clones":
      return `${part.label} is ${fmtPoints(part.value)} / ${fmtPoints(part.max)}: ${clonesTail(ad)}`;
    case "craft":
      return `${part.label} is ${fmtPoints(part.value)} / ${fmtPoints(part.max)}: ${craftTail(part)}`;
    default:
      return `${part.label} is −${fmtPoints(Math.abs(part.value))}: ${penaltyTail(part)}`;
  }
}

/** "“A” (angle, 6 winners) and “B” (hook, rising)". */
function nameList(els: ActionElement[], withType: boolean): string {
  const items = els.map((e) => `“${e.label}” (${withType ? `${e.type}, ` : ""}${e.evidence})`);
  return items.length <= 1 ? items.join("") : `${items[0]} and ${items[1]}`;
}

export interface DeriveOptions {
  now: number;
  data?: DataIndex;
}

/**
 * Ranked replacement candidates for one element type in the ad's industry:
 * ≥1 winner or rising, most winners first, then rising, then most launches.
 */
function candidatesFor(type: SuggestType, ad: Ad, base: Ad[], opts: DeriveOptions, data: DataIndex): ActionElement[] {
  const own = type === "angle" ? ad.analysis.angle : type === "hook" ? ad.analysis.hookStyle : ad.analysis.framework;
  // A hook hand-off carries a quoted hook line, so only styles that have one are offerable.
  const quotable = new Set<string>();
  if (type === "hook") for (const a of base) if (a.analysis.hookStyle && a.analysis.hookText?.trim()) quotable.add(a.analysis.hookStyle);

  return trendItems(type, base, RISING_PERIOD, opts.now, data)
    .filter((t) => t.id !== "other" && t.id !== own && (type !== "hook" || quotable.has(t.id)))
    .map((t) => ({ t, rising: isRisingComparison(t) && t.cur > 0 }))
    .filter(({ t, rising }) => t.winners >= 1 || rising)
    .sort((a, b) => b.t.winners - a.t.winners || Number(b.rising) - Number(a.rising) || b.t.cur - a.t.cur || (a.t.id < b.t.id ? -1 : 1))
    .map(({ t, rising }) => ({
      type,
      id: t.id,
      label: t.label,
      winners: t.winners,
      rising,
      evidence: t.winners >= 1 ? `${plural(t.winners, "winner")}${rising ? ", rising" : ""}` : "rising",
    }));
}

export function deriveAiScoreActions(ad: Ad, opts: DeriveOptions): AiScoreAction[] {
  const data = opts.data ?? INDEX;
  const weak = weakParts(ad.aiScore.parts, ad).slice(0, MAX_ACTIONS);

  if (weak.length === 0) {
    return [
      {
        key: "strong",
        problem: "No weak spot: every part of the score is at least half of its points.",
        suggestion: "Use this ad as a reference: keep its angle, hook and framework and change one thing at a time.",
        elements: [],
      },
    ];
  }

  const industry = data.industryById.get(ad.industryId)?.label ?? "this industry";
  const base = adsInBaseScope(data.ads, { industry: ad.industryId, category: ALL, period: RISING_PERIOD, myPrefsOnly: false }, { now: opts.now });
  const cache = new Map<SuggestType, ActionElement[]>();
  const ranked = (t: SuggestType) => {
    let r = cache.get(t);
    if (!r) cache.set(t, (r = candidatesFor(t, ad, base, opts, data)));
    return r;
  };
  const used = new Set<string>();
  const take = (type: SuggestType, n: number): ActionElement[] => {
    const picked = ranked(type).filter((e) => !used.has(`${e.type}:${e.id}`)).slice(0, n);
    for (const e of picked) used.add(`${e.type}:${e.id}`);
    return picked;
  };

  return weak.map(({ part }): AiScoreAction => {
    const problem = problemLine(part, ad);
    let elements: ActionElement[] = [];
    let suggestion: string;

    switch (part.key) {
      case "longevity": {
        // best angle + best hook; whichever has more winners leads
        elements = [...take("angle", 1), ...take("hook", 1)].sort((a, b) => b.winners - a.winners || Number(b.rising) - Number(a.rising));
        suggestion = elements.length
          ? `Swap the angle or hook: in ${industry}, ${nameList(elements, true)} ${elements.length === 1 ? "is" : "are"} working.`
          : `Swap the angle or hook and relaunch. Nothing in ${industry} stands out yet, so test two of your own.`;
        break;
      }
      case "clones": {
        elements = take("framework", 2);
        suggestion = elements.length
          ? `Try a proven framework: in ${industry}, ${nameList(elements, false)} ${elements.length === 1 ? "is" : "are"} working.`
          : `Try a different framework. No framework in ${industry} has enough winners to recommend yet.`;
        break;
      }
      case "craft": {
        elements = take("hook", 2);
        suggestion = elements.length
          ? `Sharpen the hook: in ${industry}, the ${nameList(elements, false)} hook style${elements.length === 1 ? " is" : "s are"} working.`
          : "Sharpen the hook: lead with one concrete offer, a reason to act now, and a clear CTA.";
        break;
      }
      default: {
        elements = take("hook", 1);
        suggestion = elements.length
          ? `Open with the problem, not the brand: try the ${nameList(elements, false)} hook style.`
          : "Open with the problem, not the brand: put an offer, a hook or a CTA in the first line.";
      }
    }
    return { key: part.key as ActionKey, problem, suggestion, elements };
  });
}
