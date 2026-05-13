import { useMemo } from "react";
import {
  Check, Sparkles, Plus, X, Link as LinkIcon, Pencil,
  ShoppingBag, Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StepNav } from "../components/StepNav";

interface DoneProps {
  mode: "ecom" | "affiliate";
  brandName?: string;
  category?: string;
  industry?: string;
  platforms?: string[];
  refUrls?: string[];
  onBack: () => void;
  onStart: () => void;
  onRestart: () => void;
}

const SAMPLE_PRODUCTS = [
  { name: "Classic Tee", price: "$32", status: "In stock" },
  { name: "Linen Jacket", price: "$118", status: "In stock" },
  { name: "Slim Trousers", price: "$74", status: "In stock" },
  { name: "Everyday Sneaker", price: "$95", status: "Low stock" },
  { name: "Canvas Cap", price: "$28", status: "In stock" },
  { name: "Tote Bag", price: "$56", status: "In stock" },
] as const;

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

const BRAND_COLORS = ["#d8d4cf", "#a8a097", "#5b5247", "#111111"];
const CATEGORIES = ["Apparel", "Accessories", "Footwear"];
const BRAND_KEYWORDS = ["sustainable", "minimal", "everyday", "premium"];

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
        {label}
      </p>
      <p className="text-[15px] font-semibold text-foreground mt-1">{children}</p>
    </div>
  );
}

function SectionCard({
  title,
  action,
  description,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 mt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
          {title}
        </p>
        {action}
      </div>
      {description && (
        <p className="text-[13px] text-muted-foreground mt-2">{description}</p>
      )}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function Done({
  mode,
  brandName,
  category,
  industry,
  platforms = [],
  refUrls = [],
  onBack,
  onStart,
  onRestart,
}: DoneProps) {
  const isEcom = mode === "ecom";

  const displayName = useMemo(
    () => (isEcom ? brandName || "Aurora Apparel" : category || "Auto Insurance"),
    [isEcom, brandName, category],
  );

  const competitors = isEcom ? ECOM_COMPETITORS : AFFILIATE_COMPETITORS;

  return (
    <div className="min-h-full bg-background">
      {/* Lime celebration band */}
      <div className="h-2 bg-primary border-b border-border" />

      <StepNav
        active={3}
        onBack={onBack}
        backLabel="Back to Input"
        onRestart={onRestart}
      />

      <div className="max-w-[720px] mx-auto px-6 py-6 pb-20">
        {/* Done header */}
        <div className="text-center mt-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-6 w-6" strokeWidth={3} />
          </div>
          <h1 className="text-2xl md:text-[32px] font-semibold tracking-tight mt-4">
            {isEcom ? "Brand" : "Category"}{" "}
            <span className="bg-primary/30 px-1.5 rounded">Ready!</span>
          </h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            {isEcom
              ? "Your brand has been analyzed and is ready for generation."
              : "Your affiliate category has been analyzed and is ready for generation."}
          </p>
        </div>

        {/* Summary card */}
        <div className="rounded-2xl border border-border bg-card p-7 mt-7">
          {isEcom ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <Field label="Brand">{displayName}</Field>
                <Field label="Products found">24 products</Field>
                <Field label="Platform">Shopify</Field>
                <Field label="Language">English (US)</Field>
              </div>
              <div className="border-t border-border my-6" />
              <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                Detected style
              </p>
              <div className="flex items-center gap-4 mt-2.5">
                <div className="flex gap-1.5">
                  {BRAND_COLORS.map((c) => (
                    <span
                      key={c}
                      className="h-6 w-6 rounded-full border border-border shadow-sm"
                      style={{ background: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
                <span className="text-[14px] font-semibold text-foreground">
                  Modern · Clean
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mt-6">
                <Field label="Tone of voice">Friendly · Confident</Field>
                <Field label="Target audience">25–40, Urban</Field>
                <Field label="Price range">$25 – $120</Field>
                <Field label="Logo">
                  <span className="inline-flex items-center gap-1.5">
                    Extracted <Check className="h-3.5 w-3.5 text-primary" />
                  </span>
                </Field>
              </div>

              <div className="mt-6">
                <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                  Top categories
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CATEGORIES.map((c) => (
                    <Badge key={c} variant="secondary" className="rounded-full">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                  Brand keywords
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {BRAND_KEYWORDS.map((t) => (
                    <Badge key={t} variant="secondary" className="rounded-full">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <Field label="Category">{displayName}</Field>
                <Field label="Industry">{industry || "Insurance"}</Field>
                <Field label="Reference URLs">{refUrls.length || 3} added</Field>
                <Field label="Detected tone">Trustworthy · Direct</Field>
              </div>
              <div className="border-t border-border my-6" />
              <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                Platforms
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {(platforms.length ? platforms : ["Instagram", "TikTok"]).map(
                  (p) => (
                    <Badge key={p} variant="secondary" className="rounded-full">
                      {p}
                    </Badge>
                  ),
                )}
              </div>

              <div className="border-t border-border my-6" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <Field label="Target audience">Homeowners, 30–55</Field>
                <Field label="Est. search volume">~45K / mo</Field>
                <Field label="Offer / payout">$50 CPA avg</Field>
                <Field label="Regulated content">Yes · review required</Field>
              </div>

              <div className="mt-6">
                <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                  Suggested angles
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {AFFILIATE_ANGLES.map((t) => (
                    <Badge key={t} variant="secondary" className="rounded-full">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                  Keywords we'll target
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {AFFILIATE_KEYWORDS.map((t) => (
                    <Badge key={t} variant="secondary" className="rounded-full">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sample products (ecom only) OR Reference URLs (affiliate only) */}
        {isEcom ? (
          <SectionCard
            title="Sample products fetched · 6 of 24"
            action={
              <Button variant="link" size="sm" className="h-auto p-0 text-[12px]">
                View all →
              </Button>
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {SAMPLE_PRODUCTS.map((p) => (
                <div
                  key={p.name}
                  className="rounded-xl border border-border bg-background overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-muted-foreground/60" />
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="text-[12px] font-semibold text-foreground truncate">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {p.price} · {p.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-4 font-mono">
              ↗ Fetched from: yourstore.com/products
            </p>
          </SectionCard>
        ) : (
          <SectionCard
            title="Reference URLs collected"
            action={
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-[12px] gap-1"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            }
          >
            <div className="space-y-2">
              {(refUrls.length
                ? refUrls.map((url, i) => ({
                    url,
                    tag: i === 0 ? "competitor" : i === 1 ? "your content" : "offer page",
                  }))
                : [
                    { url: "https://example-competitor.com/quotes", tag: "competitor" },
                    { url: "https://yoursite.com/auto-insurance-guide", tag: "your content" },
                    { url: "https://offer-partner.com/landing/save-40", tag: "offer page" },
                  ]
              ).map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background px-3.5 py-2.5"
                >
                  <LinkIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[13px] text-foreground flex-1 truncate font-mono">
                    {r.url}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] rounded-full px-2 py-0 h-5"
                  >
                    {r.tag}
                  </Badge>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Competitors */}
        <SectionCard
          title={isEcom ? "Competitors" : "Top competitors in this niche"}
          action={
            <Button variant="outline" size="sm" className="gap-1 text-[12px] h-7">
              <Plus className="h-3 w-3" />
              Add competitor
            </Button>
          }
          description={
            isEcom
              ? "Similar brands we found — use them for reference or comparison ads."
              : "Brands running ads in your category — we'll learn from their winning angles."
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                <Badge
                  variant="secondary"
                  className="text-[9px] rounded-full px-1.5 py-0 h-4 shrink-0"
                >
                  {c.name === "State Farm" ? "1" : "2"} tracked
                </Badge>
                <button
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  aria-label={`Remove ${c.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Primary CTA */}
        <Button
          onClick={onStart}
          size="lg"
          className="w-full mt-7 gap-2 h-12 text-[15px] font-semibold"
        >
          <Sparkles className="h-4 w-4" />
          Start Creating
        </Button>
        <div className="flex justify-center items-center gap-5 mt-3.5 text-[13px]">
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
