import { useMemo } from "react";
import {
  Boxes,
  Check,
  CircleUserRound,
  GalleryHorizontalEnd,
  Image as ImageIcon,
  Images,
  Layers,
  Link as LinkIcon,
  Minus,
  PackageSearch,
  Play,
  Plus,
  ShoppingBag,
  Sparkles,
  Video as VideoIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLaunchFlow } from "@/launch2/store/launchFlowStore";
import { creativeAssets } from "@/launch2/mocks";
import { computeBudget } from "@/launch2/lib/budget";
import { formatCurrency } from "@/launch2/lib/format";
import { getPreset } from "@/launch2/lib/strategyPresets";
import type { AdType, CreativeSource } from "@/launch2/types";
import { AdvancedDrawer, SectionHeader, Thumb } from "@/launch2/components";

/* ───────────────────────── Constants ───────────────────────── */

const AD_TYPES: { key: AdType; label: string; icon: typeof ImageIcon; hint: string }[] = [
  { key: "image", label: "Image", icon: ImageIcon, hint: "Single static image per ad — the workhorse format." },
  { key: "video", label: "Video", icon: VideoIcon, hint: "Single video per ad. Best for UGC, reels, demos." },
  { key: "carousel", label: "Carousel", icon: GalleryHorizontalEnd, hint: "2–10 swipeable cards in one ad — multi-product or storytelling." },
  { key: "collection", label: "Collection", icon: Boxes, hint: "Hero media over a product grid with an instant-experience landing." },
  { key: "flexible", label: "Flexible", icon: Layers, hint: "Mixed assets in one pool — Meta picks the best combo per impression." },
  { key: "catalogue", label: "Catalogue", icon: ShoppingBag, hint: "Dynamic creative from your product feed — no manual upload." },
  { key: "partnership", label: "Partnership", icon: CircleUserRound, hint: "Branded-content / partnership ad run from a creator's handle." },
];

const SOURCES: { key: CreativeSource; label: string; icon: typeof ImageIcon }[] = [
  { key: "upload", label: "Upload", icon: Plus },
  { key: "drive", label: "Drive", icon: Boxes },
  { key: "library", label: "Library", icon: Images },
  { key: "folder", label: "Folder", icon: Layers },
  { key: "postid", label: "Post-ID", icon: LinkIcon },
  { key: "reports", label: "Reports", icon: GalleryHorizontalEnd },
  { key: "product", label: "Product", icon: PackageSearch },
];

const CTA_OPTIONS = ["Shop now", "Learn more", "Sign up", "Get offer"];

/* ───────────────────────── Stepper ───────────────────────── */

function Stepper({
  value,
  min = 1,
  max = 99,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  label: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-background" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
        className="flex h-9 w-9 items-center justify-center rounded-l-md text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(clamp(parseInt(e.target.value, 10) || min))}
        aria-label={label}
        className="h-9 w-14 border-x border-border bg-transparent text-center font-g6-mono text-sm font-semibold tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
        className="flex h-9 w-9 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ───────────────────────── Step 4 ───────────────────────── */

export function Step4Creative() {
  const { state, dispatch } = useLaunchFlow();

  const preset = getPreset(state.strategy);
  const strategyLabel = preset?.label ?? "default";
  const budget = computeBudget(state);

  // Catalogue mode forces the catalogue ad type and skips manual creative.
  const catalogueMode = state.useCatalogue;
  const effectiveAdType: AdType = catalogueMode ? "catalogue" : state.adType;

  const activeTypeHint = AD_TYPES.find((t) => t.key === effectiveAdType)?.hint ?? "";

  const visibleAssets = useMemo(() => creativeAssets, []);
  const noCreative = !catalogueMode && state.creativeIds.length === 0;

  return (
    <div className="space-y-8 font-g6-sans">
      <header>
        <h1 className="font-g6-sans text-xl font-semibold text-foreground">Assets + structure</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick the format and creatives, write one copy set, and shape the 1 : N : M structure this launch builds.
        </p>
      </header>

      {/* ── Ad type ── */}
      <section>
        <SectionHeader
          title="Ad type"
          sub={catalogueMode ? "Catalogue is locked on — it's set by your dynamic-feed choice in Step 3." : "What format each ad takes."}
        />
        {catalogueMode ? (
          <div className="flex items-start gap-3 rounded-lg border border-primary bg-primary/5 px-4 py-3 ring-1 ring-primary">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-md bg-background text-foreground">
              <ShoppingBag className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Catalogue <span className="font-g6-mono text-xs font-normal text-muted-foreground">· locked</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Dynamic creative from your product feed (single / carousel) — no manual upload.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {AD_TYPES.map((t) => {
              const active = state.adType === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => dispatch({ type: "SET_ADTYPE", adType: t.key })}
                  aria-pressed={active}
                  title={t.hint}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-colors",
                    active
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        )}
        {activeTypeHint && (
          <p className="mt-2 text-xs text-muted-foreground">{activeTypeHint}</p>
        )}
      </section>

      {catalogueMode ? (
        /* ── Catalogue read-only panel (replaces source + picker) ── */
        <section>
          <SectionHeader title="Dynamic creative" sub="Generated from your catalog feed at delivery." />
          <div className="space-y-3 rounded-lg border border-dashed border-border bg-card/50 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <PackageSearch className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Dynamic creative from your product feed</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Single image or carousel is auto-assembled per product — no manual upload, no per-asset selection.
                </p>
              </div>
            </div>
            <p className="rounded-md bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              Each ad pulls product image, title, and price from the catalog. Your copy set below wraps the dynamic
              card as the primary text + headline template.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* ── Source ── */}
          <section>
            <SectionHeader title="Source" sub="Where the creatives come from." />
            <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-card p-1">
              {SOURCES.map((s) => {
                const active = state.creativeSource === s.key;
                const Icon = s.icon;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => dispatch({ type: "SET_CREATIVE_SOURCE", source: s.key })}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Creative picker ── */}
          <section>
            <SectionHeader
              title="Creatives"
              sub={`Multi-select — tap to add. Showing assets across sources (filtered by ${SOURCES.find((s) => s.key === state.creativeSource)?.label ?? "source"} when wired).`}
              action={
                <span className="font-g6-mono text-xs text-muted-foreground">
                  {state.creativeIds.length} selected
                </span>
              }
            />
            {noCreative && (
              <p className="mb-3 flex items-center gap-1.5 rounded-md border border-dashed border-border bg-card/50 px-3 py-2 text-xs text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" />
                No creative selected yet — pick at least one to build ads. Pre-flight will warn on an empty selection.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visibleAssets.map((asset) => {
                const selected = state.creativeIds.includes(asset.id);
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => dispatch({ type: "TOGGLE_CREATIVE", creativeId: asset.id })}
                    aria-pressed={selected}
                    className={cn(
                      "group relative overflow-hidden rounded-lg border text-left transition-colors",
                      selected ? "border-primary ring-2 ring-primary" : "border-border hover:border-foreground/30"
                    )}
                  >
                    <div className="relative">
                      <Thumb src={asset.thumbUrl} seed={asset.id} alt={asset.name} className="aspect-[4/5] w-full" />
                      {asset.kind === "video" && (
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                          <Play className="h-2.5 w-2.5 fill-current" />
                          Video
                        </span>
                      )}
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div className="bg-card px-2.5 py-2">
                      <p className="truncate text-xs font-medium text-foreground">{asset.name}</p>
                      <p className="mt-0.5 font-g6-mono text-[10px] text-muted-foreground">
                        {asset.ratio ?? "—"} · {asset.kind}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* ── Copy set ── */}
      <section>
        <SectionHeader
          title="Copy set"
          sub="One set wraps every ad in this launch. Add variants in Advanced."
        />
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Primary text</span>
            <Textarea
              value={state.copy.primaryText}
              onChange={(e) => dispatch({ type: "PATCH_COPY", copy: { primaryText: e.target.value } })}
              placeholder="The main body copy that appears above the creative."
              className="min-h-[90px]"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Headline</span>
              <Input
                value={state.copy.headline}
                onChange={(e) => dispatch({ type: "PATCH_COPY", copy: { headline: e.target.value } })}
                placeholder="Short, punchy hook"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Description</span>
              <Input
                value={state.copy.description}
                onChange={(e) => dispatch({ type: "PATCH_COPY", copy: { description: e.target.value } })}
                placeholder="Optional sub-line"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Call to action</span>
              <Select
                value={state.copy.cta}
                onValueChange={(v) => dispatch({ type: "PATCH_COPY", copy: { cta: v } })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a CTA" />
                </SelectTrigger>
                <SelectContent>
                  {CTA_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Destination URL</span>
              <Input
                type="url"
                value={state.copy.destinationUrl}
                onChange={(e) => dispatch({ type: "PATCH_COPY", copy: { destinationUrl: e.target.value } })}
                placeholder="https://…"
                className="font-g6-mono text-xs"
              />
            </label>
          </div>
        </div>
      </section>

      {/* ── Structure builder (1 : N : M) ── */}
      <section>
        <SectionHeader
          title="Structure"
          sub={`Volume auto-set from your ${strategyLabel} playbook — editable.`}
        />
        <div className="rounded-lg border border-border bg-card p-4">
          {/* Visual tree */}
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {/* Campaign */}
            <div className="flex flex-1 flex-col items-center rounded-lg border border-border bg-background px-4 py-3 text-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-foreground">
                <Sparkles className="h-4 w-4" />
              </span>
              <p className="mt-1.5 text-sm font-semibold text-foreground">1 Campaign</p>
              <p className="font-g6-mono text-[10px] text-muted-foreground">
                {state.budgetLevel === "campaign" ? "CBO" : "ABO"}
              </p>
            </div>

            <span className="hidden text-muted-foreground sm:block">→</span>

            {/* Ad sets */}
            <div className="flex flex-1 flex-col items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Layers className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold text-foreground">
                <span className="font-g6-mono tabular-nums">{state.adsetCount}</span> Ad sets
              </p>
              <Stepper
                value={state.adsetCount}
                min={1}
                max={250}
                onChange={(n) => dispatch({ type: "PATCH", patch: { adsetCount: n } })}
                label="Ad set count"
              />
            </div>

            <span className="hidden text-muted-foreground sm:block">→</span>

            {/* Creatives per ad set */}
            <div className="flex flex-1 flex-col items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Images className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold text-foreground">
                <span className="font-g6-mono tabular-nums">{state.creativesPerAdset}</span> Creatives / set
              </p>
              <Stepper
                value={state.creativesPerAdset}
                min={1}
                max={20}
                onChange={(n) => dispatch({ type: "PATCH", patch: { creativesPerAdset: n } })}
                label="Creatives per ad set"
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Creatives are auto-mapped evenly across ad sets. Manual per-ad-set mapping lives in Advanced.
          </p>

          {/* Live budget total */}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Ad sets</p>
              <p className="font-g6-mono text-lg font-bold tabular-nums text-foreground">{budget.totalAdsets}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total ads</p>
              <p className="font-g6-mono text-lg font-bold tabular-nums text-foreground">{budget.totalAds}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Daily spend</p>
              <p className="font-g6-mono text-lg font-bold tabular-nums text-foreground">
                {formatCurrency(budget.dailyTotal)}
                <span className="text-xs font-normal text-muted-foreground">/day</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Advanced ── */}
      <AdvancedDrawer label="Advanced creative" hint="Copy variants · Post-ID · partnership · ratio overrides">
        {/* Copy mix-match */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Copy variants (mix-match)
          </p>
          <p className="mb-2 text-xs text-muted-foreground">
            Add multiple headline / primary-text variants; Meta rotates them within each ad. (Mock — wires to the
            base copy set above.)
          </p>
          <div className="space-y-2">
            <Input defaultValue={state.copy.headline} placeholder="Headline variant 2" />
            <Input placeholder="Headline variant 3" />
            <Textarea placeholder="Primary text variant 2" className="min-h-[60px]" />
          </div>
        </div>

        {/* Post-ID */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <LinkIcon className="h-3.5 w-3.5" />
            Existing post (Post-ID)
          </p>
          <Input placeholder="e.g. 1203928... — reuse a post to carry social proof" className="font-g6-mono text-xs" />
          <p className="mt-1 text-xs text-muted-foreground">
            When set, ads reference the existing post instead of a fresh creative.
          </p>
        </div>

        {/* Partnership / branded content */}
        <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2.5">
          <div className="flex items-center gap-2">
            <CircleUserRound className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Partnership / branded content</p>
              <p className="text-xs text-muted-foreground">Run ads from a creator's handle with the partnership label.</p>
            </div>
          </div>
          <Switch
            defaultChecked={state.adType === "partnership"}
            aria-label="Partnership ad"
          />
        </div>

        {/* Per-ad-set ratio overrides */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Per-ad-set ratio overrides
          </p>
          <p className="mb-2 text-xs text-muted-foreground">
            Override which creative ratio each ad set leans on (mock). Default: auto-mapped evenly.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {["4:5", "1:1", "9:16", "16:9"].map((r) => (
              <label
                key={r}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
              >
                <input type="checkbox" defaultChecked className="h-3.5 w-3.5 accent-[hsl(var(--primary))]" />
                <span className="font-g6-mono text-foreground">{r}</span>
              </label>
            ))}
          </div>
        </div>
      </AdvancedDrawer>
    </div>
  );
}
