/**
 * AutomationCircuitBanner — wide, full-bleed hero illustration for the
 * "Automation" LockedFeatureSellModal (560px-wide paywall modal).
 *
 * Re-composes the node-circuit / flow-network genre shipped in
 * `src/components/dashboard/ai-plan/AutomationUpsellCard.tsx` (CircuitNetwork)
 * into a WIDE banner aspect (560×220, vs the card's 520×170) with more vertical
 * breathing room. Same DNA: an IF trigger branching into ROAS conditions that
 * fire actions, with lime signal pulses travelling the connectors via
 * <animateMotion path="…">. The motion is the point — it must read as a LIVING
 * automation flow-graph, not a chart or an orbital scene.
 *
 * Locked decisions (mirrors the card):
 *   - Topology: 1 trigger → 2 conditions → 3 actions.
 *   - Active lime path: IF → ROAS↑ → SCALE. Everything else neutral.
 *   - Theme-aware: neutral elements use currentColor + opacity (driven by the
 *     wrapper's text-foreground); lime literals (#c3eb42 / #9cc42d) appear ONLY
 *     on the active path + glows. No blue/purple, no emojis.
 */
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Circuit graph data — nodes + edges in the 560×220 SVG coordinate space.
//
// Topology (left → right flow):
//
//        ┌─ c_up (ROAS↑) ──── a_scale  (SCALE)     ← lime "active" path
//   trig ┤                ╲── a_rotate (ROTATE)
//        └─ c_dn (ROAS↓) ──── a_pause  (PAUSE)
//
// Most nodes are neutral (currentColor stroke + card fill); the upper branch is
// lime, reading as the one automation currently firing.
// ─────────────────────────────────────────────────────────────────────────────

type NodeShape = "circle" | "rect";

interface CircuitNode {
  id: string;
  x: number; // centre x
  y: number; // centre y
  shape: NodeShape;
  label?: string;
  lime?: boolean;
}

interface CircuitEdge {
  from: string;
  to: string;
  lime?: boolean;
}

const RECT_W = 64;
const RECT_H = 30;
const CIRCLE_R = 17;

const NODES: CircuitNode[] = [
  { id: "trig", x: 70, y: 110, shape: "circle", label: "IF", lime: true },
  { id: "c_up", x: 262, y: 64, shape: "rect", label: "ROAS↑", lime: true },
  { id: "c_dn", x: 262, y: 156, shape: "rect", label: "ROAS↓" },
  { id: "a_scale", x: 480, y: 56, shape: "rect", label: "SCALE", lime: true },
  { id: "a_rotate", x: 480, y: 110, shape: "rect", label: "ROTATE" },
  { id: "a_pause", x: 480, y: 164, shape: "rect", label: "PAUSE" },
];

const EDGES: CircuitEdge[] = [
  { from: "trig", to: "c_up", lime: true },
  { from: "trig", to: "c_dn" },
  { from: "c_up", to: "a_scale", lime: true },
  { from: "c_dn", to: "a_rotate" },
  { from: "c_dn", to: "a_pause" },
];

const NODE_BY_ID = new Map(NODES.map((n) => [n.id, n]));

/** Right-edge anchor of a node (where an outgoing connector departs). */
function exitPoint(n: CircuitNode) {
  const half = n.shape === "circle" ? CIRCLE_R : RECT_W / 2;
  return { x: n.x + half, y: n.y };
}

/** Left-edge anchor of a node (where an incoming connector arrives). */
function entryPoint(n: CircuitNode) {
  const half = n.shape === "circle" ? CIRCLE_R : RECT_W / 2;
  return { x: n.x - half, y: n.y };
}

/**
 * Smooth horizontal-elbow connector between two node anchors: a cubic Bézier
 * whose control points are pulled horizontally, giving the gentle S-curve of a
 * circuit trace rather than a straight wire. Returned as a `d` string so it can
 * feed both <path> and <animateMotion path="…">.
 */
function edgePath(from: CircuitNode, to: CircuitNode): string {
  const a = exitPoint(from);
  const b = entryPoint(to);
  const dx = (b.x - a.x) * 0.5;
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Banner illustration
// ─────────────────────────────────────────────────────────────────────────────

export function AutomationCircuitBanner({ className }: { className?: string }) {
  // Pre-resolve every edge to its endpoints + path string + a staggered start
  // so signals flow continuously through the circuit (0s, 0.7s, 1.4s, …).
  const resolvedEdges = EDGES.map((e, i) => {
    const from = NODE_BY_ID.get(e.from)!;
    const to = NODE_BY_ID.get(e.to)!;
    return {
      ...e,
      key: `${e.from}-${e.to}`,
      d: edgePath(from, to),
      begin: `${i * 0.7}s`,
    };
  });

  const trig = NODE_BY_ID.get("trig")!;
  const scale = NODE_BY_ID.get("a_scale")!;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden text-foreground",
        className,
      )}
    >
      <svg
        viewBox="0 0 560 220"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="A living automation flow-graph: an IF trigger branching into ROAS conditions that fire scale, rotate and pause actions, with signals pulsing between nodes"
      >
        <defs>
          {/* 1 ─ faint dot-grid for depth */}
          <pattern
            id="automation-banner-grid"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="currentColor" fillOpacity={0.05} />
          </pattern>
          {/* soft lime glow behind active nodes */}
          <radialGradient id="automation-banner-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c3eb42" stopOpacity={0.42} />
            <stop offset="100%" stopColor="#c3eb42" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* 1 ─ dot-grid background */}
        <rect x="0" y="0" width="560" height="220" fill="url(#automation-banner-grid)" />

        {/* 5 ─ lime glow behind the active trigger + the SCALE action */}
        <circle cx={trig.x} cy={trig.y} r={56} fill="url(#automation-banner-glow)" />
        <circle cx={scale.x} cy={scale.y} r={56} fill="url(#automation-banner-glow)" />

        {/* 3 ─ connectors (drawn first so nodes sit on top) */}
        <g fill="none">
          {resolvedEdges.map((e) => (
            <path
              key={e.key}
              d={e.d}
              stroke={e.lime ? "#9cc42d" : "currentColor"}
              strokeOpacity={e.lime ? 0.5 : 0.25}
              strokeWidth={e.lime ? 1.6 : 1.2}
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* 4 ─ signal pulses travelling each connector (the signature motion) */}
        {resolvedEdges.map((e) => (
          <circle key={`pulse-${e.key}`} r={3} fill="#c3eb42">
            <animateMotion
              dur="2.4s"
              begin={e.begin}
              repeatCount="indefinite"
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="linear"
              path={e.d}
            />
            {/* Fade in on departure, out on arrival so pulses read as travelling. */}
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes="0;0.15;0.8;1"
              dur="2.4s"
              begin={e.begin}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* 2 ─ nodes */}
        {NODES.map((n) => {
          const stroke = n.lime ? "#9cc42d" : "currentColor";
          const strokeOpacity = n.lime ? 0.85 : 0.3;
          const labelOpacity = n.lime ? 0.95 : 0.5;
          const strokeWidth = n.lime ? 1.6 : 1.2;

          return (
            <g key={n.id}>
              {n.shape === "circle" ? (
                <>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={CIRCLE_R}
                    className="fill-card"
                    stroke={stroke}
                    strokeOpacity={strokeOpacity}
                    strokeWidth={strokeWidth}
                  />
                  {n.lime && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={CIRCLE_R}
                      fill="#c3eb42"
                      fillOpacity={0.1}
                    />
                  )}
                </>
              ) : (
                <>
                  <rect
                    x={n.x - RECT_W / 2}
                    y={n.y - RECT_H / 2}
                    width={RECT_W}
                    height={RECT_H}
                    rx={8}
                    className="fill-card"
                    stroke={stroke}
                    strokeOpacity={strokeOpacity}
                    strokeWidth={strokeWidth}
                  />
                  {n.lime && (
                    <rect
                      x={n.x - RECT_W / 2}
                      y={n.y - RECT_H / 2}
                      width={RECT_W}
                      height={RECT_H}
                      rx={8}
                      fill="#c3eb42"
                      fillOpacity={0.1}
                    />
                  )}
                </>
              )}
              {n.label && (
                <text
                  x={n.x}
                  y={n.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="ui-monospace, monospace"
                  fontSize={9}
                  letterSpacing={0.6}
                  fill={n.lime ? "#9cc42d" : "currentColor"}
                  fillOpacity={labelOpacity}
                >
                  {n.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default AutomationCircuitBanner;
