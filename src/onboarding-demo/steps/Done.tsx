import { useEffect, useState } from "react";
import {
  Check, Sparkles, Plus, X, Pencil, Palette, Type as TypeIcon,
  Users, Crosshair, ExternalLink, Target, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepNav } from "../components/StepNav";
import { EditableText } from "../components/EditableText";
import { EditablePillRow } from "../components/EditablePillRow";
import {
  EditableColorRow,
  type BrandColor,
} from "../components/EditableColorRow";
import { cn } from "@/lib/utils";

interface DoneProps {
  mode: "ecom" | "affiliate";
  brandUrl?: string;
  category?: string;
  onBack: () => void;
  onStart: () => void;
  onRestart: () => void;
}

/* ── Sample / default values ── */

interface Competitor {
  initial: string;
  name: string;
  desc: string;
}

const ECOM_COMPETITORS_INIT: Competitor[] = [
  { initial: "A", name: "Aritzia", desc: "Apparel · Tracking: Ad creatives, Visual style" },
  { initial: "E", name: "Everlane", desc: "Apparel · Tracking: Messaging, Social posts" },
  { initial: "U", name: "Uniqlo", desc: "Apparel · Tracking: Promotions, Pricing" },
  { initial: "C", name: "COS", desc: "Apparel · Tracking: Visual style, Product launches" },
];

const AFFILIATE_COMPETITORS_INIT: Competitor[] = [
  { initial: "P", name: "Progressive", desc: "Insurance · Ad creatives, Messaging" },
  { initial: "G", name: "GEICO", desc: "Insurance · Video ads, Humor" },
  { initial: "L", name: "Lemonade", desc: "Insurance · Social posts, UGC" },
  { initial: "S", name: "State Farm", desc: "Insurance · Brand ads" },
];

const BRAND_COLORS_INIT: BrandColor[] = [
  { hex: "#d8d4cf", name: "Sand" },
  { hex: "#a8a097", name: "Stone" },
  { hex: "#5b5247", name: "Bark" },
  { hex: "#111111", name: "Ink" },
];

const ECOM_DEFAULTS = {
  brand_description:
    "Premium everyday apparel made in small batches. Sustainable materials, modern silhouettes, honest pricing.",
  brand_voice: "Friendly · Confident",
  typography_display: "Inter",
  typography_body: "Inter Mono",
  target_audiences: "25–40, Urban · Style-forward",
};

const AFFILIATE_DEFAULTS = {
  niche: "Insurance",
  category_description:
    "High-volume affiliate category with rich comparison-shop angles. Regulated content — disclaimers required — but steady CPA payouts and warm-buyer intent.",
  target_audience: "Homeowners, 30–55 · Cost-sensitive",
  suggested_angles: [
    "Price savings",
    "Switching made easy",
    "Customer testimonials",
    "Comparison",
    "Urgency / limited",
  ],
  target_keywords: [
    "cheap car insurance",
    "compare quotes",
    "switch & save",
    "best rates 2026",
  ],
};

/* ── Helpers ── */

function hostname(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  const stripped = url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  return stripped || fallback;
}

function brandNameFromHost(host: string): string {
  return host
    .replace(/^www\./, "")
    .split(".")[0]
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── Guidelines card wrapper — mirrors Catalogue brand detail ── */
function GuidelinesCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" aria-hidden />
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

/* ── Editable competitors card ── */
function CompetitorsCard({
  items,
  onChange,
}: {
  items: Competitor[];
  onChange: (next: Competitor[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState("");

  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));

  const updateName = (i: number, next: string) => {
    onChange(
      items.map((c, j) =>
        j === i
          ? {
              ...c,
              name: next,
              initial: next.charAt(0).toUpperCase() || c.initial,
            }
          : c,
      ),
    );
  };

  const updateDesc = (i: number, next: string) => {
    onChange(items.map((c, j) => (j === i ? { ...c, desc: next } : c)));
  };

  const commitNew = () => {
    const next = draftName.trim();
    if (next) {
      onChange([
        ...items,
        {
          initial: next.charAt(0).toUpperCase(),
          name: next,
          desc: "Tracking: …",
        },
      ]);
    }
    setAdding(false);
    setDraftName("");
  };

  return (
    <GuidelinesCard
      title={`Competitors · ${items.length}`}
      icon={Crosshair}
      className="col-span-full"
    >
      {adding && (
        <div className="mb-3 flex items-center gap-2">
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitNew}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setAdding(false);
                setDraftName("");
              }
              if (e.key === "Enter") {
                e.preventDefault();
                commitNew();
              }
            }}
            placeholder="Competitor name"
            className="flex-1 h-8 rounded-md border border-primary/60 bg-background px-3 text-[13px] outline-none focus:ring-2 focus:ring-primary/60"
            aria-label="New competitor name"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((c, i) => (
          <div
            key={`${c.name}-${i}`}
            className="rounded-lg border border-border/40 bg-background/50 px-3 py-2 flex items-center gap-3"
          >
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[12px] font-semibold text-foreground shrink-0">
              {c.initial}
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <EditableText
                value={c.name}
                onChange={(next) => updateName(i, next)}
                ariaLabel={`Edit ${c.name} name`}
              />
              <div className="text-[10px] text-muted-foreground truncate">
                <EditableText
                  value={c.desc}
                  onChange={(next) => updateDesc(i, next)}
                  ariaLabel={`Edit ${c.name} description`}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              aria-label={`Remove ${c.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {!adding && (
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-[11px] h-7"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3 w-3" />
            Add competitor
          </Button>
        </div>
      )}
    </GuidelinesCard>
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

  // E-com state
  const [brandName, setBrandName] = useState(brandNameFromHost(brandHost));
  const [brandDescription, setBrandDescription] = useState(
    ECOM_DEFAULTS.brand_description,
  );
  const [brandVoice, setBrandVoice] = useState(ECOM_DEFAULTS.brand_voice);
  const [brandUrlValue, setBrandUrlValue] = useState(brandHost);
  const [brandColors, setBrandColors] = useState<BrandColor[]>(BRAND_COLORS_INIT);
  const [typographyDisplay, setTypographyDisplay] = useState(
    ECOM_DEFAULTS.typography_display,
  );
  const [typographyBody, setTypographyBody] = useState(
    ECOM_DEFAULTS.typography_body,
  );
  const [targetAudiences, setTargetAudiences] = useState(
    ECOM_DEFAULTS.target_audiences,
  );

  // Affiliate state
  const [categoryValue, setCategoryValue] = useState(category ?? "Auto Insurance");
  const [niche, setNiche] = useState(AFFILIATE_DEFAULTS.niche);
  const [categoryDescription, setCategoryDescription] = useState(
    AFFILIATE_DEFAULTS.category_description,
  );
  const [targetAudience, setTargetAudience] = useState(
    AFFILIATE_DEFAULTS.target_audience,
  );
  const [suggestedAngles, setSuggestedAngles] = useState<string[]>(
    AFFILIATE_DEFAULTS.suggested_angles,
  );
  const [targetKeywords, setTargetKeywords] = useState<string[]>(
    AFFILIATE_DEFAULTS.target_keywords,
  );

  // Shared
  const [competitors, setCompetitors] = useState<Competitor[]>(
    isEcom ? ECOM_COMPETITORS_INIT : AFFILIATE_COMPETITORS_INIT,
  );

  // Reset derived fields when the input URL / category changes upstream.
  useEffect(() => {
    if (isEcom) {
      setBrandName(brandNameFromHost(brandHost));
      setBrandUrlValue(brandHost);
    } else {
      setCategoryValue(category ?? "Auto Insurance");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandHost, category, isEcom]);

  const editInputsLabel = isEcom
    ? "Start over with a different brand"
    : "Start over with a different category";

  const initials = isEcom ? initialsFromName(brandName) : "";

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

      <div className="max-w-[640px] mx-auto px-5 pt-2 pb-10 space-y-4">
        {/* Done header */}
        <div className="text-center mt-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-5 w-5" strokeWidth={3} />
          </div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight mt-3">
            {isEcom ? "Brand" : "Category"}{" "}
            <span className="bg-primary/30 px-1.5 rounded">Ready!</span>
          </h1>
          <p className="text-[12px] text-muted-foreground mt-1.5">
            {isEcom
              ? "Your brand has been analyzed and is ready for generation."
              : "Your affiliate category has been analyzed and is ready for generation."}
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">
            Click any value to edit.
          </p>
        </div>

        {/* HERO CARD — brand / category identity + description */}
        {isEcom ? (
          <div className="rounded-2xl border border-border/40 bg-card/60 p-5 backdrop-blur-sm space-y-4">
            <div className="flex items-start gap-4">
              {/* Logo placeholder — initials in a rounded box */}
              <div
                className="h-14 w-14 rounded-xl border border-border/40 bg-primary/15 inline-flex items-center justify-center text-foreground font-mono text-[16px] font-bold shrink-0"
                aria-label={`${brandName} logo`}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h2 className="text-[20px] font-bold text-foreground leading-tight">
                    <EditableText
                      value={brandName}
                      onChange={setBrandName}
                      ariaLabel="Edit brand name"
                    />
                  </h2>
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ExternalLink className="h-3 w-3" aria-hidden />
                  <EditableText
                    value={brandUrlValue}
                    onChange={setBrandUrlValue}
                    mono
                    ariaLabel="Edit brand URL"
                  />
                </div>
              </div>
            </div>
            {/* Brand description — below the logo block */}
            <div className="text-[13px] leading-relaxed text-foreground">
              <EditableText
                value={brandDescription}
                onChange={setBrandDescription}
                multiline
                ariaLabel="Edit brand description"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/40 bg-card/60 p-5 backdrop-blur-sm space-y-4">
            <div className="flex items-start gap-4">
              <div
                className="h-14 w-14 rounded-xl border border-border/40 bg-primary/15 inline-flex items-center justify-center text-foreground shrink-0"
                aria-hidden
              >
                <Target className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <h2 className="text-[20px] font-bold text-foreground leading-tight">
                  <EditableText
                    value={categoryValue}
                    onChange={setCategoryValue}
                    ariaLabel="Edit category"
                  />
                </h2>
                <div className="inline-flex items-center gap-1.5">
                  <span className="rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Affiliate
                  </span>
                  <span className="text-muted-foreground/40 text-[10px]">·</span>
                  <span className="rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground">
                    <EditableText
                      value={niche}
                      onChange={setNiche}
                      mono
                      ariaLabel="Edit niche"
                    />
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[13px] leading-relaxed text-foreground">
              <EditableText
                value={categoryDescription}
                onChange={setCategoryDescription}
                multiline
                ariaLabel="Edit category description"
              />
            </div>
          </div>
        )}

        {/* DETAIL CARDS — 2-col grid on wide, 1-col on narrow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isEcom ? (
            <>
              <GuidelinesCard title="Brand voice" icon={Sparkles}>
                <div className="text-[13px] leading-relaxed text-foreground">
                  <EditableText
                    value={brandVoice}
                    onChange={setBrandVoice}
                    ariaLabel="Edit brand voice"
                  />
                </div>
              </GuidelinesCard>

              <GuidelinesCard title="Typography" icon={TypeIcon}>
                <div className="space-y-2">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Display
                    </p>
                    <div
                      className="text-[16px] font-semibold text-foreground"
                      style={{ fontFamily: `'${typographyDisplay}', system-ui, sans-serif` }}
                    >
                      <EditableText
                        value={typographyDisplay}
                        onChange={setTypographyDisplay}
                        ariaLabel="Edit display font"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Body
                    </p>
                    <div
                      className="text-[13px] text-foreground"
                      style={{ fontFamily: `'${typographyBody}', system-ui, sans-serif` }}
                    >
                      <EditableText
                        value={typographyBody}
                        onChange={setTypographyBody}
                        ariaLabel="Edit body font"
                      />
                    </div>
                  </div>
                </div>
              </GuidelinesCard>

              <GuidelinesCard
                title="Colors"
                icon={Palette}
                className="col-span-full"
              >
                <EditableColorRow
                  items={brandColors}
                  onChange={setBrandColors}
                />
              </GuidelinesCard>

              <GuidelinesCard
                title="Target audiences"
                icon={Users}
                className="col-span-full"
              >
                <div className="text-[13px] text-foreground">
                  <EditableText
                    value={targetAudiences}
                    onChange={setTargetAudiences}
                    ariaLabel="Edit target audiences"
                  />
                </div>
              </GuidelinesCard>
            </>
          ) : (
            <>
              <GuidelinesCard
                title="Target audience"
                icon={Users}
                className="col-span-full"
              >
                <div className="text-[13px] text-foreground">
                  <EditableText
                    value={targetAudience}
                    onChange={setTargetAudience}
                    ariaLabel="Edit target audience"
                  />
                </div>
              </GuidelinesCard>

              <GuidelinesCard
                title={`Suggested angles · ${suggestedAngles.length}`}
                icon={Sparkles}
                className="col-span-full"
              >
                <EditablePillRow
                  items={suggestedAngles}
                  onChange={setSuggestedAngles}
                  addPlaceholder="New angle"
                />
              </GuidelinesCard>

              <GuidelinesCard
                title={`Target keywords · ${targetKeywords.length}`}
                icon={Tag}
                className="col-span-full"
              >
                <EditablePillRow
                  items={targetKeywords}
                  onChange={setTargetKeywords}
                  addPlaceholder="New keyword"
                />
              </GuidelinesCard>
            </>
          )}

          <CompetitorsCard items={competitors} onChange={setCompetitors} />
        </div>

        {/* Primary CTA */}
        <Button
          onClick={onStart}
          size="lg"
          className="w-full mt-4 gap-2 h-12 text-[15px] font-semibold"
        >
          <Sparkles className="h-4 w-4" />
          Start Creating
        </Button>

        {/* Secondary action — single link to "start over with a different brand/category". */}
        <div className="flex justify-center text-[12px]">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            {editInputsLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
