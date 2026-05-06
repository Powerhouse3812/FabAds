import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  step: 1 | 2 | 3 | 4;
}

const STEPS: { num: number; label: string }[] = [
  { num: 1, label: "Setup" },
  { num: 2, label: "Product" },
  { num: 3, label: "Create" },
];

export function ProgressIndicator({ step }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-3 border-b border-border bg-background/60 px-6 py-3 text-sm backdrop-blur">
      {STEPS.map((s, i) => {
        const isDone = step > s.num;
        const isCurrent = step === s.num;
        return (
          <div key={s.num} className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center gap-1.5",
                isDone && "text-foreground",
                isCurrent && "font-bold text-primary",
                !isDone && !isCurrent && "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                  isDone && "bg-primary/15 text-primary",
                  isCurrent && "bg-primary text-primary-foreground",
                  !isDone && !isCurrent && "bg-muted text-muted-foreground",
                )}
              >
                {isDone ? "✓" : s.num}
              </span>
              <span>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="text-muted-foreground/50">|</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
