import { ScanFace } from "lucide-react";
import { avatars, voices } from "@/mocks/shared";
import type { GenieApp } from "./appTypes";
import { firstFieldOfKind } from "./lib/fieldHelpers";
import { languageLabel } from "../lib/languages";
import { useSwapFlow } from "./swap/useSwapFlow";
import { SwapFlowScreen } from "./swap/SwapFlowScreen";
import { FaceSwapCardView } from "./swap/FaceSwapCardView";
import type { FaceSwapCardState } from "./swap/swapTypes";

/**
 * Face Swap — Generate Variations' anatomy, with "avatar + voice + language"
 * as the stage-3 control (owner, 2026-09-13: "same flow, but instead of
 * Product / Product+Category we will give Avatars + voice + language").
 */
export function FaceSwapScreen({ app }: { app: GenieApp }) {
  // Stage-2 bounds from the registry's own "Swaps" stepper (added alongside
  // this screen — see appRegistry.ts's comment on that field).
  const stepper = firstFieldOfKind(app, "stepper");
  const countMin = stepper?.min ?? 1;
  const countMax = stepper?.max ?? 8;

  const flow = useSwapFlow<FaceSwapCardState>({
    app,
    countMin,
    countMax,
    countDefault: Math.min(3, countMax),
    cardIdPrefix: "swap",
    countNoun: ["swap", "swaps"],
    freshCard: (id) => ({ id, avatarId: null, voiceId: null, tone: null, language: null }),
    isCardComplete: (c) => c.avatarId !== null && !!c.language,
    cardCostValues: (c) => ({
      face: c.avatarId ? { avatarId: c.avatarId, voiceId: c.voiceId, tone: c.tone } : undefined,
      language: c.language ?? undefined,
      count: 1,
    }),
    cardItemSeed: (c, i, source) => {
      const avatar = c.avatarId ? avatars.find((a) => a.id === c.avatarId) : undefined;
      const voice = c.voiceId ? voices.find((v) => v.id === c.voiceId) : undefined;
      const langLabel = c.language ? languageLabel(c.language) : undefined;
      return {
        title: avatar ? `${avatar.name} — Swap ${i + 1}` : `Swap ${i + 1}`,
        // Voice is OPTIONAL (`isCardComplete` above asks only for avatar +
        // language), so the summary must not assert one. It read "with the
        // chosen voice" on cards where nothing was chosen.
        summary: voice
          ? `Face swapped into an existing ad, re-performed with ${voice.name}${
              langLabel ? ` in ${langLabel}` : ""
            }.`
          : `Face swapped into an existing ad${
              langLabel ? `, re-performed in ${langLabel}` : ", re-performed"
            }.`,
        thumbnail: source.card.media[0],
        tags: c.language ? [c.language.toUpperCase()] : undefined,
      };
    },
    batchLabel: (source, count) =>
      `${app.name} · ${source.card.name ?? "Ad"} · ${count} swap${count === 1 ? "" : "s"}`,
    batchConfig: (source, cards) => {
      const labels = cards
        .map((c) => {
          const avatar = c.avatarId ? avatars.find((a) => a.id === c.avatarId) : undefined;
          if (!avatar) return undefined;
          return c.language ? `${avatar.name} (${languageLabel(c.language)})` : avatar.name;
        })
        .filter((n): n is string => !!n);
      return {
        aspectRatio: source.aspectRatio,
        language: cards[0]?.language ?? undefined,
        promptSnippet: labels.length ? labels.join(" · ") : undefined,
      };
    },
  });

  return (
    <SwapFlowScreen
      app={app}
      flow={flow}
      icon={ScanFace}
      countLabel="How many swaps?"
      countHint={`Between ${countMin} and ${countMax}.`}
      cardSectionTitle="Tune each swap"
      cardSectionHint="Every card starts with nobody attached. Pick the avatar, voice and language that replace the original — each swap is re-performed and billed separately."
      incompleteLabel={(n) =>
        n === 1
          ? "1 swap still needs an avatar and language."
          : `${n} swaps still need an avatar and language.`
      }
      renderCard={(card, i) => (
        <FaceSwapCardView
          key={card.id}
          card={card}
          index={i}
          onChange={(patch) => flow.updateCard(card.id, patch)}
        />
      )}
    />
  );
}
