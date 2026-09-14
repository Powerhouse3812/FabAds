/**
 * Product Swap + Face Swap — shared "swap flow" card shapes.
 *
 * Owner ruling, 2026-09-13/14 (verbatim): "product swap and faceswap, is
 * also not using the same generate variation flow and UI. We decided that
 * already." Both apps get the Generate Variations anatomy — a source, a
 * count, then one editable card per output — via `useSwapFlow` +
 * `SwapFlowScreen` (see that folder). This file is just the two per-app
 * card shapes those generic pieces are parameterised over.
 */

/** One output row for Product Swap — the product that replaces the one
 *  already in the source ad. `null` = nothing attached yet (a legal,
 *  first-class "partial" state — see `ProductSheet`'s own resting affordance). */
export interface ProductSwapCardState {
  id: string;
  productId: string | null;
}

/** One output row for Face Swap — avatar, voice and tone are decided
 *  together (§13), plus the single language the re-performed ad speaks. */
export interface FaceSwapCardState {
  id: string;
  avatarId: string | null;
  voiceId: string | null;
  tone: string | null;
  language: string | null;
}

export type SwapCardState = ProductSwapCardState | FaceSwapCardState;
