import { Wand2, Video, Telescope, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TileProps {
  className?: string;
}

type Mode = "GENIE" | "SAGE" | "INSIGHTS" | "CATALOGUE";

interface Event {
  id: string;
  mode: Mode;
  copy: string;
  time: string;
}

const MODE_ICON: Record<Mode, LucideIcon> = {
  GENIE: Wand2,
  SAGE: Video,
  INSIGHTS: Telescope,
  CATALOGUE: Building2,
};

const EVENTS: Event[] = [
  { id: "e1", mode: "GENIE",     copy: "Generated 4 UGC scripts for Boat",          time: "2h ago" },
  { id: "e2", mode: "SAGE",      copy: "Analyzed 15s Mamaearth hook",                time: "5h ago" },
  { id: "e3", mode: "INSIGHTS",  copy: "Pinned Sleepyhead competitor ad",            time: "yesterday" },
  { id: "e4", mode: "CATALOGUE", copy: "Added 'Pet Wellness' category",              time: "yesterday" },
  { id: "e5", mode: "GENIE",     copy: "Forged 10 variants of Boat hero ad",         time: "2 days ago" },
  { id: "e6", mode: "CATALOGUE", copy: "Updated Mamaearth brand voice",              time: "3 days ago" },
  { id: "e7", mode: "INSIGHTS",  copy: "Saved 2 hooks from competitor feed",         time: "3 days ago" },
  { id: "e8", mode: "SAGE",      copy: "Analyzed Boat earbuds TVC",                  time: "4 days ago" },
];

export function CrossModeActivityStrip({ className }: TileProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-0.5 px-5">
        <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-muted-foreground">
          Recent Activity
        </span>
        <p className="text-[11px] font-mono text-muted-foreground">
          Across all your AI work
        </p>
      </div>

      <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory px-5 pb-2">
        {EVENTS.map((event, idx) => {
          const Icon = MODE_ICON[event.mode];
          const isLatest = idx === 0;
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => console.log("activity event clicked", event.id)}
              className={cn(
                "shrink-0 snap-start w-[140px] h-[110px] rounded-xl border bg-card p-3 flex flex-col justify-between text-left transition-colors hover:bg-secondary/40",
                isLatest ? "border-primary/60" : "border-border",
              )}
            >
              <div className="inline-flex items-center gap-1 self-start rounded-md bg-secondary/60 px-1.5 py-0.5">
                <Icon className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  {event.mode}
                </span>
              </div>
              <p className="text-[11.5px] text-foreground leading-snug line-clamp-2">
                {event.copy}
              </p>
              <span className="text-[10px] font-mono text-muted-foreground">
                {event.time}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
