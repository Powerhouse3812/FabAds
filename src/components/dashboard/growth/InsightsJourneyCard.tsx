import { useNavigate, Link } from "react-router-dom";
import {
  Check,
  Circle,
  Chrome,
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
  dismissExtensionNudge,
} from "@/lib/insights-setup";
import { useInsightsDigest, type InsightsDigestRow } from "@/lib/insights-digest";

/**
 * InsightsJourneyCard — the state-machine replacement for the static
 * IndustryInsightsCard on the main Dashboard (Zone 3.5). Same card chrome
 * (rounded-2xl border + p-4 + gap-4, 14px semibold header) so the eventual
 * swap in Dashboard.tsx is visually seamless — only the body changes shape
 * as the user progresses through Insights setup.
 *
 * Three states, driven entirely by useInsightsSetupState()/useInsightsDigest():
 *   1. CHECKLIST      — !complete. 3-item setup checklist + progress bar,
 *                        same genre as CatalogueFooterCard's checklist card.
 *   2. EXTENSION NUDGE — complete && !extensionInstalled && !extensionDismissed.
 *                        Mirrors InsightsExtensionCard's copy/link/visual
 *                        language (browser-mock illustration, "Add to
 *                        Chrome" CTA), scaled for a dashboard grid slot.
 *   3. DIGEST TEASER   — complete && (extensionInstalled || extensionDismissed).
 *                        Top rows from useInsightsDigest(3) + "Open Insights".
 *
 * Mock-first: no new Supabase reads — useInsightsSetupState/useInsightsDigest
 * already read the existing use-insight-* hooks read-only; the only writes
 * here are the two extension-nudge localStorage markers.
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

type ChecklistRow = {
  key: string;
  done: boolean;
  label: string;
  ctaLabel: string;
  to: string;
};

export function InsightsJourneyCard() {
  const navigate = useNavigate();
  const setup = useInsightsSetupState();
  const { rows: digestRows, loading: digestLoading } = useInsightsDigest(3);

  const showExtensionNudge =
    setup.complete && !setup.extensionInstalled && !setup.extensionDismissed;
  const showDigest =
    setup.complete && (setup.extensionInstalled || setup.extensionDismissed);

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
      ) : showExtensionNudge ? (
        <ExtensionNudgeBody />
      ) : showDigest ? (
        <DigestTeaserBody rows={digestRows} loading={digestLoading} />
      ) : (
        <ChecklistBody state={setup} navigate={navigate} />
      )}
    </section>
  );
}

// ── State 1: checklist ──────────────────────────────────────────────

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
      label: "Pick your industries",
      ctaLabel: "Pick",
      to: "/insights-v2/feed?modal=prefs",
    },
    {
      key: "competitor",
      done: state.competitorAdded,
      label: "Track a competitor",
      ctaLabel: "Track",
      to: "/insights/competitors?modal=add",
    },
    {
      key: "ad",
      done: state.adSaved,
      label: "Save an ad to a board",
      ctaLabel: "Save",
      to: "/insights-v2/feed",
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
            {!row.done && (
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
        {Array.from({ length: 3 }).map((_, i) => (
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

// ── State 2: extension nudge ────────────────────────────────────────
// Copy/link/visual language mirrors src/components/shell/InsightsExtensionCard.tsx
// (browser-mock illustration, "Clip any competitor ad..." pitch, lime CTA),
// scaled down to sit inside a dashboard grid slot rather than a sidebar footer.

function ExtensionNudgeMock() {
  return (
    <svg
      viewBox="0 0 168 74"
      className="w-full"
      role="img"
      aria-label="A browser window with the FabAds extension clipping a competitor ad to a board"
      fill="none"
    >
      <rect x="1" y="1" width="166" height="72" rx="7" className="stroke-current text-foreground/15" strokeWidth="1" />
      <path d="M1 8a7 7 0 0 1 7-7h152a7 7 0 0 1 7 7v11H1V8Z" className="fill-current text-foreground/[0.04]" />
      <line x1="1" y1="19" x2="167" y2="19" className="stroke-current text-foreground/10" strokeWidth="1" />
      <circle cx="11" cy="10" r="2" className="fill-current text-foreground/25" />
      <circle cx="19" cy="10" r="2" className="fill-current text-foreground/25" />
      <circle cx="27" cy="10" r="2" className="fill-current text-foreground/25" />
      <rect x="38" y="6" width="104" height="8" rx="4" className="fill-current text-foreground/[0.06]" />
      <rect x="148" y="5" width="11" height="11" rx="2.5" className="fill-current text-primary" />
      <path d="M153.5 8v5M151 10.5h5" className="stroke-current text-primary-foreground" strokeWidth="1.25" strokeLinecap="round" />
      <rect x="14" y="28" width="58" height="38" rx="4" className="fill-current text-foreground/[0.05]" />
      <rect x="20" y="34" width="46" height="16" rx="2" className="fill-current text-foreground/[0.06]" />
      <rect x="20" y="53" width="38" height="3" rx="1.5" className="fill-current text-foreground/10" />
      <path d="M126 30C138 23 148 21 151 16" className="stroke-current text-primary/45" strokeWidth="1" strokeLinecap="round" strokeDasharray="1.5 3" />
      <rect x="86" y="26" width="58" height="38" rx="4" className="fill-current text-foreground/[0.04] stroke-[hsl(var(--primary))]" strokeWidth="1.25" />
      <rect x="92" y="32" width="46" height="16" rx="2" className="fill-current text-primary/15" />
      <rect x="92" y="51" width="38" height="3" rx="1.5" className="fill-current text-foreground/15" />
      <path d="M131 26h9v12l-4.5-3.4L131 38V26Z" className="fill-current text-primary" />
    </svg>
  );
}

function ExtensionNudgeBody() {
  const handleAddToChrome = () => {
    markExtensionInstalled();
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-1.5">
        <Chrome className="h-3.5 w-3.5 shrink-0 text-foreground/55" strokeWidth={1.75} aria-hidden />
        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-foreground/55">
          Browser Extension
        </span>
      </div>

      <ExtensionNudgeMock />

      <p className="text-[11px] leading-snug text-foreground/70">
        Clip any competitor ad straight to your boards.
      </p>

      <div className="flex items-center gap-2">
        <a
          href={EXTENSION_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleAddToChrome}
          className={cn(
            "inline-flex w-fit items-center gap-1 rounded-sm px-2 py-[4px]",
            "bg-primary text-[11px] font-medium tracking-tight text-primary-foreground",
            "transition-colors duration-150 hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          )}
        >
          <span>Add to Chrome</span>
          <span aria-hidden className="inline-block transition-transform duration-150 group-hover:translate-x-[1px]">
            →
          </span>
        </a>
        <button
          type="button"
          onClick={dismissExtensionNudge}
          className={cn(
            "inline-flex w-fit items-center rounded-sm px-2 py-[4px]",
            "text-[11px] font-medium text-muted-foreground",
            "transition-colors duration-150 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          )}
        >
          Later
        </button>
      </div>
    </div>
  );
}

// ── State 3: digest teaser ──────────────────────────────────────────

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
