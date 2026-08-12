/**
 * PulseEdge — the interactive, react-flow-native descendant of
 * `AutomationUpsellCard`'s static `CircuitNetwork` illustration
 * (src/components/dashboard/ai-plan/AutomationUpsellCard.tsx) and its sibling
 * `AutomationCircuitBanner` (src/components/upsell/illustrations/AutomationCircuitBanner.tsx).
 * Same DNA — a lime signal travelling a connector via `<animateMotion>` — but
 * wired to a live react-flow graph instead of a fixed decorative SVG.
 *
 * `data.active` is set by the canvas from the live automation run state (which
 * edge is currently firing). This component never reads a store/context
 * itself — it stays pure presentation so it can be unit-tested and reused
 * without a live data source.
 *
 * Colour note: the reference components hardcode the PRE-May-2026 lime
 * (#c3eb42 / #9cc42d). That value is now WRONG per the v1.2 accessibility
 * migration (src/index.css ~L40-51) — this edge uses `hsl(var(--primary))`
 * instead, which resolves to the current lime in both light and dark.
 */
import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

export const PulseEdge = memo(function PulseEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = data?.active === true;
  const activePathId = `${id}-path`;

  return (
    <>
      <BaseEdge id={id} path={edgePath} />

      {isActive && (
        <>
          {/* Lime overlay tracing the same path, slightly thicker than the
              base wire — reads as "this connector is currently firing". */}
          <path
            id={activePathId}
            d={edgePath}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            strokeOpacity={0.9}
            strokeLinecap="round"
          />

          {/* Travelling signal pulse — the signature motion from
              CircuitNetwork, ported to a live edge via <mpath>. */}
          <circle r={3} fill="hsl(var(--primary))" className="fabads-pulse-dot">
            <animateMotion dur="1.2s" repeatCount="indefinite">
              <mpath href={`#${activePathId}`} />
            </animateMotion>
          </circle>
        </>
      )}
    </>
  );
});

export default PulseEdge;
