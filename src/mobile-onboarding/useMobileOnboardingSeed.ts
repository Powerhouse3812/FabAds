/**
 * ═══════════════════════════════════════════════════════════════════════
 *  useMobileOnboardingSeed — READ-ONLY preference seed for "Replay"
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  ⚠️  READ ONLY. THIS IS THE ONLY FILE IN `src/mobile-onboarding/` THAT
 *      TOUCHES `useInsightPreferences`, AND IT TOUCHES EXACTLY ONE THING:
 *      the `preferences` value returned by its react-query READ.
 *
 *      `upsert` and `toggleFollowBrand` are mutations. They are NEVER
 *      destructured, referenced, or called here or anywhere else in this
 *      module. The mobile onboarding flow is a pure visual demo — it
 *      writes nothing, to Supabase or to localStorage. If you are here to
 *      "just hook up saving", stop: that is a deliberate product decision,
 *      not an oversight. Talk to Maalik first.
 *
 *  Why the read exists at all: the flow is launched deliberately from the
 *  More menu and asks "Replay" vs "Start fresh". Since nothing persists,
 *  that question would be meaningless without something to replay. So
 *  "Replay" seeds the Insights pickers from the workspace's CURRENT
 *  preferences (making the flow read like editing an existing setup) and
 *  "Start fresh" opens every picker empty. Edits in either case are thrown
 *  away when the flow closes.
 */
import { useMemo } from "react";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";

export interface MobileOnboardingSeed {
  industries: string[];
  interests: string[];
  brands: string[];
  /** True while the underlying read is in flight. */
  isLoading: boolean;
  /**
   * True once there is a definite answer (loaded, or seeding disabled).
   * The flow waits for this before applying the seed so a slow network
   * can't leave the picker empty on a Replay run.
   */
  isReady: boolean;
}

const EMPTY: string[] = [];

/** Coerces an unknown jsonb column into a clean `string[]`. */
function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return EMPTY;
  return value.filter((v): v is string => typeof v === "string");
}

/**
 * @param enabled Pass `true` while the flow is open — the launch prompt needs
 *   the count to describe what "Replay" would pre-fill. When `false` the hook
 *   still runs (hooks can't be conditional) but reports empty arrays.
 *
 *   Reading is NOT the same as seeding: whether the seed is actually applied
 *   to the pickers is the caller's decision, and `MobileOnboardingFlowA`
 *   applies it only when the start mode is `"replay"`. That is what
 *   guarantees "Start fresh" opens every picker blank.
 */
export function useMobileOnboardingSeed(enabled: boolean): MobileOnboardingSeed {
  // Read-only usage — `preferences` / `isLoading` ONLY. Never `upsert`.
  const { preferences, isLoading } = useInsightPreferences();

  return useMemo<MobileOnboardingSeed>(() => {
    if (!enabled) {
      return {
        industries: EMPTY,
        interests: EMPTY,
        brands: EMPTY,
        isLoading: false,
        isReady: true,
      };
    }
    // `preferences` is `null` for a workspace that has never onboarded, and
    // `undefined` while the query is unresolved or when there is no session
    // at all (demo builds). Both degrade to an empty seed rather than an
    // error state — a Replay with nothing to replay is just a fresh run.
    const row = preferences as
      | {
          industries?: unknown;
          interests?: unknown;
          followed_brands?: unknown;
        }
      | null
      | undefined;

    return {
      industries: toStringArray(row?.industries),
      interests: toStringArray(row?.interests),
      brands: toStringArray(row?.followed_brands),
      isLoading,
      isReady: !isLoading,
    };
  }, [enabled, preferences, isLoading]);
}
