import { useMemo } from "react";
import { SUB_MODE_PROFILES, type StudioV4Form, type SubMode } from "../types";
import { angleForGenre } from "../mocks/genreHeuristic";

/**
 * useSmartDefaults — returns a `Partial<StudioV4Form>` containing
 * pre-fills based on brand/product/sub-mode + an optional `lastUsed`
 * memory slice from prior runs.
 *
 * Phase-1 stub: no real backend wiring. The shape is correct so that
 * downstream consumers can spread it onto `DEFAULT_FORM` today and we
 * swap the body for real lookups later.
 */

export interface SmartDefaultsArgs {
  brandId?: string | null;
  productId?: string | null;
  subMode: SubMode;
  /** Genre tag stored on the brand record. Used by the angle heuristic. */
  genre?: string;
  /** Slice of the last successful run for this user/brand. */
  lastUsed?: Partial<StudioV4Form>;
}

export function useSmartDefaults(
  brandId: string | null | undefined,
  productId: string | null | undefined,
  subMode: SubMode,
  lastUsed?: Partial<StudioV4Form>,
  genre?: string,
): Partial<StudioV4Form> {
  return useMemo(() => {
    const profile = SUB_MODE_PROFILES[subMode];
    const angleId = angleForGenre(genre);

    const stub: Partial<StudioV4Form> = {
      aspectRatios: ["1:1", "9:16"],
      output: profile.lockOutput ?? "image",
      angleIds: [angleId],
      audienceIds: [],
      conceptIds: [],
      voiceTone: "Warm",
      modelId: null,
      brandIntensity: "moderate",
    };

    // Layer lastUsed on top — user's last picks win over the stub.
    return { ...stub, ...(lastUsed ?? {}) };
  }, [brandId, productId, subMode, genre, lastUsed]);
}
