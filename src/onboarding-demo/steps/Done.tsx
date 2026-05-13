import {
  Check, Sparkles, Plus, X, Pencil,
  ShoppingBag, Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StepNav } from "../components/StepNav";

interface DoneProps {
  mode: "ecom" | "affiliate";
  brandUrl?: string;
  category?: string;
  onBack: () => void;
  onStart: () => void;
  onRestart: () => void;
}

/* ── Shared sample data ── */

const ECOM_COMPETITORS = [
  { initial: "A", name: "Aritzia", desc: "Apparel · Tracking: Ad creatives, Visual style" },
  { initial: "E", name: "Everlane", desc: "Apparel · Tracking: Messaging, Social posts" },
  { initial: "U", name: "Uniqlo", desc: "Apparel · Tracking: Promotions, Pricing" },
  { initial: "C", name: "COS", desc: "Apparel · Tracking: Visual style, Product launches" },
] as const;

const AFFILIATE_COMPETITORS = [
  { initial: "P", name: "Progressive", desc: "Insurance · Tracking: Ad creatives, Messaging" },
  { initial: "G", name: "GEICO", desc: "Insurance · Tracking: Video ads, Humor" },
  { initial: "L", name: "Lemonade", desc: "Insurance · Tracking: Social posts, UGC" },
  { initial: "S", name: "State Farm", desc: "Insurance · Tracking: Brand ads" },
] as const;

const BRAND_COLORS = [
  { hex: "#d8d4cf", name: "Sand" },
  { hex: "#a8a097", name: "Stone" },
  { hex: "#5b5247", name: "Bark" },
  { hex: "#111111", name: "Ink" },
] as const;

const AFFILIATE_ANGLES = [
  "Price savings",
  "Switching made easy",
  "Customer testimonials",
  "Comparison",
  "Urgency / limited",
];

const AFFILIATE_KEYWORDS = [
  "cheap car insurance",
  "compare quotes",
  "switch & save",
  "best rates 2026",
];

/* ── Helpers ── */

function hostname(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  const stripped = url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  return stripped || fallback;
}

/* ── Field row — snake_case mono label + value ── */
function Field({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-1 items-baseline">
      <p className="text-[11px] font-mono text-muted-foreground tabular-nums">
        {label}:
      </p>
      <div
        className={mono
          ? "text-[13px] font-mono text-foreground break-all"
          : "text-[13px] text-foreground leading-relaxed"}
      >
        {children}
      </div>
    </div>
  );
}

function PillRow({ items }: { items: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <Badge
          key={t}
          variant="secondary"
          className="rounded-full text-[11px] font-normal"
        >
          {t}
        </Badge>
      ))}
    </div>
  );
}

function CompetitorsCard({
  mode,
}: {
  mode: "ecom" | "affiliate";
}) {
  const competitors = mode === "ecom" ? ECOM_COMPETITORS : AFFILIATE_COMPETITORS;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 mt-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[11px] font-mono text-muted-foreground">
          competitors:
        </p>
        <Button variant="outline" size="sm" className="gap-1 text-[12px] h-7">
          <Plus className="h-3 w-3" />
          Add competitor
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {competitors.map((c) => (
          <div
            key={c.name}
            className="rounded-xl border border-border bg-background px-3 py-2.5 flex items-center gap-3"
          >
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[13px] font-semibold text-foreground shrink-0">
              {c.initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate">
                {c.name}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {c.desc}
              </p>
            </div>
            <button
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              aria-label={`Remove ${c.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Done step ── */
export function Done({
  mode,
  brandUrl,
  category,
  onBack,
  onStart,
  onRestart,
}: DoneProps) {
  const isEcom = mode === "ecom";

  const brandHost = hostname(brandUrl, "aurora-apparel.com");
  const brandName = brandHost
    .replace(/^www\./, "")
    .split(".")[0]
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="bg-background">
      {/* Lime celebration band */}
      <div className="h-2 bg-primary border-b border-border" />

      <StepNav
        active={3}
        onBack={onBack}
        backLabel="Back to Input"
        onRestart={onRestart}
      />

      <div className="max-w-[640px] mx-auto px-6 pt-2 pb-10">
        {/* Done header */}
        <div className="text-center mt-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-6 w-6" strokeWidth={3} />
          </div>
          <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight mt-4">
            {isEcom ? "Brand" : "Category"}{" "}
            <span className="bg-primary/30 px-1.5 rounded">Ready!</span>
          </h1>
          <p className="text-[13px] text-muted-foreground mt-2">
            {isEcom
              ? "Your brand has been analyzed and is ready for generation."
              : "Your affiliate category has been analyzed and is ready for generation."}
          </p>
        </div>

        {/* Summary card — strict field list per mode */}
        <div className="rounded-2xl border border-border bg-card p-5 mt-6 space-y-3">
          {isEcom ? (
            <>
              <Field label="brand_name">
                <span className="font-semibold">{brandName}</span>
              </Field>
              <Field label="brand_description">
                Premium everyday apparel made in small batches. Sustainable
                materials, modern silhouettes, honest pricing.
              </Field>
              <Field label="brand_voice">Friendly · Confident</Field>
              <Field label="brand_logo_url" mono>
                {brandHost}/logo.svg
              </Field>
              <Field label="brand_url" mono>
                {brandHost}
              </Field>
              <Field label="brand_colors">
                <div className="flex flex-wrap items-center gap-2.5">
                  {BRAND_COLORS.map((c) => (
                    <span
                      key={c.hex}
                      className="inline-flex items-center gap-1.5"
                    >
                      <span
                        className="h-5 w-5 rounded-md border border-border shadow-sm"
                        style={{ background: c.hex }}
                        aria-label={c.name}
                      />
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {c.hex}
                      </span>
                    </span>
                  ))}
                </div>
              </Field>
              <Field label="typography">
                <span className="font-mono">Inter · Inter Mono</span>
              </Field>
              <Field label="target_audiences">
                25–40, Urban · Style-forward
              </Field>
            </>
          ) : (
            <>
              <Field label="category">
                <span className="font-semibold">
                  {category ?? "Auto Insurance"}
                </span>
              </Field>
              <Field label="category_description">
                High-volume affiliate category with rich comparison-shop
                angles. Regulated content — disclaimers required — but
                steady CPA payouts and warm-buyer intent.
              </Field>
              <Field label="target_audience">
                Homeowners, 30–55 · Cost-sensitive
              </Field>
              <Field label="suggested_angles">
                <PillRow items={AFFILIATE_ANGLES} />
              </Field>
              <Field label="target_keywords">
                <PillRow items={AFFILIATE_KEYWORDS} />
              </Field>
            </>
          )}
        </div>

        <CompetitorsCard mode={mode} />

        {/* Primary CTA */}
        <Button
          onClick={onStart}
          size="lg"
          className="w-full mt-6 gap-2 h-12 text-[15px] font-semibold"
        >
          <Sparkles className="h-4 w-4" />
          Start Creating
        </Button>
        <div className="flex justify-center items-center gap-5 mt-3.5 text-[12px]">
          <button
            onClick={onRestart}
            className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            {isEcom ? (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                Re-analyze brand
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                Re-analyze category
              </>
            )}
          </button>
          <span className="text-muted-foreground/40">·</span>
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit inputs
          </button>
        </div>
      </div>
    </div>
  );
}
