import { useEffect, useState } from "react";
import { AlertCircle, Building2, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

/**
 * Vibe A — In-transit metaphor (Razorpay-inspired).
 *
 * Horizontal SVG composition: YOU → BANK → FABFUNNEL.
 * A lime "money dot" animates along the path via SVG <animateMotion>
 * (declarative, browser-native, smooth — no rAF loop or framer-motion
 * timing math needed). Dashed path subtly shifts via CSS keyframes on
 * stroke-dashoffset to communicate continuous motion. Nodes briefly
 * highlight when the dot passes (CSS animation, staggered delays).
 */
export function VibeA_InTransit({ className }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(1, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  // SVG geometry. viewBox 560 x 180. Nodes at x = 70, 280, 490 (y = 90).
  // Path connects them in a gentle straight line so animateMotion is easy.
  const pathD = "M 70 90 L 280 90 L 490 90";

  return (
    <div
      className={cn(
        "relative w-full max-w-[640px] mx-auto rounded-2xl border border-border bg-card overflow-hidden",
        "flex flex-col",
        className,
      )}
      style={{ minHeight: 520 }}
    >
      {/* Inline keyframes for dashed path drift + node pulse */}
      <style>{`
        @keyframes vibeA-dash-drift {
          to { stroke-dashoffset: -24; }
        }
        @keyframes vibeA-node-pulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(0,0,0,0)); }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 0 8px hsl(var(--primary) / 0.55));
          }
        }
        @keyframes vibeA-tiny-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.25); }
        }
        .vibeA-path {
          stroke-dasharray: 6 6;
          animation: vibeA-dash-drift 1.4s linear infinite;
        }
        .vibeA-node {
          transform-origin: center;
          transform-box: fill-box;
          animation: vibeA-node-pulse 2.5s ease-in-out infinite;
        }
        .vibeA-node-bank { animation-delay: 1.25s; }
        .vibeA-node-fab  { animation-delay: 2.5s; }
        .vibeA-tiny-dot  { animation: vibeA-tiny-pulse 1.4s ease-in-out infinite; }
      `}</style>

      {/* Top eyebrow */}
      <div className="pt-7 px-8 flex flex-col items-center gap-1">
        <span className="text-[10px] font-mono tracking-[0.14em] text-primary uppercase">
          Payment verification
        </span>
        <span className="text-[9px] font-mono tracking-[0.12em] text-muted-foreground uppercase">
          Vibe A · In-transit metaphor
        </span>
      </div>

      {/* Hero SVG composition */}
      <div className="px-8 pt-6">
        <svg
          viewBox="0 0 560 180"
          className="w-full h-auto"
          role="img"
          aria-label="Payment in transit from you to bank to Fabfunnel"
        >
          {/* dashed path */}
          <path
            d={pathD}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeLinecap="round"
            className="vibeA-path"
            opacity={0.7}
          />

          {/* Node: YOU */}
          <g className="vibeA-node">
            <circle
              cx={70}
              cy={90}
              r={28}
              fill="hsl(var(--card))"
              stroke="hsl(var(--border))"
              strokeWidth={1.5}
            />
            <circle cx={70} cy={90} r={28} fill="hsl(var(--primary) / 0.08)" />
            <foreignObject x={54} y={74} width={32} height={32}>
              <div className="flex items-center justify-center w-8 h-8">
                <User
                  className="w-5 h-5 text-foreground"
                  strokeWidth={1.75}
                />
              </div>
            </foreignObject>
          </g>
          <text
            x={70}
            y={140}
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ font: "500 11px Geist, system-ui, sans-serif" }}
          >
            You
          </text>

          {/* Node: BANK */}
          <g className="vibeA-node vibeA-node-bank">
            <circle
              cx={280}
              cy={90}
              r={28}
              fill="hsl(var(--card))"
              stroke="hsl(var(--border))"
              strokeWidth={1.5}
            />
            <circle cx={280} cy={90} r={28} fill="hsl(var(--primary) / 0.08)" />
            <foreignObject x={264} y={74} width={32} height={32}>
              <div className="flex items-center justify-center w-8 h-8">
                <Building2
                  className="w-5 h-5 text-foreground"
                  strokeWidth={1.75}
                />
              </div>
            </foreignObject>
          </g>
          <text
            x={280}
            y={140}
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ font: "500 11px Geist, system-ui, sans-serif" }}
          >
            Your bank
          </text>

          {/* Node: FABFUNNEL */}
          <g className="vibeA-node vibeA-node-fab">
            <circle
              cx={490}
              cy={90}
              r={28}
              fill="hsl(var(--card))"
              stroke="hsl(var(--border))"
              strokeWidth={1.5}
            />
            <circle cx={490} cy={90} r={28} fill="hsl(var(--primary) / 0.08)" />
            <foreignObject x={474} y={74} width={32} height={32}>
              <div className="flex items-center justify-center w-8 h-8">
                <Sparkles
                  className="w-5 h-5 text-foreground"
                  strokeWidth={1.75}
                />
              </div>
            </foreignObject>
          </g>
          <text
            x={490}
            y={140}
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ font: "500 11px Geist, system-ui, sans-serif" }}
          >
            Fabfunnel
          </text>

          {/* The money dot — animates along the path via animateMotion */}
          <circle r={5} fill="hsl(var(--primary))">
            <animateMotion dur="2.5s" repeatCount="indefinite" path={pathD} />
            <animate
              attributeName="opacity"
              values="0;1;1;1;0"
              keyTimes="0;0.05;0.5;0.95;1"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>
          {/* soft glow trailing the dot */}
          <circle r={9} fill="hsl(var(--primary))" opacity={0.25}>
            <animateMotion dur="2.5s" repeatCount="indefinite" path={pathD} />
            <animate
              attributeName="opacity"
              values="0;0.25;0.25;0.25;0"
              keyTimes="0;0.05;0.5;0.95;1"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>

      {/* Headline + sub */}
      <div className="px-8 mt-4 text-center">
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          Verifying your payment
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1.5">
          We&rsquo;re confirming with your bank &mdash; usually 30&ndash;60 seconds.
        </p>
      </div>

      {/* Status row */}
      <div className="px-8 mt-5 flex items-center justify-center gap-2.5 text-[12px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="vibeA-tiny-dot inline-block w-1.5 h-1.5 rounded-full bg-primary"
          />
          Usually 30&ndash;60s
        </span>
        <span aria-hidden className="text-muted-foreground/60">
          &middot;
        </span>
        <span className="font-mono tabular-nums">
          {mm}:{ss} elapsed
        </span>
      </div>

      {/* Spacer to push banner to bottom */}
      <div className="flex-1" />

      {/* Sticky banner at card bottom */}
      <div className="border-t border-primary/30 bg-primary/5 px-6 py-3 flex items-center gap-3">
        <AlertCircle className="h-3.5 w-3.5 text-primary shrink-0" />
        <p className="text-[12px] text-foreground/80 flex-1 leading-snug">
          Don&rsquo;t close this tab
          <span className="text-muted-foreground"> &middot; </span>
          Refresh if stuck after 60 seconds
        </p>
        <button
          type="button"
          className="text-[12px] font-medium text-primary hover:underline shrink-0"
        >
          Need help?
        </button>
      </div>
    </div>
  );
}
