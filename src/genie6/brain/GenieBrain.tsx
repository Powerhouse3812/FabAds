import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  Compass,
  FileText,
  Layers,
  Lightbulb,
  Link2,
  MessageSquareQuote,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  brands,
  angles as ALL_ANGLES,
  hooks as ALL_HOOKS,
  concepts as ALL_CONCEPTS,
  audiences as ALL_AUDIENCES,
  WINNER_ADS,
  REFERENCE_URLS,
  KB_INSTRUCTIONS,
  KB_CONCEPTS,
  shortUrl,
  type Angle,
  type Audience,
  type Concept,
  type Hook,
  type KbInstruction,
  type ReferenceUrl,
  type WinnerAd,
} from "@/mocks/shared";
// Frameworks (§11 "system-provided set ... frameworks") — owned by a parallel
// agent (src/genie6/editor/frameworks.ts). Coded against the documented
// signature per the shared build brief; if this file doesn't exist yet when
// this runs, that's the Editor agent's slice landing, not a bug here — see
// the Brain agent's final report.
import { FRAMEWORKS, type Framework } from "@/genie6/editor/frameworks";
// Real batch count — owned by the Run Store agent (genieRunStore.ts). Same
// "coded against the contract" note applies.
import { useBatches } from "@/genie6/lib/genieRunStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AssetCard } from "./AssetCard";
import { AvatarVoicePicker } from "./AvatarVoicePicker";

/**
 * GenieBrain — Genie 2.0 §11, §21.1, §21.2.
 *
 * §21.1 records the reversal: the 26 Aug record called this an internal-admin
 * surface. It is now every user's own page — "It holds the system-provided
 * set drawn from the asset library: frameworks, angles, hooks, and the
 * rest." §21.2's provenance rule is this page's central honesty problem —
 * everything shown is either FabFunnel-seeded or client-created, and that
 * split is structural here (a legend + a tag on every single row), not a
 * corner badge on a few cards.
 *
 * Route (owned by the wiring agent): `/iq/genie6/settings/brain`.
 *
 * State coverage via URL, matching the rest of Genie 6 (`Library.tsx`
 * `?loading=1` etc.): `?state=populated|partial|zero|cap` (default
 * populated) simulates the CLIENT-CREATED layer only — Winner Ads,
 * References, and custom Instructions. The system-provided sets (Frameworks,
 * Angles, Hooks, Concepts, Audiences, the avatar/voice taxonomy) are always
 * fully present, because FabFunnel seeds them regardless of what this client
 * has done — that distinction IS the zero-data state's point: a brand-new
 * user still has a working Brain, they just haven't added anything to it.
 */
export function GenieBrain() {
  const [searchParams] = useSearchParams();
  const brainState = readBrainState(searchParams);
  const forceLoading = searchParams.get("loading") === "1";
  const [settling, setSettling] = useState(true);

  useEffect(() => {
    if (forceLoading) return;
    const t = setTimeout(() => setSettling(false), 650);
    return () => clearTimeout(t);
  }, [forceLoading]);
  const loading = forceLoading || settling;

  const winnerAdsAll = WINNER_ADS;
  const referencesAll = REFERENCE_URLS;
  const instructionsAll = KB_INSTRUCTIONS;

  const { winnerAds, references, instructions, winnerAdsCountOverride } = useMemo(() => {
    if (brainState === "zero") {
      return {
        winnerAds: [] as WinnerAd[],
        references: [] as ReferenceUrl[],
        instructions: instructionsAll.filter((i) => i.source === "default"),
        winnerAdsCountOverride: null as number | null,
      };
    }
    if (brainState === "partial") {
      return {
        winnerAds: winnerAdsAll.slice(0, 2),
        references: referencesAll.slice(0, 1),
        instructions: instructionsAll.filter((i) => i.source === "default" || i.kind === "custom").slice(0, 5),
        winnerAdsCountOverride: null as number | null,
      };
    }
    if (brainState === "cap") {
      return {
        winnerAds: winnerAdsAll,
        references: referencesAll,
        instructions: instructionsAll,
        winnerAdsCountOverride: WINNER_ADS_CAP,
      };
    }
    return {
      winnerAds: winnerAdsAll,
      references: referencesAll,
      instructions: instructionsAll,
      winnerAdsCountOverride: null as number | null,
    };
  }, [brainState]);

  const winnerAdsCount = winnerAdsCountOverride ?? winnerAds.length;
  const instructionsCustomCount = instructions.filter((i) => i.source !== "default").length;
  const isEmpty = winnerAds.length === 0 && references.length === 0 && instructionsCustomCount === 0;

  // Real usage, not invented — how many Concepts trace back to a Winner Ad.
  const conceptsSourcedFrom = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of KB_CONCEPTS) {
      if (!c.winnerAdId) continue;
      map.set(c.winnerAdId, (map.get(c.winnerAdId) ?? 0) + 1);
    }
    return map;
  }, []);

  // Real account-wide activity — how many batches Genie has run drawing on
  // this Brain. `useBatches` is a parallel agent's file (genieRunStore.ts);
  // once it lands this Just Works, no change needed here.
  const generationsRun: number | null = useBatches().length;

  const DEMO_BRAND_IDS = ["mamaearth", "plum", "noise", "boat"];
  const [demoBrandId, setDemoBrandId] = useState<string>(searchParams.get("brand") ?? "mamaearth");
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [tone, setTone] = useState<string | null>(null);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="g6-root relative min-h-full bg-g6-bg-base">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
          {loading ? (
            <BrainSkeleton />
          ) : (
            <>
              <BrainHeader generationsRun={generationsRun} />
              <ProvenanceLegend />

              {isEmpty && (
                <div className="flex items-start gap-3 rounded-g6-xl border border-g6-border-secondary bg-g6-bg-container px-4 py-3">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-g6-text-tertiary" />
                  <p className="text-g6-sm text-g6-text-secondary">
                    You haven't added anything to your Brain yet — every set on this page right now is what
                    FabFunnel gave you to start. Save a Winner Ad, link a reference, or write an instruction from
                    Catalogue and it shows up here as <span className="font-semibold text-g6-text">yours</span>.
                  </p>
                </div>
              )}

              <KnowledgeBaseCapacityPanel
                winnerAdsCount={winnerAdsCount}
                cap={WINNER_ADS_CAP}
                instructionsTotal={instructions.length}
                instructionsCustom={instructionsCustomCount}
                referencesCount={references.length}
              />

              <section className="flex flex-col gap-2">
                <h2 className="font-g6-sans text-g6-h3 font-bold text-g6-text">Your Knowledge Base</h2>
                <p className="text-g6-sm text-g6-text-secondary">
                  What you've saved or written yourself — the client-created layer.
                </p>
                <Accordion type="multiple" defaultValue={isEmpty ? [] : ["winner-ads"]} className="mt-2">
                  <SystemSetSection
                    value="winner-ads"
                    icon={Trophy}
                    title="Winner Ads"
                    items={winnerAds}
                    getKey={(w) => w.id}
                    getSearchText={(w) => w.headline}
                    emptyLabel="No winner ads saved yet — save one from Industry Insights, Genie, or upload your own."
                    renderItem={(w) => {
                      const sourced = conceptsSourcedFrom.get(w.id) ?? 0;
                      return (
                        <AssetCard
                          preview={w.thumbnail ? { kind: "image", src: w.thumbnail } : { kind: "icon", icon: Trophy }}
                          name={w.headline}
                          tags={[w.entityType, w.format, w.source.replace(/-/g, " ")]}
                          usageLabel={`${sourced} concept${sourced === 1 ? "" : "s"} sourced`}
                          lastUsedLabel={`Added ${formatDate(w.capturedAt)}`}
                          provenance="client-created"
                        />
                      );
                    }}
                  />
                  <SystemSetSection
                    value="references"
                    icon={Link2}
                    title="References"
                    items={references}
                    getKey={(r) => r.id}
                    getSearchText={(r) => `${r.label} ${r.url}`}
                    emptyLabel="No references linked yet — paste a URL from Studio's reference picker or the Catalogue detail page."
                    renderItem={(r) => (
                      <AssetCard
                        preview={r.thumbnail ? { kind: "image", src: r.thumbnail } : { kind: "icon", icon: Link2 }}
                        name={r.label}
                        tags={[shortUrl(r.url), r.entityType]}
                        lastUsedLabel={`Added ${formatDate(r.capturedAt)}`}
                        provenance="client-created"
                      />
                    )}
                  />
                  <SystemSetSection
                    value="instructions"
                    icon={FileText}
                    title="Instructions"
                    items={instructions}
                    getKey={(i) => i.id}
                    getSearchText={(i) => `${i.name} ${i.description}`}
                    emptyLabel="No instructions yet."
                    renderItem={(i) => (
                      <AssetCard
                        preview={{ kind: "icon", icon: FileText }}
                        name={i.name}
                        tags={[i.kind, i.entityType]}
                        lastUsedLabel={`Added ${formatDate(i.createdAt)}`}
                        provenance={i.source === "default" ? "fabfunnel-seeded" : "client-created"}
                      />
                    )}
                  />
                </Accordion>
              </section>

              <section className="flex flex-col gap-2">
                <h2 className="font-g6-sans text-g6-h3 font-bold text-g6-text">What FabFunnel gave you</h2>
                <p className="text-g6-sm text-g6-text-secondary">
                  The system-provided set drawn from the asset library — always here, browsable, reused by every
                  generation.
                </p>
                <Accordion type="multiple" defaultValue={["frameworks"]} className="mt-2">
                  <SystemSetSection
                    value="frameworks"
                    icon={Layers}
                    title="Frameworks"
                    items={FRAMEWORKS}
                    getKey={(f) => f.id}
                    getSearchText={(f) => f.name}
                    emptyLabel="No frameworks yet."
                    renderItem={(f: Framework) => (
                      <AssetCard
                        preview={{ kind: "icon", icon: Layers }}
                        name={f.name}
                        tags={f.sections.slice(0, 3).map((s) => s.name)}
                        usageLabel={`${f.usageCount} run${f.usageCount === 1 ? "" : "s"}`}
                        provenance={f.provenance}
                      />
                    )}
                  />
                  <SystemSetSection
                    value="angles"
                    icon={Compass}
                    title="Angles"
                    items={ALL_ANGLES}
                    layout="chips"
                    getKey={(a) => a.id}
                    getSearchText={(a) => `${a.label} ${a.description ?? ""}`}
                    emptyLabel="No angles yet."
                    renderItem={(a: Angle) => <ChipWithTooltip label={a.label} detail={a.description} />}
                  />
                  <SystemSetSection
                    value="hooks"
                    icon={MessageSquareQuote}
                    title="Hooks"
                    items={ALL_HOOKS}
                    getKey={(h) => h.id}
                    getSearchText={(h) => h.text}
                    emptyLabel="No hooks yet."
                    renderItem={(h: Hook) => (
                      <AssetCard
                        preview={{ kind: "icon", icon: MessageSquareQuote }}
                        name={h.text}
                        tags={[h.angleId, h.brandId].filter((x): x is string => !!x)}
                        usageLabel={h.performance ? `${h.performance.ctr}% CTR` : "No performance yet"}
                        lastUsedLabel={h.performance ? `${h.performance.impressions.toLocaleString("en-IN")} impr.` : undefined}
                        provenance="fabfunnel-seeded"
                      />
                    )}
                  />
                  <SystemSetSection
                    value="concepts"
                    icon={Lightbulb}
                    title="Concepts"
                    items={ALL_CONCEPTS}
                    getKey={(c) => c.id}
                    getSearchText={(c) => c.name}
                    emptyLabel="No concepts yet."
                    renderItem={(c: Concept) => (
                      <AssetCard
                        preview={{ kind: "icon", icon: Lightbulb }}
                        name={c.name}
                        tags={[c.format, c.tone]}
                        usageLabel={`${c.generationCount} run${c.generationCount === 1 ? "" : "s"}`}
                        provenance="fabfunnel-seeded"
                      />
                    )}
                  />
                  <SystemSetSection
                    value="audiences"
                    icon={Users}
                    title="Audiences"
                    items={ALL_AUDIENCES}
                    layout="chips"
                    getKey={(a) => a.id}
                    getSearchText={(a) => `${a.label} ${a.segment}`}
                    emptyLabel="No audiences yet."
                    renderItem={(a: Audience) => <ChipWithTooltip label={a.label} detail={a.segment} />}
                  />
                </Accordion>
              </section>

              <section className="flex flex-col gap-4 rounded-g6-2xl border border-g6-border-secondary bg-g6-bg-container p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-2xl">
                    <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
                      Avatars &amp; voices
                    </p>
                    <h2 className="mt-1 font-g6-sans text-g6-h3 font-bold text-g6-text">
                      Categorised by environment and personality
                    </h2>
                    <p className="mt-1 text-g6-sm text-g6-text-secondary">
                      This is the exact picker Genie's own avatar-selection step uses — browse it here, or reach
                      it mid-generation. Same categorisation, same component, so the two can't drift apart.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
                      Match tone to
                    </span>
                    <Select value={demoBrandId} onValueChange={setDemoBrandId}>
                      <SelectTrigger className="g6-root h-8 w-[150px] border-g6-border-secondary bg-g6-bg-elevated text-g6-xs text-g6-text">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="g6-root border-g6-border bg-g6-bg-elevated font-g6-sans text-g6-sm">
                        {DEMO_BRAND_IDS.map((id) => {
                          const b = brands.find((x) => x.id === id);
                          return b ? (
                            <SelectItem key={id} value={id}>
                              {b.name}
                            </SelectItem>
                          ) : null;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Deliberately NOT wrapped in g6-root — AvatarVoicePicker is
                    shadcn-token by design (Studio + Apps mount it), so it
                    keeps its own tokens even nested inside this g6 page. */}
                <div className="rounded-g6-xl bg-g6-bg-base p-4">
                  <AvatarVoicePicker
                    avatarId={avatarId}
                    voiceId={voiceId}
                    tone={tone}
                    onChange={(v) => {
                      if ("avatarId" in v) setAvatarId(v.avatarId ?? null);
                      if ("voiceId" in v) setVoiceId(v.voiceId ?? null);
                      if ("tone" in v) setTone(v.tone ?? null);
                    }}
                    brandId={demoBrandId}
                  />
                </div>

                <p className="text-g6-xs text-g6-text-tertiary">
                  Presets only in V1 — organised by category, browsable as a proper list.{" "}
                  <span className="font-semibold text-g6-text">Creating your own avatar ships in V2</span> and will
                  read a face from image or video into an avatar (+ voice and personality, from video) — not built
                  yet, shown here so the shape is visible.
                </p>
                <NotYetAvatarCreation />
              </section>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ────────────────────────────── Constants ────────────────────────────── */

const WINNER_ADS_CAP = 50;

type BrainState = "populated" | "partial" | "zero" | "cap";

function readBrainState(sp: URLSearchParams): BrainState {
  const s = sp.get("state");
  if (s === "partial" || s === "zero" || s === "cap") return s;
  return "populated";
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ────────────────────────────── Sub-components ────────────────────────────── */

function BrainHeader({ generationsRun }: { generationsRun: number | null }) {
  return (
    <header className="flex flex-col gap-2">
      <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">Genie Brain</p>
      <h1 className="font-g6-sans text-g6-h1 font-black tracking-[-0.02em] text-g6-text">
        What Genie knows, on your behalf
      </h1>
      <p className="max-w-2xl text-g6-base text-g6-text-secondary">
        Every set below is either something FabFunnel gave you to start, or something you or your team added.
        {generationsRun !== null && (
          <>
            {" "}
            Genie has run{" "}
            <span className="font-g6-mono tabular-nums text-g6-text">{generationsRun.toLocaleString("en-IN")}</span>{" "}
            generations drawing on it so far.
          </>
        )}
      </p>
    </header>
  );
}

function ProvenanceLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-g6-xl border border-g6-border-secondary bg-g6-bg-container px-4 py-3">
      <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">Reading this page</p>
      <span className="inline-flex items-center gap-1.5 text-g6-sm text-g6-text">
        <span className="h-2 w-2 rounded-full bg-g6-text-tertiary" />
        FabFunnel-seeded — Genie started you with this
      </span>
      <span className="inline-flex items-center gap-1.5 text-g6-sm text-g6-text">
        <span className="h-2 w-2 rounded-full bg-g6-primary" />
        Yours — you or your team added this
      </span>
    </div>
  );
}

function KnowledgeBaseCapacityPanel({
  winnerAdsCount,
  cap,
  instructionsTotal,
  instructionsCustom,
  referencesCount,
}: {
  winnerAdsCount: number;
  cap: number;
  instructionsTotal: number;
  instructionsCustom: number;
  referencesCount: number;
}) {
  const pct = Math.min(100, Math.round((winnerAdsCount / cap) * 100));
  const atCap = winnerAdsCount >= cap;

  return (
    <section className="rounded-g6-2xl border border-g6-border-secondary bg-g6-bg-container p-6">
      <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
        Knowledge Base capacity
      </p>
      {/* NOT three equal cards — one panel, one dominant column (the real
          ceiling the user acts on) plus two lighter stats beside it. */}
      <div className="mt-4 grid gap-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="text-g6-sm font-semibold text-g6-text">Winner Ads</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="font-g6-mono text-g6-display font-black tabular-nums text-g6-text">
              {winnerAdsCount}
            </span>
            <span className="font-g6-mono text-g6-lg text-g6-text-tertiary">/ {cap}</span>
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-g6-bg-spotlight">
            <div
              className={cn("h-full rounded-full transition-all", atCap ? "bg-g6-error" : "bg-g6-primary")}
              style={{ width: `${pct}%` }}
            />
          </div>
          {atCap ? (
            <div className="mt-3 flex items-start gap-2 rounded-g6-lg border border-g6-error/30 bg-g6-error/10 px-3 py-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-g6-error" />
              <p className="text-g6-xs text-g6-text">
                You're at the 50 Winner Ad limit. Remove one before Genie can save another — nothing gets silently
                dropped to make room.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-g6-xs text-g6-text-tertiary">{cap - winnerAdsCount} slots left.</p>
          )}
        </div>
        <div className="border-t border-g6-border-secondary pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <p className="text-g6-sm font-semibold text-g6-text">Instructions</p>
          <p className="mt-1 font-g6-mono text-g6-h3 font-bold tabular-nums text-g6-text">{instructionsTotal}</p>
          <p className="mt-1 text-g6-xs text-g6-text-tertiary">
            {instructionsCustom} yours · {instructionsTotal - instructionsCustom} FabFunnel default
          </p>
        </div>
        <div className="border-t border-g6-border-secondary pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <p className="text-g6-sm font-semibold text-g6-text">References</p>
          <p className="mt-1 font-g6-mono text-g6-h3 font-bold tabular-nums text-g6-text">{referencesCount}</p>
          <p className="mt-1 text-g6-xs text-g6-text-tertiary">No cap — link whatever backs a claim.</p>
        </div>
      </div>
    </section>
  );
}

interface SystemSetSectionProps<T> {
  value: string;
  icon: LucideIcon;
  title: string;
  items: T[];
  getKey: (item: T) => string;
  getSearchText: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  emptyLabel: string;
  layout?: "rows" | "chips";
}

const PAGE_SIZE = 6;

function SystemSetSection<T>({
  value,
  icon: Icon,
  title,
  items,
  getKey,
  getSearchText,
  renderItem,
  emptyLabel,
  layout = "rows",
}: SystemSetSectionProps<T>) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => getSearchText(i).toLowerCase().includes(q));
  }, [items, query, getSearchText]);

  const visible = expanded ? filtered : filtered.slice(0, PAGE_SIZE);

  return (
    <AccordionItem value={value} className="border-g6-border-secondary">
      <AccordionTrigger className="text-g6-text hover:text-g6-text hover:no-underline">
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-g6-text-tertiary" />
          <span className="font-g6-sans text-g6-base font-semibold text-g6-text">{title}</span>
          <span className="font-g6-mono text-g6-xs tabular-nums text-g6-text-tertiary">{items.length}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        {items.length === 0 ? (
          <p className="rounded-g6-lg border border-dashed border-g6-border-secondary bg-g6-bg-base px-3 py-6 text-center text-g6-sm text-g6-text-tertiary">
            {emptyLabel}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.length > PAGE_SIZE && (
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${title.toLowerCase()}…`}
                className="h-8 max-w-xs border-g6-border-secondary bg-g6-bg-base text-g6-xs text-g6-text"
              />
            )}
            {filtered.length === 0 ? (
              <p className="text-g6-sm text-g6-text-tertiary">No matches for "{query}".</p>
            ) : layout === "chips" ? (
              <div className="flex flex-wrap gap-1.5">
                {visible.map((item) => (
                  <span key={getKey(item)}>{renderItem(item)}</span>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {visible.map((item) => (
                  <div key={getKey(item)}>{renderItem(item)}</div>
                ))}
              </div>
            )}
            {filtered.length > PAGE_SIZE && (
              <button
                type="button"
                onClick={() => setExpanded((x) => !x)}
                className="self-start font-g6-mono text-g6-xs font-semibold uppercase tracking-wider text-g6-primary"
              >
                {expanded ? "Show less" : `Show all ${filtered.length}`}
              </button>
            )}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function ChipWithTooltip({ label, detail }: { label: string; detail?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-default items-center rounded-full border border-g6-border-secondary bg-g6-bg-spotlight px-2.5 py-1 font-g6-mono text-g6-xs text-g6-text">
          {label}
        </span>
      </TooltipTrigger>
      {detail && <TooltipContent className="max-w-[240px] text-xs">{detail}</TooltipContent>}
    </Tooltip>
  );
}

/** §19/§13 — avatar creation is V2. Shown so the shape is visible, not built. */
function NotYetAvatarCreation() {
  return (
    <div className="flex flex-col gap-2 rounded-g6-xl border border-dashed border-g6-border-secondary bg-g6-bg-base p-4 opacity-80">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-g6-border-secondary bg-g6-bg-spotlight px-2 py-0.5 font-g6-mono text-[10px] font-semibold uppercase tracking-wider text-g6-text-tertiary">
          V2 · Not yet
        </span>
        <p className="text-g6-sm font-semibold text-g6-text">Create your own avatar</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-g6-lg border border-g6-border-secondary bg-g6-bg-container p-3">
          <p className="font-g6-mono text-[10px] uppercase tracking-wider text-g6-text-tertiary">From video</p>
          <p className="mt-1 text-g6-xs text-g6-text-secondary">Fetches avatar, voice, and personality — all editable.</p>
        </div>
        <div className="rounded-g6-lg border border-g6-border-secondary bg-g6-bg-container p-3">
          <p className="font-g6-mono text-[10px] uppercase tracking-wider text-g6-text-tertiary">From image</p>
          <p className="mt-1 text-g6-xs text-g6-text-secondary">Fetches avatar and personality only.</p>
        </div>
      </div>
    </div>
  );
}

function BrainSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-8" aria-busy aria-label="Loading your Brain">
      <div className="flex flex-col gap-3">
        <div className="h-3 w-24 rounded bg-g6-bg-spotlight" />
        <div className="h-10 w-2/3 rounded bg-g6-bg-spotlight" />
        <div className="h-4 w-full max-w-xl rounded bg-g6-bg-spotlight" />
      </div>
      <div className="h-12 w-full rounded-g6-xl bg-g6-bg-spotlight" />
      <div className="h-48 w-full rounded-g6-2xl bg-g6-bg-spotlight" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 w-full rounded-g6-xl bg-g6-bg-spotlight" />
        ))}
      </div>
      <div className="h-72 w-full rounded-g6-2xl bg-g6-bg-spotlight" />
    </div>
  );
}
