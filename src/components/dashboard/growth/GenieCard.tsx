import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Target,
  Video,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCredits } from "@/hooks/use-credits";
import { InlineMetricRow, type InlineMetric } from "./InlineMetricRow";

/**
 * GenieCard — self-contained Genie module card for the Growth dashboard
 * (A-12.198). Merges the Genie numeric analytics WITH richer content
 * pulled from the AI-plan dashboard, per Maalik:
 *
 *   Header        — Genie + open-library link
 *   Metrics row   — 5 inline KPIs (InlineMetricRow), mirrors the II card
 *   Credit usage  — compact bar from useCredits() (single source of truth)
 *   Generate      — 6 mode chips → Studio Alpha preset
 *   Recent work   — 3 generations with status pills
 *   Recently synced — brand/product chips
 *
 * Sections separated by hairlines, each compact. Sits in the left half of
 * the dashboard's 2-col Genie | Industry-Insights row.
 */

const GENIE_METRICS: InlineMetric[] = [
  { label: "Total generations", value: "15,004", delta: { value: 4.5 } },
  { label: "Brands synced", value: "18" },
  { label: "Products synced", value: "142" },
  { label: "Categories", value: "12" },
  { label: "On-brand score", value: "87" },
];

const MODES: Array<{ id: string; label: string; icon: LucideIcon; skipGate?: boolean }> = [
  { id: "brand-ad", label: "Brand Ad", icon: Sparkles },
  { id: "product-ad", label: "Product Ad", icon: ShoppingBag },
  { id: "affiliate-ad", label: "Affiliate", icon: Target },
  { id: "product-shoot", label: "Product Shoot", icon: Camera },
  { id: "ugc-video", label: "UGC Video", icon: Video },
  { id: "variation", label: "Variations", icon: RefreshCw, skipGate: true },
];

type GenStatus = "in-progress" | "success" | "queued";
const RECENT_WORK: Array<{ id: string; title: string; mode: string; status: GenStatus; time: string }> = [
  { id: "g-1", title: "Festive Diwali bundle — gifting angle", mode: "Brand Ad", status: "in-progress", time: "now" },
  { id: "g-2", title: "Mamaearth Vitamin C — UGC testimonial", mode: "UGC Video", status: "success", time: "12 min" },
  { id: "g-3", title: "Noise Smartwatch — discount push", mode: "Adcopy", status: "success", time: "1 h" },
];

const RECENTLY_SYNCED: Array<{ name: string; type: "brand" | "product" | "category" }> = [
  { name: "Mamaearth", type: "brand" },
  { name: "Onion Shampoo", type: "product" },
  { name: "Skincare", type: "category" },
  { name: "Noise", type: "brand" },
];

const STATUS_META: Record<GenStatus, { icon: LucideIcon; cls: string; label: string }> = {
  "in-progress": { icon: Loader2, cls: "text-primary", label: "In progress" },
  success: { icon: CheckCircle2, cls: "text-emerald-600 dark:text-emerald-500", label: "Success" },
  queued: { icon: Clock, cls: "text-muted-foreground", label: "Queued" },
};

const TYPE_DOT: Record<"brand" | "product" | "category", string> = {
  brand: "bg-primary",
  product: "bg-sky-500",
  category: "bg-amber-500",
};

export function GenieCard() {
  const navigate = useNavigate();
  const { used, limit } = useCredits();
  const remaining = Math.max(limit - used, 0);
  const pct = Math.min(100, Math.round((used / limit) * 100));

  return (
    <section
      data-fabads-dash-card="genie"
      aria-label="Genie"
      className="flex flex-col gap-3.5 rounded-2xl border border-border/60 bg-card p-4"
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
            Genie
          </h3>
        </div>
        <Link
          to="/iq/genie6/library"
          className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          Open library
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      {/* Metrics row */}
      <InlineMetricRow metrics={GENIE_METRICS} />

      {/* Credit usage */}
      <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Credit usage
          </span>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground">{used.toLocaleString()}</span>
            {" / "}
            {limit.toLocaleString()} · {remaining.toLocaleString()} left
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.08]">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${pct}%` }}
            aria-hidden
          />
        </div>
      </div>

      {/* Generate — mode chips */}
      <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Generate · pick a mode
          </span>
          <Link
            to="/iq/genie6/studio-alpha"
            className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            View all →
          </Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => {
            const Icon = m.icon;
            const href = `/iq/genie6/studio-alpha?mode=${m.id}${m.skipGate ? "&skipGate=1" : ""}`;
            return (
              <Link
                key={m.id}
                to={href}
                className={cn(
                  "group inline-flex h-7 items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5",
                  "text-[11.5px] font-medium text-foreground transition-all",
                  "hover:-translate-y-px hover:border-primary/40 hover:bg-primary/[0.04]",
                )}
              >
                <Icon className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-foreground" strokeWidth={1.75} aria-hidden />
                <span>{m.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent work */}
      <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Recent work
          </span>
          <Link
            to="/iq/genie6/studio-alpha/configure?queue=v3"
            className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            Go to studio →
          </Link>
        </div>
        <ul className="flex flex-col">
          {RECENT_WORK.map((w) => {
            const meta = STATUS_META[w.status];
            const StatusIcon = meta.icon;
            return (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => navigate("/iq/genie6/library")}
                  className="group flex w-full items-center gap-2.5 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-muted/40"
                >
                  <StatusIcon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      meta.cls,
                      w.status === "in-progress" && "animate-spin",
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-foreground">
                    {w.title}
                  </span>
                  <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                    {w.mode}
                  </span>
                  <span className="shrink-0 font-mono text-[9.5px] tabular-nums text-muted-foreground/70">
                    {w.time}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Recently synced */}
      <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
        <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Recently synced
        </span>
        <div className="flex flex-wrap gap-1.5">
          {RECENTLY_SYNCED.map((s) => (
            <Link
              key={s.name}
              to="/catalogue/brands"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2 py-0.5",
                "text-[11px] text-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground",
              )}
            >
              <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TYPE_DOT[s.type])} />
              {s.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
