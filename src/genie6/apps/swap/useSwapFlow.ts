import { useCallback, useMemo, useState } from "react";
import type { AppFieldValues, GenieApp } from "../appTypes";
import { previewCost } from "../data/appCost";
import { firstFieldOfKind } from "../lib/fieldHelpers";
import { startBatch, useRunsForApp } from "../../lib/genieRunStore";
import type { RunBatch, RunItem } from "../../lib/genieRunTypes";
import { type CreditLine, exceedsBalance } from "../../lib/credits";
import type { SourceAdValue } from "../fields/SourceAdField";

/**
 * useSwapFlow — the spine BOTH Product Swap and Face Swap mount.
 *
 * Generate Variations' own hook (`variations/state/useVariationsFlow.ts`)
 * is the precedent this mirrors: a shared source, a count, and one card per
 * output, each pricing itself and summing into the rail's total. It is NOT
 * reused directly — its cards each mount a full `useWizard` (Format/Entity/
 * Approach/Prompt), which is the wrong shape for "pick a product" or "pick
 * an avatar + voice + language". This hook is the same SKELETON (source,
 * count, cards, summed credits, generate → startBatch) with the card's own
 * config left to the caller via `SwapFlowAdapter` — genuinely one pattern,
 * shared everywhere it applies, forked only where the two apps' stage-3
 * control differs (§ see ProductSwapCardView / FaceSwapCardView).
 *
 * PRICING — reuses `previewCost()` per card, never a second formula. Each
 * card's own `cardCostValues()` is merged with the shared source-ad value and
 * priced once through the SAME `appCost.ts` every other Other App uses, then
 * the rail sums across cards — identical in spirit to how the Variations
 * rail sums each card's own `buildCreditLines()` total. Product Swap's
 * "scene" unit and Face Swap's "minute" unit both stay exactly as
 * `appCost.ts` already computes them; nothing here re-derives a rate.
 */

export interface SwapCardBase {
  id: string;
}

export interface SwapFlowAdapter<TCard extends SwapCardBase> {
  app: GenieApp;
  /** Stage-2 stepper bounds. Derived from the app's own registered `stepper`
   *  field where one exists (Product Swap's "Scenes") rather than hardcoded —
   *  see each screen's call site. */
  countMin: number;
  countMax: number;
  countDefault: number;
  /** Short id prefix for debugging ("scene" / "swap") — cosmetic only. */
  cardIdPrefix: string;
  /** [singular, plural] for one output — "scene"/"scenes", "swap"/"swaps".
   *  Lives here rather than only on the shell because the credit rail needs
   *  it too: a rail row reading "4 cards" beside a Stage 2 that says "4
   *  scenes" is two nouns for one quantity. One declaration, both consumers. */
  countNoun: [string, string];
  freshCard: (id: string) => TCard;
  /** Whether this card carries enough to generate from. Mirrors the
   *  registry's own `required` fields for the card's kind(s). */
  isCardComplete: (card: TCard) => boolean;
  /** This card's OWN values, keyed by the exact field ids `app.sections`
   *  declares for its stage-3 control(s) — merged with the shared source-ad
   *  value and handed straight to `previewCost()`. */
  cardCostValues: (card: TCard) => AppFieldValues;
  /** Per-card `RunItem` seed at generate time. */
  cardItemSeed: (card: TCard, index: number, source: SourceAdValue) => Partial<RunItem>;
  batchLabel: (source: SourceAdValue, count: number) => string;
  batchConfig: (source: SourceAdValue, cards: TCard[]) => RunBatch["config"];
}

export interface UseSwapFlowReturn<TCard extends SwapCardBase> {
  source: SourceAdValue | undefined;
  setSource: (v: SourceAdValue | undefined) => void;
  count: number;
  countMin: number;
  countMax: number;
  countNoun: [string, string];
  setCount: (n: number) => void;
  cards: TCard[];
  updateCard: (id: string, patch: Partial<TCard>) => void;
  /** Sum of every card's own `previewCost()` — provisional until the source
   *  is picked AND every card is complete. */
  total: number;
  provisional: boolean;
  /** The breakdown that PRODUCED `total`, straight off `previewCost()` — the
   *  rail renders these rather than restating a rate (§21.2: "credits need a
   *  breakdown, not just a number", and the rate alone lies the moment a
   *  multiplier isn't 1). Empty until a source is picked. */
  creditLines: CreditLine[];
  incompleteCount: number;
  overBalance: boolean;
  canGenerate: boolean;
  generate: () => void;
  activeBatchId: string | null;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  runs: RunBatch[];
}

let swapCardSeq = 0;
function newSwapCardId(prefix: string): string {
  swapCardSeq += 1;
  return `${prefix}-${swapCardSeq}`;
}

export function useSwapFlow<TCard extends SwapCardBase>(
  adapter: SwapFlowAdapter<TCard>,
): UseSwapFlowReturn<TCard> {
  const { app, countMin, countMax, countDefault, cardIdPrefix, countNoun, freshCard } = adapter;

  const [source, setSourceState] = useState<SourceAdValue | undefined>(undefined);
  const [count, setCountState] = useState(countDefault);
  const [cards, setCards] = useState<TCard[]>(() =>
    Array.from({ length: countDefault }, () => freshCard(newSwapCardId(cardIdPrefix))),
  );
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const runs = useRunsForApp(app.key);

  const sourceFieldId = useMemo(() => firstFieldOfKind(app, "source-ad-picker")?.id, [app]);

  const setSource = useCallback(
    (v: SourceAdValue | undefined) => {
      setSourceState(v);
      // A new (or cleared) source invalidates every card, same as Generate
      // Variations' `pick`/`clearSource` — fresh ids so any per-card dialog
      // state tied to identity remounts clean rather than carrying a stale
      // product/avatar forward onto a different ad.
      setCards((prev) =>
        Array.from({ length: prev.length }, () => freshCard(newSwapCardId(cardIdPrefix))),
      );
    },
    [cardIdPrefix, freshCard],
  );

  const setCount = useCallback(
    (n: number) => {
      const clamped = Math.max(countMin, Math.min(countMax, Math.round(n)));
      setCountState(clamped);
      setCards((prev) => {
        if (clamped === prev.length) return prev;
        if (clamped > prev.length) {
          // Keep the cards the user already tuned — append, never rebuild.
          return [
            ...prev,
            ...Array.from({ length: clamped - prev.length }, () =>
              freshCard(newSwapCardId(cardIdPrefix)),
            ),
          ];
        }
        return prev.slice(0, clamped);
      });
    },
    [countMin, countMax, cardIdPrefix, freshCard],
  );

  const updateCard = useCallback((id: string, patch: Partial<TCard>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const cardCostValues = adapter.cardCostValues;

  const { total, provisional, creditLines } = useMemo(() => {
    if (!source || !sourceFieldId) {
      return { total: 0, provisional: true, creditLines: [] as CreditLine[] };
    }
    const shared: AppFieldValues = { [sourceFieldId]: source };
    const priced = cards.map((card) => previewCost(app, { ...shared, ...cardCostValues(card) }));
    const sum = priced.reduce((acc, p) => acc + p.total, 0);
    const anyProvisional = priced.some((p) => p.provisional);

    // Every card prices along the IDENTICAL chain, structurally: the only
    // multipliers either app has come from the SHARED source ad (Face Swap's
    // minutes) or from a per-card constant (both adapters pass `count: 1`).
    // Nothing a card carries — a product, an avatar, a language — reaches
    // `appCost.ts`'s arithmetic. So show that chain ONCE and append the card
    // multiplier, rather than repeating N identical rows. If a future app's
    // cards ever price differently this collapse stops being honest and the
    // rail needs a real per-card breakdown — `CreditLine` has no additive op
    // today, so that is a change HERE, not a cast at the call site.
    const chain = priced[0]?.lines ?? [];
    const creditLines: CreditLine[] = [
      // A `× 1` multiplies nothing and only competes with the real count:
      // Product Swap emitted "1 scene × 1" directly above "4 scenes × 4",
      // two nouns for one quantity, the visible one contradicting Stage 2.
      // Dropping it leaves the total untouched and the chain readable.
      //
      // A ×1 that carries a NOTE survives, though: Face Swap's "1 min" is
      // where "rounded up to the nearest minute" is disclosed, and a 34s
      // video really is billed as a full one. Silently dropping that row
      // would make the shortest clips the only ones that never explain
      // their own price.
      ...chain.filter((l) => !(l.op === "multiply" && l.factor === 1 && !l.note)),
      ...(cards.length > 1
        ? [
            {
              label: `${cards.length} ${countNoun[1]}`,
              factor: cards.length,
              op: "multiply" as const,
            },
          ]
        : []),
    ];

    return { total: sum, provisional: anyProvisional, creditLines };
  }, [source, sourceFieldId, cards, app, cardCostValues, countNoun[1]]);

  // Destructured, not read off `adapter` — every screen builds its adapter
  // inline, so the object identity changes on every render and a memo keyed
  // on it would recompute every time anyway.
  const isCardComplete = adapter.isCardComplete;
  const incompleteCount = useMemo(
    () => cards.filter((c) => !isCardComplete(c)).length,
    [cards, isCardComplete],
  );

  const overBalance = exceedsBalance(total);
  const canGenerate = !!source && incompleteCount === 0 && !overBalance;

  const generate = useCallback(() => {
    if (!source || !canGenerate) return;
    const nominalRate = app.cost?.rate ?? 1;
    const batchId = startBatch({
      origin: { kind: "app", app: app.key },
      label: adapter.batchLabel(source, cards.length),
      stages: app.stages ?? ["Queued", "Processing", "Finalizing"],
      count: cards.length,
      creditsPerItem: nominalRate,
      creditsTotal: total, // exactly what the rail quoted — never a rounded re-derivation
      config: adapter.batchConfig(source, cards),
      itemSeed: (i) => adapter.cardItemSeed(cards[i], i, source),
    });
    setActiveBatchId(batchId);
    setDrawerOpen(true);
    // Full reset — same convention `AppRunner.handleSubmit` uses for every
    // other Other App (`setValues({})`), so this pair doesn't quietly behave
    // differently from every sibling app the moment a run starts.
    setSourceState(undefined);
    setCountState(countDefault);
    setCards(Array.from({ length: countDefault }, () => freshCard(newSwapCardId(cardIdPrefix))));
  }, [source, canGenerate, app, adapter, cards, total, countDefault, cardIdPrefix, freshCard]);

  return {
    source,
    setSource,
    count,
    countMin,
    countMax,
    countNoun,
    setCount,
    cards,
    updateCard,
    total,
    provisional,
    creditLines,
    incompleteCount,
    overBalance,
    canGenerate,
    generate,
    activeBatchId,
    drawerOpen,
    setDrawerOpen,
    runs,
  };
}
