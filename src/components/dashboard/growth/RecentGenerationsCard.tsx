import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * RecentGenerationsCard — standalone compact card mirroring
 * NewlyFetchedAdsCard (Maalik A-12.199: "recent generations ka hi ek card
 * like newly fetched"). Pulled OUT of the GenieCard so the two compact
 * list cards (fresh competitor ads + recent generations) pair in the
 * dashboard's right column.
 *
 * Each row: status icon + title + mode tag + relative time. Header carries
 * the count + a link into Studio. Status-led, no thumbnails — same density
 * as the newly-fetched card.
 */

type GenStatus = "in-progress" | "success" | "queued";

const RECENT: Array<{ id: string; title: string; mode: string; status: GenStatus; time: string }> = [
  { id: "g-1", title: "Festive Diwali bundle — gifting angle", mode: "Brand Ad", status: "in-progress", time: "now" },
  { id: "g-2", title: "Mamaearth Vitamin C — UGC testimonial", mode: "UGC Video", status: "success", time: "12 min" },
  { id: "g-3", title: "Noise Smartwatch — discount push", mode: "Adcopy", status: "success", time: "1 h" },
  { id: "g-4", title: "Boat earbuds — comparison angle", mode: "Variations", status: "success", time: "2 h" },
  { id: "g-5", title: "Sleepyhead — winter sleep angle", mode: "Product Ad", status: "queued", time: "3 h" },
];

const TODAY_COUNT = 47;

const STATUS_META: Record<GenStatus, { icon: LucideIcon; cls: string }> = {
  "in-progress": { icon: Loader2, cls: "text-primary" },
  success: { icon: CheckCircle2, cls: "text-emerald-600 dark:text-emerald-500" },
  queued: { icon: Clock, cls: "text-muted-foreground" },
};

export function RecentGenerationsCard() {
  const navigate = useNavigate();

  return (
    <section
      data-fabads-dash-card="recent-generations"
      aria-label="Recent generations"
      className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="text-[13px] font-semibold tracking-tight text-foreground">
            Recent generations
          </h3>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {TODAY_COUNT} today
          </span>
        </div>
        <Link
          to="/iq/genie6/studio-alpha/configure?queue=v3"
          className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          Studio
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      <ul className="flex flex-col">
        {RECENT.map((g) => {
          const meta = STATUS_META[g.status];
          const StatusIcon = meta.icon;
          return (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => navigate("/iq/genie6/library")}
                className="group flex w-full items-center gap-2.5 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-muted/40"
              >
                <StatusIcon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    meta.cls,
                    g.status === "in-progress" && "animate-spin",
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-[12px] text-foreground">
                  {g.title}
                </span>
                <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                  {g.mode}
                </span>
                <span className="shrink-0 font-mono text-[9.5px] tabular-nums text-muted-foreground/70">
                  {g.time}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
