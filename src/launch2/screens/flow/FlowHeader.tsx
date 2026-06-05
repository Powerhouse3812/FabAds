/**
 * FlowHeader — the wizard's step header: a 5-segment progress bar plus the
 * current step's title/subtitle. Completed steps are clickable (jump back);
 * future steps are locked until reached. Lime = done, CTA-tone = current.
 */
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlowStep } from "../../state/useLaunch2Flow";

export interface StepMeta {
  step: FlowStep;
  title: string;
  subtitle: string;
}

export const STEP_META: StepMeta[] = [
  { step: 1, title: "Mode, strategy & objective", subtitle: "How to configure, which playbook, what for." },
  { step: 2, title: "Ad account & distribution", subtitle: "Where to launch and how to spread — 250-cap checked inline." },
  { step: 3, title: "Objective & targeting", subtitle: "Audience, budget per ad set, and the catalogue cascade for Sales." },
  { step: 4, title: "Creative & structure", subtitle: "Ad type, creatives, and the campaign structure — with a live budget." },
  { step: 5, title: "Review & launch", subtitle: "Verify the tree, clear pre-flight, then launch in batches." },
];

const LABELS = ["Strategy", "Distribution", "Targeting", "Creative", "Review"];

export function FlowHeader({
  step,
  planName,
  onJump,
}: {
  step: FlowStep;
  planName: string;
  /** Jump to a step (guarded by caller to only allow completed/current). */
  onJump: (s: FlowStep) => void;
}) {
  const current = STEP_META[step - 1];

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">New launch</h1>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              Step {step} of 5
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{planName}</p>
        </div>
      </div>

      {/* Segmented progress with clickable completed steps */}
      <div>
        <div className="flex items-center gap-1.5">
          {STEP_META.map(({ step: s }) => {
            const done = s < step;
            const isCurrent = s === step;
            const reachable = s <= step;
            return (
              <button
                key={s}
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onJump(s)}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${s}: ${LABELS[s - 1]}`}
                className={cn(
                  "group h-1.5 flex-1 overflow-hidden rounded-full transition-colors",
                  reachable ? "cursor-pointer" : "cursor-not-allowed",
                )}
                style={{
                  backgroundColor: done
                    ? "#8FB821"
                    : isCurrent
                      ? "#749519"
                      : "rgba(15,15,12,0.10)",
                }}
              />
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          {STEP_META.map(({ step: s }) => {
            const done = s < step;
            const isCurrent = s === step;
            return (
              <div key={s} className="flex flex-1 items-center gap-1">
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    done && "bg-primary text-primary-foreground",
                    isCurrent && "border border-foreground/30 text-foreground",
                    !done && !isCurrent && "border border-border text-muted-foreground/60",
                  )}
                >
                  {done ? <Check className="h-2.5 w-2.5" /> : s}
                </span>
                <span
                  className={cn(
                    "hidden truncate text-[11px] sm:inline",
                    isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {LABELS[s - 1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground">{current.title}</h2>
        <p className="text-sm text-muted-foreground">{current.subtitle}</p>
      </div>
    </div>
  );
}
