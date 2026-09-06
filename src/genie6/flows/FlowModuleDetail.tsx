import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, Coins, Lock, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { CREDITS_LIMIT, CREDITS_REMAINING, formatCredits } from "../lib/credits";
import { HeroHeader } from "../studio-v4/components/HeroHeader";
import { SectionHeader } from "../studio-v4/components/SectionHeader";
import type {
  CampaignUrlExtraction,
  FlowAction,
  FlowActionId,
  FlowModuleKey,
  FlowSourceRef,
} from "./flowTypes";
import { flowSearchParams } from "./flowTypes";
import { actionsForModule, getFlowModule } from "./data/flowRegistry";
import { getFlowSource, sourcesForModule } from "./data/flowSources";
import { resolveFlowContext } from "./data/resolveFlowContext";
import { resolveIcon } from "./icons";
import { FlowCardSkeleton, FlowPartialNote, FlowRowSkeleton, FlowZeroNote } from "./FlowStateNotes";
import { CampaignExtractionCard } from "./CampaignExtractionCard";

/**
 * FlowModuleDetail — one source module's actions, then its sources (§7).
 *
 * Two stages on one page. Stage 1 (Actions) is always visible. Stage 2
 * (Source picker) only appears once an action is chosen — mirrors the
 * "choose a style" reveal pattern already used in Step3Approach so the two
 * genie2.0 surfaces feel like the same product.
 *
 * Campaign Urls gets a third micro-stage: picking a source there doesn't
 * navigate immediately — it stages the visible/editable extraction card
 * (§7.5) and ONLY the card's own "Continue" button leaves for Studio.
 */
export function FlowModuleDetail() {
  const { moduleKey } = useParams<{ moduleKey: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const module = moduleKey ? getFlowModule(moduleKey as FlowModuleKey) : undefined;

  const forceLoading = searchParams.get("loading") === "1";
  const forceEmpty = searchParams.get("empty") === "1";
  const presetActionId = searchParams.get("action");
  const presetRefId = searchParams.get("ref");

  const [selectedActionId, setSelectedActionId] = useState<FlowActionId | null>(
    (presetActionId as FlowActionId | null) ?? null,
  );
  const [query, setQuery] = useState("");
  const [pendingRefId, setPendingRefId] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<CampaignUrlExtraction | null>(null);
  const [originalExtraction, setOriginalExtraction] = useState<CampaignUrlExtraction | null>(null);

  const stage2Ref = useRef<HTMLDivElement | null>(null);

  const isCampaignUrls = module?.key === "campaign-urls";

  // SendToGenieMenu hands campaign-urls off to THIS page (rather than
  // straight to Studio) precisely so the extraction card still gets a
  // chance to run. Stage it immediately when both params are present.
  useEffect(() => {
    if (!module || !isCampaignUrls || !presetRefId) return;
    const src = getFlowSource(presetRefId);
    if (src) {
      setPendingRefId(src.id);
      const ext = src.extraction ?? null;
      setExtraction(ext ? { ...ext, claims: [...ext.claims], images: [...ext.images] } : null);
      setOriginalExtraction(ext ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module?.key]);

  useEffect(() => {
    if (selectedActionId) stage2Ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedActionId]);

  // Every hook above this line runs unconditionally, every render — the two
  // early returns below (module missing / coming-soon) must never sit ABOVE
  // a hook, so `allSources` + `filteredSources` are computed here too (with
  // module-optional guards) rather than after the returns.
  const actions = module ? actionsForModule(module.key) : [];
  const allSources = module && !forceEmpty ? sourcesForModule(module.key) : [];
  const filteredSources = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allSources;
    return allSources.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.sourceBrandName.toLowerCase().includes(q),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSources, query]);

  if (!moduleKey || !module) {
    return <Navigate to="/iq/genie6/flows" replace />;
  }

  if (module.state === "coming-soon") {
    const Icon = resolveIcon(module.icon);
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-6 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-bold text-foreground">{module.label} isn&apos;t connected yet</h1>
        <p className="max-w-md text-sm text-muted-foreground">{module.desc}</p>
        <Link
          to="/iq/genie6/flows"
          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground"
        >
          Back to Other Flows
        </Link>
      </div>
    );
  }

  const selectedAction = actions.find((a) => a.id === selectedActionId) ?? null;
  const highlightRefId = !isCampaignUrls ? presetRefId : null;

  if (forceLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pt-8 pb-16">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <FlowCardSkeleton key={i} />
          ))}
        </div>
        <div className="flex flex-col gap-2 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <FlowRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  function isUnpickable(ref: FlowSourceRef): { blocked: boolean; reason?: string } {
    if (selectedAction?.requiresAnalysis && !ref.analysed) {
      return { blocked: true, reason: `Needs analysis in ${module!.label} before this action` };
    }
    return { blocked: false };
  }

  function proceed(refId: string, ext?: CampaignUrlExtraction | null) {
    if (!selectedAction || !module) return;
    const sp = flowSearchParams(module.key, refId, selectedAction.id);
    if (isCampaignUrls && ext) {
      if (ext.product) sp.set("xp", ext.product);
      if (ext.offer) sp.set("xo", ext.offer);
      if (ext.claims.length) sp.set("xc", ext.claims.join("|"));
    }
    if (selectedAction.toOtherApps) {
      // Creative Library's "Send to Other Apps" (§6 Rule 6) — leaves Studio
      // entirely for the Other Apps grid, carrying src/ref/act so it can
      // pre-fill. Owned by the APPS UI agent at /iq/genie6/apps.
      navigate(`/iq/genie6/apps?${sp.toString()}`);
      return;
    }
    const ctx = resolveFlowContext(sp);
    const target = ctx?.landingStep === 4 ? "configure" : "product";
    navigate(`/iq/genie6/studio-alpha/${target}?${sp.toString()}`);
  }

  function pickSource(ref: FlowSourceRef) {
    if (!selectedAction) return;
    if (isUnpickable(ref).blocked) return;
    if (isCampaignUrls) {
      setPendingRefId(ref.id);
      const ext = ref.extraction ?? null;
      setExtraction(ext ? { ...ext, claims: [...ext.claims], images: [...ext.images] } : null);
      setOriginalExtraction(ext);
      return;
    }
    proceed(ref.id);
  }

  const allUnanalysed =
    Boolean(selectedAction?.requiresAnalysis) &&
    allSources.length > 0 &&
    allSources.every((s) => !s.analysed);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pt-8 pb-16">
      <div className="flex justify-end">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5">
          <Coins className="h-3.5 w-3.5 text-primary-text" />
          <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground">
            {formatCredits(CREDITS_REMAINING)}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            / {formatCredits(CREDITS_LIMIT)}
          </span>
        </div>
      </div>

      <div>
        <HeroHeader title={module.label} onBack={() => navigate("/iq/genie6/flows")} />
        <p className="mx-auto mt-1.5 max-w-md text-center text-[13px] text-muted-foreground">
          {module.desc}
        </p>
      </div>

      {module.competitorOwned && (
        <p className="rounded-lg border border-warning-text/30 bg-warning-text/10 px-3 py-2 text-[12px] text-warning-text">
          These ads belong to competitors. Genie will still build the new ad for your own
          brand — never for the rival shown here.
        </p>
      )}
      {module.staticOnlyNote && (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
          {module.staticOnlyNote}
        </p>
      )}

      {/* ── Stage 1 — Actions ── */}
      <section className="flex flex-col gap-3">
        <SectionHeader title="Choose an action" count={actions.length} />
        {actions.length === 0 ? (
          <FlowZeroNote
            text="No actions configured for this module yet"
            ctaLabel="Back to Other Flows"
            to="/iq/genie6/flows"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {actions.map((a) => (
              <ActionCard
                key={a.id}
                action={a}
                selected={selectedActionId === a.id}
                onClick={() => setSelectedActionId(a.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Stage 2 — Source picker ── */}
      {selectedAction && (
        <section
          ref={stage2Ref}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-4 duration-300 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-baseline justify-between gap-2">
            <SectionHeader title="Pick what it's based on" />
            <span className="text-[11px] text-muted-foreground">for {selectedAction.label}</span>
          </div>

          {allSources.length > 0 && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${module.label.toLowerCase()}...`}
                className="w-full rounded-full border border-input bg-background py-2 pl-9 pr-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          )}

          {allUnanalysed && (
            <FlowPartialNote count={allSources.length} label={module.label} to={module.modulePath} />
          )}

          {allSources.length === 0 ? (
            <FlowZeroNote
              text={`No ${module.label} sources yet`}
              ctaLabel={`Go to ${module.label}`}
              to={module.modulePath}
            />
          ) : filteredSources.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-6 text-center">
              <p className="text-[12px] text-muted-foreground">No sources match &ldquo;{query}&rdquo;</p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-[11px] font-semibold text-primary-text hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredSources.map((s) => (
                <SourceRow
                  key={s.id}
                  source={s}
                  competitorOwned={Boolean(module.competitorOwned || s.competitorOwned)}
                  unpickable={isUnpickable(s)}
                  highlighted={highlightRefId === s.id}
                  onPick={() => pickSource(s)}
                />
              ))}
            </div>
          )}

          {isCampaignUrls && pendingRefId && (
            <CampaignExtractionCard
              extraction={extraction}
              original={originalExtraction}
              onChange={setExtraction}
              onCancel={() => {
                setPendingRefId(null);
                setExtraction(null);
                setOriginalExtraction(null);
              }}
              onContinue={() => proceed(pendingRefId, extraction)}
            />
          )}
        </section>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  ActionCard — one action, stage 1. Video Sage's three
 *  variation actions render as three of these, never one
 *  collapsed "Generate variation" with a dropdown (§7.1).
 * ────────────────────────────────────────────────────────── */
function ActionCard({
  action,
  selected,
  onClick,
}: {
  action: FlowAction;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = resolveIcon(action.icon);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border bg-card p-4 text-left transition-all",
        selected
          ? "border-primary/40 ring-2 ring-primary/30 shadow-[0_8px_24px_rgba(195,235,66,0.14)]"
          : "border-border hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            selected ? "bg-primary/15 text-primary-text" : "bg-muted text-foreground",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        {action.requiresAnalysis && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="h-2.5 w-2.5" />
            Needs analysis
          </span>
        )}
      </div>
      <p className="text-[13px] font-bold text-foreground">{action.label}</p>
      <p className="line-clamp-2 text-[11px] text-muted-foreground">{action.desc}</p>
      <p className="mt-auto border-t border-border/60 pt-1.5 text-[10.5px] font-medium text-muted-foreground">
        Produces: {action.produces}
      </p>
    </button>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  SourceRow — stage 2 tile. Unpickable sources state the
 *  reason ON the row (never a silent disable).
 * ────────────────────────────────────────────────────────── */
function SourceRow({
  source,
  competitorOwned,
  unpickable,
  highlighted,
  onPick,
}: {
  source: FlowSourceRef;
  competitorOwned: boolean;
  unpickable: { blocked: boolean; reason?: string };
  highlighted: boolean;
  onPick: () => void;
}) {
  const blocked = unpickable.blocked;
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={blocked}
      aria-disabled={blocked}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-all",
        blocked
          ? "cursor-not-allowed border-border opacity-60"
          : "border-border hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm",
        highlighted && !blocked && "ring-2 ring-primary/40",
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
        {source.thumbnail ? (
          <img src={source.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
            {source.sourceBrandName.slice(0, 2)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-[13px] font-semibold text-foreground">{source.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{source.subtitle}</p>
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-foreground">
            {source.sourceBrandName}
          </span>
          {competitorOwned && (
            <span className="inline-flex items-center rounded-full border border-warning-text/30 bg-warning-text/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-warning-text">
              Competitor
            </span>
          )}
          {(source.sourceFormat === "carousel" || source.sourceFormat === "flexible") && (
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
              Static output only
            </span>
          )}
          {source.metrics?.map((m) => (
            <span
              key={m.label}
              className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-medium text-foreground"
            >
              {m.label} {m.value}
            </span>
          ))}
        </div>
        {blocked && unpickable.reason && (
          <p className="flex items-center gap-1 pt-0.5 text-[10.5px] font-medium text-warning-text">
            <Lock className="h-2.5 w-2.5 shrink-0" />
            {unpickable.reason}
          </p>
        )}
      </div>

      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
          source.analysed
            ? "bg-primary/10 text-primary-text"
            : "bg-muted text-muted-foreground",
        )}
      >
        {source.analysed ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
        {source.analysed ? "Analysed" : "Not analysed"}
      </span>
    </button>
  );
}
