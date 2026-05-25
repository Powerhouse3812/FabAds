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
  { initial: "A", name: "Aritzia", desc: "Ad creatives · Visual style" },
  { initial: "E", name: "Everlane", desc: "Messaging · Social posts" },
  { initial: "U", name: "Uniqlo", desc: "Promotions · Pricing" },
  { initial: "C", name: "COS", desc: "Visual style · Product launches" },
];

const AFFILIATE_COMPETITORS_INIT: Competitor[] = [
  { initial: "P", name: "Progressive", desc: "Ad creatives · Messaging" },
  { initial: "G", name: "GEICO", desc: "Video ads · Humor" },
  { initial: "L", name: "Lemonade", desc: "Social posts · UGC" },
  { initial: "S", name: "State Farm", desc: "Brand ads" },
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
  typography_display: "Geist",
  typography_body: "Geist Mono",
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
        "rounded-xl border border-border/40 bg-card/60 p-3 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" aria-hidden />
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

/* ── Editable competitors card (compact, fits inside one column) ── */
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
    >
      {adding && (
        <div className="mb-2">
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
            className="w-full h-7 rounded-md border border-primary/60 bg-background px-2.5 text-[12px] outline-none focus:ring-2 focus:ring-primary/60"
            aria-label="New competitor name"
          />
        </div>
      )}

      <div className="space-y-1.5">
        {items.map((c, i) => (
          <div
            key={`${c.name}-${i}`}
            className="rounded-lg border border-border/40 bg-background/50 px-2 py-1.5 flex items-center gap-2"
          >
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground shrink-0">
              {c.initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] leading-tight">
                <EditableText
                  value={c.name}
                  onChange={(next) => updateName(i, next)}
                  ariaLabel={`Edit ${c.name} name`}
                />
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight truncate">
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
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {!adding && (
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-[11px] h-6 px-2"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3 w-3" />
            Add
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

  const [competitors, setCompetitors] = useState<Competitor[]>(
    isEcom ? ECOM_COMPETITORS_INIT : AFFILIATE_COMPETITORS_INIT,
  );

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
      {/* Slim lime celebration band */}
      <div className="h-1.5 bg-primary border-b border-border" />

      <StepNav
        active={4}
        mode={mode}
        onBack={onBack}
        backLabel="Back to Input"
        onRestart={onRestart}
      />

      <div className="max-w-[680px] mx-auto px-5 pt-1 pb-5 space-y-3">
        {/* Done header — compact */}
        <div className="text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-4 w-4" strokeWidth={3} />
          </div>
          <h1 className="text-[20px] font-semibold tracking-tight mt-2">
            {isEcom ? "Brand" : "Category"}{" "}
            <span className="bg-primary/30 px-1.5 rounded">Ready!</span>
          </h1>
          <p className="text-[11px] text-muted-foreground mt-1">
            {isEcom
              ? "Analyzed and ready. Click any value to edit."
              : "Analyzed and ready. Click any value to edit."}
          </p>
        </div>

        {/* HERO CARD — full width, compact */}
        {isEcom ? (
          <div className="rounded-2xl border border-border/40 bg-card/60 p-3.5 backdrop-blur-sm space-y-2.5">
            <div className="flex items-start gap-3">
              <div
                className="h-12 w-12 rounded-xl border border-border/40 bg-primary/15 inline-flex items-center justify-center text-foreground font-mono text-[14px] font-bold shrink-0"
                aria-label={`${brandName} logo`}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <h2 className="text-[16px] font-bold text-foreground leading-tight">
                  <EditableText
                    value={brandName}
                    onChange={setBrandName}
                    ariaLabel="Edit brand name"
                  />
                </h2>
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
            <div className="text-[12px] leading-relaxed text-foreground">
              <EditableText
                value={brandDescription}
                onChange={setBrandDescription}
                multiline
                ariaLabel="Edit brand description"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/40 bg-card/60 p-3.5 backdrop-blur-sm space-y-2.5">
            <div className="flex items-start gap-3">
              <div
                className="h-12 w-12 rounded-xl border border-border/40 bg-primary/15 inline-flex items-center justify-center text-foreground shrink-0"
                aria-hidden
              >
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="text-[16px] font-bold text-foreground leading-tight">
                  <EditableText
                    value={categoryValue}
                    onChange={setCategoryValue}
                    ariaLabel="Edit category"
                  />
                </h2>
                <div className="inline-flex items-center gap-1.5">
                  <span className="rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Affiliate
                  </span>
                  <span className="text-muted-foreground/40 text-[10px]">·</span>
                  <span className="rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-foreground">
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
            <div className="text-[12px] leading-relaxed text-foreground">
              <EditableText
                value={categoryDescription}
                onChange={setCategoryDescription}
                multiline
                ariaLabel="Edit category description"
              />
            </div>
          </div>
        )}

        {/* 2-COL DETAIL GRID — fits in modal viewport without scroll */}
        <div className="grid grid-cols-2 gap-2.5">
          {isEcom ? (
            <>
              {/* LEFT — voice + typography + colors */}
              <div className="space-y-2.5">
                <GuidelinesCard title="Brand voice" icon={Sparkles}>
                  <div className="text-[12px] leading-snug text-foreground">
                    <EditableText
                      value={brandVoice}
                      onChange={setBrandVoice}
                      ariaLabel="Edit brand voice"
                    />
                  </div>
                </GuidelinesCard>

                <GuidelinesCard title="Typography" icon={TypeIcon}>
                  <div className="space-y-1.5">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        Display
                      </p>
                      <div
                        className="text-[14px] font-semibold text-foreground leading-tight"
                        style={{
                          fontFamily: `'${typographyDisplay}', system-ui, sans-serif`,
                        }}
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
                        className="text-[12px] text-foreground leading-tight"
                        style={{
                          fontFamily: `'${typographyBody}', system-ui, sans-serif`,
                        }}
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

                <GuidelinesCard title="Colors" icon={Palette}>
                  <EditableColorRow
                    items={brandColors}
                    onChange={setBrandColors}
                  />
                </GuidelinesCard>
              </div>

              {/* RIGHT — audiences + competitors */}
              <div className="space-y-2.5">
                <GuidelinesCard title="Target audiences" icon={Users}>
                  <div className="text-[12px] leading-snug text-foreground">
                    <EditableText
                      value={targetAudiences}
                      onChange={setTargetAudiences}
                      ariaLabel="Edit target audiences"
                    />
                  </div>
                </GuidelinesCard>

                <CompetitorsCard
                  items={competitors}
                  onChange={setCompetitors}
                />
              </div>
            </>
          ) : (
            <>
              {/* LEFT — target audience + suggested angles */}
              <div className="space-y-2.5">
                <GuidelinesCard title="Target audience" icon={Users}>
                  <div className="text-[12px] leading-snug text-foreground">
                    <EditableText
                      value={targetAudience}
                      onChange={setTargetAudience}
                      ariaLabel="Edit target audience"
                    />
                  </div>
                </GuidelinesCard>

                <GuidelinesCard
                  title={`Angles · ${suggestedAngles.length}`}
                  icon={Sparkles}
                >
                  <EditablePillRow
                    items={suggestedAngles}
                    onChange={setSuggestedAngles}
                    addPlaceholder="Angle"
                  />
                </GuidelinesCard>
              </div>

              {/* RIGHT — keywords + competitors */}
              <div className="space-y-2.5">
                <GuidelinesCard
                  title={`Keywords · ${targetKeywords.length}`}
                  icon={Tag}
                >
                  <EditablePillRow
                    items={targetKeywords}
                    onChange={setTargetKeywords}
                    addPlaceholder="Keyword"
                  />
                </GuidelinesCard>

                <CompetitorsCard
                  items={competitors}
                  onChange={setCompetitors}
                />
              </div>
            </>
          )}
        </div>

        {/* Primary CTA */}
        <Button
          onClick={onStart}
          size="lg"
          className="w-full mt-3 gap-2 h-10 text-[14px] font-semibold"
        >
          <Sparkles className="h-4 w-4" />
          Start Creating
        </Button>

        {/* Secondary action */}
        <div className="flex justify-center text-[11px]">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            <Pencil className="h-3 w-3" />
            {editInputsLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
