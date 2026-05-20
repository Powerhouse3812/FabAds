import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

type StepState = "done" | "running" | "queued";

interface StepDef {
  title: string;
  sub: string;
  state: StepState;
}

const STEPS: StepDef[] = [
  {
    title: "Charging your card",
    sub: "Securely processed by Stripe",
    state: "done",
  },
  {
    title: "Confirming with your bank",
    sub: "3D Secure verification",
    state: "running",
  },
  {
    title: "Activating your plan",
    sub: "Unlocking features in your workspace",
    state: "queued",
  },
];

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VibeB_IntentProgress({ className }: Props) {
  // Live elapsed counter — starts at 18s so we land mid-"running" for the preview.
  const [elapsed, setElapsed] = useState(18);

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className={cn(
        "font-g6-sans flex items-center justify-center bg-background",
        className,
      )}
    >
      <div
        className="relative w-[560px] rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden"
        style={{ minHeight: 520 }}
      >
        {/* Body */}
        <div className="px-8 pt-7 pb-6">
          {/* Eyebrow */}
          <div className="flex items-center justify-between">
            <span className="font-g6-mono text-[10px] tracking-[0.14em] uppercase text-primary">
              Payment verification
            </span>
            <span className="font-g6-mono text-[9px] tracking-[0.12em] uppercase text-muted-foreground">
              Vibe B · Intent progress
            </span>
          </div>

          {/* Headline */}
          <h1 className="mt-4 text-[22px] font-semibold tracking-tight text-foreground leading-tight">
            Confirming your subscription
          </h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Three checks · usually 30–60 seconds.
          </p>

          {/* Status row */}
          <div className="mt-5 flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="font-g6-mono text-[10px] tracking-[0.14em] uppercase text-foreground">
                In progress
              </span>
            </span>
            <span className="font-g6-mono text-[10px] text-muted-foreground">·</span>
            <span className="font-g6-mono text-[10px] tracking-[0.10em] uppercase text-muted-foreground tabular-nums">
              {formatElapsed(elapsed)} elapsed
            </span>
          </div>

          {/* Step list */}
          <ol className="mt-7 flex flex-col gap-3 m-0 p-0 list-none">
            {STEPS.map((step, i) => {
              const prev = i > 0 ? STEPS[i - 1] : null;
              const connectorActive = prev?.state === "done";
              return (
                <motion.li
                  key={step.title}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.08 + i * 0.08,
                    duration: 0.32,
                    ease: [0.2, 0.8, 0.2, 1],
                  }}
                  className="relative"
                >
                  {/* Connector above (drawn from previous row down to this one) */}
                  {i > 0 && (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute left-[13px] -top-3 h-4 w-[1.5px] rounded-full",
                        connectorActive ? "bg-primary/60" : "bg-border",
                      )}
                    />
                  )}

                  <div className="flex items-center gap-3">
                    {/* Status indicator column */}
                    <div className="w-7 shrink-0 flex justify-center">
                      <StepIndicator state={step.state} />
                    </div>

                    {/* Middle text block */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-[13px] font-medium leading-tight",
                          step.state === "queued"
                            ? "text-muted-foreground"
                            : "text-foreground",
                          step.state === "running" && "animate-pulse",
                        )}
                      >
                        {step.title}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground leading-tight">
                        {step.sub}
                      </div>
                    </div>

                    {/* Right status text */}
                    <div className="shrink-0 text-right">
                      <span
                        className={cn(
                          "font-g6-mono text-[10px] tracking-[0.14em] uppercase",
                          step.state === "done" && "text-primary",
                          step.state === "running" && "text-foreground",
                          step.state === "queued" && "text-muted-foreground/70",
                        )}
                      >
                        {step.state}
                      </span>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>

        {/* Sticky banner — absolute bottom */}
        <div className="absolute inset-x-0 bottom-0 bg-primary/5 border-t border-primary/30 px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-[11px] text-foreground/80 truncate">
              Don't close this tab · Refresh if stuck after 60 seconds
            </span>
          </div>
          <a
            href="#support"
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Need help? Contact support
          </a>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (state === "running") {
    return (
      <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-primary bg-primary/10">
        <Loader2 className="h-3 w-3 text-primary animate-spin" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="inline-block h-5 w-5 rounded-full border-[1.5px] border-dashed border-border"
    />
  );
}
