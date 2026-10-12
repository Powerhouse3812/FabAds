/**
 * KitPreview — renders every shared component with inline fixtures in populated,
 * partial (disabled sections, nulls) and empty states, plus long-name cases.
 * Route target: /industry-insights/_kit. Fixtures here are local; nothing imports data/selectors/stores.
 */
import { useMemo, useState, type ReactNode } from "react";
import {
  AD_SORT_LABEL,
  type AiScore,
  type AiSummary,
  type DetailTarget,
  type Kpi,
  type SelectedTags,
  type TagGroupKey,
  type TopTenGroup as TopTenGroupData,
  type TrendSeries,
  type SavedItemRef,
  type AdSort,
} from "@/lib/insights-v3/types";
import {
  AiScoreBadge,
  AiSummaryBlock,
  BasedOnNote,
  ClonesPill,
  DaysLive,
  DetailOverlay,
  DisabledSection,
  DownloadButton,
  ElementActions,
  ElementChip,
  EmptyResults,
  EmptyState,
  EngagementGroup,
  GridSkeleton,
  InsightsPageLayout,
  KpiRow,
  ListSkeleton,
  NewBadge,
  OverlaySection,
  OverviewShell,
  PageTabs,
  SaveButton,
  ScopeBar,
  SelectedChips,
  SortControl,
  StatusPill,
  TopTenGroups,
  TrendBars,
  TrendSpark,
  TruncatedText,
  TypeChip,
  ViewMoreModal,
  WinnerBadge,
  fmtInt,
  useDetailStack,
  useInsightsScope,
  useListSort,
  useSaveModal,
  useSelectedTags,
  type ScopeOption,
} from "..";

/* ── fixtures ──────────────────────────────────────────────────────────── */

type Mode = "populated" | "partial" | "empty" | "loading";
const MODES: { key: Mode; label: string }[] = [
  { key: "populated", label: "Populated" },
  { key: "partial", label: "Partial" },
  { key: "empty", label: "Empty" },
  { key: "loading", label: "Loading" },
];

const LONG_NAME =
  "Smart Cash Rewards Credit Card Comparison Guide for Salaried Professionals in Tier-2 Indian Cities (2026 Edition)";

const INDUSTRIES: ScopeOption[] = [
  { id: "vsl", label: "VSL", count: 1284 },
  { id: "telehealth", label: "Telehealth", count: 642 },
  { id: "lead-gen", label: "Lead Gen", count: 1873 },
  { id: "e-commerce", label: "E-commerce", count: 2410 },
  { id: "search-arb", label: "Search Arb", count: 389 },
  { id: "others", label: "Others", count: 0 },
];

const CATEGORY_LABELS = [
  "Apparel", "Auto Insurance", "Beauty & Skincare", "Credit Cards", "Debt Relief", "Demi-fine Jewellery",
  "Dental", "Diabetes Management", "Education & Courses", "Fitness", "Hair Loss", "Home Security",
  "Jewellery", "Life Insurance", "Mattresses & Sleep", "Mortgage Refinance", "Nutrition & Supplements",
  "Pet Care", "Solar Panels", "Telecom Plans", "Weight Loss", "Wellness Devices",
  LONG_NAME,
];
const CATEGORIES: ScopeOption[] = CATEGORY_LABELS.map((label, i) => ({
  id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40),
  label,
  count: i % 7 === 3 ? 0 : 40 + ((i * 53) % 420),
}));

const TOTAL = 6598;

function options(labels: string[], seed = 1, zeroAt: number[] = []): TopTenGroupData["options"] {
  return labels
    .map((label, i) => ({
      id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48),
      label,
      count: zeroAt.includes(i) ? 0 : Math.max(3, Math.round(980 / (i + 1.4) + ((i * seed * 17) % 29))),
    }))
    .sort((a, b) => b.count - a.count);
}

const GROUPS: TopTenGroupData[] = [
  {
    key: "hookStyle",
    label: "Hook style",
    options: options(
      ["Curiosity question", "Shock stat", "Pain callout", "Before / after", "Authority claim", "Story opener",
       "Direct offer", "Myth bust", "Social proof", "Warning", "Secret reveal", "Countdown", "Challenge"],
      3, [11],
    ),
  },
  {
    key: "angle",
    label: "Angle",
    options: options(
      ["Save money on premiums", "Doctor-approved routine", "Lose belly fat without gym", "Limited stock this week",
       "Stop overpaying your bank", "Hair regrowth in 90 days", "Made in India, trusted worldwide", "Zero-EMI festive offer",
       "Switch in 5 minutes", "Skin barrier repair", "Dentist hates this trick", "Free shipping today"],
      5,
    ),
  },
  { key: "framework", label: "Framework", options: options(["PAS", "AIDA", "BAB", "Story–Solution", "FAB", "4 Ps"], 7) },
  {
    key: "keyword",
    label: "Keyword / topic",
    options: options(
      Array.from({ length: 140 }, (_, i) =>
        ["insurance", "rewards", "refinance", "serum", "supplement", "retinol", "solar", "loan", "mattress", "cashback",
         "weight", "sleep", "pet", "dental", "hair", "credit"][i % 16] + (i >= 16 ? ` ${Math.floor(i / 16) + 1}` : ""),
      ),
      2,
    ),
  },
  {
    key: "advertiser",
    label: "Competitor / domain",
    options: options(["napchief.com", "Mamaearth", "boat-lifestyle.com", "SleepyOwl Mattress Co.", LONG_NAME, "amalfa.in", "Mensa Brands"], 4),
  },
  { key: "country", label: "Country", options: options(["IN", "US", "GB", "AE", "CA", "AU", "DE", "SG"], 6, [7]) },
  { key: "category", label: "Category", options: options(CATEGORY_LABELS.slice(0, 12), 9) },
  { key: "funnelType", label: "Funnel type", options: [] },
];

const SERIES: TrendSeries = {
  unit: "new ads per week",
  bucket: "week",
  changePct: 24,
  points: [38, 41, 35, 52, 47, 61, 58, 66, 71, 64, 80, 93].map((count, i) => ({
    start: new Date(Date.UTC(2026, 6, 6 + i * 7)).toISOString().slice(0, 10),
    count,
  })),
};
const SERIES_NEW: TrendSeries = { ...SERIES, changePct: null, unit: "new ads per day", bucket: "day",
  points: [0, 0, 2, 5, 3, 8, 6].map((count, i) => ({ start: new Date(Date.UTC(2026, 9, 3 + i)).toISOString().slice(0, 10), count })) };
const SERIES_DOWN: TrendSeries = { ...SERIES, changePct: -12 };
const SERIES_EMPTY: TrendSeries = { ...SERIES, points: SERIES.points.map((p) => ({ ...p, count: 0 })) };

const KPIS: Kpi[] = [
  { key: "total", label: "Total ads", value: 6598, display: "6,598", sub: "+412 this period", tooltip: "All ads in the current scope." },
  { key: "active", label: "Active ads", value: 3120, display: "3,120", sub: "47% of total", tooltip: "Ads seen live in the last 14 days." },
  { key: "winning", label: "Winning ads", value: 284, display: "284", sub: "4.3% of total", tooltip: "Seen live, 14+ days running, 2+ clones." },
  { key: "advertisers", label: "Competitors", value: 947, display: "947", sub: "−18 vs previous", tooltip: "Competitors with ads in scope." },
  { key: "new", label: "New ads", value: 37, display: "37", sub: "since your last visit", tooltip: "Added since your last visit." },
  { key: "days", label: "Avg days live", value: 41, display: "41 days", tooltip: "Average running days across ads in scope." },
  { key: "lps", label: "Landing pages & offers", value: 1530, display: "1,530", sub: "212 offers", tooltip: "Landing pages and offers used by ads in scope." },
];
const KPIS_PARTIAL: Kpi[] = KPIS.map((k) =>
  k.key === "days"
    ? { ...k, value: null, display: "—", disabledReason: "Start dates are missing for every ad in this scope, so days live can't be averaged." }
    : k.key === "lps"
      ? { ...k, value: null, display: "—", disabledReason: "No landing pages were captured for ads in this scope." }
      : k,
);

const SUMMARY: AiSummary = {
  ads: 6598,
  text:
    "Lead Gen competitors lean on pain-callout hooks and a Problem–Agitate–Solve structure, with Credit Cards and Auto Insurance carrying the most volume. " +
    "Ads that run 30+ days mostly pair a direct-offer CTA with a quiz funnel. Volume shows what is popular, not what performs best, so read the winners list before copying a pattern.",
};

const SCORE_ELITE: AiScore = { total: 91, tier: "elite", parts: [], explanation: "Long-running and widely cloned." };
const SCORE_STRONG: AiScore = { total: 67, tier: "strong", parts: [], explanation: "" };
const SCORE_AVG: AiScore = { total: 48, tier: "average", parts: [], explanation: "" };
const SCORE_WEAK: AiScore = { total: 22, tier: "weak", parts: [], explanation: "" };

/* ── small helpers ─────────────────────────────────────────────────────── */

function Block({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/** Stand-in for the save modal (built later by another agent) so the URL contract is visible. */
function SaveModalStub() {
  const { target, close } = useSaveModal();
  if (!target) return null;
  return (
    <div role="status" className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">
      Save modal would open for <code className="font-mono">{target.type}:{target.id}</code> (URL: modal=save).{" "}
      <button type="button" onClick={close} className="font-medium text-primary-text underline">
        Close
      </button>
    </div>
  );
}

const targetLabel = (t: DetailTarget) =>
  t.kind === "element" ? `${t.elementType}: ${t.id}` : t.kind === "advertiser" ? `${t.advertiserKind}: ${t.id}` : `${t.kind}: ${t.id}`;

const typeOf = (t: DetailTarget): SavedItemRef["type"] =>
  t.kind === "element" ? t.elementType : t.kind === "advertiser" ? t.advertiserKind : t.kind;

/* ── page ──────────────────────────────────────────────────────────────── */

export default function KitPreview() {
  const [mode, setMode] = useState<Mode>("populated");
  const [scope, setScope] = useInsightsScope();
  const tags = useSelectedTags();
  const [sort, setSort] = useListSort<AdSort>(Object.keys(AD_SORT_LABEL) as AdSort[], "newest");
  const detail = useDetailStack();
  const [overlayDemo, setOverlayDemo] = useState(false);
  const [lastSave, setLastSave] = useState(0);

  const partial = mode === "partial";
  const groups = useMemo(() => (partial ? GROUPS.map((g, i) => (i % 3 === 1 ? { ...g, options: g.options.map((o, j) => (j % 2 ? { ...o, count: 0 } : o)) } : g)) : GROUPS), [partial]);
  const total = mode === "empty" ? 0 : TOTAL;
  // Union demo: picked tags add up, capped at the scope total (each ad counted once).
  const picked = (Object.entries(tags.selected) as [TagGroupKey, string[]][]).reduce(
    (sum, [k, ids]) => sum + (groups.find((g) => g.key === k)?.options.filter((o) => ids.includes(o.id)).reduce((s, o) => s + o.count, 0) ?? 0),
    0,
  );
  const resultTotal = mode === "empty" && tags.count > 0 ? 0 : tags.count > 0 ? Math.min(total, picked) : total;

  const topOfStack = detail.stack[detail.stack.length - 1];
  const backTarget = detail.stack.length > 1 ? detail.stack[detail.stack.length - 2] : null;
  const savedRef: SavedItemRef = { type: "hook", id: "curiosity-question" };

  const overview = (
    <OverviewShell
      pageKey="kit-preview"
      basedOn={partial ? 4120 : TOTAL}
      kpis={partial ? KPIS_PARTIAL : KPIS}
      summary={partial ? null : SUMMARY}
      summaryDisabledReason="AI summaries need at least 50 analysed ads; this scope has 31."
      charts={
        <TrendBars
          series={partial ? SERIES_EMPTY : SERIES}
          title="Launch frequency"
          basedOn={partial ? 4120 : TOTAL}
          emptyReason="No ads launched in this period, so there is nothing to chart."
        />
      }
      expandedOnly={
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TrendBars series={SERIES_NEW} title="Rising (new ads per day)" basedOn={37} height={120} />
          <TrendBars series={SERIES_DOWN} title="Scaling (declining example)" basedOn={512} height={120} />
        </div>
      }
      groups={
        <TopTenGroups
          groups={groups}
          selected={tags.selected}
          onToggle={tags.toggle}
          hiddenKeys={scope.category !== "all" ? ["category"] : undefined}
        />
      }
    />
  );

  const chips = (
    <SelectedChips
      selected={tags.selected}
      groups={groups}
      onRemove={tags.toggle}
      onClearAll={tags.clearAll}
      total={resultTotal}
      noun="ads"
      rightSlot={<SortControl value={sort} options={AD_SORT_LABEL} onChange={setSort} />}
    />
  );

  const list = (
    <div className="space-y-3">
      <SaveModalStub />

      {mode === "loading" ? (
        <>
          <GridSkeleton count={4} />
          <ListSkeleton rows={3} />
        </>
      ) : mode === "empty" ? (
        <>
          <EmptyResults noun="ads" onClear={tags.clearAll} />
          <EmptyState
            title="Nothing in My Feeds yet"
            body="My Feeds shows ads from pages and domains you mark as competitors, pages you follow and industries you follow."
            action={
              <a href="/industry-insights/advertisers" className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                Go to Competitors
              </a>
            }
          />
        </>
      ) : (
        <>
          <Block title="Badges" note="New, Winner (with and without the engagement mark), AI score tiers, status, days live, clones, type chips.">
            <Row label="New · Winner"><NewBadge /><WinnerBadge /><WinnerBadge engagementStandout /></Row>
            <Row label="AI score">
              <AiScoreBadge score={SCORE_ELITE} /><AiScoreBadge score={SCORE_STRONG} />
              <AiScoreBadge score={SCORE_AVG} /><AiScoreBadge score={SCORE_WEAK} />
            </Row>
            <Row label="Status"><StatusPill status="active" /><StatusPill status="inactive" /></Row>
            <Row label="Days live"><DaysLive days={94} /><DaysLive days={1} /><DaysLive days={null} /></Row>
            <Row label="Clones"><ClonesPill clones={0} /><ClonesPill clones={1} /><ClonesPill clones={37} /></Row>
            <Row label="Type chips">
              {(["ad", "framework", "hook", "angle", "concept", "domain", "page", "landing-page", "offer"] as const).map((t) => (
                <TypeChip key={t} type={t} />
              ))}
            </Row>
          </Block>

          <Block title="Element chips" note="Click pushes onto the detail stack (URL ?detail=…). Long labels truncate with a tooltip.">
            <Row label="Chips">
              <ElementChip type="hook" id="curiosity-question" label="Curiosity question" />
              <ElementChip type="framework" id="pas" label="PAS" count={412} />
              <ElementChip type="angle" id="save-money" label="Save money on premiums" />
              <ElementChip type="concept" id="ugc-selfie" label="UGC selfie video" />
              <ElementChip type="domain" id="napchief.com" label="napchief.com" />
              <ElementChip type="page" id="long" label={LONG_NAME} />
              <ElementChip type="landing-page" id="lp-9" label="/quiz/find-your-card" />
              <ElementChip type="offer" id="offer.example.com" label="offer.example.com" />
            </Row>
            <Row label="Truncated text">
              <div className="w-56 rounded-md border border-dashed border-border p-2 text-sm">
                <TruncatedText text={LONG_NAME} />
              </div>
              <div className="w-56 rounded-md border border-dashed border-border p-2 text-sm">
                <TruncatedText text="Short name, no tooltip" />
              </div>
            </Row>
          </Block>

          <Block title="Actions" note="Save opens ?modal=save&target=…; Download builds a file on click (toast on success/failure).">
            <Row label="Save (icon)">
              <SaveButton target={savedRef} variant="icon" />
              <SaveButton target={savedRef} variant="icon" savedCount={3} />
            </Row>
            <Row label="Save (button)">
              <SaveButton target={savedRef} variant="button" />
              <SaveButton target={savedRef} variant="button" savedCount={2} />
            </Row>
            <Row label="Download">
              <DownloadButton
                label="Download hook"
                variant="button"
                build={() => {
                  setLastSave((n) => n + 1);
                  return { kind: "text", filename: "curiosity-question.md", mime: "text/markdown", content: "# Curiosity question\n\nA hook style that opens with an unanswered question.\n" };
                }}
              />
              <DownloadButton
                label="Ad: 2 files"
                variant="button"
                build={() => [
                  { kind: "text", filename: "ad-copy.txt", mime: "text/plain", content: "Headline\nPrimary text\n" },
                  { kind: "text", filename: "ad-analysis.txt", mime: "text/plain", content: "Hook: curiosity question\n" },
                ]}
              />
              <DownloadButton label="Returns null" variant="button" build={() => null} />
              <DownloadButton build={() => { throw new Error("nope"); }} ariaLabel="Download (fails, shows error toast)" />
              <span className="text-xs text-muted-foreground">downloads: {lastSave}</span>
            </Row>
            <Row label="ElementActions">
              <ElementActions target={{ type: "hook", id: "h1" }} savedCount={1} buildDownload={() => ({ kind: "text", filename: "hook.txt", mime: "text/plain", content: "hook" })}
                genieSlot={<span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs text-primary-text">Use in Genie</span>} />
              <ElementActions target={{ type: "domain", id: "d1" }} buildDownload={() => ({ kind: "text", filename: "d.md", mime: "text/markdown", content: "d" })}
                genieSlot={<span className="rounded-md border px-2 py-1 text-xs">Genie slot (hidden for domain)</span>} />
              <ElementActions target={{ type: "offer", id: "o1" }} />
            </Row>
          </Block>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Block title="Engagement" note="Reported on a minority of ads.">
              <EngagementGroup engagement={{ likes: 12840, comments: 312, shares: 96 }} />
              <EngagementGroup engagement={{ likes: null, comments: 41, shares: null }} />
              <EngagementGroup engagement={{ likes: null, comments: null, shares: null }} />
            </Block>
            <Block title="Disabled sections + notes" note="Same frame, stable height, reason inline and in the tooltip.">
              <DisabledSection title="Script & storyboard" reason="No transcript was captured for this ad, so there is no script to show." minHeight={110} />
              <DisabledSection title="Landing page capture" reason="This ad has no landing page we could reach." minHeight={110}>
                <div className="h-14 rounded bg-muted" />
              </DisabledSection>
              <BasedOnNote ads={1} />
              <BasedOnNote ads={1234} />
              <AiSummaryBlock summary={SUMMARY} title="AI strategy summary" />
              <AiSummaryBlock summary={SUMMARY} disabledReason="Not enough analysed ads in this scope." />
            </Block>
          </div>

          <Block title="Trend charts" note="Unit label, tooltip with date range + count, change chip, latest bucket emphasised. Sparklines for table rows.">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <TrendBars series={SERIES} title="Up" basedOn={TOTAL} height={130} />
              <TrendBars series={SERIES_NEW} title="New this period" basedOn={24} height={130} />
              <TrendBars series={SERIES_EMPTY} title="All zero" height={130} />
            </div>
            <Row label="Sparklines">
              <TrendSpark series={SERIES} /><TrendSpark series={SERIES_NEW} /><TrendSpark series={SERIES_DOWN} /><TrendSpark series={SERIES_EMPTY} />
            </Row>
          </Block>

          <Block title="KPI row" note="Responsive wrap; disabled tile carries its reason. Below: dense (collapsed overview) look.">
            <KpiRow kpis={KPIS_PARTIAL} />
            <KpiRow kpis={KPIS.slice(0, 4)} dense />
          </Block>

          <Block title="Detail overlay" note="Right-anchored, Esc / X only (outside click never closes), focus trapped. Nested opens show a back chip.">
            <Row label="Open">
              <button type="button" className="h-8 rounded-md border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground"
                onClick={() => detail.push({ kind: "element", elementType: "hook", id: "curiosity-question" })}>
                Open hook overlay (URL stack)
              </button>
              <button type="button" className="h-8 rounded-md border border-border bg-card px-3 text-sm"
                onClick={() => detail.push({ kind: "advertiser", advertiserKind: "page", id: "mamaearth" })}>
                Open page overlay
              </button>
              <button type="button" className="h-8 rounded-md border border-border bg-card px-3 text-sm" onClick={() => setOverlayDemo(true)}>
                Open long-title overlay (local state)
              </button>
            </Row>
          </Block>
        </>
      )}
    </div>
  );

  return (
    <>
      <InsightsPageLayout
        title="Kit preview"
        count={resultTotal}
        countNoun="ads"
        headerActions={
          <div role="group" aria-label="Preview state" className="inline-flex rounded-md border border-border bg-card p-0.5">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                aria-pressed={mode === m.key}
                onClick={() => setMode(m.key)}
                className={`h-7 rounded px-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  mode === m.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        }
        scopeBar={(compact) => (
          <ScopeBar
            scope={scope}
            onChange={setScope}
            industries={mode === "empty" ? INDUSTRIES.map((i) => ({ ...i, count: 0 })) : INDUSTRIES}
            categories={CATEGORIES}
            totalCount={total}
            compact={compact}
            myPrefsToggle={{ checked: scope.myPrefsOnly, onChange: (v) => setScope({ myPrefsOnly: v }), count: 312 }}
          />
        )}
        tabs={
          <PageTabs
            aria-label="Preview tabs"
            tabs={[
              { key: "domain", label: "Domain", count: 947 },
              { key: "page", label: "Page", count: 1203 },
              { key: "lp", label: "LP & Offers", count: 1530 },
              { key: "empty", label: "Empty tab", count: 0 },
            ]}
          />
        }
        overview={mode === "loading" ? undefined : overview}
        chips={mode === "loading" ? undefined : chips}
        list={list}
      />

      <ViewMoreModal groups={groups} selected={tags.selected} onToggle={tags.toggle} onClearGroup={tags.clearGroup} />

      <DetailOverlay
        open={detail.stack.length > 0}
        title={topOfStack ? (topOfStack.id.length > 40 ? topOfStack.id : topOfStack.id.replace(/-/g, " ")) : ""}
        typeLabel={topOfStack ? targetLabel(topOfStack).split(":")[0] : ""}
        subtitle="Overlay body is built by Phase-2 agents; this is the shell."
        backLabel={backTarget ? targetLabel(backTarget) : undefined}
        onBack={backTarget ? detail.pop : undefined}
        onClose={detail.close}
        actions={topOfStack ? <ElementActions target={{ type: typeOf(topOfStack), id: topOfStack.id }} /> : null}
      >
        <OverlaySection title="Where it works" basedOn={812} action={<span className="text-xs text-primary-text">View all</span>}>
          <div className="flex flex-wrap gap-2">
            <ElementChip type="hook" id="shock-stat" label="Shock stat" />
            <ElementChip type="framework" id="pas" label="PAS" />
            <ElementChip type="domain" id="napchief.com" label="napchief.com" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Click a chip: it pushes a deeper level and a back chip appears.</p>
        </OverlaySection>
        <OverlaySection title="Works well with" disabledReason="Fewer than 5 ads use this item, so pairings aren't reliable yet." minHeight={110} />
        <OverlaySection title="Top ads">
          <div className="h-[900px] rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            Tall filler to prove the body scrolls on its own.
          </div>
        </OverlaySection>
      </DetailOverlay>

      <DetailOverlay
        open={overlayDemo}
        title={LONG_NAME}
        typeLabel="Landing page"
        subtitle={`Seen on ${fmtInt(1840)} ads across 62 competitors`}
        onClose={() => setOverlayDemo(false)}
      >
        <OverlaySection title="Page capture" basedOn={1840}>
          <p className="text-sm text-muted-foreground">Local-state overlay with a 100+ character title.</p>
        </OverlaySection>
      </DetailOverlay>
    </>
  );
}
