/**
 * AutomationUpsellCard — large, illustrated upsell card for the AI-plan dashboard.
 *
 * Vertical layout (DIFFERENT from the side-by-side sibling cards):
 *   - TOP (~55%): a custom SVG node-circuit / flow-network — automation rules
 *     as connected nodes (TRIGGER → CONDITION → ACTION) with lime signal pulses
 *     travelling the connectors via <animateMotion>. Reads as a living system
 *     diagram, not a chart or a list. The motion is the point.
 *   - BOTTOM (~45%): eyebrow + headline + lime CTA.
 *
 * Composed into a vertical stack by UpsellRow (wired separately).
 *
 * Locked decisions (do not reopen):
 *   - Tier: Growth · Trial: 14-day
 *   - Topology: 1 trigger → 2 conditions → 2 actions; the "scale winners"
 *     branch (TRIGGER → ROAS↑ → SCALE) is the lime/active path.
 */
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AutomationUpsellCardProps {
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Circuit graph data — nodes + edges in the 520×170 SVG coordinate space.
//
// Topology (left → right flow):
//
//        ┌─ c_up (ROAS↑) ──── a_scale (SCALE)     ← lime "active" path
//   trig ┤
//        └─ c_dn (ROAS↓) ──── a_pause (PAUSE)
//
// Most nodes are neutral (currentColor stroke + card/muted fill); the upper
// branch is lime to read as the one automation currently firing.
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

const RECT_W = 58;
const RECT_H = 26;
const CIRCLE_R = 15;

const NODES: CircuitNode[] = [
  { id: "trig", x: 56, y: 85, shape: "circle", label: "IF", lime: true },
  { id: "c_up", x: 210, y: 46, shape: "rect", label: "ROAS↑", lime: true },
  { id: "c_dn", x: 210, y: 124, shape: "rect", label: "ROAS↓" },
  { id: "a_scale", x: 410, y: 46, shape: "rect", label: "SCALE", lime: true },
  { id: "a_pause", x: 410, y: 124, shape: "rect", label: "PAUSE" },
  { id: "a_rotate", x: 410, y: 85, shape: "rect", label: "ROTATE" },
];

const EDGES: CircuitEdge[] = [
  { from: "trig", to: "c_up", lime: true },
  { from: "trig", to: "c_dn" },
  { from: "c_up", to: "a_scale", lime: true },
  { from: "c_dn", to: "a_pause" },
  { from: "c_dn", to: "a_rotate" },
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

function CircuitNetwork() {
  // Pre-resolve every edge to its endpoints + path string + a staggered start.
  const resolvedEdges = EDGES.map((e, i) => {
    const from = NODE_BY_ID.get(e.from)!;
    const to = NODE_BY_ID.get(e.to)!;
    return {
      ...e,
      key: `${e.from}-${e.to}`,
      d: edgePath(from, to),
      begin: `${i * 0.8}s`, // staggered pulse departures: 0s, 0.8s, 1.6s…
    };
  });

  const trig = NODE_BY_ID.get("trig")!;

  return (
    <svg
      viewBox="0 0 520 170"
      className="h-full w-full text-foreground"
      role="img"
      aria-label="A living automation flow-graph: a trigger branching into ROAS conditions that fire scale, pause and rotate actions, with signals pulsing between nodes"
    >
      <defs>
        {/* Faint dot-grid for depth. */}
        <pattern
          id="circuit-grid"
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r="1" fill="currentColor" fillOpacity={0.05} />
        </pattern>
        {/* Soft lime glow behind the active trigger node. */}
        <radialGradient id="circuit-lime-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c3eb42" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#c3eb42" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* 4 ─ dot-grid background */}
      <rect x="0" y="0" width="520" height="170" fill="url(#circuit-grid)" />

      {/* 5 ─ lime glow behind the active trigger */}
      <circle cx={trig.x} cy={trig.y} r={46} fill="url(#circuit-lime-glow)" />

      {/* 2 ─ connectors (drawn first so nodes sit on top) */}
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

      {/* 3 ─ signal pulses travelling each connector (the signature motion) */}
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

      {/* 1 ─ nodes */}
      {NODES.map((n) => {
        const stroke = n.lime ? "#9cc42d" : "currentColor";
        const strokeOpacity = n.lime ? 0.85 : 0.3;
        const labelOpacity = n.lime ? 0.95 : 0.5;

        return (
          <g key={n.id}>
            {n.shape === "circle" ? (
              <circle
                cx={n.x}
                cy={n.y}
                r={CIRCLE_R}
                className="fill-card"
                stroke={stroke}
                strokeOpacity={strokeOpacity}
                strokeWidth={n.lime ? 1.6 : 1.2}
              />
            ) : (
              <rect
                x={n.x - RECT_W / 2}
                y={n.y - RECT_H / 2}
                width={RECT_W}
                height={RECT_H}
                rx={7}
                className="fill-card"
                stroke={stroke}
                strokeOpacity={strokeOpacity}
                strokeWidth={n.lime ? 1.6 : 1.2}
              />
            )}
            {/* Lime nodes carry a faint lime tint over the card fill. */}
            {n.lime &&
              (n.shape === "circle" ? (
                <circle cx={n.x} cy={n.y} r={CIRCLE_R} fill="#c3eb42" fillOpacity={0.1} />
              ) : (
                <rect
                  x={n.x - RECT_W / 2}
                  y={n.y - RECT_H / 2}
                  width={RECT_W}
                  height={RECT_H}
                  rx={7}
                  fill="#c3eb42"
                  fillOpacity={0.1}
                />
              ))}
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
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export function AutomationUpsellCard({ className }: AutomationUpsellCardProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[240px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card",
        className,
      )}
    >
      {/* TOP — circuit illustration */}
      <div className="relative flex min-h-[150px] flex-1 items-center justify-center overflow-hidden border-b border-border/40 bg-gradient-to-b from-primary/[0.04] to-transparent">
        <CircuitNetwork />
      </div>

      {/* BOTTOM — content */}
      <div className="flex flex-col gap-2 p-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">
          Upgrade · Automation
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-[20px] font-bold leading-tight tracking-tight text-foreground">
              Rules that run at 3am.
            </h3>
            <p className="mt-1 max-w-[360px] text-[12.5px] leading-snug text-muted-foreground">
              Pause losers, scale winners, rotate fatigued creative —
              automatically, while you sleep.
            </p>
          </div>
          <Link
            to="/plans-v2?tier=growth&view=trial"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[12.5px] font-bold text-foreground transition-colors hover:bg-primary/90"
          >
            Try Growth · 14-day trial
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default AutomationUpsellCard;
