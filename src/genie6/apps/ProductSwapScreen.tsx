import { Package } from "lucide-react";
import { getProduct } from "@/mocks/shared/products";
import type { GenieApp } from "./appTypes";
import { firstFieldOfKind } from "./lib/fieldHelpers";
import { useSwapFlow } from "./swap/useSwapFlow";
import { SwapFlowScreen } from "./swap/SwapFlowScreen";
import { ProductSwapCardView } from "./swap/ProductSwapCardView";
import type { ProductSwapCardState } from "./swap/swapTypes";

/**
 * Product Swap (`product-placement`) — Generate Variations' anatomy, with
 * "the product that replaces the one in the source ad" as the stage-3
 * control. See `swap/useSwapFlow.ts` for why this and Face Swap share a
 * hook + shell rather than each hand-rolling the source/count/rail plumbing.
 */
export function ProductSwapScreen({ app }: { app: GenieApp }) {
  // Stage-2 bounds come from the app's OWN registered stepper (`appRegistry.ts`
  // "Scenes", min 1 / max 8) — never hardcoded here, even though this field no
  // longer renders via `FieldRenderer` (see AppScreen.tsx's intercept comment).
  const stepper = firstFieldOfKind(app, "stepper");
  const countMin = stepper?.min ?? 1;
  const countMax = stepper?.max ?? 8;

  const flow = useSwapFlow<ProductSwapCardState>({
    app,
    countMin,
    countMax,
    countDefault: Math.min(4, countMax),
    cardIdPrefix: "scene",
    countNoun: ["scene", "scenes"],
    freshCard: (id) => ({ id, productId: null }),
    isCardComplete: (c) => c.productId !== null,
    cardCostValues: (c) => ({
      product: c.productId ? { source: "catalogue", product: getProduct(c.productId) } : undefined,
      // Every card is exactly ONE scene — the "scene" unit's multiplier lives
      // in the COUNT of cards summed by the hook, not in this per-card value.
      count: 1,
    }),
    cardItemSeed: (c, i, source) => {
      const product = c.productId ? getProduct(c.productId) : undefined;
      return {
        title: product ? `${product.name} — Scene ${i + 1}` : `Scene ${i + 1}`,
        summary: "Product swapped into an existing ad, scene re-composited around it.",
        thumbnail: product?.thumbnail ?? source.card.media[0],
      };
    },
    batchLabel: (source, count) =>
      `${app.name} · ${source.card.name ?? "Ad"} · ${count} scene${count === 1 ? "" : "s"}`,
    batchConfig: (source, cards) => {
      const names = cards
        .map((c) => (c.productId ? getProduct(c.productId)?.name : undefined))
        .filter((n): n is string => !!n);
      return {
        aspectRatio: source.aspectRatio,
        productName: names[0],
        promptSnippet: names.length ? names.join(" · ") : undefined,
      };
    },
  });

  return (
    <SwapFlowScreen
      app={app}
      flow={flow}
      icon={Package}
      countLabel="How many scenes?"
      countHint={`Between ${countMin} and ${countMax}.`}
      cardSectionTitle="Tune each scene"
      cardSectionHint="Every card starts with no product attached. Pick what replaces the one already in the ad — each scene is composited and billed separately."
      incompleteLabel={(n) =>
        n === 1 ? "1 scene still needs a product." : `${n} scenes still need a product.`
      }
      renderCard={(card, i) => (
        <ProductSwapCardView
          key={card.id}
          card={card}
          index={i}
          onChange={(patch) => flow.updateCard(card.id, patch)}
        />
      )}
    />
  );
}
