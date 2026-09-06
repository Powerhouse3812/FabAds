import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Coins, Lock, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import { CREDITS_LIMIT, CREDITS_REMAINING, formatCredits } from "../lib/credits";
import type { FlowModule, FlowModuleKey, FlowSourceRef } from "./flowTypes";
import { FLOW_MODULES, actionsForModule } from "./data/flowRegistry";
import { sourcesForModule } from "./data/flowSources";
import { resolveIcon } from "./icons";
import { FlowCardSkeleton, FlowPartialNote, FlowZeroNote } from "./FlowStateNotes";

/**
 * OtherFlows — the Other Flows module list (Genie 2.0 §7).
 *
 * "Opening it shows a list of source modules." Industry Insights and Video
 * Sage are called out in §2 as tightly coupled to Genie — they get a bigger,
 * richer "featured" treatment instead of a badge, which also keeps the page
 * from becoming the banned "3 equal-weight cards in a row" pattern: featured
 * (2, large) → live (5, medium) → coming soon (4, dense rows) are three
 * visibly different weights, not one repeated shape.
 */
const FEATURED_KEYS: FlowModuleKey[] = ["industry-insights", "video-sage"];

/** §7's four "Coming soon" rows always state WHY — never a bare grey card. */
const COMING_SOON_REASON: Partial<Record<FlowModuleKey, string>> = {
  folders: "Bulk folder sends aren't wired yet — open a single asset in Creative Library instead.",
  // No spec section numbers in product copy — a user reading "(§19)" learns
  // nothing. (For the record: §19 puts Automated workflow in V2, sending no
  // action to Genie for now.)
  "automated-workflow": "Automated workflows don't hand anything to Genie yet — they're next release.",
  rrm: "RRM's handoff into Genie is still being scoped.",
  copilot: "Co-pilot's handoff into Genie is still being designed.",
};

type DataState = "populated" | "partial" | "zero-data";

function moduleDataState(module: FlowModule, sources: FlowSourceRef[]): DataState {
  if (sources.length === 0) return "zero-data";
  const needsAnalysis = actionsForModule(module.key).some((a) => a.requiresAnalysis);
  if (needsAnalysis && sources.every((s) => !s.analysed)) return "partial";
  return "populated";
}

export function OtherFlows() {
  const [searchParams] = useSearchParams();
  const forceLoading = searchParams.get("loading") === "1";
  const forceEmpty = searchParams.get("empty") === "1";

  const sourcesByModule = useMemo(() => {
    const map = new Map<FlowModuleKey, FlowSourceRef[]>();
    for (const m of FLOW_MODULES) {
      map.set(m.key, forceEmpty ? [] : sourcesForModule(m.key));
    }
    return map;
  }, [forceEmpty]);

  const live = FLOW_MODULES.filter((m) => m.state === "live");
  const comingSoon = FLOW_MODULES.filter((m) => m.state === "coming-soon");
  const featured = live.filter((m) => FEATURED_KEYS.includes(m.key));
  const standard = live.filter((m) => !FEATURED_KEYS.includes(m.key));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pt-10 pb-16">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            <Workflow className="h-3 w-3" />
            Other Flows
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Bring work into Genie
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Every module that can hand Genie a reference, a script, or a trend lives here.
            Pick a module, pick an action, pick what it&apos;s based on.
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5">
          <Coins className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground">
            {formatCredits(CREDITS_REMAINING)}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            / {formatCredits(CREDITS_LIMIT)} credits
          </span>
        </div>
      </header>

      {forceLoading ? (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FlowCardSkeleton tall />
            <FlowCardSkeleton tall />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <FlowCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : FLOW_MODULES.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
          <p className="text-sm font-semibold text-foreground">No source modules registered yet</p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted-foreground">
            Other Flows lists every module that can send work into Genie. Nothing is wired up on
            this build yet — check back once the module registry ships.
          </p>
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {featured.map((m) => (
                <FeaturedModuleCard
                  key={m.key}
                  module={m}
                  sources={sourcesByModule.get(m.key) ?? []}
                />
              ))}
            </section>
          )}

          {standard.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                More live modules
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {standard.map((m) => (
                  <StandardModuleCard
                    key={m.key}
                    module={m}
                    sources={sourcesByModule.get(m.key) ?? []}
                  />
                ))}
              </div>
            </section>
          )}

          {comingSoon.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Coming soon
              </h2>
              <div
                role="list"
                className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card/40"
              >
                {comingSoon.map((m) => (
                  <ComingSoonRow key={m.key} module={m} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  Featured card — Industry Insights + Video Sage (§2). Bigger
 *  chip, an explicit "tightly coupled" eyebrow, evidence lines.
 * ────────────────────────────────────────────────────────── */
function FeaturedModuleCard({ module, sources }: { module: FlowModule; sources: FlowSourceRef[] }) {
  const Icon = resolveIcon(module.icon);
  const state = moduleDataState(module, sources);
  const actionCount = actionsForModule(module.key).length;
  const evidence = sources.slice(0, 2);

  return (
    <Link
      to={`/iq/genie6/flows/${module.key}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
          Tightly coupled with Genie
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="truncate text-base font-bold text-foreground">{module.label}</h3>
        <p className="line-clamp-2 text-[13px] text-muted-foreground">{module.desc}</p>
      </div>

      <div className="mt-1 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground">
          {actionCount} action{actionCount === 1 ? "" : "s"}
        </span>
      </div>

      {state === "zero-data" && (
        <FlowZeroNote ctaLabel={`Go to ${module.label}`} to={module.modulePath} />
      )}
      {state === "partial" && (
        <FlowPartialNote
          count={sources.length}
          label={module.label}
          to={module.modulePath}
        />
      )}
      {state === "populated" && (
        <ul className="space-y-1 border-t border-border/60 pt-2.5">
          {evidence.map((s) => (
            <li key={s.id} className="truncate text-[12px] text-muted-foreground">
              &ldquo;{s.title}&rdquo;
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  Standard live-module card — medium weight, one evidence line.
 * ────────────────────────────────────────────────────────── */
function StandardModuleCard({ module, sources }: { module: FlowModule; sources: FlowSourceRef[] }) {
  const Icon = resolveIcon(module.icon);
  const state = moduleDataState(module, sources);
  const actionCount = actionsForModule(module.key).length;
  const top = sources[0];

  return (
    <Link
      to={`/iq/genie6/flows/${module.key}`}
      className="group flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-foreground">{module.label}</p>
          <p className="line-clamp-2 text-[11px] text-muted-foreground">{module.desc}</p>
        </div>
        <span className="shrink-0 whitespace-nowrap font-mono text-[10px] font-semibold text-muted-foreground">
          {actionCount} act.
        </span>
      </div>

      {state === "zero-data" && (
        <FlowZeroNote ctaLabel={`Go to ${module.label}`} to={module.modulePath} className="py-1.5" />
      )}
      {state === "partial" && (
        <FlowPartialNote count={sources.length} label={module.label} to={module.modulePath} className="py-1.5" />
      )}
      {state === "populated" && top && (
        <p className="truncate border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
          &ldquo;{top.title}&rdquo;
        </p>
      )}
    </Link>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  Coming-soon row — dense, non-interactive, reason stated.
 * ────────────────────────────────────────────────────────── */
function ComingSoonRow({ module }: { module: FlowModule }) {
  const Icon = resolveIcon(module.icon);
  const reason = COMING_SOON_REASON[module.key] ?? "Not wired to Genie yet.";
  return (
    <div
      role="listitem"
      aria-disabled="true"
      className={cn(
        "flex cursor-not-allowed items-center gap-3 px-4 py-3 opacity-70",
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold text-foreground">{module.label}</p>
        <p className="truncate text-[11px] text-muted-foreground">{reason}</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        <Lock className="h-2.5 w-2.5" />
        Coming soon
      </span>
    </div>
  );
}
