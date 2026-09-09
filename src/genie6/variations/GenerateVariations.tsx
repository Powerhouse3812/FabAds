import { VariationsFlowA } from "./VariationsFlowA";
import { useVariationsFlow } from "./state/useVariationsFlow";

/**
 * Generate Variations — the route entry (Part 1: WHOLE AD).
 *
 * Reached from the Studio Home Mode card that replaced "Custom". Owns the one
 * flow-state instance.
 *
 * Shipped as two competing UI versions (inline vs stepped) behind `?ui=a|b`;
 * Maalik picked the inline one on 2026-09-09, so the stepped version, the
 * switch and the dev pill are gone rather than left rotting behind a flag.
 */
export function GenerateVariations() {
  const flow = useVariationsFlow();

  return (
    <div className="relative min-h-full bg-g6-bg-base text-g6-text">
      <VariationsFlowA flow={flow} />
    </div>
  );
}
