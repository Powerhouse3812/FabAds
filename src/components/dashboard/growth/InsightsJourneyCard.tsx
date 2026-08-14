import { useNavigate, Link } from "react-router-dom";
import {
  Check,
  Circle,
  Rss,
  Star,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useInsightsSetupState,
  markExtensionInstalled,
  enableWeeklyDigest,
} from "@/lib/insights-setup";
import { useInsightsDigest, type InsightsDigestRow } from "@/lib/insights-digest";

/**
 * InsightsJourneyCard — the state-machine replacement for the static
 * IndustryInsightsCard on the main Dashboard (Zone 3.5). Same card chrome
 * (rounded-2xl border + p-4 + gap-4, 14px semibold header) so the eventual
 * swap in Dashboard.tsx is visually seamless — only the body changes shape
 * as the user progresses through Insights setup.
 *
 * Two states, driven entirely by useInsightsSetupState()/useInsightsDigest():
 *   1. CHECKLIST      — !complete. 4-item setup checklist + progress bar,
 *                        same genre as CatalogueFooterCard's checklist card.
 *                        The Chrome extension and weekly digest are two of
 *                        the four rows here — NOT a separate post-completion
 *                        stage (that gating was reversed; extensionInstalled
 *                        is now just a checklist input like any other).
 *   2. DIGEST TEASER   — complete. Top rows from useInsightsDigest(3) +
 *                        "Open Insights".
 *
 * Mock-first: no new Supabase reads — useInsightsSetupState/useInsightsDigest
 * already read the existing use-insight-* hooks read-only; the only writes
 * here are the extension/digest checklist markers.
 */

// TODO: keep in sync with src/components/shell/InsightsExtensionCard.tsx —
// same placeholder Chrome Web Store path until the extension is published.
const EXTENSION_URL = "https://chromewebstore.google.com/detail/fabads-insights";

const DIGEST_ICONS: Record<InsightsDigestRow["kind"], LucideIcon> = {
  competitor: Users,
  trend: TrendingUp,
  feed: Rss,
  "top-ad": Star,
};

type ChecklistRow =
  | { key: string; done: boolean; label: string; ctaLabel: string; kind: "navigate"; to: string }
  | { key: string; done: boolean; label: string; ctaLabel: string; kind: "extension" }
  | { key: string; done: boolean; label: string; ctaLabel: string; kind: "digest" };

export function InsightsJourneyCard() {
  const navigate = useNavigate();
  const setup = useInsightsSetupState();
  const { rows: digestRows, loading: digestLoading } = useInsightsDigest(3);

  return (
    <section
      data-fabads-dash-widget="industry-insights-journey"
      aria-label="Industry Insights"
      className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4"
    >
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
          Industry Insights
        </h3>
        {!setup.loading && !setup.complete && (
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="font-semibold text-foreground">{setup.doneCount}</span> of{" "}
            {setup.total} ready
          </span>
        )}
      </header>

      {setup.loading ? (
        <ChecklistSkeleton />
      ) : setup.complete ? (
        <DigestTeaserBody rows={digestRows} loading={digestLoading} />
      ) : (
        <ChecklistBody state={setup} navigate={navigate} />
      )}
    </section>
  );
}

// ── State 1: checklist ──────────────────────────────────────────────
// Four rows: pick industries / install extension / track a competitor /
// turn on the weekly digest. Extension + digest resolve in place (no
// navigation); the other two jump to the surface that clears them.

function ChecklistBody({
  state,
  navigate,
}: {
  state: ReturnType<typeof useInsightsSetupState>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const progressPct = Math.round((state.doneCount / state.total) * 100);

  const rows: ChecklistRow[] = [
    {
      key: "prefs",
      done: state.prefsSet,
      label: "Follow your industries",
      ctaLabel: "Pick",
      kind: "navigate",
      to: "/insights-v2/feed?modal=prefs",
    },
    {
      key: "extension",
      done: state.extensionInstalled,
      label: "Install the Chrome extension",
      ctaLabel: "Add",
      kind: "extension",
    },
    {
      key: "competitor",
      done: state.competitorAdded,
      label: "Track your first competitor",
      ctaLabel: "Track",
      kind: "navigate",
      to: "/insights/competitors?modal=add",
    },
    {
      key: "digest",
      done: state.digestEnabled,
      label: "Turn on the weekly digest",
      ctaLabel: "Turn on",
      kind: "digest",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div
        className="h-[3px] w-full overflow-hidden rounded-full bg-foreground/10"
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Industry Insights setup progress"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <li key={row.key} className="flex h-[26px] items-center gap-2 text-[12.5px]">
            {row.done ? (
              <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} aria-hidden />
              </span>
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-foreground/30" strokeWidth={1.75} aria-hidden />
            )}
            <span
              className={cn(
                "min-w-0 flex-1 truncate",
                row.done ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {row.label}
            </span>
            {!row.done && row.kind === "extension" && (
              <a
                href={EXTENSION_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={markExtensionInstalled}
                aria-label={`${row.ctaLabel} — ${row.label}`}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1 rounded-sm px-2 py-[3px]",
                  "bg-primary text-[11px] font-medium tracking-tight text-primary-foreground",
                  "transition-colors duration-150 hover:bg-primary/90",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                )}
              >
                {row.ctaLabel}
              </a>
            )}
            {!row.done && row.kind === "digest" && (
              <button
                type="button"
                onClick={enableWeeklyDigest}
                aria-label={`${row.ctaLabel} — ${row.label}`}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1 rounded-sm px-2 py-[3px]",
                  "bg-primary text-[11px] font-medium tracking-tight text-primary-foreground",
                  "transition-colors duration-150 hover:bg-primary/90",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                )}
              >
                {row.ctaLabel}
              </button>
            )}
            {!row.done && row.kind === "navigate" && (
              <button
                type="button"
                onClick={() => navigate(row.to)}
                // The visible label is a sibling span, not the button's own
                // text — spell the task out for screen readers so "Pick"
                // doesn't announce naked.
                aria-label={`${row.ctaLabel} — ${row.label}`}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1 rounded-sm px-2 py-[3px]",
                  "bg-primary text-[11px] font-medium tracking-tight text-primary-foreground",
                  "transition-colors duration-150 hover:bg-primary/90",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                )}
              >
                {row.ctaLabel}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChecklistSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-[3px] w-full rounded-full" />
      <ul className="flex flex-col gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="flex h-[26px] items-center gap-2">
            <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
            <Skeleton className="h-3 flex-1 rounded" />
            <Skeleton className="h-5 w-10 shrink-0 rounded-sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── State 2: digest teaser ──────────────────────────────────────────

function DigestTeaserBody({
  rows,
  loading,
}: {
  rows: InsightsDigestRow[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex h-[22px] items-center gap-2">
              <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-full" />
              <Skeleton className="h-3 flex-1 rounded" />
              <Skeleton className="h-3 w-10 shrink-0 rounded" />
            </li>
          ))}
        </ul>
        <Skeleton className="h-3 w-24 rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => {
            const Icon = DIGEST_ICONS[row.kind];
            return (
              <li key={row.id} className="flex items-center gap-2 text-[12.5px]">
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-foreground">{row.title}</span>
                <Link
                  to={row.to}
                  className="shrink-0 text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {row.actionLabel}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[12px] text-muted-foreground">No new activity in your feed yet.</p>
      )}

      <Link
        to="/insights/overview"
        className={cn(
          "inline-flex w-fit items-center gap-1 border-t border-border/60 pt-3",
          "text-[11px] font-medium text-foreground/80 transition-colors hover:text-foreground",
        )}
      >
        <span>Open Insights</span>
        <span aria-hidden className="inline-block">
          →
        </span>
      </Link>
    </div>
  );
}
