import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { StepNav } from "../components/StepNav";
import { cn } from "@/lib/utils";

interface ProcessingProps {
  onBack: () => void;
  onDone: () => void;
  /** Used to flavour the stage copy per mode. */
  mode: "ecom" | "affiliate";
}

const STAGES_BY_MODE: Record<ProcessingProps["mode"], string[]> = {
  ecom: [
    "Fetching your inputs",
    "Analyzing brand & style",
    "Preparing templates",
    "Finalizing your brand profile",
  ],
  affiliate: [
    "Fetching your inputs",
    "Analyzing category & competitors",
    "Preparing ad angles",
    "Finalizing your niche profile",
  ],
};

const STAGE_DURATION_MS = 1100;
const FINAL_DELAY_MS = 600;

export function Processing({ onBack, onDone, mode }: ProcessingProps) {
  const stages = STAGES_BY_MODE[mode];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (current >= stages.length) {
      const t = setTimeout(onDone, FINAL_DELAY_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setCurrent((c) => c + 1),
      STAGE_DURATION_MS,
    );
    return () => clearTimeout(t);
  }, [current, stages.length, onDone]);

  return (
    <div className="min-h-full bg-background">
      <StepNav active={3} mode={mode} onBack={onBack} backLabel="Back to Input" />
      <div className="max-w-[640px] mx-auto px-6 py-14 text-center">
        {/* Spinner */}
        <div className="inline-flex h-16 w-16 items-center justify-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>

        <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight mt-6">
          Setting up your{" "}
          <span className="bg-primary/30 px-1.5 rounded">workspace…</span>
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2">
          This usually takes 10–20 seconds.
        </p>

        <div className="inline-block mt-9 rounded-2xl border border-border bg-card px-6 py-5 text-left">
          <ul className="flex flex-col gap-3.5 m-0 p-0 list-none">
            {stages.map((label, i) => {
              const done = i < current;
              const active = i === current;
              return (
                <li key={i} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "h-6 w-6 rounded-full inline-flex items-center justify-center border-2 shrink-0 transition-all",
                      done && "bg-primary text-primary-foreground border-primary",
                      active && "border-primary bg-primary/15",
                      !done && !active && "border-border bg-background",
                    )}
                    aria-hidden
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : active ? (
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "text-[14px] transition-colors",
                      done && "text-foreground",
                      active && "text-foreground font-semibold",
                      !done && !active && "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
