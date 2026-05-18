import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { brands } from "@/mocks/shared/brands";

interface TileProps {
  className?: string;
}

const TOTAL_STEPS = 7;

// Light heuristic computation. Real wiring later — for now ground on mocks.
function computeDoneCount(): number {
  let done = 0;
  if (brands.some((b) => (b.voice ?? "").length > 20)) done += 1;
  if (brands.some((b) => (b.colors ?? []).length >= 2)) done += 1;
  if (brands.some((b) => (b.usps ?? []).length >= 2)) done += 1;
  if (brands.some((b) => (b.competitors ?? []).length >= 1)) done += 1;
  // Steps 5-7: require deeper introspection across products/categories/generations.
  // Leave unticked for now so the strip stays surfaced. Spec allows hard-code = 4.
  return Math.min(done, 4);
}

interface NextStep {
  id: string;
  label: string;
  minutes: number;
  href: string;
}

export function ProfileCompletionStrip({ className }: TileProps) {
  const [hidden, setHidden] = useState(false);

  const doneCount = computeDoneCount();
  const pct = Math.round((doneCount / TOTAL_STEPS) * 100);

  // 90% rule
  if (doneCount >= 6 || hidden) return null;

  const firstBrandId = brands[0]?.id ?? "boat";

  const NEXT_STEPS: NextStep[] = [
    {
      id: "voice",
      label: "Add brand voice",
      minutes: 1,
      href: `/catalogue/brands/${firstBrandId}`,
    },
    {
      id: "competitors",
      label: "Pick competitors",
      minutes: 2,
      href: "/insights/competitors",
    },
    {
      id: "concept",
      label: "Save first concept",
      minutes: 5,
      href: "/iq/genie6/concepts",
    },
  ];

  return (
    <div
      className={cn(
        "w-full flex items-center gap-4 px-5 py-3 border-y border-border bg-card/60",
        className,
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
          Setup Progress
        </span>
        <span className="text-[11.5px] font-medium text-foreground whitespace-nowrap">
          {doneCount} of {TOTAL_STEPS} done
        </span>
        <div className="h-1.5 w-32 max-w-[160px] rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto">
        {NEXT_STEPS.map((step) => (
          <Link
            key={step.id}
            to={step.href}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 hover:border-primary/40 hover:bg-secondary/40 transition-colors whitespace-nowrap"
          >
            <span className="text-[11px] text-foreground">{step.label}</span>
            <span className="text-[10px] font-mono text-primary">
              {step.minutes}min
            </span>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label="Hide setup progress for now"
        className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[10px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors whitespace-nowrap"
      >
        <X className="h-3 w-3" />
        Hide for now
      </button>
    </div>
  );
}
