import { type ReactNode, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpRight, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { DotGridPattern } from "../components/DotGridPattern";
import { HeroPromptInput } from "../components/HeroPromptInput";
import { HorizontalScrollStrip } from "../components/HorizontalScrollStrip";
import { MicroMotif } from "../components/MicroMotif";
import { OutputCard } from "../components/OutputCard";
import { modeConfigs } from "../generate/modeConfigs";
import { analyticsAgency } from "../mocks/analytics";
import { sampleOutputs } from "../mocks/sample-outputs";

// NOTE: Persona toggle (Agency / Solo) intentionally removed from UI.
// Personas remain a useful internal lens (for analytics, content prioritization, etc.)
// but are NOT exposed to the user. Both Wizard + Form modes available to everyone.
// See plan: redo-all-this-stuff-tidy-rain.md § Track 4.1.

// ─────────────────────────────────────────────────────────
// Home (populated or zero-data)
// ─────────────────────────────────────────────────────────

export function Home() {
  const [searchParams] = useSearchParams();
  const isEmpty = searchParams.get("empty") === "1";
  return isEmpty ? <HomeZeroData /> : <HomePopulated />;
}

// ─────────────────────────────────────────────────────────
// ZERO-DATA — modern hero treatment
// ─────────────────────────────────────────────────────────

function HomeZeroData() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const handlePrompt = () => {
    if (!prompt.trim()) return;
    navigate("/iq/genie6/generate/product-ad");
  };

  return (
    <div className="relative flex min-h-full flex-col">
      <DotGridPattern />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-12 px-6 py-20">
        {/* Hero */}
        <header className="g6-fade-up space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-g6-pill border border-g6-primary-border bg-g6-primary-bg px-3 py-1">
            <Sparkles className="h-3 w-3 text-g6-primary" />
            <span className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-secondary">
              winner-first ai ad generator
            </span>
          </div>
          <h1 className="font-g6-sans text-g6-display font-black tracking-[-0.03em] text-g6-text">
            Welcome to <span className="text-g6-primary">Genie 6</span>
          </h1>
          <p className="text-g6-lg text-g6-text-secondary leading-relaxed max-w-xl">
            Make winning ads in under 60 seconds — for any brand, any format, any audience.
          </p>
        </header>

        <div className="g6-fade-up" style={{ animationDelay: "120ms" }}>
          <HeroPromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handlePrompt}
            placeholder="paste a product URL or describe what you want to generate"
            size="lg"
          />
        </div>

        {/* Setup nudges */}
        <div className="g6-fade-up grid grid-cols-1 gap-3 sm:grid-cols-2" style={{ animationDelay: "240ms" }}>
          <NudgeCard
            title="Add your first brand"
            sub="2 min · URL fetch"
            cta="Start"
            onClick={() => navigate("/iq/genie6/settings/brands")}
            featured
          />
          <NudgeCard
            title="Try with a demo brand"
            sub="Instant · 0 credits"
            cta="Try demo"
            onClick={() => navigate("/iq/genie6/generate/product-ad?demo=1")}
          />
        </div>

        {/* Starter pack */}
        <div className="g6-fade-up rounded-g6-2xl border border-g6-primary-border bg-g6-primary-bg p-6 space-y-3" style={{ animationDelay: "360ms" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-g6-h4 font-bold text-g6-text">
                Starter pack — 5 free generations
              </p>
              <p className="text-g6-base text-g6-text-secondary">
                Pick a mode below, paste a product URL, get 4 variants in under 60 seconds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/iq/genie6/generate")}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-g6-base bg-g6-primary px-4 py-2.5 text-g6-sm font-semibold text-g6-text-on-accent shadow-g6-primary-btn transition-transform hover:-translate-y-0.5"
            >
              Start guided <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mode chips */}
        <div className="g6-fade-up space-y-3" style={{ animationDelay: "480ms" }}>
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
            Or pick a mode
          </p>
          <div className="flex flex-wrap gap-2">
            {modeConfigs.map((cfg) => (
              <button
                key={cfg.id}
                type="button"
                onClick={() => navigate(`/iq/genie6/generate/${cfg.id}`)}
                className="flex items-center gap-2 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container px-3 py-1.5 text-g6-sm font-medium text-g6-text-secondary transition-all hover:border-g6-primary-border hover:bg-g6-primary-bg hover:text-g6-text"
              >
                <MicroMotif mode={cfg.id} size={14} />
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NudgeCard({
  title,
  sub,
  cta,
  onClick,
  featured,
}: {
  title: string;
  sub: string;
  cta: string;
  onClick: () => void;
  featured?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "g6-lift group flex flex-col gap-2 rounded-g6-2xl border bg-g6-bg-container p-5 text-left",
        featured
          ? "border-g6-primary-border shadow-g6-md"
          : "border-g6-border-secondary"
      )}
    >
      <span className="text-g6-h5 font-bold text-g6-text">{title}</span>
      <span className="text-g6-sm text-g6-text-secondary">{sub}</span>
      <span className="mt-3 inline-flex items-center gap-1 text-g6-sm font-medium text-g6-primary">
        {cta} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// POPULATED — modern dashboard
// ─────────────────────────────────────────────────────────

function HomePopulated() {
  const navigate = useNavigate();
  const analytics = analyticsAgency;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-12 px-8 py-10">
      {/* Greeting hero */}
      <header className="g6-fade-up flex flex-col gap-2">
        <p className="font-g6-mono text-g6-xs uppercase tracking-[0.18em] text-g6-text-tertiary">
          {new Date().getHours() < 12 ? "good morning" : new Date().getHours() < 18 ? "good afternoon" : "good evening"}
        </p>
        <h1 className="font-g6-sans text-g6-h1 font-black tracking-[-0.025em] text-g6-text">
          Welcome back, Rahul
        </h1>
        <p className="text-g6-base text-g6-text-secondary">
          {analytics.activeBrands} brands active · {analytics.generationsThisMonth.count.toLocaleString("en-IN")} gens this month
        </p>
      </header>

      {/* Analytics row — dramatic asymmetric */}
      <section className="g6-fade-up grid gap-4 lg:grid-cols-5" style={{ animationDelay: "80ms" }}>
        <FeaturedTopPerformerTile analytics={analytics} className="lg:col-span-3" />
        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          <StatTile
            label="Generations"
            sublabel="this month"
            value={analytics.generationsThisMonth.count.toLocaleString("en-IN")}
            delta={`+${analytics.generationsThisMonth.deltaPct}%`}
            deltaPositive
          />
          <StatTile
            label="Credits"
            sublabel={`/ ${analytics.creditsUsed.limit.toLocaleString("en-IN")}`}
            value={analytics.creditsUsed.used.toLocaleString("en-IN")}
            progress={(analytics.creditsUsed.used / analytics.creditsUsed.limit) * 100}
          />
          <StatTile
            label="Trending"
            sublabel={analytics.trendingFinding.angleLabel}
            value={`+${analytics.trendingFinding.deltaPct}%`}
            deltaPositive
          />
          <StatTile label="Active brands" sublabel="across portfolio" value={String(analytics.activeBrands)} />
        </div>
      </section>

      {/* Mode cards */}
      <section className="g6-fade-up space-y-5" style={{ animationDelay: "160ms" }}>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-g6-h3 font-bold text-g6-text">Pick a mode</h2>
            <p className="text-g6-sm text-g6-text-tertiary">7 generation modes — tuned for ad teams</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/iq/genie6/generate")}
            className="hidden text-g6-sm text-g6-text-tertiary transition-colors hover:text-g6-text sm:inline-flex"
          >
            View all generators →
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {modeConfigs.slice(0, 4).map((cfg) => (
            <ModeCard key={cfg.id} cfg={cfg} onClick={() => navigate(`/iq/genie6/generate/${cfg.id}`)} />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modeConfigs.slice(4).map((cfg) => (
            <ModeCard key={cfg.id} cfg={cfg} onClick={() => navigate(`/iq/genie6/generate/${cfg.id}`)} />
          ))}
        </div>
      </section>

      {/* Recent generations strip */}
      <section className="g6-fade-up space-y-3" style={{ animationDelay: "240ms" }}>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-g6-h3 font-bold text-g6-text">Recent generations</h2>
            <p className="text-g6-sm text-g6-text-tertiary">Latest 7 outputs across your brands</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/iq/genie6/library/outputs")}
            className="text-g6-sm text-g6-text-tertiary transition-colors hover:text-g6-text"
          >
            View all in Library →
          </button>
        </div>
        <HorizontalScrollStrip>
          {sampleOutputs.filter((o) => o.thumbnail || o.headline).slice(0, 7).map((output) => (
            <div key={output.id} className="w-52 shrink-0 snap-start">
              <OutputCard
                {...output}
                variant="compact"
                selectable={false}
                onSave={() => {}}
                onLaunch={() => {}}
                onDownload={() => {}}
              />
            </div>
          ))}
        </HorizontalScrollStrip>
      </section>

      {/* Trending findings */}
      <section className="g6-fade-up space-y-3 pb-6" style={{ animationDelay: "320ms" }}>
        <h2 className="text-g6-h3 font-bold text-g6-text">Trending findings</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TrendingFindingCard
            icon={<TrendingUp className="h-4 w-4 text-g6-primary" />}
            label="Angle performance"
            text={`Your "${analytics.trendingFinding.angleLabel}" angle is up ${analytics.trendingFinding.deltaPct}% CTR week-over-week`}
          />
          <TrendingFindingCard
            label="From Insights"
            text="5 new winners imported. Use them in Variants?"
            action={{ label: "Open Variants", onClick: () => navigate("/iq/genie6/generate/forge") }}
          />
          <TrendingFindingCard
            label="Mode usage"
            text="UGC mode used 3× more than last month"
          />
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

function FeaturedTopPerformerTile({
  analytics,
  className,
}: {
  analytics: typeof analyticsAgency;
  className?: string;
}) {
  const { topPerformer } = analytics;

  return (
    <div
      className={cn(
        "g6-lift group relative flex flex-col overflow-hidden rounded-g6-2xl border border-g6-border-secondary bg-g6-bg-container shadow-g6-md",
        className
      )}
    >
      {topPerformer.thumbnail && (
        <div className="relative h-56 overflow-hidden">
          <img
            src={topPerformer.thumbnail}
            alt={topPerformer.product ?? topPerformer.brand}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-g6-bg-container via-g6-bg-container/40 to-transparent" />
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1 rounded-g6-pill bg-g6-primary px-2.5 py-1 font-g6-mono text-g6-xs font-semibold uppercase tracking-wider text-g6-text-on-accent">
              <Sparkles className="h-3 w-3" /> top performer
            </span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4 p-6">
        <div className="space-y-1">
          <p className="text-g6-h4 font-bold text-g6-text">
            {topPerformer.brand}
            {topPerformer.product && <span className="text-g6-text-secondary"> · {topPerformer.product}</span>}
          </p>
          <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">
            {topPerformer.mode} · Apr 28 · #{topPerformer.outputId.slice(-4).toUpperCase()}
          </p>
        </div>
        <div className="flex items-baseline gap-6">
          <Metric label="CTR" value={`${topPerformer.ctr}%`} highlight />
          <Metric label="ROAS" value={`${topPerformer.roas}×`} />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">{label}</p>
      <p
        className={cn(
          "font-g6-mono text-g6-h2 font-bold tabular-nums",
          highlight ? "text-g6-primary" : "text-g6-text"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function StatTile({
  label,
  sublabel,
  value,
  delta,
  deltaPositive,
  progress,
}: {
  label: string;
  sublabel?: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  progress?: number;
}) {
  return (
    <div className="g6-lift flex flex-col justify-between gap-3 rounded-g6-xl border border-g6-border-secondary bg-g6-bg-container p-5">
      <div>
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">{label}</p>
        {sublabel && <p className="text-g6-xs text-g6-text-tertiary">{sublabel}</p>}
      </div>
      <div className="space-y-1.5">
        <p className="font-g6-mono text-g6-h3 font-bold tabular-nums text-g6-text">{value}</p>
        {delta && (
          <p
            className={cn(
              "font-g6-mono text-g6-xs font-medium",
              deltaPositive ? "text-g6-success" : "text-g6-error"
            )}
          >
            {delta} ▲
          </p>
        )}
        {progress !== undefined && (
          <div className="h-1 w-full overflow-hidden rounded-g6-pill bg-g6-bg-spotlight">
            <div
              className="h-full rounded-g6-pill bg-g6-primary transition-all"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

type ModeCardConfig = (typeof modeConfigs)[number];

function ModeCard({ cfg, onClick }: { cfg: ModeCardConfig; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="g6-lift group flex flex-col gap-4 rounded-g6-xl border border-g6-border-secondary bg-g6-bg-container p-5 text-left"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-g6-card bg-g6-bg-spotlight transition-colors group-hover:bg-g6-primary-bg">
        <MicroMotif mode={cfg.id} size={32} />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-g6-h5 font-bold text-g6-text">{cfg.label}</h3>
        <p className="text-g6-sm text-g6-text-secondary line-clamp-2 leading-relaxed">{cfg.description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-g6-sm font-medium text-g6-text-tertiary transition-colors group-hover:text-g6-primary">
        Start <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </button>
  );
}

function TrendingFindingCard({
  icon,
  label,
  text,
  action,
}: {
  icon?: ReactNode;
  label: string;
  text: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="g6-lift flex flex-col gap-3 rounded-g6-xl border border-g6-border-secondary bg-g6-bg-container p-5">
      <div className="flex items-center gap-2">
        {icon}
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">{label}</p>
      </div>
      <p className="text-g6-sm text-g6-text leading-relaxed">{text}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-auto inline-flex items-center gap-1 self-start text-g6-sm font-medium text-g6-primary transition-opacity hover:opacity-70"
        >
          {action.label} <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
