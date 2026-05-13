import { useEffect, useState } from "react";
import { Check, Sparkles, Plus, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepNav } from "../components/StepNav";
import { EditableText } from "../components/EditableText";
import { EditablePillRow } from "../components/EditablePillRow";
import {
  EditableColorRow,
  type BrandColor,
} from "../components/EditableColorRow";

interface DoneProps {
  mode: "ecom" | "affiliate";
  brandUrl?: string;
  category?: string;
  onBack: () => void;
  onStart: () => void;
  onRestart: () => void;
}

/* ── Sample / default values ── */

const ECOM_COMPETITORS_INIT = [
  { initial: "A", name: "Aritzia", desc: "Apparel · Tracking: Ad creatives, Visual style" },
  { initial: "E", name: "Everlane", desc: "Apparel · Tracking: Messaging, Social posts" },
  { initial: "U", name: "Uniqlo", desc: "Apparel · Tracking: Promotions, Pricing" },
  { initial: "C", name: "COS", desc: "Apparel · Tracking: Visual style, Product launches" },
];

const AFFILIATE_COMPETITORS_INIT = [
  { initial: "P", name: "Progressive", desc: "Insurance · Tracking: Ad creatives, Messaging" },
  { initial: "G", name: "GEICO", desc: "Insurance · Tracking: Video ads, Humor" },
  { initial: "L", name: "Lemonade", desc: "Insurance · Tracking: Social posts, UGC" },
  { initial: "S", name: "State Farm", desc: "Insurance · Tracking: Brand ads" },
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
  typography: "Inter · Inter Mono",
  target_audiences: "25–40, Urban · Style-forward",
};

const AFFILIATE_DEFAULTS = {
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

/* ── Field row ── */
function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-1 items-baseline">
      <p className="text-[11px] font-mono text-muted-foreground tabular-nums shrink-0">
        {label}:
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ── Editable competitors card ── */

interface Competitor {
  initial: string;
  name: string;
  desc: string;
}

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
    <div className="rounded-2xl border border-border bg-card p-5 mt-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[11px] font-mono text-muted-foreground">
          competitors:
        </p>
        {!adding && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-[12px] h-7"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3 w-3" />
            Add competitor
          </Button>
        )}
      </div>

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
            className="rounded-xl border border-border bg-background px-3 py-2.5 flex items-center gap-3"
          >
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[13px] font-semibold text-foreground shrink-0">
              {c.initial}
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <EditableText
                value={c.name}
                onChange={(next) => updateName(i, next)}
                ariaLabel={`Edit ${c.name} name`}
              />
              <div className="text-[11px] text-muted-foreground truncate">
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

  // E-com state
  const [brandName, setBrandName] = useState(brandNameFromHost(brandHost));
  const [brandDescription, setBrandDescription] = useState(
    ECOM_DEFAULTS.brand_description,
  );
  const [brandVoice, setBrandVoice] = useState(ECOM_DEFAULTS.brand_voice);
  const [brandLogoUrl, setBrandLogoUrl] = useState(`${brandHost}/logo.svg`);
  const [brandUrlValue, setBrandUrlValue] = useState(brandHost);
  const [brandColors, setBrandColors] = useState<BrandColor[]>(BRAND_COLORS_INIT);
  const [typography, setTypography] = useState(ECOM_DEFAULTS.typography);
  const [targetAudiences, setTargetAudiences] = useState(
    ECOM_DEFAULTS.target_audiences,
  );

  // Affiliate state
  const [categoryValue, setCategoryValue] = useState(category ?? "Auto Insurance");
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

  // If the user navigates back to the input and re-runs with a new brand URL
  // or category, reset the editable fields so they reflect the fresh analysis.
  useEffect(() => {
    if (isEcom) {
      setBrandName(brandNameFromHost(brandHost));
      setBrandLogoUrl(`${brandHost}/logo.svg`);
      setBrandUrlValue(brandHost);
    } else {
      setCategoryValue(category ?? "Auto Insurance");
    }
    // We intentionally do NOT reset the descriptive fields (brand_voice,
    // brand_description, etc.) since they come from "AI analysis" that
    // would re-run — but for demo simplicity they stay stable. Edit if
    // needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandHost, category, isEcom]);

  const editInputsLabel = isEcom
    ? "Start over with a different brand"
    : "Start over with a different category";

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
          <p className="text-[11px] text-muted-foreground/70 mt-2">
            Click any value to edit.
          </p>
        </div>

        {/* Summary card — editable per-field */}
        <div className="rounded-2xl border border-border bg-card p-5 mt-6 space-y-3">
          {isEcom ? (
            <>
              <FieldRow label="brand_name">
                <EditableText
                  value={brandName}
                  onChange={setBrandName}
                  ariaLabel="Edit brand name"
                />
              </FieldRow>
              <FieldRow label="brand_description">
                <EditableText
                  value={brandDescription}
                  onChange={setBrandDescription}
                  multiline
                  ariaLabel="Edit brand description"
                />
              </FieldRow>
              <FieldRow label="brand_voice">
                <EditableText
                  value={brandVoice}
                  onChange={setBrandVoice}
                  ariaLabel="Edit brand voice"
                />
              </FieldRow>
              <FieldRow label="brand_logo_url">
                <EditableText
                  value={brandLogoUrl}
                  onChange={setBrandLogoUrl}
                  mono
                  ariaLabel="Edit brand logo URL"
                />
              </FieldRow>
              <FieldRow label="brand_url">
                <EditableText
                  value={brandUrlValue}
                  onChange={setBrandUrlValue}
                  mono
                  ariaLabel="Edit brand URL"
                />
              </FieldRow>
              <FieldRow label="brand_colors">
                <EditableColorRow
                  items={brandColors}
                  onChange={setBrandColors}
                />
              </FieldRow>
              <FieldRow label="typography">
                <EditableText
                  value={typography}
                  onChange={setTypography}
                  mono
                  ariaLabel="Edit typography"
                />
              </FieldRow>
              <FieldRow label="target_audiences">
                <EditableText
                  value={targetAudiences}
                  onChange={setTargetAudiences}
                  ariaLabel="Edit target audiences"
                />
              </FieldRow>
            </>
          ) : (
            <>
              <FieldRow label="category">
                <EditableText
                  value={categoryValue}
                  onChange={setCategoryValue}
                  ariaLabel="Edit category"
                />
              </FieldRow>
              <FieldRow label="category_description">
                <EditableText
                  value={categoryDescription}
                  onChange={setCategoryDescription}
                  multiline
                  ariaLabel="Edit category description"
                />
              </FieldRow>
              <FieldRow label="target_audience">
                <EditableText
                  value={targetAudience}
                  onChange={setTargetAudience}
                  ariaLabel="Edit target audience"
                />
              </FieldRow>
              <FieldRow label="suggested_angles">
                <EditablePillRow
                  items={suggestedAngles}
                  onChange={setSuggestedAngles}
                  addPlaceholder="New angle"
                />
              </FieldRow>
              <FieldRow label="target_keywords">
                <EditablePillRow
                  items={targetKeywords}
                  onChange={setTargetKeywords}
                  addPlaceholder="New keyword"
                />
              </FieldRow>
            </>
          )}
        </div>

        <CompetitorsCard items={competitors} onChange={setCompetitors} />

        {/* Primary CTA */}
        <Button
          onClick={onStart}
          size="lg"
          className="w-full mt-6 gap-2 h-12 text-[15px] font-semibold"
        >
          <Sparkles className="h-4 w-4" />
          Start Creating
        </Button>

        {/* Secondary action — single link to "start over with a different
            brand/category". Re-analyze button removed per Maalik. */}
        <div className="flex justify-center mt-3.5 text-[12px]">
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
