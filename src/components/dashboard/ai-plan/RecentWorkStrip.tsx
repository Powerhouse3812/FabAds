import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentWorkStripProps {
  className?: string;
}

type GenStatus = "queued" | "in-progress" | "success" | "failed";

interface GenerationRow {
  id: string;
  title: string;
  mode: string;
  status: GenStatus;
  timestamp: string;
}

/**
 * RecentWorkStrip — minimal, status-led list of recent generations.
 *
 * Linear-style issue list, not a creative reel. Each row is one generation
 * in flight or recently completed, anchored by a tight status pill
 * (Queued / In progress / Success / Failed). No big thumbnails — the row
 * itself is the surface. Click → opens the item in the shared library.
 *
 * Maalik: "Visually too rich. Minimal, status-led — list jaisa, reel nahi."
 */
export function RecentWorkStrip({ className }: RecentWorkStripProps) {
  const navigate = useNavigate();

  const RECENT_WORK: GenerationRow[] = [
    {
      id: "g-1",
      title: "Festive Diwali bundle — gifting angle",
      mode: "Brand Ad",
      status: "in-progress",
      timestamp: "now",
    },
    {
      id: "g-2",
      title: "Mamaearth Vitamin C — UGC testimonial",
      mode: "UGC Video",
      status: "success",
      timestamp: "12 min ago",
    },
    {
      id: "g-3",
      title: "Noise Smartwatch — discount push",
      mode: "Adcopy",
      status: "success",
      timestamp: "1 h ago",
    },
    {
      id: "g-4",
      title: "Boat Stone speaker — image-to-video",
      mode: "Image-to-Ad",
      status: "failed",
      timestamp: "2 h ago",
    },
    {
      id: "g-5",
      title: "Sleepyhead — winter sleep angle",
      mode: "Variant",
      status: "queued",
      timestamp: "3 h ago",
    },
  ];

  const TOTAL_COUNT = 47;

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card",
        className,
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
            Recent work
          </p>
          <span className="inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[10px] tabular-nums text-foreground/70">
            {TOTAL_COUNT}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate("/iq/genie6/library")}
          className="inline-flex items-center gap-1 text-[11.5px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </button>
      </header>

      {/* Status row list */}
      <ul className="divide-y divide-border/60">
        {RECENT_WORK.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              onClick={() =>
                navigate(`/iq/genie6/library?gen=${g.id}`)
              }
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors cursor-pointer"
            >
              {/* Status pill */}
              <StatusPill status={g.status} />

              {/* Title */}
              <span className="flex-1 truncate text-[13px] text-foreground">
                {g.title}
              </span>

              {/* Mode tag */}
              <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/55 shrink-0">
                {g.mode}
              </span>

              {/* Timestamp */}
              <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground text-right shrink-0 w-[68px]">
                {g.timestamp}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------- */
/* Status pill — 4 variants                                        */
/* -------------------------------------------------------------- */

function StatusPill({ status }: { status: GenStatus }) {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider font-semibold shrink-0";

  if (status === "queued") {
    return (
      <span
        className={cn(
          base,
          "bg-muted text-foreground/55 border border-border/60",
        )}
      >
        <Clock className="h-2.5 w-2.5" />
        Queued
      </span>
    );
  }

  if (status === "in-progress") {
    return (
      <span
        className={cn(
          base,
          "bg-primary/10 border border-primary/40 text-foreground/85",
        )}
      >
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        In progress
      </span>
    );
  }

  if (status === "success") {
    return (
      <span
        className={cn(
          base,
          "bg-[hsl(var(--success-text))]/10 border border-[hsl(var(--success-text))]/30 text-[hsl(var(--success-text))]",
        )}
      >
        <CheckCircle2 className="h-2.5 w-2.5" />
        Success
      </span>
    );
  }

  // failed
  return (
    <span
      className={cn(
        base,
        "bg-destructive/10 border border-destructive/30 text-destructive",
      )}
    >
      <AlertCircle className="h-2.5 w-2.5" />
      Failed
    </span>
  );
}
