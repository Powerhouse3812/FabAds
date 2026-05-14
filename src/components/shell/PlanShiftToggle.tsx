import { useState } from "react";
import { Boxes, Check, Sparkles, Layers } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { usePlan, type Plan } from "@/contexts/PlanContext";

const PLAN_OPTIONS: {
  value: Plan;
  label: string;
  description: string;
  icon: typeof Boxes;
}[] = [
  {
    value: "full",
    label: "Full plan",
    description: "Every module — including Reports, Launch, and Automation.",
    icon: Boxes,
  },
  {
    value: "ai",
    label: "AI plan",
    description:
      "AI-generation focus — drops Reports, Launch, Automation.",
    icon: Sparkles,
  },
];

/**
 * Plan-shift toggle. Lives in the nav-rail footer above the
 * NotificationBell. Click → opens a popover with two radio options
 * ("Full plan" / "AI plan"). Picking one closes the popover and
 * immediately re-filters the rail modules via PlanContext.
 *
 * The plan choice is in-memory only (resets on refresh) per Maalik.
 *
 * Icon: Layers — represents tiered / layered module sets.
 */
export function PlanShiftToggle() {
  const { plan, setPlan } = usePlan();
  const [open, setOpen] = useState(false);

  const current = PLAN_OPTIONS.find((p) => p.value === plan) ?? PLAN_OPTIONS[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Switch plan — current: ${current.label}`}
          title={`Plan: ${current.label}`}
          className={cn(
            "inline-flex items-center justify-center rounded-md text-zinc-300",
            "hover:bg-white/[0.06] hover:text-white transition-colors",
            "relative",
          )}
        >
          <Layers className="h-4 w-4" />
          {plan === "ai" && (
            <span
              className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary"
              aria-hidden
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={12}
        className="w-[260px] p-1.5"
      >
        <div className="px-2.5 py-2 border-b border-border/60">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Switch plan
          </p>
        </div>
        <div className="py-1 space-y-0.5">
          {PLAN_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = plan === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setPlan(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left rounded-md px-2.5 py-2 flex items-start gap-2.5",
                  "transition-colors",
                  isActive
                    ? "bg-primary/10"
                    : "hover:bg-muted/60",
                )}
                role="menuitemradio"
                aria-checked={isActive}
              >
                <div
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-md shrink-0",
                    isActive ? "bg-primary/20 text-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-foreground">
                      {opt.label}
                    </span>
                    {isActive && (
                      <Check className="h-3 w-3 text-primary" aria-hidden />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
